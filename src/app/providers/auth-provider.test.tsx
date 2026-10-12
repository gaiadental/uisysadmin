// @vitest-environment jsdom
import { StrictMode, type ReactNode } from "react"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getAccessToken, setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"
import { API, FIXTURE_ME, TEST_ACCESS_TOKEN } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { AuthProvider, useAuth } from "./auth-provider"

const BASE_URL = "http://sp.test"
const CREDENTIALS = {
  loginId: "principal@example.com",
  password: "secret-pass",
}

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  queryClient = createQueryClient()
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

/** A minimal consumer that shows the view state and drives the actions. */
function Probe() {
  const auth = useAuth()
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
          void auth.completePasswordChange({
            kind: "SESSION_KEPT",
            accessToken: "rotated-token",
          })
        }
      >
        keep session
      </button>
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
