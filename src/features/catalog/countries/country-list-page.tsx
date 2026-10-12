/**
 * Countries catalog (`/countries`; REQ-FE-029, REQ-FE-039, REQ-FE-040;
 * ARCH-FE-001 D5.3, D7, D9, D12.1). List with server pagination, create, edit
 * and delete. The code is immutable after create. Delete asks for confirmation,
 * says that it is permanent for the code, and suggests deactivating instead
 * (amendment 2026-10-12). A 409 (the country is used by a tenant) shows next
 * to the table, and the list is not changed. Per-country tenant counts are
 * removed (FE-OQ-35 default).
 */

import { useState, type ReactNode } from "react"
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import { FormAlert } from "@/components/custom/form-alert"
import { useDialogs } from "@/components/dialogs/dialogs"
import { PageBody, PageHeader } from "@/components/page-header"
import { TableCard } from "@/components/table-card"
import { TablePagination } from "@/components/table-pagination"
import { TenantStatusBadge } from "@/components/tenant-bits"
import { RowDeleteButton } from "@/components/delete-button"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { describeWriteFailure } from "@/features/tenants/create/write-failure"
import { parsePageParam } from "@/features/tenants/list/list-filters"
import { describeReadFailure } from "@/features/tenants/shared/failure"
import { useSearchState } from "@/hooks/use-search-state"
import { deleteCountry, listCountries } from "@/lib/api/modules/countries"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import { routeMeta } from "@/lib/routes-meta"
import type { Country } from "@/types/country"

import {
  CountryFormDialog,
  type CountryDialogState,
} from "./country-form-dialog"

const META = routeMeta["catalog.countries"]
const PAGE_SIZE = 20
const COLUMN_COUNT = 6
const SKELETON_ROWS = 5
const EMPTY_ITEMS: readonly Country[] = []
const SEARCH_DEFAULTS = { page: "1" } as const

/**
 * The delete is soft and permanent for the code: a deleted code cannot be
 * reused (409), and a country used by a tenant cannot be deleted (409). The
 * text says so, and suggests deactivating instead.
 */
function deleteImpact(country: Country): readonly string[] {
  return [
    `Kode ${country.code} tidak dapat dipakai lagi untuk negara baru.`,
    "Negara yang dipakai tenant tidak dapat dihapus.",
    "Jika negara ini hanya tidak dipakai lagi, sebaiknya nonaktifkan saja lewat Ubah.",
  ]
}

interface DeleteFailure {
  readonly name: string
  readonly message: string
  readonly referenceId: string | null
}

export function CountryListPage() {
  const queryClient = useQueryClient()
  const { confirm } = useDialogs()
  const [search, setSearch] = useSearchState(SEARCH_DEFAULTS)
  const page = parsePageParam(search.page)
  const [dialog, setDialog] = useState<CountryDialogState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteFailure, setDeleteFailure] = useState<DeleteFailure | null>(null)

  const query = useQuery({
    queryKey: queryKeys.countries.list({ page, limit: PAGE_SIZE }),
    queryFn: () => listCountries({ page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })
  const result = query.data
  const items = result?.data ?? EMPTY_ITEMS
  const pagination = result?.pagination
  const pageCount = Math.max(1, pagination?.totalPages ?? 1)
  const from =
    items.length === 0 ? 0 : (page - 1) * (pagination?.limit ?? 0) + 1
  const view = {
    page,
    setPage: (next: number) => setSearch({ page: String(next) }),
    pageCount,
    from,
    to: items.length === 0 ? 0 : from + items.length - 1,
    total: pagination?.total ?? 0,
  }
  const failure = query.isError ? describeReadFailure(query.error) : null

  const handleDelete = async (country: Country) => {
    setDeleteFailure(null)
    const confirmed = await confirm({
      title: `Hapus negara ${country.code}?`,
      description: `Negara ${country.name} (${country.code}) akan dihapus.`,
      impact: deleteImpact(country),
      confirmLabel: "Hapus permanen",
      tone: "destructive",
      permanent: true,
    })
    if (!confirmed) return
    setDeletingId(country.code)
    try {
      await deleteCountry(country.code)
      await applyInvalidation(queryClient, { kind: "countryWrite" })
      toast.success("Negara dihapus.")
      // The last row of a later page is gone, so step back one page.
      if (items.length === 1 && page > 1) setSearch({ page: String(page - 1) })
    } catch (error) {
      const described = describeWriteFailure(error)
      setDeleteFailure({ name: country.name, ...described })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <PageBody>
      <PageHeader
        title={META.title}
        {...(META.description !== undefined
          ? { description: META.description }
          : {})}
        actions={
          <Button type="button" onClick={() => setDialog({ mode: "create" })}>
            Tambah negara
          </Button>
        }
      />

      {deleteFailure !== null ? (
        <FormAlert
          message={`Negara ${deleteFailure.name} tidak dihapus. ${deleteFailure.message}`}
          referenceId={deleteFailure.referenceId}
        />
      ) : null}

      <TableCard>
        <TableCard.Header
          title="Negara"
          {...(pagination !== undefined ? { count: pagination.total } : {})}
        />
        <TableCard.Body aria-busy={query.isFetching}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kewarganegaraan</TableHead>
                <TableHead className="w-28">Kode telepon</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-44 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending ? (
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
                        onClick={() => void query.refetch()}
                      >
                        Coba lagi
                      </Button>
                    </div>
                  </FormAlert>
                </MessageRow>
              ) : items.length === 0 ? (
                <MessageRow>
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada negara.
                  </p>
                </MessageRow>
              ) : (
                items.map((country) => (
                  <TableRow key={country.code}>
                    <TableCell className="py-2 font-mono text-xs font-medium">
                      {country.code}
                    </TableCell>
                    <TableCell className="py-2">{country.name}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {country.nationalityName ?? (
                        <span aria-label="Tanpa kewarganegaraan">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2 font-mono text-xs">
                      {country.phoneCode ?? (
                        <span aria-label="Tanpa kode telepon">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <TenantStatusBadge
                        status={country.isActive ? "ACTIVE" : "INACTIVE"}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Ubah negara ${country.name}`}
                          disabled={deletingId !== null}
                          onClick={() => setDialog({ mode: "edit", country })}
                        >
                          Ubah
                        </Button>
                        <RowDeleteButton
                          label={`Hapus negara ${country.name}`}
                          disabled={deletingId !== null}
                          onClick={() => void handleDelete(country)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableCard.Body>
        <TableCard.Footer>
          <TablePagination pagination={view} unit="negara" />
        </TableCard.Footer>
      </TableCard>

      {dialog !== null ? (
        <CountryFormDialog state={dialog} onClose={() => setDialog(null)} />
      ) : null}
    </PageBody>
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
            Memuat negara...
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
