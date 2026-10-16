/**
 * MSW handlers for the master permission catalogue and the tenant permission
 * endpoints (ARCH-FE-001 D19; ADR-005; FE doc 5.3 and 5.4). Bodies are
 * camelCase and wrapped in `data`. The PUT and PATCH handlers echo a result
 * built from the request, so a test sees the request shape the server expects.
 * Every catalogue fixture carries the required `scope` (REQ-FE-057): the
 * clinic fixtures are TENANT, the system user fixture is PLATFORM.
 */

import { http, HttpResponse } from "msw"

import { API } from "./auth"

const STAMP = "2026-10-05T09:30:00Z"

export const FIXTURE_MASTER_PERMISSION_APPOINTMENT = {
  id: 1,
  key: "appointment:view",
  name: "View appointments",
  description: "Read appointments",
  category: "appointment",
  module: "clinic",
  scope: "TENANT",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

// Alias kept so the unchanged src/test/handlers/catalog.ts compiles; its default data is the appointment fixture.
export const FIXTURE_MASTER_PERMISSION_BRANCHES = FIXTURE_MASTER_PERMISSION_APPOINTMENT

export const FIXTURE_MASTER_PERMISSION_PATIENT_PROFILE = {
  id: 2,
  key: "patient_profile:view",
  name: "View patient profile",
  description: null,
  category: "patient_profile",
  module: "clinic",
  scope: "TENANT",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_MASTER_PERMISSION_USERS = {
  id: 3,
  key: "system_users:view",
  name: "View system users",
  description: "Read users",
  category: "system_users",
  module: "auth",
  scope: "PLATFORM",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_MASTER_PERMISSIONS = [
  FIXTURE_MASTER_PERMISSION_APPOINTMENT,
  FIXTURE_MASTER_PERMISSION_PATIENT_PROFILE,
  FIXTURE_MASTER_PERMISSION_USERS,
] as const

export const FIXTURE_TENANT_PERMISSION_APPOINTMENT = {
  id: 10,
  masterPermissionId: 1,
  masterPermissionKey: "appointment:view",
  masterPermissionName: "View appointments",
  enabled: true,
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_TENANT_PERMISSION_PATIENT_PROFILE = {
  id: 11,
  masterPermissionId: 2,
  masterPermissionKey: "patient_profile:view",
  masterPermissionName: "View patient profile",
  enabled: false,
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_TENANT_PERMISSIONS = [
  FIXTURE_TENANT_PERMISSION_APPOINTMENT,
  FIXTURE_TENANT_PERMISSION_PATIENT_PROFILE,
] as const

/**
 * GET /master-permissions with every fixture marked with one scope. The shared
 * fixture mixes both scopes, so the role tests answer PLATFORM and the tenant
 * tests answer TENANT (REQ-FE-057); each tab then shows the rows it is about.
 */
export function catalogueWithScope(scope: "PLATFORM" | "TENANT") {
  return http.get(`${API}/master-permissions`, () =>
    HttpResponse.json({
      data: FIXTURE_MASTER_PERMISSIONS.map((item) => ({ ...item, scope })),
    })
  )
}

export const tenantPermissionHandlers = [
  http.get(`${API}/master-permissions`, () =>
    HttpResponse.json({ data: FIXTURE_MASTER_PERMISSIONS })
  ),
  http.get(`${API}/tenants/:tenantId/permissions`, () =>
    HttpResponse.json({ data: FIXTURE_TENANT_PERMISSIONS })
  ),
  http.put(
    `${API}/tenants/:tenantId/permissions`,
    async ({ request }) => {
      const body = (await request.json()) as { masterPermissionIds: number[] }
      const data = body.masterPermissionIds.map((masterPermissionId, index) => {
        const master = FIXTURE_MASTER_PERMISSIONS.find(
          (item) => item.id === masterPermissionId
        )
        return {
          id: 100 + index,
          masterPermissionId,
          masterPermissionKey: master?.key ?? "unknown:view",
          masterPermissionName: master?.name ?? "Unknown",
          enabled: true,
          createdAt: STAMP,
          updatedAt: STAMP,
        }
      })
      return HttpResponse.json({ data })
    }
  ),
  http.patch(
    `${API}/tenants/:tenantId/permissions/:permissionId`,
    async ({ request, params }) => {
      const body = (await request.json()) as { enabled: boolean }
      const current = FIXTURE_TENANT_PERMISSIONS.find(
        (item) => String(item.id) === params.permissionId
      )
      return HttpResponse.json({
        data: { ...(current ?? FIXTURE_TENANT_PERMISSION_APPOINTMENT), enabled: body.enabled },
      })
    }
  ),
]
