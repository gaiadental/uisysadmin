/**
 * System users (`/system-users`, Tim IT > Akun; REQ-FE-018, REQ-FE-030,
 * REQ-FE-031, REQ-FE-036, REQ-FE-039, REQ-FE-048; ARCH-FE-001 D5.4, D6.4,
 * D6.6, D7, D12.1). auth-service returns the whole list, so search and paging
 * run on the client (`useClientPagedList`). The list shows `loginId` only: the
 * contract has no display name or last-active time (SP-BG-04). The own
 * account carries a "self" badge and no suspend or deactivate. There is no "Hapus" action (REQ-FE-054).
 */

import { useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/auth-provider"
import { FormAlert } from "@/components/custom/form-alert"
import { PageBody, PageHeader } from "@/components/page-header"
import { TableCard } from "@/components/table-card"
import { TablePagination } from "@/components/table-pagination"
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
import { listSystemUsers } from "@/lib/api/modules/system-users"
import { queryKeys } from "@/lib/query/keys"
import { routeMeta } from "@/lib/routes-meta"
import type { SystemUser } from "@/types/system-user"

import { canCreateUser, userActionAccess } from "./access"
import { UserActionButtons } from "./user-action-buttons"
import { UserCreateDialog } from "./user-create-dialog"
import { userDetailPathOf } from "./user-paths"
import { USER_STATUS_LABELS } from "./status-labels"
import { isRoleInactive } from "./role-state"
import { RoleInactiveBadge, SelfBadge, UserStatusBadge } from "./user-status"
import { useRoleOptions } from "./use-role-options"
import { useUserActions } from "./use-user-actions"

const META = routeMeta["team.users"]
const COLUMN_COUNT = 4
const SKELETON_ROWS = 5
const EMPTY_USERS: readonly SystemUser[] = []

function matchesQuery(user: SystemUser, query: string): boolean {
  return [
    user.loginId,
    user.systemRoleKey,
    USER_STATUS_LABELS[user.status],
  ].some((value) => value.toLocaleLowerCase().includes(query))
}

export function UserListPage() {
  const { me } = useAuth()
  const permissions = me?.permissions ?? []
  const selfId = me?.userId ?? null
  const showCreate = canCreateUser(permissions)

  const [creating, setCreating] = useState(false)
  const actions = useUserActions()

  // The whole list is the shared `['system','users']` key, so TODO-015 can derive member counts from it.
  const query = useQuery({
    queryKey: queryKeys.systemUsers.all(),
    queryFn: listSystemUsers,
  })
  const roles = useRoleOptions()
  const users = query.data ?? EMPTY_USERS
  const list = useClientPagedList(users, { matches: matchesQuery })
  const failure = query.isError ? describeReadFailure(query.error) : null

  return (
    <PageBody>
      <PageHeader
        title={META.title}
        {...(META.description !== undefined
          ? { description: META.description }
          : {})}
        actions={
          showCreate ? (
            <Button type="button" onClick={() => setCreating(true)}>
              Tambah akun
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
          title="Akun"
          {...(query.data !== undefined ? { count: list.total } : {})}
        />
        <TableCard.Toolbar>
          <div className="w-full max-w-xs">
            <label htmlFor="user-search" className="sr-only">
              Cari akun
            </label>
            <Input
              id="user-search"
              type="search"
              autoComplete="off"
              placeholder="Cari login ID, peran, atau status"
              value={list.query}
              onChange={(event) => list.setQuery(event.target.value)}
            />
          </div>
        </TableCard.Toolbar>
        <TableCard.Body aria-busy={query.isFetching}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Login ID</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead className="w-36">Status</TableHead>
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
                    {users.length === 0
                      ? "Belum ada akun."
                      : "Tidak ada akun yang cocok."}
                  </p>
                </MessageRow>
              ) : (
                list.pageItems.map((user) => {
                  const access = userActionAccess(permissions, selfId, user)
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="py-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <AppLink to={userDetailPathOf(user.id)}>
                            {user.loginId}
                          </AppLink>
                          {access.isSelf ? <SelfBadge /> : null}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs">
                            {user.systemRoleKey}
                          </span>
                          {isRoleInactive(roles.query.data, user) ? (
                            <RoleInactiveBadge />
                          ) : null}
                        </span>
                      </TableCell>
                      <TableCell className="py-2">
                        <UserStatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="py-2">
                        <UserActionButtons
                          user={user}
                          access={access}
                          actions={actions}
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
          <TablePagination pagination={list} unit="akun" />
        </TableCard.Footer>
      </TableCard>

      {creating ? (
        <UserCreateDialog onClose={() => setCreating(false)} />
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
            Memuat akun...
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
