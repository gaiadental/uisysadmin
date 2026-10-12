import { describe, expect, it } from "vitest"

import {
  CATEGORY_CODE_MAX,
  CATEGORY_NAME_MAX,
  categoryCreateSchema,
  categoryEditSchema,
} from "./schema"

describe("categoryCreateSchema", () => {
  const valid = { code: "DENTAL", name: "Dental Clinic", description: "" }

  it("accepts a valid value and trims the text", () => {
    const parsed = categoryCreateSchema.parse({
      code: "  DENTAL ",
      name: " Dental Clinic ",
      description: "  Klinik gigi ",
    })
    expect(parsed).toEqual({
      code: "DENTAL",
      name: "Dental Clinic",
      description: "Klinik gigi",
    })
  })

  it("rejects a blank code and a blank name", () => {
    expect(categoryCreateSchema.safeParse({ ...valid, code: "  " }).success).toBe(false)
    expect(categoryCreateSchema.safeParse({ ...valid, name: "" }).success).toBe(false)
  })

  it("enforces code max 50 and name max 100", () => {
    expect(
      categoryCreateSchema.safeParse({ ...valid, code: "A".repeat(CATEGORY_CODE_MAX) }).success
    ).toBe(true)
    expect(
      categoryCreateSchema.safeParse({ ...valid, code: "A".repeat(CATEGORY_CODE_MAX + 1) }).success
    ).toBe(false)
    expect(
      categoryCreateSchema.safeParse({ ...valid, name: "N".repeat(CATEGORY_NAME_MAX + 1) }).success
    ).toBe(false)
  })
})

describe("categoryEditSchema", () => {
  it("has no code key and strips one from the output", () => {
    const parsed = categoryEditSchema.parse({
      name: "Dental",
      description: "",
      isActive: true,
      code: "HACK",
    })
    expect(parsed).not.toHaveProperty("code")
    expect(Object.keys(categoryEditSchema.shape)).toEqual([
      "name",
      "description",
      "isActive",
    ])
  })

  it("requires a name and a boolean isActive", () => {
    expect(categoryEditSchema.safeParse({ name: "", description: "", isActive: true }).success).toBe(false)
    expect(categoryEditSchema.safeParse({ name: "X", description: "" }).success).toBe(false)
  })
})
