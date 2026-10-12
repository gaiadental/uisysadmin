import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { API, errorResponse } from "@/test/handlers/auth"
import {
  FIXTURE_USER_ACTIVE,
  FIXTURE_USERS,
  LOGIN_TAKEN,
  MISSING_ROLE_ID,
} from "@/test/handlers/system-users"
import { server } from "@/test/server"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import {
  changeSystemUserRole,
  changeSystemUserStatus,
  createSystemUser,
  deleteSystemUser,
  getSystemUser,
  listSystemUsers,
  resetSystemUserPassword,
} from "./system-users"

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  setAccessToken(null)
})

interface Seen {
  method: string
  path: string
  body: unknown
}

/** Records the next request to `path` with `method` and answers with `reply`. */
function capture(
  method: "get" | "post" | "patch" | "delete",
  path: string,
  reply: () => Response
): Seen {
  const seen: Seen = { method: "", path: "", body: undefined }
  server.use(
    http[method](`${API}${path}`, async ({ request }) => {
      seen.method = request.method
      seen.path = new URL(request.url).pathname
      const text = await request.text()
      seen.body = text === "" ? undefined : (JSON.parse(text) as unknown)
      return reply()
    })
  )
  return seen
}

describe("listSystemUsers and getSystemUser (FE doc 5.1)", () => {
  it("unwraps data into a plain array", async () => {
    const result = await listSystemUsers()

    expect(result).toHaveLength(FIXTURE_USERS.length)
    expect(result[1]).toMatchObject({
      loginId: "ops@gaia.com",
      status: "ACTIVE",
      systemRoleKey: "SYS_ADMIN",
    })
  })

  it("sends GET to /api/v1/system-users", async () => {
    const seen = capture("get", "/system-users", () =>
      HttpResponse.json({ data: [] })
    )

    await listSystemUsers()

    expect(seen.method).toBe("GET")
    expect(seen.path).toBe("/api/v1/system-users")
  })

  it("gets one user by an encoded id", async () => {
    const seen = capture("get", "/system-users/*", () =>
      HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
    )

    const user = await getSystemUser("a/b c")

    expect(seen.path).toBe("/api/v1/system-users/a%2Fb%20c")
    expect(user.id).toBe(FIXTURE_USER_ACTIVE.id)
  })

  it("keeps the three contract statuses and ignores unknown keys", async () => {
    server.use(
      http.get(`${API}/system-users`, () =>
        HttpResponse.json({
          data: FIXTURE_USERS.map((user) => ({ ...user, future: "x" })),
        })
      )
    )

    const result = await listSystemUsers()

    expect(result.map((user) => user.status)).toEqual([
      "ACTIVE",
      "ACTIVE",
      "SUSPENDED",
      "DEACTIVATED",
    ])
    expect(result[0]).not.toHaveProperty("future")
  })

  it("rejects a status outside the contract as CONTRACT", async () => {
    server.use(
      http.get(`${API}/system-users`, () =>
        HttpResponse.json({
          data: [{ ...FIXTURE_USER_ACTIVE, status: "INACTIVE" }],
        })
      )
    )

    await expect(listSystemUsers()).rejects.toMatchObject({ kind: "CONTRACT" })
  })

  it("rejects a body without data as CONTRACT", async () => {
    server.use(http.get(`${API}/system-users/:id`, () => HttpResponse.json({})))

    await expect(getSystemUser("x")).rejects.toMatchObject({ kind: "CONTRACT" })
  })

  it("maps 404 SYSTEM_USER_NOT_FOUND to an HTTP ApiError", async () => {
    const error = await getSystemUser("missing").catch(
      (caught: unknown) => caught
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      kind: "HTTP",
      status: 404,
      code: "SYSTEM_USER_NOT_FOUND",
    })
  })
})

describe("createSystemUser (D5.3)", () => {
  it("POSTs loginId and systemRoleId only", async () => {
    const seen = capture("post", "/system-users", () =>
      HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
    )

    await createSystemUser({
      loginId: "new@gaia.com",
      systemRoleId: 2,
      // A stray field must not reach the request.
      ...({ status: "ACTIVE" } as object),
    })

    expect(seen.method).toBe("POST")
    expect(seen.path).toBe("/api/v1/system-users")
    expect(seen.body).toEqual({ loginId: "new@gaia.com", systemRoleId: 2 })
  })

  it("maps 409 SYSTEM_USER_LOGIN_EXISTS", async () => {
    await expect(
      createSystemUser({ loginId: LOGIN_TAKEN, systemRoleId: 2 })
    ).rejects.toMatchObject({
      kind: "HTTP",
      status: 409,
      code: "SYSTEM_USER_LOGIN_EXISTS",
    })
  })

  it("maps 400 SYSTEM_ROLE_NOT_FOUND", async () => {
    await expect(
      createSystemUser({ loginId: "x@gaia.com", systemRoleId: MISSING_ROLE_ID })
    ).rejects.toMatchObject({
      kind: "HTTP",
      status: 400,
      code: "SYSTEM_ROLE_NOT_FOUND",
    })
  })

  it("maps 403 PERMISSION_DENIED", async () => {
    server.use(
      http.post(`${API}/system-users`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )

    await expect(
      createSystemUser({ loginId: "x@gaia.com", systemRoleId: 1 })
    ).rejects.toMatchObject({ kind: "HTTP", status: 403 })
  })
})

describe("changeSystemUserRole (D5.3)", () => {
  it("PATCHes systemRoleId only", async () => {
    const seen = capture("patch", "/system-users/:id", () =>
      HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
    )

    const user = await changeSystemUserRole(FIXTURE_USER_ACTIVE.id, 1)

    expect(seen.method).toBe("PATCH")
    expect(seen.path).toBe(`/api/v1/system-users/${FIXTURE_USER_ACTIVE.id}`)
    expect(seen.body).toEqual({ systemRoleId: 1 })
    expect(user.id).toBe(FIXTURE_USER_ACTIVE.id)
  })
})

describe("changeSystemUserStatus (FE doc 5.1)", () => {
  it.each(["ACTIVE", "SUSPENDED", "DEACTIVATED"] as const)(
    "PATCHes /status with %s",
    async (status) => {
      const seen = capture("patch", "/system-users/:id/status", () =>
        HttpResponse.json({ data: { ...FIXTURE_USER_ACTIVE, status } })
      )

      const user = await changeSystemUserStatus(FIXTURE_USER_ACTIVE.id, status)

      expect(seen.path).toBe(
        `/api/v1/system-users/${FIXTURE_USER_ACTIVE.id}/status`
      )
      expect(seen.body).toEqual({ status })
      expect(user.status).toBe(status)
    }
  )

  it("maps a 403 from the status-specific permission", async () => {
    server.use(
      http.patch(`${API}/system-users/:id/status`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )

    await expect(
      changeSystemUserStatus(FIXTURE_USER_ACTIVE.id, "SUSPENDED")
    ).rejects.toMatchObject({ kind: "HTTP", status: 403 })
  })
})

describe("deleteSystemUser and resetSystemUserPassword", () => {
  it("DELETEs the user and resolves void", async () => {
    const seen = capture("delete", "/system-users/:id", () =>
      HttpResponse.json({ data: null })
    )

    await expect(
      deleteSystemUser(FIXTURE_USER_ACTIVE.id)
    ).resolves.toBeUndefined()

    expect(seen.method).toBe("DELETE")
    expect(seen.path).toBe(`/api/v1/system-users/${FIXTURE_USER_ACTIVE.id}`)
  })

  it("POSTs reset-password with no body and resolves void", async () => {
    const seen = capture("post", "/system-users/:id/reset-password", () =>
      HttpResponse.json({ data: null })
    )

    await expect(
      resetSystemUserPassword(FIXTURE_USER_ACTIVE.id)
    ).resolves.toBeUndefined()

    expect(seen.method).toBe("POST")
    expect(seen.path).toBe(
      `/api/v1/system-users/${FIXTURE_USER_ACTIVE.id}/reset-password`
    )
    expect(seen.body).toBeUndefined()
  })

  it("rejects a delete answer that is not null as CONTRACT", async () => {
    server.use(
      http.delete(`${API}/system-users/:id`, () =>
        HttpResponse.json({ data: { ok: true } })
      )
    )

    await expect(deleteSystemUser("x")).rejects.toMatchObject({
      kind: "CONTRACT",
    })
  })

  it("maps 404 on delete", async () => {
    await expect(deleteSystemUser("missing")).rejects.toMatchObject({
      status: 404,
      code: "SYSTEM_USER_NOT_FOUND",
    })
  })
})
