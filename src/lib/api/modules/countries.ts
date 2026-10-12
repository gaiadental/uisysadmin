/**
 * master-data country reads (ARCH-FE-001 D5.2, D5.4; FE doc 6.2). The path key
 * of a country is its 2-letter code. The tenant list uses `listAllCountries`
 * as a reference loader for joins.
 *
 * Writes take whitelist inputs (D5.3, REQ-FE-040): the update input has no
 * `code`, and the code is the path key. Delete is soft and permanent for the
 * code: a deleted code cannot be reused (409), and a country used by a tenant
 * cannot be deleted (409). Create is not idempotent (SP-BG-11): the caller
 * disables the submit while in flight (TODO-012).
 */

import { apiRequest } from "../client"
import {
  REFERENCE_PAGE_LIMIT,
  appendParams,
  fetchAllPages,
  parseMasterBody,
} from "./tenants"
import {
  CountryWireSchema,
  mapCountry,
  type Country,
  type CountryListParams,
} from "@/types/country"
import {
  listEnvelopeSchema,
  mapPagination,
  type PageResult,
} from "@/types/tenant"

const COUNTRIES_PATH = "/api/v1/countries"

/** D5.3 create whitelist. `code` is two uppercase letters. Empty optional keys are left out. */
export interface CountryCreateInput {
  readonly code: string
  readonly name: string
  readonly nationalityName?: string
  readonly phoneCode?: string
}

/** D5.3 update whitelist. There is no `code`: it is the path key and immutable. */
export interface CountryUpdateInput {
  readonly name: string
  readonly nationalityName?: string
  readonly phoneCode?: string
  readonly isActive: boolean
}

/** GET /api/v1/countries with server pagination. */
export async function listCountries(
  params: CountryListParams = {}
): Promise<PageResult<Country>> {
  const body = await apiRequest<unknown>(
    appendParams(COUNTRIES_PATH, {
      page: params.page,
      limit: params.limit,
      is_active: params.isActive,
      search: params.search,
    }),
    { route: "countries.list" }
  )
  const wire = parseMasterBody(
    listEnvelopeSchema(CountryWireSchema),
    body,
    "countries.list"
  )
  return {
    data: wire.data.map(mapCountry),
    pagination: mapPagination(wire.pagination),
  }
}

/** Reference loader: every country, `limit=100` per page (D5.4). Cached under `ref.countries`. */
export function listAllCountries(): Promise<readonly Country[]> {
  return fetchAllPages((page) =>
    listCountries({ page, limit: REFERENCE_PAGE_LIMIT })
  )
}

/** POST /api/v1/countries. 409 for a taken code, including a deleted one. */
export async function createCountry(input: CountryCreateInput): Promise<Country> {
  const body = await apiRequest<unknown>(COUNTRIES_PATH, {
    method: "POST",
    body: { code: input.code, name: input.name, ...optionalKeys(input) },
    route: "countries.create",
  })
  return mapCountry(parseMasterBody(CountryWireSchema, body, "countries.create"))
}

/** PUT /api/v1/countries/{code}. The code is in the path only, never in the body. */
export async function updateCountry(
  code: string,
  input: CountryUpdateInput
): Promise<Country> {
  const body = await apiRequest<unknown>(
    `${COUNTRIES_PATH}/${encodeURIComponent(code)}`,
    {
      method: "PUT",
      body: { name: input.name, ...optionalKeys(input), is_active: input.isActive },
      route: "countries.update",
    }
  )
  return mapCountry(parseMasterBody(CountryWireSchema, body, "countries.update"))
}

/** DELETE /api/v1/countries/{code}. 204 on success, 409 when used by a tenant. */
export async function deleteCountry(code: string): Promise<void> {
  await apiRequest<void>(`${COUNTRIES_PATH}/${encodeURIComponent(code)}`, {
    method: "DELETE",
    route: "countries.delete",
  })
}

/** `nationality_name` and `phone_code` are sent only when filled (never as null). */
function optionalKeys(input: {
  readonly nationalityName?: string
  readonly phoneCode?: string
}): Record<string, string> {
  const keys: Record<string, string> = {}
  if (input.nationalityName !== undefined && input.nationalityName !== "") {
    keys.nationality_name = input.nationalityName
  }
  if (input.phoneCode !== undefined && input.phoneCode !== "") {
    keys.phone_code = input.phoneCode
  }
  return keys
}
