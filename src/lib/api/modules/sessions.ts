/**
 * Session endpoints: the signed-in user's own sessions (ARCH-FE-001 D4.9) and
 * the sessions of another user for an admin (D4.10; FE doc 3.4 and 5.6).
 *
 * The admin functions are used first by the system user detail page (TODO-014).
 */

import { z } from "zod"

import { apiRequest } from "../client"
import { SessionListSchema, type Session } from "@/types/session"

import { unwrapData } from "./auth"

const OWN_SESSIONS_PATH = "/api/v1/sessions"
const ADMIN_USERS_PATH = "/api/v1/admin/users"

/** GET /api/v1/sessions. The list is not paginated (client-paginated, D5.4). */
export async function listOwnSessions(): Promise<Session[]> {
  const body = await apiRequest<unknown>(OWN_SESSIONS_PATH, {
    route: "sessions.listOwn",
  })
  return unwrapData(SessionListSchema, body)
}

/** DELETE /api/v1/sessions/{sessionId}. The caller never revokes the current session (D4.9). */
export async function revokeOwnSession(sessionId: string): Promise<void> {
  const body = await apiRequest<unknown>(
    `${OWN_SESSIONS_PATH}/${encodeURIComponent(sessionId)}`,
    { method: "DELETE", route: "sessions.revokeOwn" }
  )
  unwrapData(z.null(), body)
}

/** DELETE /api/v1/sessions. Revokes every session except the current one. */
export async function revokeOtherOwnSessions(): Promise<void> {
  const body = await apiRequest<unknown>(OWN_SESSIONS_PATH, {
    method: "DELETE",
    route: "sessions.revokeOthers",
  })
  unwrapData(z.null(), body)
}

/** GET /api/v1/admin/users/{userId}/sessions. Requires `sessions:view`. */
export async function listUserSessions(userId: string): Promise<Session[]> {
  const body = await apiRequest<unknown>(
    `${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}/sessions`,
    { route: "admin.sessions.list" }
  )
  return unwrapData(SessionListSchema, body)
}

/** DELETE /api/v1/admin/users/{userId}/sessions. Revokes all sessions of that user. Requires `sessions:revoke`. */
export async function forceLogoutUser(userId: string): Promise<void> {
  const body = await apiRequest<unknown>(
    `${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}/sessions`,
    { method: "DELETE", route: "admin.sessions.forceLogout" }
  )
  unwrapData(z.null(), body)
}
