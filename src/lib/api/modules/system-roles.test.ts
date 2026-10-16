import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { API, errorResponse } from "@/test/handlers/auth"
import { FIXTURE_ROLES } from "@/test/handlers/system-users"
import { server } from "@/test/server"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import {
  createSystemRole,
  deleteSystemRole,
  getSystemRole,
  listRolePermissionKeys,
  listSystemRoles,
  replaceRolePermissionKeys,
  updateSystemRole,
} from "./system-roles"

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

describe("listSystemRoles (FE doc 5.2)", () => {
  it("unwraps data into a plain array", async () => {
    const result = await listSystemRoles()

    expect(result).toHaveLength(FIXTURE_ROLES.length)
    expect(result[0]).toMatchObject({ id: 1, key: "SYS_PRINCIPAL" })
  })

  it("sends GET to /api/v1/system-roles", async () => {
    let seen: { method: string; path: string } | null = null
    server.use(
      http.get(`${API}/system-roles`, ({ request }) => {
        seen = { method: request.method, path: new URL(request.url).pathname }
        return HttpResponse.json({ data: [] })
      })
    )

    await listSystemRoles()

    expect(seen).toEqual({ method: "GET", path: "/api/v1/system-roles" })
  })

  it("accepts a null description and ignores unknown keys", async () => {
    server.use(
      http.get(`${API}/system-roles`, () =>
        HttpResponse.json({ data: [{ ...FIXTURE_ROLES[1], future: "x" }] })
      )
    )

    const [role] = await listSystemRoles()

    expect(role?.description).toBeNull()
    expect(role).not.toHaveProperty("future")
  })

  it("rejects an item without a key as CONTRACT", async () => {
    server.use(
      http.get(`${API}/system-roles`, () =>
        HttpResponse.json({ data: [{ id: 1, name: "x" }] })
      )
    )

    await expect(listSystemRoles()).rejects.toMatchObject({ kind: "CONTRACT" })
  })

  it("rejects a 403 as an HTTP ApiError", async () => {
    server.use(
      http.get(`${API}/system-roles`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )

    const error = await listSystemRoles().catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: "HTTP", status: 403 })
  })
})

interface Seen {
  method: string
  path: string
  body: unknown
}

/** Records the next request of a method and path and answers with `response`. */
function record(
  method: "get" | "post" | "patch" | "put" | "delete",
  path: string,
  response: () => Response
): { seen: Seen | null } {
  const box: { seen: Seen | null } = { seen: null }
  server.use(
    http[method](`${API}${path}`, async ({ request }) => {
      const text = await request.text()
      box.seen = {
        method: request.method,
        path: new URL(request.url).pathname,
        body: text === "" ? null : (JSON.parse(text) as unknown),
      }
      return response()
    })
  )
  return box
}

describe("getSystemRole", () => {
  it("sends GET to the encoded role path and unwraps data", async () => {
    const box = record("get", "/system-roles/:id", () =>
      HttpResponse.json({ data: FIXTURE_ROLES[1] })
    )

    const role = await getSystemRole(2)

    expect(box.seen).toMatchObject({ method: "GET", path: "/api/v1/system-roles/2" })
    expect(role).toMatchObject({ id: 2, key: "SYS_ADMIN" })
  })

  it("rejects a 404 SYSTEM_ROLE_NOT_FOUND", async () => {
    const error = await getSystemRole(999).catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      kind: "HTTP",
      status: 404,
      code: "SYSTEM_ROLE_NOT_FOUND",
    })
  })
})

describe("createSystemRole (FE doc 5.2, SP-BG-11)", () => {
  it("sends key, name, description and active", async () => {
    const box = record("post", "/system-roles", () =>
      HttpResponse.json({ data: { ...FIXTURE_ROLES[1], id: 9 } })
    )

    await createSystemRole({
      key: "OPS_ADMIN",
      name: "Ops Admin",
      description: "Ops",
      active: true,
    })

    expect(box.seen).toEqual({
      method: "POST",
      path: "/api/v1/system-roles",
      body: { key: "OPS_ADMIN", name: "Ops Admin", description: "Ops", active: true },
    })
  })

  it("omits an empty description and unknown fields", async () => {
    const box = record("post", "/system-roles", () =>
      HttpResponse.json({ data: FIXTURE_ROLES[1] })
    )

    await createSystemRole({
      key: "A",
      name: "B",
      description: "",
      active: false,
      extra: "x",
    } as Parameters<typeof createSystemRole>[0])

    expect(box.seen?.body).toEqual({ key: "A", name: "B", active: false })
  })

  it("rejects a 409 SYSTEM_ROLE_KEY_EXISTS as an ApiError", async () => {
    server.use(
      http.post(`${API}/system-roles`, () =>
        errorResponse(409, "SYSTEM_ROLE_KEY_EXISTS", "taken")
      )
    )

    const error = await createSystemRole({
      key: "A",
      name: "B",
      active: true,
    }).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: "SYSTEM_ROLE_KEY_EXISTS" })
  })
})

describe("updateSystemRole", () => {
  it("sends PATCH with every current value, an empty description included", async () => {
    const box = record("patch", "/system-roles/:id", () =>
      HttpResponse.json({ data: FIXTURE_ROLES[1] })
    )

    await updateSystemRole(2, {
      key: "SYS_ADMIN",
      name: "System Admin",
      description: "",
      active: false,
    })

    expect(box.seen).toEqual({
      method: "PATCH",
      path: "/api/v1/system-roles/2",
      body: { key: "SYS_ADMIN", name: "System Admin", description: "", active: false },
    })
  })

  it("rejects a PLATFORM_ROLE_PROTECTED refusal with its code and message", async () => {
    server.use(
      http.patch(`${API}/system-roles/:id`, () =>
        errorResponse(403, "PLATFORM_ROLE_PROTECTED", "Operation not permitted.")
      )
    )

    const error = await updateSystemRole(1, {
      key: "SYS_PRINCIPAL",
      name: "x",
      active: true,
    }).catch((caught: unknown) => caught)

    expect(error).toMatchObject({
      status: 403,
      code: "PLATFORM_ROLE_PROTECTED",
      message: "Operation not permitted.",
    })
  })
})

describe("deleteSystemRole", () => {
  it("sends DELETE and resolves with no value", async () => {
    const box = record("delete", "/system-roles/:id", () =>
      HttpResponse.json({ data: null })
    )

    await expect(deleteSystemRole(2)).resolves.toBeUndefined()

    expect(box.seen).toMatchObject({ method: "DELETE", path: "/api/v1/system-roles/2" })
  })

  it("rejects a non-null data body as CONTRACT", async () => {
    server.use(
      http.delete(`${API}/system-roles/:id`, () =>
        HttpResponse.json({ data: { id: 2 } })
      )
    )

    await expect(deleteSystemRole(2)).rejects.toMatchObject({ kind: "CONTRACT" })
  })
})

describe("role permissions (keys, not ids)", () => {
  it("GET answers a list of permission keys", async () => {
    const keys = await listRolePermissionKeys(1)

    expect(keys).toEqual(["system_users:view", "appointment:view"])
  })

  it("rejects a list of numbers as CONTRACT", async () => {
    server.use(
      http.get(`${API}/system-roles/:id/permissions`, () =>
        HttpResponse.json({ data: [1, 2] })
      )
    )

    await expect(listRolePermissionKeys(1)).rejects.toMatchObject({
      kind: "CONTRACT",
    })
  })

  it("PUT sends one request with permissionKeys and returns the saved keys", async () => {
    const box = record("put", "/system-roles/:id/permissions", () =>
      HttpResponse.json({ data: ["appointment:view"] })
    )

    const saved = await replaceRolePermissionKeys(2, ["appointment:view"])

    expect(box.seen).toEqual({
      method: "PUT",
      path: "/api/v1/system-roles/2/permissions",
      body: { permissionKeys: ["appointment:view"] },
    })
    expect(saved).toEqual(["appointment:view"])
  })

  it("PUT with an empty list sends an empty array (full replacement)", async () => {
    const box = record("put", "/system-roles/:id/permissions", () =>
      HttpResponse.json({ data: [] })
    )

    await replaceRolePermissionKeys(2, [])

    expect(box.seen?.body).toEqual({ permissionKeys: [] })
  })
})
