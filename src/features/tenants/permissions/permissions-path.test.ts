import { describe, expect, it } from "vitest"

import { permissionsPathOf, permissionsTenantIdOfPath } from "./permissions-path"

describe("permissions path", () => {
  it("builds and reads the tab path", () => {
    expect(permissionsPathOf("abc")).toBe("/tenants/abc/permissions")
    expect(permissionsTenantIdOfPath("/tenants/abc/permissions")).toBe("abc")
    expect(permissionsTenantIdOfPath("/tenants/abc/permissions/")).toBe("abc")
  })

  it("returns null for other paths", () => {
    expect(permissionsTenantIdOfPath("/tenants/abc")).toBeNull()
    expect(permissionsTenantIdOfPath("/tenants/abc/other")).toBeNull()
    expect(permissionsTenantIdOfPath("/tenants/%E0%A4%A/permissions")).toBeNull()
  })
})
