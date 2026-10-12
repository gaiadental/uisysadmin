/**
 * MSW write handlers for tenant categories and countries (TODO-012;
 * ARCH-FE-001 D19, ADR-005). The GET handlers stay in `tenants.ts`, where the
 * tenant tests already use them. The fixtures answer by key, so a test needs
 * no override for the common outcomes:
 *
 * - POST category: code `DUPLICATE` gives 409, any other code gives 201.
 * - POST country: code `ID` gives 409 (it exists), any other code gives 201.
 * - DELETE category: the DENTAL fixture is used by a tenant (409); others 204.
 * - DELETE country: `ID` is used by a tenant (409); others 204.
 *
 * TODO-013 (master permissions, auth-service camelCase, `{ data }` envelope):
 * - POST: key `reports:view` exists (409 MASTER_PERMISSION_KEY_EXISTS), any
 *   other key gives 200 with the sent fields.
 * - PATCH: answers with the sent fields on the fixture id.
 * - DELETE: id 1 (`branches:view`) is still bound (409); others 200 `{ data: null }`.
 */

import { http, HttpResponse } from "msw"

import { API, errorResponse } from "./auth"
import { FIXTURE_MASTER_PERMISSION_BRANCHES } from "./tenant-permissions"
import {
  FIXTURE_CATEGORY,
  FIXTURE_COUNTRY,
} from "./tenants"

export const CATEGORY_CODE_DUPLICATE = "DUPLICATE"
export const CATEGORY_IN_USE_MESSAGE =
  "Tenant category is used by one or more tenants and cannot be deleted."
export const COUNTRY_CODE_TAKEN_MESSAGE = "Country code already exists."
export const COUNTRY_IN_USE_MESSAGE =
  "Country is used by one or more tenants and cannot be deleted."

export const PERMISSION_KEY_TAKEN = "reports:view"
export const PERMISSION_KEY_TAKEN_MESSAGE = "Master permission key already exists."
export const PERMISSION_IN_USE_ID = FIXTURE_MASTER_PERMISSION_BRANCHES.id
export const PERMISSION_IN_USE_MESSAGE =
  "Master permission is bound to tenants or roles and cannot be deleted."

type JsonBody = Record<string, unknown>

export const catalogHandlers = [
  http.post(`${API}/tenant-categories`, async ({ request }) => {
    const body = (await request.json()) as JsonBody
    if (body.code === CATEGORY_CODE_DUPLICATE) {
      return errorResponse(
        409,
        "RESOURCE_CONFLICT",
        "Tenant category code already exists."
      )
    }
    return HttpResponse.json(
      {
        ...FIXTURE_CATEGORY,
        id: "7a1f0c52-3d9e-4b6a-8c21-5e4f3a2b1c09",
        code: body.code,
        name: body.name,
        description: body.description ?? null,
      },
      { status: 201 }
    )
  }),
  // The answer applies the sent keys to the fixture, like the server does.
  http.put(`${API}/tenant-categories/:id`, async ({ request, params }) => {
    const body = (await request.json()) as JsonBody
    return HttpResponse.json({
      ...FIXTURE_CATEGORY,
      id: params.id,
      name: body.name,
      description: body.description ?? null,
      is_active: body.is_active,
    })
  }),
  http.delete(`${API}/tenant-categories/:id`, ({ params }) =>
    params.id === FIXTURE_CATEGORY.id
      ? errorResponse(409, "RESOURCE_CONFLICT", CATEGORY_IN_USE_MESSAGE)
      : new HttpResponse(null, { status: 204 })
  ),
  http.post(`${API}/countries`, async ({ request }) => {
    const body = (await request.json()) as JsonBody
    if (body.code === FIXTURE_COUNTRY.code) {
      return errorResponse(409, "RESOURCE_CONFLICT", COUNTRY_CODE_TAKEN_MESSAGE)
    }
    return HttpResponse.json(
      {
        ...FIXTURE_COUNTRY,
        code: body.code,
        name: body.name,
        nationality_name: body.nationality_name ?? null,
        phone_code: body.phone_code ?? null,
      },
      { status: 201 }
    )
  }),
  http.put(`${API}/countries/:code`, async ({ request, params }) => {
    const body = (await request.json()) as JsonBody
    return HttpResponse.json({
      ...FIXTURE_COUNTRY,
      code: params.code,
      name: body.name,
      nationality_name: body.nationality_name ?? null,
      phone_code: body.phone_code ?? null,
      is_active: body.is_active,
    })
  }),
  http.delete(`${API}/countries/:code`, ({ params }) =>
    params.code === FIXTURE_COUNTRY.code
      ? errorResponse(409, "RESOURCE_CONFLICT", COUNTRY_IN_USE_MESSAGE)
      : new HttpResponse(null, { status: 204 })
  ),
  http.post(`${API}/master-permissions`, async ({ request }) => {
    const body = (await request.json()) as JsonBody
    if (body.key === PERMISSION_KEY_TAKEN) {
      return errorResponse(
        409,
        "MASTER_PERMISSION_KEY_EXISTS",
        PERMISSION_KEY_TAKEN_MESSAGE
      )
    }
    return HttpResponse.json({
      data: {
        ...FIXTURE_MASTER_PERMISSION_BRANCHES,
        id: 99,
        ...body,
        description: body.description ?? null,
      },
    })
  }),
  http.patch(`${API}/master-permissions/:id`, async ({ request, params }) => {
    const body = (await request.json()) as JsonBody
    return HttpResponse.json({
      data: {
        ...FIXTURE_MASTER_PERMISSION_BRANCHES,
        ...body,
        id: Number(params.id),
      },
    })
  }),
  http.delete(`${API}/master-permissions/:id`, ({ params }) =>
    Number(params.id) === PERMISSION_IN_USE_ID
      ? errorResponse(
          409,
          "RESOURCE_CONFLICT",
          PERMISSION_IN_USE_MESSAGE
        )
      : HttpResponse.json({ data: null })
  ),
]
