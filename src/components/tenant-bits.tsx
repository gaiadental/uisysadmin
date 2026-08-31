import { Badge } from "@/components/ui/badge"
import { tenantCategories } from "@/data/tenant-categories"
import { countries } from "@/data/countries"
import type { TenantStatus } from "@/data/tenants"

export function categoryLabel(key: string): string {
  return tenantCategories.find((c) => c.key === key)?.label ?? key
}

export function countryName(iso2: string): string {
  return countries.find((c) => c.iso2 === iso2)?.name ?? iso2
}

/** Badge status tenant — hijau/aktif vs abu/nonaktif. */
export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  if (status === "ACTIVE") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-600/30 font-mono text-emerald-700 dark:text-emerald-400"
      >
        ACTIVE
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="font-mono text-muted-foreground">
      INACTIVE
    </Badge>
  )
}

/** Jumlah cabang — 0 ditandai badge amber sebagai peringatan. */
export function BranchCount({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Badge
        variant="outline"
        className="border-amber-600/40 font-mono text-amber-700 dark:text-amber-500"
      >
        0
      </Badge>
    )
  }
  return <span className="font-mono tabular-nums">{count}</span>
}
