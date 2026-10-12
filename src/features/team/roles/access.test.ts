import { describe, expect, it } from "vitest"

import {
  canCountMembers,
  canCreateRole,
  canViewRoleChecklist,
  isLockedRole,
  roleActionAccess,
} from "./access"
import { countMembersByRole } from "./member-counts"
import { roleDetailPathOf, roleIdOfPath } from "./role-paths"
import { sameKeySet, withKey } from "./selection"

const OTHER = { key: "SYS_ADMIN" }
const PRINCIPAL = { key: "SYS_PRINCIPAL" }
const ALL = [
  "system_roles:view",
  "system_roles:create",
  "system_roles:update",
  "system_roles:delete",
  "master_permissions:view",
]

describe("gates per key (D6.4)", () => {
  it("create needs system_roles:create", () => {
    expect(canCreateRole(["system_roles:create"])).toBe(true)
    expect(canCreateRole(["system_roles:view"])).toBe(false)
  })

  it("edit needs system_roles:update only", () => {
    const access = roleActionAccess(["system_roles:update"], OTHER, false)

    expect(access).toMatchObject({ canEdit: true, canDelete: false })
  })

  it("delete needs system_roles:delete only", () => {
    const access = roleActionAccess(["system_roles:delete"], OTHER, false)

    expect(access).toMatchObject({ canEdit: false, canDelete: true })
  })

  it("the checklist save needs update and master_permissions:view", () => {
    expect(
      roleActionAccess(["system_roles:update"], OTHER, false)
        .canEditPermissions
    ).toBe(false)
    expect(
      roleActionAccess(["master_permissions:view"], OTHER, false)
        .canEditPermissions
    ).toBe(false)
    expect(roleActionAccess(ALL, OTHER, false).canEditPermissions).toBe(true)
  })

  it("the checklist tab needs system_roles:view and master_permissions:view", () => {
    expect(canViewRoleChecklist(["system_roles:view"])).toBe(false)
    expect(canViewRoleChecklist(["master_permissions:view"])).toBe(false)
    expect(canViewRoleChecklist(ALL)).toBe(true)
  })

  it("member counts need system_users:view", () => {
    expect(canCountMembers(["system_users:view"])).toBe(true)
    expect(canCountMembers(ALL)).toBe(false)
  })
})

describe("static lock and refusal (D6.6)", () => {
  it("locks SYS_PRINCIPAL even with every permission", () => {
    const access = roleActionAccess(ALL, PRINCIPAL, false)

    expect(isLockedRole(PRINCIPAL)).toBe(true)
    expect(access).toMatchObject({
      locked: true,
      canEdit: false,
      canDelete: false,
      canEditPermissions: false,
    })
  })

  it("does not lock another role, and the key match is exact", () => {
    expect(isLockedRole(OTHER)).toBe(false)
    expect(isLockedRole({ key: "sys_principal" })).toBe(false)
  })

  it("marks a refused role, keeping the buttons for the caller to disable", () => {
    const access = roleActionAccess(ALL, OTHER, true)

    expect(access).toMatchObject({ refused: true, canEdit: true, canDelete: true })
  })

  it("does not report refused for the locked role", () => {
    expect(roleActionAccess(ALL, PRINCIPAL, true).refused).toBe(false)
  })
})

describe("countMembersByRole", () => {
  it("counts users per role id", () => {
    const counts = countMembersByRole([
      { systemRoleId: 1 },
      { systemRoleId: 2 },
      { systemRoleId: 2 },
    ])

    expect(counts.get(1)).toBe(1)
    expect(counts.get(2)).toBe(2)
    expect(counts.get(3)).toBeUndefined()
  })

  it("returns an empty map for no users", () => {
    expect(countMembersByRole([]).size).toBe(0)
  })
})

describe("role paths", () => {
  it("round-trips an id", () => {
    expect(roleIdOfPath(roleDetailPathOf(12))).toBe(12)
    expect(roleIdOfPath("/system-roles/12/")).toBe(12)
  })

  it.each(["/system-roles", "/system-roles/abc", "/system-roles/1/x", "/system-users/1"])(
    "returns null for %s",
    (path) => {
      expect(roleIdOfPath(path)).toBeNull()
    }
  )
})

describe("selection helpers", () => {
  it("withKey adds once and removes", () => {
    expect(withKey(["a"], "b", true)).toEqual(["a", "b"])
    expect(withKey(["a", "b"], "b", true)).toEqual(["a", "b"])
    expect(withKey(["a", "b"], "a", false)).toEqual(["b"])
  })

  it("sameKeySet ignores order", () => {
    expect(sameKeySet(["a", "b"], ["b", "a"])).toBe(true)
    expect(sameKeySet(["a"], ["a", "b"])).toBe(false)
    expect(sameKeySet([], [])).toBe(true)
  })
})
