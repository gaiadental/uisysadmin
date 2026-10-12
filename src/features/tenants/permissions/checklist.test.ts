import { describe, expect, it } from "vitest"

import type { MasterPermission } from "@/types/master-permission"

import { groupPermissions, sameIdSet, withSelection } from "./checklist"

function permission(
  id: number,
  key: string,
  module: string,
  category: string
): MasterPermission {
  return {
    id,
    key,
    name: key,
    category,
    module,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
  }
}

describe("groupPermissions", () => {
  it("groups by module then category and sorts groups and items", () => {
    const groups = groupPermissions([
      permission(3, "b:view", "tenant", "b"),
      permission(1, "z:view", "auth", "z"),
      permission(2, "a:view", "auth", "z"),
      permission(4, "a:edit", "auth", "a"),
    ])

    expect(groups.map((g) => `${g.module}/${g.category}`)).toEqual([
      "auth/a",
      "auth/z",
      "tenant/b",
    ])
    expect(groups[1]?.items.map((item) => item.key)).toEqual([
      "a:view",
      "z:view",
    ])
  })

  it("returns no groups for an empty catalogue", () => {
    expect(groupPermissions([])).toEqual([])
  })
})

describe("withSelection", () => {
  it("adds an id once", () => {
    expect(withSelection([1], 2, true)).toEqual([1, 2])
    expect(withSelection([1, 2], 2, true)).toEqual([1, 2])
  })

  it("removes an id", () => {
    expect(withSelection([1, 2], 1, false)).toEqual([2])
  })
})

describe("sameIdSet", () => {
  it("ignores order", () => {
    expect(sameIdSet([1, 2], [2, 1])).toBe(true)
  })

  it("detects a different member or length", () => {
    expect(sameIdSet([1, 2], [1, 3])).toBe(false)
    expect(sameIdSet([1], [1, 2])).toBe(false)
  })
})
