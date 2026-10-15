/**
 * Edit dialog for a master permission (REQ-FE-035, REQ-FE-036, REQ-FE-040;
 * ARCH-FE-001 D9, D12.1; TODO-021). Only `name` and `description` are
 * editable. `key`, `category`, `module`, `active` and `customerPermitted` are
 * shown as read-only text. On save the permission is read again from the
 * server and the PATCH carries those fields exactly as fetched (FE-OQ-38
 * default: full body), never the values the list loaded earlier. A failed
 * re-fetch blocks the PATCH, shows the error and keeps the dialog open.
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
import {
  describeWriteFailure,
  type WriteFailure,
} from "@/features/tenants/create/write-failure"
import {
  getMasterPermission,
  updateMasterPermission,
} from "@/lib/api/modules/master-permissions"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import type { MasterPermission } from "@/types/master-permission"

import { PERMISSION_NAME_MAX, permissionEditSchema } from "./schema"

const INCOMPLETE_DATA_MESSAGE =
  "Data permission dari server tidak lengkap. Perubahan tidak disimpan."

export interface PermissionDialogState {
  readonly permission: MasterPermission
}

interface PermissionFormDialogProps {
  readonly state: PermissionDialogState
  readonly onClose: () => void
}

export function PermissionFormDialog({
  state,
  onClose,
}: PermissionFormDialogProps) {
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
          <DialogTitle>Ubah permission</DialogTitle>
          <DialogDescription>
            Hanya nama dan deskripsi yang bisa diubah.
          </DialogDescription>
        </DialogHeader>
        <EditForm
          permission={state.permission}
          onClose={onClose}
          onBusyChange={setBusy}
        />
      </DialogContent>
    </Dialog>
  )
}

interface EditFormProps {
  readonly permission: MasterPermission
  readonly onClose: () => void
  readonly onBusyChange: (busy: boolean) => void
}

function EditForm({ permission, onClose, onBusyChange }: EditFormProps) {
  const queryClient = useQueryClient()
  const form = useZodForm(permissionEditSchema, {
    name: permission.name,
    description: permission.description ?? "",
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    onBusyChange(true)
    try {
      // Read the current server values first. A failure here stops the save.
      const fresh = await getMasterPermission(permission.id)
      // The PATCH sends the full body, so a missing flag must not be guessed.
      if (
        typeof fresh.active !== "boolean" ||
        typeof fresh.customerPermitted !== "boolean"
      ) {
        onBusyChange(false)
        setAlert({ message: INCOMPLETE_DATA_MESSAGE, referenceId: null })
        return
      }
      await updateMasterPermission(permission.id, {
        key: fresh.key,
        name: values.name,
        description: values.description,
        category: fresh.category,
        module: fresh.module,
        active: fresh.active,
        customerPermitted: fresh.customerPermitted,
      })
      void applyInvalidation(queryClient, { kind: "masterPermissionWrite" })
      toast.success("Permission disimpan.")
      onBusyChange(false)
      onClose()
    } catch (error) {
      onBusyChange(false)
      setAlert(describeWriteFailure(error))
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
      <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
        <ReadOnlyRow label="Key" value={permission.key} mono />
        <ReadOnlyRow label="Kategori" value={permission.category} />
        <ReadOnlyRow label="Modul" value={permission.module} />
        <ReadOnlyRow label="Status" value={statusText(permission.active)} />
        <ReadOnlyRow
          label="Role pelanggan"
          value={
            permission.customerPermitted === true ? "Boleh dipakai" : "Internal"
          }
        />
      </dl>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="permission-name">Nama</Label>
        <Input
          id="permission-name"
          autoComplete="off"
          maxLength={PERMISSION_NAME_MAX}
          aria-invalid={errors.name !== undefined}
          aria-describedby="permission-name-error"
          {...form.register("name")}
        />
        <FieldError id="permission-name-error" message={errors.name?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="permission-description">Deskripsi (opsional)</Label>
        <Input
          id="permission-description"
          autoComplete="off"
          {...form.register("description")}
        />
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function statusText(active: boolean | undefined): string {
  if (active === undefined) return "Tidak diketahui"
  return active ? "Aktif" : "Nonaktif"
}

function ReadOnlyRow({
  label,
  value,
  mono = false,
}: {
  readonly label: string
  readonly value: string
  readonly mono?: boolean
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-xs" : undefined}>{value}</dd>
    </>
  )
}
