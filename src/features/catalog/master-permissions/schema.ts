/**
 * Zod 4 schema for the master permission edit form (ARCH-FE-001 D9; FE doc
 * 5.3). Only `name` and `description` are editable (TODO-021, REQ-FE-035);
 * `key`, `category`, `module`, `active` and `customerPermitted` are read-only
 * and come from a fresh server read at save time. The limit comes from
 * `MasterPermissionRequest`: `name` 100. The server validates again.
 */

import { z } from "zod"

export const PERMISSION_NAME_MAX = 100

export const permissionEditSchema = z.object({
  name: z
    .string()
    .trim()
    .refine((value) => value.length > 0, "Nama wajib diisi.")
    .pipe(
      z
        .string()
        .max(
          PERMISSION_NAME_MAX,
          `Nama paling banyak ${PERMISSION_NAME_MAX} karakter.`
        )
    ),
  description: z.string().trim(),
})
export type PermissionEditFormValues = z.infer<typeof permissionEditSchema>
