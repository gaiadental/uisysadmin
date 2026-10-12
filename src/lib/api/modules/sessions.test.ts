import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  API,
  FIXTURE_OTHER_SESSION,
  FIXTURE_SESSION,
} from "@/test/handlers/auth"
import { server } from "@/test/server"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import {
  forceLogoutUser,
  listOwnSessions,
  listUserSessions,
  revokeOtherOwnSessions,
  revokeOwnSession,
} from "./sessions"

const BASE_URL = "http://sp.test"
const USER_ID = "640688ab-b751-4071-9a1d-d079552305d3"

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  setAccessToken(null)
})

async function failureOf(run: () => Promise<unknown>): Promise<ApiError> {
  try {
    await run()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error("Expected the call to fail with an ApiError.")
}

describe("own sessions (D4.9)", () => {
  it("lists the signed-in user's sessions with the current one marked", async () => {
    const sessions = await listOwnSessions()

    expect(sessions).toEqual([FIXTURE_SESSION])
    expect(sessions[0]?.isCurrent).toBe(true)
  })

  it("throws CONTRACT when a session lacks isCurrent", async () => {
    server.use(
      http.get(`${API}/sessions`, () =>
        HttpResponse.json({
          data: [{ ...FIXTURE_SESSION, isCurrent: undefined }],
        })
      )
    )

    const error = await failureOf(() => listOwnSessions())

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })

  it("keeps a session whose lastActivityAt is null and maps its other fields", async () => {
    const neverUsed = {
      ...FIXTURE_OTHER_SESSION,
      lastActivityAt: null,
    }
    server.use(
      http.get(`${API}/sessions`, () =>
        HttpResponse.json({ data: [FIXTURE_SESSION, neverUsed] })
      )
    )

    const sessions = await listOwnSessions()

    expect(sessions).toEqual([FIXTURE_SESSION, neverUsed])
    expect(sessions[1]).toMatchObject({
      sessionId: FIXTURE_OTHER_SESSION.sessionId,
      ipAddress: FIXTURE_OTHER_SESSION.ipAddress,
      userAgent: FIXTURE_OTHER_SESSION.userAgent,
      lastActivityAt: null,
      createdAt: FIXTURE_OTHER_SESSION.createdAt,
      isCurrent: false,
    })
  })

  it("revokes one session with the session id encoded in the path", async () => {
    let requestedPath = ""
    server.use(
      http.delete(`${API}/sessions/:sessionId`, ({ request }) => {
        requestedPath = new URL(request.url).pathname
        return HttpResponse.json({ data: null })
      })
    )

    await expect(revokeOwnSession("a/b")).resolves.toBeUndefined()
    expect(requestedPath).toBe("/api/v1/sessions/a%2Fb")
  })

  it("revokes every other session with one DELETE on the collection", async () => {
    let method = ""
    let requestedPath = ""
    server.use(
      http.delete(`${API}/sessions`, ({ request }) => {
        method = request.method
        requestedPath = new URL(request.url).pathname
        return HttpResponse.json({ data: null })
      })
    )

    await expect(revokeOtherOwnSessions()).resolves.toBeUndefined()
    expect(method).toBe("DELETE")
    expect(requestedPath).toBe("/api/v1/sessions")
  })

  it("throws CONTRACT when a revoke answers with a payload instead of null", async () => {
    server.use(
      http.delete(`${API}/sessions`, () =>
        HttpResponse.json({ data: { revoked: 2 } })
      )
    )

    const error = await failureOf(() => revokeOtherOwnSessions())

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })
})

describe("sessions of another user (D4.10, FE doc 5.6)", () => {
  it("lists the sessions of one user from the admin path", async () => {
    let requestedPath = ""
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, ({ request }) => {
        requestedPath = new URL(request.url).pathname
        return HttpResponse.json({ data: [FIXTURE_SESSION] })
      })
    )

    const sessions = await listUserSessions(USER_ID)

    expect(sessions).toEqual([FIXTURE_SESSION])
    expect(requestedPath).toBe(`/api/v1/admin/users/${USER_ID}/sessions`)
  })

  it("lists the admin sessions of a user when lastActivityAt is null", async () => {
    const neverUsed = { ...FIXTURE_OTHER_SESSION, lastActivityAt: null }
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () =>
        HttpResponse.json({ data: [neverUsed] })
      )
    )

    const sessions = await listUserSessions(USER_ID)

    expect(sessions).toEqual([neverUsed])
    expect(sessions[0]?.lastActivityAt).toBeNull()
  })

  it("force logout sends one DELETE for the user and resolves", async () => {
    let method = ""
    server.use(
      http.delete(`${API}/admin/users/:userId/sessions`, ({ request }) => {
        method = request.method
        return HttpResponse.json({ data: null })
      })
    )

    await expect(forceLogoutUser(USER_ID)).resolves.toBeUndefined()
    expect(method).toBe("DELETE")
  })

  it("maps 403 PERMISSION_DENIED from force logout to an HTTP error", async () => {
    server.use(
      http.delete(`${API}/admin/users/:userId/sessions`, () =>
        HttpResponse.json(
          {
            code: "PERMISSION_DENIED",
            message:
              "The authenticated principal does not have the required permission.",
          },
          { status: 403 }
        )
      )
    )

    const error = await failureOf(() => forceLogoutUser(USER_ID))

    expect(error).toMatchObject({
      code: "PERMISSION_DENIED",
      status: 403,
      kind: "HTTP",
    })
  })

  it("throws CONTRACT when the admin list is not an array", async () => {
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () =>
        HttpResponse.json({ data: FIXTURE_SESSION })
      )
    )

    const error = await failureOf(() => listUserSessions(USER_ID))

    expect(error).toMatchObject({ kind: "CONTRACT" })
  })
})
