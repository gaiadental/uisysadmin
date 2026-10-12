import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { isFormValidationError } from "@/features/tenants/shared/errors"
import {
  API,
  errorResponse,
} from "@/test/handlers/auth"
import {
  FIXTURE_ADMIN_ACCOUNT_RETRY,
  FIXTURE_CATEGORY,
  FIXTURE_TENANT,
  FIXTURE_TENANT_CREATED,
  FIXTURE_TENANT_DETAIL,
  FIXTURE_TENANT_INACTIVE,
  listBody,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"
import type {
  TenantCreateInput,
  TenantPatchInput,
} from "@/types/tenant"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import * as tenantsModule from "./tenants"
import {
  createTenant,
  getTenant,
  listTenants,
  patchTenant,
  retryAdminAccount,
} from "./tenants"

const BASE_URL = "http://sp.test"
const TENANT_ID = FIXTURE_TENANT.id

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  setAccessToken(null)
})

async function failureOf(run: () => Promise<unknown>): Promise<ApiError> {
  try {
    await run()
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error("Expected the call to fail with an ApiError.")
}

const CREATE_INPUT: TenantCreateInput = {
  code: "SMILE",
  name: "Smile Dental Group",
  tenantCategoryId: FIXTURE_CATEGORY.id,
  deploymentType: "MULTI_TENANT",
  multiBranchEnabled: true,
  tenantAdminEmail: "admin@smiledental.example.com",
}

describe("listTenants mapper (D5.2)", () => {
  it("maps every field of the tenant object to camelCase and the pagination block", async () => {
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(listBody([FIXTURE_TENANT_INACTIVE], 1, 20, 1))
      )
    )

    const result = await listTenants()

    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    })
    expect(result.data).toEqual([
      {
        id: FIXTURE_TENANT_INACTIVE.id,
        code: "SMILE",
        name: "Smile Dental Group",
        tenantCategoryId: FIXTURE_TENANT_INACTIVE.tenant_category_id,
        countryCode: null,
        deploymentType: "DEDICATED",
        multiBranchEnabled: true,
        tenantAdminEmail: "admin@gaia.com",
        logoUrl: null,
        isActive: false,
        createdAt: FIXTURE_TENANT_INACTIVE.created_at,
        createdBy: FIXTURE_TENANT_INACTIVE.created_by,
        updatedAt: FIXTURE_TENANT_INACTIVE.updated_at,
        updatedBy: FIXTURE_TENANT_INACTIVE.updated_by,
      },
    ])
  })

  it("ignores unknown keys", async () => {
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(
          listBody([{ ...FIXTURE_TENANT, future_field: "x" }], 1, 20, 1)
        )
      )
    )

    const result = await listTenants()

    expect(result.data[0]).not.toHaveProperty("future_field")
    expect(result.data[0]).not.toHaveProperty("futureField")
  })

  it("rejects a tenant with a missing required key as CONTRACT, and logs the key but not the body", async () => {
    const withoutActive: Record<string, unknown> = { ...FIXTURE_TENANT }
    delete withoutActive.is_active
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(listBody([withoutActive], 1, 20, 1))
      )
    )

    const error = await failureOf(() => listTenants())

    expect(error.kind).toBe("CONTRACT")
    expect(error.code).toBe("CONTRACT")
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).toContain("tenants.list")
    expect(logged).toContain("is_active")
    expect(logged).not.toContain(FIXTURE_TENANT.tenant_admin_email)
  })

  it("rejects a list body without a pagination block as CONTRACT", async () => {
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json({ data: [FIXTURE_TENANT] })
      )
    )

    expect((await failureOf(() => listTenants())).kind).toBe("CONTRACT")
  })

  it("rejects an unknown deployment type as CONTRACT", async () => {
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(
          listBody([{ ...FIXTURE_TENANT, deployment_type: "SHARED" }], 1, 20, 1)
        )
      )
    )

    expect((await failureOf(() => listTenants())).kind).toBe("CONTRACT")
  })
})

describe("listTenants request (D5.4, D8.1)", () => {
  function captureListUrl(): { url: () => URL } {
    let seen: URL | null = null
    server.use(
      http.get(`${API}/tenants`, ({ request }) => {
        seen = new URL(request.url)
        return HttpResponse.json(listBody([], 1, 20, 0))
      })
    )
    return {
      url: () => {
        if (seen === null) throw new Error("No request was captured.")
        return seen
      },
    }
  }

  it("sends page, limit and every documented filter in snake_case", async () => {
    const capture = captureListUrl()

    await listTenants({
      page: 2,
      limit: 20,
      isActive: false,
      code: "SMILE",
      categoryId: FIXTURE_CATEGORY.id,
      countryCode: "SG",
      deploymentType: "DEDICATED",
    })

    const query = capture.url().searchParams
    expect(Object.fromEntries(query)).toEqual({
      page: "2",
      limit: "20",
      is_active: "false",
      code: "SMILE",
      category_id: FIXTURE_CATEGORY.id,
      country_code: "SG",
      deployment_type: "DEDICATED",
    })
  })

  it("sends no query string when there are no params, and never a name filter", async () => {
    const capture = captureListUrl()

    await listTenants({})

    expect(capture.url().search).toBe("")
  })

  it("leaves an empty filter out of the query", async () => {
    const capture = captureListUrl()

    await listTenants({ code: "", countryCode: "" })

    expect(capture.url().search).toBe("")
  })
})

describe("getTenant", () => {
  it("maps the detail, with the joined category and country", async () => {
    const detail = await getTenant(TENANT_ID)

    expect(detail.tenantCategory).toEqual({
      id: FIXTURE_CATEGORY.id,
      code: "DENTAL",
      name: "Dental Clinic",
    })
    expect(detail.country).toEqual({
      code: "ID",
      name: "Indonesia",
      phoneCode: "+62",
    })
    expect(detail.socialLinks).toEqual([
      {
        id: "a1b2c3d4-0000-4000-8000-000000000001",
        platformName: "instagram",
        url: "https://instagram.com/x",
      },
    ])
  })

  it("accepts a null country", async () => {
    server.use(
      http.get(`${API}/tenants/:id`, () =>
        HttpResponse.json({ ...FIXTURE_TENANT_DETAIL, country: null })
      )
    )

    expect((await getTenant(TENANT_ID)).country).toBeNull()
  })

  it("reports a detail without its category as CONTRACT", async () => {
    const withoutCategory: Record<string, unknown> = {
      ...FIXTURE_TENANT_DETAIL,
    }
    delete withoutCategory.tenant_category
    server.use(
      http.get(`${API}/tenants/:id`, () => HttpResponse.json(withoutCategory))
    )

    expect((await failureOf(() => getTenant(TENANT_ID))).kind).toBe("CONTRACT")
  })

  it("surfaces a 404 as an ApiError with the server code", async () => {
    server.use(
      http.get(`${API}/tenants/:id`, () =>
        errorResponse(404, "RESOURCE_NOT_FOUND", "Tenant not found.")
      )
    )

    const error = await failureOf(() => getTenant(TENANT_ID))

    expect(error.status).toBe(404)
    expect(error.code).toBe("RESOURCE_NOT_FOUND")
  })
})

describe("tenant category and country keys (TODO-020)", () => {
  it("accepts a nested-only detail with a null country and maps the category id", async () => {
    expect(FIXTURE_TENANT_DETAIL).not.toHaveProperty("tenant_category_id")
    expect(FIXTURE_TENANT_DETAIL).not.toHaveProperty("country_code")
    server.use(
      http.get(`${API}/tenants/:id`, () =>
        HttpResponse.json({ ...FIXTURE_TENANT_DETAIL, country: null })
      )
    )

    const detail = await getTenant(TENANT_ID)

    expect(detail.tenantCategoryId).toBe(FIXTURE_CATEGORY.id)
    expect(detail.countryCode).toBeNull()
    expect(detail.country).toBeNull()
  })

  it("maps countryCode from country.code when the detail has a country", async () => {
    server.use(
      http.get(`${API}/tenants/:id`, () =>
        HttpResponse.json({
          ...FIXTURE_TENANT_DETAIL,
          country: { code: "SG", name: "Singapore", phone_code: "+65" },
        })
      )
    )

    const detail = await getTenant(TENANT_ID)

    expect(detail.countryCode).toBe("SG")
    expect(detail.country).toEqual({
      code: "SG",
      name: "Singapore",
      phoneCode: "+65",
    })
  })

  it("still maps the flat tenant_category_id and country_code on create and list", async () => {
    server.use(
      http.post(`${API}/tenants`, () =>
        HttpResponse.json(FIXTURE_TENANT_CREATED, { status: 201 })
      ),
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(listBody([FIXTURE_TENANT], 1, 20, 1))
      )
    )

    const created = await createTenant(CREATE_INPUT)
    const listed = await listTenants()

    expect(created.tenantCategoryId).toBe(FIXTURE_CATEGORY.id)
    expect(created.countryCode).toBe("ID")
    expect(listed.data[0]?.tenantCategoryId).toBe(FIXTURE_CATEGORY.id)
    expect(listed.data[0]?.countryCode).toBe("ID")
  })

  it("keeps the flat keys required on create: a body without tenant_category_id is CONTRACT", async () => {
    const withoutCategory: Record<string, unknown> = {
      ...FIXTURE_TENANT_CREATED,
    }
    delete withoutCategory.tenant_category_id
    server.use(
      http.post(`${API}/tenants`, () =>
        HttpResponse.json(withoutCategory, { status: 201 })
      )
    )

    expect((await failureOf(() => createTenant(CREATE_INPUT))).kind).toBe(
      "CONTRACT"
    )
  })
})

describe("createTenant (D5.3, D8.2)", () => {
  it("sends the whitelist keys in snake_case and omits empty optional fields", async () => {
    let sent: unknown = null
    server.use(
      http.post(`${API}/tenants`, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(FIXTURE_TENANT_CREATED, { status: 201 })
      })
    )

    await createTenant({ ...CREATE_INPUT, countryCode: "", logoUrl: "" })

    expect(sent).toEqual({
      code: "SMILE",
      name: "Smile Dental Group",
      tenant_category_id: FIXTURE_CATEGORY.id,
      deployment_type: "MULTI_TENANT",
      multi_branch_enabled: true,
      tenant_admin_email: "admin@smiledental.example.com",
    })
  })

  it("sends the optional country and logo when set", async () => {
    let sent: Record<string, unknown> = {}
    server.use(
      http.post(`${API}/tenants`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(FIXTURE_TENANT_CREATED, { status: 201 })
      })
    )

    await createTenant({
      ...CREATE_INPUT,
      countryCode: "ID",
      logoUrl: "https://smiledental.example.com/logo.png",
    })

    expect(sent.country_code).toBe("ID")
    expect(sent.logo_url).toBe("https://smiledental.example.com/logo.png")
  })

  it("maps the admin account and does not map default_branch_types", async () => {
    const created = await createTenant(CREATE_INPUT)

    expect(created.adminAccount).toEqual({
      status: "CREATED",
      userId: "9d0e8f7a-1111-4222-8333-444455556666",
      message: "Admin account created.",
      tenantStatusSync: "SYNCED",
    })
    expect(created).not.toHaveProperty("defaultBranchTypes")
    expect(created).not.toHaveProperty("default_branch_types")
  })

  it("maps a failed admin account, where the sync key is absent", async () => {
    server.use(
      http.post(`${API}/tenants`, () =>
        HttpResponse.json(
          {
            ...FIXTURE_TENANT_CREATED,
            admin_account: {
              status: "FAILED",
              user_id: null,
              message: "Admin account creation failed.",
            },
          },
          { status: 201 }
        )
      )
    )

    const created = await createTenant(CREATE_INPUT)

    expect(created.adminAccount.status).toBe("FAILED")
    expect(created.adminAccount.userId).toBeNull()
    expect(created.adminAccount.tenantStatusSync).toBeNull()
  })

  it("surfaces 409 RESOURCE_CONFLICT with its status and code", async () => {
    server.use(
      http.post(`${API}/tenants`, () =>
        errorResponse(409, "RESOURCE_CONFLICT", "Tenant code already exists.")
      )
    )

    const error = await failureOf(() => createTenant(CREATE_INPUT))

    expect(error.status).toBe(409)
    expect(error.code).toBe("RESOURCE_CONFLICT")
  })
})

describe("patchTenant whitelist (D5.3, REQ-FE-040)", () => {
  function capturePatchBody(): { body: () => unknown } {
    let sent: unknown = null
    server.use(
      http.patch(`${API}/tenants/:id`, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(FIXTURE_TENANT)
      })
    )
    return { body: () => sent }
  }

  it("sends only the keys that were given, in snake_case", async () => {
    const capture = capturePatchBody()

    await patchTenant(TENANT_ID, { isActive: false })

    expect(capture.body()).toEqual({ is_active: false })
  })

  it("sends null to clear the logo and the country", async () => {
    const capture = capturePatchBody()

    await patchTenant(TENANT_ID, { logoUrl: null, countryCode: null })

    expect(capture.body()).toEqual({ logo_url: null, country_code: null })
  })

  it("does not send a key that is undefined", async () => {
    const capture = capturePatchBody()

    await patchTenant(TENANT_ID, { logoUrl: "https://cdn.example.com/new.png" })

    expect(capture.body()).toEqual({ logo_url: "https://cdn.example.com/new.png" })
  })

  it("drops an immutable key that reaches the module through a loosely typed caller", async () => {
    const capture = capturePatchBody()
    const loose = { isActive: true, code: "HACK", name: "x" }

    await patchTenant(TENANT_ID, loose)

    expect(capture.body()).toEqual({ is_active: true })
  })

  it("does not compile an immutable field in the patch type", () => {
    const allowed: TenantPatchInput = {
      isActive: true,
      logoUrl: null,
      countryCode: "ID",
    }
    expect(Object.keys(allowed)).toHaveLength(3)

    // @ts-expect-error code is immutable and is not in the patch whitelist
    const withCode: TenantPatchInput = { code: "X" }
    // @ts-expect-error name is immutable and is not in the patch whitelist
    const withName: TenantPatchInput = { name: "X" }
    // @ts-expect-error tenantCategoryId is immutable and is not in the patch whitelist
    const withCategory: TenantPatchInput = { tenantCategoryId: "X" }
    // @ts-expect-error deploymentType is immutable and is not in the patch whitelist
    const withDeployment: TenantPatchInput = { deploymentType: "DEDICATED" }
    // @ts-expect-error multiBranchEnabled is immutable and is not in the patch whitelist
    const withBranch: TenantPatchInput = { multiBranchEnabled: true }
    // @ts-expect-error tenantAdminEmail is immutable and is not in the patch whitelist
    const withEmail: TenantPatchInput = { tenantAdminEmail: "a@b.c" }

    expect([
      withCode,
      withName,
      withCategory,
      withDeployment,
      withBranch,
      withEmail,
    ]).toHaveLength(6)
  })

  it("has no delete function, because the contract answers 405", () => {
    const exported = Object.keys(tenantsModule).map((name) =>
      name.toLowerCase()
    )

    expect(exported.some((name) => name.includes("delete"))).toBe(false)
    expect(exported.some((name) => name.includes("remove"))).toBe(false)
  })

  it("surfaces 503 SERVICE_UNAVAILABLE with the server message", async () => {
    server.use(
      http.patch(`${API}/tenants/:id`, () =>
        errorResponse(
          503,
          "SERVICE_UNAVAILABLE",
          "Tenant status was not changed. Auth service is unavailable, please try again."
        )
      )
    )

    const error = await failureOf(() =>
      patchTenant(TENANT_ID, { isActive: false })
    )

    expect(error.status).toBe(503)
    expect(error.code).toBe("SERVICE_UNAVAILABLE")
    expect(error.message).toContain("Tenant status was not changed")
  })
})

describe("retryAdminAccount", () => {
  it("posts with no body and maps the result", async () => {
    let contentType: string | null = "unset"
    let text = "unset"
    server.use(
      http.post(`${API}/tenants/:id/admin-account`, async ({ request }) => {
        contentType = request.headers.get("content-type")
        text = await request.text()
        return HttpResponse.json(FIXTURE_ADMIN_ACCOUNT_RETRY)
      })
    )

    const result = await retryAdminAccount(TENANT_ID)

    expect(text).toBe("")
    expect(contentType).toBeNull()
    expect(result).toEqual({
      tenantId: TENANT_ID,
      adminAccount: {
        status: "CREATED",
        userStatus: "PENDING",
        tenantStatusSync: "SYNCED",
      },
    })
  })

  it("is not retried automatically on a 503", async () => {
    let calls = 0
    server.use(
      http.post(`${API}/tenants/:id/admin-account`, () => {
        calls += 1
        return errorResponse(
          503,
          "SERVICE_UNAVAILABLE",
          "Admin account was not created. Auth service is unavailable, please try again."
        )
      })
    )

    const error = await failureOf(() => retryAdminAccount(TENANT_ID))

    expect(error.status).toBe(503)
    expect(calls).toBe(1)
  })
})

describe("validation error codes (amendment 2026-10-12)", () => {
  it.each([
    ["VALIDATION_ERROR", "master-data"],
    ["VALIDATION_FAILED", "auth-service"],
  ])("treats a 400 %s from %s as a form validation error", async (code) => {
    server.use(
      http.post(`${API}/tenants`, () =>
        errorResponse(400, code, "Invalid tenant_category_id.")
      )
    )

    const error = await failureOf(() => createTenant(CREATE_INPUT))

    expect(error.status).toBe(400)
    expect(error.code).toBe(code)
    expect(isFormValidationError(error)).toBe(true)
  })

  it("decides by status and code, never by the message text", () => {
    const sameMessage = "Invalid country_code."
    const make = (status: number, code: string, kind: ApiError["kind"]) =>
      new ApiError({ code, message: sameMessage, status, kind, correlationId: null })

    expect(isFormValidationError(make(400, "BAD_REQUEST", "HTTP"))).toBe(false)
    expect(isFormValidationError(make(500, "VALIDATION_ERROR", "HTTP"))).toBe(
      false
    )
    expect(isFormValidationError(make(400, "FIELD_IMMUTABLE", "HTTP"))).toBe(
      false
    )
    expect(isFormValidationError(new Error("VALIDATION_ERROR"))).toBe(false)
  })
})
