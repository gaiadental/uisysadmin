/**
 * Create and edit dialog for a system role (REQ-FE-033, REQ-FE-040; ARCH-FE-001
 * D6.6, D9, D12.1). On edit the `key` is shown read-only (FE-OQ-17 default) and
 * the request carries every current value with the key unchanged. Create is
 * not idempotent (SP-BG-11): the submit is disabled while the request is in
 * flight, the dialog cannot be closed then, and nothing retries. A 409 on
 * create shows on the key field. A protected-role refusal on edit shows the
 * server message and disables the submit (the role is marked refused).
 */

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Controller } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"
import { FieldError } from "@/features/auth/components/field-error"
import type { WriteFailure } from "@/features/tenants/create/write-failure"
import {
  createSystemRole,
  updateSystemRole,
} from "@/lib/api/modules/system-roles"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import type { SystemRole } from "@/types/system-role"

import {
  describeRoleWriteFailure,
  isRoleKeyExists,
  isRoleRefusal,
} from "./role-failure"
import { useRefusedRoles } from "./refused-roles"
import {
  ROLE_KEY_MAX,
  ROLE_NAME_MAX,
  roleFormSchema,
  type RoleFormValues,
} from "./schema"

export type RoleDialogState =
  | { readonly mode: "create" }
  | { readonly mode: "edit"; readonly role: SystemRole }

interface RoleFormDialogProps {
  readonly state: RoleDialogState
  readonly onClose: () => void
}

export function RoleFormDialog({ state, onClose }: RoleFormDialogProps) {
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
          <DialogTitle>
            {state.mode === "create" ? "Tambah peran" : "Ubah peran"}
          </DialogTitle>
          <DialogDescription>
            {state.mode === "create"
              ? "Key peran tidak bisa diubah setelah dibuat."
              : `Key ${state.role.key} tidak bisa diubah.`}
          </DialogDescription>
        </DialogHeader>
        <RoleForm state={state} onClose={onClose} onBusyChange={setBusy} />
      </DialogContent>
    </Dialog>
  )
}

function defaultsOf(state: RoleDialogState): RoleFormValues {
  if (state.mode === "create") {
    return { key: "", name: "", description: "", active: true }
  }
  return {
    key: state.role.key,
    name: state.role.name,
    description: state.role.description ?? "",
    active: state.role.active ?? true,
  }
}

function RoleForm({
  state,
  onClose,
  onBusyChange,
}: RoleFormDialogProps & { readonly onBusyChange: (busy: boolean) => void }) {
  const queryClient = useQueryClient()
  const refusals = useRefusedRoles()
  const form = useZodForm(roleFormSchema, defaultsOf(state))
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)
  const editing = state.mode === "edit"
  const refused = state.mode === "edit" && refusals.isRefused(state.role.id)

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    onBusyChange(true)
    try {
      if (state.mode === "edit") {
        // Every current value is sent; the key is the existing one, unchanged.
        await updateSystemRole(state.role.id, {
          ...values,
          key: state.role.key,
        })
        void applyInvalidation(queryClient, {
          kind: "systemRoleWrite",
          roleId: state.role.id,
        })
        toast.success("Peran disimpan.")
      } else {
        await createSystemRole(values)
        void applyInvalidation(queryClient, { kind: "systemRoleWrite" })
        toast.success("Peran dibuat.")
      }
      onBusyChange(false)
      onClose()
    } catch (error) {
      onBusyChange(false)
      if (state.mode === "edit" && isRoleRefusal(error)) {
        refusals.markRefused(state.role.id)
      }
      if (state.mode === "create" && isRoleKeyExists(error)) {
        form.setError("key", { type: "server", message: error.message })
        return
      }
      setAlert(describeRoleWriteFailure(error))
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
        <Label htmlFor="role-key">Key</Label>
        {state.mode === "edit" ? (
          <Input
            id="role-key"
            value={state.role.key}
            readOnly
            aria-readonly="true"
            aria-describedby="role-key-hint"
            className="bg-muted/50 font-mono"
          />
        ) : (
          <Input
            id="role-key"
            autoComplete="off"
            spellCheck={false}
            maxLength={ROLE_KEY_MAX}
            className="font-mono"
            aria-invalid={errors.key !== undefined}
            aria-describedby="role-key-hint role-key-error"
            {...form.register("key")}
          />
        )}
        <p id="role-key-hint" className="text-xs text-muted-foreground">
          {editing
            ? "Key tidak bisa diubah."
            : "Contoh: OPS_ADMIN. Tidak bisa diubah setelah dibuat."}
        </p>
        <FieldError id="role-key-error" message={errors.key?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role-name">Nama</Label>
        <Input
          id="role-name"
          autoComplete="off"
          maxLength={ROLE_NAME_MAX}
          aria-invalid={errors.name !== undefined}
          aria-describedby="role-name-error"
          {...form.register("name")}
        />
        <FieldError id="role-name-error" message={errors.name?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role-description">Deskripsi (opsional)</Label>
        <Input
          id="role-description"
          autoComplete="off"
          {...form.register("description")}
        />
      </div>
      <Controller
        control={form.control}
        name="active"
        render={({ field }) => (
          <div className="flex items-center gap-3">
            <Switch
              id="role-active"
              checked={field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
            />
            <Label htmlFor="role-active">Peran aktif</Label>
          </div>
        )}
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
        <Button type="submit" disabled={isSubmitting || refused}>
          {isSubmitting
            ? "Menyimpan..."
            : editing
              ? "Simpan"
              : "Buat peran"}
        </Button>
      </DialogFooter>
    </form>
  )
}
