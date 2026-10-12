/**
 * Zod 4 schemas for the system role forms (ARCH-FE-001 D9; FE doc 5.2).
 * `SystemRoleRequest`: `key` required, max 100; `name` required, max 100;
 * `description` optional; `active` boolean. The checklist is a controlled
 * checkbox group: its value is the list of selected permission KEYS (the role
 * permission calls use keys, not ids). The server validates again.
 */

import { z } from "zod"

export const ROLE_KEY_MAX = 100
export const ROLE_NAME_MAX = 100

function required(label: string, max: number) {
  return z
    .string()
    .trim()
    .refine((value) => value.length > 0, `${label} wajib diisi.`)
    .pipe(z.string().max(max, `${label} paling banyak ${max} karakter.`))
}

/** Used by create and edit. On edit the key is prefilled, shown read-only, and the caller sends the existing key. */
export const roleFormSchema = z.object({
  key: required("Key", ROLE_KEY_MAX),
  name: required("Nama", ROLE_NAME_MAX),
  description: z.string().trim(),
  active: z.boolean(),
})
export type RoleFormValues = z.infer<typeof roleFormSchema>

export const rolePermissionsFormSchema = z.object({
  permissionKeys: z.array(z.string()),
})
export type RolePermissionsFormValues = z.infer<
  typeof rolePermissionsFormSchema
>
