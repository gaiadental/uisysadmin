/**
 * Tenant list (REQ-FE-020; ARCH-FE-001 D8.1, D5.4, D11, D13). Server
 * pagination with `page` and `limit`, and the documented filters: status,
 * category, country, deployment type and exact code. The filters and the page
 * live in the URL. Category and country names come from the cached reference
 * lists, so the list needs no request per row. There is no name search and no
 * delete control: the contract has neither.
 */

import { useMemo, type FormEvent, type ReactNode } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { PageBody, PageHeader } from "@/components/page-header"
import { TableCard } from "@/components/table-card"
import { TablePagination } from "@/components/table-pagination"
import { TenantStatusBadge } from "@/components/tenant-bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FormAlert } from "@/components/custom/form-alert"
import { navigateTo } from "@/app/router"
import { AppLink } from "@/features/auth/components/app-link"
import { useSearchState } from "@/hooks/use-search-state"
import { listTenants } from "@/lib/api/modules/tenants"
import { queryKeys, type KeyFilters } from "@/lib/query/keys"
import { routeMeta } from "@/lib/routes-meta"
import type { Tenant, TenantListParams } from "@/types/tenant"

import { detailPathOf } from "../detail/tenant-paths"
import { describeReadFailure } from "../shared/failure"
import {
  categoryNameOf,
  countryNameOf,
  useCountries,
  useTenantCategories,
} from "../shared/reference-data"
import { FilterSelect, type FilterOption } from "./filter-select"
import {
  ALL_VALUE,
  DEPLOYMENT_LABELS,
  STATUS_OPTIONS,
  TENANT_SEARCH_DEFAULTS,
  hasActiveFilter,
  toListParams,
} from "./list-filters"

const META = routeMeta["tenant.list"]
const COLUMN_COUNT = 6
const SKELETON_ROWS = 5
const EMPTY_TENANTS: readonly Tenant[] = []

const DEPLOYMENT_OPTIONS: readonly FilterOption[] = [
  { value: ALL_VALUE, label: "Semua tipe" },
  { value: "DEDICATED", label: DEPLOYMENT_LABELS.DEDICATED },
  { value: "MULTI_TENANT", label: DEPLOYMENT_LABELS.MULTI_TENANT },
]

/** The query key part of the filters. A missing filter is null, so the key shape is stable. */
function keyFiltersOf(params: TenantListParams): KeyFilters {
  return {
    page: params.page ?? null,
    limit: params.limit ?? null,
    isActive: params.isActive ?? null,
    code: params.code ?? null,
    categoryId: params.categoryId ?? null,
    countryCode: params.countryCode ?? null,
    deploymentType: params.deploymentType ?? null,
  }
}

export function TenantListPage() {
  const [search, setSearch] = useSearchState(TENANT_SEARCH_DEFAULTS)
  const params = useMemo(() => toListParams(search), [search])
  const filtered = hasActiveFilter(search)

  const tenantsQuery = useQuery({
    queryKey: queryKeys.tenants.list(keyFiltersOf(params)),
    queryFn: () => listTenants(params),
    placeholderData: keepPreviousData,
  })
  const categoriesQuery = useTenantCategories()
  const countriesQuery = useCountries()
  const categories = categoriesQuery.data
  const countries = countriesQuery.data

  const categoryOptions = useMemo<readonly FilterOption[]>(
    () => [
      { value: ALL_VALUE, label: "Semua kategori" },
      ...(categories ?? []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    ],
    [categories]
  )
  const countryOptions = useMemo<readonly FilterOption[]>(
    () => [
      { value: ALL_VALUE, label: "Semua negara" },
      ...(countries ?? []).map((item) => ({
        value: item.code,
        label: `${item.name} (${item.code})`,
      })),
    ],
    [countries]
  )

  // A changed filter goes back to page 1: the page parameter is dropped.
  const setFilter = (
    key: keyof typeof TENANT_SEARCH_DEFAULTS,
    value: string
  ) => {
    setSearch({ [key]: value, page: null })
  }

  const handleCodeSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get("code")
    setFilter("code", typeof value === "string" ? value.trim() : "")
  }

  const clearFilters = () => {
    setSearch({
      status: null,
      category: null,
      country: null,
      deployment: null,
      code: null,
      page: null,
    })
  }

  const result = tenantsQuery.data
  const tenants = result?.data ?? EMPTY_TENANTS
  const pagination = result?.pagination
  const page = pagination?.page ?? params.page ?? 1
  const pageCount = Math.max(1, pagination?.totalPages ?? 1)
  const from =
    tenants.length === 0 ? 0 : (page - 1) * (pagination?.limit ?? 0) + 1
  const view = {
    page,
    setPage: (next: number) => setSearch({ page: String(next) }),
    pageCount,
    from,
    to: tenants.length === 0 ? 0 : from + tenants.length - 1,
    total: pagination?.total ?? 0,
  }

  const failure = tenantsQuery.isError
    ? describeReadFailure(tenantsQuery.error)
    : null

  return (
    <PageBody>
      <PageHeader
        title={META.title}
        {...(META.description !== undefined
          ? { description: META.description }
          : {})}
        actions={
          <Button type="button" onClick={() => navigateTo("/tenants/new")}>
            Tambah tenant
          </Button>
        }
      />

      <TableCard>
        <TableCard.Header
          title="Tenant"
          {...(pagination !== undefined ? { count: pagination.total } : {})}
        />
        <TableCard.Toolbar aria-label="Filter tenant">
          <FilterSelect
            label="Status"
            value={search.status}
            options={STATUS_OPTIONS}
            onChange={(value) => setFilter("status", value)}
          />
          <FilterSelect
            label="Kategori"
            value={search.category}
            options={categoryOptions}
            onChange={(value) => setFilter("category", value)}
          />
          <FilterSelect
            label="Negara"
            value={search.country}
            options={countryOptions}
            onChange={(value) => setFilter("country", value)}
          />
          <FilterSelect
            label="Tipe penyebaran"
            value={search.deployment}
            options={DEPLOYMENT_OPTIONS}
            onChange={(value) => setFilter("deployment", value)}
          />
          <form
            onSubmit={handleCodeSubmit}
            className="flex items-end gap-2"
            // The key resets the uncontrolled input when the URL changes (back button, clear).
            key={search.code}
          >
            <div className="flex flex-col gap-1.5 sm:w-44">
              <Label
                htmlFor="tenant-code-filter"
                className="text-xs text-muted-foreground"
              >
                Kode tenant (persis)
              </Label>
              <Input
                id="tenant-code-filter"
                name="code"
                defaultValue={search.code}
                maxLength={50}
                autoComplete="off"
              />
            </div>
            <Button type="submit" variant="outline">
              Terapkan
            </Button>
          </form>
          {filtered ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Reset filter
            </Button>
          ) : null}
        </TableCard.Toolbar>

        <TableCard.Body aria-busy={tenantsQuery.isFetching}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-44">Kategori</TableHead>
                <TableHead className="w-44">Negara</TableHead>
                <TableHead className="w-36">Penyebaran</TableHead>
                <TableHead className="w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantsQuery.isPending ? (
                <LoadingRows />
              ) : failure !== null && result === undefined ? (
                <MessageRow>
                  <FormAlert
                    message={failure.message}
                    referenceId={failure.referenceId}
                  >
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void tenantsQuery.refetch()}
                      >
                        Coba lagi
                      </Button>
                    </div>
                  </FormAlert>
                </MessageRow>
              ) : tenants.length === 0 ? (
                <MessageRow>
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {filtered
                      ? "Tidak ada tenant yang cocok dengan filter."
                      : "Belum ada tenant."}
                  </p>
                </MessageRow>
              ) : (
                tenants.map((tenant) => (
                  <TenantRow
                    key={tenant.id}
                    tenant={tenant}
                    categoryName={categoryNameOf(
                      categories,
                      tenant.tenantCategoryId
                    )}
                    countryName={
                      tenant.countryCode === null
                        ? null
                        : countryNameOf(countries, tenant.countryCode)
                    }
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableCard.Body>

        <TableCard.Footer>
          <TablePagination pagination={view} unit="tenant" />
        </TableCard.Footer>
      </TableCard>
    </PageBody>
  )
}

interface TenantRowProps {
  readonly tenant: Tenant
  readonly categoryName: string | null
  readonly countryName: string | null
}

function TenantRow({ tenant, categoryName, countryName }: TenantRowProps) {
  return (
    <TableRow>
      <TableCell className="py-2 font-mono text-xs font-medium">
        <AppLink to={detailPathOf(tenant.id)}>{tenant.code}</AppLink>
      </TableCell>
      <TableCell className="py-2">{tenant.name}</TableCell>
      <TableCell className="py-2 text-muted-foreground">
        {categoryName ?? tenant.tenantCategoryId}
      </TableCell>
      <TableCell className="py-2">
        {tenant.countryCode === null ? (
          <span aria-label="Tidak ada negara">—</span>
        ) : (
          <>
            <span className="font-mono text-xs">{tenant.countryCode}</span>
            {countryName !== null ? (
              <span className="ml-1.5 text-xs text-muted-foreground">
                {countryName}
              </span>
            ) : null}
          </>
        )}
      </TableCell>
      <TableCell className="py-2 text-xs">
        {DEPLOYMENT_LABELS[tenant.deploymentType]}
      </TableCell>
      <TableCell className="py-2">
        <TenantStatusBadge status={tenant.isActive ? "ACTIVE" : "INACTIVE"} />
      </TableCell>
    </TableRow>
  )
}

function MessageRow({ children }: { readonly children: ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT} className="px-4 py-3">
        {children}
      </TableCell>
    </TableRow>
  )
}

function LoadingRows() {
  return (
    <>
      <TableRow>
        <TableCell colSpan={COLUMN_COUNT} className="p-0">
          <span role="status" className="sr-only">
            Memuat tenant...
          </span>
        </TableCell>
      </TableRow>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <TableRow key={index} aria-hidden="true">
          <TableCell colSpan={COLUMN_COUNT} className="py-2">
            <Skeleton className="h-5 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
