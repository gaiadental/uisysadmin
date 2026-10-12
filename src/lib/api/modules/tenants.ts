/**
 * master-data tenant endpoints (ARCH-FE-001 D5.2 to D5.5, D8.1; FE doc 6.3).
 * The wire is snake_case and unwrapped. Each function sends one request
 * through `apiRequest`, validates the body with a Zod 4 schema and maps it to
 * the camelCase model with an explicit mapper. A mismatch throws CONTRACT.
 *
 * Writes take whitelist inputs (D5.3). There is no delete: the contract
 * answers 405, so the module has no function for it.
 *
 * The helpers `parseMasterBody`, `appendParams` and `fetchAllPages` are shared
 * with the category and country modules.
 */

import { z } from "zod"

import { apiRequest } from "../client"
import { contractError } from "../errors"
import {
  AdminAccountRetryWireSchema,
  TenantCreatedWireSchema,
  TenantDetailWireSchema,
  TenantWireSchema,
  listEnvelopeSchema,
  mapAdminAccountRetry,
  mapPagination,
  mapTenant,
  mapTenantCreated,
  mapTenantDetail,
  type AdminAccountRetry,
  type PageResult,
  type Tenant,
  type TenantCreateInput,
  type TenantCreated,
  type TenantDetail,
  type TenantListParams,
  type TenantPatchInput,
} from "@/types/tenant"

const TENANTS_PATH = "/api/v1/tenants"

/** D5.4: reference lists are fetched with the largest page the contract allows. */
export const REFERENCE_PAGE_LIMIT = 100

type QueryValue = string | number | boolean | undefined

/**
 * Validates a response body (D5.5). A mismatch is a CONTRACT error. In
 * development the module name and the failing key paths are logged, never the
 * body (D13, REQ-FE-046).
 */
export function parseMasterBody<T>(
  schema: z.ZodType<T>,
  body: unknown,
  moduleName: string
): T {
  const parsed = schema.safeParse(body)
  if (parsed.success) return parsed.data
  if (import.meta.env.DEV) {
    const paths = parsed.error.issues.map((issue) => issue.path.join("."))
    console.error("[contract]", { module: moduleName, keys: paths })
  }
  throw contractError(null, null)
}

/** Builds `?a=1&b=2`. A key with an undefined or empty value is left out. */
export function appendParams(
  path: string,
  params: Readonly<Record<string, QueryValue>>
): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    query.set(key, String(value))
  }
  const text = query.toString()
  return text === "" ? path : `${path}?${text}`
}

/**
 * Fetches a reference list with `limit=100`, then every other page when
 * `pagination.total` is above 100 (D5.4). Pages run one after another.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PageResult<T>>
): Promise<readonly T[]> {
  const first = await fetchPage(1)
  const items: T[] = [...first.data]
  for (let page = 2; page <= first.pagination.totalPages; page += 1) {
    const next = await fetchPage(page)
    items.push(...next.data)
  }
  return items
}

/** GET /api/v1/tenants with server pagination and the documented filters (D8.1). */
export async function listTenants(
  params: TenantListParams = {}
): Promise<PageResult<Tenant>> {
  const body = await apiRequest<unknown>(
    appendParams(TENANTS_PATH, {
      page: params.page,
      limit: params.limit,
      is_active: params.isActive,
      code: params.code,
      category_id: params.categoryId,
      country_code: params.countryCode,
      deployment_type: params.deploymentType,
    }),
    { route: "tenants.list" }
  )
  const wire = parseMasterBody(
    listEnvelopeSchema(TenantWireSchema),
    body,
    "tenants.list"
  )
  return { data: wire.data.map(mapTenant), pagination: mapPagination(wire.pagination) }
}

/** GET /api/v1/tenants/{id}. */
export async function getTenant(tenantId: string): Promise<TenantDetail> {
  const body = await apiRequest<unknown>(
    `${TENANTS_PATH}/${encodeURIComponent(tenantId)}`,
    { route: "tenants.get" }
  )
  return mapTenantDetail(
    parseMasterBody(TenantDetailWireSchema, body, "tenants.get")
  )
}

/**
 * POST /api/v1/tenants. The response is 201 in every outcome, and the tenant
 * exists even when the admin account failed (D8.2). Not idempotent by
 * contract (SP-BG-11): the caller disables the submit while in flight and
 * never retries automatically.
 */
export async function createTenant(
  input: TenantCreateInput
): Promise<TenantCreated> {
  const body = await apiRequest<unknown>(TENANTS_PATH, {
    method: "POST",
    body: toCreateBody(input),
    route: "tenants.create",
  })
  return mapTenantCreated(
    parseMasterBody(TenantCreatedWireSchema, body, "tenants.create")
  )
}

/** PATCH /api/v1/tenants/{id}. Sends only the keys present in the input (D5.3). */
export async function patchTenant(
  tenantId: string,
  input: TenantPatchInput
): Promise<Tenant> {
  const body = await apiRequest<unknown>(
    `${TENANTS_PATH}/${encodeURIComponent(tenantId)}`,
    { method: "PATCH", body: toPatchBody(input), route: "tenants.patch" }
  )
  return mapTenant(parseMasterBody(TenantWireSchema, body, "tenants.patch"))
}

/**
 * POST /api/v1/tenants/{id}/admin-account, with no body. Safe to repeat by
 * contract (FE doc 6.3). Never called automatically.
 */
export async function retryAdminAccount(
  tenantId: string
): Promise<AdminAccountRetry> {
  const body = await apiRequest<unknown>(
    `${TENANTS_PATH}/${encodeURIComponent(tenantId)}/admin-account`,
    { method: "POST", route: "tenants.adminAccountRetry" }
  )
  return mapAdminAccountRetry(
    parseMasterBody(
      AdminAccountRetryWireSchema,
      body,
      "tenants.adminAccountRetry"
    )
  )
}

/** The create body lists the whitelist keys one by one. Optional keys are omitted when empty. */
function toCreateBody(input: TenantCreateInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    code: input.code,
    name: input.name,
    tenant_category_id: input.tenantCategoryId,
    deployment_type: input.deploymentType,
    multi_branch_enabled: input.multiBranchEnabled,
    tenant_admin_email: input.tenantAdminEmail,
  }
  if (input.countryCode !== undefined && input.countryCode !== "") {
    body.country_code = input.countryCode
  }
  if (input.logoUrl !== undefined && input.logoUrl !== "") {
    body.logo_url = input.logoUrl
  }
  return body
}

/**
 * The patch body copies the three whitelist keys only, so a stray property on
 * a loosely typed caller (a spread form value, for example) is never sent.
 */
function toPatchBody(input: TenantPatchInput): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (input.isActive !== undefined) body.is_active = input.isActive
  if (input.logoUrl !== undefined) body.logo_url = input.logoUrl
  if (input.countryCode !== undefined) body.country_code = input.countryCode
  return body
}
