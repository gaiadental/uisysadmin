/** App paths of the system role screens (ARCH-FE-001 D10). */

export const ROLE_LIST_PATH = "/system-roles"

export function roleDetailPathOf(roleId: number): string {
  return `/system-roles/${encodeURIComponent(String(roleId))}`
}

const DETAIL_PATTERN = /^\/system-roles\/(\d+)\/?$/

/** The role id of a `/system-roles/:id` path, or null for any other path (role ids are integers). */
export function roleIdOfPath(pathname: string): number | null {
  const raw = DETAIL_PATTERN.exec(pathname)?.[1]
  if (raw === undefined) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) ? id : null
}
