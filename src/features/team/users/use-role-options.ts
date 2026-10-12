/**
 * Role options for the user forms (ARCH-FE-001 D6.4, D7). The list comes from
 * GET /api/v1/system-roles, which needs `system_roles:view`, so the query is
 * off without that permission. The same key serves the role label on the
 * detail page.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/auth-provider"
import type { SelectOption } from "@/features/tenants/create/select-field"
import { listSystemRoles } from "@/lib/api/modules/system-roles"
import { queryKeys } from "@/lib/query/keys"
import type { SystemRole } from "@/types/system-role"

import { ROLES_VIEW } from "./access"

export interface RoleOptions {
  readonly enabled: boolean
  readonly query: UseQueryResult<SystemRole[]>
  readonly options: readonly SelectOption[]
}

export function roleLabel(role: SystemRole): string {
  return `${role.name} (${role.key})`
}

export function useRoleOptions(): RoleOptions {
  const { me } = useAuth()
  const enabled = (me?.permissions ?? []).includes(ROLES_VIEW)
  const query = useQuery({
    queryKey: queryKeys.systemRoles.all(),
    queryFn: listSystemRoles,
    enabled,
  })
  const options = (query.data ?? []).map((role) => ({
    value: String(role.id),
    label: roleLabel(role),
  }))
  return { enabled, query, options }
}
