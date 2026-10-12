/**
 * Country (FE doc 6.2; ARCH-FE-001 D5.2). The path key is the 2-letter `code`.
 * The wire shape is snake_case and unwrapped. `mapCountry` is the only place
 * that renames its keys. Writes are added by the country module TODO (D5.3).
 */

import { z } from "zod"

export const CountryWireSchema = z.object({
  code: z.string().min(1),
  name: z.string(),
  nationality_name: z.string().nullable(),
  phone_code: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
  updated_by: z.string().nullable(),
})
export type CountryWire = z.infer<typeof CountryWireSchema>

export interface Country {
  readonly code: string
  readonly name: string
  readonly nationalityName: string | null
  readonly phoneCode: string | null
  readonly isActive: boolean
  readonly createdAt: string
  readonly createdBy: string
  readonly updatedAt: string
  readonly updatedBy: string | null
}

export function mapCountry(wire: CountryWire): Country {
  return {
    code: wire.code,
    name: wire.name,
    nationalityName: wire.nationality_name,
    phoneCode: wire.phone_code,
    isActive: wire.is_active,
    createdAt: wire.created_at,
    createdBy: wire.created_by,
    updatedAt: wire.updated_at,
    updatedBy: wire.updated_by,
  }
}

/** Filters of GET /api/v1/countries (FE doc 6.2). `search` is a case-insensitive name substring. */
export interface CountryListParams {
  readonly page?: number
  readonly limit?: number
  readonly isActive?: boolean
  readonly search?: string
}
