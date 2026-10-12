/**
 * MSW handlers for the master-data endpoints: tenants, tenant categories and
 * countries (ARCH-FE-001 D19; ADR-005). They follow FE doc section 6 (snake_case,
 * unwrapped, `pagination` on lists), not the mock data in src/data.
 *
 * The list handlers filter and paginate the fixture arrays with the documented
 * query parameters, so a test sees the same request shape the server expects.
 */

import { http, HttpResponse } from "msw"

import { API, errorResponse } from "./auth"

export const FIXTURE_CATEGORY = {
  id: "c91b1adc-675d-4a80-b3b4-05a657cc57d9",
  code: "DENTAL",
  name: "Dental Clinic",
  description: "Klinik gigi",
  is_active: true,
  created_at: "2026-10-01T03:00:00Z",
  created_by: "11111111-1111-4111-8111-111111111111",
  updated_at: "2026-10-01T03:00:00Z",
  updated_by: "11111111-1111-4111-8111-111111111111",
} as const

export const FIXTURE_CATEGORY_GENERAL = {
  ...FIXTURE_CATEGORY,
  id: "5d2e8a4c-1b7f-4e3a-9c60-0f8d2b6a7e14",
  code: "GENERAL",
  name: "General Clinic",
  description: null,
} as const

export const FIXTURE_COUNTRY = {
  code: "ID",
  name: "Indonesia",
  nationality_name: "Indonesian",
  phone_code: "+62",
  is_active: true,
  created_at: "2026-10-01T03:00:00Z",
  created_by: "11111111-1111-4111-8111-111111111111",
  updated_at: "2026-10-01T03:00:00Z",
  updated_by: "11111111-1111-4111-8111-111111111111",
} as const

export const FIXTURE_COUNTRY_SG = {
  ...FIXTURE_COUNTRY,
  code: "SG",
  name: "Singapore",
  nationality_name: "Singaporean",
  phone_code: "+65",
} as const

export const FIXTURE_TENANT = {
  id: "cfab6b98-98cf-4059-bd06-9a1cdf469b41",
  code: "ANDALAS-DEV",
  name: "Klinik Andalas Dev",
  tenant_category_id: FIXTURE_CATEGORY.id,
  country_code: "ID",
  deployment_type: "MULTI_TENANT",
  multi_branch_enabled: true,
  tenant_admin_email: "admin@gaia.com",
  logo_url: null,
  is_active: true,
  created_at: "2026-10-09T02:14:48.418971Z",
  created_by: "11111111-1111-4111-8111-111111111111",
  updated_at: "2026-10-09T02:14:48.418971Z",
  updated_by: "11111111-1111-4111-8111-111111111111",
} as const

export const FIXTURE_TENANT_INACTIVE = {
  ...FIXTURE_TENANT,
  id: "0b7c1d3e-52a4-4f98-8e6d-9a1b2c3d4e5f",
  code: "SMILE",
  name: "Smile Dental Group",
  tenant_category_id: FIXTURE_CATEGORY_GENERAL.id,
  country_code: null,
  deployment_type: "DEDICATED",
  is_active: false,
} as const

/**
 * The live `GET /tenants/{id}` body (TODO-020): the common keys and the nested
 * `tenant_category` and `country`. It has no flat `tenant_category_id` or
 * `country_code`.
 */
export const FIXTURE_TENANT_DETAIL = {
  id: FIXTURE_TENANT.id,
  code: FIXTURE_TENANT.code,
  name: FIXTURE_TENANT.name,
  deployment_type: FIXTURE_TENANT.deployment_type,
  multi_branch_enabled: FIXTURE_TENANT.multi_branch_enabled,
  tenant_admin_email: FIXTURE_TENANT.tenant_admin_email,
  logo_url: FIXTURE_TENANT.logo_url,
  is_active: FIXTURE_TENANT.is_active,
  created_at: FIXTURE_TENANT.created_at,
  created_by: FIXTURE_TENANT.created_by,
  updated_at: FIXTURE_TENANT.updated_at,
  updated_by: FIXTURE_TENANT.updated_by,
  tenant_category: {
    id: FIXTURE_CATEGORY.id,
    code: FIXTURE_CATEGORY.code,
    name: FIXTURE_CATEGORY.name,
  },
  country: { code: "ID", name: "Indonesia", phone_code: "+62" },
  social_links: [
    {
      id: "a1b2c3d4-0000-4000-8000-000000000001",
      platform_name: "instagram",
      url: "https://instagram.com/x",
    },
  ],
} as const

export const FIXTURE_TENANT_CREATED = {
  ...FIXTURE_TENANT,
  default_branch_types: [
    { id: "b1", code: "HEAD_OFFICE", name: "Head Office" },
  ],
  admin_account: {
    status: "CREATED",
    user_id: "9d0e8f7a-1111-4222-8333-444455556666",
    message: "Admin account created.",
    tenant_status_sync: "SYNCED",
  },
} as const

/** Create outcome: the account exists, the sync to auth failed (FE doc 6.3). */
export const FIXTURE_TENANT_CREATED_SYNC_FAILED = {
  ...FIXTURE_TENANT_CREATED,
  admin_account: {
    status: "CREATED",
    user_id: "9d0e8f7a-1111-4222-8333-444455556666",
    message: "Admin account created.",
    tenant_status_sync: "FAILED",
  },
} as const

/** Create outcome: the account was not created (`user_id` null, no sync key). */
export const FIXTURE_TENANT_CREATED_ACCOUNT_FAILED = {
  ...FIXTURE_TENANT_CREATED,
  admin_account: {
    status: "FAILED",
    user_id: null,
    message:
      "Admin account creation failed. Use POST /api/v1/tenants/{id}/admin-account to retry.",
  },
} as const

export const FIXTURE_ADMIN_ACCOUNT_RETRY_SYNC_FAILED = {
  tenant_id: FIXTURE_TENANT.id,
  admin_account: {
    status: "CREATED",
    user_status: "PENDING",
    tenant_status_sync: "FAILED",
  },
} as const

/**
 * Test codes that select a create outcome in the default POST handler. Any
 * other code gets the full success. A test that needs more overrides the
 * handler with `server.use`.
 */
export const CREATE_CODE_SYNC_FAILED = "SYNC-FAILED"
export const CREATE_CODE_ACCOUNT_FAILED = "ACCOUNT-FAILED"
export const CREATE_CODE_DUPLICATE = "DUPLICATE"
export const CREATE_CODE_SECOND_DEDICATED = "SECOND-DEDICATED"

export const FIXTURE_ADMIN_ACCOUNT_RETRY = {
  tenant_id: FIXTURE_TENANT.id,
  admin_account: {
    status: "CREATED",
    user_status: "PENDING",
    tenant_status_sync: "SYNCED",
  },
} as const

/** A master-data list body: `{ data, pagination }` with `total_pages` (FE doc 2.2). */
export function listBody<T>(
  items: readonly T[],
  page = 1,
  limit = 20,
  total: number = items.length
) {
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

/** The page and limit of a list request, with the contract defaults. */
export function pagingOf(url: URL): { page: number; limit: number } {
  return {
    page: Number(url.searchParams.get("page") ?? "1"),
    limit: Number(url.searchParams.get("limit") ?? "20"),
  }
}

/** Cuts one page out of `items` for the request's `page` and `limit`. */
function pageOf<T>(items: readonly T[], url: URL) {
  const { page, limit } = pagingOf(url)
  const start = (page - 1) * limit
  return listBody(items.slice(start, start + limit), page, limit, items.length)
}

const TENANTS: readonly (
  typeof FIXTURE_TENANT | typeof FIXTURE_TENANT_INACTIVE
)[] = [FIXTURE_TENANT, FIXTURE_TENANT_INACTIVE]

export const tenantHandlers = [
  http.get(`${API}/tenants`, ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams
    const matching = TENANTS.filter((tenant) => {
      const isActive = query.get("is_active")
      if (isActive !== null && String(tenant.is_active) !== isActive) {
        return false
      }
      const code = query.get("code")
      if (code !== null && tenant.code !== code) return false
      const categoryId = query.get("category_id")
      if (categoryId !== null && tenant.tenant_category_id !== categoryId) {
        return false
      }
      const countryCode = query.get("country_code")
      if (countryCode !== null && tenant.country_code !== countryCode) {
        return false
      }
      const deployment = query.get("deployment_type")
      return deployment === null || tenant.deployment_type === deployment
    })
    return HttpResponse.json(pageOf(matching, url))
  }),
  http.get(`${API}/tenants/:id`, ({ params }) =>
    params.id === "missing"
      ? errorResponse(404, "RESOURCE_NOT_FOUND", "Tenant not found.")
      : HttpResponse.json(FIXTURE_TENANT_DETAIL)
  ),
  http.post(`${API}/tenants`, async ({ request }) => {
    const body = (await request.json()) as { code?: string }
    switch (body.code) {
      case CREATE_CODE_DUPLICATE:
        return errorResponse(
          409,
          "RESOURCE_CONFLICT",
          "Tenant code already exists."
        )
      case CREATE_CODE_SECOND_DEDICATED:
        return errorResponse(
          400,
          "VALIDATION_ERROR",
          "Only one DEDICATED tenant is allowed per deployment."
        )
      case CREATE_CODE_SYNC_FAILED:
        return HttpResponse.json(FIXTURE_TENANT_CREATED_SYNC_FAILED, {
          status: 201,
        })
      case CREATE_CODE_ACCOUNT_FAILED:
        return HttpResponse.json(FIXTURE_TENANT_CREATED_ACCOUNT_FAILED, {
          status: 201,
        })
      default:
        return HttpResponse.json(FIXTURE_TENANT_CREATED, { status: 201 })
    }
  }),
  // The PATCH answer applies the sent keys to the fixture, like the server does.
  http.patch(`${API}/tenants/:id`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({ ...FIXTURE_TENANT, ...body })
  }),
  http.post(`${API}/tenants/:id/admin-account`, () =>
    HttpResponse.json(FIXTURE_ADMIN_ACCOUNT_RETRY)
  ),
  http.get(`${API}/tenant-categories`, ({ request }) =>
    HttpResponse.json(
      pageOf([FIXTURE_CATEGORY, FIXTURE_CATEGORY_GENERAL], new URL(request.url))
    )
  ),
  http.get(`${API}/countries`, ({ request }) =>
    HttpResponse.json(
      pageOf([FIXTURE_COUNTRY, FIXTURE_COUNTRY_SG], new URL(request.url))
    )
  ),
]
