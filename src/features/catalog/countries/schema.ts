/**
 * Zod 4 schemas for the country forms (ARCH-FE-001 D9; FE doc 6.2). The code
 * is two uppercase letters (ISO 3166-1 alpha-2). The input uppercases what the
 * user types, and the schema checks the result. The edit schema has no `code`:
 * it is the path key and immutable (REQ-FE-040).
 */

import { z } from "zod"

export const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/
export const COUNTRY_NAME_MAX = 100
export const NATIONALITY_NAME_MAX = 100
export const PHONE_CODE_MAX = 10

function notBlank(value: string): boolean {
  return value.trim().length > 0
}

const nameField = z
  .string()
  .trim()
  .refine(notBlank, "Nama negara wajib diisi.")
  .pipe(
    z
      .string()
      .max(
        COUNTRY_NAME_MAX,
        `Nama negara paling banyak ${COUNTRY_NAME_MAX} karakter.`
      )
  )

const nationalityField = z
  .string()
  .trim()
  .max(
    NATIONALITY_NAME_MAX,
    `Kewarganegaraan paling banyak ${NATIONALITY_NAME_MAX} karakter.`
  )

const phoneCodeField = z
  .string()
  .trim()
  .max(PHONE_CODE_MAX, `Kode telepon paling banyak ${PHONE_CODE_MAX} karakter.`)

export const countryCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .refine(notBlank, "Kode negara wajib diisi.")
    .pipe(
      z
        .string()
        .regex(
          COUNTRY_CODE_PATTERN,
          "Kode negara harus 2 huruf besar, misalnya SG."
        )
    ),
  name: nameField,
  nationalityName: nationalityField,
  phoneCode: phoneCodeField,
})
export type CountryCreateFormValues = z.infer<typeof countryCreateSchema>

export const countryEditSchema = z.object({
  name: nameField,
  nationalityName: nationalityField,
  phoneCode: phoneCodeField,
  isActive: z.boolean(),
})
export type CountryEditFormValues = z.infer<typeof countryEditSchema>
