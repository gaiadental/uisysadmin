/**
 * Zod 4 schemas for the auth forms (ARCH-FE-001 D9; FE doc section 3.3). These
 * are the client checks. The server is authoritative: credentials and the
 * password policy are checked there, and their failures come back as
 * INVALID_CREDENTIALS or PASSWORD_POLICY_VIOLATION (D4.5, D4.6).
 *
 * Form types are inferred with z.infer, so the form values and the request
 * payload share one definition. No tenant field exists (D4.5).
 */

import { z } from "zod"

const REQUIRED_LOGIN_ID = "Login ID wajib diisi."
const REQUIRED_PASSWORD = "Password wajib diisi."
const REQUIRED_CURRENT_PASSWORD = "Password saat ini wajib diisi."
const REQUIRED_NEW_PASSWORD = "Password baru wajib diisi."
const REQUIRED_CONFIRMATION = "Konfirmasi password wajib diisi."
const CONFIRMATION_MISMATCH =
  "Konfirmasi password tidak sama dengan password baru."

function notBlank(value: string): boolean {
  return value.trim().length > 0
}

/** Required and not blank. The e-mail form is checked by the server (FE doc 3.3). */
const loginIdField = z.string().trim().refine(notBlank, REQUIRED_LOGIN_ID)

export const loginSchema = z.object({
  loginId: loginIdField,
  password: z.string().refine(notBlank, REQUIRED_PASSWORD),
})

export const forgotPasswordSchema = z.object({
  loginId: loginIdField,
})

const newPasswordField = z.string().refine(notBlank, REQUIRED_NEW_PASSWORD)
const confirmationField = z.string().refine(notBlank, REQUIRED_CONFIRMATION)

/** The confirmation must equal the new password (D4.7 and D9). */
export const resetPasswordSchema = z
  .object({
    newPassword: newPasswordField,
    newPasswordConfirmation: confirmationField,
  })
  .refine((values) => values.newPassword === values.newPasswordConfirmation, {
    message: CONFIRMATION_MISMATCH,
    path: ["newPasswordConfirmation"],
  })

/** Used by the forced and the voluntary change (D4.6). */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().refine(notBlank, REQUIRED_CURRENT_PASSWORD),
    newPassword: newPasswordField,
    newPasswordConfirmation: confirmationField,
    keepCurrentSession: z.boolean(),
  })
  .refine((values) => values.newPassword === values.newPasswordConfirmation, {
    message: CONFIRMATION_MISMATCH,
    path: ["newPasswordConfirmation"],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
