/**
 * System user detail (`/system-users/:id`; REQ-FE-031, REQ-FE-032, REQ-FE-039;
 * ARCH-FE-001 D4.10, D6.4, D6.6, D7, D12.1). Tabs: Detail and "Sesi aktif"
 * (only with `sessions:view` and
 * `OTHER_ACCOUNT_SESSIONS_ENABLED`; suspended, so the own account shows a link
 * to `/account/sessions`). Actions follow `userActionAccess`: the own
 * account has no suspend, deactivate or role change. There is no "Hapus"
 * action (REQ-FE-054).
 */

import { useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/auth-provider"
import { navigateTo, splitHref, useLocationHref } from "@/app/router"
import { AppLink } from "@/features/auth/components/app-link"
import { FormAlert } from "@/components/custom/form-alert"
import { PageBody } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/lib/api/errors"
import { describeReadFailure } from "@/features/tenants/shared/failure"
import { getSystemUser } from "@/lib/api/modules/system-users"
import { queryKeys } from "@/lib/query/keys"
import type { SystemUser } from "@/types/system-user"

import { canViewUserSessions, userActionAccess } from "./access"
import { formatDateTime } from "./format"
import { UserActionButtons } from "./user-action-buttons"
import { USER_LIST_PATH, userIdOfPath } from "./user-paths"
import { isRoleInactive } from "./role-state"
import { UserRoleDialog } from "./user-role-dialog"
import { UserSessionsTab } from "./user-sessions-tab"
import { RoleInactiveBadge, SelfBadge, UserStatusBadge } from "./user-status"
import { useRoleOptions } from "./use-role-options"
import { useUserActions } from "./use-user-actions"

export function UserDetailPage() {
  const { pathname } = splitHref(useLocationHref())
  const userId = userIdOfPath(pathname)
  if (userId === null) return <NotFound />
  return <UserDetailLoader userId={userId} />
}

function UserDetailLoader({ userId }: { readonly userId: string }) {
  const query = useQuery({
    queryKey: queryKeys.systemUsers.detail(userId),
    queryFn: () => getSystemUser(userId),
  })

  if (query.isPending) {
    return (
      <PageBody>
        <span role="status" className="sr-only">
          Memuat akun...
        </span>
        <div aria-hidden="true" className="flex flex-col gap-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-40 w-full" />
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
  return <UserDetailView user={query.data} />
}

function NotFound() {
  return (
    <PageBody>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm">Akun tidak ditemukan.</p>
          <Button variant="outline" onClick={() => navigateTo(USER_LIST_PATH)}>
            Kembali ke daftar akun
          </Button>
        </CardContent>
      </Card>
    </PageBody>
  )
}

type DetailTab = "detail" | "sessions"

function isDetailTab(value: unknown): value is DetailTab {
  return value === "detail" || value === "sessions"
}

function UserDetailView({ user }: { readonly user: SystemUser }) {
  const { me } = useAuth()
  const permissions = me?.permissions ?? []
  const access = userActionAccess(permissions, me?.userId ?? null, user)
  const showSessions = canViewUserSessions(permissions)
  const [tab, setTab] = useState<DetailTab>("detail")
  const [changingRole, setChangingRole] = useState(false)
  const actions = useUserActions()
  const roles = useRoleOptions()
  const role = roles.query.data?.find((item) => item.id === user.systemRoleId)
  const roleInactive = isRoleInactive(roles.query.data, user)

  return (
    <PageBody>
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => navigateTo(USER_LIST_PATH)}
          className="w-fit text-xs text-muted-foreground hover:text-foreground"
        >
          Daftar akun
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">
              {user.loginId}
            </h1>
            <UserStatusBadge status={user.status} />
            {access.isSelf ? <SelfBadge /> : null}
          </div>
          <UserActionButtons
            user={user}
            access={access}
            actions={actions}
            onChangeRole={() => setChangingRole(true)}
          />
        </div>
      </div>

      <FormAlert
        message={actions.failure?.message ?? null}
        referenceId={actions.failure?.referenceId ?? null}
      />

      <Tabs
        value={showSessions ? tab : "detail"}
        onValueChange={(value) => {
          if (isDetailTab(value)) setTab(value)
        }}
      >
        <TabsList>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          {showSessions ? (
            <TabsTrigger value="sessions">Sesi aktif</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="detail" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Detail akun</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Item label="Login ID" value={user.loginId} />
                <Item
                  label="Peran"
                  value={
                    role === undefined
                      ? user.systemRoleKey
                      : `${role.name} (${role.key})`
                  }
                  {...(roleInactive ? { badge: <RoleInactiveBadge /> } : {})}
                />
                <Item label="Dibuat" value={formatDateTime(user.createdAt)} />
                <Item label="Diubah" value={formatDateTime(user.updatedAt)} />
              </dl>
            </CardContent>
          </Card>
          {access.isSelf && !showSessions ? <OwnSessionsLink /> : null}
        </TabsContent>
        {showSessions ? (
          <TabsContent value="sessions" className="flex flex-col gap-4">
            <UserSessionsTab
              userId={user.id}
              loginId={user.loginId}
              isSelf={access.isSelf}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      {changingRole && access.canChangeRole ? (
        <UserRoleDialog
          user={user}
          roleInactive={roleInactive}
          onClose={() => setChangingRole(false)}
        />
      ) : null}
    </PageBody>
  )
}

/** Own account: sessions live on the account page (D4.10, REQ-FE-052). */
function OwnSessionsLink() {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
        <span>Sesi aktif akun Anda ada di halaman sesi akun.</span>
        <AppLink to="/account/sessions">Lihat sesi saya</AppLink>
      </CardContent>
    </Card>
  )
}

function Item({
  label,
  value,
  badge,
}: {
  readonly label: string
  readonly value: string
  readonly badge?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap items-center gap-2">
        {value}
        {badge}
      </dd>
    </div>
  )
}
