/**
 * Role Permissions tab (REQ-FE-034; ARCH-FE-001 D6.4, D6.6, D7, D9, D12.1). A
 * checklist of the master permission catalogue, grouped by module then
 * category, pre-checked from `GET /system-roles/{id}/permissions` (keys) and
 * saved with ONE PUT of `{ permissionKeys }` (full replacement). The tab needs
 * `master_permissions:view`; saving needs `system_roles:update`.
 *
 * The SYS_PRINCIPAL checklist is read-only with no save (static lock). After a
 * protected-role refusal the checklist is read-only and the role is marked
 * refused. Keys the role holds that are not in the catalogue stay in the
 * selection, so a save does not remove them silently (documented default).
 */

import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Controller } from "react-hook-form"
import { toast } from "sonner"

import { useAuth } from "@/app/providers/auth-provider"
import { FormAlert } from "@/components/custom/form-alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { groupPermissions } from "@/features/tenants/permissions/checklist"
import type { WriteFailure } from "@/features/tenants/create/write-failure"
import { describeReadFailure } from "@/features/tenants/shared/failure"
import { listMasterPermissions } from "@/lib/api/modules/master-permissions"
import {
  listRolePermissionKeys,
  replaceRolePermissionKeys,
} from "@/lib/api/modules/system-roles"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import type { MasterPermission } from "@/types/master-permission"
import type { SystemRole } from "@/types/system-role"

import { roleActionAccess } from "./access"
import { describeRoleWriteFailure, isRoleRefusal } from "./role-failure"
import { useRefusedRoles } from "./refused-roles"
import {
  rolePermissionsFormSchema,
  type RolePermissionsFormValues,
} from "./schema"
import { sameKeySet, withKey } from "./selection"

export function RolePermissionsTab({ role }: { readonly role: SystemRole }) {
  const masterQuery = useQuery({
    queryKey: queryKeys.masterPermissions.all(),
    queryFn: listMasterPermissions,
  })
  const roleQuery = useQuery({
    queryKey: queryKeys.rolePermissions.ofRole(role.id),
    queryFn: () => listRolePermissionKeys(role.id),
  })

  if (masterQuery.isPending || roleQuery.isPending) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3">
          <span role="status" className="sr-only">
            Memuat permission...
          </span>
          <div aria-hidden="true" className="flex flex-col gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }
  if (masterQuery.isError || roleQuery.isError) {
    const failure = describeReadFailure(masterQuery.error ?? roleQuery.error)
    return (
      <FormAlert message={failure.message} referenceId={failure.referenceId}>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void masterQuery.refetch()
              void roleQuery.refetch()
            }}
          >
            Coba lagi
          </Button>
        </div>
      </FormAlert>
    )
  }
  return (
    <RoleChecklist
      role={role}
      catalogue={masterQuery.data}
      savedKeys={roleQuery.data}
    />
  )
}

function RoleChecklist({
  role,
  catalogue,
  savedKeys,
}: {
  readonly role: SystemRole
  readonly catalogue: readonly MasterPermission[]
  readonly savedKeys: readonly string[]
}) {
  const queryClient = useQueryClient()
  const { me } = useAuth()
  const refusals = useRefusedRoles()
  const access = roleActionAccess(
    me?.permissions ?? [],
    role,
    refusals.isRefused(role.id)
  )
  const editable = access.canEditPermissions && !access.refused

  const savedSignature = [...savedKeys].sort().join(",")
  const form = useZodForm(rolePermissionsFormSchema, {
    permissionKeys: [...savedKeys],
  })
  const { reset } = form
  // After a save the role permissions refetch. The form follows the saved set.
  useEffect(() => {
    reset({ permissionKeys: [...savedKeys] })
    // savedSignature changes exactly when the saved set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, savedSignature])

  const [failure, setFailure] = useState<WriteFailure | null>(null)
  const selected = form.watch("permissionKeys")
  const dirty = !sameKeySet(selected, savedKeys)
  const { isSubmitting } = form.formState
  const groups = useMemo(() => groupPermissions(catalogue), [catalogue])

  const save = form.handleSubmit(async (values: RolePermissionsFormValues) => {
    setFailure(null)
    try {
      await replaceRolePermissionKeys(role.id, values.permissionKeys)
      await applyInvalidation(queryClient, {
        kind: "rolePermissionsReplace",
        roleId: role.id,
      })
      toast.success("Permission peran disimpan.")
    } catch (error) {
      if (isRoleRefusal(error)) refusals.markRefused(role.id)
      setFailure(describeRoleWriteFailure(error))
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <p className="text-xs text-muted-foreground">
          {access.locked
            ? "Permission peran System Principal terkunci dan tidak bisa diubah."
            : "Permission yang dimiliki peran ini. Perubahan berlaku setelah Anda menekan Simpan."}
        </p>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
          className="flex flex-col gap-5"
        >
          <FormAlert
            message={failure?.message ?? null}
            referenceId={failure?.referenceId ?? null}
          />
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada permission di katalog.
            </p>
          ) : (
            <Controller
              control={form.control}
              name="permissionKeys"
              render={({ field }) => (
                <div className="flex flex-col gap-4">
                  {groups.map((group) => (
                    <fieldset
                      key={`${group.module}/${group.category}`}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3"
                    >
                      <legend className="px-1 text-xs font-medium text-muted-foreground">
                        {group.module} / {group.category}
                      </legend>
                      {group.items.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={field.value.includes(item.key)}
                            disabled={!editable || isSubmitting}
                            onCheckedChange={(next) =>
                              field.onChange(
                                withKey(field.value, item.key, next === true)
                              )
                            }
                          />
                          <span>
                            {item.name}
                            <code className="ml-2 font-mono text-xs text-muted-foreground">
                              {item.key}
                            </code>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  ))}
                </div>
              )}
            />
          )}
          {access.canEditPermissions ? (
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={!dirty || isSubmitting || access.refused}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!dirty || isSubmitting}
                onClick={() => reset({ permissionKeys: [...savedKeys] })}
              >
                Batalkan
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}
