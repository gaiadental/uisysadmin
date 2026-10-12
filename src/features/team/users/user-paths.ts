/** App paths of the system user screens (ARCH-FE-001 D10). */

export const USER_LIST_PATH = "/system-users"

export function userDetailPathOf(userId: string): string {
  return `/system-users/${encodeURIComponent(userId)}`
}

const DETAIL_PATTERN = /^\/system-users\/([^/]+)\/?$/

/** The user id of a `/system-users/:id` path, or null for any other path. */
export function userIdOfPath(pathname: string): string | null {
  const match = DETAIL_PATTERN.exec(pathname)
  const raw = match?.[1]
  if (raw === undefined) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return null
  }
}
