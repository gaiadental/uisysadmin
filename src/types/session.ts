/**
 * Session payloads (FE doc 3.4 and 5.6; ARCH-FE-001 D4.9, D4.10). Both the own
 * session list and the admin list of another user use this shape.
 */

import { z } from "zod"

export const SessionSchema = z.object({
  sessionId: z.string().min(1),
  ipAddress: z.string(),
  userAgent: z.string(),
  /** Null when the session has never been used since it was created. */
  lastActivityAt: z.string().nullable(),
  createdAt: z.string(),
  isCurrent: z.boolean(),
})
export type Session = z.infer<typeof SessionSchema>

export const SessionListSchema = z.array(SessionSchema)

/**
 * Body of the single-session revoke, DELETE /api/v1/sessions/{sessionId}. The live
 * backend answers `{ status: "SESSION_REVOKED" }`, not `null`.
 */
export const RevokeOwnResultSchema = z.object({
  status: z.string(),
})
export type RevokeOwnResult = z.infer<typeof RevokeOwnResultSchema>

/**
 * Body of DELETE /api/v1/sessions (revoke all other sessions). The live backend
 * answers `{ status: "SESSIONS_REVOKED", count }`, not `null`; `count` is the
 * number of sessions revoked (0 when there were none). The admin force logout,
 * DELETE /api/v1/system-users/{userId}/sessions, answers the same shape.
 */
export const RevokeOthersResultSchema = z.object({
  status: z.string(),
  count: z.number().int().nonnegative(),
})
export type RevokeOthersResult = z.infer<typeof RevokeOthersResultSchema>
