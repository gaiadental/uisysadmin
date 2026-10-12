/**
 * MSW handlers for the system role detail, write and permission endpoints
 * (ARCH-FE-001 D19; ADR-005; FE doc 5.2). The list GET lives with the system
 * user handlers (`FIXTURE_ROLES`). Bodies are camelCase and wrapped in `data`.
 *
 * - GET :id: an unknown id gives 404 SYSTEM_ROLE_NOT_FOUND.
 * - POST: key `TAKEN_KEY` gives 409 SYSTEM_ROLE_KEY_EXISTS; otherwise 200 with
 *   the request echoed.
 * - PATCH: echoes the stored fixture with the sent fields applied.
 * - DELETE: answers `{ data: null }`.
 * - GET permissions: the keys in `FIXTURE_ROLE_PERMISSION_KEYS`.
 * - PUT permissions: echoes the sent `permissionKeys`.
 */

import { http, HttpResponse } from "msw"

import { API, errorResponse } from "./auth"
import { FIXTURE_ROLES } from "./system-users"

export const ROLE_KEY_TAKEN = "TAKEN_KEY"
export const ROLE_KEY_TAKEN_MESSAGE = "System role key already exists."

/** Permission keys per role id. Both keys exist in the master permission fixtures. */
export const FIXTURE_ROLE_PERMISSION_KEYS: Readonly<
  Record<number, readonly string[]>
> = {
  1: ["system_users:view", "branches:view"],
  2: ["branches:view"],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function findRole(id: unknown) {
  return FIXTURE_ROLES.find((role) => String(role.id) === id)
}

function notFound(): Response {
  return errorResponse(404, "SYSTEM_ROLE_NOT_FOUND", "System role not found.")
}

export const systemRoleHandlers = [
  http.get(`${API}/system-roles/:id/permissions`, ({ params }) =>
    findRole(params.id) === undefined
      ? notFound()
      : HttpResponse.json({
          data: FIXTURE_ROLE_PERMISSION_KEYS[Number(params.id)] ?? [],
        })
  ),
  http.put(
    `${API}/system-roles/:id/permissions`,
    async ({ params, request }) => {
      if (findRole(params.id) === undefined) return notFound()
      const body: unknown = await request.json()
      const keys = isRecord(body) ? body.permissionKeys : []
      return HttpResponse.json({ data: keys })
    }
  ),
  http.get(`${API}/system-roles/:id`, ({ params }) => {
    const role = findRole(params.id)
    return role === undefined ? notFound() : HttpResponse.json({ data: role })
  }),
  http.post(`${API}/system-roles`, async ({ request }) => {
    const body: unknown = await request.json()
    const input = isRecord(body) ? body : {}
    if (input.key === ROLE_KEY_TAKEN) {
      return errorResponse(409, "SYSTEM_ROLE_KEY_EXISTS", ROLE_KEY_TAKEN_MESSAGE)
    }
    return HttpResponse.json({
      data: {
        ...FIXTURE_ROLES[1],
        id: 77,
        key: input.key,
        name: input.name,
        description: input.description ?? null,
        active: input.active,
      },
    })
  }),
  http.patch(`${API}/system-roles/:id`, async ({ params, request }) => {
    const role = findRole(params.id)
    if (role === undefined) return notFound()
    const body: unknown = await request.json()
    return HttpResponse.json({
      data: { ...role, ...(isRecord(body) ? body : {}) },
    })
  }),
  http.delete(`${API}/system-roles/:id`, ({ params }) =>
    findRole(params.id) === undefined
      ? notFound()
      : HttpResponse.json({ data: null })
  ),
]
