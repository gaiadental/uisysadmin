/**
 * Mutation-to-query invalidation map (ARCH-FE-001 D12.1, REQ-FE-048). Every
 * mutation names one event, and this file is the only place that says which
 * keys it invalidates. A mutation that ends the session clears the whole cache
 * instead (D12.2).
 *
 * `planInvalidation` is pure, so the table is tested without a React tree.
 * `applyInvalidation` runs the plan against a QueryClient.
 */

import type { QueryClient, QueryKey } from "@tanstack/react-query"

import { queryKeys } from "./keys"

export type MutationEvent =
  | { readonly kind: "login" }
  | { readonly kind: "logout" }
  | { readonly kind: "changePassword"; readonly keepCurrentSession: boolean }
  | { readonly kind: "revokeOwnSessions" }
  | { readonly kind: "tenantCreate" }
  | { readonly kind: "tenantPatch"; readonly tenantId: string }
  | { readonly kind: "adminAccountRetry"; readonly tenantId: string }
  | { readonly kind: "tenantCategoryWrite" }
  | { readonly kind: "countryWrite" }
  | { readonly kind: "systemUserWrite"; readonly userId?: string }
  | { readonly kind: "forceLogout"; readonly userId: string }
  | { readonly kind: "systemRoleWrite"; readonly roleId?: number }
  | { readonly kind: "rolePermissionsReplace"; readonly roleId: number }
  | { readonly kind: "masterPermissionWrite" }
  | { readonly kind: "tenantPermissionsWrite"; readonly tenantId: string }

export interface InvalidationPlan {
  /** True when the whole cache is cleared. `keys` is then empty. */
  readonly clearAll: boolean
  /** Prefix keys to invalidate. Each one matches every key that starts with it. */
  readonly keys: ReadonlyArray<QueryKey>
}

const CLEAR_ALL: InvalidationPlan = { clearAll: true, keys: [] }

function invalidate(...keys: ReadonlyArray<QueryKey>): InvalidationPlan {
  return { clearAll: false, keys }
}

/** The D12.1 table, one branch per mutation. */
export function planInvalidation(event: MutationEvent): InvalidationPlan {
  switch (event.kind) {
    case "login":
      return invalidate(queryKeys.auth.me())
    case "logout":
      return CLEAR_ALL
    case "changePassword":
      return event.keepCurrentSession
        ? invalidate(queryKeys.auth.me())
        : CLEAR_ALL
    case "revokeOwnSessions":
      return invalidate(queryKeys.sessions.own())
    case "tenantCreate":
      return invalidate(queryKeys.tenants.all())
    case "tenantPatch":
      return invalidate(
        queryKeys.tenants.detail(event.tenantId),
        queryKeys.tenants.all()
      )
    case "adminAccountRetry":
      return invalidate(queryKeys.tenants.detail(event.tenantId))
    case "tenantCategoryWrite":
      return invalidate(
        queryKeys.tenantCategories.all(),
        queryKeys.refTenantCategories(),
        queryKeys.tenants.all()
      )
    case "countryWrite":
      return invalidate(
        queryKeys.countries.all(),
        queryKeys.refCountries(),
        queryKeys.tenants.all()
      )
    case "systemUserWrite":
      return invalidate(
        ...withOptional(
          [queryKeys.systemUsers.all()],
          event.userId === undefined
            ? undefined
            : queryKeys.systemUsers.detail(event.userId)
        )
      )
    case "forceLogout":
      return invalidate(queryKeys.adminSessions.ofUser(event.userId))
    case "systemRoleWrite":
      return invalidate(
        ...withOptional(
          [queryKeys.systemRoles.all(), queryKeys.systemUsers.all()],
          event.roleId === undefined
            ? undefined
            : queryKeys.systemRoles.detail(event.roleId)
        )
      )
    case "rolePermissionsReplace":
      return invalidate(
        queryKeys.rolePermissions.ofRole(event.roleId),
        queryKeys.systemRoles.detail(event.roleId)
      )
    case "masterPermissionWrite":
      return invalidate(
        queryKeys.masterPermissions.all(),
        queryKeys.tenantPermissions.all(),
        queryKeys.rolePermissions.all()
      )
    case "tenantPermissionsWrite":
      return invalidate(queryKeys.tenantPermissions.ofTenant(event.tenantId))
  }
}

/**
 * Runs the plan. A clear is synchronous. Otherwise every listed prefix is
 * invalidated and the promise resolves when active queries have refetched.
 */
export async function applyInvalidation(
  queryClient: QueryClient,
  event: MutationEvent
): Promise<void> {
  const plan = planInvalidation(event)
  if (plan.clearAll) {
    queryClient.clear()
    return
  }
  await Promise.all(
    plan.keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  )
}

function withOptional(
  base: ReadonlyArray<QueryKey>,
  extra: QueryKey | undefined
): ReadonlyArray<QueryKey> {
  return extra === undefined ? base : [...base, extra]
}
