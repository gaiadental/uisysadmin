import { describe, expect, it } from "vitest"

import { buildPatch } from "./profile-patch"

const TENANT = { logoUrl: "https://x.test/l.png", countryCode: "ID" }

describe("buildPatch (D5.3)", () => {
  it("is empty when nothing changed", () => {
    expect(
      buildPatch(TENANT, { logoUrl: "https://x.test/l.png", countryCode: "ID" })
    ).toEqual({})
  })

  it("sends only the changed key", () => {
    expect(
      buildPatch(TENANT, {
        logoUrl: "https://x.test/new.png",
        countryCode: "ID",
      })
    ).toEqual({ logoUrl: "https://x.test/new.png" })
    expect(
      buildPatch(TENANT, { logoUrl: "https://x.test/l.png", countryCode: "SG" })
    ).toEqual({ countryCode: "SG" })
  })

  it("sends null when a field is emptied", () => {
    expect(buildPatch(TENANT, { logoUrl: "", countryCode: "" })).toEqual({
      logoUrl: null,
      countryCode: null,
    })
  })

  it("treats null and empty as the same value", () => {
    expect(
      buildPatch(
        { logoUrl: null, countryCode: null },
        { logoUrl: "", countryCode: "" }
      )
    ).toEqual({})
  })
})
