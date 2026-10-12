/**
 * Tenant create wizard (`/tenants/new`; REQ-FE-021; ARCH-FE-001 D8.2, D9,
 * D13, D14). Four steps: Identitas, Penyimpanan, Admin awal, Tinjau dan buat.
 * One React Hook Form form holds all values. Each step validates its own
 * fields with the matching Zod step schema before the next step opens.
 *
 * The POST is not idempotent by contract (SP-BG-11). The submit button is
 * disabled while the request is in flight, and nothing retries it. The tenant
 * exists whenever the server answers 201, so the page then moves to the
 * detail page. A warning outcome waits for the user, because it offers the
 * Retry button for the admin account (D8.2).
 */

import { useState, type FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Controller } from "react-hook-form"
import { toast } from "sonner"

import { AppLink } from "@/features/auth/components/app-link"
import { navigateTo } from "@/app/router"
import { FormAlert } from "@/components/custom/form-alert"
import { PageBody, PageHeader } from "@/components/page-header"
import { WizardSteps, type WizardStep } from "@/components/wizard-steps"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FieldError } from "@/features/auth/components/field-error"
import { retryAdminAccount, createTenant } from "@/lib/api/modules/tenants"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import { routeMeta } from "@/lib/routes-meta"
import type { TenantCreateInput } from "@/types/tenant"

import { detailPathOf } from "../detail/tenant-paths"
import { DEPLOYMENT_LABELS } from "../list/list-filters"
import {
  CODE_MAX,
  CREATE_STEP_FIELDS,
  EMAIL_MAX,
  LOGO_URL_MAX,
  NAME_MAX,
  tenantCreateSchema,
  type TenantCreateFormValues,
} from "../schema"
import { isFormValidationError } from "../shared/errors"
import {
  categoryNameOf,
  countryNameOf,
  useCountries,
  useTenantCategories,
} from "../shared/reference-data"
import {
  classifyAdminAccount,
  type AdminAccountOutcome,
} from "./classify-admin-account"
import { SelectField } from "./select-field"
import {
  describeWriteFailure,
  isConflict,
  type WriteFailure,
} from "./write-failure"

const META = routeMeta["tenant.new"]

const STEPS: WizardStep[] = [
  { id: "identitas", title: "Identitas", key: "identity" },
  { id: "penyimpanan", title: "Penyimpanan", key: "storage" },
  { id: "admin", title: "Admin awal", key: "initial_admin" },
  { id: "tinjau", title: "Tinjau dan buat", key: "review" },
]
const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof TenantCreateFormValues>> =
  [
    CREATE_STEP_FIELDS.identity,
    CREATE_STEP_FIELDS.storage,
    CREATE_STEP_FIELDS.admin,
    [],
  ]
const LAST_STEP = STEPS.length - 1

const DEFAULT_VALUES: TenantCreateFormValues = {
  code: "",
  name: "",
  tenantCategoryId: "",
  countryCode: "",
  deploymentType: "MULTI_TENANT",
  multiBranchEnabled: true,
  tenantAdminEmail: "",
  logoUrl: "",
}

/** The write whitelist (D5.3). An empty optional field is left out, never sent as null. */
function toCreateInput(values: TenantCreateFormValues): TenantCreateInput {
  return {
    code: values.code,
    name: values.name,
    tenantCategoryId: values.tenantCategoryId,
    deploymentType: values.deploymentType,
    multiBranchEnabled: values.multiBranchEnabled,
    tenantAdminEmail: values.tenantAdminEmail,
    ...(values.countryCode !== "" ? { countryCode: values.countryCode } : {}),
    ...(values.logoUrl !== "" ? { logoUrl: values.logoUrl } : {}),
  }
}

interface CreatedTenant {
  readonly id: string
  readonly code: string
  readonly outcome: AdminAccountOutcome
}

export function TenantCreatePage() {
  const queryClient = useQueryClient()
  const form = useZodForm(tenantCreateSchema, DEFAULT_VALUES)
  const { errors, isSubmitting } = form.formState
  const [step, setStep] = useState(0)
  const [alert, setAlert] = useState<WriteFailure | null>(null)
  const [created, setCreated] = useState<CreatedTenant | null>(null)

  const categoriesQuery = useTenantCategories()
  const countriesQuery = useCountries()
  const categories = categoriesQuery.data
  const countries = countriesQuery.data
  const categoryOptions = (categories ?? [])
    .filter((item) => item.isActive)
    .map((item) => ({ value: item.id, label: item.name }))
  const countryOptions = (countries ?? [])
    .filter((item) => item.isActive)
    .map((item) => ({ value: item.code, label: `${item.name} (${item.code})` }))

  const goNext = async () => {
    const valid = await form.trigger([...(STEP_FIELDS[step] ?? [])])
    if (valid) setStep((current) => Math.min(current + 1, LAST_STEP))
  }

  const submit = form.handleSubmit(async (values) => {
    setAlert(null)
    try {
      const tenant = await createTenant(toCreateInput(values))
      void applyInvalidation(queryClient, { kind: "tenantCreate" })
      const outcome = classifyAdminAccount(tenant.adminAccount)
      if (outcome.needsRetry) {
        toast.warning(outcome.message)
        setCreated({ id: tenant.id, code: tenant.code, outcome })
        return
      }
      toast.success(outcome.message)
      navigateTo(detailPathOf(tenant.id))
    } catch (error) {
      if (isConflict(error)) {
        // 409: the code is taken. The message is shown on the code field (D8.2).
        form.setError("code", { type: "server", message: error.message })
        setStep(0)
        return
      }
      const failure = describeWriteFailure(error)
      setAlert(failure)
      if (!isFormValidationError(error)) {
        console.error("[tenant.create] failed")
      }
    }
  })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Enter inside a field must not create the tenant before the review step.
    if (step < LAST_STEP) {
      void goNext()
      return
    }
    void submit()
  }

  if (created !== null) {
    return (
      <PageBody>
        <PageHeader title={META.title} />
        <CreatedPanel
          created={created}
          onChange={(outcome) => setCreated({ ...created, outcome })}
        />
      </PageBody>
    )
  }

  const values = form.watch()

  return (
    <PageBody>
      <PageHeader
        title={META.title}
        {...(META.description !== undefined
          ? { description: META.description }
          : {})}
        actions={
          <Button variant="outline" onClick={() => navigateTo("/tenants")}>
            Batal
          </Button>
        }
      />

      <FormAlert
        message={alert?.message ?? null}
        referenceId={alert?.referenceId ?? null}
      />

      <Card>
        <CardHeader className="border-b bg-muted/40">
          <WizardSteps
            steps={STEPS}
            current={step}
            onStepClick={(index) => setStep(index)}
          />
        </CardHeader>
        <form noValidate onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-5 py-2">
            {step === 0 ? (
              <fieldset className="flex flex-col gap-4">
                <legend className="sr-only">Identitas</legend>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tenant-code">Kode tenant</Label>
                  <Controller
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <Input
                        id="tenant-code"
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        maxLength={CODE_MAX}
                        aria-invalid={errors.code !== undefined}
                        aria-describedby="tenant-code-hint tenant-code-error"
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
                  <p
                    id="tenant-code-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Gunakan huruf besar, misalnya SMILE. Kode tidak bisa diubah
                    setelah tenant dibuat.
                  </p>
                  <FieldError
                    id="tenant-code-error"
                    message={errors.code?.message}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tenant-name">Nama tenant</Label>
                  <Input
                    id="tenant-name"
                    autoComplete="off"
                    maxLength={NAME_MAX}
                    aria-invalid={errors.name !== undefined}
                    aria-describedby="tenant-name-error"
                    {...form.register("name")}
                  />
                  <FieldError
                    id="tenant-name-error"
                    message={errors.name?.message}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tenant-category">Kategori tenant</Label>
                  <SelectField
                    id="tenant-category"
                    placeholder="Pilih kategori"
                    options={categoryOptions}
                    aria-invalid={errors.tenantCategoryId !== undefined}
                    aria-describedby="tenant-category-error"
                    {...form.register("tenantCategoryId")}
                  />
                  <FieldError
                    id="tenant-category-error"
                    message={errors.tenantCategoryId?.message}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tenant-country">Negara (opsional)</Label>
                  <SelectField
                    id="tenant-country"
                    placeholder="Tanpa negara"
                    options={countryOptions}
                    {...form.register("countryCode")}
                  />
                </div>
              </fieldset>
            ) : null}

            {step === 1 ? (
              <fieldset className="flex flex-col gap-4">
                <legend className="mb-1 text-sm font-medium">
                  Tipe penyebaran
                </legend>
                {(["MULTI_TENANT", "DEDICATED"] as const).map((type) => (
                  <label key={type} className="flex items-start gap-2 text-sm">
                    <input
                      type="radio"
                      value={type}
                      className="mt-1"
                      {...form.register("deploymentType")}
                    />
                    <span>
                      {DEPLOYMENT_LABELS[type]}
                      <span className="block text-xs text-muted-foreground">
                        {type === "DEDICATED"
                          ? "Hanya satu tenant DEDICATED yang boleh aktif per penyebaran."
                          : "Berbagi infrastruktur dengan tenant lain."}
                      </span>
                    </span>
                  </label>
                ))}
                <div className="flex items-center gap-3">
                  <Switch
                    id="tenant-multi-branch"
                    checked={values.multiBranchEnabled}
                    onCheckedChange={(checked) =>
                      form.setValue("multiBranchEnabled", checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                  <Label htmlFor="tenant-multi-branch">
                    Multi cabang aktif
                  </Label>
                </div>
              </fieldset>
            ) : null}

            {step === 2 ? (
              <fieldset className="flex flex-col gap-4">
                <legend className="sr-only">Admin awal</legend>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tenant-admin-email">
                    E-mail admin tenant
                  </Label>
                  <Input
                    id="tenant-admin-email"
                    type="email"
                    autoComplete="off"
                    maxLength={EMAIL_MAX}
                    aria-invalid={errors.tenantAdminEmail !== undefined}
                    aria-describedby="tenant-admin-email-error"
                    {...form.register("tenantAdminEmail")}
                  />
                  <FieldError
                    id="tenant-admin-email-error"
                    message={errors.tenantAdminEmail?.message}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="tenant-logo-url">URL logo (opsional)</Label>
                  <Input
                    id="tenant-logo-url"
                    type="url"
                    autoComplete="off"
                    maxLength={LOGO_URL_MAX}
                    aria-invalid={errors.logoUrl !== undefined}
                    aria-describedby="tenant-logo-url-error"
                    {...form.register("logoUrl")}
                  />
                  <FieldError
                    id="tenant-logo-url-error"
                    message={errors.logoUrl?.message}
                  />
                </div>
              </fieldset>
            ) : null}

            {step === LAST_STEP ? (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <ReviewItem label="Kode tenant" value={values.code} mono />
                <ReviewItem label="Nama tenant" value={values.name} />
                <ReviewItem
                  label="Kategori"
                  value={
                    categoryNameOf(categories, values.tenantCategoryId) ??
                    values.tenantCategoryId
                  }
                />
                <ReviewItem
                  label="Negara"
                  value={
                    values.countryCode === ""
                      ? "—"
                      : (countryNameOf(countries, values.countryCode) ??
                        values.countryCode)
                  }
                />
                <ReviewItem
                  label="Tipe penyebaran"
                  value={DEPLOYMENT_LABELS[values.deploymentType]}
                />
                <ReviewItem
                  label="Multi cabang"
                  value={values.multiBranchEnabled ? "Aktif" : "Tidak aktif"}
                />
                <ReviewItem
                  label="E-mail admin tenant"
                  value={values.tenantAdminEmail}
                />
                <ReviewItem
                  label="URL logo"
                  value={values.logoUrl === "" ? "—" : values.logoUrl}
                />
              </dl>
            ) : null}
          </CardContent>
          <CardFooter className="justify-between border-t bg-muted/40">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0 || isSubmitting}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
            >
              Kembali
            </Button>
            {step < LAST_STEP ? (
              <Button type="button" onClick={() => void goNext()}>
                Lanjut
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Membuat tenant..." : "Buat tenant"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </PageBody>
  )
}

function ReviewItem({
  label,
  value,
  mono = false,
}: {
  readonly label: string
  readonly value: string
  readonly mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono" : undefined}>{value}</dd>
    </div>
  )
}

interface CreatedPanelProps {
  readonly created: CreatedTenant
  readonly onChange: (outcome: AdminAccountOutcome) => void
}

/** The warning outcome with the Retry button (D8.2). The tenant exists. */
function CreatedPanel({ created, onChange }: CreatedPanelProps) {
  const queryClient = useQueryClient()
  const [retrying, setRetrying] = useState(false)
  const [failure, setFailure] = useState<WriteFailure | null>(null)

  const retry = async () => {
    if (retrying) return
    setRetrying(true)
    setFailure(null)
    try {
      const result = await retryAdminAccount(created.id)
      void applyInvalidation(queryClient, {
        kind: "adminAccountRetry",
        tenantId: created.id,
      })
      const outcome = classifyAdminAccount({
        status: result.adminAccount.status,
        tenantStatusSync: result.adminAccount.tenantStatusSync,
      })
      if (outcome.needsRetry) {
        toast.warning(outcome.message)
        onChange(outcome)
        return
      }
      toast.success(outcome.message)
      navigateTo(detailPathOf(created.id))
    } catch (error) {
      setFailure(describeWriteFailure(error))
    } finally {
      setRetrying(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm">
          Tenant <span className="font-mono font-medium">{created.code}</span>{" "}
          sudah dibuat.
        </p>
        <div
          role="alert"
          className="rounded-lg border border-amber-600/40 bg-amber-500/10 px-3 py-2 text-sm"
        >
          {created.outcome.message}
        </div>
        <FormAlert
          message={failure?.message ?? null}
          referenceId={failure?.referenceId ?? null}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={retrying}
            onClick={() => void retry()}
          >
            {retrying ? "Mengirim ulang..." : "Kirim ulang akun admin"}
          </Button>
          <AppLink to={detailPathOf(created.id)}>Buka detail tenant</AppLink>
        </div>
      </CardContent>
    </Card>
  )
}
