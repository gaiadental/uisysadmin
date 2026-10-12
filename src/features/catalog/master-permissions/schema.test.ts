import { describe, expect, it } from "vitest"

import {
  PERMISSION_CATEGORY_MAX,
  PERMISSION_KEY_MAX,
  PERMISSION_MODULE_MAX,
  PERMISSION_NAME_MAX,
  permissionCreateSchema,
} from "./schema"

const VALID = {
  key: "reports:view",
  name: "View reports",
  description: "",
  category: "REPORT",
  module: "reporting",
  active: true,
  customerPermitted: false,
}

function messageFor(overrides: Record<string, unknown>, field: string) {
  const result = permissionCreateSchema.safeParse({ ...VALID, ...overrides })
  if (result.success) return null
  return result.error.issues.find((issue) => issue.path[0] === field)?.message ?? null
}

describe("permissionCreateSchema limits (FE doc 5.3)", () => {
  it("declares the contract limits", () => {
    expect([
      PERMISSION_KEY_MAX,
      PERMISSION_NAME_MAX,
      PERMISSION_CATEGORY_MAX,
      PERMISSION_MODULE_MAX,
    ]).toEqual([100, 100, 50, 50])
  })

  it("accepts a valid value and trims text", () => {
    const result = permissionCreateSchema.safeParse({
      ...VALID,
      key: "  reports:view  ",
      description: "  note  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.key).toBe("reports:view")
      expect(result.data.description).toBe("note")
    }
  })

  it.each([
    ["key", 100],
    ["name", 100],
    ["category", 50],
    ["module", 50],
  ])("accepts %s at exactly %i characters and rejects one more", (field, max) => {
    expect(messageFor({ [field]: "a".repeat(max) }, field)).toBeNull()
    expect(messageFor({ [field]: "a".repeat(max + 1) }, field)).toMatch(
      new RegExp(`${max} karakter`)
    )
  })

  it.each([
    ["key", "Key wajib diisi."],
    ["name", "Nama wajib diisi."],
    ["category", "Kategori wajib diisi."],
    ["module", "Modul wajib diisi."],
  ])("rejects empty and whitespace-only %s", (field, message) => {
    expect(messageFor({ [field]: "" }, field)).toBe(message)
    expect(messageFor({ [field]: "   " }, field)).toBe(message)
  })

  it("measures length after trimming", () => {
    expect(messageFor({ name: ` ${"a".repeat(100)} ` }, "name")).toBeNull()
  })

  it("allows an empty description", () => {
    expect(messageFor({ description: "" }, "description")).toBeNull()
  })

  it("rejects non-boolean flags", () => {
    expect(messageFor({ active: "yes" }, "active")).not.toBeNull()
    expect(messageFor({ customerPermitted: undefined }, "customerPermitted")).not.toBeNull()
  })
})
