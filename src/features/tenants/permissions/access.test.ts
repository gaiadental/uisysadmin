import { describe, expect, it } from "vitest"

import { evaluateGates } from "@/lib/access/gates"
import { FIXTURE_ME } from "@/test/handlers/auth"
import type { Me } from "@/types/auth"

import {
  TENANT_PERMISSIONS_ACCESS,
  canViewTenantPermissions,
  toggleKeyFor,
} from "./access"

function meWith(role: string, permissions: readonly string[]): Me {
  return { ...FIXTURE_ME, role, permissions: [...permissions], branches: [] }
}

function decide(me: Me) {
  if (TENANT_PERMISSIONS_ACCESS.kind !== "session") throw new Error("session")
  return evaluateGates(TENANT_PERMISSIONS_ACCESS.gates, {
    status: "authenticated",
    me,
  })
}

describe("tenant permissions route access (D6.4, D7)", () => {
  const both = ["tenant_permissions:view", "master_permissions:view"]

  it("allows SYS_PRINCIPAL with both view keys", () => {
    expect(decide(meWith("SYS_PRINCIPAL", both))).toBe("ALLOW")
  })

  it("denies SYS_PRINCIPAL missing either view key", () => {
    expect(decide(meWith("SYS_PRINCIPAL", [both[0] ?? ""]))).toBe("FORBIDDEN")
    expect(decide(meWith("SYS_PRINCIPAL", [both[1] ?? ""]))).toBe("FORBIDDEN")
  })

  it("denies another role even with both keys", () => {
    expect(decide(meWith("SYS_ADMIN", both))).toBe("FORBIDDEN")
  })
})

describe("helpers", () => {
  it("canViewTenantPermissions needs both keys", () => {
    expect(canViewTenantPermissions(["tenant_permissions:view"])).toBe(false)
    expect(
      canViewTenantPermissions([
        "tenant_permissions:view",
        "master_permissions:view",
      ])
    ).toBe(true)
  })

  it("toggleKeyFor maps on to activate and off to deactivate", () => {
    expect(toggleKeyFor(true)).toBe("tenant_permissions:activate")
    expect(toggleKeyFor(false)).toBe("tenant_permissions:deactivate")
  })
})
