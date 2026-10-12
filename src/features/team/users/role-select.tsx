/**
 * The role field of the user forms: a labelled native select plus the loading,
 * error and empty states of the role list (ARCH-FE-001 D9, D13, D16). The role
 * list needs `system_roles:view` (D6.4); the forms are not offered without it.
 */

import type { ComponentProps } from "react"

import { FormAlert } from "@/components/custom/form-alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/features/auth/components/field-error"
import { SelectField } from "@/features/tenants/create/select-field"
import { describeReadFailure } from "@/features/tenants/shared/failure"

import type { RoleOptions } from "./use-role-options"

interface RoleSelectProps {
  readonly id: string
  readonly roles: RoleOptions
  readonly error: string | undefined
  readonly selectProps: Omit<ComponentProps<"select">, "id">
}

export function RoleSelect({ id, roles, error, selectProps }: RoleSelectProps) {
  const { query, options } = roles
  const failure = query.isError ? describeReadFailure(query.error) : null
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Peran</Label>
      {query.isPending ? (
        <p role="status" className="text-sm text-muted-foreground">
          Memuat peran...
        </p>
      ) : null}
      {failure !== null ? (
        <FormAlert message={failure.message} referenceId={failure.referenceId}>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              Coba lagi
            </Button>
          </div>
        </FormAlert>
      ) : null}
      <SelectField
        // Remounted once the options exist, so the registered default value is applied.
        key={query.isSuccess ? "ready" : "loading"}
        id={id}
        options={options}
        placeholder="Pilih peran"
        disabled={query.isPending || failure !== null}
        aria-invalid={error !== undefined}
        aria-describedby={`${id}-error`}
        {...selectProps}
      />
      {query.isSuccess && options.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada peran.</p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}
