/**
 * Zod 4 schemas for the system user forms (ARCH-FE-001 D9; FE doc 5.1).
 * `loginId` is required and must be an e-mail; `systemRoleId` is required.
 * The role select holds the id as text, and the schema output is the number
 * the request needs. The contract states no length limit for `loginId`, so
 * none is enforced here. The server validates again.
 */

import { z } from "zod"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLE_ID_PATTERN = /^\d+$/

const REQUIRED_LOGIN_ID = "Login ID wajib diisi."
const INVALID_LOGIN_ID = "Login ID harus berupa alamat e-mail."
const REQUIRED_ROLE = "Peran wajib dipilih."

const loginIdField = z
  .string()
  .trim()
  .refine((value) => value.length > 0, REQUIRED_LOGIN_ID)
  .pipe(
    z.string().refine((value) => EMAIL_PATTERN.test(value), INVALID_LOGIN_ID)
  )

const roleIdField = z
  .string()
  .refine((value) => ROLE_ID_PATTERN.test(value), REQUIRED_ROLE)
  .transform((value) => Number(value))

/** Create: login ID and role. The role id is text in the form and a number in the output. */
export const userCreateSchema = z.object({
  loginId: loginIdField,
  systemRoleId: roleIdField,
})
export type UserCreateFormValues = z.input<typeof userCreateSchema>

/** Role change: the new role only (D5.3). */
export const userRoleChangeSchema = z.object({
  systemRoleId: roleIdField,
})
export type UserRoleChangeFormValues = z.input<typeof userRoleChangeSchema>
