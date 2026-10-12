// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { FIXTURE_TENANT } from "@/test/handlers/tenants"

import { TenantListPage } from "./tenant-list-page"

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  window.history.replaceState(null, "", "/tenants")
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("TenantListPage links (TODO-010)", () => {
  it("has a Tambah tenant button that opens the wizard", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TenantListPage />
      </QueryClientProvider>
    )

    fireEvent.click(screen.getByRole("button", { name: "Tambah tenant" }))

    expect(window.location.pathname).toBe("/tenants/new")
  })

  it("links the tenant code to the detail page", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TenantListPage />
      </QueryClientProvider>
    )

    const link = await screen.findByRole("link", { name: "ANDALAS-DEV" })
    expect(link).toHaveAttribute("href", `/tenants/${FIXTURE_TENANT.id}`)
    fireEvent.click(link)
    expect(window.location.pathname).toBe(`/tenants/${FIXTURE_TENANT.id}`)
  })
})
