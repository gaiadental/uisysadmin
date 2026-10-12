/**
 * MSW handlers for the auth-service and session endpoints (ARCH-FE-001 D19;
 * ADR-005). They follow the FE document examples (sections 3, 5.6 and 9), not
 * the mock data in src/data.
 *
 * Paths start with "*" so the handlers match any origin. Tests set
 * VITE_API_BASE_URL to an absolute origin, so requests reach MSW with a full URL.
 */

import { http, HttpResponse } from "msw"

export const API = "*/api/v1"

export const TEST_ACCESS_TOKEN = "test-access-token"

export const FIXTURE_ME = {
  userId: "640688ab-b751-4071-9a1d-d079552305d3",
  loginId: "principal@example.com",
  userType: "SYSTEM_USER",
  context: null,
  role: "SYS_PRINCIPAL",
  permissions: ["system_users:view", "master_permissions:view"],
  tenant: null,
  branches: [],
  pwdChangeRequired: false,
} as const

/**
 * The live `me` shape for a SYSTEM_USER: `branches` is null, not [] (SP-CF-01).
 * The default FIXTURE_ME above keeps the FE document shape.
 */
export const FIXTURE_ME_NULL_BRANCHES = {
  ...FIXTURE_ME,
  branches: null,
} as const

export const FIXTURE_SESSION = {
  sessionId: "3f1c2b0e-8d7a-4c55-9a7e-2b6f1d0c9e11",
  ipAddress: "127.0.0.1",
  userAgent: "Mozilla/5.0 (test)",
  lastActivityAt: "2026-10-10T05:00:00Z",
  createdAt: "2026-10-10T04:00:00Z",
  isCurrent: true,
} as const

/** A second session of the same user, not the current one. Used by the revoke tests. */
export const FIXTURE_OTHER_SESSION = {
  sessionId: "7a9e4d21-3b5c-4f60-8e12-c0d4b6a1f902",
  ipAddress: "10.0.0.5",
  userAgent: "Mozilla/5.0 (other device)",
  lastActivityAt: "2026-10-09T18:30:00Z",
  createdAt: "2026-10-09T08:00:00Z",
  isCurrent: false,
} as const

/** The token value an invalid or expired reset link carries in tests. */
export const FIXTURE_RESET_TOKEN = "reset-token-from-email-link"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** An auth-service error body (FE doc 2.3) with the given HTTP status, code and message. */
export function errorResponse(
  status: number,
  code: string,
  message: string
): Response {
  return HttpResponse.json({ code, message }, { status })
}

export const authHandlers = [
  http.post(`${API}/auth/login`, () =>
    HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
  ),
  http.post(`${API}/auth/refresh`, () =>
    HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
  ),
  http.get(`${API}/auth/me`, () => HttpResponse.json({ data: FIXTURE_ME })),
  http.post(`${API}/auth/logout`, () =>
    HttpResponse.json({ data: { status: "LOGGED_OUT" } })
  ),
  http.post(`${API}/auth/change-password`, async ({ request }) => {
    const body: unknown = await request.json()
    const keepCurrentSession =
      isRecord(body) && body.keepCurrentSession === true
    return HttpResponse.json(
      keepCurrentSession
        ? { data: { accessToken: TEST_ACCESS_TOKEN } }
        : { data: { status: "PASSWORD_CHANGED" } }
    )
  }),
  http.post(`${API}/auth/forgot-password`, () =>
    HttpResponse.json({ data: { status: "ACCEPTED" } })
  ),
  http.post(`${API}/auth/reset-password`, () =>
    HttpResponse.json({ data: { status: "PASSWORD_RESET" } })
  ),
]

export const sessionHandlers = [
  http.get(`${API}/sessions`, () =>
    HttpResponse.json({ data: [FIXTURE_SESSION] })
  ),
  http.delete(`${API}/sessions/:sessionId`, () =>
    HttpResponse.json({ data: { status: "SESSION_REVOKED" } })
  ),
  http.delete(`${API}/sessions`, () =>
    HttpResponse.json({ data: { status: "SESSIONS_REVOKED", count: 0 } })
  ),
  http.get(`${API}/admin/users/:userId/sessions`, () =>
    HttpResponse.json({ data: [FIXTURE_SESSION] })
  ),
  http.delete(`${API}/admin/users/:userId/sessions`, () =>
    HttpResponse.json({ data: { status: "SESSIONS_REVOKED", count: 0 } })
  ),
]
