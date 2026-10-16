import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { API, errorResponse } from "@/test/handlers/auth"
import {
  FIXTURE_MASTER_PERMISSION_APPOINTMENT,
  FIXTURE_MASTER_PERMISSIONS,
} from "@/test/handlers/tenant-permissions"
import { server } from "@/test/server"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import {
  getMasterPermission,
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
      key: "appointment:view",
      module: "clinic",
      category: "appointment",
    })
  })

  it("sends GET to /api/v1/master-permissions", async () => {
    let seen: { method: string; path: string } | null = null
    server.use(
      http.get(`${API}/master-permissions`, ({ request }) => {
        seen = { method: request.method, path: new URL(request.url).pathname }
        return HttpResponse.json({ data: [FIXTURE_MASTER_PERMISSION_APPOINTMENT] })
      })
    )

    await listMasterPermissions()

    expect(seen).toEqual({ method: "GET", path: "/api/v1/master-permissions" })
  })

  it("ignores unknown keys", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({
          data: [{ ...FIXTURE_MASTER_PERMISSION_APPOINTMENT, future: "x" }],
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

    const error = await listMasterPermissions().catch(
      (caught: unknown) => caught
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: "HTTP", status: 403 })
  })
})

describe("getMasterPermission (TODO-021)", () => {
  it("sends GET /{id} and returns the parsed permission", async () => {
    let seen: { method: string; path: string } | null = null
    server.use(
      http.get(`${API}/master-permissions/:id`, ({ request }) => {
        seen = { method: request.method, path: new URL(request.url).pathname }
        return HttpResponse.json({
          data: {
            ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
            active: false,
            future: "x",
          },
        })
      })
    )

    const result = await getMasterPermission(1)

    expect(seen).toEqual({
      method: "GET",
      path: "/api/v1/master-permissions/1",
    })
    expect(result).toMatchObject({ id: 1, key: "appointment:view", active: false })
    expect(result).not.toHaveProperty("future")
  })

  it("rejects a 404 as an HTTP ApiError", async () => {
    const error = await getMasterPermission(999).catch(
      (caught: unknown) => caught
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: "HTTP", status: 404 })
  })

  it("rejects a body that breaks the contract as CONTRACT", async () => {
    server.use(
      http.get(`${API}/master-permissions/:id`, () =>
        HttpResponse.json({ data: { id: "x" } })
      )
    )
    await expect(getMasterPermission(1)).rejects.toMatchObject({
      kind: "CONTRACT",
    })
  })
})

const INPUT: MasterPermissionInput = {
  key: "patient_profile:view",
  name: "View patient profile",
  description: "Lihat laporan",
  category: "REPORT",
  module: "reporting",
  active: true,
  customerPermitted: false,
}

function captureBody(method: "patch") {
  const seen: { body: Record<string, unknown> | null; url: string } = {
    body: null,
    url: "",
  }
  server.use(
    http[method](`${API}/master-permissions*`, async ({ request }) => {
      seen.body = (await request.json()) as Record<string, unknown>
      seen.url = new URL(request.url).pathname
      return HttpResponse.json({
        data: { ...FIXTURE_MASTER_PERMISSION_APPOINTMENT, ...seen.body },
      })
    })
  )
  return seen
}

describe("updateMasterPermission (TODO-013)", () => {
  it("PATCHes /{id} with every current value and the key unchanged", async () => {
    const seen = captureBody("patch")
    await updateMasterPermission(7, { ...INPUT, description: "" })

    expect(seen.url).toBe("/api/v1/master-permissions/7")
    expect(seen.body).toEqual({ ...INPUT, description: "" })
    expect(seen.body?.key).toBe("patient_profile:view")
  })
})

describe("updateMasterPermission, additional cases (TODO-013)", () => {
  it("update drops keys outside the contract", async () => {
    const seen = captureBody("patch")
    await updateMasterPermission(3, {
      ...INPUT,
      id: 9,
      extra: "x",
    } as MasterPermissionInput)
    expect(Object.keys(seen.body ?? {}).sort()).toEqual([
      "active",
      "category",
      "customerPermitted",
      "description",
      "key",
      "module",
      "name",
    ])
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
        return HttpResponse.json({ data: FIXTURE_MASTER_PERMISSION_APPOINTMENT })
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
})

describe("updateMasterPermission never sends scope (REQ-FE-057, TODO-027)", () => {
  it("drops a scope the caller passes, so the server never sees a change", async () => {
    const seen = captureBody("patch")
    // A variable, not a literal, so the excess-property check does not apply.
    const withScope = { ...INPUT, scope: "PLATFORM" }
    await updateMasterPermission(4, withScope)
    expect(seen.body).not.toHaveProperty("scope")
  })
})
