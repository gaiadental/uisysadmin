/**
 * Static source checks (ARCH-FE-001 D19, TODO-017; REQ-FE-042, REQ-FE-041,
 * REQ-FE-046). The suite reads every non-test file under `src/` as raw text and
 * fails on forbidden patterns. Test files are excluded, because tests assert
 * that the forbidden headers are never sent. Comments are stripped before the
 * scan, so a comment that names a forbidden header does not fail the check.
 */

import { describe, expect, it } from "vitest"

const RAW_SOURCES = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

const RAW_ENV_FILES = import.meta.glob("/.env*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

const TEST_FILE = /\.test\.(ts|tsx)$/
const TEST_SUPPORT_DIR = /^\/src\/test\//

function isProductionSource(path: string): boolean {
  return !TEST_FILE.test(path) && !TEST_SUPPORT_DIR.test(path)
}

/** Removes block and line comments. A `//` that follows `:` (a URL) is kept. */
export function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1")
}

const PRODUCTION_SOURCES = Object.entries(RAW_SOURCES)
  .filter(([path]) => isProductionSource(path))
  .map(([path, text]) => ({ path, code: stripComments(text) }))

function filesMatching(pattern: RegExp): string[] {
  return PRODUCTION_SOURCES.filter(({ code }) => pattern.test(code)).map(
    ({ path }) => path
  )
}

/** The only file allowed to touch browser storage, and the only key it may use. */
const THEME_FILE = "/src/components/theme-provider.tsx"
const THEME_KEY = "theme"

const AUTH_WORDS = /token|auth|session|jwt|refresh|credential|password|secret/i

const SECRET_NAME = /SECRET|PASSWORD|PASSWD|TOKEN|PRIVATE|CREDENTIAL|API_?KEY/i

describe("static rules: sanity", () => {
  it("scans real source files", () => {
    expect(PRODUCTION_SOURCES.length).toBeGreaterThan(50)
    expect(PRODUCTION_SOURCES.some(({ path }) => TEST_FILE.test(path))).toBe(
      false
    )
    expect(PRODUCTION_SOURCES.some(({ path }) => path === THEME_FILE)).toBe(
      true
    )
  })

  it("strips comments but keeps URLs", () => {
    const stripped = stripComments(
      '// X-Role\n/* X-Tenant-ID */ const u = "http://a.test" // X-User-ID'
    )
    expect(stripped).not.toMatch(/X-Role|X-Tenant-ID|X-User-ID/)
    expect(stripped).toContain("http://a.test")
  })
})

describe("static rules: browser storage (D4.11, REQ-FE-046)", () => {
  it("does not use sessionStorage anywhere in production source", () => {
    expect(filesMatching(/\bsessionStorage\b/)).toEqual([])
  })

  it("uses localStorage only in the theme provider", () => {
    expect(
      filesMatching(/\blocalStorage\b/).filter((p) => p !== THEME_FILE)
    ).toEqual([])
  })

  it("keeps the theme provider on the 'theme' key and away from auth data", () => {
    const entry = PRODUCTION_SOURCES.find(({ path }) => path === THEME_FILE)
    expect(entry).toBeDefined()
    const code = entry?.code ?? ""
    expect(code).toMatch(new RegExp(`storageKey = "${THEME_KEY}"`))
    // Every string literal in the provider must be free of auth words.
    const literals = code.match(/"[^"\n]*"/g) ?? []
    expect(literals.filter((literal) => AUTH_WORDS.test(literal))).toEqual([])
  })

  it("never stores a token under a custom key through window.* storage", () => {
    expect(filesMatching(/window\.(local|session)Storage/)).toEqual([])
  })
})

describe("static rules: forbidden identity headers (REQ-FE-046)", () => {
  it.each(["X-User-ID", "X-Role", "X-Tenant-ID", "X-Service-Token"])(
    "has no %s string in non-test source",
    (header) => {
      const pattern = new RegExp(header.replace(/-/g, "[-_ ]?"), "i")
      expect(filesMatching(pattern)).toEqual([])
    }
  )
})

describe("static rules: unsafe HTML", () => {
  it("has no dangerouslySetInnerHTML in non-test source", () => {
    expect(filesMatching(/dangerouslySetInnerHTML/)).toEqual([])
  })
})

describe("static rules: environment variables", () => {
  const namesIn = (text: string): string[] =>
    text.match(/VITE_[A-Z0-9_]+/g) ?? []

  it("uses no VITE_* name that holds a secret in source", () => {
    const names = PRODUCTION_SOURCES.flatMap(({ code }) => namesIn(code))
    expect(names.length).toBeGreaterThan(0)
    expect(names.filter((name) => SECRET_NAME.test(name))).toEqual([])
  })

  it("declares no VITE_* secret name in .env files", () => {
    const names = Object.values(RAW_ENV_FILES).flatMap(namesIn)
    expect(names.filter((name) => SECRET_NAME.test(name))).toEqual([])
  })
})

describe("static rules: removed surfaces (REQ-FE-041)", () => {
  const REMOVED =
    /branch|facilit|social|patient|employee|cabang|fasilitas|pasien|pegawai|karyawan/i

  it("has no file for branches, facilities, social links, patients or employees", () => {
    const paths = Object.keys(RAW_SOURCES).filter((path) =>
      REMOVED.test(path.replace(/^\/src\//, ""))
    )
    expect(paths).toEqual([])
  })

  it("has no legacy mock folders or the legacy hash router", () => {
    const legacy = Object.keys(RAW_SOURCES).filter((path) =>
      /^\/src\/(data|pages|router)\//.test(path)
    )
    expect(legacy).toEqual([])
  })

  it("imports nothing from the removed mock folders", () => {
    expect(
      filesMatching(
        /from\s+["'](@\/(data|pages|router)\b|\.{1,2}\/(data|pages|router)\b)/
      )
    ).toEqual([])
  })
})
