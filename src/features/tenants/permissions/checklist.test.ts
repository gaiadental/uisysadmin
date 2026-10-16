import { describe, expect, it } from "vitest"

import type { MasterPermission } from "@/types/master-permission"

import {
  filterByScope,
  groupPermissions,
  sameIdSet,
  withSelection,
} from "./checklist"

function permission(
  id: number,
  key: string,
  module: string,
  category: string,
  scope: MasterPermission["scope"] = "TENANT"
): MasterPermission {
  return {
    id,
    key,
    name: key,
    category,
    module,
    scope,
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

describe("filterByScope (REQ-FE-057)", () => {
  const catalogue = [
    permission(1, "system_users:view", "auth", "system_users", "PLATFORM"),
    permission(2, "appointment:view", "clinic", "appointment", "TENANT"),
    permission(3, "tenants:view", "tenant", "tenants", "PLATFORM"),
    permission(4, "profile:view", "clinic", "profile", "TENANT"),
  ]

  it("keeps only the given scope and the catalogue order", () => {
    expect(
      filterByScope(catalogue, "PLATFORM").map((item) => item.id)
    ).toEqual([1, 3])
    expect(filterByScope(catalogue, "TENANT").map((item) => item.id)).toEqual([
      2, 4,
    ])
  })

  it("returns an empty list when no permission has the scope", () => {
    expect(filterByScope([catalogue[1]!], "PLATFORM")).toEqual([])
    expect(filterByScope([], "TENANT")).toEqual([])
  })

  it("does not change the input list", () => {
    const before = catalogue.map((item) => item.id)
    filterByScope(catalogue, "PLATFORM")
    expect(catalogue.map((item) => item.id)).toEqual(before)
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
