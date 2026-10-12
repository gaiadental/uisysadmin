import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { API, errorResponse } from "@/test/handlers/auth"
import {
  FIXTURE_TENANT_PERMISSION_BRANCHES,
  FIXTURE_TENANT_PERMISSIONS,
} from "@/test/handlers/tenant-permissions"
import { server } from "@/test/server"

import { setAccessToken } from "../refresh"

import {
  listTenantPermissions,
  replaceTenantPermissions,
  setTenantPermissionEnabled,
} from "./tenant-permissions"

const TENANT_ID = "cfab6b98-98cf-4059-bd06-9a1cdf469b41"

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

describe("listTenantPermissions (FE doc 5.4)", () => {
  it("unwraps data and keeps the camelCase fields", async () => {
    const result = await listTenantPermissions(TENANT_ID)

    expect(result).toHaveLength(FIXTURE_TENANT_PERMISSIONS.length)
    expect(result[0]).toEqual(FIXTURE_TENANT_PERMISSION_BRANCHES)
  })

  it("encodes the tenant id in the path", async () => {
    let path = ""
    server.use(
      http.get(`${API}/tenants/:tenantId/permissions`, ({ request }) => {
        path = new URL(request.url).pathname
        return HttpResponse.json({ data: [] })
      })
    )

    await listTenantPermissions("a/b")

    expect(path).toBe("/api/v1/tenants/a%2Fb/permissions")
  })

  it("rejects an item without `enabled` as CONTRACT", async () => {
    const withoutEnabled: Record<string, unknown> = {
      ...FIXTURE_TENANT_PERMISSION_BRANCHES,
    }
    delete withoutEnabled.enabled
    server.use(
      http.get(`${API}/tenants/:tenantId/permissions`, () =>
        HttpResponse.json({ data: [withoutEnabled] })
      )
    )

    await expect(listTenantPermissions(TENANT_ID)).rejects.toMatchObject({
      kind: "CONTRACT",
    })
  })
})

describe("replaceTenantPermissions", () => {
  it("sends one PUT with only masterPermissionIds", async () => {
    const calls: Array<{ method: string; body: unknown }> = []
    server.use(
      http.put(`${API}/tenants/:tenantId/permissions`, async ({ request }) => {
        calls.push({ method: request.method, body: await request.json() })
        return HttpResponse.json({ data: [FIXTURE_TENANT_PERMISSION_BRANCHES] })
      })
    )

    const result = await replaceTenantPermissions(TENANT_ID, {
      masterPermissionIds: [1, 2],
    })

    expect(calls).toEqual([{ method: "PUT", body: { masterPermissionIds: [1, 2] } }])
    expect(result).toEqual([FIXTURE_TENANT_PERMISSION_BRANCHES])
  })

  it("sends an empty list as a full replacement", async () => {
    let body: unknown = null
    server.use(
      http.put(`${API}/tenants/:tenantId/permissions`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: [] })
      })
    )

    await replaceTenantPermissions(TENANT_ID, { masterPermissionIds: [] })

    expect(body).toEqual({ masterPermissionIds: [] })
  })

  it("rejects a 400 with the server code", async () => {
    server.use(
      http.put(`${API}/tenants/:tenantId/permissions`, () =>
        errorResponse(400, "VALIDATION_FAILED", "bad ids")
      )
    )

    await expect(
      replaceTenantPermissions(TENANT_ID, { masterPermissionIds: [999] })
    ).rejects.toMatchObject({ kind: "HTTP", status: 400, code: "VALIDATION_FAILED" })
  })
})

describe("setTenantPermissionEnabled", () => {
  it("sends one PATCH with only enabled, to the permission id path", async () => {
    const calls: Array<{ method: string; path: string; body: unknown }> = []
    server.use(
      http.patch(
        `${API}/tenants/:tenantId/permissions/:permissionId`,
        async ({ request }) => {
          calls.push({
            method: request.method,
            path: new URL(request.url).pathname,
            body: await request.json(),
          })
          return HttpResponse.json({
            data: { ...FIXTURE_TENANT_PERMISSION_BRANCHES, enabled: false },
          })
        }
      )
    )

    const result = await setTenantPermissionEnabled(TENANT_ID, 10, false)

    expect(calls).toEqual([
      {
        method: "PATCH",
        path: `/api/v1/tenants/${TENANT_ID}/permissions/10`,
        body: { enabled: false },
      },
    ])
    expect(result.enabled).toBe(false)
  })
})
