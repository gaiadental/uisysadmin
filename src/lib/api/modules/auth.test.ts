import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  API,
  FIXTURE_ME,
  FIXTURE_ME_NULL_BRANCHES,
  TEST_ACCESS_TOKEN,
} from "@/test/handlers/auth"
import { server } from "@/test/server"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  refreshSession,
  resetPassword,
} from "./auth"

const BASE_URL = "http://sp.test"

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  // The client logs API errors in development. Keep test output quiet.
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  setAccessToken(null)
})

/** Resolves with the ApiError a call rejects with. Fails when the call resolves. */
async function failureOf(run: () => Promise<unknown>): Promise<ApiError> {
  try {
    await run()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error("Expected the call to fail with an ApiError.")
}

/** Counts refresh calls. Used to prove that exempt endpoints never refresh (D4.4). */
function countRefreshCalls(): () => number {
  let calls = 0
  server.use(
    http.post(`${API}/auth/refresh`, () => {
      calls += 1
      return HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
    })
  )
  return () => calls
}

describe("login (D4.5)", () => {
  it("sends only loginId and password and returns the access token", async () => {
    let sentBody: unknown
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
      })
    )

    const result = await login({
      loginId: "principal@example.com",
      password: "secret-pass",
    })

    expect(sentBody).toEqual({
      loginId: "principal@example.com",
      password: "secret-pass",
    })
    expect(result).toEqual({ accessToken: TEST_ACCESS_TOKEN })
  })

  it("maps 401 INVALID_CREDENTIALS to an HTTP error and never refreshes", async () => {
    const refreshCalls = countRefreshCalls()
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { code: "INVALID_CREDENTIALS", message: "Invalid credentials." },
          { status: 401 }
        )
      )
    )

    const error = await failureOf(() =>
      login({ loginId: "principal@example.com", password: "wrong" })
    )

    expect(error).toMatchObject({
      code: "INVALID_CREDENTIALS",
      status: 401,
      kind: "HTTP",
    })
    expect(refreshCalls()).toBe(0)
  })

  it("throws CONTRACT when the token envelope is empty", async () => {
    server.use(
      http.post(`${API}/auth/login`, () => HttpResponse.json({ data: {} }))
    )

    const error = await failureOf(() =>
      login({ loginId: "principal@example.com", password: "secret-pass" })
    )

    expect(error).toMatchObject({ kind: "CONTRACT", code: "CONTRACT" })
  })
})

describe("getMe (D5.1, D5.5)", () => {
  it("unwraps data and returns the typed current user", async () => {
    const me = await getMe()

    expect(me).toEqual(FIXTURE_ME)
    expect(me.pwdChangeRequired).toBe(false)
  })

  it("throws CONTRACT when a required field is missing", async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({
          data: { ...FIXTURE_ME, pwdChangeRequired: undefined },
        })
      )
    )

    const error = await failureOf(() => getMe())

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })

  it("throws CONTRACT when the body has no data envelope", async () => {
    server.use(http.get(`${API}/auth/me`, () => HttpResponse.json(FIXTURE_ME)))

    const error = await failureOf(() => getMe())

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })
})

describe("getMe branches (SP-CF-01)", () => {
  function respondWith(data: unknown) {
    server.use(http.get(`${API}/auth/me`, () => HttpResponse.json({ data })))
  }

  it("accepts branches null, the live shape for a SYSTEM_USER", async () => {
    respondWith(FIXTURE_ME_NULL_BRANCHES)

    const me = await getMe()

    expect(me.branches).toBeNull()
    expect(me.branches ?? []).toEqual([])
    expect(me.loginId).toBe(FIXTURE_ME.loginId)
  })

  it("accepts a missing branches field", async () => {
    // JSON drops undefined, so the field is absent from the body.
    respondWith({ ...FIXTURE_ME, branches: undefined })

    const me = await getMe()

    expect(me.branches).toBeUndefined()
    expect(me.branches ?? []).toEqual([])
  })

  it("accepts an empty branches array", async () => {
    respondWith({ ...FIXTURE_ME, branches: [] })

    const me = await getMe()

    expect(me.branches).toEqual([])
  })

  it("accepts a list of branches", async () => {
    const branches = [{ branchId: "b1", name: "Main branch" }]
    respondWith({ ...FIXTURE_ME, branches })

    const me = await getMe()

    expect(me.branches).toEqual(branches)
  })

  it("still throws CONTRACT when branches is not an array", async () => {
    respondWith({ ...FIXTURE_ME, branches: "x" })

    const error = await failureOf(() => getMe())

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })
})

describe("refreshSession (D4.2)", () => {
  it("returns the access token from the refresh envelope", async () => {
    await expect(refreshSession()).resolves.toBe(TEST_ACCESS_TOKEN)
  })

  it("throws CONTRACT when accessToken is an empty string", async () => {
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ data: { accessToken: "" } })
      )
    )

    const error = await failureOf(() => refreshSession())

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })
})

describe("logout (D4.4, D4.8)", () => {
  it("resolves when the server accepts the logout", async () => {
    await expect(logout()).resolves.toBeUndefined()
  })

  it("treats a 401 as already logged out and never refreshes", async () => {
    const refreshCalls = countRefreshCalls()
    server.use(
      http.post(`${API}/auth/logout`, () =>
        HttpResponse.json(
          { code: "UNAUTHORIZED", message: "Unauthorized." },
          { status: 401 }
        )
      )
    )

    await expect(logout()).resolves.toBeUndefined()
    expect(refreshCalls()).toBe(0)
  })

  it("ignores a network failure, because the local session still ends", async () => {
    server.use(http.post(`${API}/auth/logout`, () => HttpResponse.error()))

    await expect(logout()).resolves.toBeUndefined()
  })
})

describe("changePassword (D4.6)", () => {
  const request = {
    currentPassword: "old-pass",
    newPassword: "New-Strong-Pass-1",
    newPasswordConfirmation: "New-Strong-Pass-1",
  } as const

  it("keepCurrentSession true returns the rotated access token", async () => {
    let sentBody: unknown
    server.use(
      http.post(
        `${API}/auth/change-password`,
        async ({ request: incoming }) => {
          sentBody = await incoming.json()
          return HttpResponse.json({ data: { accessToken: "rotated-token" } })
        }
      )
    )

    const outcome = await changePassword({
      ...request,
      keepCurrentSession: true,
    })

    expect(sentBody).toEqual({ ...request, keepCurrentSession: true })
    expect(outcome).toEqual({
      kind: "SESSION_KEPT",
      accessToken: "rotated-token",
    })
  })

  it("keepCurrentSession false returns PASSWORD_CHANGED", async () => {
    const outcome = await changePassword({
      ...request,
      keepCurrentSession: false,
    })

    expect(outcome).toEqual({ kind: "PASSWORD_CHANGED" })
  })

  it("throws CONTRACT when a kept session gets the PASSWORD_CHANGED shape", async () => {
    server.use(
      http.post(`${API}/auth/change-password`, () =>
        HttpResponse.json({ data: { status: "PASSWORD_CHANGED" } })
      )
    )

    const error = await failureOf(() =>
      changePassword({ ...request, keepCurrentSession: true })
    )

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })

  it("never refreshes on 401 INVALID_CREDENTIALS (D4.4)", async () => {
    const refreshCalls = countRefreshCalls()
    server.use(
      http.post(`${API}/auth/change-password`, () =>
        HttpResponse.json(
          {
            code: "INVALID_CREDENTIALS",
            message: "Current password is incorrect.",
          },
          { status: 401 }
        )
      )
    )

    const error = await failureOf(() =>
      changePassword({ ...request, keepCurrentSession: true })
    )

    expect(error).toMatchObject({ code: "INVALID_CREDENTIALS", status: 401 })
    expect(refreshCalls()).toBe(0)
  })

  it("never refreshes on 401 UNAUTHORIZED either, because change-password is exempt", async () => {
    const refreshCalls = countRefreshCalls()
    server.use(
      http.post(`${API}/auth/change-password`, () =>
        HttpResponse.json(
          { code: "UNAUTHORIZED", message: "Unauthorized." },
          { status: 401 }
        )
      )
    )

    const error = await failureOf(() =>
      changePassword({ ...request, keepCurrentSession: false })
    )

    expect(error).toMatchObject({ code: "UNAUTHORIZED", status: 401 })
    expect(refreshCalls()).toBe(0)
  })
})

describe("forgotPassword and resetPassword (D4.7)", () => {
  it("forgotPassword sends only the loginId and resolves", async () => {
    let sentBody: unknown
    server.use(
      http.post(`${API}/auth/forgot-password`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: { status: "ACCEPTED" } })
      })
    )

    await expect(
      forgotPassword("principal@example.com")
    ).resolves.toBeUndefined()
    expect(sentBody).toEqual({ loginId: "principal@example.com" })
  })

  it("resetPassword sends the token and both passwords", async () => {
    let sentBody: unknown
    server.use(
      http.post(`${API}/auth/reset-password`, async ({ request }) => {
        sentBody = await request.json()
        return HttpResponse.json({ data: { status: "PASSWORD_RESET" } })
      })
    )

    await expect(
      resetPassword({
        resetToken: "reset-token-1",
        newPassword: "New-Strong-Pass-1",
        newPasswordConfirmation: "New-Strong-Pass-1",
      })
    ).resolves.toBeUndefined()
    expect(sentBody).toEqual({
      resetToken: "reset-token-1",
      newPassword: "New-Strong-Pass-1",
      newPasswordConfirmation: "New-Strong-Pass-1",
    })
  })

  it("maps 400 INVALID_TOKEN from reset-password to an HTTP error", async () => {
    server.use(
      http.post(`${API}/auth/reset-password`, () =>
        HttpResponse.json(
          { code: "INVALID_TOKEN", message: "Invalid or expired token." },
          { status: 400 }
        )
      )
    )

    const error = await failureOf(() =>
      resetPassword({
        resetToken: "stale",
        newPassword: "New-Strong-Pass-1",
        newPasswordConfirmation: "New-Strong-Pass-1",
      })
    )

    expect(error).toMatchObject({
      code: "INVALID_TOKEN",
      status: 400,
      kind: "HTTP",
    })
  })

  it("throws CONTRACT when the status payload is missing", async () => {
    server.use(
      http.post(`${API}/auth/forgot-password`, () =>
        HttpResponse.json({ data: {} })
      )
    )

    const error = await failureOf(() => forgotPassword("principal@example.com"))

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })
})
