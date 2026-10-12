/**
 * System user payloads (FE doc 5.1; ARCH-FE-001 D5.1, D5.3). auth-service
 * answers in camelCase, so the response schema is the single source for the
 * type. Unknown keys are dropped. The display name and the last-active time
 * are not in the contract (SP-BG-04), so the list shows `loginId` only.
 */

import { z } from "zod"

export const SYSTEM_USER_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
] as const
export type SystemUserStatus = (typeof SYSTEM_USER_STATUSES)[number]

export const SystemUserSchema = z.object({
  id: z.string().min(1),
  loginId: z.string().min(1),
  systemRoleId: z.number().int(),
  systemRoleKey: z.string(),
  status: z.enum(SYSTEM_USER_STATUSES),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type SystemUser = z.infer<typeof SystemUserSchema>

export const SystemUserListSchema = z.array(SystemUserSchema)
