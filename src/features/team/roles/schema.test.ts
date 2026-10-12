import { describe, expect, it } from "vitest"

import {
  ROLE_KEY_MAX,
  ROLE_NAME_MAX,
  rolePermissionsFormSchema,
  roleFormSchema,
} from "./schema"

const VALID = { key: "OPS_ADMIN", name: "Ops Admin", description: "", active: true }

describe("roleFormSchema (FE doc 5.2 SystemRoleRequest)", () => {
  it("accepts a valid role and trims text", () => {
    const result = roleFormSchema.parse({
      ...VALID,
      key: "  OPS_ADMIN ",
      name: " Ops Admin ",
      description: " x ",
    })

    expect(result).toEqual({
      key: "OPS_ADMIN",
      name: "Ops Admin",
      description: "x",
      active: true,
    })
  })

  it.each([
    ["key", "Key wajib diisi."],
    ["name", "Nama wajib diisi."],
  ])("requires %s", (field, message) => {
    const result = roleFormSchema.safeParse({ ...VALID, [field]: "   " })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(message)
  })

  it("allows a key and a name of exactly the maximum length", () => {
    const result = roleFormSchema.safeParse({
      ...VALID,
      key: "K".repeat(ROLE_KEY_MAX),
      name: "N".repeat(ROLE_NAME_MAX),
    })

    expect(result.success).toBe(true)
  })

  it("rejects a key longer than 100 and a name longer than 100", () => {
    const key = roleFormSchema.safeParse({ ...VALID, key: "K".repeat(101) })
    const name = roleFormSchema.safeParse({ ...VALID, name: "N".repeat(101) })

    expect(key.error?.issues[0]?.message).toBe("Key paling banyak 100 karakter.")
    expect(name.error?.issues[0]?.message).toBe("Nama paling banyak 100 karakter.")
  })

  it("allows an empty description and requires a boolean active", () => {
    expect(roleFormSchema.safeParse(VALID).success).toBe(true)
    expect(
      roleFormSchema.safeParse({ ...VALID, active: "yes" }).success
    ).toBe(false)
  })
})

describe("rolePermissionsFormSchema", () => {
  it("accepts a list of keys, including an empty one", () => {
    expect(
      rolePermissionsFormSchema.parse({ permissionKeys: ["a:view"] })
    ).toEqual({ permissionKeys: ["a:view"] })
    expect(
      rolePermissionsFormSchema.safeParse({ permissionKeys: [] }).success
    ).toBe(true)
  })

  it("rejects ids (numbers) instead of keys", () => {
    expect(
      rolePermissionsFormSchema.safeParse({ permissionKeys: [1] }).success
    ).toBe(false)
  })
})
