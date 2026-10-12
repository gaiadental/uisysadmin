import { Badge } from "@/components/ui/badge"

/** Display status of a tenant. `ACTIVE` is `is_active = true` in the contract. */
export type TenantStatus = "ACTIVE" | "INACTIVE"

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
