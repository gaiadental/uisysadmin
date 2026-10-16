/**
 * Pure helpers of the permission checklist (FE doc 5.2 and 5.4): grouping by
 * module then category, toggling one id and comparing two selections.
 */

import type {
  MasterPermission,
  PermissionScope,
} from "@/types/master-permission"

export interface PermissionGroup {
  readonly module: string
  readonly category: string
  readonly items: readonly MasterPermission[]
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "en")
}

/**
 * Keeps the permissions of one scope, in the input order (REQ-FE-057). A pure
 * display filter: the input is not changed and nothing is removed from a
 * saved selection by it.
 */
export function filterByScope(
  catalogue: readonly MasterPermission[],
  scope: PermissionScope
): MasterPermission[] {
  return catalogue.filter((permission) => permission.scope === scope)
}

/** Groups by module, then category. Groups and items are sorted, so the order is stable. */
export function groupPermissions(
  permissions: readonly MasterPermission[]
): readonly PermissionGroup[] {
  const groups = new Map<string, MasterPermission[]>()
  for (const permission of permissions) {
    const groupKey = `${permission.module}\u0000${permission.category}`
    const bucket = groups.get(groupKey)
    if (bucket === undefined) groups.set(groupKey, [permission])
    else bucket.push(permission)
  }
  return [...groups.values()]
    .map((items) => {
      const first = items[0]
      return {
        module: first?.module ?? "",
        category: first?.category ?? "",
        items: [...items].sort((a, b) => compareText(a.key, b.key)),
      }
    })
    .sort(
      (a, b) =>
        compareText(a.module, b.module) || compareText(a.category, b.category)
    )
}

/** Adds or removes one id. The result has no duplicates and keeps the input order. */
export function withSelection(
  ids: readonly number[],
  id: number,
  checked: boolean
): number[] {
  const rest = ids.filter((candidate) => candidate !== id)
  return checked ? [...rest, id] : rest
}

/** True when both lists hold the same ids, in any order. */
export function sameIdSet(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return set.size === new Set(b).size && b.every((id) => set.has(id))
}
