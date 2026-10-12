import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiRequest, assertOutgoingHeaders, newCorrelationId } from "./client"
import { ApiError } from "./errors"
import { getAccessToken, setAccessToken, setLogoutHandler } from "./refresh"

type Responder = (
  url: string,
  init: RequestInit
) => Promise<Response> | Response

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function stubFetch(responder: Responder) {
  const mock = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(responder(String(input), init ?? {}))
  )
  vi.stubGlobal("fetch", mock)
  return mock
}

function callAt(
  mock: ReturnType<typeof stubFetch>,
  index: number
): { readonly url: string; readonly init: RequestInit } {
  const call = mock.mock.calls[index]
  if (call === undefined) throw new Error(`No fetch call at index ${index}`)
  return { url: String(call[0]), init: call[1] ?? {} }
}

function sentHeaders(init: RequestInit): Headers {
  return new Headers(init.headers)
}

function pathOf(url: string): string {
  return new URL(url, "http://sp.invalid").pathname
}

function json(
  status: number,
  body: unknown,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => {
  setAccessToken(null)
  setLogoutHandler(null)
  // Development logs are checked in one test. Silence the rest.
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("request construction (D3.1)", () => {
  it("sends only allow-listed headers, with credentials and a correlation id", async () => {
    const fetchMock = stubFetch(() => json(200, { data: [] }))

    await apiRequest("/api/v1/countries")

    const { url, init } = callAt(fetchMock, 0)
    expect(url).toBe("/api/v1/countries")
    expect(init.method).toBe("GET")
    expect(init.credentials).toBe("include")
    expect([...sentHeaders(init).keys()].sort()).toEqual([
      "accept",
      "x-correlation-id",
    ])
    expect(sentHeaders(init).get("X-Correlation-ID")).toMatch(UUID_V4)
  })

  it("attaches the bearer token except on public auth calls", async () => {
    setAccessToken("T1")
    const fetchMock = stubFetch(() => json(200, { data: {} }))

    await apiRequest("/api/v1/auth/me")
    await apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: { loginId: "user@example.com", password: "secret" },
    })

    const me = sentHeaders(callAt(fetchMock, 0).init)
    const login = sentHeaders(callAt(fetchMock, 1).init)
    expect(me.get("Authorization")).toBe("Bearer T1")
    expect(login.get("Authorization")).toBeNull()
    expect(login.get("Content-Type")).toBe("application/json")
  })

  it.each([
    "/api/v2/tenants",
    "/tenants",
    "/api/v1/../admin/users",
    "https://sp.example/api/v1/tenants",
  ])("refuses a path outside /api/v1/: %s", async (path) => {
    const fetchMock = stubFetch(() => json(200, {}))

    await expect(apiRequest(path)).rejects.toBeInstanceOf(TypeError)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("creates a new UUID v4 correlation id on each call", () => {
    const first = newCorrelationId()
    const second = newCorrelationId()

    expect(first).toMatch(UUID_V4)
    expect(second).toMatch(UUID_V4)
    expect(first).not.toBe(second)
  })

  it("builds a UUID v4 when randomUUID is unavailable", () => {
    const realCrypto = globalThis.crypto
    vi.stubGlobal("crypto", {
      getRandomValues: realCrypto.getRandomValues.bind(realCrypto),
    })

    expect(newCorrelationId()).toMatch(UUID_V4)
  })
})

describe("refresh policy (D4.3, D4.4)", () => {
  it("sends one refresh call for concurrent 401s", async () => {
    setAccessToken("T1")
    const bothRejected = deferred<void>()
    let unauthorized = 0
    let refreshCalls = 0
    stubFetch(async (url, init) => {
      if (pathOf(url) === "/api/v1/auth/refresh") {
        refreshCalls += 1
        await bothRejected.promise
        return json(200, { data: { accessToken: "T2" } })
      }
      if (sentHeaders(init).get("Authorization") === "Bearer T1") {
        unauthorized += 1
        if (unauthorized === 2) bothRejected.resolve()
        return json(401, { code: "UNAUTHORIZED", message: "Unauthorized." })
      }
      return json(200, { data: { ok: true } })
    })

    const results = await Promise.all([
      apiRequest("/api/v1/tenants"),
      apiRequest("/api/v1/countries"),
    ])

    expect(results).toEqual([{ data: { ok: true } }, { data: { ok: true } }])
    expect(refreshCalls).toBe(1)
    expect(getAccessToken()).toBe("T2")
  })

  it("refreshes, retries once with a new correlation id, and resolves", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    let refreshCalls = 0
    const fetchMock = stubFetch((url, init) => {
      if (pathOf(url) === "/api/v1/auth/refresh") {
        refreshCalls += 1
        return json(200, { data: { accessToken: "T2" } })
      }
      if (sentHeaders(init).get("Authorization") === "Bearer T2") {
        return json(200, { data: { id: "t-1" } })
      }
      return json(401, { code: "INVALID_TOKEN", message: "Invalid token." })
    })

    await expect(apiRequest("/api/v1/tenants/t-1")).resolves.toEqual({
      data: { id: "t-1" },
    })

    const attempts = [0, 1, 2].map((index) => callAt(fetchMock, index))
    const tenantIds = attempts
      .filter((attempt) => pathOf(attempt.url) === "/api/v1/tenants/t-1")
      .map((attempt) => sentHeaders(attempt.init).get("X-Correlation-ID"))
    expect(tenantIds).toHaveLength(2)
    expect(tenantIds[0]).not.toBe(tenantIds[1])
    expect(refreshCalls).toBe(1)
    expect(onLogout).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe("T2")
  })

  it("logs out when the retry is also 401, without a second refresh", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    let refreshCalls = 0
    const fetchMock = stubFetch((url) => {
      if (pathOf(url) === "/api/v1/auth/refresh") {
        refreshCalls += 1
        return json(200, { data: { accessToken: "T2" } })
      }
      return json(401, { code: "UNAUTHORIZED", message: "Unauthorized." })
    })

    await expect(apiRequest("/api/v1/tenants")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHORIZED",
    })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(refreshCalls).toBe(1)
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
  })

  it.each(["UNAUTHORIZED", "INVALID_TOKEN", "SESSION_ENDED"])(
    "refreshes on the refresh code %s",
    async (code) => {
      setAccessToken("T1")
      let refreshCalls = 0
      stubFetch((url, init) => {
        if (pathOf(url) === "/api/v1/auth/refresh") {
          refreshCalls += 1
          return json(200, { data: { accessToken: "T2" } })
        }
        if (sentHeaders(init).get("Authorization") === "Bearer T2") {
          return json(200, { data: { ok: true } })
        }
        return json(401, { code, message: "Expired." })
      })

      await expect(apiRequest("/api/v1/system-users")).resolves.toEqual({
        data: { ok: true },
      })
      expect(refreshCalls).toBe(1)
    }
  )

  it.each([
    "/api/v1/auth/login",
    "/api/v1/auth/change-password",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/logout",
  ])("an exempt endpoint never refreshes: %s", async (path) => {
    setAccessToken("T1")
    let refreshCalls = 0
    stubFetch((url) => {
      if (pathOf(url) === "/api/v1/auth/refresh") refreshCalls += 1
      return json(401, { code: "UNAUTHORIZED", message: "Unauthorized." })
    })

    await expect(apiRequest(path, { method: "POST" })).rejects.toMatchObject({
      status: 401,
    })

    expect(refreshCalls).toBe(0)
    expect(getAccessToken()).toBe("T1")
  })

  it("INVALID_CREDENTIALS never refreshes, even on a non-exempt endpoint", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    let refreshCalls = 0
    stubFetch((url) => {
      if (pathOf(url) === "/api/v1/auth/refresh") refreshCalls += 1
      return json(401, { code: "INVALID_CREDENTIALS", message: "Wrong." })
    })

    await expect(apiRequest("/api/v1/system-users")).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      status: 401,
    })

    expect(refreshCalls).toBe(0)
    expect(onLogout).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe("T1")
  })

  it("returns 403 PASSWORD_CHANGE_REQUIRED to the caller without refreshing", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    let refreshCalls = 0
    stubFetch((url) => {
      if (pathOf(url) === "/api/v1/auth/refresh") refreshCalls += 1
      return json(
        403,
        { code: "PASSWORD_CHANGE_REQUIRED", message: "Change password first." },
        { "X-Correlation-ID": "srv-403" }
      )
    })

    await expect(apiRequest("/api/v1/auth/me")).rejects.toMatchObject({
      code: "PASSWORD_CHANGE_REQUIRED",
      status: 403,
      kind: "HTTP",
      correlationId: "srv-403",
    })

    expect(refreshCalls).toBe(0)
    expect(onLogout).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe("T1")
  })
})

describe("response handling (D3.1 steps 5 and 8)", () => {
  it("resolves a 204 with no body", async () => {
    stubFetch(() => new Response(null, { status: 204 }))

    await expect(
      apiRequest<void>("/api/v1/tenants/t-1", { method: "DELETE" })
    ).resolves.toBeUndefined()
  })

  it("maps a network failure to kind NETWORK", async () => {
    stubFetch(() => Promise.reject(new TypeError("fetch failed")))

    await expect(apiRequest("/api/v1/countries")).rejects.toMatchObject({
      kind: "NETWORK",
      code: "NETWORK",
      status: null,
    })
  })

  it("maps an abort after 30 seconds to kind TIMEOUT", async () => {
    vi.useFakeTimers()
    stubFetch(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError"))
          )
        })
    )

    const pending = apiRequest("/api/v1/countries")
    const assertion = expect(pending).rejects.toMatchObject({
      kind: "TIMEOUT",
      code: "TIMEOUT",
      status: null,
    })
    await vi.advanceTimersByTimeAsync(30_000)

    await assertion
  })

  it.each([
    ["an empty 200 body", 200, ""],
    ["a non-JSON 200 body", 200, "not json"],
    ["an HTML 502 page", 502, "<html>Bad Gateway</html>"],
  ])("maps %s to kind NON_JSON", async (_label, status, text) => {
    stubFetch(() => new Response(text, { status }))

    await expect(apiRequest("/api/v1/countries")).rejects.toMatchObject({
      kind: "NON_JSON",
      code: "NON_JSON",
      status,
    })
  })
})

describe("forbidden headers (D3.1 step 2)", () => {
  it("never sends X-User-ID, X-Role, X-Tenant-ID or X-Service-Token", async () => {
    setAccessToken("T1")
    const fetchMock = stubFetch(() => json(200, { data: null }))

    await apiRequest("/api/v1/auth/me")

    const headers = sentHeaders(callAt(fetchMock, 0).init)
    for (const name of [
      "X-User-ID",
      "X-Role",
      "X-Tenant-ID",
      "X-Service-Token",
    ]) {
      expect(headers.has(name)).toBe(false)
    }
  })

  it("refuses a forbidden header in development, naming the header only", () => {
    expect(() =>
      assertOutgoingHeaders({ "X-User-ID": "user-secret-1" })
    ).toThrow(TypeError)
    expect(() => assertOutgoingHeaders({ "x-service-token": "abc" })).toThrow(
      /x-service-token/
    )
    expect(() => assertOutgoingHeaders({ "X-Role": "SYS_ADMIN" })).toThrow(
      TypeError
    )
  })

  it("sends nothing outside the allow-list in a production build", async () => {
    vi.stubEnv("DEV", false)
    setAccessToken("T1")
    const fetchMock = stubFetch(() => json(200, { data: null }))

    await apiRequest("/api/v1/auth/me")

    const names = [...sentHeaders(callAt(fetchMock, 0).init).keys()].sort()
    expect(names).toEqual(["accept", "authorization", "x-correlation-id"])
  })

  it("keeps the header guard to development builds only (D3.1)", () => {
    vi.stubEnv("DEV", false)

    expect(() => assertOutgoingHeaders({ "X-Role": "SYS_ADMIN" })).not.toThrow()
  })

  it("accepts the allow-listed headers", () => {
    expect(() =>
      assertOutgoingHeaders({
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: "Bearer T1",
        "X-Correlation-ID": "abc-123",
      })
    ).not.toThrow()
  })
})

describe("development logging (REQ-FE-046)", () => {
  it("logs only the reference id, status, code, route and kind", async () => {
    setAccessToken("T1-secret-value")
    const logSpy = vi.spyOn(console, "error")
    const fetchMock = stubFetch(() =>
      json(500, { code: "INTERNAL_ERROR", message: "db password leaked" })
    )

    await expect(
      apiRequest("/api/v1/tenants?search=jane@example.com", {
        route: "tenants.list",
      })
    ).rejects.toBeInstanceOf(ApiError)

    const sent = sentHeaders(callAt(fetchMock, 0).init).get("X-Correlation-ID")
    const logged = JSON.stringify(logSpy.mock.calls)
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(logged).toContain(`"correlationId":"${sent}"`)
    expect(logged).toContain('"status":500')
    expect(logged).toContain('"code":"INTERNAL_ERROR"')
    expect(logged).toContain('"route":"tenants.list"')
    expect(logged).toContain('"kind":"HTTP"')
    expect(logged).not.toContain("db password")
    expect(logged).not.toContain("jane@example.com")
    expect(logged).not.toContain("T1-secret-value")
  })
})
