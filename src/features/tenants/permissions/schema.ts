/**
 * Zod 4 schema of the tenant permission checklist (ARCH-FE-001 D9). The
 * checklist is a controlled checkbox group, not a free-text form. The value is
 * the list of selected master permission ids, sent as the PUT body.
 */

import { z } from "zod"

export const tenantPermissionsFormSchema = z.object({
  masterPermissionIds: z.array(z.number().int()),
})

export type TenantPermissionsFormValues = z.infer<
  typeof tenantPermissionsFormSchema
>
