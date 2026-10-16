/**
 * Tenant Permissions tab (REQ-FE-026; ARCH-FE-001 D6.4, D7, D9, D12.1). A
 * checklist of the master permission catalogue, grouped by module and
 * category, pre-checked from the tenant's permissions. "Simpan" sends one PUT
 * with the selected ids (full replacement). Each saved permission also has a
 * status switch that sends one PATCH. There is no optimistic update: the
 * switch follows the server value.
 *
 * Every action is hidden, not disabled, when its permission key is absent
 * (D6.4). The checklist stays visible and read-only without the update key.
 */

import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Controller } from "react-hook-form"
import { toast } from "sonner"

import { useAuth } from "@/app/providers/auth-provider"
import { FormAlert } from "@/components/custom/form-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { listMasterPermissions } from "@/lib/api/modules/master-permissions"
import {
  listTenantPermissions,
  replaceTenantPermissions,
  setTenantPermissionEnabled,
} from "@/lib/api/modules/tenant-permissions"
import { useZodForm } from "@/lib/forms/zod-form"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import type { MasterPermission } from "@/types/master-permission"
import type { TenantPermission } from "@/types/tenant-permission"

import {
  describeWriteFailure,
  type WriteFailure,
} from "../create/write-failure"
import { describeReadFailure } from "../shared/failure"
import {
  TENANT_PERMISSIONS_UPDATE,
  toggleKeyFor,
} from "./access"
import {
  filterByScope,
  groupPermissions,
  sameIdSet,
  withSelection,
} from "./checklist"
import {
  tenantPermissionsFormSchema,
  type TenantPermissionsFormValues,
} from "./schema"

export function TenantPermissionsTab({
  tenantId,
}: {
  readonly tenantId: string
}) {
  const masterQuery = useQuery({
    queryKey: queryKeys.masterPermissions.all(),
    queryFn: listMasterPermissions,
  })
  const tenantQuery = useQuery({
    queryKey: queryKeys.tenantPermissions.ofTenant(tenantId),
    queryFn: () => listTenantPermissions(tenantId),
  })

  if (masterQuery.isPending || tenantQuery.isPending) {
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
  if (masterQuery.isError || tenantQuery.isError) {
    const failure = describeReadFailure(masterQuery.error ?? tenantQuery.error)
    return (
      <FormAlert message={failure.message} referenceId={failure.referenceId}>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void masterQuery.refetch()
              void tenantQuery.refetch()
            }}
          >
            Coba lagi
          </Button>
        </div>
      </FormAlert>
    )
  }
  return (
    <PermissionsChecklist
      tenantId={tenantId}
      catalogue={masterQuery.data}
      assigned={tenantQuery.data}
    />
  )
}

function PermissionsChecklist({
  tenantId,
  catalogue,
  assigned,
}: {
  readonly tenantId: string
  readonly catalogue: readonly MasterPermission[]
  readonly assigned: readonly TenantPermission[]
}) {
  const queryClient = useQueryClient()
  const { me } = useAuth()
  const granted = me?.permissions ?? []
  const canEdit = granted.includes(TENANT_PERMISSIONS_UPDATE)

  const savedIds = useMemo(
    () => assigned.map((item) => item.masterPermissionId),
    [assigned]
  )
  const savedKey = [...savedIds].sort((a, b) => a - b).join(",")
  const form = useZodForm(tenantPermissionsFormSchema, {
    masterPermissionIds: savedIds,
  })
  const { reset } = form
  // After a save the tenant list refetches. The form follows the saved set.
  useEffect(() => {
    reset({ masterPermissionIds: savedIds })
    // savedKey changes exactly when the saved set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reset, savedKey])

  const [saveFailure, setSaveFailure] = useState<WriteFailure | null>(null)
  const [toggleFailure, setToggleFailure] = useState<WriteFailure | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const selected = form.watch("masterPermissionIds")
  const dirty = !sameIdSet(selected, savedIds)
  const { isSubmitting } = form.formState
  // Only TENANT permissions are shown (REQ-FE-057). A saved PLATFORM id is not
  // shown, but it stays in `selected` and so in the PUT (full replacement).
  const groups = useMemo(
    () => groupPermissions(filterByScope(catalogue, "TENANT")),
    [catalogue]
  )
  const assignmentOf = useMemo(
    () => new Map(assigned.map((item) => [item.masterPermissionId, item])),
    [assigned]
  )

  const save = form.handleSubmit(async (values: TenantPermissionsFormValues) => {
    setSaveFailure(null)
    try {
      await replaceTenantPermissions(tenantId, {
        masterPermissionIds: values.masterPermissionIds,
      })
      await applyInvalidation(queryClient, {
        kind: "tenantPermissionsWrite",
        tenantId,
      })
      toast.success("Permission tenant disimpan")
    } catch (error) {
      setSaveFailure(describeWriteFailure(error))
    }
  })

  const toggle = async (permission: TenantPermission, next: boolean) => {
    if (togglingId !== null) return
    setToggleFailure(null)
    setTogglingId(permission.id)
    try {
      await setTenantPermissionEnabled(tenantId, permission.id, next)
      await applyInvalidation(queryClient, {
        kind: "tenantPermissionsWrite",
        tenantId,
      })
      toast.success(
        next ? "Permission diaktifkan" : "Permission dinonaktifkan"
      )
    } catch (error) {
      setToggleFailure(describeWriteFailure(error))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permissions</CardTitle>
        <p className="text-xs text-muted-foreground">
          Permission yang boleh dipakai tenant ini. Perubahan daftar berlaku
          setelah Anda menekan Simpan.
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
            message={saveFailure?.message ?? null}
            referenceId={saveFailure?.referenceId ?? null}
          />
          <FormAlert
            message={toggleFailure?.message ?? null}
            referenceId={toggleFailure?.referenceId ?? null}
          />
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada permission untuk tenant di katalog.
            </p>
          ) : (
            <Controller
              control={form.control}
              name="masterPermissionIds"
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
                      {group.items.map((item) => {
                        const assignment = assignmentOf.get(item.id)
                        const checked = field.value.includes(item.id)
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <label className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                disabled={!canEdit || isSubmitting}
                                onCheckedChange={(next) =>
                                  field.onChange(
                                    withSelection(
                                      field.value,
                                      item.id,
                                      next === true
                                    )
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
                            {assignment !== undefined && checked ? (
                              <StatusControl
                                permission={assignment}
                                granted={granted}
                                busy={togglingId !== null}
                                onToggle={(next) =>
                                  void toggle(assignment, next)
                                }
                              />
                            ) : null}
                          </div>
                        )
                      })}
                    </fieldset>
                  ))}
                </div>
              )}
            />
          )}
          {canEdit ? (
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={!dirty || isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!dirty || isSubmitting}
                onClick={() => reset({ masterPermissionIds: savedIds })}
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

/**
 * The status of one saved permission. The switch is shown only when the user
 * holds the key for the change it would make (D6.4). Otherwise a badge shows
 * the status.
 */
function StatusControl({
  permission,
  granted,
  busy,
  onToggle,
}: {
  readonly permission: TenantPermission
  readonly granted: readonly string[]
  readonly busy: boolean
  readonly onToggle: (next: boolean) => void
}) {
  const next = !permission.enabled
  if (!granted.includes(toggleKeyFor(next))) {
    return (
      <Badge variant={permission.enabled ? "default" : "outline"}>
        {permission.enabled ? "Aktif" : "Nonaktif"}
      </Badge>
    )
  }
  return (
    <Switch
      checked={permission.enabled}
      disabled={busy}
      aria-label={`Status ${permission.masterPermissionName}`}
      onCheckedChange={(value) => onToggle(value)}
    />
  )
}
