import type { TenantDetail, TenantPatchInput } from "@/types/tenant"

import type { TenantProfileFormValues } from "../schema"

/**
 * The changed keys only (D5.3). An emptied field clears the value (`null`).
 * An empty result means nothing changed.
 */
export function buildPatch(
  tenant: Pick<TenantDetail, "logoUrl" | "countryCode">,
  values: TenantProfileFormValues
): TenantPatchInput {
  return {
    ...(values.logoUrl !== (tenant.logoUrl ?? "")
      ? { logoUrl: values.logoUrl === "" ? null : values.logoUrl }
      : {}),
    ...(values.countryCode !== (tenant.countryCode ?? "")
      ? { countryCode: values.countryCode === "" ? null : values.countryCode }
      : {}),
  }
}
