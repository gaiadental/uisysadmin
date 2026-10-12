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
