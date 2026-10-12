/**
 * Reference data for joins and selects (ARCH-FE-001 D5.4, D12): tenant
 * categories and countries are loaded once with `limit=100` and cached as
 * server state. A join by id reads the cached list, so the tenant list needs
 * no request per row. Pure lookup helpers sit beside the hooks.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query"

import { listAllCountries } from "@/lib/api/modules/countries"
import { listAllTenantCategories } from "@/lib/api/modules/tenant-categories"
import { queryKeys } from "@/lib/query/keys"
import type { Country } from "@/types/country"
import type { TenantCategory } from "@/types/tenant-category"

/** The reference lists change rarely. Five minutes avoids a refetch on every navigation. */
const REFERENCE_STALE_MS = 5 * 60 * 1000

export function useTenantCategories(): UseQueryResult<
  readonly TenantCategory[]
> {
  return useQuery({
    queryKey: queryKeys.refTenantCategories(),
    queryFn: listAllTenantCategories,
    staleTime: REFERENCE_STALE_MS,
  })
}

export function useCountries(): UseQueryResult<readonly Country[]> {
  return useQuery({
    queryKey: queryKeys.refCountries(),
    queryFn: listAllCountries,
    staleTime: REFERENCE_STALE_MS,
  })
}

/** The category name for an id, or null while the list is not loaded or the id is unknown. */
export function categoryNameOf(
  categories: readonly TenantCategory[] | undefined,
  categoryId: string
): string | null {
  return categories?.find((item) => item.id === categoryId)?.name ?? null
}

/** The country name for a code, or null while the list is not loaded or the code is unknown. */
export function countryNameOf(
  countries: readonly Country[] | undefined,
  countryCode: string
): string | null {
  return countries?.find((item) => item.code === countryCode)?.name ?? null
}
