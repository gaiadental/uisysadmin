import { describe, expect, it } from "vitest"

import type { AuthStatus } from "@/app/providers/auth-provider"
import type { Me } from "@/types/auth"

import {
  authenticated,
  evaluateGates,
  hasPermissions,
  hasRole,
  passwordChanged,
  type AccessGate,
  type GateContext,
} from "./gates"
import { SYS_PRINCIPAL } from "./roles"

const ME: Me = {
  userId: "usr-001",
  loginId: "principal@example.com",
  userType: "SYSTEM",
  context: "SYSTEM",
  role: SYS_PRINCIPAL,
  permissions: ["system_users:view", "system_roles:view"],
  tenant: null,
  branches: [],
  pwdChangeRequired: false,
}

function context(status: AuthStatus, me: Me | null): GateContext {
  return { status, me }
}

describe("authenticated gate (D6.1)", () => {
  it.each<[AuthStatus, string]>([
    ["authenticated", "ALLOW"],
    ["passwordChangeRequired", "ALLOW"],
    ["anonymous", "LOGIN"],
    ["unknown", "LOGIN"],
    ["error", "LOGIN"],
  ])("status %s gives %s", (status, expected) => {
    expect(authenticated().evaluate(context(status, ME))).toBe(expected)
  })
})

describe("passwordChanged gate (D6.1)", () => {
  it("allows when no change is required", () => {
    expect(passwordChanged().evaluate(context("authenticated", ME))).toBe(
      "ALLOW"
    )
  })

  it("denies with PASSWORD_CHANGE when a change is required", () => {
    const me = { ...ME, pwdChangeRequired: true }
    expect(
      passwordChanged().evaluate(context("passwordChangeRequired", me))
    ).toBe("PASSWORD_CHANGE")
  })

  it("fails closed to LOGIN without a loaded me", () => {
    expect(passwordChanged().evaluate(context("anonymous", null))).toBe("LOGIN")
  })
})

describe("hasPermissions gate (D6.1)", () => {
  it.each<[readonly string[], string]>([
    [["system_users:view"], "ALLOW"],
    [["system_users:view", "system_roles:view"], "ALLOW"],
    [["system_users:view", "sessions:revoke"], "FORBIDDEN"],
    [["sessions:revoke"], "FORBIDDEN"],
    [[], "ALLOW"],
  ])("required keys %j give %s", (keys, expected) => {
    expect(hasPermissions(keys).evaluate(context("authenticated", ME))).toBe(
      expected
    )
  })

  it("fails closed to LOGIN without a loaded me", () => {
    expect(
      hasPermissions(["system_users:view"]).evaluate(context("anonymous", null))
    ).toBe("LOGIN")
  })
})

describe("hasRole gate (D6.2)", () => {
  it("allows the matching role", () => {
    expect(hasRole(SYS_PRINCIPAL).evaluate(context("authenticated", ME))).toBe(
      "ALLOW"
    )
  })

  it("denies another system role with FORBIDDEN", () => {
    const admin = { ...ME, role: "SYS_ADMIN" }
    expect(
      hasRole(SYS_PRINCIPAL).evaluate(context("authenticated", admin))
    ).toBe("FORBIDDEN")
  })

  it("fails closed to LOGIN without a loaded me", () => {
    expect(hasRole(SYS_PRINCIPAL).evaluate(context("anonymous", null))).toBe(
      "LOGIN"
    )
  })
})

describe("AND combinations (D6.1)", () => {
  const base: AccessGate[] = [authenticated(), passwordChanged()]

  it.each<[string, readonly AccessGate[], AuthStatus, Me | null, string]>([
    ["no gates allow any state", [], "anonymous", null, "ALLOW"],
    ["session with no change pending", base, "authenticated", ME, "ALLOW"],
    ["anonymous stops at Authenticated", base, "anonymous", null, "LOGIN"],
    [
      "change pending gives PASSWORD_CHANGE",
      base,
      "authenticated",
      { ...ME, pwdChangeRequired: true },
      "PASSWORD_CHANGE",
    ],
    [
      "forced-change status gives PASSWORD_CHANGE",
      base,
      "passwordChangeRequired",
      { ...ME, pwdChangeRequired: true },
      "PASSWORD_CHANGE",
    ],
    [
      "exempt route (Authenticated only) allows a forced-change status",
      [authenticated()],
      "passwordChangeRequired",
      { ...ME, pwdChangeRequired: true },
      "ALLOW",
    ],
    [
      "permission present and role matches",
      [...base, hasPermissions(["system_users:view"]), hasRole(SYS_PRINCIPAL)],
      "authenticated",
      ME,
      "ALLOW",
    ],
    [
      "role mismatch gives FORBIDDEN",
      [...base, hasRole(SYS_PRINCIPAL)],
      "authenticated",
      { ...ME, role: "SYS_SUPPORT" },
      "FORBIDDEN",
    ],
    [
      "missing permission gives FORBIDDEN",
      [...base, hasPermissions(["sessions:revoke"])],
      "authenticated",
      ME,
      "FORBIDDEN",
    ],
    [
      "anonymous with a missing permission gives LOGIN, not FORBIDDEN",
      [...base, hasPermissions(["sessions:revoke"])],
      "anonymous",
      null,
      "LOGIN",
    ],
    [
      "first deny wins: FORBIDDEN before PASSWORD_CHANGE",
      [hasPermissions(["sessions:revoke"]), passwordChanged()],
      "authenticated",
      { ...ME, pwdChangeRequired: true },
      "FORBIDDEN",
    ],
  ])("%s", (_name, gates, status, me, expected) => {
    expect(evaluateGates(gates, context(status, me))).toBe(expected)
  })
})
