/** App path of the tenant Permissions tab (ARCH-FE-001 D7). */

const PERMISSIONS_PATTERN = /^\/tenants\/([^/]+)\/permissions\/?$/

export function permissionsPathOf(tenantId: string): string {
  return `/tenants/${encodeURIComponent(tenantId)}/permissions`
}

/** The tenant id of a `/tenants/:id/permissions` path, or null for any other path. */
export function permissionsTenantIdOfPath(pathname: string): string | null {
  const raw = PERMISSIONS_PATTERN.exec(pathname)?.[1]
  if (raw === undefined) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return null
  }
}
