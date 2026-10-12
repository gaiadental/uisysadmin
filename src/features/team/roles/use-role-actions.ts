/**
 * The confirmed delete of a system role (REQ-FE-039; ARCH-FE-001 D6.4, D6.6,
 * D12.1). One delete runs at a time; the in-flight guard is a ref, so a double
 * click cannot send two requests. A protected-role refusal marks the role as
 * refused (edit and delete are then shown disabled) and shows the server
 * message. Success invalidates the role keys through the D12.1 map.
 */

import { useCallback, useRef, useState } from "react"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useDialogs } from "@/components/dialogs/dialogs"
import type { WriteFailure } from "@/features/tenants/create/write-failure"
import { deleteSystemRole } from "@/lib/api/modules/system-roles"
import { listSystemUsers } from "@/lib/api/modules/system-users"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import type { SystemRole } from "@/types/system-role"

import { countMembersByRole } from "./member-counts"
import { describeRoleWriteFailure, isRoleRefusal } from "./role-failure"
import { useRefusedRoles } from "./refused-roles"

interface UseRoleActionsOptions {
  /** Called after a successful delete, with the deleted role. */
  readonly onDeleted?: (role: SystemRole) => void
}

export interface RoleActions {
  readonly remove: (role: SystemRole) => Promise<void>
  /** The id of the role being deleted, or null. */
  readonly pendingId: number | null
  readonly failure: WriteFailure | null
  readonly clearFailure: () => void
}

/**
 * How many accounts still use the role. The user list is read fresh, because
 * a stale count would understate the damage. Without `system_users:view` or
 * on a failed read the count is unknown (null) and the dialog says to check.
 */
async function countAccountsUsing(
  queryClient: QueryClient,
  role: SystemRole
): Promise<number | null> {
  try {
    const users = await queryClient.fetchQuery({
      queryKey: queryKeys.systemUsers.all(),
      queryFn: listSystemUsers,
      staleTime: 0,
    })
    return countMembersByRole(users).get(role.id) ?? 0
  } catch {
    return null
  }
}

export function accountImpact(count: number | null): string {
  if (count === null) {
    return "Cek dulu di daftar user apakah masih ada akun yang memakai peran ini."
  }
  if (count === 0) return "Tidak ada akun yang memakai peran ini."
  return `${count} akun masih memakai peran ini. Akun itu akan ditandai "Peran tidak aktif" dan perlu diberi peran baru.`
}

export function useRoleActions(
  options: UseRoleActionsOptions = {}
): RoleActions {
  const { onDeleted } = options
  const queryClient = useQueryClient()
  const { confirm } = useDialogs()
  const { markRefused } = useRefusedRoles()
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [failure, setFailure] = useState<WriteFailure | null>(null)
  const inFlight = useRef(false)

  const remove = useCallback(
    async (role: SystemRole) => {
      if (inFlight.current) return
      setFailure(null)
      const accounts = await countAccountsUsing(queryClient, role)
      const confirmed = await confirm({
        title: `Hapus peran ${role.name}?`,
        description: "Peran akan dihapus dari platform.",
        impact: [
          accountImpact(accounts),
          "Tindakan ini tidak bisa dibatalkan.",
        ],
        confirmLabel: "Hapus",
        tone: "destructive",
        permanent: true,
      })
      if (!confirmed || inFlight.current) return
      inFlight.current = true
      setPendingId(role.id)
      try {
        await deleteSystemRole(role.id)
        toast.success("Peran dihapus.")
        // Leave the detail page first, then drop its queries, so they never refetch (they would answer 404).
        onDeleted?.(role)
        queryClient.removeQueries({
          queryKey: queryKeys.systemRoles.detail(role.id),
        })
        queryClient.removeQueries({
          queryKey: queryKeys.rolePermissions.ofRole(role.id),
        })
        await applyInvalidation(queryClient, {
          kind: "systemRoleWrite",
          roleId: role.id,
        })
      } catch (error) {
        if (isRoleRefusal(error)) markRefused(role.id)
        setFailure(describeRoleWriteFailure(error))
      } finally {
        inFlight.current = false
        setPendingId(null)
      }
    },
    [confirm, markRefused, onDeleted, queryClient]
  )

  const clearFailure = useCallback(() => setFailure(null), [])
  return { remove, pendingId, failure, clearFailure }
}
