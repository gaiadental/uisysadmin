/**
 * Zod 4 schemas for the tenant forms (ARCH-FE-001 D9; FE doc 6.3). These are
 * the client checks. The server is authoritative, and its 400 and 409 answers
 * are shown as form alerts or on the code field (D8.2).
 *
 * The create wizard has one schema per step. The full create schema is their
 * merge, so the form values and the request share one definition. Types are
 * inferred with z.infer.
 */

import { z } from "zod"

import { DEPLOYMENT_TYPES } from "@/types/tenant"

export const CODE_MAX = 50
export const NAME_MAX = 100
export const EMAIL_MAX = 100
export const LOGO_URL_MAX = 500

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function notBlank(value: string): boolean {
  return value.trim().length > 0
}

/** True for an empty string or an absolute http or https URL. */
export function isOptionalHttpUrl(value: string): boolean {
  if (value === "") return true
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

const logoUrlField = z
  .string()
  .trim()
  .max(LOGO_URL_MAX, `URL logo paling banyak ${LOGO_URL_MAX} karakter.`)
  .refine(isOptionalHttpUrl, "URL logo harus diawali http:// atau https://.")

/** Step 1, Identitas. An empty `countryCode` means no country. */
export const identityStepSchema = z.object({
  code: z
    .string()
    .trim()
    .refine(notBlank, "Kode tenant wajib diisi.")
    .pipe(
      z
        .string()
        .max(CODE_MAX, `Kode tenant paling banyak ${CODE_MAX} karakter.`)
    ),
  name: z
    .string()
    .trim()
    .refine(notBlank, "Nama tenant wajib diisi.")
    .pipe(
      z
        .string()
        .max(NAME_MAX, `Nama tenant paling banyak ${NAME_MAX} karakter.`)
    ),
  tenantCategoryId: z.string().refine(notBlank, "Kategori wajib dipilih."),
  countryCode: z.string(),
})

/** Step 2, Penyimpanan. */
export const storageStepSchema = z.object({
  deploymentType: z.enum(DEPLOYMENT_TYPES),
  multiBranchEnabled: z.boolean(),
})

/** Step 3, Admin awal. An empty `logoUrl` means no logo. */
export const adminStepSchema = z.object({
  tenantAdminEmail: z
    .string()
    .trim()
    .refine(notBlank, "E-mail admin wajib diisi.")
    .pipe(
      z
        .string()
        .max(EMAIL_MAX, `E-mail paling banyak ${EMAIL_MAX} karakter.`)
        .refine(
          (value) => EMAIL_PATTERN.test(value),
          "Format e-mail tidak valid."
        )
    ),
  logoUrl: logoUrlField,
})

/** All three steps. Step 4 (Tinjau) has no input of its own. */
export const tenantCreateSchema = identityStepSchema
  .extend(storageStepSchema.shape)
  .extend(adminStepSchema.shape)

export type TenantCreateFormValues = z.infer<typeof tenantCreateSchema>

export const CREATE_STEP_FIELDS = {
  identity: ["code", "name", "tenantCategoryId", "countryCode"],
  storage: ["deploymentType", "multiBranchEnabled"],
  admin: ["tenantAdminEmail", "logoUrl"],
} as const satisfies Record<string, ReadonlyArray<keyof TenantCreateFormValues>>

/** The editable profile fields on the detail page (D8.2). An empty string means null. */
export const tenantProfileSchema = z.object({
  logoUrl: logoUrlField,
  countryCode: z.string(),
})

export type TenantProfileFormValues = z.infer<typeof tenantProfileSchema>
