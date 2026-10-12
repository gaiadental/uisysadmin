import { describe, expect, it } from "vitest"

import { detailPathOf, tenantIdOfPath } from "./tenant-paths"

describe("tenant paths", () => {
  it("builds and reads the detail path", () => {
    expect(detailPathOf("abc-1")).toBe("/tenants/abc-1")
    expect(tenantIdOfPath("/tenants/abc-1")).toBe("abc-1")
    expect(tenantIdOfPath("/tenants/abc-1/")).toBe("abc-1")
  })

  it("encodes and decodes an unusual id", () => {
    expect(detailPathOf("a b/c")).toBe("/tenants/a%20b%2Fc")
    expect(tenantIdOfPath("/tenants/a%20b%2Fc")).toBe("a b/c")
  })

  it("returns null for other paths and bad encoding", () => {
    expect(tenantIdOfPath("/tenants")).toBeNull()
    expect(tenantIdOfPath("/tenants/a/b")).toBeNull()
    expect(tenantIdOfPath("/tenants/%E0%A4%A")).toBeNull()
  })
})
