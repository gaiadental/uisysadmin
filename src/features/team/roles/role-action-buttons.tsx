/**
 * The edit and delete buttons of one system role, shared by the list row and
 * the detail page (ARCH-FE-001 D6.4, D6.6). SYS_PRINCIPAL gets neither button
 * (static lock) and shows a "Terkunci" badge. After a backend refusal the
 * buttons stay visible but disabled, with a hint. Delete is also disabled
 * while a delete runs (no double send).
 */

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SystemRole } from "@/types/system-role"

import type { RoleActionAccess } from "./access"

interface RoleActionButtonsProps {
  readonly role: SystemRole
  readonly access: RoleActionAccess
  readonly deleting: boolean
  readonly onEdit: () => void
  readonly onDelete: () => void
}

export function RoleActionButtons({
  role,
  access,
  deleting,
  onEdit,
  onDelete,
}: RoleActionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {access.locked ? <Badge variant="secondary">Terkunci</Badge> : null}
      {access.refused ? (
        <span className="text-xs text-muted-foreground">
          Ditolak server
        </span>
      ) : null}
      {access.canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Ubah ${role.name}`}
          disabled={access.refused || deleting}
          onClick={onEdit}
        >
          Ubah
        </Button>
      ) : null}
      {access.canDelete ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          aria-label={`Hapus ${role.name}`}
          disabled={access.refused || deleting}
          onClick={onDelete}
        >
          {deleting ? "Menghapus..." : "Hapus"}
        </Button>
      ) : null}
    </div>
  )
}
