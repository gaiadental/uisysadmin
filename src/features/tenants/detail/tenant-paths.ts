/** App paths of the tenant screens (ARCH-FE-001 D10). */

export const TENANT_LIST_PATH = "/tenants"

export function detailPathOf(tenantId: string): string {
  return `/tenants/${encodeURIComponent(tenantId)}`
}

const DETAIL_PATTERN = /^\/tenants\/([^/]+)\/?$/

/** The tenant id of a `/tenants/:id` path, or null for any other path. */
export function tenantIdOfPath(pathname: string): string | null {
  const match = DETAIL_PATTERN.exec(pathname)
  const raw = match?.[1]
  if (raw === undefined) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return null
  }
}
