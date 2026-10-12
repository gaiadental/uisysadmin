/**
 * Dashboard `/` (REQ-FE-018, REQ-FE-037; ARCH-FE-001 D7, D8.1, D13, D16). Any
 * signed-in user may open it. The master-data widgets (counts and the tenant
 * list) need SYS_PRINCIPAL; every other user sees the neutral landing message.
 *
 * Counts are `pagination.total` of `limit=1` requests. The tenant widget asks
 * for `limit=5` and is labelled with the server order, not "latest", because
 * the contract does not define the sort order (FE-OQ-16). The "Perlu
 * ditangani" list, the activity feed and the failed-event and session metrics
 * are removed (SP-BG-08).
 */

import { useId, type ReactNode } from "react"
import {
  IconBuilding,
  IconCircleCheck,
  IconTags,
  IconWorld,
} from "@tabler/icons-react"
import type { UseQueryResult } from "@tanstack/react-query"

import { LandingPage } from "@/app/landing-page"
import { useAuth } from "@/app/providers/auth-provider"
import { FormAlert } from "@/components/custom/form-alert"
import { MetricCard } from "@/components/metric-card"
import { PageBody, PageHeader } from "@/components/page-header"
import { TenantStatusBadge } from "@/components/tenant-bits"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLink } from "@/features/auth/components/app-link"
import { detailPathOf } from "@/features/tenants/detail/tenant-paths"
import { describeReadFailure } from "@/features/tenants/shared/failure"
import { SYS_PRINCIPAL } from "@/lib/access/roles"
import { routeMeta } from "@/lib/routes-meta"
import {
  LATEST_TENANTS_LIMIT,
  useActiveTenantTotal,
  useCountryTotal,
  useLatestTenants,
  useTenantCategoryTotal,
  useTenantTotal,
} from "./dashboard-queries"

const META = routeMeta.dashboard

type MetricState = "ready" | "loading" | "error"

function stateOf(query: UseQueryResult<unknown>): MetricState {
  if (query.isError) return "error"
  return query.data === undefined ? "loading" : "ready"
}

function CountCard({
  label,
  query,
  icon,
}: {
  readonly label: string
  readonly query: UseQueryResult<number>
  readonly icon: typeof IconBuilding
}) {
  return (
    <MetricCard
      label={label}
      icon={icon}
      state={stateOf(query)}
      value={query.data ?? null}
    />
  )
}

function LatestTenantsBody({
  query,
}: {
  readonly query: ReturnType<typeof useLatestTenants>
}): ReactNode {
  if (query.isError) {
    const failure = describeReadFailure(query.error)
    return (
      <FormAlert message={failure.message} referenceId={failure.referenceId} />
    )
  }
  if (query.data === undefined) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Memuat tenant...
      </p>
    )
  }
  if (query.data.data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada tenant.</p>
  }
  return (
    <ul className="divide-y divide-border">
      {query.data.data.map((tenant) => (
        <li
          key={tenant.id}
          className="flex items-center justify-between gap-3 py-2"
        >
          <div className="flex min-w-0 flex-col">
            <AppLink to={detailPathOf(tenant.id)} className="truncate">
              {tenant.name}
            </AppLink>
            <span className="font-mono text-xs text-muted-foreground">
              {tenant.code}
            </span>
          </div>
          <TenantStatusBadge status={tenant.isActive ? "ACTIVE" : "INACTIVE"} />
        </li>
      ))}
    </ul>
  )
}

function MasterDataWidgets() {
  const tenants = useTenantTotal(true)
  const active = useActiveTenantTotal(true)
  const categories = useTenantCategoryTotal(true)
  const countries = useCountryTotal(true)
  const latest = useLatestTenants(true)
  const sectionId = useId()
  const listId = useId()

  return (
    <>
      <section aria-labelledby={sectionId} className="flex flex-col gap-3">
        <h2 id={sectionId} className="sr-only">
          Ringkasan
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CountCard label="Tenant" query={tenants} icon={IconBuilding} />
          <CountCard
            label="Tenant aktif"
            query={active}
            icon={IconCircleCheck}
          />
          <CountCard
            label="Kategori tenant"
            query={categories}
            icon={IconTags}
          />
          <CountCard label="Negara" query={countries} icon={IconWorld} />
        </div>
      </section>

      <section aria-labelledby={listId}>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 id={listId}>
                Tenant ({LATEST_TENANTS_LIMIT} pertama, urutan dari server)
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LatestTenantsBody query={latest} />
          </CardContent>
        </Card>
      </section>
    </>
  )
}

export function DashboardPage() {
  const { me } = useAuth()
  if (me === null) return null
  if (me.role !== SYS_PRINCIPAL) return <LandingPage />

  return (
    <PageBody>
      <PageHeader
        title={META.title}
        {...(META.description !== undefined
          ? { description: META.description }
          : {})}
      />
      <MasterDataWidgets />
    </PageBody>
  )
}
