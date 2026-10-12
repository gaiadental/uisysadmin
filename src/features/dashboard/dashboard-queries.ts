/**
 * Dashboard and sidebar read queries (REQ-FE-037; ARCH-FE-001 D7, D12.1).
 * Counts are `pagination.total` of `limit=1` requests, read through the
 * list functions of the tenant, category and country modules.
 *
 * Each query uses the key family of its list (`queryKeys.*.list(filters)`), so
 * the invalidation map of D12.1 (a prefix match on the family) keeps the
 * counts fresh after a write. The filters carry `limit`, so a count entry never
 * equals an entry of the list screens (their page size is 20). The entry
 * holds the same `PageResult` that the list functions return, and the total is
 * read with `select`. A shared key therefore never holds two data shapes.
 *
 * The dashboard and the sidebar call the same hooks, so one request serves both.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query"

import { listCountries } from "@/lib/api/modules/countries"
import { listTenantCategories } from "@/lib/api/modules/tenant-categories"
import { listTenants } from "@/lib/api/modules/tenants"
import { queryKeys } from "@/lib/query/keys"
import type { Country } from "@/types/country"
import type { PageResult, Tenant } from "@/types/tenant"
import type { TenantCategory } from "@/types/tenant-category"

/** The "latest tenants" widget size (FE-OQ-16). */
export const LATEST_TENANTS_LIMIT = 5

/**
 * How long a count is fresh. The value is an implementer default (D12.1 asks
 * for a per-resource value): a write invalidates the count anyway.
 */
export const COUNT_STALE_MS = 30 * 1000

const COUNT_LIMIT = 1

/** The same key shape as the tenant list screen: a missing filter is null. */
function tenantFilters(
  limit: number,
  isActive: boolean | null
): Readonly<Record<string, string | number | boolean | null>> {
  return {
    page: null,
    limit,
    isActive,
    code: null,
    categoryId: null,
    countryCode: null,
    deploymentType: null,
  }
}

function totalOf<T>(result: PageResult<T>): number {
  return result.pagination.total
}

/** Total tenants (`GET /tenants?limit=1`). */
export function useTenantTotal(enabled: boolean): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.tenants.list(tenantFilters(COUNT_LIMIT, null)),
    queryFn: () => listTenants({ limit: COUNT_LIMIT }),
    select: totalOf<Tenant>,
    staleTime: COUNT_STALE_MS,
    enabled,
  })
}

/** Total active tenants (`GET /tenants?is_active=true&limit=1`). */
export function useActiveTenantTotal(
  enabled: boolean
): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.tenants.list(tenantFilters(COUNT_LIMIT, true)),
    queryFn: () => listTenants({ limit: COUNT_LIMIT, isActive: true }),
    select: totalOf<Tenant>,
    staleTime: COUNT_STALE_MS,
    enabled,
  })
}

/** Total tenant categories (`GET /tenant-categories?limit=1`). */
export function useTenantCategoryTotal(
  enabled: boolean
): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.tenantCategories.list({ page: null, limit: COUNT_LIMIT }),
    queryFn: () => listTenantCategories({ limit: COUNT_LIMIT }),
    select: totalOf<TenantCategory>,
    staleTime: COUNT_STALE_MS,
    enabled,
  })
}

/** Total countries (`GET /countries?limit=1`). */
export function useCountryTotal(enabled: boolean): UseQueryResult<number> {
  return useQuery({
    queryKey: queryKeys.countries.list({ page: null, limit: COUNT_LIMIT }),
    queryFn: () => listCountries({ limit: COUNT_LIMIT }),
    select: totalOf<Country>,
    staleTime: COUNT_STALE_MS,
    enabled,
  })
}

/** Tenants in server order (`GET /tenants?limit=5`, FE-OQ-16). */
export function useLatestTenants(
  enabled: boolean
): UseQueryResult<PageResult<Tenant>> {
  return useQuery({
    queryKey: queryKeys.tenants.list(tenantFilters(LATEST_TENANTS_LIMIT, null)),
    queryFn: () => listTenants({ limit: LATEST_TENANTS_LIMIT }),
    staleTime: COUNT_STALE_MS,
    enabled,
  })
}
