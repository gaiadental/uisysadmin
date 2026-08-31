import * as React from "react"
import {
  IconArrowLeft,
  IconBuilding,
  IconCheck,
  IconStack2,
  IconLogout,
  IconDevices,
  IconPower,
  IconTrash,
  IconUsers,
  IconX,
  IconLock,
} from "@tabler/icons-react"

import { navigate, useRoute } from "@/router"
import { useDialogs } from "@/components/dialogs/dialogs"
import { findTenantByCode } from "@/data/tenants"
import { featureModules } from "@/data/tenant-features"
import { conditionsFor, systemIdentityFor } from "@/data/tenant-detail"
import { isoDateTime, relativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PageBody } from "@/components/page-header"
import { MetricCard } from "@/components/metric-card"
import {
  TenantStatusBadge,
  categoryLabel,
  countryName,
} from "@/components/tenant-bits"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ROLE_POOL = ["Dokter gigi", "Perawat gigi", "Resepsionis", "Admin klinik"]
const rolesForFlag = (key: string) =>
  ROLE_POOL.slice(0, 1 + (key.length % 3))

export function TenantDetailPage() {
  const route = useRoute()
  const dialogs = useDialogs()
  const tenant = findTenantByCode(route.params.kode ?? "")
  const [flagOn, setFlagOn] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      featureModules.flatMap((m) => m.flags).map((f) => [f.key, f.enabled])
    )
  )

  if (!tenant) {
    return (
      <PageBody>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm">
              Tenant dengan kode{" "}
              <code className="font-mono">{route.params.kode}</code> tidak
              ditemukan.
            </p>
            <Button variant="outline" onClick={() => navigate("/tenant")}>
              <IconArrowLeft />
              Kembali ke daftar tenant
            </Button>
          </CardContent>
        </Card>
      </PageBody>
    )
  }

  const identity = systemIdentityFor(tenant)
  const conditions = conditionsFor(tenant)
  const activeFlagCount = featureModules
    .flatMap((m) => m.flags)
    .filter((f) => f.enabled).length

  return (
    <PageBody>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => navigate("/tenant")}
          className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-3.5" />
          Daftar tenant
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">
                {tenant.name}
              </h1>
              <TenantStatusBadge status={tenant.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                Kode{" "}
                <code className="font-mono text-foreground">{tenant.code}</code>
              </span>
              <Separator orientation="vertical" className="h-3" />
              <span>{categoryLabel(tenant.categoryKey)}</span>
              <Separator orientation="vertical" className="h-3" />
              <span>
                <span className="font-mono text-foreground">
                  {tenant.countryIso2}
                </span>{" "}
                {countryName(tenant.countryIso2)}
              </span>
              <Separator orientation="vertical" className="h-3" />
              <code className="font-mono">{tenant.id}</code>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                dialogs.open({
                  kind: "session.revokeAll",
                  tenantCode: tenant.code,
                  tenantName: tenant.name,
                  sessions: tenant.activeSessions,
                })
              }
            >
              <IconLogout />
              Cabut sesi
            </Button>
            {tenant.status === "INACTIVE" ? (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => dialogs.open({ kind: "tenant.delete", tenant })}
              >
                <IconTrash />
                Percepat penghapusan
              </Button>
            ) : null}
            <Button
              variant="destructive"
              disabled={tenant.status === "INACTIVE"}
              onClick={() =>
                dialogs.open({ kind: "tenant.deactivate", tenant })
              }
            >
              <IconPower />
              Nonaktifkan
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="ringkasan">
        <TabsList>
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="fitur">Fitur aktif</TabsTrigger>
        </TabsList>

        {/* Tab 1 — Ringkasan */}
        <TabsContent value="ringkasan" className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Ringkasan tersinkron — diperbarui via event dari master-data,
            profile-service, dan auth-service. Bukan query langsung ke data
            tenant-scoped.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Cabang"
              value={tenant.branchCount}
              icon={IconBuilding}
            />
            <MetricCard
              label="Pengguna"
              value={tenant.userCount}
              icon={IconUsers}
            />
            <MetricCard
              label="Sesi aktif"
              value={tenant.activeSessions}
              icon={IconDevices}
            />
            <MetricCard
              label="Fitur aktif"
              value={activeFlagCount}
              icon={IconStack2}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-0 py-0">
              <CardHeader className="border-b bg-muted/40 py-3">
                <CardTitle className="text-sm">Checklist kondisi</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {conditions.map((c) => (
                    <li
                      key={c.key}
                      className="flex items-start gap-3 px-4 py-2.5"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                          c.ok
                            ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-destructive/15 text-destructive"
                        )}
                      >
                        {c.ok ? (
                          <IconCheck className="size-3" />
                        ) : (
                          <IconX className="size-3" />
                        )}
                      </span>
                      <div className="space-y-0.5">
                        <p className="text-sm">{c.label}</p>
                        <code className="font-mono text-xs text-muted-foreground">
                          {c.note}
                        </code>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="border-b bg-muted/40 py-3">
                <CardTitle className="text-sm">Identitas sistem</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <dl className="divide-y divide-border text-sm">
                  <IdentityRow label="tenant_id" value={identity.tenantId} />
                  <IdentityRow
                    label="created_at"
                    value={isoDateTime(identity.createdAt)}
                  />
                  <IdentityRow
                    label="last_event_at"
                    value={`${isoDateTime(identity.lastEventAt)} (${relativeTime(
                      identity.lastEventAt
                    )})`}
                  />
                </dl>
                <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
                  Kuota penyimpanan per tenant belum tersedia — domain ini
                  belum dirancang di konsol.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2 — Profil */}
        <TabsContent value="profil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Profil tenant</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama tenant">
                <Input defaultValue={tenant.name} />
              </Field>
              <Field label="Kategori tenant">
                <Input defaultValue={categoryLabel(tenant.categoryKey)} />
              </Field>
              <Field
                label="Kode tenant"
                locked
                hint="Kode bersifat permanen setelah tenant dibuat."
              >
                <Input
                  readOnly
                  disabled
                  defaultValue={tenant.code}
                  className="font-mono"
                />
              </Field>
              <Field
                label="Mode penyimpanan"
                locked
                hint="Mode penyimpanan tidak dapat diubah setelah provisioning."
              >
                <Input
                  readOnly
                  disabled
                  defaultValue={tenant.storageMode}
                  className="font-mono"
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3 — Fitur aktif */}
        <TabsContent value="fitur" className="space-y-4">
          <Card className="py-0">
            <Accordion defaultValue={["CORE", "CLINICAL"]} className="px-4">
              {featureModules.map((mod) => {
                const on = mod.flags.filter((f) => f.enabled).length
                return (
                  <AccordionItem key={mod.key} value={mod.key}>
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <code className="font-mono text-xs text-muted-foreground">
                          {mod.key}
                        </code>
                        {mod.label}
                      </span>
                      <span className="ml-auto mr-2 font-mono text-xs text-muted-foreground">
                        {on}/{mod.flags.length}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1">
                      {mod.flags.map((flag) => (
                        <label
                          key={flag.key}
                          className={cn(
                            "flex items-start gap-3 rounded-md px-2 py-2 hover:bg-muted/50",
                            flag.core && "opacity-90"
                          )}
                        >
                          <Checkbox
                            checked={flag.core ? true : flagOn[flag.key]}
                            disabled={flag.core}
                            className="mt-0.5"
                            onCheckedChange={(v) => {
                              if (flag.core) return
                              if (v === false) {
                                // 6.4 — konfirmasi dampak ke peran sebelum mematikan
                                dialogs.open({
                                  kind: "permission.disableInTenant",
                                  flagKey: flag.key,
                                  flagLabel: flag.label,
                                  tenantCode: tenant.code,
                                  roles: rolesForFlag(flag.key),
                                  onConfirm: () =>
                                    setFlagOn((s) => ({
                                      ...s,
                                      [flag.key]: false,
                                    })),
                                })
                              } else {
                                setFlagOn((s) => ({ ...s, [flag.key]: true }))
                              }
                            }}
                          />
                          <div className="space-y-0.5">
                            <p className="flex items-center gap-2 text-sm">
                              <code className="font-mono text-xs">
                                {flag.key}
                              </code>
                              {flag.core ? (
                                <Badge
                                  variant="secondary"
                                  className="gap-1 font-mono text-[0.65rem]"
                                >
                                  <IconLock className="size-2.5" />
                                  CORE
                                </Badge>
                              ) : null}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {flag.label} — {flag.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </Card>
          <p className="text-xs text-muted-foreground">
            Checkbox <span className="font-mono">CORE</span> terkunci — modul inti
            tidak dapat dinonaktifkan.
          </p>
        </TabsContent>
      </Tabs>
    </PageBody>
  )
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-40 shrink-0 font-mono text-xs text-muted-foreground">
        {label}
      </dt>
      <dd className="font-mono text-xs break-all">{value}</dd>
    </div>
  )
}

function Field({
  label,
  hint,
  locked,
  children,
}: {
  label: string
  hint?: string
  locked?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {locked ? (
          <Badge variant="outline" className="gap-1 font-mono text-[0.65rem]">
            <IconLock className="size-2.5" />
            terkunci
          </Badge>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
