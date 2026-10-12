/**
 * Role change dialog for a system user (REQ-FE-031; ARCH-FE-001 D5.3, D6.4,
 * D9, D12.1). The request carries `systemRoleId` only. The caller shows the
 * dialog only for another user's account and with `system_users:update` and
 * `system_roles:view` (FE-OQ-25 default: the own role is not changed here).
 */

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { FormAlert } from "@/components/custom/form-alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { WriteFailure } from "@/features/tenants/create/write-failure"
import { changeSystemUserRole } from "@/lib/api/modules/system-users"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import type { SystemUser } from "@/types/system-user"

import { RoleSelect } from "./role-select"
import { userRoleChangeSchema } from "./schema"
import { describeUserWriteFailure } from "./user-failure"
import { useRoleOptions } from "./use-role-options"

interface UserRoleDialogProps {
  readonly user: SystemUser
  readonly onClose: () => void
}

export function UserRoleDialog({ user, onClose }: UserRoleDialogProps) {
  const [busy, setBusy] = useState(false)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah peran</DialogTitle>
          <DialogDescription>Peran untuk {user.loginId}.</DialogDescription>
        </DialogHeader>
        <RoleForm user={user} onClose={onClose} onBusyChange={setBusy} />
      </DialogContent>
    </Dialog>
  )
}

function RoleForm({
  user,
  onClose,
  onBusyChange,
}: {
  readonly user: SystemUser
  readonly onClose: () => void
  readonly onBusyChange: (busy: boolean) => void
}) {
  const queryClient = useQueryClient()
  const roles = useRoleOptions()
  const form = useZodForm(userRoleChangeSchema, {
    systemRoleId: String(user.systemRoleId),
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    if (values.systemRoleId === user.systemRoleId) {
      onClose()
      return
    }
    onBusyChange(true)
    try {
      await changeSystemUserRole(user.id, values.systemRoleId)
      void applyInvalidation(queryClient, {
        kind: "systemUserWrite",
        userId: user.id,
      })
      toast.success("Peran diubah.")
      onBusyChange(false)
      onClose()
    } catch (error) {
      onBusyChange(false)
      setAlert(describeUserWriteFailure(error))
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      className="flex flex-col gap-4"
    >
      <FormAlert
        message={alert?.message ?? null}
        referenceId={alert?.referenceId ?? null}
      />
      <RoleSelect
        id="user-role-change"
        roles={roles}
        error={errors.systemRoleId?.message}
        selectProps={form.register("systemRoleId")}
      />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting || !roles.query.isSuccess}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  )
}
