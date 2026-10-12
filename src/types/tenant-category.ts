/**
 * Tenant category (FE doc 6.1; ARCH-FE-001 D5.2). The wire shape is snake_case
 * and unwrapped. `mapTenantCategory` is the only place that renames its keys.
 * Writes are added by the category module TODO (D5.3).
 */

import { z } from "zod"

export const TenantCategoryWireSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
  updated_by: z.string().nullable(),
})
export type TenantCategoryWire = z.infer<typeof TenantCategoryWireSchema>

export interface TenantCategory {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly description: string | null
  readonly isActive: boolean
  readonly createdAt: string
  readonly createdBy: string
  readonly updatedAt: string
  readonly updatedBy: string | null
}

export function mapTenantCategory(wire: TenantCategoryWire): TenantCategory {
  return {
    id: wire.id,
    code: wire.code,
    name: wire.name,
    description: wire.description,
    isActive: wire.is_active,
    createdAt: wire.created_at,
    createdBy: wire.created_by,
    updatedAt: wire.updated_at,
    updatedBy: wire.updated_by,
  }
}

/** Filters of GET /api/v1/tenant-categories (FE doc 6.1). `code` is an exact match. */
export interface TenantCategoryListParams {
  readonly page?: number
  readonly limit?: number
  readonly isActive?: boolean
  readonly code?: string
}
