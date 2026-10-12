import { describe, expect, it } from "vitest"

import { USER_LIST_PATH, userDetailPathOf, userIdOfPath } from "./user-paths"

describe("user paths", () => {
  it("builds and reads a detail path", () => {
    expect(USER_LIST_PATH).toBe("/system-users")
    expect(userDetailPathOf("abc")).toBe("/system-users/abc")
    expect(userIdOfPath("/system-users/abc")).toBe("abc")
    expect(userIdOfPath("/system-users/abc/")).toBe("abc")
  })

  it("encodes and decodes an id", () => {
    expect(userDetailPathOf("a b/c")).toBe("/system-users/a%20b%2Fc")
    expect(userIdOfPath("/system-users/a%20b%2Fc")).toBe("a b/c")
  })

  it("returns null for other paths and bad encoding", () => {
    expect(userIdOfPath("/system-users")).toBeNull()
    expect(userIdOfPath("/system-roles/1")).toBeNull()
    expect(userIdOfPath("/system-users/a/b")).toBeNull()
    expect(userIdOfPath("/system-users/%E0%A4%A")).toBeNull()
  })
})
