/**
 * Query key factory (ARCH-FE-001 D12.1). Each family returns a prefix key or a
 * key with its parameters. Invalidation is a prefix match, so a family's
 * `all()` key covers every list and detail under it.
 */

export type KeyFilters = Readonly<
  Record<string, string | number | boolean | null>
>

export const queryKeys = {
  auth: {
    me: () => ["auth", "me"] as const,
  },
  sessions: {
    own: () => ["sessions", "own"] as const,
  },
  adminSessions: {
    ofUser: (userId: string) => ["admin", "sessions", userId] as const,
  },
  tenants: {
    all: () => ["master", "tenants"] as const,
    list: (filters: KeyFilters) => ["master", "tenants", filters] as const,
    detail: (tenantId: string) => ["master", "tenant", tenantId] as const,
  },
  refTenantCategories: () => ["ref", "tenantCategories"] as const,
  tenantCategories: {
    all: () => ["master", "tenantCategories"] as const,
    list: (filters: KeyFilters) =>
      ["master", "tenantCategories", filters] as const,
  },
  refCountries: () => ["ref", "countries"] as const,
  countries: {
    all: () => ["master", "countries"] as const,
    list: (filters: KeyFilters) => ["master", "countries", filters] as const,
  },
  systemUsers: {
    all: () => ["system", "users"] as const,
    list: (filters: KeyFilters) => ["system", "users", filters] as const,
    detail: (userId: string) => ["system", "user", userId] as const,
  },
  systemRoles: {
    all: () => ["system", "roles"] as const,
    detail: (roleId: number) => ["system", "role", roleId] as const,
  },
  rolePermissions: {
    all: () => ["system", "rolePermissions"] as const,
    ofRole: (roleId: number) => ["system", "rolePermissions", roleId] as const,
  },
  masterPermissions: {
    all: () => ["system", "masterPermissions"] as const,
  },
  tenantPermissions: {
    all: () => ["system", "tenantPermissions"] as const,
    ofTenant: (tenantId: string) =>
      ["system", "tenantPermissions", tenantId] as const,
  },
} as const
