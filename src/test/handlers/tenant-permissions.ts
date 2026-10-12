/**
 * MSW handlers for the master permission catalogue and the tenant permission
 * endpoints (ARCH-FE-001 D19; ADR-005; FE doc 5.3 and 5.4). Bodies are
 * camelCase and wrapped in `data`. The PUT and PATCH handlers echo a result
 * built from the request, so a test sees the request shape the server expects.
 */

import { http, HttpResponse } from "msw"

import { API } from "./auth"

const STAMP = "2026-10-05T09:30:00Z"

export const FIXTURE_MASTER_PERMISSION_BRANCHES = {
  id: 1,
  key: "branches:view",
  name: "View branches",
  description: "Read branches",
  category: "branches",
  module: "clinic",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_MASTER_PERMISSION_REPORTS = {
  id: 2,
  key: "reports:view",
  name: "View reports",
  description: null,
  category: "reports",
  module: "clinic",
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
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_MASTER_PERMISSIONS = [
  FIXTURE_MASTER_PERMISSION_BRANCHES,
  FIXTURE_MASTER_PERMISSION_REPORTS,
  FIXTURE_MASTER_PERMISSION_USERS,
] as const

export const FIXTURE_TENANT_PERMISSION_BRANCHES = {
  id: 10,
  masterPermissionId: 1,
  masterPermissionKey: "branches:view",
  masterPermissionName: "View branches",
  enabled: true,
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_TENANT_PERMISSION_REPORTS = {
  id: 11,
  masterPermissionId: 2,
  masterPermissionKey: "reports:view",
  masterPermissionName: "View reports",
  enabled: false,
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_TENANT_PERMISSIONS = [
  FIXTURE_TENANT_PERMISSION_BRANCHES,
  FIXTURE_TENANT_PERMISSION_REPORTS,
] as const

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
        data: { ...(current ?? FIXTURE_TENANT_PERMISSION_BRANCHES), enabled: body.enabled },
      })
    }
  ),
]
