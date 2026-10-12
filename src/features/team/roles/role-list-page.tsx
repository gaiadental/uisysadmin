/**
 * System roles (`/system-roles`, Tim IT > Peran; REQ-FE-018, REQ-FE-033,
 * REQ-FE-039, REQ-FE-048; ARCH-FE-001 D5.4, D6.4, D6.6, D7, D12.1). The role
 * list is not paginated by the server, so search and paging run on the client.
 * Member counts are derived from the user list (the shared `['system','users']`
 * key) and show a dash without `system_users:view`. SYS_PRINCIPAL is locked.
 */

import { useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/auth-provider"
import { FormAlert } from "@/components/custom/form-alert"
import { PageBody, PageHeader } from "@/components/page-header"
import { TableCard } from "@/components/table-card"
import { TablePagination } from "@/components/table-pagination"
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
import { AppLink } from "@/features/auth/components/app-link"
import { describeReadFailure } from "@/features/tenants/shared/failure"
import { useClientPagedList } from "@/hooks/use-client-paged-list"
import { listSystemRoles } from "@/lib/api/modules/system-roles"
import { listSystemUsers } from "@/lib/api/modules/system-users"
import { queryKeys } from "@/lib/query/keys"
import { routeMeta } from "@/lib/routes-meta"
import type { SystemRole } from "@/types/system-role"

import { canCountMembers, canCreateRole, roleActionAccess } from "./access"
import { countMembersByRole } from "./member-counts"
import { useRefusedRoles } from "./refused-roles"
import { RoleActionButtons } from "./role-action-buttons"
import { RoleFormDialog, type RoleDialogState } from "./role-form-dialog"
import { roleDetailPathOf } from "./role-paths"
import { useRoleActions } from "./use-role-actions"

const META = routeMeta["team.roles"]
const COLUMN_COUNT = 5
const SKELETON_ROWS = 5
const EMPTY_ROLES: readonly SystemRole[] = []

function matchesQuery(role: SystemRole, query: string): boolean {
  return [role.key, role.name, role.description]
    .filter((value): value is string => typeof value === "string")
    .some((value) => value.toLocaleLowerCase().includes(query))
}

export function RoleListPage() {
  const { me } = useAuth()
  const permissions = me?.permissions ?? []
  const countMembers = canCountMembers(permissions)
  const [dialog, setDialog] = useState<RoleDialogState | null>(null)
  const actions = useRoleActions()
  const refusals = useRefusedRoles()

  const query = useQuery({
    queryKey: queryKeys.systemRoles.all(),
    queryFn: listSystemRoles,
  })
  // The whole user list is the shared `['system','users']` key (TODO-014).
  const usersQuery = useQuery({
    queryKey: queryKeys.systemUsers.all(),
    queryFn: listSystemUsers,
    enabled: countMembers,
  })
  const counts = countMembersByRole(usersQuery.data ?? [])
  const roles = query.data ?? EMPTY_ROLES
  const list = useClientPagedList(roles, { matches: matchesQuery })
  const failure = query.isError ? describeReadFailure(query.error) : null

  return (
    <PageBody>
      <PageHeader
        title={META.title}
        {...(META.description !== undefined
          ? { description: META.description }
          : {})}
        actions={
          canCreateRole(permissions) ? (
            <Button type="button" onClick={() => setDialog({ mode: "create" })}>
              Tambah peran
            </Button>
          ) : null
        }
      />

      <FormAlert
        message={actions.failure?.message ?? null}
        referenceId={actions.failure?.referenceId ?? null}
      />

      <TableCard>
        <TableCard.Header
          title="Peran"
          {...(query.data !== undefined ? { count: list.total } : {})}
        />
        <TableCard.Toolbar>
          <div className="w-full max-w-xs">
            <label htmlFor="role-search" className="sr-only">
              Cari peran
            </label>
            <Input
              id="role-search"
              type="search"
              autoComplete="off"
              placeholder="Cari key, nama, atau deskripsi"
              value={list.query}
              onChange={(event) => list.setQuery(event.target.value)}
            />
          </div>
        </TableCard.Toolbar>
        <TableCard.Body aria-busy={query.isFetching}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peran</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="w-28">Anggota</TableHead>
                <TableHead className="w-28">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isPending ? (
                <LoadingRows />
              ) : failure !== null && query.data === undefined ? (
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
              ) : list.pageItems.length === 0 ? (
                <MessageRow>
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {roles.length === 0
                      ? "Belum ada peran."
                      : "Tidak ada peran yang cocok."}
                  </p>
                </MessageRow>
              ) : (
                list.pageItems.map((role) => {
                  const access = roleActionAccess(
                    permissions,
                    role,
                    refusals.isRefused(role.id)
                  )
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="py-2">
                        <AppLink to={roleDetailPathOf(role.id)}>
                          {role.name}
                        </AppLink>
                      </TableCell>
                      <TableCell className="py-2 font-mono text-xs">
                        {role.key}
                      </TableCell>
                      <TableCell className="py-2 text-sm">
                        {memberCountLabel(
                          countMembers,
                          usersQuery.isSuccess,
                          counts.get(role.id) ?? 0
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <RoleStatusBadge active={role.active} />
                      </TableCell>
                      <TableCell className="py-2">
                        <RoleActionButtons
                          role={role}
                          access={access}
                          deleting={actions.pendingId === role.id}
                          onEdit={() => setDialog({ mode: "edit", role })}
                          onDelete={() => void actions.remove(role)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableCard.Body>
        <TableCard.Footer>
          <TablePagination pagination={list} unit="peran" />
        </TableCard.Footer>
      </TableCard>

      {dialog !== null ? (
        <RoleFormDialog state={dialog} onClose={() => setDialog(null)} />
      ) : null}
    </PageBody>
  )
}

function memberCountLabel(
  allowed: boolean,
  loaded: boolean,
  count: number
): string {
  if (!allowed || !loaded) return "-"
  return String(count)
}

/** `active` is optional in the contract (BG-07). Without it nothing is claimed. */
export function RoleStatusBadge({
  active,
}: {
  readonly active: boolean | undefined
}) {
  if (active === undefined) return null
  return active ? (
    <Badge
      variant="outline"
      className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400"
    >
      Aktif
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-muted-foreground">
      Nonaktif
    </Badge>
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
            Memuat peran...
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
