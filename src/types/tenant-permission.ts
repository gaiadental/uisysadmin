/**
 * Tenant permission payloads (FE doc 5.4; ARCH-FE-001 D5.1, D5.3). auth-service
 * answers in camelCase. `enabled` is not in the FE doc object but is in the
 * auth-service collection examples and is what the PATCH toggles, so it is
 * required here (see the TODO-011 report, open item 1).
 */

import { z } from "zod"

export const TenantPermissionSchema = z.object({
  id: z.number().int(),
  masterPermissionId: z.number().int(),
  masterPermissionKey: z.string().min(1),
  masterPermissionName: z.string(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type TenantPermission = z.infer<typeof TenantPermissionSchema>

export const TenantPermissionListSchema = z.array(TenantPermissionSchema)

/** PUT body: the full replacement list of master permission ids (whitelist, D5.3). */
export interface TenantPermissionsReplaceInput {
  readonly masterPermissionIds: readonly number[]
}
