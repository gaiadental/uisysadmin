/**
 * Whether the role of an account is gone. A role counts as inactive when the
 * role list no longer has it (deleted) or marks it `active: false`. With no
 * role list (not loaded, or no `system_roles:view`) nothing is known, so the
 * answer is false and the UI shows no marker.
 */

import type { SystemRole } from "@/types/system-role"
import type { SystemUser } from "@/types/system-user"

export function isRoleInactive(
  roles: readonly SystemRole[] | undefined,
  user: Pick<SystemUser, "systemRoleId">
): boolean {
  if (roles === undefined) return false
  const role = roles.find((item) => item.id === user.systemRoleId)
  return role === undefined || role.active === false
}
