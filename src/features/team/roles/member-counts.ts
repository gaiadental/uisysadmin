/**
 * Role member counts (ARCH-FE-001 D8.3 Table 2, tim-peran): derived from the
 * system user list, because the roles endpoint has no member count. The same
 * list is the shared `['system','users']` key.
 */

import type { SystemUser } from "@/types/system-user"

/** Number of users per `systemRoleId`. A role with no user is absent from the map. */
export function countMembersByRole(
  users: readonly Pick<SystemUser, "systemRoleId">[]
): ReadonlyMap<number, number> {
  const counts = new Map<number, number>()
  for (const user of users) {
    counts.set(user.systemRoleId, (counts.get(user.systemRoleId) ?? 0) + 1)
  }
  return counts
}
