/**
 * Create and edit dialog for a country (REQ-FE-029, REQ-FE-040; ARCH-FE-001
 * D9, D12.1, D16). The code is typed in upper case (`^[A-Z]{2}$`). On edit the
 * code is shown read-only: it is the path key and is not in the request type.
 *
 * Create is not idempotent by contract (SP-BG-11): the submit button is
 * disabled while the request is in flight and nothing retries it. A 409 on
 * create (the code exists, or was deleted and cannot be reused) shows on the
 * code field with the server message.
 */

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Controller, type UseFormRegisterReturn } from "react-hook-form"
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
  describeWriteFailure,
  isConflict,
  type WriteFailure,
} from "@/features/tenants/create/write-failure"
import { createCountry, updateCountry } from "@/lib/api/modules/countries"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import type { Country } from "@/types/country"

import {
  COUNTRY_NAME_MAX,
  NATIONALITY_NAME_MAX,
  PHONE_CODE_MAX,
  countryCreateSchema,
  countryEditSchema,
} from "./schema"

export type CountryDialogState =
  | { readonly mode: "create" }
  | { readonly mode: "edit"; readonly country: Country }

interface CountryFormDialogProps {
  readonly state: CountryDialogState
  readonly onClose: () => void
}

export function CountryFormDialog({ state, onClose }: CountryFormDialogProps) {
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
            {state.mode === "create" ? "Tambah negara" : "Ubah negara"}
          </DialogTitle>
          <DialogDescription>
            {state.mode === "create"
              ? "Kode negara 2 huruf (ISO 3166-1) tidak bisa diubah setelah dibuat."
              : `Kode ${state.country.code} tidak bisa diubah.`}
          </DialogDescription>
        </DialogHeader>
        {state.mode === "create" ? (
          <CreateForm onClose={onClose} onBusyChange={setBusy} />
        ) : (
          <EditForm
            country={state.country}
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
  const form = useZodForm(countryCreateSchema, {
    code: "",
    name: "",
    nationalityName: "",
    phoneCode: "",
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    onBusyChange(true)
    try {
      await createCountry({
        code: values.code,
        name: values.name,
        ...(values.nationalityName !== ""
          ? { nationalityName: values.nationalityName }
          : {}),
        ...(values.phoneCode !== "" ? { phoneCode: values.phoneCode } : {}),
      })
      void applyInvalidation(queryClient, { kind: "countryWrite" })
      toast.success("Negara dibuat.")
      onBusyChange(false)
      onClose()
    } catch (error) {
      onBusyChange(false)
      if (isConflict(error)) {
        form.setError("code", { type: "server", message: error.message })
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
        <Label htmlFor="country-code">Kode negara</Label>
        <Controller
          control={form.control}
          name="code"
          render={({ field }) => (
            <Input
              id="country-code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={2}
              className="font-mono uppercase"
              aria-invalid={errors.code !== undefined}
              aria-describedby="country-code-hint country-code-error"
              name={field.name}
              ref={field.ref}
              value={field.value}
              onBlur={field.onBlur}
              onChange={(event) =>
                field.onChange(event.target.value.toUpperCase())
              }
            />
          )}
        />
        <p id="country-code-hint" className="text-xs text-muted-foreground">
          Dua huruf besar, misalnya SG. Tidak bisa diubah setelah dibuat.
        </p>
        <FieldError id="country-code-error" message={errors.code?.message} />
      </div>
      <OptionalFields
        nameField={form.register("name")}
        nationalityField={form.register("nationalityName")}
        phoneField={form.register("phoneCode")}
        nameError={errors.name?.message}
        nationalityError={errors.nationalityName?.message}
        phoneError={errors.phoneCode?.message}
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
          {isSubmitting ? "Menyimpan..." : "Buat negara"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function EditForm({
  country,
  onClose,
  onBusyChange,
}: FormProps & { readonly country: Country }) {
  const queryClient = useQueryClient()
  const form = useZodForm(countryEditSchema, {
    name: country.name,
    nationalityName: country.nationalityName ?? "",
    phoneCode: country.phoneCode ?? "",
    isActive: country.isActive,
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<WriteFailure | null>(null)
  const isActive = form.watch("isActive")

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    onBusyChange(true)
    try {
      await updateCountry(country.code, {
        name: values.name,
        isActive: values.isActive,
        ...(values.nationalityName !== ""
          ? { nationalityName: values.nationalityName }
          : {}),
        ...(values.phoneCode !== "" ? { phoneCode: values.phoneCode } : {}),
      })
      void applyInvalidation(queryClient, { kind: "countryWrite" })
      toast.success("Negara disimpan.")
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
        <Label htmlFor="country-code">Kode negara</Label>
        <Input
          id="country-code"
          value={country.code}
          readOnly
          aria-readonly="true"
          aria-describedby="country-code-hint"
          className="bg-muted/50 font-mono"
        />
        <p id="country-code-hint" className="text-xs text-muted-foreground">
          Kode tidak bisa diubah.
        </p>
      </div>
      <OptionalFields
        nameField={form.register("name")}
        nationalityField={form.register("nationalityName")}
        phoneField={form.register("phoneCode")}
        nameError={errors.name?.message}
        nationalityError={errors.nationalityName?.message}
        phoneError={errors.phoneCode?.message}
      />
      <div className="flex items-center gap-3">
        <Switch
          id="country-active"
          checked={isActive}
          onCheckedChange={(checked) =>
            form.setValue("isActive", checked, { shouldDirty: true })
          }
        />
        <Label htmlFor="country-active">Negara aktif</Label>
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

interface OptionalFieldsProps {
  readonly nameField: UseFormRegisterReturn
  readonly nationalityField: UseFormRegisterReturn
  readonly phoneField: UseFormRegisterReturn
  readonly nameError: string | undefined
  readonly nationalityError: string | undefined
  readonly phoneError: string | undefined
}

/** The name, nationality and phone code fields are the same in both modes. */
function OptionalFields({
  nameField,
  nationalityField,
  phoneField,
  nameError,
  nationalityError,
  phoneError,
}: OptionalFieldsProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="country-name">Nama negara</Label>
        <Input
          id="country-name"
          autoComplete="off"
          maxLength={COUNTRY_NAME_MAX}
          aria-invalid={nameError !== undefined}
          aria-describedby="country-name-error"
          {...nameField}
        />
        <FieldError id="country-name-error" message={nameError} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="country-nationality">Kewarganegaraan (opsional)</Label>
        <Input
          id="country-nationality"
          autoComplete="off"
          maxLength={NATIONALITY_NAME_MAX}
          aria-invalid={nationalityError !== undefined}
          aria-describedby="country-nationality-error"
          {...nationalityField}
        />
        <FieldError
          id="country-nationality-error"
          message={nationalityError}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="country-phone">Kode telepon (opsional)</Label>
        <Input
          id="country-phone"
          autoComplete="off"
          inputMode="tel"
          maxLength={PHONE_CODE_MAX}
          aria-invalid={phoneError !== undefined}
          aria-describedby="country-phone-error"
          {...phoneField}
        />
        <FieldError id="country-phone-error" message={phoneError} />
      </div>
    </>
  )
}
