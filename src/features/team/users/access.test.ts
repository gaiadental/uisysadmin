import { describe, expect, it } from "vitest"

import type { SystemUser } from "@/types/system-user"

import {
  OTHER_ACCOUNT_SESSIONS_ENABLED,
  canCreateUser,
  canForceLogout,
  canViewUserSessions,
  hasAnyUserAction,
  userActionAccess,
} from "./access"

const SELF_ID = "self-id"
const ALL = [
  "system_users:view",
  "system_users:create",
  "system_users:update",
  "system_users:delete",
  "system_users:reset_password",
  "system_roles:view",
  "sessions:view",
  "sessions:revoke",
]

function user(overrides: Partial<SystemUser> = {}): SystemUser {
  return {
    id: "other-id",
    loginId: "ops@gaia.com",
    systemRoleId: 2,
    systemRoleKey: "SYS_ADMIN",
    status: "ACTIVE",
    createdAt: "2026-10-01T03:00:00Z",
    updatedAt: "2026-10-01T03:00:00Z",
    ...overrides,
  }
}

describe("userActionAccess", () => {
  it("has no delete capability, even with system_users:delete (REQ-FE-054)", () => {
    expect(userActionAccess(ALL, SELF_ID, user())).not.toHaveProperty(
      "canDelete"
    )
  })

  it("offers every action on another active user with all permissions", () => {
    expect(userActionAccess(ALL, SELF_ID, user())).toEqual({
      isSelf: false,
      canChangeRole: true,
      canSuspend: true,
      canDeactivate: true,
      canReactivate: false,
      canResetPassword: true,
    })
  })

  it("offers no suspend, deactivate or role change on the own account", () => {
    const access = userActionAccess(ALL, SELF_ID, user({ id: SELF_ID }))

    expect(access.isSelf).toBe(true)
    expect(access.canSuspend).toBe(false)
    expect(access.canDeactivate).toBe(false)
    expect(access.canChangeRole).toBe(false)
  })

  it("does not treat a user as self when the signed-in id is unknown", () => {
    expect(userActionAccess(ALL, null, user({ id: SELF_ID })).isSelf).toBe(
      false
    )
  })

  it("needs system_roles:view for a role change", () => {
    const perms = ALL.filter((key) => key !== "system_roles:view")
    expect(userActionAccess(perms, SELF_ID, user()).canChangeRole).toBe(false)
  })

  it("needs system_users:update for role and status actions", () => {
    const perms = ALL.filter((key) => key !== "system_users:update")
    const access = userActionAccess(
      perms,
      SELF_ID,
      user({ status: "SUSPENDED" })
    )

    expect(access.canChangeRole).toBe(false)
    expect(access.canSuspend).toBe(false)
    expect(access.canDeactivate).toBe(false)
    expect(access.canReactivate).toBe(false)
  })

  it("needs system_users:reset_password for a password reset", () => {
    const perms = ALL.filter((key) => key !== "system_users:reset_password")
    const access = userActionAccess(perms, SELF_ID, user())

    expect(access.canResetPassword).toBe(false)
  })

  it.each([
    ["ACTIVE", { suspend: true, deactivate: true, reactivate: false }],
    ["SUSPENDED", { suspend: false, deactivate: true, reactivate: true }],
    ["DEACTIVATED", { suspend: false, deactivate: false, reactivate: true }],
  ] as const)("offers the status actions for %s", (status, expected) => {
    const access = userActionAccess(ALL, SELF_ID, user({ status }))

    expect(access.canSuspend).toBe(expected.suspend)
    expect(access.canDeactivate).toBe(expected.deactivate)
    expect(access.canReactivate).toBe(expected.reactivate)
  })

  it("reports whether any action shows", () => {
    expect(hasAnyUserAction(userActionAccess(ALL, SELF_ID, user()))).toBe(true)
    expect(
      hasAnyUserAction(userActionAccess(["system_users:view"], SELF_ID, user()))
    ).toBe(false)
  })
})

describe("canCreateUser", () => {
  it("needs create and the role list", () => {
    expect(canCreateUser(ALL)).toBe(true)
    expect(canCreateUser(["system_users:create"])).toBe(false)
    expect(canCreateUser(["system_roles:view"])).toBe(false)
  })
})

describe("session gates (D4.10, suspended by REQ-FE-052)", () => {
  it("keeps the flag off until SP-BG-14 is closed", () => {
    expect(OTHER_ACCOUNT_SESSIONS_ENABLED).toBe(false)
  })

  it("never shows the tab while the flag is off, even with sessions:view", () => {
    expect(canViewUserSessions(["sessions:view"])).toBe(false)
    expect(canViewUserSessions(ALL)).toBe(false)
    expect(canViewUserSessions(["sessions:revoke"])).toBe(false)
  })

  it("never allows force logout while the flag is off", () => {
    expect(canForceLogout(["sessions:revoke"], false)).toBe(false)
    expect(canForceLogout(ALL, false)).toBe(false)
    expect(canForceLogout(["sessions:revoke"], true)).toBe(false)
    expect(canForceLogout(["sessions:view"], false)).toBe(false)
  })
})
