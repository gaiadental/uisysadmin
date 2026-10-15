/**
 * Session endpoints: the signed-in user's own sessions (ARCH-FE-001 D4.9) and
 * the sessions of another system account (D4.10; FE doc 3.4 and 5.6;
 * TODO-026). The other-account functions are used by the system user detail
 * page; their route labels stay `admin.sessions.*`.
 */

import { apiRequest } from "../client"
import {
  RevokeOthersResultSchema,
  RevokeOwnResultSchema,
  SessionListSchema,
  type RevokeOthersResult,
  type Session,
} from "@/types/session"

import { unwrapData } from "./auth"

const OWN_SESSIONS_PATH = "/api/v1/sessions"
const SYSTEM_USERS_PATH = "/api/v1/system-users"

/** GET /api/v1/sessions. The list is not paginated (client-paginated, D5.4). */
export async function listOwnSessions(): Promise<Session[]> {
  const body = await apiRequest<unknown>(OWN_SESSIONS_PATH, {
    route: "sessions.listOwn",
  })
  return unwrapData(SessionListSchema, body)
}

/**
 * DELETE /api/v1/sessions/{sessionId}. The caller never revokes the current session (D4.9).
 * The live body is `{ status: "SESSION_REVOKED" }`; the result is validated, not returned.
 */
export async function revokeOwnSession(sessionId: string): Promise<void> {
  const body = await apiRequest<unknown>(
    `${OWN_SESSIONS_PATH}/${encodeURIComponent(sessionId)}`,
    { method: "DELETE", route: "sessions.revokeOwn" }
  )
  unwrapData(RevokeOwnResultSchema, body)
}

/**
 * DELETE /api/v1/sessions. Revokes every session except the current one.
 * Resolves with the backend result (`status`, `count` revoked).
 */
export async function revokeOtherOwnSessions(): Promise<RevokeOthersResult> {
  const body = await apiRequest<unknown>(OWN_SESSIONS_PATH, {
    method: "DELETE",
    route: "sessions.revokeOthers",
  })
  return unwrapData(RevokeOthersResultSchema, body)
}

/** GET /api/v1/system-users/{userId}/sessions. Requires `sessions:view`. */
export async function listUserSessions(userId: string): Promise<Session[]> {
  const body = await apiRequest<unknown>(
    `${SYSTEM_USERS_PATH}/${encodeURIComponent(userId)}/sessions`,
    { route: "admin.sessions.list" }
  )
  return unwrapData(SessionListSchema, body)
}

/**
 * DELETE /api/v1/system-users/{userId}/sessions. Revokes all sessions of that user. Requires `sessions:revoke`.
 * The live body is `{ status: "SESSIONS_REVOKED", count }` (platform auth-service SessionController); the result is validated, not returned.
 */
export async function forceLogoutUser(userId: string): Promise<void> {
  const body = await apiRequest<unknown>(
    `${SYSTEM_USERS_PATH}/${encodeURIComponent(userId)}/sessions`,
    { method: "DELETE", route: "admin.sessions.forceLogout" }
  )
  unwrapData(RevokeOthersResultSchema, body)
}
