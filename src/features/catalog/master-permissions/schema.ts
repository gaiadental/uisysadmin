/**
 * Zod 4 schema for the master permission form (ARCH-FE-001 D9; FE doc 5.3).
 * Limits come from `MasterPermissionRequest`: `key` and `name` 100, `category`
 * and `module` 50. The key is a platform catalogue value, so no pattern is
 * enforced beyond what the contract states. The server validates again.
 */

import { z } from "zod"

export const PERMISSION_KEY_MAX = 100
export const PERMISSION_NAME_MAX = 100
export const PERMISSION_CATEGORY_MAX = 50
export const PERMISSION_MODULE_MAX = 50

function required(label: string, max: number) {
  return z
    .string()
    .trim()
    .refine((value) => value.length > 0, `${label} wajib diisi.`)
    .pipe(
      z.string().max(max, `${label} paling banyak ${max} karakter.`)
    )
}

const fields = {
  name: required("Nama", PERMISSION_NAME_MAX),
  description: z.string().trim(),
  category: required("Kategori", PERMISSION_CATEGORY_MAX),
  module: required("Modul", PERMISSION_MODULE_MAX),
  active: z.boolean(),
  customerPermitted: z.boolean(),
}

/** Used by create and edit. On edit the key is prefilled, shown read-only, and the caller sends the existing key. */
export const permissionCreateSchema = z.object({
  key: required("Key", PERMISSION_KEY_MAX),
  ...fields,
})
export type PermissionCreateFormValues = z.infer<typeof permissionCreateSchema>
