/**
 * Zod 4 schemas for the tenant category forms (ARCH-FE-001 D9; FE doc 6.1).
 * These are the client checks. The server is authoritative, and its 400 and
 * 409 answers are shown as form alerts. The edit schema has no `code`: the
 * code is immutable after create (REQ-FE-028, REQ-FE-040).
 */

import { z } from "zod"

export const CATEGORY_CODE_MAX = 50
export const CATEGORY_NAME_MAX = 100

function notBlank(value: string): boolean {
  return value.trim().length > 0
}

const codeField = z
  .string()
  .trim()
  .refine(notBlank, "Kode kategori wajib diisi.")
  .pipe(
    z
      .string()
      .max(
        CATEGORY_CODE_MAX,
        `Kode kategori paling banyak ${CATEGORY_CODE_MAX} karakter.`
      )
  )

const nameField = z
  .string()
  .trim()
  .refine(notBlank, "Nama kategori wajib diisi.")
  .pipe(
    z
      .string()
      .max(
        CATEGORY_NAME_MAX,
        `Nama kategori paling banyak ${CATEGORY_NAME_MAX} karakter.`
      )
  )

/** An empty description means none. */
const descriptionField = z.string().trim()

export const categoryCreateSchema = z.object({
  code: codeField,
  name: nameField,
  description: descriptionField,
})
export type CategoryCreateFormValues = z.infer<typeof categoryCreateSchema>

export const categoryEditSchema = z.object({
  name: nameField,
  description: descriptionField,
  isActive: z.boolean(),
})
export type CategoryEditFormValues = z.infer<typeof categoryEditSchema>
