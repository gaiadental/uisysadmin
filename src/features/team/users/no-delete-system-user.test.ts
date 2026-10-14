/**
 * REQ-FE-054 (ARCH-FE-001 D6.4, D12.1): system account pages offer no "Hapus"
 * action, so nothing under `features/team/users` may import or call
 * `deleteSystemUser`, and no delete invalidation is wired. The function stays in
 * `lib/api/modules/system-users.ts`, unused by the UI.
 */

import { describe, expect, it } from "vitest"

const SELF = "/src/features/team/users/no-delete-system-user.test.ts"

const all = import.meta.glob("/src/features/team/users/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

const sources = Object.entries(all)
  .filter(([path]) => path !== SELF)
  .map(([path, text]) => ({ name: path.split("/").pop() ?? path, text }))

describe("no delete of system users (REQ-FE-054)", () => {
  it("reads the feature sources", () => {
    expect(sources.length).toBeGreaterThan(10)
    expect(sources.map((file) => file.name)).toContain("use-user-actions.ts")
  })

  it("references deleteSystemUser in no file under features/team/users", () => {
    const offenders = sources
      .filter((file) => file.text.includes("deleteSystemUser"))
      .map((file) => file.name)

    expect(offenders).toEqual([])
  })

  it("wires no delete action or delete invalidation in the action hook", () => {
    const hook = sources.find((file) => file.name === "use-user-actions.ts")

    expect(hook?.text).not.toMatch(/case "delete"/)
    expect(hook?.text).not.toMatch(/onDeleted/)
    expect(hook?.text).not.toMatch(/removeQueries/)
    expect(hook?.text).not.toMatch(/Akun dihapus/)
  })
})
