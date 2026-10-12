/**
 * Tenant list filters as URL search params (ARCH-FE-001 D8.1, D10). Pure
 * functions turn the search state into the API parameters. There is no name
 * search: the contract has none (SP-BG-09), so the code filter is an exact match.
 */

import type { DeploymentType, TenantListParams } from "@/types/tenant"
import { DEPLOYMENT_TYPES } from "@/types/tenant"

export const TENANT_PAGE_SIZE = 20

/** The "no filter" sentinel for a select. A select item cannot carry an empty value. */
export const ALL_VALUE = "ALL"

/** Search param defaults. An empty string means no filter. Module-level, so the setter stays stable. */
export const TENANT_SEARCH_DEFAULTS = {
  status: "",
  category: "",
  country: "",
  deployment: "",
  code: "",
  page: "1",
} as const

export type TenantSearch = {
  readonly [K in keyof typeof TENANT_SEARCH_DEFAULTS]: string
}

export const STATUS_OPTIONS = [
  { value: ALL_VALUE, label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
] as const

export const DEPLOYMENT_LABELS: Record<DeploymentType, string> = {
  DEDICATED: "Dedicated",
  MULTI_TENANT: "Multi-tenant",
}

/** A page number from the URL. Anything that is not a positive integer is page 1. */
export function parsePageParam(raw: string): number {
  const value = Number.parseInt(raw, 10)
  return Number.isInteger(value) && value >= 1 ? value : 1
}

function parseDeployment(raw: string): DeploymentType | undefined {
  return DEPLOYMENT_TYPES.find((type) => type === raw)
}

/** The API parameters for a search state. An unknown value is ignored, so a hand-edited URL cannot send it. */
export function toListParams(search: TenantSearch): TenantListParams {
  const params: {
    -readonly [K in keyof TenantListParams]: TenantListParams[K]
  } = { page: parsePageParam(search.page), limit: TENANT_PAGE_SIZE }
  if (search.status === "active") params.isActive = true
  if (search.status === "inactive") params.isActive = false
  const code = search.code.trim()
  if (code !== "") params.code = code
  if (search.category !== "") params.categoryId = search.category
  if (search.country !== "") params.countryCode = search.country
  const deployment = parseDeployment(search.deployment)
  if (deployment !== undefined) params.deploymentType = deployment
  return params
}

/** True when at least one filter is set (the page does not count). */
export function hasActiveFilter(search: TenantSearch): boolean {
  return (
    search.status !== "" ||
    search.category !== "" ||
    search.country !== "" ||
    search.deployment !== "" ||
    search.code.trim() !== ""
  )
}
