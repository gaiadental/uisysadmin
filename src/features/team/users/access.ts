/**
 * UX gates for the system user actions (ARCH-FE-001 D6.4, D6.6, D4.10). Pure
 * functions, so every gate is tested without a React tree. The backend
 * enforces; these decide only what the UI shows.
 *
 * Own account (`user.id === selfId`): no suspend, deactivate, no role
 * change (D6.6, FE-OQ-25 default), and no sessions tab and no force logout (the own
 * sessions page is used instead, D4.10). The backend has no such guard (SP-BG-13).
 */

import type { SystemUser } from "@/types/system-user"

export const USERS_VIEW = "system_users:view"
export const USERS_CREATE = "system_users:create"
export const USERS_UPDATE = "system_users:update"
export const USERS_RESET_PASSWORD = "system_users:reset_password"
export const ROLES_VIEW = "system_roles:view"
export const SESSIONS_VIEW = "sessions:view"
export const SESSIONS_REVOKE = "sessions:revoke"

/**
 * Other-account sessions are enabled (REQ-FE-032, REQ-FE-052, D4.10;
 * ARCH-FE-001 v1.0.13): SP-BG-14, the system-user sessions endpoint, is Closed.
 */
export const OTHER_ACCOUNT_SESSIONS_ENABLED = true

export interface UserActionAccess {
  readonly isSelf: boolean
  readonly canChangeRole: boolean
  readonly canSuspend: boolean
  readonly canDeactivate: boolean
  readonly canReactivate: boolean
  readonly canResetPassword: boolean
}

function has(permissions: readonly string[], key: string): boolean {
  return permissions.includes(key)
}

/** The create button needs `system_users:create`, and the role dropdown needs the role list. */
export function canCreateUser(permissions: readonly string[]): boolean {
  return has(permissions, USERS_CREATE) && has(permissions, ROLES_VIEW)
}

/** The "Sesi aktif" tab (D4.10). Another account only; the own account links to /account/sessions. */
export function canViewUserSessions(
  permissions: readonly string[],
  isSelf: boolean
): boolean {
  return (
    OTHER_ACCOUNT_SESSIONS_ENABLED && has(permissions, SESSIONS_VIEW) && !isSelf
  )
}

/** Force logout of another user's sessions (D4.10). Never for the own account. */
export function canForceLogout(
  permissions: readonly string[],
  isSelf: boolean
): boolean {
  return (
    OTHER_ACCOUNT_SESSIONS_ENABLED && has(permissions, SESSIONS_REVOKE) && !isSelf
  )
}

/**
 * The actions the user may see on one row or detail page. The status actions
 * depend on the current status: suspend only from ACTIVE, deactivate from
 * ACTIVE or SUSPENDED, reactivate from SUSPENDED or DEACTIVATED (documented
 * default; the server decides the final rule and answers 403 or 4xx).
 */
export function userActionAccess(
  permissions: readonly string[],
  selfId: string | null,
  user: SystemUser
): UserActionAccess {
  const isSelf = selfId !== null && user.id === selfId
  const canUpdate = has(permissions, USERS_UPDATE)
  return {
    isSelf,
    canChangeRole: canUpdate && has(permissions, ROLES_VIEW) && !isSelf,
    canSuspend: canUpdate && !isSelf && user.status === "ACTIVE",
    canDeactivate: canUpdate && !isSelf && user.status !== "DEACTIVATED",
    canReactivate: canUpdate && user.status !== "ACTIVE",
    canResetPassword: has(permissions, USERS_RESET_PASSWORD),
  }
}

/** True when the row or detail shows at least one action button. */
export function hasAnyUserAction(access: UserActionAccess): boolean {
  return (
    access.canChangeRole ||
    access.canSuspend ||
    access.canDeactivate ||
    access.canReactivate ||
    access.canResetPassword
  )
}
