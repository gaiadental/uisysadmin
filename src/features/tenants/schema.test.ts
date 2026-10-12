import { describe, expect, it } from "vitest"

import {
  adminStepSchema,
  identityStepSchema,
  isOptionalHttpUrl,
  storageStepSchema,
  tenantCreateSchema,
  tenantProfileSchema,
} from "./schema"

const VALID_IDENTITY = {
  code: "SMILE",
  name: "Smile Dental Group",
  tenantCategoryId: "c91b1adc-675d-4a80-b3b4-05a657cc57d9",
  countryCode: "",
}

describe("identityStepSchema", () => {
  it("accepts a valid identity and allows no country", () => {
    expect(identityStepSchema.safeParse(VALID_IDENTITY).success).toBe(true)
  })

  it("trims code and name", () => {
    const result = identityStepSchema.parse({
      ...VALID_IDENTITY,
      code: "  SMILE ",
      name: " Smile ",
    })
    expect(result.code).toBe("SMILE")
    expect(result.name).toBe("Smile")
  })

  it("requires code, name and category", () => {
    const result = identityStepSchema.safeParse({
      code: "  ",
      name: "",
      tenantCategoryId: "",
      countryCode: "",
    })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((issue) => issue.path[0])
    expect(paths).toEqual(
      expect.arrayContaining(["code", "name", "tenantCategoryId"])
    )
  })

  it("limits code to 50 and name to 100 characters", () => {
    expect(
      identityStepSchema.safeParse({ ...VALID_IDENTITY, code: "A".repeat(50) })
        .success
    ).toBe(true)
    expect(
      identityStepSchema.safeParse({ ...VALID_IDENTITY, code: "A".repeat(51) })
        .success
    ).toBe(false)
    expect(
      identityStepSchema.safeParse({ ...VALID_IDENTITY, name: "N".repeat(100) })
        .success
    ).toBe(true)
    expect(
      identityStepSchema.safeParse({ ...VALID_IDENTITY, name: "N".repeat(101) })
        .success
    ).toBe(false)
  })
})

describe("storageStepSchema", () => {
  it("accepts both deployment types", () => {
    for (const deploymentType of ["DEDICATED", "MULTI_TENANT"]) {
      expect(
        storageStepSchema.safeParse({
          deploymentType,
          multiBranchEnabled: true,
        }).success
      ).toBe(true)
    }
  })

  it("rejects an unknown deployment type", () => {
    expect(
      storageStepSchema.safeParse({
        deploymentType: "SHARED",
        multiBranchEnabled: true,
      }).success
    ).toBe(false)
  })
})

describe("adminStepSchema", () => {
  it("accepts an e-mail and an empty logo", () => {
    expect(
      adminStepSchema.safeParse({
        tenantAdminEmail: "admin@smile.example.com",
        logoUrl: "",
      }).success
    ).toBe(true)
  })

  it("rejects a bad e-mail and an e-mail over 100 characters", () => {
    expect(
      adminStepSchema.safeParse({ tenantAdminEmail: "nope", logoUrl: "" })
        .success
    ).toBe(false)
    const long = `${"a".repeat(96)}@x.id`
    expect(
      adminStepSchema.safeParse({ tenantAdminEmail: long, logoUrl: "" }).success
    ).toBe(false)
  })

  it("accepts http and https logo URLs and rejects other schemes", () => {
    const base = { tenantAdminEmail: "a@b.co" }
    expect(
      adminStepSchema.safeParse({ ...base, logoUrl: "https://x.test/l.png" })
        .success
    ).toBe(true)
    expect(
      adminStepSchema.safeParse({ ...base, logoUrl: "http://x.test/l.png" })
        .success
    ).toBe(true)
    expect(
      adminStepSchema.safeParse({ ...base, logoUrl: "javascript:alert(1)" })
        .success
    ).toBe(false)
    expect(
      adminStepSchema.safeParse({ ...base, logoUrl: "not a url" }).success
    ).toBe(false)
  })

  it("limits the logo URL to 500 characters", () => {
    const base = { tenantAdminEmail: "a@b.co" }
    const url = (length: number) =>
      `https://x.test/${"a".repeat(length - "https://x.test/".length)}`
    expect(
      adminStepSchema.safeParse({ ...base, logoUrl: url(500) }).success
    ).toBe(true)
    expect(
      adminStepSchema.safeParse({ ...base, logoUrl: url(501) }).success
    ).toBe(false)
  })
})

describe("tenantCreateSchema", () => {
  it("merges the three steps", () => {
    const result = tenantCreateSchema.safeParse({
      ...VALID_IDENTITY,
      deploymentType: "MULTI_TENANT",
      multiBranchEnabled: true,
      tenantAdminEmail: "admin@smile.example.com",
      logoUrl: "",
    })
    expect(result.success).toBe(true)
  })
})

describe("tenantProfileSchema", () => {
  it("accepts empty values (they clear the field)", () => {
    expect(
      tenantProfileSchema.safeParse({ logoUrl: "", countryCode: "" }).success
    ).toBe(true)
  })

  it("rejects a non-http logo URL", () => {
    expect(
      tenantProfileSchema.safeParse({
        logoUrl: "ftp://x.test/l",
        countryCode: "",
      }).success
    ).toBe(false)
  })
})

describe("isOptionalHttpUrl", () => {
  it("accepts empty, http and https only", () => {
    expect(isOptionalHttpUrl("")).toBe(true)
    expect(isOptionalHttpUrl("https://a.test")).toBe(true)
    expect(isOptionalHttpUrl("data:text/html,x")).toBe(false)
  })
})
