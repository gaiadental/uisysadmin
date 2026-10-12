/**
 * The action buttons of one system user, shared by the list row and the detail
 * page (ARCH-FE-001 D6.4, D6.6). What shows comes from `userActionAccess`, so
 * the own account never gets suspend, deactivate, delete or role change. Every
 * button is disabled while any action is in flight (no double send).
 */

import { RowDeleteButton } from "@/components/delete-button"
import { Button } from "@/components/ui/button"
import type { SystemUser } from "@/types/system-user"

import type { UserActionAccess } from "./access"
import type { UserActionKind, UserActions } from "./use-user-actions"

interface UserActionButtonsProps {
  readonly user: SystemUser
  readonly access: UserActionAccess
  readonly actions: UserActions
  /** Present on the detail page only; the list does not change roles. */
  readonly onChangeRole?: () => void
}

interface ActionSpec {
  readonly kind: UserActionKind
  readonly allowed: boolean
  readonly label: string
  readonly busyLabel: string
  readonly destructive: boolean
}

export function UserActionButtons({
  user,
  access,
  actions,
  onChangeRole,
}: UserActionButtonsProps) {
  const busy = actions.pending !== null
  const specs: readonly ActionSpec[] = [
    {
      kind: "reactivate",
      allowed: access.canReactivate,
      label: "Aktifkan",
      busyLabel: "Mengaktifkan...",
      destructive: false,
    },
    {
      kind: "suspend",
      allowed: access.canSuspend,
      label: "Tangguhkan",
      busyLabel: "Menangguhkan...",
      destructive: false,
    },
    {
      kind: "deactivate",
      allowed: access.canDeactivate,
      label: "Nonaktifkan",
      busyLabel: "Menonaktifkan...",
      destructive: false,
    },
    {
      kind: "resetPassword",
      allowed: access.canResetPassword,
      label: "Reset password",
      busyLabel: "Mengirim...",
      destructive: false,
    },
    {
      kind: "delete",
      allowed: access.canDelete,
      label: "Hapus",
      busyLabel: "Menghapus...",
      destructive: true,
    },
  ]
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {onChangeRole !== undefined && access.canChangeRole ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={onChangeRole}
        >
          Ubah peran
        </Button>
      ) : null}
      {specs
        .filter((spec) => spec.allowed)
        .map((spec) => {
          if (spec.destructive) {
            return (
              <RowDeleteButton
                key={spec.kind}
                label={`${spec.label} ${user.loginId}`}
                disabled={busy}
                onClick={() => void actions.run(spec.kind, user)}
              />
            )
          }
          const isRunning =
            actions.pending?.userId === user.id &&
            actions.pending.kind === spec.kind
          return (
            <Button
              key={spec.kind}
              type="button"
              variant="outline"
              size="sm"
              aria-label={`${spec.label} ${user.loginId}`}
              disabled={busy}
              onClick={() => void actions.run(spec.kind, user)}
            >
              {isRunning ? spec.busyLabel : spec.label}
            </Button>
          )
        })}
    </div>
  )
}
