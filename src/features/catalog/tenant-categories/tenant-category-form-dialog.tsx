/**
 * Create and edit dialog for a tenant category (REQ-FE-028, REQ-FE-029;
 * ARCH-FE-001 D9, D12.1, D16). One React Hook Form form with a Zod schema per
 * mode. On edit the code is shown read-only and is not in the request type.
 *
 * Create is not idempotent by contract (SP-BG-11): the submit button is
 * disabled while the request is in flight and nothing retries it. A 409 (code
 * or name taken) and a 400 show as one form alert with the server message.
 */

import { useState } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
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
import { Switch } from "@/components/ui/switch"
import { FieldError } from "@/features/auth/components/field-error"
import {
  createTenantCategory,
  updateTenantCategory,
} from "@/lib/api/modules/tenant-categories"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import type { TenantCategory } from "@/types/tenant-category"

import {
  describeWriteFailure,
  type WriteFailure,
} from "@/features/tenants/create/write-failure"

import {
  CATEGORY_CODE_MAX,
  CATEGORY_NAME_MAX,
  categoryCreateSchema,
  categoryEditSchema,
} from "./schema"

export type CategoryDialogState =
  | { readonly mode: "create" }
  | { readonly mode: "edit"; readonly category: TenantCategory }

interface CategoryFormDialogProps {
  readonly state: CategoryDialogState
  readonly onClose: () => void
}

export function CategoryFormDialog({ state, onClose }: CategoryFormDialogProps) {
  const [busy, setBusy] = useState(false)
  const title = state.mode === "create" ? "Tambah kategori" : "Ubah kategori"
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {state.mode === "create"
              ? "Kode tidak bisa diubah setelah kategori dibuat."
              : `Kode ${state.category.code} tidak bisa diubah.`}
          </DialogDescription>
        </DialogHeader>
        {state.mode === "create" ? (
          <CreateForm onClose={onClose} onBusyChange={setBusy} />
        ) : (
          <EditForm
            category={state.category}
            onClose={onClose}
            onBusyChange={setBusy}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface FormProps {
  readonly onClose: () => void
  readonly onBusyChange: (busy: boolean) => void
}

function CreateForm({ onClose, onBusyChange }: FormProps) {
  const queryClient = useQueryClient()
  const form = useZodForm(categoryCreateSchema, {
    code: "",
    name: "",
    description: "",
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    onBusyChange(true)
    try {
      await createTenantCategory({
        code: values.code,
        name: values.name,
        ...(values.description !== "" ? { description: values.description } : {}),
      })
      void applyInvalidation(queryClient, { kind: "tenantCategoryWrite" })
      toast.success("Kategori dibuat.")
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-code">Kode kategori</Label>
        <Input
          id="category-code"
          autoComplete="off"
          spellCheck={false}
          maxLength={CATEGORY_CODE_MAX}
          aria-invalid={errors.code !== undefined}
          aria-describedby="category-code-error"
          {...form.register("code")}
        />
        <FieldError id="category-code-error" message={errors.code?.message} />
      </div>
      <NameAndDescription
        nameField={form.register("name")}
        descriptionField={form.register("description")}
        nameError={errors.name?.message}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Buat kategori"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditForm({
  category,
  onClose,
  onBusyChange,
}: FormProps & { readonly category: TenantCategory }) {
  const queryClient = useQueryClient()
  const form = useZodForm(categoryEditSchema, {
    name: category.name,
    description: category.description ?? "",
    isActive: category.isActive,
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)
  const isActive = form.watch("isActive")

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    onBusyChange(true)
    try {
      await updateTenantCategory(category.id, {
        name: values.name,
        isActive: values.isActive,
        ...(values.description !== "" ? { description: values.description } : {}),
      })
      void applyInvalidation(queryClient, { kind: "tenantCategoryWrite" })
      toast.success("Kategori disimpan.")
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-code">Kode kategori</Label>
        <Input
          id="category-code"
          value={category.code}
          readOnly
          aria-readonly="true"
          aria-describedby="category-code-hint"
          className="bg-muted/50 font-mono"
        />
        <p id="category-code-hint" className="text-xs text-muted-foreground">
          Kode tidak bisa diubah.
        </p>
      </div>
      <NameAndDescription
        nameField={form.register("name")}
        descriptionField={form.register("description")}
        nameError={errors.name?.message}
      />
      <div className="flex items-center gap-3">
        <Switch
          id="category-active"
          checked={isActive}
          onCheckedChange={(checked) =>
            form.setValue("isActive", checked, { shouldDirty: true })
          }
        />
        <Label htmlFor="category-active">Kategori aktif</Label>
      </div>
      {errors.isActive !== undefined ? (
        <FieldError id="category-active-error" message={errors.isActive.message} />
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  )
}

interface NameAndDescriptionProps {
  readonly nameField: UseFormRegisterReturn
  readonly descriptionField: UseFormRegisterReturn
  readonly nameError: string | undefined
}

/** The name and description fields are the same in both modes. */
function NameAndDescription({
  nameField,
  descriptionField,
  nameError,
}: NameAndDescriptionProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-name">Nama kategori</Label>
        <Input
          id="category-name"
          autoComplete="off"
          maxLength={CATEGORY_NAME_MAX}
          aria-invalid={nameError !== undefined}
          aria-describedby="category-name-error"
          {...nameField}
        />
        <FieldError id="category-name-error" message={nameError} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category-description">Deskripsi (opsional)</Label>
        <Input
          id="category-description"
          autoComplete="off"
          {...descriptionField}
        />
      </div>
    </>
  )
}
