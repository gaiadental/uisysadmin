// @vitest-environment jsdom
import { StrictMode, useState, type ReactNode } from "react"
import {
  CancelledError,
  QueryClientProvider,
  type QueryClient,
} from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LOGIN_PATH, RouteGuard, type RouteAccess } from "@/app/guards/route-guard"
import { DialogsProvider } from "@/components/dialogs/dialogs"
import {
  clearPendingAuthNotice,
  peekPendingAuthNotice,
} from "@/features/auth/auth-notice"
import { TenantCategoryListPage } from "@/features/catalog/tenant-categories/tenant-category-list-page"
import { GENERIC_READ_MESSAGE } from "@/features/tenants/shared/failure"
import { ApiError } from "@/lib/api/errors"
import { endSession, getAccessToken, setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"
import { API, FIXTURE_ME, TEST_ACCESS_TOKEN } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { AuthProvider, useAuth } from "./auth-provider"

// Records the reason of every call that reaches the registered logout handler.
// refresh.ts calls its own endSession, so the spy below cannot see those calls.
const handlerCalls = vi.hoisted(() => [] as (string | undefined)[])

// Holds every error the kept-session change rejects with, as the Probe sees it.
const keepRejections: unknown[] = []

// Wraps the real endSession, so a test can count the calls the provider makes.
// Each call reaches the logout handler once (refresh.ts endSession).
vi.mock("@/lib/api/refresh", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/refresh")>()
  return {
    ...actual,
    endSession: vi.fn(actual.endSession),
    setLogoutHandler: (
      handler: Parameters<typeof actual.setLogoutHandler>[0]
    ) =>
      actual.setLogoutHandler(
        handler === null
          ? null
          : (reason) => {
              handlerCalls.push(reason)
              handler(reason)
            }
      ),
  }
})

const endSessionSpy = vi.mocked(endSession)

const BASE_URL = "http://sp.test"
const CREDENTIALS = {
  loginId: "principal@example.com",
  password: "secret-pass",
}

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  clearPendingAuthNotice()
  handlerCalls.length = 0
  keepRejections.length = 0
  queryClient = createQueryClient()
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  clearPendingAuthNotice()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function errorCode(error: unknown): string {
  return error instanceof ApiError ? error.code : "unknown"
}

/** A minimal consumer that shows the view state and drives the actions. */
function Probe() {
  const auth = useAuth()
  // Holds the code of a rejected kept-session change, so a test can see it.
  const [keepError, setKeepError] = useState<string | null>(null)
  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="login-id">{auth.me?.loginId ?? "none"}</p>
      <button type="button" onClick={() => void auth.login(CREDENTIALS)}>
        log in
      </button>
      <button type="button" onClick={() => void auth.logout()}>
        log out
      </button>
      <button type="button" onClick={auth.retryBoot}>
        retry
      </button>
      <button
        type="button"
        onClick={() =>
          void auth
            .completePasswordChange({
              kind: "SESSION_KEPT",
              accessToken: "rotated-token",
            })
            .catch((error: unknown) => {
              keepRejections.push(error)
              setKeepError(errorCode(error))
            })
        }
      >
        keep session
      </button>
      <p data-testid="keep-error">{keepError ?? "none"}</p>
      <button
        type="button"
        onClick={() =>
          void auth.completePasswordChange({ kind: "PASSWORD_CHANGED" })
        }
      >
        end sessions
      </button>
    </div>
  )
}

function renderProvider({
  strict = false,
}: { readonly strict?: boolean } = {}) {
  const tree: ReactNode = (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>
  )
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

function statusText(): string | null {
  return screen.getByTestId("status").textContent
}

function keepErrorText(): string | null {
  return screen.getByTestId("keep-error").textContent
}

/**
 * Lets the BroadcastChannel deliver any message that is still queued. Used
 * before an "exactly once" check, so a late second message would fail it.
 */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20))
}

/**
 * The provider logs nothing. The transport logs each rejected call once as
 * "[api]" (D18), and that label is the only console.error allowed. No logged
 * argument may be the CancelledError from the logout cache clear.
 */
function expectOnlyTransportErrorLog() {
  const calls = vi.mocked(console.error).mock.calls
  expect(calls.map((args) => args[0])).toEqual(["[api]"])
  expect(calls.flat().some((arg) => arg instanceof CancelledError)).toBe(false)
}

/** Counts calls to one endpoint. Used to prove how often a request is sent. */
function countCalls(
  method: "get" | "post" | "delete",
  path: string,
  body?: () => Response
) {
  let calls = 0
  const resolver = () => {
    calls += 1
    return body
      ? body()
      : HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
  }
  server.use(http[method](`${API}${path}`, resolver))
  return () => calls
}

function sessionEndedRefresh() {
  server.use(
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json(
        {
          code: "SESSION_ENDED",
          message: "Session ended. Please log in again.",
        },
        { status: 401 }
      )
    )
  )
}

/** Every refresh gets the real answer for an ended session (POST /api/v1/auth/refresh). */
function sessionTerminatedRefresh() {
  server.use(
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json(
        {
          code: "SESSION_TERMINATED",
          message: "Session terminated. Please log in again.",
        },
        { status: 401 }
      )
    )
  )
}

/**
 * The boot refresh succeeds. Each later refresh gets 401 SESSION_TERMINATED.
 * Returns the number of refresh calls made so far.
 */
function sessionTerminatedRefreshAfterBoot(): () => number {
  let calls = 0
  server.use(
    http.post(`${API}/auth/refresh`, () => {
      calls += 1
      if (calls === 1) {
        return HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
      }
      return HttpResponse.json(
        {
          code: "SESSION_TERMINATED",
          message: "Session terminated. Please log in again.",
        },
        { status: 401 }
      )
    })
  )
  return () => calls
}

describe("boot (D4.2)", () => {
  it("is authenticated after refresh and me, and caches me under auth.me", async () => {
    renderProvider()

    await waitFor(() => expect(statusText()).toBe("authenticated"))
    expect(screen.getByTestId("login-id")).toHaveTextContent(FIXTURE_ME.loginId)
    expect(queryClient.getQueryData(queryKeys.auth.me())).toMatchObject({
      loginId: FIXTURE_ME.loginId,
    })
    expect(getAccessToken()).toBe(TEST_ACCESS_TOKEN)
  })

  it("requires a password change when me reports pwdChangeRequired", async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ data: { ...FIXTURE_ME, pwdChangeRequired: true } })
      )
    )

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("passwordChangeRequired"))
  })

  it("sends one refresh under StrictMode, because both effect runs share it (D4.3)", async () => {
    const refreshCalls = countCalls("post", "/auth/refresh")

    renderProvider({ strict: true })

    await waitFor(() => expect(statusText()).toBe("authenticated"))
    expect(refreshCalls()).toBe(1)
  })

  it("is anonymous when the session has ended, without an error screen", async () => {
    sessionEndedRefresh()

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    expect(getAccessToken()).toBeNull()
  })

  it("is in error on a server failure, and retry recovers the session", async () => {
    server.use(
      http.post(
        `${API}/auth/refresh`,
        () =>
          HttpResponse.json(
            { code: "SERVICE_UNAVAILABLE", message: "Service unavailable." },
            { status: 503 }
          ),
        { once: true }
      )
    )

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("error"))
    expect(getAccessToken()).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "retry" }))

    await waitFor(() => expect(statusText()).toBe("authenticated"))
  })
})

describe("login (D4.5)", () => {
  it("sends loginId and password only, then reaches authenticated", async () => {
    sessionEndedRefresh()
    let sentBody: unknown
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
      })
    )

    renderProvider()
    await waitFor(() => expect(statusText()).toBe("anonymous"))

    fireEvent.click(screen.getByRole("button", { name: "log in" }))

    await waitFor(() => expect(statusText()).toBe("authenticated"))
    expect(sentBody).toEqual(CREDENTIALS)
    expect(getAccessToken()).toBe(TEST_ACCESS_TOKEN)
  })
})

describe("password change outcomes (D4.6)", () => {
  it("a kept session takes the rotated token and reloads me, which opens the app", async () => {
    let pwdChangeRequired = true
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ data: { ...FIXTURE_ME, pwdChangeRequired } })
      )
    )
    renderProvider()
    await waitFor(() => expect(statusText()).toBe("passwordChangeRequired"))

    pwdChangeRequired = false
    fireEvent.click(screen.getByRole("button", { name: "keep session" }))

    await waitFor(() => expect(statusText()).toBe("authenticated"))
    expect(getAccessToken()).toBe("rotated-token")
  })

  it("an ended session clears the token, the cache and the view, without a logout call", async () => {
    const logoutCalls = countCalls("post", "/auth/logout", () =>
      HttpResponse.json({ data: { status: "LOGGED_OUT" } })
    )
    renderProvider()
    await waitFor(() => expect(statusText()).toBe("authenticated"))

    fireEvent.click(screen.getByRole("button", { name: "end sessions" }))

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    expect(getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(queryKeys.auth.me())).toBeUndefined()
    expect(logoutCalls()).toBe(0)
  })
})

describe("logout (D4.8)", () => {
  it("calls the server, then clears the token, the cache and the view", async () => {
    const logoutCalls = countCalls("post", "/auth/logout", () =>
      HttpResponse.json({ data: { status: "LOGGED_OUT" } })
    )
    renderProvider()
    await waitFor(() => expect(statusText()).toBe("authenticated"))

    fireEvent.click(screen.getByRole("button", { name: "log out" }))

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    expect(logoutCalls()).toBe(1)
    expect(getAccessToken()).toBeNull()
    expect(queryClient.getQueryData(queryKeys.auth.me())).toBeUndefined()
  })

  it("still ends the local session when the server call fails", async () => {
    server.use(
      http.post(`${API}/auth/logout`, () =>
        HttpResponse.json(
          { code: "INTERNAL_ERROR", message: "Internal error." },
          { status: 500 }
        )
      )
    )
    renderProvider()
    await waitFor(() => expect(statusText()).toBe("authenticated"))

    fireEvent.click(screen.getByRole("button", { name: "log out" }))

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    expect(getAccessToken()).toBeNull()
  })

  it("ends this session when another tab announces a logout (sp-session)", async () => {
    renderProvider()
    await waitFor(() => expect(statusText()).toBe("authenticated"))

    const otherTab = new BroadcastChannel("sp-session")
    otherTab.postMessage({ type: "logout" })

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    expect(getAccessToken()).toBeNull()
    otherTab.close()
  })

  it("GATE-11: logout is reachable while passwordChangeRequired is true", async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ data: { ...FIXTURE_ME, pwdChangeRequired: true } })
      )
    )
    const logoutCalls = countCalls("post", "/auth/logout", () =>
      HttpResponse.json({ data: { status: "LOGGED_OUT" } })
    )
    const announcements: unknown[] = []
    const observer = new BroadcastChannel("sp-session")
    observer.onmessage = (event: MessageEvent<unknown>) => {
      announcements.push(event.data)
    }

    try {
      renderProvider()
      await waitFor(() => expect(statusText()).toBe("passwordChangeRequired"))

      fireEvent.click(screen.getByRole("button", { name: "log out" }))

      await waitFor(() => expect(statusText()).toBe("anonymous"))
      expect(logoutCalls()).toBe(1)
      expect(getAccessToken()).toBeNull()
      await waitFor(() => expect(announcements).toEqual([{ type: "logout" }]))
    } finally {
      observer.close()
    }
  })
})

/** Answers the refresh call with an error body and the given status. */
function refreshRefusal(status: number, code: string) {
  server.use(
    http.post(`${API}/auth/refresh`, () =>
      HttpResponse.json({ code, message: "Server text." }, { status })
    )
  )
}

/** Answers `GET /auth/me` with an error body and the given status. */
function meRefusal(status: number, code: string) {
  server.use(
    http.get(`${API}/auth/me`, () =>
      HttpResponse.json({ code, message: "Server text." }, { status })
    )
  )
}

/**
 * Boot `me` asks for a password change. Each later `me` call gets the refusal.
 * Returns the Authorization header of every `me` call, in order.
 */
function meRefusalAfterBoot(status: number, code: string) {
  const sentAuthorization: (string | null)[] = []
  let calls = 0
  server.use(
    http.get(`${API}/auth/me`, ({ request }) => {
      calls += 1
      sentAuthorization.push(request.headers.get("Authorization"))
      if (calls === 1) {
        return HttpResponse.json({
          data: { ...FIXTURE_ME, pwdChangeRequired: true },
        })
      }
      return HttpResponse.json({ code, message: "Server text." }, { status })
    })
  )
  return sentAuthorization
}

/**
 * The boot refresh succeeds. Each later refresh gets the refusal. Used when the
 * boot refresh must pass and a refresh inside a later call must fail.
 */
function refreshRefusalAfterBoot(status: number, code: string) {
  let calls = 0
  server.use(
    http.post(`${API}/auth/refresh`, () => {
      calls += 1
      if (calls === 1) {
        return HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
      }
      return HttpResponse.json({ code, message: "Server text." }, { status })
    })
  )
}

/**
 * The boot `me` call gets a 401 once, so the client refreshes. Later `me` calls
 * use the default handler.
 */
function meExpiredOnce() {
  server.use(
    http.get(
      `${API}/auth/me`,
      () =>
        HttpResponse.json(
          { code: "INVALID_TOKEN", message: "Server text." },
          { status: 401 }
        ),
      { once: true }
    )
  )
}

/** Records the logout announcements this tab sends on sp-session. */
function recordAnnouncements() {
  const announcements: unknown[] = []
  const observer = new BroadcastChannel("sp-session")
  observer.onmessage = (event: MessageEvent<unknown>) => {
    announcements.push(event.data)
  }
  return { announcements, close: () => observer.close() }
}

describe("account states at boot (D4.2, REQ-FE-055)", () => {
  it("a refresh 403 ACCOUNT_NOT_ACTIVE is anonymous with the notice, not error, and ends the session once", async () => {
    refreshRefusal(403, "ACCOUNT_NOT_ACTIVE")
    const { announcements, close } = recordAnnouncements()
    try {
      renderProvider()

      await waitFor(() => expect(statusText()).toBe("anonymous"))
      await waitFor(() => expect(announcements).toHaveLength(1))
      expect(announcements).toEqual([{ type: "logout" }])
      expect(getAccessToken()).toBeNull()
      expect(peekPendingAuthNotice()).toBe("accountNotActive")
    } finally {
      close()
    }
  })

  it("a refresh 403 ACCOUNT_NOT_READY is anonymous with the ACCOUNT_NOT_READY notice, not error", async () => {
    refreshRefusal(403, "ACCOUNT_NOT_READY")

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    expect(getAccessToken()).toBeNull()
    expect(peekPendingAuthNotice()).toBe("accountNotReady")
  })

  it("a me 403 ACCOUNT_NOT_ACTIVE clears the token, is anonymous with the notice, and ends the session once", async () => {
    meRefusal(403, "ACCOUNT_NOT_ACTIVE")
    const refreshCalls = countCalls("post", "/auth/refresh")
    const { announcements, close } = recordAnnouncements()
    try {
      renderProvider()

      await waitFor(() => expect(statusText()).toBe("anonymous"))
      await waitFor(() => expect(announcements).toHaveLength(1))
      expect(announcements).toEqual([{ type: "logout" }])
      expect(getAccessToken()).toBeNull()
      expect(queryClient.getQueryData(queryKeys.auth.me())).toBeUndefined()
      expect(peekPendingAuthNotice()).toBe("accountNotActive")
      expect(refreshCalls()).toBe(1)
    } finally {
      close()
    }
  })

  it("under StrictMode a me 403 ACCOUNT_NOT_ACTIVE ends the session once: one handler call, one announcement", async () => {
    meRefusal(403, "ACCOUNT_NOT_ACTIVE")
    endSessionSpy.mockClear()
    const { announcements, close } = recordAnnouncements()
    try {
      renderProvider({ strict: true })

      await waitFor(() => expect(statusText()).toBe("anonymous"))
      await waitFor(() => expect(announcements).toHaveLength(1))
      expect(announcements).toEqual([{ type: "logout" }])
      expect(endSessionSpy).toHaveBeenCalledTimes(1)
      expect(endSessionSpy).toHaveBeenCalledWith("accountNotActive")
      expect(getAccessToken()).toBeNull()
      expect(peekPendingAuthNotice()).toBe("accountNotActive")
    } finally {
      close()
    }
  })

  it("a me 403 ACCOUNT_NOT_READY clears the token and is anonymous with the ACCOUNT_NOT_READY notice", async () => {
    meRefusal(403, "ACCOUNT_NOT_READY")

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    expect(getAccessToken()).toBeNull()
    expect(peekPendingAuthNotice()).toBe("accountNotReady")
  })

  it("a refresh 403 with another code keeps the existing outcome, error, with no notice", async () => {
    refreshRefusal(403, "PASSWORD_CHANGE_REQUIRED")

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("error"))
    expect(peekPendingAuthNotice()).toBeNull()
  })

  it("a me 403 with another code keeps the existing outcome, error, with no notice", async () => {
    meRefusal(403, "FORBIDDEN")

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("error"))
    expect(peekPendingAuthNotice()).toBeNull()
  })

  it.each([
    ["ACCOUNT_NOT_ACTIVE", "accountNotActive"],
    ["ACCOUNT_NOT_READY", "accountNotReady"],
  ] as const)(
    "a boot me 401 then a refresh 403 %s is anonymous with the notice, not error, though the cancelled me rejects (REQ-FE-055)",
    async (code, notice) => {
      meExpiredOnce()
      refreshRefusalAfterBoot(403, code)
      const { announcements, close } = recordAnnouncements()
      try {
        renderProvider()

        await waitFor(() => expect(announcements).toHaveLength(1))
        // Lets the cancelled `me` settle, so the final view is what is checked.
        await settle()
        expect(statusText()).toBe("anonymous")
        expect(announcements).toEqual([{ type: "logout" }])
        expect(handlerCalls).toEqual([notice])
        expect(getAccessToken()).toBeNull()
        expect(peekPendingAuthNotice()).toBe(notice)
      } finally {
        close()
      }
    }
  )

  it("a boot CancelledError with no session end keeps the error view, with no notice", async () => {
    // The boot `me` is cancelled while it is in flight. Nothing ends the session:
    // the boot refresh passes and endSession never runs. The rejection is a
    // CancelledError, and with no session end the boot view stays the error screen.
    let startMe: () => void = () => undefined
    const meStarted = new Promise<void>((resolve) => {
      startMe = resolve
    })
    let finishMe: () => void = () => undefined
    const meFinished = new Promise<void>((resolve) => {
      finishMe = resolve
    })
    server.use(
      http.get(`${API}/auth/me`, async () => {
        startMe()
        await meFinished
        return HttpResponse.json({ data: FIXTURE_ME })
      })
    )

    try {
      renderProvider()
      await meStarted
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.me() })

      await waitFor(() => expect(statusText()).toBe("error"))
      await settle()
      expect(statusText()).toBe("error")
      expect(handlerCalls).toEqual([])
      expect(getAccessToken()).toBe(TEST_ACCESS_TOKEN)
      expect(peekPendingAuthNotice()).toBeNull()
    } finally {
      finishMe()
    }
  })
})

describe("kept-session password change reloads me (D4.6, REQ-FE-055)", () => {
  it("a me 403 ACCOUNT_NOT_ACTIVE ends the session, shows the notice, rejects and announces once", async () => {
    const sentAuthorization = meRefusalAfterBoot(403, "ACCOUNT_NOT_ACTIVE")
    const { announcements, close } = recordAnnouncements()
    try {
      renderProvider()
      await waitFor(() => expect(statusText()).toBe("passwordChangeRequired"))

      fireEvent.click(screen.getByRole("button", { name: "keep session" }))

      await waitFor(() => expect(keepErrorText()).toBe("ACCOUNT_NOT_ACTIVE"))
      await waitFor(() => expect(statusText()).toBe("anonymous"))
      expect(sentAuthorization[1]).toBe("Bearer rotated-token")
      expect(getAccessToken()).toBeNull()
      expect(queryClient.getQueryData(queryKeys.auth.me())).toBeUndefined()
      expect(peekPendingAuthNotice()).toBe("accountNotActive")
      await waitFor(() => expect(announcements).toHaveLength(1))
      expect(announcements).toEqual([{ type: "logout" }])
    } finally {
      close()
    }
  })

  it("a me 403 ACCOUNT_NOT_READY ends the session with the ACCOUNT_NOT_READY notice, rejects and announces once", async () => {
    meRefusalAfterBoot(403, "ACCOUNT_NOT_READY")
    const { announcements, close } = recordAnnouncements()
    try {
      renderProvider()
      await waitFor(() => expect(statusText()).toBe("passwordChangeRequired"))

      fireEvent.click(screen.getByRole("button", { name: "keep session" }))

      await waitFor(() => expect(keepErrorText()).toBe("ACCOUNT_NOT_READY"))
      await waitFor(() => expect(statusText()).toBe("anonymous"))
      expect(getAccessToken()).toBeNull()
      expect(peekPendingAuthNotice()).toBe("accountNotReady")
      await waitFor(() => expect(announcements).toHaveLength(1))
      expect(announcements).toEqual([{ type: "logout" }])
    } finally {
      close()
    }
  })

  it("a me 401 then a refresh 403 ACCOUNT_NOT_ACTIVE after a kept session ends the session once: one handler call, one announcement, rejects", async () => {
    refreshRefusalAfterBoot(403, "ACCOUNT_NOT_ACTIVE")
    const sentAuthorization = meRefusalAfterBoot(401, "INVALID_TOKEN")
    const { announcements, close } = recordAnnouncements()
    try {
      renderProvider()
      await waitFor(() => expect(statusText()).toBe("passwordChangeRequired"))

      fireEvent.click(screen.getByRole("button", { name: "keep session" }))

      // The logout cache clear cancels the in-flight `me` fetch, so the
      // rejection is a CancelledError, not the account code. The page still stops.
      await waitFor(() => expect(keepErrorText()).not.toBe("none"))
      await waitFor(() => expect(statusText()).toBe("anonymous"))
      expect(sentAuthorization[1]).toBe("Bearer rotated-token")
      expect(handlerCalls).toEqual(["accountNotActive"])
      expect(getAccessToken()).toBeNull()
      expect(queryClient.getQueryData(queryKeys.auth.me())).toBeUndefined()
      expect(peekPendingAuthNotice()).toBe("accountNotActive")
      await waitFor(() => expect(announcements).toHaveLength(1))
      await settle()
      expect(announcements).toEqual([{ type: "logout" }])
      // The rejection is the cancel of the in-flight `me` fetch, not the account
      // code. The error is not surfaced to the user (the notice is the outcome).
      expect(keepRejections).toHaveLength(1)
      expect(keepRejections[0]).toBeInstanceOf(CancelledError)
      expect(keepRejections[0]).not.toBeInstanceOf(ApiError)
      expect(keepErrorText()).not.toBe("ACCOUNT_NOT_ACTIVE")
      expectOnlyTransportErrorLog()
    } finally {
      close()
    }
  })

  it("a direct me 403 ACCOUNT_NOT_ACTIVE after a kept session, with no 401 first, is guarded: one handler call, one announcement, rejects with the account code", async () => {
    // Only the boot refresh runs. No 401 happens, so no refresh runs after the
    // rotated token. The guard in refreshMe is the only path that ends the session.
    const refreshCalls = countCalls("post", "/auth/refresh")
    const sentAuthorization = meRefusalAfterBoot(403, "ACCOUNT_NOT_ACTIVE")
    const { announcements, close } = recordAnnouncements()
    endSessionSpy.mockClear()
    try {
      renderProvider()
      await waitFor(() => expect(statusText()).toBe("passwordChangeRequired"))
      expect(refreshCalls()).toBe(1)

      fireEvent.click(screen.getByRole("button", { name: "keep session" }))

      await waitFor(() => expect(keepErrorText()).toBe("ACCOUNT_NOT_ACTIVE"))
      await waitFor(() => expect(statusText()).toBe("anonymous"))
      expect(sentAuthorization[1]).toBe("Bearer rotated-token")
      expect(refreshCalls()).toBe(1)
      expect(endSessionSpy).toHaveBeenCalledTimes(1)
      expect(endSessionSpy).toHaveBeenCalledWith("accountNotActive")
      expect(handlerCalls).toEqual(["accountNotActive"])
      expect(keepRejections).toHaveLength(1)
      expect(errorCode(keepRejections[0])).toBe("ACCOUNT_NOT_ACTIVE")
      expect(getAccessToken()).toBeNull()
      expect(queryClient.getQueryData(queryKeys.auth.me())).toBeUndefined()
      expect(peekPendingAuthNotice()).toBe("accountNotActive")
      await waitFor(() => expect(announcements).toHaveLength(1))
      await settle()
      expect(announcements).toEqual([{ type: "logout" }])
      expectOnlyTransportErrorLog()
    } finally {
      close()
    }
  })

  it("a me 403 with another code rejects but keeps the session, the rotated token and no notice", async () => {
    meRefusalAfterBoot(403, "FORBIDDEN")
    const { announcements, close } = recordAnnouncements()
    try {
      renderProvider()
      await waitFor(() => expect(statusText()).toBe("passwordChangeRequired"))

      fireEvent.click(screen.getByRole("button", { name: "keep session" }))

      await waitFor(() => expect(keepErrorText()).toBe("FORBIDDEN"))
      expect(statusText()).toBe("passwordChangeRequired")
      expect(getAccessToken()).toBe("rotated-token")
      expect(peekPendingAuthNotice()).toBeNull()
      expect(announcements).toEqual([])
    } finally {
      close()
    }
  })
})

// Route access for the category page: a session route with no extra gate.
const SESSION_ROUTE: RouteAccess = {
  kind: "session",
  passwordChange: "enforced",
  gates: [],
}

describe("refresh 401 with any code ends the session (D4.2, D4.3, TODO-024)", () => {
  it("a boot refresh 401 SESSION_TERMINATED is anonymous with no notice and ends the session once", async () => {
    sessionTerminatedRefresh()
    const { announcements, close } = recordAnnouncements()
    try {
      renderProvider()

      await waitFor(() => expect(statusText()).toBe("anonymous"))
      await waitFor(() => expect(announcements).toHaveLength(1))
      await settle()
      expect(statusText()).toBe("anonymous")
      expect(announcements).toEqual([{ type: "logout" }])
      expect(handlerCalls).toEqual([undefined])
      expect(getAccessToken()).toBeNull()
      expect(queryClient.getQueryCache().findAll()).toHaveLength(0)
      expect(peekPendingAuthNotice()).toBeNull()
    } finally {
      close()
    }
  })

  it("a data call 401 then a refresh 401 SESSION_TERMINATED ends the session once: token and cache cleared, anonymous, /login, no read error", async () => {
    window.history.replaceState(null, "", "/tenant-categories")
    const refreshCalls = sessionTerminatedRefreshAfterBoot()
    server.use(
      http.get(`${API}/tenant-categories`, () =>
        HttpResponse.json(
          { code: "UNAUTHORIZED", message: "Authentication required." },
          { status: 401 }
        )
      )
    )
    const onRedirect = vi.fn()
    const { announcements, close } = recordAnnouncements()
    try {
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Probe />
            <RouteGuard access={SESSION_ROUTE} onRedirect={onRedirect}>
              <DialogsProvider>
                <TenantCategoryListPage />
              </DialogsProvider>
            </RouteGuard>
          </AuthProvider>
        </QueryClientProvider>
      )

      await waitFor(() => expect(statusText()).toBe("anonymous"))
      await waitFor(() => expect(onRedirect).toHaveBeenCalledWith(LOGIN_PATH))
      await waitFor(() => expect(announcements).toHaveLength(1))
      await settle()
      expect(announcements).toEqual([{ type: "logout" }])
      expect(handlerCalls).toEqual([undefined])
      expect(refreshCalls()).toBe(2)
      expect(getAccessToken()).toBeNull()
      expect(queryClient.getQueryCache().findAll()).toHaveLength(0)
      expect(peekPendingAuthNotice()).toBeNull()
      expect(screen.queryByText(GENERIC_READ_MESSAGE)).toBeNull()
    } finally {
      close()
    }
  })

  it.each(["SESSION_ENDED", "UNMAPPED_REFRESH_CODE"])(
    "a boot me 401 then a refresh 401 %s (no account reason) is anonymous with no notice, and ends the session once (UT024-OQ5)",
    async (code) => {
      meExpiredOnce()
      refreshRefusalAfterBoot(401, code)
      const { announcements, close } = recordAnnouncements()
      try {
        renderProvider()

        await waitFor(() => expect(statusText()).toBe("anonymous"))
        await waitFor(() => expect(announcements).toHaveLength(1))
        // Lets the cancelled `me` settle, so the final view is what is checked.
        await settle()
        expect(statusText()).toBe("anonymous")
        expect(announcements).toEqual([{ type: "logout" }])
        expect(handlerCalls).toEqual([undefined])
        expect(getAccessToken()).toBeNull()
        expect(queryClient.getQueryCache().findAll()).toHaveLength(0)
        expect(queryClient.getQueryData(queryKeys.auth.me())).toBeUndefined()
        expect(peekPendingAuthNotice()).toBeNull()
      } finally {
        close()
      }
    }
  )
})

describe("boot me 401 with any code ends the session (D4.2, TODO-024 L9)", () => {
  it("a boot me 401 with a code outside the expiry codes clears the token and is anonymous with no notice", async () => {
    meRefusal(401, "SOME_CODE")

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    await settle()
    expect(statusText()).toBe("anonymous")
    expect(getAccessToken()).toBeNull()
    expect(peekPendingAuthNotice()).toBeNull()
  })

  it("a boot me 401 with an expiry code that stays 401 after the refresh clears the token and is anonymous with no notice", async () => {
    meRefusal(401, "UNAUTHORIZED")

    renderProvider()

    await waitFor(() => expect(statusText()).toBe("anonymous"))
    await settle()
    expect(statusText()).toBe("anonymous")
    expect(getAccessToken()).toBeNull()
    expect(peekPendingAuthNotice()).toBeNull()
  })
})
