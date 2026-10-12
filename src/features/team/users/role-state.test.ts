import { describe, expect, it } from "vitest"

import type { SystemRole } from "@/types/system-role"

import { isRoleInactive } from "./role-state"

const STAMP = "2026-10-01T03:00:00Z"
const role = (id: number, active?: boolean): SystemRole => ({
  id,
  key: `ROLE_${id}`,
  name: `Role ${id}`,
  createdAt: STAMP,
  updatedAt: STAMP,
  ...(active === undefined ? {} : { active }),
})

describe("isRoleInactive", () => {
  it("is false while the role list is unknown", () => {
    expect(isRoleInactive(undefined, { systemRoleId: 5 })).toBe(false)
  })

  it("is false when the role is listed and active or unmarked", () => {
    expect(isRoleInactive([role(5)], { systemRoleId: 5 })).toBe(false)
    expect(isRoleInactive([role(5, true)], { systemRoleId: 5 })).toBe(false)
  })

  it("is true when the role is missing from the list", () => {
    expect(isRoleInactive([role(1)], { systemRoleId: 5 })).toBe(true)
  })

  it("is true when the role is listed as inactive", () => {
    expect(isRoleInactive([role(5, false)], { systemRoleId: 5 })).toBe(true)
  })
})
