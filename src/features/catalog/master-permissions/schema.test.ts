import { describe, expect, it } from "vitest"

import { PERMISSION_NAME_MAX, permissionEditSchema } from "./schema"

const VALID = { name: "View reports", description: "" }

function messageFor(overrides: Record<string, unknown>, field: string) {
  const result = permissionEditSchema.safeParse({ ...VALID, ...overrides })
  if (result.success) return null
  return (
    result.error.issues.find((issue) => issue.path[0] === field)?.message ??
    null
  )
}

describe("permissionEditSchema (FE doc 5.3, TODO-021)", () => {
  it("declares the contract limit", () => {
    expect(PERMISSION_NAME_MAX).toBe(100)
  })

  it("accepts a valid value and trims text", () => {
    const result = permissionEditSchema.safeParse({
      name: "  View  ",
      description: "  note  ",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ name: "View", description: "note" })
    }
  })

  it("accepts name at exactly 100 characters and rejects one more", () => {
    expect(messageFor({ name: "a".repeat(100) }, "name")).toBeNull()
    expect(messageFor({ name: "a".repeat(101) }, "name")).toMatch(
      /100 karakter/
    )
  })

  it("rejects empty and whitespace-only name", () => {
    expect(messageFor({ name: "" }, "name")).toBe("Nama wajib diisi.")
    expect(messageFor({ name: "   " }, "name")).toBe("Nama wajib diisi.")
  })

  it("measures length after trimming", () => {
    expect(messageFor({ name: ` ${"a".repeat(100)} ` }, "name")).toBeNull()
  })

  it("allows an empty description", () => {
    expect(messageFor({ description: "" }, "description")).toBeNull()
  })

  it("drops fields that are not editable", () => {
    const result = permissionEditSchema.safeParse({
      ...VALID,
      key: "x:y",
      active: false,
    })
    expect(result.success && Object.keys(result.data).sort()).toEqual([
      "description",
      "name",
    ])
  })
})
