/**
 * Create dialog for a system user (REQ-FE-030; ARCH-FE-001 D5.3, D9, D12.1).
 * The request carries `loginId` and `systemRoleId` only. The server e-mails a
 * temporary password. Create is not idempotent (SP-BG-11): the submit is
 * disabled while the request is in flight, the dialog cannot be closed then,
 * and nothing retries. A 409 shows on the login field.
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/features/auth/components/field-error"
import type { WriteFailure } from "@/features/tenants/create/write-failure"
import { createSystemUser } from "@/lib/api/modules/system-users"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"

import { RoleSelect } from "./role-select"
import { userCreateSchema } from "./schema"
import { describeUserWriteFailure, isLoginExists } from "./user-failure"
import { useRoleOptions } from "./use-role-options"

interface UserCreateDialogProps {
  readonly onClose: () => void
}

export function UserCreateDialog({ onClose }: UserCreateDialogProps) {
  const [busy, setBusy] = useState(false)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        // The dialog stays open while a request is in flight.
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah akun</DialogTitle>
          <DialogDescription>
            Password sementara dikirim ke e-mail user. User wajib menggantinya
            saat masuk pertama kali.
          </DialogDescription>
        </DialogHeader>
        <CreateForm onClose={onClose} onBusyChange={setBusy} />
      </DialogContent>
    </Dialog>
  )
}

function CreateForm({
  onClose,
  onBusyChange,
}: {
  readonly onClose: () => void
  readonly onBusyChange: (busy: boolean) => void
}) {
  const queryClient = useQueryClient()
  const roles = useRoleOptions()
  const form = useZodForm(userCreateSchema, { loginId: "", systemRoleId: "" })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    onBusyChange(true)
    try {
      await createSystemUser(values)
      void applyInvalidation(queryClient, { kind: "systemUserWrite" })
      toast.success("Akun dibuat. Password sementara dikirim ke e-mail user.")
      onBusyChange(false)
      onClose()
    } catch (error) {
      onBusyChange(false)
      if (isLoginExists(error)) {
        form.setError("loginId", { type: "server", message: error.message })
        return
      }
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-login-id">Login ID (e-mail)</Label>
        <Input
          id="user-login-id"
          type="email"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={errors.loginId !== undefined}
          aria-describedby="user-login-id-error"
          {...form.register("loginId")}
        />
        <FieldError
          id="user-login-id-error"
          message={errors.loginId?.message}
        />
      </div>
      <RoleSelect
        id="user-role"
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
          {isSubmitting ? "Menyimpan..." : "Buat akun"}
        </Button>
      </DialogFooter>
    </form>
  )
}
