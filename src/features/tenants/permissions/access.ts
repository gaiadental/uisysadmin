/**
 * Gates of the tenant Permissions tab (ARCH-FE-001 D6.4, D7). The route needs
 * SYS_PRINCIPAL and both view keys. The save and toggle actions each need one
 * more key. These gates decide what the UI shows. The backend enforces them.
 */

import type { RouteAccess } from "@/app/guards/route-guard"
import { hasPermissions, hasRole } from "@/lib/access/gates"
import { SYS_PRINCIPAL } from "@/lib/access/roles"

export const TENANT_PERMISSIONS_VIEW = "tenant_permissions:view"
export const MASTER_PERMISSIONS_VIEW = "master_permissions:view"
export const TENANT_PERMISSIONS_UPDATE = "tenant_permissions:update"
export const TENANT_PERMISSIONS_ACTIVATE = "tenant_permissions:activate"
export const TENANT_PERMISSIONS_DEACTIVATE = "tenant_permissions:deactivate"

const VIEW_KEYS: readonly string[] = [
  TENANT_PERMISSIONS_VIEW,
  MASTER_PERMISSIONS_VIEW,
]

/** Route access of `/tenants/:id/permissions`: a session, the password rule, the role and both view keys. */
export const TENANT_PERMISSIONS_ACCESS: RouteAccess = {
  kind: "session",
  passwordChange: "enforced",
  gates: [hasRole(SYS_PRINCIPAL), hasPermissions(VIEW_KEYS)],
}

/** True when the permission list has both view keys. The role is checked by the route gate. */
export function canViewTenantPermissions(
  granted: readonly string[]
): boolean {
  return VIEW_KEYS.every((key) => granted.includes(key))
}

/** The key that a toggle to `next` needs (D6.4). */
export function toggleKeyFor(next: boolean): string {
  return next ? TENANT_PERMISSIONS_ACTIVATE : TENANT_PERMISSIONS_DEACTIVATE
}
