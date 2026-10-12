/**
 * master-data tenant category reads (ARCH-FE-001 D5.2, D5.4; FE doc 6.1). The
 * tenant list uses `listAllTenantCategories` as a reference loader for joins.
 *
 * Writes take whitelist inputs (D5.3, REQ-FE-040): the update input has no
 * `code`, so an immutable field cannot be sent. The body builders list the
 * keys one by one, so a stray property on a loosely typed caller is dropped.
 * Create is not idempotent by contract (SP-BG-11): the caller disables the
 * submit while in flight and never retries automatically (TODO-012).
 */

import { apiRequest } from "../client"
import {
  REFERENCE_PAGE_LIMIT,
  appendParams,
  fetchAllPages,
  parseMasterBody,
} from "./tenants"
import {
  TenantCategoryWireSchema,
  mapTenantCategory,
  type TenantCategory,
  type TenantCategoryListParams,
} from "@/types/tenant-category"
import {
  listEnvelopeSchema,
  mapPagination,
  type PageResult,
} from "@/types/tenant"

const CATEGORIES_PATH = "/api/v1/tenant-categories"

/** D5.3 create whitelist. `description` is left out of the body when empty. */
export interface TenantCategoryCreateInput {
  readonly code: string
  readonly name: string
  readonly description?: string
}

/** D5.3 update whitelist. There is no `code`: it is immutable after create (REQ-FE-028). */
export interface TenantCategoryUpdateInput {
  readonly name: string
  readonly description?: string
  readonly isActive: boolean
}

/** GET /api/v1/tenant-categories with server pagination. */
export async function listTenantCategories(
  params: TenantCategoryListParams = {}
): Promise<PageResult<TenantCategory>> {
  const body = await apiRequest<unknown>(
    appendParams(CATEGORIES_PATH, {
      page: params.page,
      limit: params.limit,
      is_active: params.isActive,
      code: params.code,
    }),
    { route: "tenantCategories.list" }
  )
  const wire = parseMasterBody(
    listEnvelopeSchema(TenantCategoryWireSchema),
    body,
    "tenantCategories.list"
  )
  return {
    data: wire.data.map(mapTenantCategory),
    pagination: mapPagination(wire.pagination),
  }
}

/** Reference loader: every category, `limit=100` per page (D5.4). Cached under `ref.tenantCategories`. */
export function listAllTenantCategories(): Promise<readonly TenantCategory[]> {
  return fetchAllPages((page) =>
    listTenantCategories({ page, limit: REFERENCE_PAGE_LIMIT })
  )
}

/** POST /api/v1/tenant-categories. 409 for a taken code or name. */
export async function createTenantCategory(
  input: TenantCategoryCreateInput
): Promise<TenantCategory> {
  const body = await apiRequest<unknown>(CATEGORIES_PATH, {
    method: "POST",
    body: toCreateBody(input),
    route: "tenantCategories.create",
  })
  return mapTenantCategory(
    parseMasterBody(TenantCategoryWireSchema, body, "tenantCategories.create")
  )
}

/** PUT /api/v1/tenant-categories/{id}. Never sends `code` (FIELD_IMMUTABLE). */
export async function updateTenantCategory(
  categoryId: string,
  input: TenantCategoryUpdateInput
): Promise<TenantCategory> {
  const body = await apiRequest<unknown>(
    `${CATEGORIES_PATH}/${encodeURIComponent(categoryId)}`,
    { method: "PUT", body: toUpdateBody(input), route: "tenantCategories.update" }
  )
  return mapTenantCategory(
    parseMasterBody(TenantCategoryWireSchema, body, "tenantCategories.update")
  )
}

/** DELETE /api/v1/tenant-categories/{id}. 204 on success, 409 when a tenant uses it. */
export async function deleteTenantCategory(categoryId: string): Promise<void> {
  await apiRequest<void>(`${CATEGORIES_PATH}/${encodeURIComponent(categoryId)}`, {
    method: "DELETE",
    route: "tenantCategories.delete",
  })
}

function toCreateBody(input: TenantCategoryCreateInput): Record<string, unknown> {
  const body: Record<string, unknown> = { code: input.code, name: input.name }
  if (input.description !== undefined && input.description !== "") {
    body.description = input.description
  }
  return body
}

function toUpdateBody(input: TenantCategoryUpdateInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: input.name,
    is_active: input.isActive,
  }
  if (input.description !== undefined && input.description !== "") {
    body.description = input.description
  }
  return body
}
