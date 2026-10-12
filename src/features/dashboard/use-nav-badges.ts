/**
 * Sidebar badge counts (REQ-FE-038; ARCH-FE-001 D7). The badge keys come from
 * `app/navigation.ts`. The totals are the contract totals of the same
 * `limit=1` queries as the dashboard. A badge is `null` while its count loads,
 * when it failed, and for a user who may not read master data: the sidebar then
 * shows no badge. Failures are shown on the dashboard, not in the sidebar.
 */

import type { NavBadgeKey } from "@/app/navigation"
import { useAuth } from "@/app/providers/auth-provider"
import { SYS_PRINCIPAL } from "@/lib/access/roles"

import {
  useCountryTotal,
  useTenantCategoryTotal,
  useTenantTotal,
} from "./dashboard-queries"

export type NavBadgeCounts = Readonly<Record<NavBadgeKey, number | null>>

export function useNavBadges(): NavBadgeCounts {
  const { status, me } = useAuth()
  const enabled =
    status === "authenticated" && me !== null && me.role === SYS_PRINCIPAL
  const tenants = useTenantTotal(enabled)
  const categories = useTenantCategoryTotal(enabled)
  const countries = useCountryTotal(enabled)
  return {
    tenants: enabled ? (tenants.data ?? null) : null,
    tenantCategories: enabled ? (categories.data ?? null) : null,
    countries: enabled ? (countries.data ?? null) : null,
  }
}
