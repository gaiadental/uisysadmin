import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { httpError, networkError, nonJsonError } from "./errors"
import {
  accountEndReason,
  endSession,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
  setLogoutHandler,
} from "./refresh"

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  let reject: (reason: unknown) => void = () => undefined
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

// A minimal stand-in for navigator.locks: one queue, grants in request order.
function stubWebLocks(): string[] {
  const requested: string[] = []
  let queue: Promise<unknown> = Promise.resolve()
  const locks = {
    request(name: string, callback: () => Promise<unknown>) {
      requested.push(name)
      const run = queue.then(() => callback())
      queue = run.catch(() => undefined)
      return run
    },
  }
  vi.stubGlobal("navigator", { locks })
  return requested
}

beforeEach(() => {
  setAccessToken(null)
  setLogoutHandler(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("refreshAccessToken single-flight", () => {
  it("runs one refresh for concurrent 401s and shares the result", async () => {
    setAccessToken("T1")
    const gate = deferred<string>()
    const refresh = vi.fn(() => gate.promise)

    const first = refreshAccessToken("T1", refresh)
    const second = refreshAccessToken("T1", refresh)
    gate.resolve("T2")

    await expect(Promise.all([first, second])).resolves.toEqual(["T2", "T2"])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe("T2")
  })

  it("falls back to in-tab single-flight when navigator.locks is missing", async () => {
    vi.stubGlobal("navigator", {})
    setAccessToken("T1")
    const gate = deferred<string>()
    const refresh = vi.fn(() => gate.promise)

    const first = refreshAccessToken("T1", refresh)
    const second = refreshAccessToken("T1", refresh)
    gate.resolve("T2")

    await expect(Promise.all([first, second])).resolves.toEqual(["T2", "T2"])
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it("serialises the refresh under the sp-session-refresh Web Lock", async () => {
    const requested = stubWebLocks()
    setAccessToken("T1")
    const refresh = vi.fn(async () => "T2")

    await expect(refreshAccessToken("T1", refresh)).resolves.toBe("T2")

    expect(requested).toEqual(["sp-session-refresh"])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe("T2")
  })

  it("does not refresh again when the token already rotated", async () => {
    setAccessToken("T2")
    const refresh = vi.fn(async () => "T3")

    await expect(refreshAccessToken("T1", refresh)).resolves.toBe("T2")
    expect(refresh).not.toHaveBeenCalled()
    expect(getAccessToken()).toBe("T2")
  })

  it("returns null without refreshing when the session already ended", async () => {
    setAccessToken(null)
    const refresh = vi.fn(async () => "T2")

    await expect(refreshAccessToken("T1", refresh)).resolves.toBeNull()
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe("refresh outcomes", () => {
  it("a 401 from the refresh call clears the token and calls the logout handler", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() =>
      Promise.reject(
        httpError(
          401,
          { code: "SESSION_ENDED", message: "Session ended." },
          null
        )
      )
    )

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      code: "SESSION_ENDED",
      status: 401,
    })
    expect(getAccessToken()).toBeNull()
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it("a 401 without an expiry code ends the session with no reason (D4.3, TODO-024)", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() =>
      Promise.reject(
        httpError(401, { code: "UNRECOGNISED", message: "Unknown." }, null)
      )
    )

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      status: 401,
    })
    expect(getAccessToken()).toBeNull()
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(onLogout.mock.calls[0]?.[0]).toBeUndefined()
  })

  it.each(["SESSION_TERMINATED", "TOKEN_EXPIRED", "SOME_FUTURE_CODE"])(
    "a refresh 401 %s ends the session once with no reason (TODO-024)",
    async (code) => {
      setAccessToken("T1")
      const onLogout = vi.fn()
      setLogoutHandler(onLogout)
      const refresh = vi.fn(() =>
        Promise.reject(
          httpError(401, { code, message: "Session terminated." }, null)
        )
      )

      await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
        code,
        status: 401,
      })
      expect(getAccessToken()).toBeNull()
      expect(onLogout).toHaveBeenCalledTimes(1)
      expect(onLogout.mock.calls[0]?.[0]).toBeUndefined()
    }
  )

  it("a 401 with an empty or non-JSON body ends the session with no reason (TODO-024)", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() => Promise.reject(nonJsonError(401, null)))

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      status: 401,
      kind: "NON_JSON",
    })
    expect(getAccessToken()).toBeNull()
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(onLogout.mock.calls[0]?.[0]).toBeUndefined()
  })

  it("a network failure keeps the session and does not call the logout handler", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() => Promise.reject(networkError(null)))

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      kind: "NETWORK",
    })
    expect(getAccessToken()).toBe("T1")
    expect(onLogout).not.toHaveBeenCalled()
  })

  it("endSession clears the token and calls the handler once", () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)

    endSession()

    expect(getAccessToken()).toBeNull()
    expect(onLogout).toHaveBeenCalledTimes(1)
  })
})

describe("refresh account states (REQ-FE-055)", () => {
  it("a 403 ACCOUNT_NOT_ACTIVE clears the token and calls the logout handler once, with reason accountNotActive", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() =>
      Promise.reject(
        httpError(
          403,
          { code: "ACCOUNT_NOT_ACTIVE", message: "Account is not active." },
          null
        )
      )
    )

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      code: "ACCOUNT_NOT_ACTIVE",
      status: 403,
    })
    expect(getAccessToken()).toBeNull()
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(onLogout).toHaveBeenCalledWith("accountNotActive")
  })

  it("a 403 ACCOUNT_NOT_READY clears the token and calls the logout handler once, with reason accountNotReady", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() =>
      Promise.reject(
        httpError(
          403,
          { code: "ACCOUNT_NOT_READY", message: "Account is not ready." },
          null
        )
      )
    )

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      code: "ACCOUNT_NOT_READY",
      status: 403,
    })
    expect(getAccessToken()).toBeNull()
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(onLogout).toHaveBeenCalledWith("accountNotReady")
  })

  it.each(["PASSWORD_CHANGE_REQUIRED", "FORBIDDEN"])(
    "a 403 %s keeps the token and does not call the logout handler",
    async (code) => {
      setAccessToken("T1")
      const onLogout = vi.fn()
      setLogoutHandler(onLogout)
      const refresh = vi.fn(() =>
        Promise.reject(httpError(403, { code, message: "Refused." }, null))
      )

      await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
        code,
        status: 403,
      })
      expect(getAccessToken()).toBe("T1")
      expect(onLogout).not.toHaveBeenCalled()
    }
  )

  it("a 403 with no usable code keeps the token and does not call the logout handler", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() =>
      Promise.reject(httpError(403, { message: "Refused." }, null))
    )

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      status: 403,
    })
    expect(getAccessToken()).toBe("T1")
    expect(onLogout).not.toHaveBeenCalled()
  })

  it.each(["SESSION_ENDED", "INVALID_TOKEN", "UNAUTHORIZED"])(
    "a 401 %s still ends the session with no reason (regression)",
    async (code) => {
      setAccessToken("T1")
      const onLogout = vi.fn()
      setLogoutHandler(onLogout)
      const refresh = vi.fn(() =>
        Promise.reject(httpError(401, { code, message: "Expired." }, null))
      )

      await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
        code,
        status: 401,
      })
      expect(getAccessToken()).toBeNull()
      expect(onLogout).toHaveBeenCalledTimes(1)
      expect(onLogout.mock.calls[0]?.[0]).toBeUndefined()
    }
  )
})

describe("account state boundaries (REQ-FE-055, edge cases)", () => {
  it("a 401 that carries an account code ends the session with no reason, because only a 403 gives an account reason (TODO-024)", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() =>
      Promise.reject(
        httpError(
          401,
          { code: "ACCOUNT_NOT_ACTIVE", message: "Account is not active." },
          null
        )
      )
    )

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      status: 401,
    })
    expect(getAccessToken()).toBeNull()
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(onLogout.mock.calls[0]?.[0]).toBeUndefined()
  })

  it("a 403 that carries a 401 expiry code keeps the session, because the 403 status is not an expiry", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const refresh = vi.fn(() =>
      Promise.reject(
        httpError(403, { code: "SESSION_ENDED", message: "Ended." }, null)
      )
    )

    await expect(refreshAccessToken("T1", refresh)).rejects.toMatchObject({
      status: 403,
    })
    expect(getAccessToken()).toBe("T1")
    expect(onLogout).not.toHaveBeenCalled()
  })

  it.each([null, undefined, "ACCOUNT_NOT_ACTIVE", new Error("ACCOUNT_NOT_ACTIVE")])(
    "accountEndReason gives no reason for a non-ApiError input (%s)",
    (input) => {
      expect(accountEndReason(input)).toBeNull()
    }
  )

  it("accountEndReason gives no reason for a network failure, even with a matching code", () => {
    expect(accountEndReason(networkError(null))).toBeNull()
  })

  it("accountEndReason maps only the two account codes on a 403", () => {
    expect(
      accountEndReason(
        httpError(403, { code: "ACCOUNT_NOT_ACTIVE", message: "x" }, null)
      )
    ).toBe("accountNotActive")
    expect(
      accountEndReason(
        httpError(403, { code: "ACCOUNT_NOT_READY", message: "x" }, null)
      )
    ).toBe("accountNotReady")
    expect(
      accountEndReason(httpError(403, { code: "FORBIDDEN", message: "x" }, null))
    ).toBeNull()
    expect(
      accountEndReason(
        httpError(401, { code: "ACCOUNT_NOT_READY", message: "x" }, null)
      )
    ).toBeNull()
  })
})

describe("a refresh in flight when the session ends (TODO-024 M3)", () => {
  it("endSession during a pending refresh: the late token T2 is not stored, the caller gets null", async () => {
    setAccessToken("T1")
    const gate = deferred<string>()
    const refresh = vi.fn(() => gate.promise)

    const pending = refreshAccessToken("T1", refresh)
    endSession()
    gate.resolve("T2")

    await expect(pending).resolves.toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it("a local end (setAccessToken(null), as logout does) during a pending refresh: the late token T2 is not stored", async () => {
    setAccessToken("T1")
    const gate = deferred<string>()
    const refresh = vi.fn(() => gate.promise)

    const pending = refreshAccessToken("T1", refresh)
    setAccessToken(null)
    gate.resolve("T2")

    await expect(pending).resolves.toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it("a refresh that rejects 401 after the session ended does not end it a second time", async () => {
    setAccessToken("T1")
    const onLogout = vi.fn()
    setLogoutHandler(onLogout)
    const gate = deferred<string>()
    const refresh = vi.fn(() => gate.promise)

    const pending = refreshAccessToken("T1", refresh)
    endSession()
    gate.reject(httpError(401, { code: "SESSION_ENDED", message: "x" }, null))

    await expect(pending).rejects.toMatchObject({ status: 401 })
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBeNull()
  })

  it("a refresh that starts after the end still stores its token", async () => {
    setAccessToken("T1")
    endSession()
    setAccessToken("T1")
    const refresh = vi.fn(async () => "T2")

    await expect(refreshAccessToken("T1", refresh)).resolves.toBe("T2")
    expect(getAccessToken()).toBe("T2")
  })
})
