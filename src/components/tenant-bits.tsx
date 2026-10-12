/** Display status of a tenant. `ACTIVE` is `is_active = true` in the contract. */
export type TenantStatus = "ACTIVE" | "INACTIVE"

/** Status: dot and label in Indonesian, matching the filter (Aktif, Nonaktif). Hijau untuk aktif, abu untuk nonaktif. */
export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const active = status === "ACTIVE"
  return (
    <span
      className={
        active
          ? "inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400"
          : "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
      }
    >
      <span
        aria-hidden="true"
        className={
          active
            ? "size-2 rounded-full bg-emerald-600 dark:bg-emerald-400"
            : "size-2 rounded-full bg-muted-foreground/50"
        }
      />
      {active ? "Aktif" : "Nonaktif"}
    </span>
  )
}
