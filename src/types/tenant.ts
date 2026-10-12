/**
 * Tenant payloads (FE doc 6.3; ARCH-FE-001 D5.2, D5.3). The wire shape is
 * snake_case and unwrapped. Explicit mapper functions rename the keys (no
 * generic key transform). Zod strips unknown keys, so an extra server key is
 * ignored, and a missing required key fails validation (CONTRACT, D5.5).
 *
 * The write inputs are whitelists (D5.3): a field the contract marks immutable
 * is absent from the type, so it cannot be sent.
 */

import { z } from "zod"

export const DEPLOYMENT_TYPES = ["DEDICATED", "MULTI_TENANT"] as const
export const DeploymentTypeSchema = z.enum(DEPLOYMENT_TYPES)
export type DeploymentType = z.infer<typeof DeploymentTypeSchema>

// ---------- common master-data list envelope (FE doc 2.2) ----------

export const PaginationWireSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  total_pages: z.number().int(),
})

export interface Pagination {
  readonly page: number
  readonly limit: number
  readonly total: number
  readonly totalPages: number
}

export interface PageResult<T> {
  readonly data: readonly T[]
  readonly pagination: Pagination
}

export function mapPagination(
  wire: z.infer<typeof PaginationWireSchema>
): Pagination {
  return {
    page: wire.page,
    limit: wire.limit,
    total: wire.total,
    totalPages: wire.total_pages,
  }
}

/** The list envelope `{ data: [...], pagination }` around an item schema. */
export function listEnvelopeSchema<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), pagination: PaginationWireSchema })
}

// ---------- tenant ----------

/**
 * The keys every tenant payload carries. The category and country keys differ by
 * endpoint: the list, create and PATCH responses carry the flat
 * `tenant_category_id` and `country_code`, while the detail carries the nested
 * `tenant_category` and `country` (TODO-020). The common keys are shared.
 */
const TenantCommonWireSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string(),
  deployment_type: DeploymentTypeSchema,
  multi_branch_enabled: z.boolean(),
  tenant_admin_email: z.string(),
  logo_url: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
  updated_by: z.string(),
})

/** List item, create, PATCH response: the flat category and country keys are required. */
export const TenantWireSchema = TenantCommonWireSchema.extend({
  tenant_category_id: z.string().min(1),
  country_code: z.string().nullable(),
})
export type TenantWire = z.infer<typeof TenantWireSchema>

export interface Tenant {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly tenantCategoryId: string
  readonly countryCode: string | null
  readonly deploymentType: DeploymentType
  readonly multiBranchEnabled: boolean
  readonly tenantAdminEmail: string
  readonly logoUrl: string | null
  readonly isActive: boolean
  readonly createdAt: string
  readonly createdBy: string
  readonly updatedAt: string
  readonly updatedBy: string
}

type TenantCommonWire = z.infer<typeof TenantCommonWireSchema>

type TenantCommon = Omit<Tenant, "tenantCategoryId" | "countryCode">

function mapTenantCommon(wire: TenantCommonWire): TenantCommon {
  return {
    id: wire.id,
    code: wire.code,
    name: wire.name,
    deploymentType: wire.deployment_type,
    multiBranchEnabled: wire.multi_branch_enabled,
    tenantAdminEmail: wire.tenant_admin_email,
    logoUrl: wire.logo_url,
    isActive: wire.is_active,
    createdAt: wire.created_at,
    createdBy: wire.created_by,
    updatedAt: wire.updated_at,
    updatedBy: wire.updated_by,
  }
}

/** Shared by the list item, the PATCH response and the create response. */
export function mapTenant(wire: TenantWire): Tenant {
  return {
    ...mapTenantCommon(wire),
    tenantCategoryId: wire.tenant_category_id,
    countryCode: wire.country_code,
  }
}

// ---------- tenant detail ----------

/**
 * `GET /api/v1/tenants/{id}`. The live body has no top-level `tenant_category_id`
 * or `country_code`; the category and country come from the nested objects.
 */
export const TenantDetailWireSchema = TenantCommonWireSchema.extend({
  tenant_category: z.object({
    id: z.string().min(1),
    code: z.string(),
    name: z.string(),
  }),
  country: z
    .object({
      code: z.string().min(1),
      name: z.string(),
      phone_code: z.string().nullable(),
    })
    .nullable(),
  social_links: z.array(
    z.object({
      id: z.string(),
      platform_name: z.string(),
      url: z.string(),
    })
  ),
})
export type TenantDetailWire = z.infer<typeof TenantDetailWireSchema>

export interface TenantDetail extends Tenant {
  readonly tenantCategory: {
    readonly id: string
    readonly code: string
    readonly name: string
  }
  readonly country: {
    readonly code: string
    readonly name: string
    readonly phoneCode: string | null
  } | null
  /** Read-only for SP and not rendered in v1. */
  readonly socialLinks: ReadonlyArray<{
    readonly id: string
    readonly platformName: string
    readonly url: string
  }>
}

/** `tenantCategoryId` comes from `tenant_category.id`; `countryCode` is null when `country` is null. */
export function mapTenantDetail(wire: TenantDetailWire): TenantDetail {
  return {
    ...mapTenantCommon(wire),
    tenantCategoryId: wire.tenant_category.id,
    countryCode: wire.country === null ? null : wire.country.code,
    tenantCategory: {
      id: wire.tenant_category.id,
      code: wire.tenant_category.code,
      name: wire.tenant_category.name,
    },
    country:
      wire.country === null
        ? null
        : {
            code: wire.country.code,
            name: wire.country.name,
            phoneCode: wire.country.phone_code,
          },
    socialLinks: wire.social_links.map((link) => ({
      id: link.id,
      platformName: link.platform_name,
      url: link.url,
    })),
  }
}

// ---------- admin account (create response and retry) ----------

export const AdminAccountWireSchema = z.object({
  status: z.enum(["CREATED", "FAILED"]),
  user_id: z.string().nullable(),
  message: z.string(),
  tenant_status_sync: z.enum(["SYNCED", "FAILED"]).optional(),
})

export interface AdminAccount {
  readonly status: "CREATED" | "FAILED"
  readonly userId: string | null
  readonly message: string
  /** Absent when the account was not created. */
  readonly tenantStatusSync: "SYNCED" | "FAILED" | null
}

export const TenantCreatedWireSchema = TenantWireSchema.extend({
  admin_account: AdminAccountWireSchema,
})
export type TenantCreatedWire = z.infer<typeof TenantCreatedWireSchema>

export interface TenantCreated extends Tenant {
  readonly adminAccount: AdminAccount
}

/** `default_branch_types` is not mapped (not used by SP, D5.2). */
export function mapTenantCreated(wire: TenantCreatedWire): TenantCreated {
  return {
    ...mapTenant(wire),
    adminAccount: {
      status: wire.admin_account.status,
      userId: wire.admin_account.user_id,
      message: wire.admin_account.message,
      tenantStatusSync: wire.admin_account.tenant_status_sync ?? null,
    },
  }
}

export const AdminAccountRetryWireSchema = z.object({
  tenant_id: z.string().min(1),
  admin_account: z.object({
    status: z.literal("CREATED"),
    user_status: z.string(),
    tenant_status_sync: z.enum(["SYNCED", "FAILED"]),
  }),
})
export type AdminAccountRetryWire = z.infer<typeof AdminAccountRetryWireSchema>

export interface AdminAccountRetry {
  readonly tenantId: string
  readonly adminAccount: {
    readonly status: "CREATED"
    readonly userStatus: string
    readonly tenantStatusSync: "SYNCED" | "FAILED"
  }
}

export function mapAdminAccountRetry(
  wire: AdminAccountRetryWire
): AdminAccountRetry {
  return {
    tenantId: wire.tenant_id,
    adminAccount: {
      status: wire.admin_account.status,
      userStatus: wire.admin_account.user_status,
      tenantStatusSync: wire.admin_account.tenant_status_sync,
    },
  }
}

// ---------- write whitelists (D5.3, REQ-FE-040) ----------

/** POST /api/v1/tenants. Optional fields are omitted when empty, never sent as null. */
export interface TenantCreateInput {
  readonly code: string
  readonly name: string
  readonly tenantCategoryId: string
  readonly deploymentType: DeploymentType
  readonly multiBranchEnabled: boolean
  readonly tenantAdminEmail: string
  readonly countryCode?: string
  readonly logoUrl?: string
}

/**
 * PATCH /api/v1/tenants/{id}. Only these three keys exist. `code`, `name`,
 * `tenantCategoryId`, `deploymentType`, `multiBranchEnabled` and
 * `tenantAdminEmail` are immutable and are not in the type. `null` clears.
 */
export interface TenantPatchInput {
  readonly isActive?: boolean
  readonly logoUrl?: string | null
  readonly countryCode?: string | null
}

/** Filters of GET /api/v1/tenants (FE doc 6.3, D8.1). There is no name filter. */
export interface TenantListParams {
  readonly page?: number
  readonly limit?: number
  readonly isActive?: boolean
  /** Exact match. */
  readonly code?: string
  readonly categoryId?: string
  readonly countryCode?: string
  readonly deploymentType?: DeploymentType
}
