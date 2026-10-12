/** Status labels and badge for a system user (FE doc 5.1: ACTIVE, SUSPENDED, DEACTIVATED). */

import { Badge } from "@/components/ui/badge"
import type { SystemUserStatus } from "@/types/system-user"

import { USER_STATUS_LABELS } from "./status-labels"

/** Color is not the only cue: the label always shows. */
export function UserStatusBadge({
  status,
}: {
  readonly status: SystemUserStatus
}) {
  const label = USER_STATUS_LABELS[status]
  if (status === "ACTIVE") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400"
      >
        {label}
      </Badge>
    )
  }
  if (status === "SUSPENDED") {
    return (
      <Badge
        variant="outline"
        className="border-amber-600/40 text-amber-700 dark:text-amber-500"
      >
        {label}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="text-muted-foreground">
      {label}
    </Badge>
  )
}

/** The "self" marker shown next to the own account (D6.6). */
export function SelfBadge() {
  return <Badge variant="secondary">self</Badge>
}

/** Marks an account whose role was deleted. The account must be given a new role. */
export function RoleInactiveBadge() {
  return (
    <Badge variant="outline" className="border-destructive/40 text-destructive">
      Peran tidak aktif
    </Badge>
  )
}
