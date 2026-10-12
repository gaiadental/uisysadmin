/**
 * System role payloads, read side (FE doc 5.2; ARCH-FE-001 D5.1). The user
 * screens use the list for role options. TODO-015 adds the write inputs.
 * `active` is in ARCH-FE-001 BG-07 but not in the FE doc example, so it is
 * optional.
 */

import { z } from "zod"

export const SystemRoleSchema = z.object({
  id: z.number().int(),
  key: z.string().min(1),
  name: z.string(),
  description: z.string().nullish(),
  active: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type SystemRole = z.infer<typeof SystemRoleSchema>

export const SystemRoleListSchema = z.array(SystemRoleSchema)
