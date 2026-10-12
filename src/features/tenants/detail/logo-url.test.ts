import { describe, expect, it } from "vitest"

import { safeLogoSrc } from "./logo-url"

describe("safeLogoSrc (D15)", () => {
  it("allows https", () => {
    expect(safeLogoSrc("https://x.test/l.png", false)).toBe(
      "https://x.test/l.png"
    )
  })

  it("allows http only when development allows it", () => {
    expect(safeLogoSrc("http://x.test/l.png", false)).toBeNull()
    expect(safeLogoSrc("http://x.test/l.png", true)).toBe("http://x.test/l.png")
  })

  it("never renders other schemes, malformed values or null", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:image/svg+xml,<svg/>",
      "ftp://x.test/l",
      "//x.test/l.png",
      "not a url",
      "",
      "   ",
    ]) {
      expect(safeLogoSrc(value, true)).toBeNull()
    }
    expect(safeLogoSrc(null, true)).toBeNull()
  })
})
