/**
 * System role detail (`/system-roles/:id`; REQ-FE-033, REQ-FE-034,
 * REQ-FE-039; ARCH-FE-001 D6.4, D6.6, D7, D12.1). Tabs: Detail and
 * Permissions (only with `master_permissions:view`). Edit and delete follow
 * `roleActionAccess`: SYS_PRINCIPAL is locked, other roles are disabled after
 * a backend refusal. A delete returns to the list.
 */

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/app/providers/auth-provider"
import { navigateTo, splitHref, useLocationHref } from "@/app/router"
import { FormAlert } from "@/components/custom/form-alert"
import { PageBody } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateTime } from "@/features/team/users/format"
import { describeReadFailure } from "@/features/tenants/shared/failure"
import { ApiError } from "@/lib/api/errors"
import { getSystemRole } from "@/lib/api/modules/system-roles"
import { queryKeys } from "@/lib/query/keys"
import type { SystemRole } from "@/types/system-role"

import { canViewRoleChecklist, roleActionAccess } from "./access"
import { useRefusedRoles } from "./refused-roles"
import { RoleActionButtons } from "./role-action-buttons"
import { RoleFormDialog } from "./role-form-dialog"
import { RoleStatusBadge } from "./role-list-page"
import { ROLE_LIST_PATH, roleIdOfPath } from "./role-paths"
import { RolePermissionsTab } from "./role-permissions-tab"
import { useRoleActions } from "./use-role-actions"

export function RoleDetailPage() {
  const { pathname } = splitHref(useLocationHref())
  const roleId = roleIdOfPath(pathname)
  if (roleId === null) return <NotFound />
  return <RoleDetailLoader roleId={roleId} />
}

function RoleDetailLoader({ roleId }: { readonly roleId: number }) {
  const query = useQuery({
    queryKey: queryKeys.systemRoles.detail(roleId),
    queryFn: () => getSystemRole(roleId),
  })

  if (query.isPending) {
    return (
      <PageBody>
        <span role="status" className="sr-only">
          Memuat peran...
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
  return <RoleDetailView role={query.data} />
}

function NotFound() {
  return (
    <PageBody>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm">Peran tidak ditemukan.</p>
          <Button variant="outline" onClick={() => navigateTo(ROLE_LIST_PATH)}>
            Kembali ke daftar peran
          </Button>
        </CardContent>
      </Card>
    </PageBody>
  )
}

type DetailTab = "detail" | "permissions"

function isDetailTab(value: unknown): value is DetailTab {
  return value === "detail" || value === "permissions"
}

function RoleDetailView({ role }: { readonly role: SystemRole }) {
  const { me } = useAuth()
  const permissions = me?.permissions ?? []
  const refusals = useRefusedRoles()
  const access = roleActionAccess(permissions, role, refusals.isRefused(role.id))
  const showChecklist = canViewRoleChecklist(permissions)
  const [tab, setTab] = useState<DetailTab>("detail")
  const [editing, setEditing] = useState(false)
  const actions = useRoleActions({
    onDeleted: () => navigateTo(ROLE_LIST_PATH),
  })

  return (
    <PageBody>
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => navigateTo(ROLE_LIST_PATH)}
          className="w-fit text-xs text-muted-foreground hover:text-foreground"
        >
          Daftar peran
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">
              {role.name}
            </h1>
            <RoleStatusBadge active={role.active} />
          </div>
          <RoleActionButtons
            role={role}
            access={access}
            deleting={actions.pendingId === role.id}
            onEdit={() => setEditing(true)}
            onDelete={() => void actions.remove(role)}
          />
        </div>
      </div>

      <FormAlert
        message={actions.failure?.message ?? null}
        referenceId={actions.failure?.referenceId ?? null}
      />

      <Tabs
        value={showChecklist ? tab : "detail"}
        onValueChange={(value) => {
          if (isDetailTab(value)) setTab(value)
        }}
      >
        <TabsList>
          <TabsTrigger value="detail">Detail</TabsTrigger>
          {showChecklist ? (
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          ) : null}
        </TabsList>
        <TabsContent value="detail" className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Detail peran</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Item label="Key" value={role.key} />
                <Item label="Nama" value={role.name} />
                <Item label="Deskripsi" value={role.description ?? "-"} />
                <Item label="Dibuat" value={formatDateTime(role.createdAt)} />
                <Item label="Diubah" value={formatDateTime(role.updatedAt)} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>
        {showChecklist ? (
          <TabsContent value="permissions" className="flex flex-col gap-4">
            <RolePermissionsTab role={role} />
          </TabsContent>
        ) : null}
      </Tabs>

      {editing && access.canEdit ? (
        <RoleFormDialog
          state={{ mode: "edit", role }}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </PageBody>
  )
}

function Item({
  label,
  value,
}: {
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
