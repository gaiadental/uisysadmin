/**
 * Tenant categories catalog (`/tenant-categories`; REQ-FE-028, REQ-FE-029,
 * REQ-FE-039; ARCH-FE-001 D5.3, D7, D9, D12.1). List with server pagination,
 * create, edit and delete. The code is immutable after create. Delete asks for
 * confirmation. A 409 (the category is used by a tenant) shows next to the
 * table, and the list is not changed. Per-category tenant counts are removed
 * (FE-OQ-35 default).
 */

import { useState, type ReactNode } from "react"
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { FormAlert } from "@/components/custom/form-alert"
import { useDialogs } from "@/components/dialogs/dialogs"
import { PageBody, PageHeader } from "@/components/page-header"
import { TableCard } from "@/components/table-card"
import { TablePagination } from "@/components/table-pagination"
import { TenantStatusBadge } from "@/components/tenant-bits"
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
import {
  deleteTenantCategory,
  listTenantCategories,
} from "@/lib/api/modules/tenant-categories"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import { routeMeta } from "@/lib/routes-meta"
import type { TenantCategory } from "@/types/tenant-category"

import {
  CategoryFormDialog,
  type CategoryDialogState,
} from "./tenant-category-form-dialog"

const META = routeMeta["catalog.tenant-categories"]
const PAGE_SIZE = 20
const COLUMN_COUNT = 5
const SKELETON_ROWS = 5
const EMPTY_ITEMS: readonly TenantCategory[] = []
const SEARCH_DEFAULTS = { page: "1" } as const

interface DeleteFailure {
  readonly name: string
  readonly message: string
  readonly referenceId: string | null
}

export function TenantCategoryListPage() {
  const queryClient = useQueryClient()
  const { confirm } = useDialogs()
  const [search, setSearch] = useSearchState(SEARCH_DEFAULTS)
  const page = parsePageParam(search.page)
  const [dialog, setDialog] = useState<CategoryDialogState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteFailure, setDeleteFailure] = useState<DeleteFailure | null>(null)

  const query = useQuery({
    queryKey: queryKeys.tenantCategories.list({ page, limit: PAGE_SIZE }),
    queryFn: () => listTenantCategories({ page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  })
  const result = query.data
  const items = result?.data ?? EMPTY_ITEMS
  const pagination = result?.pagination
  const pageCount = Math.max(1, pagination?.totalPages ?? 1)
  const from = items.length === 0 ? 0 : (page - 1) * (pagination?.limit ?? 0) + 1
  const view = {
    page,
    setPage: (next: number) => setSearch({ page: String(next) }),
    pageCount,
    from,
    to: items.length === 0 ? 0 : from + items.length - 1,
    total: pagination?.total ?? 0,
  }
  const failure = query.isError ? describeReadFailure(query.error) : null

  const handleDelete = async (category: TenantCategory) => {
    setDeleteFailure(null)
    const confirmed = await confirm({
      title: `Hapus kategori ${category.name}?`,
      description: `Kategori ${category.name} (${category.code}) akan dihapus. Kategori yang dipakai tenant tidak bisa dihapus. Jika kategori ini hanya tidak dipakai lagi, nonaktifkan saja lewat Ubah.`,
      confirmLabel: "Hapus",
      tone: "destructive",
    })
    if (!confirmed) return
    setDeletingId(category.id)
    try {
      await deleteTenantCategory(category.id)
      await applyInvalidation(queryClient, { kind: "tenantCategoryWrite" })
      toast.success("Kategori dihapus.")
      // The last row of a later page is gone, so step back one page.
      if (items.length === 1 && page > 1) setSearch({ page: String(page - 1) })
    } catch (error) {
      const described = describeWriteFailure(error)
      setDeleteFailure({ name: category.name, ...described })
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
            Tambah kategori
          </Button>
        }
      />

      {deleteFailure !== null ? (
        <FormAlert
          message={`Kategori ${deleteFailure.name} tidak dihapus. ${deleteFailure.message}`}
          referenceId={deleteFailure.referenceId}
        />
      ) : null}

      <TableCard>
        <TableCard.Header
          title="Kategori tenant"
          {...(pagination !== undefined ? { count: pagination.total } : {})}
        />
        <TableCard.Body aria-busy={query.isFetching}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
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
                    Belum ada kategori tenant.
                  </p>
                </MessageRow>
              ) : (
                items.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="py-2 font-mono text-xs font-medium">
                      {category.code}
                    </TableCell>
                    <TableCell className="py-2">{category.name}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {category.description ?? (
                        <span aria-label="Tanpa deskripsi">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <TenantStatusBadge
                        status={category.isActive ? "ACTIVE" : "INACTIVE"}
                      />
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Ubah kategori ${category.name}`}
                          disabled={deletingId !== null}
                          onClick={() => setDialog({ mode: "edit", category })}
                        >
                          Ubah
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`Hapus kategori ${category.name}`}
                          disabled={deletingId !== null}
                          onClick={() => void handleDelete(category)}
                        >
                          {deletingId === category.id ? "Menghapus..." : "Hapus"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableCard.Body>
        <TableCard.Footer>
          <TablePagination pagination={view} unit="kategori" />
        </TableCard.Footer>
      </TableCard>

      {dialog !== null ? (
        <CategoryFormDialog state={dialog} onClose={() => setDialog(null)} />
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
            Memuat kategori...
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
