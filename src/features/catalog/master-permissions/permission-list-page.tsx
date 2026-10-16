/**
 * Master permissions catalogue (`/master-permissions`; REQ-FE-018, REQ-FE-035,
 * REQ-FE-036, REQ-FE-039, REQ-FE-040, REQ-FE-048; ARCH-FE-001 D5.3, D5.4, D6.4,
 * D7, D9, D12.1; TODO-021). The screen is read-only: list, search and paging
 * only, plus "Ubah" for name and description. auth-service returns the whole
 * list, so search and paging run on the client (`useClientPagedList`). The
 * route needs `master_permissions:view`; "Ubah" shows only with
 * `:update` (UX only, the backend enforces). There is no create, activate or
 * delete control, whatever keys the session holds. A Scope column shows the
 * PLATFORM or TENANT badge (REQ-FE-057); there is no scope filter, and search
 * also matches the scope.
 */

import { useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/auth-provider"
import { FormAlert } from "@/components/custom/form-alert"
import { PageBody, PageHeader } from "@/components/page-header"
import { TableCard } from "@/components/table-card"
import { TablePagination } from "@/components/table-pagination"
import { TenantStatusBadge } from "@/components/tenant-bits"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { describeReadFailure } from "@/features/tenants/shared/failure"
import { useClientPagedList } from "@/hooks/use-client-paged-list"
import { listMasterPermissions } from "@/lib/api/modules/master-permissions"
import { queryKeys } from "@/lib/query/keys"
import { routeMeta } from "@/lib/routes-meta"
import type { MasterPermission } from "@/types/master-permission"

import {
  PermissionFormDialog,
  type PermissionDialogState,
} from "./permission-form-dialog"

const META = routeMeta["catalog.permission"]
const COLUMN_COUNT = 8
const SKELETON_ROWS = 5
const EMPTY_ITEMS: readonly MasterPermission[] = []

function matchesQuery(item: MasterPermission, query: string): boolean {
  return [
    item.key,
    item.name,
    item.category,
    item.module,
    item.scope,
    item.description,
  ]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLocaleLowerCase().includes(query))
}

export function PermissionListPage() {
  const { me } = useAuth()
  const granted = me?.permissions ?? []
  const showActions = granted.includes("master_permissions:update")

  const [dialog, setDialog] = useState<PermissionDialogState | null>(null)

  const query = useQuery({
    queryKey: queryKeys.masterPermissions.all(),
    queryFn: listMasterPermissions,
  })
  const items = query.data ?? EMPTY_ITEMS
  const list = useClientPagedList(items, { matches: matchesQuery })
  const failure = query.isError ? describeReadFailure(query.error) : null
  const columnCount = showActions ? COLUMN_COUNT : COLUMN_COUNT - 1

  return (
    <PageBody>
      <PageHeader
        title={META.title}
        {...(META.description !== undefined
          ? { description: META.description }
          : {})}
      />

      <TableCard>
        <TableCard.Header
          title="Permission"
          {...(query.data !== undefined ? { count: list.total } : {})}
        />
        <TableCard.Toolbar>
          <div className="w-full max-w-xs">
            <label htmlFor="permission-search" className="sr-only">
              Cari permission
            </label>
            <Input
              id="permission-search"
              type="search"
              autoComplete="off"
              placeholder="Cari key, nama, kategori, modul, atau scope"
              value={list.query}
              onChange={(event) => list.setQuery(event.target.value)}
            />
          </div>
        </TableCard.Toolbar>
        <TableCard.Body aria-busy={query.isFetching}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Modul</TableHead>
                <TableHead className="w-28">Scope</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="w-36">Tenant</TableHead>
                {showActions ? (
                  <TableHead className="w-28 text-right">Aksi</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending ? (
                <LoadingRows columns={columnCount} />
              ) : failure !== null && query.data === undefined ? (
                <MessageRow columns={columnCount}>
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
              ) : list.pageItems.length === 0 ? (
                <MessageRow columns={columnCount}>
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {items.length === 0
                      ? "Belum ada permission."
                      : "Tidak ada permission yang cocok."}
                  </p>
                </MessageRow>
              ) : (
                list.pageItems.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="py-2 font-mono text-xs font-medium">
                      {permission.key}
                    </TableCell>
                    <TableCell className="py-2">{permission.name}</TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {permission.category}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {permission.module}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={
                          permission.scope === "PLATFORM"
                            ? "default"
                            : "outline"
                        }
                      >
                        {permission.scope}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      {permission.active === undefined ? (
                        <span aria-label="Status tidak diketahui">—</span>
                      ) : (
                        <TenantStatusBadge
                          status={permission.active ? "ACTIVE" : "INACTIVE"}
                        />
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {permission.customerPermitted === true ? (
                        <Badge variant="outline">Boleh dipakai</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Internal
                        </span>
                      )}
                    </TableCell>
                    {showActions ? (
                      <TableCell className="py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={`Ubah permission ${permission.key}`}
                            onClick={() => setDialog({ permission })}
                          >
                            Ubah
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableCard.Body>
        <TableCard.Footer>
          <TablePagination pagination={list} unit="permission" />
        </TableCard.Footer>
      </TableCard>

      {dialog !== null ? (
        <PermissionFormDialog state={dialog} onClose={() => setDialog(null)} />
      ) : null}
    </PageBody>
  )
}

function MessageRow({
  children,
  columns,
}: {
  readonly children: ReactNode
  readonly columns: number
}) {
  return (
    <TableRow>
      <TableCell colSpan={columns} className="px-4 py-3">
        {children}
      </TableCell>
    </TableRow>
  )
}

function LoadingRows({ columns }: { readonly columns: number }) {
  return (
    <>
      <TableRow>
        <TableCell colSpan={columns} className="p-0">
          <span role="status" className="sr-only">
            Memuat permission...
          </span>
        </TableCell>
      </TableRow>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <TableRow key={index} aria-hidden="true">
          <TableCell colSpan={columns} className="py-2">
            <Skeleton className="h-5 w-full" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
