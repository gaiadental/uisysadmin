/**
 * Tenant permission endpoints (ARCH-FE-001 D5.3, D6.4; FE doc 5.4). The list
 * is not paginated. PUT replaces the whole set. PATCH toggles one entry. The
 * tenant id and the permission id are path segments, so both are encoded.
 */

import { apiRequest } from "../client"
import {
  TenantPermissionListSchema,
  TenantPermissionSchema,
  type TenantPermission,
  type TenantPermissionsReplaceInput,
} from "@/types/tenant-permission"

import { unwrapData } from "./auth"

function permissionsPathOf(tenantId: string): string {
  return `/api/v1/tenants/${encodeURIComponent(tenantId)}/permissions`
}

/** GET /api/v1/tenants/{tenantId}/permissions. Requires `tenant_permissions:view`. */
export async function listTenantPermissions(
  tenantId: string
): Promise<TenantPermission[]> {
  const body = await apiRequest<unknown>(permissionsPathOf(tenantId), {
    route: "tenantPermissions.list",
  })
  return unwrapData(TenantPermissionListSchema, body)
}

/**
 * PUT /api/v1/tenants/{tenantId}/permissions with `{ masterPermissionIds }`.
 * Full replacement: an id left out is removed. Requires `tenant_permissions:update`.
 */
export async function replaceTenantPermissions(
  tenantId: string,
  input: TenantPermissionsReplaceInput
): Promise<TenantPermission[]> {
  const body = await apiRequest<unknown>(permissionsPathOf(tenantId), {
    method: "PUT",
    body: { masterPermissionIds: [...input.masterPermissionIds] },
    route: "tenantPermissions.replace",
  })
  return unwrapData(TenantPermissionListSchema, body)
}

/**
 * PATCH /api/v1/tenants/{tenantId}/permissions/{id} with `{ enabled }`.
 * Requires `tenant_permissions:activate` when true and `:deactivate` when false.
 */
export async function setTenantPermissionEnabled(
  tenantId: string,
  permissionId: number,
  enabled: boolean
): Promise<TenantPermission> {
  const body = await apiRequest<unknown>(
    `${permissionsPathOf(tenantId)}/${encodeURIComponent(String(permissionId))}`,
    { method: "PATCH", body: { enabled }, route: "tenantPermissions.toggle" }
  )
  return unwrapData(TenantPermissionSchema, body)
}
