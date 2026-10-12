// @vitest-environment jsdom
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { API } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { isTenantCodeTaken } from "./code-availability"

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("isTenantCodeTaken", () => {
  it("is true for an existing code, whatever the case", async () => {
    expect(await isTenantCodeTaken("SMILE")).toBe(true)
    expect(await isTenantCodeTaken(" smile ")).toBe(true)
  })

  it("is false for a free code and for an empty one", async () => {
    expect(await isTenantCodeTaken("NEWCO")).toBe(false)
    expect(await isTenantCodeTaken("  ")).toBe(false)
  })

  it("ignores a near match when the server filter is a contains search", async () => {
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json({
          data: [],
          pagination: { page: 1, limit: 100, total: 0, total_pages: 0 },
        })
      )
    )
    expect(await isTenantCodeTaken("SMIL")).toBe(false)
  })

  it("does not block when the lookup fails", async () => {
    server.use(http.get(`${API}/tenants`, () => HttpResponse.error()))
    expect(await isTenantCodeTaken("SMILE")).toBe(false)
  })
})
