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

import { useEffect, useRef, useState, type FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Controller } from "react-hook-form"
import { toast } from "sonner"

import { AppLink } from "@/features/auth/components/app-link"
import { navigateTo } from "@/app/router"
import { FormAlert } from "@/components/custom/form-alert"
import { PageBody, PageHeader } from "@/components/page-header"
import { WizardSteps, type WizardStep } from "@/components/wizard-steps"
import { IconAlertTriangle } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { ChoiceChip } from "@/components/ui/choice-chip"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { FieldError } from "@/features/auth/components/field-error"
import { retryAdminAccount, createTenant } from "@/lib/api/modules/tenants"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import { routeMeta } from "@/lib/routes-meta"
import { cn } from "@/lib/utils"
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
import { isTenantCodeTaken } from "./code-availability"
import { SelectField } from "./select-field"
import {
  describeWriteFailure,
  isConflict,
  type WriteFailure,
} from "./write-failure"

const META = routeMeta["tenant.new"]

const STEP_TITLE_ID = "wizard-step-title"

const STEPS: WizardStep[] = [
  { id: "identitas", title: "Identitas" },
  { id: "penyimpanan", title: "Penyimpanan" },
  { id: "admin", title: "Admin awal" },
  { id: "tinjau", title: "Tinjau" },
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
  const [checking, setChecking] = useState(false)
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
    if (checking) return
    const valid = await form.trigger([...(STEP_FIELDS[step] ?? [])])
    if (!valid) return
    if (step === 0) {
      // A taken code blocks the step. The user must change it to continue.
      const code = form.getValues("code")
      setChecking(true)
      const taken = await isTenantCodeTaken(code)
      setChecking(false)
      if (taken) {
        form.setError(
          "code",
          {
            type: "duplicate",
            message: `Kode ${code} sudah dipakai tenant lain. Ubah kode untuk melanjutkan.`,
          },
          { shouldFocus: true }
        )
        return
      }
    }
    setStep((current) => Math.min(current + 1, LAST_STEP))
  }

  // Each step moves focus to its heading. That keeps a held Enter or Space from
  // landing on the button that replaces "Lanjut" on the last step.
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    document.getElementById(STEP_TITLE_ID)?.focus()
  }, [step])

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
  const categoryName =
    values.tenantCategoryId === ""
      ? null
      : (categoryNameOf(categories, values.tenantCategoryId) ??
        values.tenantCategoryId)
  const countryName =
    values.countryCode === ""
      ? null
      : (countryNameOf(countries, values.countryCode) ?? values.countryCode)

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

      <Card className="mx-auto w-full max-w-xl gap-0 rounded-3xl py-0 shadow-sm">
        <form noValidate onSubmit={onSubmit} className="flex flex-col">
          <div className="flex flex-col gap-6 px-6 pt-6 pb-2 sm:px-8 sm:pt-8">
            <WizardSteps steps={STEPS} current={step} />

            {step === 0 ? (
              <fieldset
                aria-labelledby={STEP_TITLE_ID}
                className="flex flex-col gap-5"
              >
                <StepHeading
                  id={STEP_TITLE_ID}

                  title="Identitas tenant"
                  description="Data dasar yang tampil di daftar tenant."
                />
                <div className="flex flex-col gap-2">
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
                        placeholder="SMILE"
                        className="font-mono placeholder:font-sans"
                        aria-invalid={errors.code !== undefined}
                        aria-describedby="tenant-code-hint tenant-code-error"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          form.clearErrors("code")
                          field.onChange(event.target.value.toUpperCase())
                        }}
                      />
                    )}
                  />
                  <p
                    id="tenant-code-hint"
                    className="text-sm text-muted-foreground"
                  >
                    Gunakan huruf besar, misalnya SMILE. Kode tidak bisa diubah
                    setelah tenant dibuat.
                  </p>
                  <FieldError
                    id="tenant-code-error"
                    message={errors.code?.message}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tenant-name">Nama tenant</Label>
                  <Input
                    id="tenant-name"
                    autoComplete="off"
                    maxLength={NAME_MAX}
                    placeholder="Nama yang dikenal pelanggan"
                    aria-invalid={errors.name !== undefined}
                    aria-describedby="tenant-name-error"
                    {...form.register("name")}
                  />
                  <FieldError
                    id="tenant-name-error"
                    message={errors.name?.message}
                  />
                </div>
                <div className="flex flex-col gap-2">
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
                <div className="flex flex-col gap-2">
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
              <div className="flex flex-col gap-6">
                <StepHeading
                  id={STEP_TITLE_ID}
                  title="Penyimpanan dan cabang"
                  description="Tentukan apakah tenant berbagi infrastruktur dan boleh punya banyak cabang."
                />
                <fieldset className="flex flex-col gap-3">
                  <legend className="mb-1 text-sm font-medium">
                    Tipe penyebaran
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {(["MULTI_TENANT", "DEDICATED"] as const).map((type) => (
                      <ChoiceChip
                        key={type}
                        value={type}
                        {...form.register("deploymentType")}
                      >
                        {DEPLOYMENT_LABELS[type]}
                      </ChoiceChip>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {values.deploymentType === "DEDICATED"
                      ? "Hanya satu tenant DEDICATED yang boleh aktif per penyebaran."
                      : "Berbagi infrastruktur dengan tenant lain."}
                  </p>
                </fieldset>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="tenant-multi-branch">
                      Multi cabang aktif
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Izinkan tenant ini mengelola lebih dari satu cabang.
                    </p>
                  </div>
                  <Switch
                    id="tenant-multi-branch"
                    checked={values.multiBranchEnabled}
                    onCheckedChange={(checked) =>
                      form.setValue("multiBranchEnabled", checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <fieldset
                aria-labelledby={STEP_TITLE_ID}
                className="flex flex-col gap-5"
              >
                <StepHeading
                  id={STEP_TITLE_ID}

                  title="Admin awal"
                  description="Akun admin pertama untuk tenant ini."
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tenant-admin-email">
                    E-mail admin tenant
                  </Label>
                  <Input
                    id="tenant-admin-email"
                    type="email"
                    autoComplete="off"
                    maxLength={EMAIL_MAX}
                    placeholder="email@example.com"
                    aria-invalid={errors.tenantAdminEmail !== undefined}
                    aria-describedby="tenant-admin-email-error"
                    {...form.register("tenantAdminEmail")}
                  />
                  <FieldError
                    id="tenant-admin-email-error"
                    message={errors.tenantAdminEmail?.message}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tenant-logo-url">URL logo (opsional)</Label>
                  <Input
                    id="tenant-logo-url"
                    type="url"
                    autoComplete="off"
                    maxLength={LOGO_URL_MAX}
                    placeholder="https://"
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
              <div className="flex flex-col gap-4">
                <StepHeading
                  id={STEP_TITLE_ID}
                  title="Tinjau sebelum membuat"
                  description="Periksa data di bawah. Pilih Ubah untuk kembali ke langkahnya."
                />
                <ReviewSection title="Identitas" onEdit={() => setStep(0)}>
                  <ReviewItem label="Kode tenant" value={values.code} mono />
                  <ReviewItem label="Nama tenant" value={values.name} />
                  <ReviewItem
                    label="Kategori"
                    value={categoryName ?? values.tenantCategoryId}
                  />
                  <ReviewItem label="Negara" value={countryName ?? "—"} />
                </ReviewSection>
                <ReviewSection title="Penyimpanan" onEdit={() => setStep(1)}>
                  <ReviewItem
                    label="Tipe penyebaran"
                    value={DEPLOYMENT_LABELS[values.deploymentType]}
                  />
                  <ReviewItem
                    label="Multi cabang"
                    value={values.multiBranchEnabled ? "Aktif" : "Tidak aktif"}
                  />
                </ReviewSection>
                <ReviewSection title="Admin awal" onEdit={() => setStep(2)}>
                  <ReviewItem
                    label="E-mail admin tenant"
                    value={values.tenantAdminEmail}
                  />
                  <ReviewItem
                    label="URL logo"
                    value={values.logoUrl === "" ? "—" : values.logoUrl}
                  />
                </ReviewSection>
                <BeforeCreateNotes />
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-3 px-6 pt-4 pb-6 sm:px-8 sm:pb-8">
            <Button
              type="button"
              variant="secondary"
              disabled={step === 0 || isSubmitting || checking}
              onClick={() => setStep((current) => Math.max(current - 1, 0))}
            >
              Kembali
            </Button>
            {/* Separate keys: React must not reuse one DOM button and flip its
                type from "button" to "submit" while the user is still pressing it.
                That made the last step save on its own. */}
            {step < LAST_STEP ? (
              <Button
                key="next"
                type="button"
                disabled={checking}
                onClick={() => void goNext()}
              >
                {checking ? "Memeriksa kode..." : "Lanjut"}
              </Button>
            ) : (
              <Button key="create" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Membuat tenant..." : "Buat tenant"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </PageBody>
  )
}

/** Title and one line of context at the top of a step. A fieldset points to it with aria-labelledby. */
function StepHeading({
  id,
  title,
  description,
}: {
  readonly id?: string
  readonly title: string
  readonly description: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2
        id={id}
        tabIndex={-1}
        className="font-heading text-2xl font-semibold outline-none"
      >
        {title}
      </h2>
      <p className="text-base text-muted-foreground">{description}</p>
    </div>
  )
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  readonly title: string
  readonly onEdit: () => void
  readonly children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          Ubah
          <span className="sr-only"> {title}</span>
        </Button>
      </header>
      <dl className="grid gap-x-6 gap-y-4 p-4 sm:grid-cols-2">{children}</dl>
    </section>
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
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn("text-sm font-medium break-words", mono && "font-mono")}
      >
        {value}
      </dd>
    </div>
  )
}

/** What the user should know before the POST, which is never retried on its own (SP-BG-11). */
function BeforeCreateNotes() {
  return (
    <ul className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
      <li>Kode tenant tidak bisa diubah setelah tenant dibuat.</li>
      <li>
        Tombol dinonaktifkan selama proses dan permintaan tidak diulang
        otomatis. Tunggu sampai selesai.
      </li>
      <li>
        Jika akun admin gagal dibuat, tenant tetap ada dan Anda bisa mengirim
        ulang akun admin.
      </li>
    </ul>
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
    <Card className="mx-auto w-full max-w-2xl gap-0 py-0">
      <CardHeader className="flex-row items-center gap-3 border-b border-border px-6 py-5">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400"
        >
          <IconAlertTriangle className="size-6" />
        </span>
        <p className="text-base">
          Tenant <span className="font-mono font-semibold">{created.code}</span>{" "}
          sudah dibuat.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6 py-5">
        <div
          role="alert"
          className="rounded-xl border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-sm"
        >
          {created.outcome.message}
        </div>
        <FormAlert
          message={failure?.message ?? null}
          referenceId={failure?.referenceId ?? null}
        />
        <div className="flex flex-wrap items-center gap-4">
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
