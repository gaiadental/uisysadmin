/**
 * Master permission payloads (FE doc 5.3; ARCH-FE-001 D5.1). auth-service
 * answers in camelCase, so the response schema is the single source for the
 * type. Unknown keys are dropped. `active` and `customerPermitted` are in
 * ARCH-FE-001 BG-07 but not in the FE doc example, so they are optional.
 */

import { z } from "zod"

/**
 * Scope of a master permission (REQ-FE-057, ARCH-FE-001 D5.1). Required and
 * immutable on the server; a missing or other value is a contract failure.
 */
export const PermissionScopeSchema = z.enum(["PLATFORM", "TENANT"])
export type PermissionScope = z.infer<typeof PermissionScopeSchema>

export const MasterPermissionSchema = z.object({
  id: z.number().int(),
  key: z.string().min(1),
  name: z.string(),
  description: z.string().nullish(),
  category: z.string(),
  module: z.string(),
  scope: PermissionScopeSchema,
  active: z.boolean().optional(),
  customerPermitted: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type MasterPermission = z.infer<typeof MasterPermissionSchema>

export const MasterPermissionListSchema = z.array(MasterPermissionSchema)
