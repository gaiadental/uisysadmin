/**
 * UX gates for the system role actions (ARCH-FE-001 D6.4, D6.6). Pure
 * functions, so every gate is tested without a React tree. The backend
 * enforces; these decide only what the UI shows.
 *
 * Two protections, kept apart:
 * - Static lock: the role with key SYS_PRINCIPAL offers no edit (so no
 *   deactivate), no delete and no permission change. The backend does not
 *   guard it (SP-BG-13), and one deactivation would lock out every system
 *   administrator. The lock uses the same `SYS_PRINCIPAL` constant as the
 *   master-data gate (`lib/access/roles.ts`).
 * - Refusal-driven disable (fallback, other roles): after the backend refuses
 *   a write with PLATFORM_ROLE_PROTECTED or ROLE_GUARD_VIOLATION, the edit,
 *   delete and permission save of that role are disabled for the session.
 */

import { SYS_PRINCIPAL } from "@/lib/access/roles"
import type { SystemRole } from "@/types/system-role"

export const ROLES_VIEW = "system_roles:view"
export const ROLES_CREATE = "system_roles:create"
export const ROLES_UPDATE = "system_roles:update"
export const ROLES_DELETE = "system_roles:delete"
export const MASTER_PERMISSIONS_VIEW = "master_permissions:view"
export const USERS_VIEW = "system_users:view"

export interface RoleActionAccess {
  /** True for SYS_PRINCIPAL: edit, delete and permission change are not offered. */
  readonly locked: boolean
  /** True after a backend refusal for this role: edit and delete are shown disabled. */
  readonly refused: boolean
  readonly canEdit: boolean
  readonly canDelete: boolean
  /** The checklist can be changed and saved. */
  readonly canEditPermissions: boolean
}

function has(permissions: readonly string[], key: string): boolean {
  return permissions.includes(key)
}

/** True when the role is the statically locked SYS_PRINCIPAL role. */
export function isLockedRole(role: Pick<SystemRole, "key">): boolean {
  return role.key === SYS_PRINCIPAL
}

/** The create button needs `system_roles:create`. */
export function canCreateRole(permissions: readonly string[]): boolean {
  return has(permissions, ROLES_CREATE)
}

/** The Permissions tab and its checklist need the catalogue (`master_permissions:view`). */
export function canViewRoleChecklist(permissions: readonly string[]): boolean {
  return has(permissions, ROLES_VIEW) && has(permissions, MASTER_PERMISSIONS_VIEW)
}

/** Member counts come from the user list (D12.1), which needs `system_users:view`. */
export function canCountMembers(permissions: readonly string[]): boolean {
  return has(permissions, USERS_VIEW)
}

/**
 * What the user may see for one role. `refused` is true when the backend
 * already refused a write for this role in this session.
 */
export function roleActionAccess(
  permissions: readonly string[],
  role: Pick<SystemRole, "key">,
  refused: boolean
): RoleActionAccess {
  const locked = isLockedRole(role)
  const canUpdate = has(permissions, ROLES_UPDATE)
  return {
    locked,
    refused: !locked && refused,
    canEdit: canUpdate && !locked,
    canDelete: has(permissions, ROLES_DELETE) && !locked,
    canEditPermissions:
      canUpdate && has(permissions, MASTER_PERMISSIONS_VIEW) && !locked,
  }
}
