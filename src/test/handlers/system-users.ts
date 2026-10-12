/**
 * MSW handlers for the system user and system role reads (TODO-014;
 * ARCH-FE-001 D19; FE doc 5.1 and 5.2). Bodies are camelCase and wrapped in
 * `data`. The write handlers answer from the request, so a test sees the
 * request shape the server expects:
 *
 * - POST: login `taken@example.com` gives 409 SYSTEM_USER_LOGIN_EXISTS;
 *   `systemRoleId` 999 gives 400 SYSTEM_ROLE_NOT_FOUND; otherwise 200.
 * - PATCH: the role change and the status change echo the stored fixture with
 *   the sent field applied. An unknown id gives 404 SYSTEM_USER_NOT_FOUND.
 * - DELETE and reset-password answer `{ data: null }`.
 *
 * The signed-in fixture user (`FIXTURE_ME.userId`) is the first list item, so
 * the own account appears in the list.
 */

import { http, HttpResponse } from "msw"

import { API, errorResponse, FIXTURE_ME } from "./auth"

const STAMP = "2026-10-01T03:00:00Z"

export const FIXTURE_ROLE_PRINCIPAL = {
  id: 1,
  key: "SYS_PRINCIPAL",
  name: "System Principal",
  description: "Full platform access",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_ROLE_ADMIN = {
  id: 2,
  key: "SYS_ADMIN",
  name: "System Admin",
  description: null,
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_ROLES = [
  FIXTURE_ROLE_PRINCIPAL,
  FIXTURE_ROLE_ADMIN,
] as const

/** The signed-in user (id equals `FIXTURE_ME.userId`). */
export const FIXTURE_USER_SELF = {
  id: FIXTURE_ME.userId,
  loginId: FIXTURE_ME.loginId,
  systemRoleId: 1,
  systemRoleKey: "SYS_PRINCIPAL",
  status: "ACTIVE",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_USER_ACTIVE = {
  id: "11111111-aaaa-4aaa-8aaa-000000000001",
  loginId: "ops@gaia.com",
  systemRoleId: 2,
  systemRoleKey: "SYS_ADMIN",
  status: "ACTIVE",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_USER_SUSPENDED = {
  id: "11111111-aaaa-4aaa-8aaa-000000000002",
  loginId: "suspended@gaia.com",
  systemRoleId: 2,
  systemRoleKey: "SYS_ADMIN",
  status: "SUSPENDED",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_USER_DEACTIVATED = {
  id: "11111111-aaaa-4aaa-8aaa-000000000003",
  loginId: "gone@gaia.com",
  systemRoleId: 2,
  systemRoleKey: "SYS_ADMIN",
  status: "DEACTIVATED",
  createdAt: STAMP,
  updatedAt: STAMP,
} as const

export const FIXTURE_USERS = [
  FIXTURE_USER_SELF,
  FIXTURE_USER_ACTIVE,
  FIXTURE_USER_SUSPENDED,
  FIXTURE_USER_DEACTIVATED,
] as const

export const LOGIN_TAKEN = "taken@example.com"
export const MISSING_ROLE_ID = 999
export const LOGIN_TAKEN_MESSAGE =
  "A system user with this login already exists."

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function findUser(id: unknown) {
  return FIXTURE_USERS.find((user) => user.id === id)
}

function notFound(): Response {
  return errorResponse(404, "SYSTEM_USER_NOT_FOUND", "System user not found.")
}

export const systemUserHandlers = [
  http.get(`${API}/system-roles`, () =>
    HttpResponse.json({ data: FIXTURE_ROLES })
  ),
  http.get(`${API}/system-users`, () =>
    HttpResponse.json({ data: FIXTURE_USERS })
  ),
  http.get(`${API}/system-users/:id`, ({ params }) => {
    const user = findUser(params.id)
    return user === undefined ? notFound() : HttpResponse.json({ data: user })
  }),
  http.post(`${API}/system-users`, async ({ request }) => {
    const body: unknown = await request.json()
    const loginId = isRecord(body) ? body.loginId : undefined
    const systemRoleId = isRecord(body) ? body.systemRoleId : undefined
    if (loginId === LOGIN_TAKEN) {
      return errorResponse(409, "SYSTEM_USER_LOGIN_EXISTS", LOGIN_TAKEN_MESSAGE)
    }
    if (systemRoleId === MISSING_ROLE_ID) {
      return errorResponse(
        400,
        "SYSTEM_ROLE_NOT_FOUND",
        "System role not found."
      )
    }
    return HttpResponse.json({
      data: {
        ...FIXTURE_USER_ACTIVE,
        id: "11111111-aaaa-4aaa-8aaa-0000000000ff",
        loginId,
        systemRoleId,
      },
    })
  }),
  http.patch(`${API}/system-users/:id/status`, async ({ params, request }) => {
    const user = findUser(params.id)
    if (user === undefined) return notFound()
    const body: unknown = await request.json()
    const status = isRecord(body) ? body.status : undefined
    return HttpResponse.json({ data: { ...user, status } })
  }),
  http.patch(`${API}/system-users/:id`, async ({ params, request }) => {
    const user = findUser(params.id)
    if (user === undefined) return notFound()
    const body: unknown = await request.json()
    const systemRoleId = isRecord(body) ? body.systemRoleId : undefined
    return HttpResponse.json({ data: { ...user, systemRoleId } })
  }),
  http.delete(`${API}/system-users/:id`, ({ params }) =>
    findUser(params.id) === undefined
      ? notFound()
      : HttpResponse.json({ data: null })
  ),
  http.post(`${API}/system-users/:id/reset-password`, ({ params }) =>
    findUser(params.id) === undefined
      ? notFound()
      : HttpResponse.json({ data: null })
  ),
]
