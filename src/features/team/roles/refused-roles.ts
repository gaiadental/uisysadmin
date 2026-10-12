/**
 * Roles the backend refused to change in this session (ARCH-FE-001 D6.6). The
 * set is held in the server-state cache under a local key, memory only. Logout
 * clears the whole cache (D12.2), so the set is cleared on logout without a
 * second mechanism. The key does not share a prefix with any D12.1 family, so
 * no mutation invalidates it.
 */

import { useCallback, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export const REFUSED_ROLES_KEY = ["system", "roleRefusals"] as const

const NONE: readonly number[] = []

export interface RefusedRoles {
  readonly isRefused: (roleId: number) => boolean
  readonly markRefused: (roleId: number) => void
}

export function useRefusedRoles(): RefusedRoles {
  const queryClient = useQueryClient()
  // Never fetches: the data is only written by `markRefused`.
  const query = useQuery<readonly number[]>({
    queryKey: REFUSED_ROLES_KEY,
    queryFn: () => Promise.resolve(NONE),
    enabled: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const ids = query.data ?? NONE
  const refused = useMemo(() => new Set(ids), [ids])

  const isRefused = useCallback((roleId: number) => refused.has(roleId), [refused])
  const markRefused = useCallback(
    (roleId: number) => {
      queryClient.setQueryData<readonly number[]>(
        REFUSED_ROLES_KEY,
        (current) => {
          const list = current ?? NONE
          return list.includes(roleId) ? list : [...list, roleId]
        }
      )
    },
    [queryClient]
  )
  return { isRefused, markRefused }
}
