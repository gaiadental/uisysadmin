import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { httpError, networkError } from "./errors"
import {
  endSession,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
  setLogoutHandler,
} from "./refresh"

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
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

  it("a 401 without an expiry code keeps the session (D4.3)", async () => {
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
    expect(getAccessToken()).toBe("T1")
    expect(onLogout).not.toHaveBeenCalled()
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
