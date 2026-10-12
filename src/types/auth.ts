/**
 * Auth-service payloads in the camelCase shapes of the FE document, section 3
 * (ARCH-FE-001 D5.1). The response schemas are the single source for the
 * types. Unknown keys are dropped, so a new server field does not break a page.
 */

import { z } from "zod"

export const TokenResponseSchema = z.object({
  accessToken: z.string().min(1),
})
export type TokenResponse = z.infer<typeof TokenResponseSchema>

export const TenantSummarySchema = z.object({
  tenantId: z.string(),
  name: z.string(),
  logoUrl: z.string().nullable(),
})

export const BranchSummarySchema = z.object({
  branchId: z.string(),
  name: z.string(),
})

export const MeSchema = z.object({
  userId: z.string(),
  loginId: z.string(),
  userType: z.string(),
  context: z.string().nullable(),
  role: z.string(),
  permissions: z.array(z.string()),
  tenant: TenantSummarySchema.nullable(),
  // The BE contract (auth-service ARCH-BE-001 line 332) types this `branches?`,
  // and the live service returns null for a SYSTEM_USER. The FE requirement
  // says [] (conflict SP-CF-01). Read a missing value as no branches.
  branches: z.array(BranchSummarySchema).nullish(),
  pwdChangeRequired: z.boolean(),
})
export type Me = z.infer<typeof MeSchema>

export const LogoutResultSchema = z.object({
  status: z.literal("LOGGED_OUT"),
})

export const PasswordChangedSchema = z.object({
  status: z.literal("PASSWORD_CHANGED"),
})

/** Result of forgot-password and reset-password. The UI shows neutral copy. */
export const StatusResultSchema = z.object({
  status: z.string().min(1),
})

export interface LoginRequest {
  readonly loginId: string
  readonly password: string
}

export interface ChangePasswordRequest {
  readonly currentPassword: string
  readonly newPassword: string
  readonly newPasswordConfirmation: string
  readonly keepCurrentSession: boolean
}

export interface ForgotPasswordRequest {
  readonly loginId: string
}

export interface ResetPasswordRequest {
  readonly resetToken: string
  readonly newPassword: string
  readonly newPasswordConfirmation: string
}

/**
 * The two outcomes of change-password (FE doc 3.3, ARCH-FE-001 D4.6).
 * SESSION_KEPT carries the rotated access token. PASSWORD_CHANGED means every
 * session, this one included, has ended.
 */
export type PasswordChangeOutcome =
  | { readonly kind: "SESSION_KEPT"; readonly accessToken: string }
  | { readonly kind: "PASSWORD_CHANGED" }
