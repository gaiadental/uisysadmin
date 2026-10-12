import { describe, expect, it } from "vitest"

import {
  COUNTRY_NAME_MAX,
  NATIONALITY_NAME_MAX,
  PHONE_CODE_MAX,
  countryCreateSchema,
  countryEditSchema,
} from "./schema"

const VALID = { code: "SG", name: "Singapore", nationalityName: "", phoneCode: "" }

describe("countryCreateSchema", () => {
  it("accepts two uppercase letters", () => {
    expect(countryCreateSchema.safeParse(VALID).success).toBe(true)
  })

  it.each(["sg", "S", "SGP", "S1", "1S", "S G", ""])("rejects code %j", (code) => {
    expect(countryCreateSchema.safeParse({ ...VALID, code }).success).toBe(false)
  })

  it("enforces the max lengths", () => {
    expect(countryCreateSchema.safeParse({ ...VALID, name: "N".repeat(COUNTRY_NAME_MAX + 1) }).success).toBe(false)
    expect(countryCreateSchema.safeParse({ ...VALID, nationalityName: "N".repeat(NATIONALITY_NAME_MAX + 1) }).success).toBe(false)
    expect(countryCreateSchema.safeParse({ ...VALID, phoneCode: "1".repeat(PHONE_CODE_MAX) }).success).toBe(true)
    expect(countryCreateSchema.safeParse({ ...VALID, phoneCode: "1".repeat(PHONE_CODE_MAX + 1) }).success).toBe(false)
  })

  it("requires a name", () => {
    expect(countryCreateSchema.safeParse({ ...VALID, name: " " }).success).toBe(false)
  })
})

describe("countryEditSchema", () => {
  it("has no code key and strips one from the output", () => {
    const parsed = countryEditSchema.parse({
      name: "Singapore",
      nationalityName: "",
      phoneCode: "",
      isActive: true,
      code: "XX",
    })
    expect(parsed).not.toHaveProperty("code")
    expect(Object.keys(countryEditSchema.shape)).not.toContain("code")
  })
})
