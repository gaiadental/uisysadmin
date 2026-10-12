// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import { http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { NAV_ITEMS } from "@/app/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, FIXTURE_ME, errorResponse } from "@/test/handlers/auth"
import {
  DASHBOARD_TOTALS,
  dashboardCountHandlers,
  type SeenRequest,
} from "@/test/handlers/dashboard"
import { server } from "@/test/server"

const authState = vi.hoisted(() => ({
  value: {
    status: "authenticated",
    me: null as unknown,
    logout: () => Promise.resolve(),
  },
}))

vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => authState.value,
}))

let queryClient: QueryClient

function signInAs(role: string, permissions: readonly string[]) {
  authState.value = {
    status: "authenticated",
    me: { ...FIXTURE_ME, role, permissions },
    logout: () => Promise.resolve(),
  }
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  window.history.replaceState(null, "", "/tenants")
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function renderSidebar() {
  return render(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </QueryClientProvider>
  )
}

function itemOf(label: string): HTMLElement {
  const link = screen.getByRole("link", { name: label })
  const item = link.closest("li")
  if (item === null) throw new Error(`No list item for ${label}`)
  return item
}

describe("navigation badge keys (REQ-FE-038)", () => {
  it("gives a badge key to the tenant, category and country items only", () => {
    const badged = NAV_ITEMS.filter((item) => item.badge !== undefined).map(
      (item) => [item.id, item.badge]
    )
    expect(badged).toEqual([
      ["tenant.list", "tenants"],
      ["catalog.kategori", "tenantCategories"],
      ["catalog.negara", "countries"],
    ])
  })
})

describe("AppSidebar badges", () => {
  it("shows the contract totals beside the master-data items", async () => {
    signInAs("SYS_PRINCIPAL", [])
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    renderSidebar()

    await waitFor(() =>
      expect(within(itemOf("Daftar tenant")).getByText("12")).toBeInTheDocument()
    )
    expect(within(itemOf("Kategori tenant")).getByText("4")).toBeInTheDocument()
    expect(within(itemOf("Negara")).getByText("7")).toBeInTheDocument()
    expect(
      within(itemOf("Tambah tenant")).queryByText(/^\d+$/)
    ).not.toBeInTheDocument()
  })

  it("shares requests with the dashboard counts: one limit=1 call per resource", async () => {
    signInAs("SYS_PRINCIPAL", [])
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    renderSidebar()

    await within(itemOf("Daftar tenant")).findByText("12")
    await within(itemOf("Negara")).findByText("7")
    expect(seen.map((request) => request.path).sort()).toEqual([
      "countries",
      "tenant-categories",
      "tenants",
    ])
  })

  it("shows no badge and sends no count request without SYS_PRINCIPAL", async () => {
    signInAs("SUPPORT", ["system_users:view"])
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    renderSidebar()

    expect(screen.getByRole("link", { name: "Akun" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Daftar tenant" })).toBeNull()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(seen).toEqual([])
  })

  it("shows no badge for a count that failed", async () => {
    signInAs("SYS_PRINCIPAL", [])
    server.use(
      http.get(`${API}/countries`, () =>
        errorResponse(502, "BAD_GATEWAY", "Upstream failed.")
      ),
      ...dashboardCountHandlers(DASHBOARD_TOTALS)
    )
    renderSidebar()

    await within(itemOf("Daftar tenant")).findByText("12")
    expect(within(itemOf("Negara")).queryByText(/^\d+$/)).toBeNull()
  })

  it("has no badge for failed events or active sessions (SP-BG-08)", async () => {
    signInAs("SYS_PRINCIPAL", [])
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    renderSidebar()
    await within(itemOf("Daftar tenant")).findByText("12")

    expect(screen.queryByRole("link", { name: /event/i })).toBeNull()
    expect(
      within(itemOf("Sesi saya")).queryByText(/^\d+$/)
    ).not.toBeInTheDocument()
  })
})
