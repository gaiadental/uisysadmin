import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { API, errorResponse } from "@/test/handlers/auth"
import {
  FIXTURE_MASTER_PERMISSION_BRANCHES,
  FIXTURE_MASTER_PERMISSIONS,
} from "@/test/handlers/tenant-permissions"
import { server } from "@/test/server"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import {
  createMasterPermission,
  deleteMasterPermission,
  listMasterPermissions,
  updateMasterPermission,
  type MasterPermissionInput,
} from "./master-permissions"

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

describe("listMasterPermissions (FE doc 5.3)", () => {
  it("unwraps data into a plain array", async () => {
    const result = await listMasterPermissions()

    expect(result).toHaveLength(FIXTURE_MASTER_PERMISSIONS.length)
    expect(result[0]).toMatchObject({
      id: 1,
      key: "branches:view",
      module: "clinic",
      category: "branches",
    })
  })

  it("sends GET to /api/v1/master-permissions", async () => {
    let seen: { method: string; path: string } | null = null
    server.use(
      http.get(`${API}/master-permissions`, ({ request }) => {
        seen = { method: request.method, path: new URL(request.url).pathname }
        return HttpResponse.json({ data: [FIXTURE_MASTER_PERMISSION_BRANCHES] })
      })
    )

    await listMasterPermissions()

    expect(seen).toEqual({ method: "GET", path: "/api/v1/master-permissions" })
  })

  it("ignores unknown keys", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({
          data: [{ ...FIXTURE_MASTER_PERMISSION_BRANCHES, future: "x" }],
        })
      )
    )

    const result = await listMasterPermissions()

    expect(result[0]).not.toHaveProperty("future")
  })

  it("rejects an item without a key as CONTRACT", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({ data: [{ id: 1, name: "x" }] })
      )
    )

    await expect(listMasterPermissions()).rejects.toMatchObject({
      kind: "CONTRACT",
    })
  })

  it("rejects a 403 as an HTTP ApiError", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )

    const error = await listMasterPermissions().catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: "HTTP", status: 403 })
  })
})

const INPUT: MasterPermissionInput = {
  key: "reports:view",
  name: "View reports",
  description: "Lihat laporan",
  category: "REPORT",
  module: "reporting",
  active: true,
  customerPermitted: false,
}

function captureBody(method: "post" | "patch") {
  const seen: { body: Record<string, unknown> | null; url: string } = {
    body: null,
    url: "",
  }
  server.use(
    http[method](`${API}/master-permissions*`, async ({ request }) => {
      seen.body = (await request.json()) as Record<string, unknown>
      seen.url = new URL(request.url).pathname
      return HttpResponse.json({
        data: { ...FIXTURE_MASTER_PERMISSION_BRANCHES, ...seen.body },
      })
    })
  )
  return seen
}

describe("createMasterPermission (TODO-013)", () => {
  it("POSTs the whitelisted body and returns the permission", async () => {
    const seen = captureBody("post")
    const result = await createMasterPermission(INPUT)

    expect(seen.url).toBe("/api/v1/master-permissions")
    expect(seen.body).toEqual(INPUT)
    expect(result.key).toBe("reports:view")
  })

  it("leaves an empty description out", async () => {
    const seen = captureBody("post")
    await createMasterPermission({ ...INPUT, description: "" })
    expect(seen.body).not.toHaveProperty("description")
  })

  it("rejects with a 409 when the key exists", async () => {
    server.use(
      http.post(`${API}/master-permissions`, () =>
        errorResponse(409, "MASTER_PERMISSION_KEY_EXISTS", "exists")
      )
    )
    await expect(createMasterPermission(INPUT)).rejects.toMatchObject({
      status: 409,
    })
  })
})

describe("updateMasterPermission (TODO-013)", () => {
  it("PATCHes /{id} with every current value and the key unchanged", async () => {
    const seen = captureBody("patch")
    await updateMasterPermission(7, { ...INPUT, description: "" })

    expect(seen.url).toBe("/api/v1/master-permissions/7")
    expect(seen.body).toEqual({ ...INPUT, description: "" })
    expect(seen.body?.key).toBe("reports:view")
  })
})

describe("deleteMasterPermission (TODO-013)", () => {
  it("sends DELETE /{id} and resolves on { data: null }", async () => {
    let method = ""
    let path = ""
    server.use(
      http.delete(`${API}/master-permissions/:id`, ({ request }) => {
        method = request.method
        path = new URL(request.url).pathname
        return HttpResponse.json({ data: null })
      })
    )
    await expect(deleteMasterPermission(5)).resolves.toBeUndefined()
    expect([method, path]).toEqual(["DELETE", "/api/v1/master-permissions/5"])
  })
})

describe("master permission writes, additional cases (TODO-013)", () => {
  it("create sends a non-empty description and both flags as given", async () => {
    const seen = captureBody("post")
    await createMasterPermission({ ...INPUT, active: false, customerPermitted: true })
    expect(seen.body).toMatchObject({
      description: "Lihat laporan",
      active: false,
      customerPermitted: true,
    })
  })

  it("create omits description when it is undefined", async () => {
    const seen = captureBody("post")
    const rest: MasterPermissionInput = {
      key: INPUT.key,
      name: INPUT.name,
      category: INPUT.category,
      module: INPUT.module,
      active: INPUT.active,
      customerPermitted: INPUT.customerPermitted,
    }
    await createMasterPermission(rest)
    expect(seen.body).not.toHaveProperty("description")
  })

  it("create and update drop keys outside the contract", async () => {
    const seenPost = captureBody("post")
    await createMasterPermission({ ...INPUT, id: 9, extra: "x" } as MasterPermissionInput)
    expect(Object.keys(seenPost.body ?? {}).sort()).toEqual(
      ["active", "category", "customerPermitted", "description", "key", "module", "name"]
    )
    const seenPatch = captureBody("patch")
    await updateMasterPermission(3, { ...INPUT, id: 9 } as MasterPermissionInput)
    expect(seenPatch.body).not.toHaveProperty("id")
  })

  it("update sends description as an empty string when undefined", async () => {
    const seen = captureBody("patch")
    const rest: MasterPermissionInput = {
      key: INPUT.key,
      name: INPUT.name,
      category: INPUT.category,
      module: INPUT.module,
      active: INPUT.active,
      customerPermitted: INPUT.customerPermitted,
    }
    await updateMasterPermission(3, rest)
    expect(seen.body).toHaveProperty("description", "")
  })

  it("update uses PATCH", async () => {
    let method = ""
    server.use(
      http.all(`${API}/master-permissions/:id`, ({ request }) => {
        method = request.method
        return HttpResponse.json({ data: FIXTURE_MASTER_PERMISSION_BRANCHES })
      })
    )
    await updateMasterPermission(1, INPUT)
    expect(method).toBe("PATCH")
  })

  it("update rejects on 404 and 403 with the HTTP status", async () => {
    server.use(
      http.patch(`${API}/master-permissions/:id`, () =>
        errorResponse(404, "NOT_FOUND", "missing")
      )
    )
    await expect(updateMasterPermission(1, INPUT)).rejects.toMatchObject({
      kind: "HTTP",
      status: 404,
    })
    server.use(
      http.patch(`${API}/master-permissions/:id`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )
    await expect(updateMasterPermission(1, INPUT)).rejects.toMatchObject({
      status: 403,
    })
  })

  it("rejects a create response that breaks the contract", async () => {
    server.use(
      http.post(`${API}/master-permissions`, () =>
        HttpResponse.json({ data: { id: "x" } })
      )
    )
    await expect(createMasterPermission(INPUT)).rejects.toMatchObject({
      kind: "CONTRACT",
    })
  })

  it("delete rejects on 409 (bound) and 404", async () => {
    server.use(
      http.delete(`${API}/master-permissions/:id`, () =>
        errorResponse(409, "RESOURCE_CONFLICT", "bound")
      )
    )
    await expect(deleteMasterPermission(1)).rejects.toMatchObject({ status: 409 })
    server.use(
      http.delete(`${API}/master-permissions/:id`, () =>
        errorResponse(404, "NOT_FOUND", "missing")
      )
    )
    await expect(deleteMasterPermission(1)).rejects.toMatchObject({ status: 404 })
  })
})
