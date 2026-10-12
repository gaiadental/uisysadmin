/**
 * Tenant detail (`/tenants/:id`; REQ-FE-022 to 025; ARCH-FE-001 D8.2, D9, D14,
 * D15). Tabs: Ringkasan and Profil. Code, name, category, deployment type,
 * multi-branch and the admin e-mail are read-only. The editable fields are
 * `is_active` (a switch with no optimistic update), `logo_url` and
 * `country_code`. PATCH sends only the changed keys. There is no delete
 * control: the contract answers 405. "Kirim ulang akun admin" is always
 * offered, because the detail response has no admin-account state (SP-BG-01).
 */

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { IconChevronLeft } from "@tabler/icons-react"
import { toast } from "sonner"

import { useAuth } from "@/app/providers/auth-provider"
import { navigateTo, splitHref, useLocationHref } from "@/app/router"
import { FormAlert } from "@/components/custom/form-alert"
import { useDialogs } from "@/components/dialogs/dialogs"
import { PageBody } from "@/components/page-header"
import { TenantStatusBadge } from "@/components/tenant-bits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FieldError } from "@/features/auth/components/field-error"
import { ApiError } from "@/lib/api/errors"
import {
  getTenant,
  patchTenant,
  retryAdminAccount,
} from "@/lib/api/modules/tenants"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import { cn } from "@/lib/utils"
import type { TenantDetail } from "@/types/tenant"

import { canViewTenantPermissions } from "../permissions/access"
import {
  permissionsPathOf,
  permissionsTenantIdOfPath,
} from "../permissions/permissions-path"
import { TenantPermissionsTab } from "../permissions/tenant-permissions-tab"
import { classifyAdminAccount } from "../create/classify-admin-account"
import { SelectField } from "../create/select-field"
import {
  describeWriteFailure,
  type WriteFailure,
} from "../create/write-failure"
import { DEPLOYMENT_LABELS } from "../list/list-filters"
import {
  LOGO_URL_MAX,
  tenantProfileSchema,
  type TenantProfileFormValues,
} from "../schema"
import { describeReadFailure } from "../shared/failure"
import { useCountries } from "../shared/reference-data"
import { safeLogoSrc } from "./logo-url"
import { buildPatch } from "./profile-patch"
import { TENANT_LIST_PATH, detailPathOf, tenantIdOfPath } from "./tenant-paths"

const DATE_TIME = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? "—" : DATE_TIME.format(date)
}

type DetailTab = "summary" | "profile" | "permissions"

function isDetailTab(value: unknown): value is DetailTab {
  return value === "summary" || value === "profile" || value === "permissions"
}

export function TenantDetailPage() {
  const { pathname, search } = splitHref(useLocationHref())
  // Leaving the Permissions route remounts this page, so the tab to open comes in the query.
  const requestedTab = new URLSearchParams(search).get("tab")
  const initialTab: DetailTab =
    requestedTab === "profile" ? "profile" : "summary"
  const permissionsTenantId = permissionsTenantIdOfPath(pathname)
  const tenantId = permissionsTenantId ?? tenantIdOfPath(pathname)
  if (tenantId === null) return <NotFound />
  return (
    <TenantDetailLoader
      tenantId={tenantId}
      onPermissionsPath={permissionsTenantId !== null}
      initialTab={initialTab}
    />
  )
}

function TenantDetailLoader({
  tenantId,
  onPermissionsPath,
  initialTab,
}: {
  readonly tenantId: string
  readonly onPermissionsPath: boolean
  readonly initialTab: DetailTab
}) {
  const query = useQuery({
    queryKey: queryKeys.tenants.detail(tenantId),
    queryFn: () => getTenant(tenantId),
  })

  if (query.isPending) {
    return (
      <PageBody>
        <span role="status" className="sr-only">
          Memuat tenant...
        </span>
        <div aria-hidden="true" className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageBody>
    )
  }
  if (query.isError) {
    const error = query.error
    if (
      error instanceof ApiError &&
      error.kind === "HTTP" &&
      error.status === 404
    ) {
      return <NotFound />
    }
    const failure = describeReadFailure(error)
    return (
      <PageBody>
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
      </PageBody>
    )
  }
  return (
    <TenantDetailView
      tenant={query.data}
      onPermissionsPath={onPermissionsPath}
      initialTab={initialTab}
    />
  )
}

function NotFound() {
  return (
    <PageBody>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="font-heading text-lg font-semibold">
            Data tidak ditemukan.
          </p>
          <p className="text-sm text-muted-foreground">
            Periksa tautannya, atau kembali ke daftar tenant.
          </p>
          <Button
            variant="outline"
            onClick={() => navigateTo(TENANT_LIST_PATH)}
          >
            Kembali ke daftar tenant
          </Button>
        </CardContent>
      </Card>
    </PageBody>
  )
}

function initialsOf(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter((word) => word !== "")
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
  return letters === "" ? "?" : letters
}

function TenantDetailView({
  tenant,
  onPermissionsPath,
  initialTab,
}: {
  readonly tenant: TenantDetail
  readonly onPermissionsPath: boolean
  readonly initialTab: DetailTab
}) {
  const { me } = useAuth()
  const showPermissions = canViewTenantPermissions(me?.permissions ?? [])
  const [localTab, setLocalTab] = useState<DetailTab>(initialTab)
  // The Permissions tab is a route (D7), so the path decides when it is open.
  const activeTab: DetailTab =
    onPermissionsPath && showPermissions ? "permissions" : localTab

  const changeTab = (value: unknown) => {
    if (!isDetailTab(value)) return
    if (value === "permissions") {
      navigateTo(permissionsPathOf(tenant.id))
      return
    }
    setLocalTab(value)
    if (onPermissionsPath) {
      navigateTo(`${detailPathOf(tenant.id)}?tab=${value}`)
    }
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => navigateTo(TENANT_LIST_PATH)}
          className="inline-flex w-fit items-center gap-1 rounded-lg text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <IconChevronLeft aria-hidden="true" className="size-4" />
          Daftar tenant
        </button>
        <Card className="gap-0 py-0">
          <div className="flex items-center gap-4 p-5 sm:p-6">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-heading text-xl font-semibold text-primary"
            >
              {initialsOf(tenant.name)}
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                  {tenant.name}
                </h1>
                <TenantStatusBadge
                  status={tenant.isActive ? "ACTIVE" : "INACTIVE"}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Kode{" "}
                <code className="font-mono font-medium text-foreground">
                  {tenant.code}
                </code>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={changeTab}>
        <TabsList>
          <TabsTrigger value="summary">Ringkasan</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          {showPermissions ? (
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="summary" className="flex flex-col gap-6 pt-2">
          <SummaryTab tenant={tenant} />
        </TabsContent>
        <TabsContent value="profile" className="flex flex-col gap-6 pt-2">
          <ProfileTab tenant={tenant} />
        </TabsContent>
        {showPermissions ? (
          <TabsContent value="permissions" className="flex flex-col gap-6 pt-2">
            <TenantPermissionsTab tenantId={tenant.id} />
          </TabsContent>
        ) : null}
      </Tabs>
    </PageBody>
  )
}

// ---------- Ringkasan ----------

function SummaryTab({ tenant }: { readonly tenant: TenantDetail }) {
  const logoSrc = safeLogoSrc(tenant.logoUrl)
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <SummaryItem label="Kategori" value={tenant.tenantCategory.name} />
            <SummaryItem
              label="Negara"
              value={tenant.country === null ? "—" : tenant.country.name}
            />
            <SummaryItem
              label="Tipe penyebaran"
              value={DEPLOYMENT_LABELS[tenant.deploymentType]}
            />
            <SummaryItem
              label="Multi cabang"
              value={tenant.multiBranchEnabled ? "Aktif" : "Tidak aktif"}
            />
            <SummaryItem
              label="E-mail admin tenant"
              value={tenant.tenantAdminEmail}
            />
            <div className="flex flex-col gap-1">
              <dt className="text-sm text-muted-foreground">Logo</dt>
              <dd>
                {logoSrc === null ? (
                  "—"
                ) : (
                  <img
                    src={logoSrc}
                    alt={`Logo ${tenant.name}`}
                    referrerPolicy="no-referrer"
                    className="h-12 w-auto max-w-40 rounded-lg border border-border bg-card object-contain"
                  />
                )}
              </dd>
            </div>
            <SummaryItem
              label="Dibuat"
              value={formatDateTime(tenant.createdAt)}
            />
            <SummaryItem
              label="Diubah"
              value={formatDateTime(tenant.updatedAt)}
            />
          </dl>
        </CardContent>
      </Card>
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <StatusCard tenant={tenant} />
        <AdminAccountCard tenantId={tenant.id} />
      </div>
    </>
  )
}

function SummaryItem({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-base font-medium break-words">{value}</dd>
    </div>
  )
}

/**
 * The `is_active` switch. There is no optimistic update: `checked` follows the
 * server value, so on a 503 the switch keeps its old position and the server
 * message is shown (REQ-FE-023).
 */
function StatusCard({ tenant }: { readonly tenant: TenantDetail }) {
  const queryClient = useQueryClient()
  const dialogs = useDialogs()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<WriteFailure | null>(null)

  const change = async (next: boolean) => {
    if (pending) return
    setFailure(null)
    if (!next) {
      const confirmed = await dialogs.confirm({
        title: "Nonaktifkan tenant",
        description: `Tenant ${tenant.code} akan dinonaktifkan. Pengguna tenant tidak dapat masuk sampai tenant diaktifkan kembali.`,
        confirmLabel: "Nonaktifkan",
        tone: "destructive",
      })
      if (!confirmed) return
    }
    setPending(true)
    try {
      await patchTenant(tenant.id, { isActive: next })
      await applyInvalidation(queryClient, {
        kind: "tenantPatch",
        tenantId: tenant.id,
      })
      toast.success(next ? "Tenant diaktifkan" : "Tenant dinonaktifkan")
    } catch (error) {
      setFailure(describeWriteFailure(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="tenant-active" className="text-base">
              Status tenant
            </Label>
            <p className="text-sm text-muted-foreground">
              Menonaktifkan tenant menghentikan akses semua penggunanya.
            </p>
          </div>
          <Switch
            id="tenant-active"
            checked={tenant.isActive}
            disabled={pending}
            onCheckedChange={(next) => void change(next)}
          />
        </div>
        <FormAlert
          message={failure?.message ?? null}
          referenceId={failure?.referenceId ?? null}
        />
      </CardContent>
    </Card>
  )
}

/** Always offered (SP-BG-01). The call is safe to repeat by contract (FE doc 6.3). */
function AdminAccountCard({ tenantId }: { readonly tenantId: string }) {
  const queryClient = useQueryClient()
  const dialogs = useDialogs()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<WriteFailure | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  const retry = async () => {
    if (pending) return
    const confirmed = await dialogs.confirm({
      title: "Kirim ulang akun admin",
      description:
        "Sistem akan mencoba membuat atau menyinkronkan akun admin tenant dan mengirim ulang undangan ke e-mail admin.",
      confirmLabel: "Kirim ulang",
      tone: "default",
    })
    if (!confirmed) return
    setPending(true)
    setFailure(null)
    setWarning(null)
    try {
      const result = await retryAdminAccount(tenantId)
      void applyInvalidation(queryClient, {
        kind: "adminAccountRetry",
        tenantId,
      })
      const outcome = classifyAdminAccount({
        status: result.adminAccount.status,
        tenantStatusSync: result.adminAccount.tenantStatusSync,
      })
      if (outcome.needsRetry) {
        setWarning(outcome.message)
        toast.warning(outcome.message)
      } else {
        toast.success(outcome.message)
      }
    } catch (error) {
      setFailure(describeWriteFailure(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium">Akun admin tenant</p>
            <p className="text-sm text-muted-foreground">
              Gunakan jika admin belum menerima e-mail akun atau status tenant
              belum tersinkron.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            disabled={pending}
            onClick={() => void retry()}
          >
            Kirim ulang akun admin
          </Button>
        </div>
        {warning !== null ? (
          <p
            role="alert"
            className="rounded-xl border border-amber-600/40 bg-amber-500/10 px-4 py-3 text-sm"
          >
            {warning}
          </p>
        ) : null}
        <FormAlert
          message={failure?.message ?? null}
          referenceId={failure?.referenceId ?? null}
        />
      </CardContent>
    </Card>
  )
}

// ---------- Profil ----------

function profileDefaults(tenant: TenantDetail): TenantProfileFormValues {
  return {
    logoUrl: tenant.logoUrl ?? "",
    countryCode: tenant.countryCode ?? "",
  }
}

function ProfileTab({ tenant }: { readonly tenant: TenantDetail }) {
  const queryClient = useQueryClient()
  const countriesQuery = useCountries()
  const form = useZodForm(tenantProfileSchema, profileDefaults(tenant))
  const { errors, isSubmitting } = form.formState
  const [failure, setFailure] = useState<WriteFailure | null>(null)
  const watched = form.watch()
  const changed = Object.keys(buildPatch(tenant, watched)).length > 0

  // After a save the detail query refetches. The form follows the saved values.
  const { reset } = form
  const savedLogo = tenant.logoUrl
  const savedCountry = tenant.countryCode
  useEffect(() => {
    reset({ logoUrl: savedLogo ?? "", countryCode: savedCountry ?? "" })
  }, [reset, savedLogo, savedCountry])

  const countryOptions = (countriesQuery.data ?? [])
    .filter((item) => item.isActive || item.code === tenant.countryCode)
    .map((item) => ({ value: item.code, label: `${item.name} (${item.code})` }))

  const save = form.handleSubmit(async (values) => {
    const patch = buildPatch(tenant, values)
    if (Object.keys(patch).length === 0) return
    setFailure(null)
    try {
      await patchTenant(tenant.id, patch)
      await applyInvalidation(queryClient, {
        kind: "tenantPatch",
        tenantId: tenant.id,
      })
      toast.success("Profil tenant disimpan")
    } catch (error) {
      setFailure(describeWriteFailure(error))
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profil</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
          className="flex flex-col gap-6"
        >
          <FormAlert
            message={failure?.message ?? null}
            referenceId={failure?.referenceId ?? null}
          />
          <section className="flex flex-col gap-4 rounded-2xl bg-muted/60 p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-semibold">Tidak dapat diubah</h2>
              <p className="text-sm text-muted-foreground">
                Kode, nama, kategori, tipe penyebaran, multi cabang, dan e-mail
                admin tetap sama setelah tenant dibuat.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField
                id="ro-code"
                label="Kode tenant"
                value={tenant.code}
                mono
              />
              <ReadOnlyField
                id="ro-name"
                label="Nama tenant"
                value={tenant.name}
              />
              <ReadOnlyField
                id="ro-category"
                label="Kategori tenant"
                value={tenant.tenantCategory.name}
              />
              <ReadOnlyField
                id="ro-deployment"
                label="Tipe penyebaran"
                value={DEPLOYMENT_LABELS[tenant.deploymentType]}
              />
              <ReadOnlyField
                id="ro-branch"
                label="Multi cabang"
                value={tenant.multiBranchEnabled ? "Aktif" : "Tidak aktif"}
              />
              <ReadOnlyField
                id="ro-email"
                label="E-mail admin tenant"
                value={tenant.tenantAdminEmail}
              />
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold">Dapat diubah</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-country">Negara</Label>
                <SelectField
                  id="profile-country"
                  placeholder="Tanpa negara"
                  options={countryOptions}
                  {...form.register("countryCode")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-logo">URL logo</Label>
                <Input
                  id="profile-logo"
                  type="url"
                  autoComplete="off"
                  maxLength={LOGO_URL_MAX}
                  placeholder="https://"
                  aria-invalid={errors.logoUrl !== undefined}
                  aria-describedby="profile-logo-error"
                  {...form.register("logoUrl")}
                />
                <FieldError
                  id="profile-logo-error"
                  message={errors.logoUrl?.message}
                />
              </div>
            </div>
          </section>
          <div className="flex justify-end border-t border-border pt-5">
            <Button type="submit" size="lg" disabled={!changed || isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function ReadOnlyField({
  id,
  label,
  value,
  mono = false,
}: {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        readOnly
        value={value}
        className={cn("bg-card/60 text-muted-foreground", mono && "font-mono")}
      />
    </div>
  )
}
