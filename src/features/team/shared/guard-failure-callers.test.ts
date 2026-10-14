import { describe, expect, it } from "vitest"

// D13.1 / REQ-FE-053 guard: the fixed-copy mapper is for Tim IT pages only.
// Tenant and catalog screens keep describeWriteFailure (server message).
const sources = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

const IMPORTS_GUARD = /from\s+["'][^"']*guard-failure["']/

describe("guard-failure.ts callers (D13.1 tenant-path guard)", () => {
  it("is imported only by user-failure.ts and role-failure.ts among non-test sources", () => {
    const importers = Object.entries(sources)
      .filter(([path]) => !/\.test\.tsx?$/.test(path))
      .filter(([path]) => !path.endsWith("/shared/guard-failure.ts"))
      .filter(([, text]) => IMPORTS_GUARD.test(text))
      .map(([path]) => path)
      .sort()

    expect(importers).toEqual([
      "/src/features/team/roles/role-failure.ts",
      "/src/features/team/users/user-failure.ts",
    ])
  })

  it("scans a non-trivial number of sources (the scan is not vacuous)", () => {
    expect(Object.keys(sources).length).toBeGreaterThan(100)
  })

  it("is not imported by tenant, catalog or shared write-failure sources", () => {
    const offenders = Object.entries(sources)
      .filter(([path]) =>
        /^\/src\/features\/(tenants|catalog)\//.test(path) ||
        path.endsWith("/tenants/create/write-failure.ts")
      )
      .filter(([, text]) => IMPORTS_GUARD.test(text))
      .map(([path]) => path)

    expect(offenders).toEqual([])
  })
})
