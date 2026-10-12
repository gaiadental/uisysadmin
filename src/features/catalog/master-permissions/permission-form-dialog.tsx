/**
 * Create and edit dialog for a master permission (REQ-FE-035, REQ-FE-036,
 * REQ-FE-040; ARCH-FE-001 D9, D12.1). On edit the `key` is shown read-only
 * (FE-OQ-17 default) and the request carries every current value with the key
 * unchanged. Create is not idempotent (SP-BG-11): the submit is disabled while
 * the request is in flight and nothing retries it. A 409 on create shows on
 * the key field.
 *
 * Category and module are free text with a native `<datalist>` of the values
 * already in the catalogue. A typed value that matches one ignoring case is
 * submitted with the existing spelling. A value one edit away from an existing
 * one shows a non-blocking warning. Changing `customerPermitted` on edit asks
 * for confirmation first.
 */

import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form"
import { toast } from "sonner"

import { useDialogs, type ConfirmRequest } from "@/components/dialogs/dialogs"
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
  describeWriteFailure,
  isConflict,
  type WriteFailure,
} from "@/features/tenants/create/write-failure"
import {
  createMasterPermission,
  listMasterPermissions,
  updateMasterPermission,
} from "@/lib/api/modules/master-permissions"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import type { MasterPermission } from "@/types/master-permission"

import {
  PERMISSION_CATEGORY_MAX,
  PERMISSION_KEY_MAX,
  PERMISSION_MODULE_MAX,
  PERMISSION_NAME_MAX,
  permissionCreateSchema,
  type PermissionCreateFormValues,
} from "./schema"

export type PermissionDialogState =
  | { readonly mode: "create" }
  | { readonly mode: "edit"; readonly permission: MasterPermission }

const CUSTOMER_PERMITTED_LABEL = "Boleh dipakai role pelanggan"
const CUSTOMER_PERMITTED_HINT =
  "Role konteks pelanggan hanya boleh memegang permission ini jika diaktifkan. Perubahan dicatat sebagai security event."

interface PermissionFormDialogProps {
  readonly state: PermissionDialogState
  readonly onClose: () => void
}

export function PermissionFormDialog({
  state,
  onClose,
}: PermissionFormDialogProps) {
  const [busy, setBusy] = useState(false)
  const catalog = useCatalogValues()
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
            {state.mode === "create" ? "Tambah permission" : "Ubah permission"}
          </DialogTitle>
          <DialogDescription>
            {state.mode === "create"
              ? "Key permission tidak bisa diubah setelah dibuat."
              : `Key ${state.permission.key} tidak bisa diubah.`}
          </DialogDescription>
        </DialogHeader>
        {state.mode === "create" ? (
          <CreateForm
            catalog={catalog}
            onClose={onClose}
            onBusyChange={setBusy}
          />
        ) : (
          <EditForm
            permission={state.permission}
            catalog={catalog}
            onClose={onClose}
            onBusyChange={setBusy}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Distinct category and module values already in the catalogue. */
interface CatalogValues {
  readonly categories: readonly string[]
  readonly modules: readonly string[]
  /** False while the list is loading or after it failed. The fields then work as plain text. */
  readonly loaded: boolean
}

const NO_CATALOG_VALUES: CatalogValues = {
  categories: [],
  modules: [],
  loaded: false,
}

/** Shares the list page's query, so no second request is sent while the list is open. */
function useCatalogValues(): CatalogValues {
  const query = useQuery({
    queryKey: queryKeys.masterPermissions.all(),
    queryFn: listMasterPermissions,
  })
  const data = query.data
  return useMemo(() => {
    if (data === undefined) return NO_CATALOG_VALUES
    return {
      categories: distinctValues(data, (item) => item.category),
      modules: distinctValues(data, (item) => item.module),
      loaded: true,
    }
  }, [data])
}

function foldCase(value: string): string {
  return value.toLocaleLowerCase()
}

/** One entry per value, ignoring case. The first spelling seen is kept, and the list is sorted. */
function distinctValues(
  items: readonly MasterPermission[],
  pick: (item: MasterPermission) => string
): string[] {
  const firstSpelling = new Map<string, string>()
  for (const item of items) {
    const value = pick(item).trim()
    if (value === "") continue
    const folded = foldCase(value)
    if (!firstSpelling.has(folded)) firstSpelling.set(folded, value)
  }
  return [...firstSpelling.values()].sort((a, b) => a.localeCompare(b))
}

/** The existing value that equals `value` ignoring case, if there is one. */
function findExisting(
  value: string,
  options: readonly string[]
): string | undefined {
  const folded = foldCase(value)
  return options.find((option) => foldCase(option) === folded)
}

/** The existing value one edit away from `value` after case-folding. Only used when there is no exact match. */
function findSimilar(
  value: string,
  options: readonly string[]
): string | undefined {
  const folded = foldCase(value)
  return options.find(
    (option) => levenshtein(folded, foldCase(option)) === 1
  )
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current: number[] = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        (previous[j] ?? 0) + 1,
        (current[j - 1] ?? 0) + 1,
        (previous[j - 1] ?? 0) + cost
      )
    }
    previous = current
  }
  return previous[b.length] ?? 0
}

/** Submits the spelling already in the catalogue when the typed value matches one ignoring case. */
function withExistingSpelling(
  values: PermissionCreateFormValues,
  catalog: CatalogValues
): PermissionCreateFormValues {
  return {
    ...values,
    category: findExisting(values.category, catalog.categories) ?? values.category,
    module: findExisting(values.module, catalog.modules) ?? values.module,
  }
}

function customerPermittedConfirmation(
  key: string,
  enabled: boolean
): ConfirmRequest {
  return {
    title: "Ubah akses role pelanggan?",
    description: `Permission ${key} akan ${enabled ? "diaktifkan" : "dinonaktifkan"} untuk role pelanggan. Perubahan ini dicatat sebagai security event.`,
    confirmLabel: "Simpan perubahan",
    tone: "default",
  }
}

interface FormProps {
  readonly catalog: CatalogValues
  readonly onClose: () => void
  readonly onBusyChange: (busy: boolean) => void
}

function CreateForm({ catalog, onClose, onBusyChange }: FormProps) {
  const queryClient = useQueryClient()
  const form = useZodForm(permissionCreateSchema, {
    key: "",
    name: "",
    description: "",
    category: "",
    module: "",
    active: true,
    customerPermitted: false,
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)

  const submit = form.handleSubmit(async (typed) => {
    const values = withExistingSpelling(typed, catalog)
    setAlert(null)
    onBusyChange(true)
    try {
      await createMasterPermission(values)
      void applyInvalidation(queryClient, { kind: "masterPermissionWrite" })
      toast.success("Permission dibuat.")
      onBusyChange(false)
      onClose()
    } catch (error) {
      onBusyChange(false)
      if (isConflict(error)) {
        form.setError("key", { type: "server", message: error.message })
        return
      }
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
        <Label htmlFor="permission-key">Key</Label>
        <Input
          id="permission-key"
          autoComplete="off"
          spellCheck={false}
          maxLength={PERMISSION_KEY_MAX}
          className="font-mono"
          aria-invalid={errors.key !== undefined}
          aria-describedby="permission-key-hint permission-key-error"
          {...form.register("key")}
        />
        <p id="permission-key-hint" className="text-xs text-muted-foreground">
          Contoh: system_users:view. Tidak bisa diubah setelah dibuat.
        </p>
        <FieldError id="permission-key-error" message={errors.key?.message} />
      </div>
      <SharedFields
        register={form.register}
        control={form.control}
        errors={errors}
        catalog={catalog}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Buat permission"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditForm({
  permission,
  catalog,
  onClose,
  onBusyChange,
}: FormProps & { readonly permission: MasterPermission }) {
  const queryClient = useQueryClient()
  const { confirm } = useDialogs()
  const savedCustomerPermitted = permission.customerPermitted ?? false
  const form = useZodForm(permissionCreateSchema, {
    key: permission.key,
    name: permission.name,
    description: permission.description ?? "",
    category: permission.category,
    module: permission.module,
    active: permission.active ?? true,
    customerPermitted: savedCustomerPermitted,
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)

  const submit = form.handleSubmit(async (typed) => {
    const values = withExistingSpelling(typed, catalog)
    setAlert(null)
    // A change to the customer flag is confirmed before anything is sent.
    if (values.customerPermitted !== savedCustomerPermitted) {
      const confirmed = await confirm(
        customerPermittedConfirmation(permission.key, values.customerPermitted)
      )
      if (!confirmed) return
    }
    onBusyChange(true)
    try {
      // Every current value is sent; the key is the existing one, unchanged.
      await updateMasterPermission(permission.id, {
        ...values,
        key: permission.key,
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="permission-key">Key</Label>
        <Input
          id="permission-key"
          value={permission.key}
          readOnly
          aria-readonly="true"
          aria-describedby="permission-key-hint"
          className="bg-muted/50 font-mono"
        />
        <p id="permission-key-hint" className="text-xs text-muted-foreground">
          Key tidak bisa diubah.
        </p>
      </div>
      <SharedFields
        register={form.register}
        control={form.control}
        errors={errors}
        catalog={catalog}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  )
}

interface SharedFieldsProps {
  readonly register: UseFormRegister<PermissionCreateFormValues>
  readonly control: Control<PermissionCreateFormValues>
  readonly errors: FieldErrors<PermissionCreateFormValues>
  readonly catalog: CatalogValues
}

function SharedFields({
  register,
  control,
  errors,
  catalog,
}: SharedFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="permission-name">Nama</Label>
        <Input
          id="permission-name"
          autoComplete="off"
          maxLength={PERMISSION_NAME_MAX}
          aria-invalid={errors.name !== undefined}
          aria-describedby="permission-name-error"
          {...register("name")}
        />
        <FieldError id="permission-name-error" message={errors.name?.message} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="permission-description">Deskripsi (opsional)</Label>
        <Input
          id="permission-description"
          autoComplete="off"
          {...register("description")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CatalogField
          name="category"
          label="Kategori"
          maxLength={PERMISSION_CATEGORY_MAX}
          options={catalog.categories}
          loaded={catalog.loaded}
          control={control}
          register={register}
          error={errors.category?.message}
        />
        <CatalogField
          name="module"
          label="Modul"
          maxLength={PERMISSION_MODULE_MAX}
          options={catalog.modules}
          loaded={catalog.loaded}
          control={control}
          register={register}
          error={errors.module?.message}
        />
      </div>
      <SwitchField control={control} name="active" label="Permission aktif" />
      <SwitchField
        control={control}
        name="customerPermitted"
        label={CUSTOMER_PERMITTED_LABEL}
        hint={CUSTOMER_PERMITTED_HINT}
      />
    </>
  )
}

interface CatalogFieldProps {
  readonly name: "category" | "module"
  readonly label: string
  readonly maxLength: number
  readonly options: readonly string[]
  readonly loaded: boolean
  readonly control: Control<PermissionCreateFormValues>
  readonly register: UseFormRegister<PermissionCreateFormValues>
  readonly error: string | undefined
}

/** Free text with a native datalist of existing values. The datalist cannot show an add row, so a new value gets helper text. */
function CatalogField({
  name,
  label,
  maxLength,
  options,
  loaded,
  control,
  register,
  error,
}: CatalogFieldProps) {
  const typed = useWatch({ control, name }).trim()
  const inputId = `permission-${name}`
  const listId = `${inputId}-options`
  const hintId = `${inputId}-hint`
  const warningId = `${inputId}-warning`
  const errorId = `${inputId}-error`

  const isNewValue =
    loaded && typed !== "" && findExisting(typed, options) === undefined
  const similar = isNewValue ? findSimilar(typed, options) : undefined

  const describedBy = [
    isNewValue ? hintId : null,
    similar !== undefined ? warningId : null,
    error !== undefined ? errorId : null,
  ]
    .filter((id): id is string => id !== null)
    .join(" ")

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        list={listId}
        autoComplete="off"
        maxLength={maxLength}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy === "" ? undefined : describedBy}
        {...register(name)}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {isNewValue ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {`Tambah "${typed}" sebagai nilai baru.`}
        </p>
      ) : null}
      {similar !== undefined ? (
        <p id={warningId} className="text-xs text-amber-700 dark:text-amber-500">
          {`Mirip dengan '${similar}'. Yakin ini nilai baru?`}
        </p>
      ) : null}
      <FieldError id={errorId} message={error} />
    </div>
  )
}

function SwitchField({
  control,
  name,
  label,
  hint,
}: {
  readonly control: Control<PermissionCreateFormValues>
  readonly name: "active" | "customerPermitted"
  readonly label: string
  readonly hint?: string
}) {
  const id = `permission-${name}`
  const hintId = `${id}-hint`
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <Switch
              id={id}
              checked={field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              aria-describedby={hint !== undefined ? hintId : undefined}
            />
            <Label htmlFor={id}>{label}</Label>
          </div>
          {hint !== undefined ? (
            <p id={hintId} className="text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
      )}
    />
  )
}
