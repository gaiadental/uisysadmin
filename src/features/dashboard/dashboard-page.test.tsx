// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"
import { applyInvalidation } from "@/lib/query/invalidation"
import { API, FIXTURE_ME, errorResponse } from "@/test/handlers/auth"
import {
  DASHBOARD_TOTALS,
  dashboardCountHandlers,
  type SeenRequest,
} from "@/test/handlers/dashboard"
import { server } from "@/test/server"

import { DashboardPage } from "./dashboard-page"

const authState = vi.hoisted(() => ({
  value: { status: "authenticated", me: null as unknown },
}))

vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => authState.value,
}))

let queryClient: QueryClient

function signInAs(role: string, permissions: readonly string[] = []) {
  authState.value = {
    status: "authenticated",
    me: { ...FIXTURE_ME, role, permissions },
  }
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  signInAs("SYS_PRINCIPAL")
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  )
}

function metric(label: string): HTMLElement {
  const card = screen.getByText(label).closest("[data-slot='card']")
  if (!(card instanceof HTMLElement)) throw new Error(`No card for ${label}`)
  return card
}

describe("DashboardPage counts (REQ-FE-037)", () => {
  it("shows each count from pagination.total of a limit=1 request", async () => {
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    renderPage()

    await waitFor(() =>
      expect(within(metric("Tenant")).getByText("12")).toBeInTheDocument()
    )
    expect(within(metric("Tenant aktif")).getByText("9")).toBeInTheDocument()
    expect(
      within(metric("Kategori tenant")).getByText("4")
    ).toBeInTheDocument()
    expect(within(metric("Negara")).getByText("7")).toBeInTheDocument()

    const counts = seen.filter((request) => request.query.get("limit") === "1")
    expect(counts.map((request) => request.path).sort()).toEqual([
      "countries",
      "tenant-categories",
      "tenants",
      "tenants",
    ])
    const activeRequest = counts.find(
      (request) => request.query.get("is_active") === "true"
    )
    expect(activeRequest?.path).toBe("tenants")
  })

  it("shows a loading status first", () => {
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    renderPage()

    expect(within(metric("Tenant")).getByRole("status")).toHaveTextContent(
      "Memuat"
    )
  })

  it("shows an error state for a count that failed and keeps the others", async () => {
    server.use(
      http.get(`${API}/countries`, () =>
        errorResponse(502, "BAD_GATEWAY", "Upstream failed.")
      ),
      ...dashboardCountHandlers(DASHBOARD_TOTALS)
    )
    renderPage()

    expect(
      await within(metric("Negara")).findByRole("alert")
    ).toHaveTextContent("Gagal dimuat")
    await waitFor(() =>
      expect(within(metric("Tenant")).getByText("12")).toBeInTheDocument()
    )
  })

  it("refetches a count when a write invalidates the tenant family (D12.1)", async () => {
    let tenantTotal = 12
    server.use(
      http.get(`${API}/tenants`, ({ request }) => {
        const url = new URL(request.url)
        const limit = Number(url.searchParams.get("limit") ?? "20")
        return HttpResponse.json({
          data: [],
          pagination: { page: 1, limit, total: tenantTotal, total_pages: 1 },
        })
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(1)
    )
    renderPage()
    await within(metric("Tenant")).findByText("12")

    tenantTotal = 13
    await applyInvalidation(queryClient, { kind: "tenantCreate" })

    expect(await within(metric("Tenant")).findByText("13")).toBeInTheDocument()
  })

  it("keeps the count cache entry in the PageResult shape of the list key", async () => {
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    renderPage()
    await within(metric("Tenant")).findByText("12")

    const entries = queryClient.getQueriesData<{
      pagination: { total: number }
    }>({ queryKey: queryKeys.tenants.all() })
    expect(entries.length).toBeGreaterThan(0)
    for (const [, data] of entries) {
      expect(data?.pagination.total).toBeTypeOf("number")
    }
  })
})

describe("DashboardPage tenant widget (FE-OQ-16)", () => {
  it("asks for limit=5 and is labelled with the server order, not latest", async () => {
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    renderPage()

    const heading = await screen.findByRole("heading", {
      name: "Tenant (5 pertama, urutan dari server)",
    })
    expect(heading.textContent?.toLowerCase()).not.toContain("terbaru")
    expect(heading.textContent?.toLowerCase()).not.toContain("latest")
    const link = await screen.findByRole("link", { name: "Klinik Andalas Dev" })
    expect(link).toHaveAttribute("href", expect.stringContaining("/tenants/"))
    expect(
      seen.some(
        (request) =>
          request.path === "tenants" && request.query.get("limit") === "5"
      )
    ).toBe(true)
  })

  it("shows an empty message when there are no tenants", async () => {
    server.use(
      http.get(`${API}/tenants`, ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit"))
        return HttpResponse.json({
          data: [],
          pagination: { page: 1, limit, total: 0, total_pages: 1 },
        })
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(1)
    )
    renderPage()

    expect(await screen.findByText("Belum ada tenant.")).toBeInTheDocument()
  })

  it("shows an alert with the reference id when the list fails", async () => {
    server.use(
      http.get(`${API}/tenants`, ({ request }) => {
        const limit = new URL(request.url).searchParams.get("limit")
        return limit === "5"
          ? errorResponse(502, "BAD_GATEWAY", "Upstream failed.")
          : HttpResponse.json({
              data: [],
              pagination: { page: 1, limit: 1, total: 1, total_pages: 1 },
            })
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(1)
    )
    renderPage()

    const alerts = await screen.findAllByRole("alert")
    expect(
      alerts.some((alert) =>
        alert.textContent?.includes("Layanan sedang bermasalah")
      )
    ).toBe(true)
  })
})

describe("DashboardPage without SYS_PRINCIPAL", () => {
  it("hides the master-data widgets and sends no request", async () => {
    signInAs("SUPPORT", ["system_users:view"])
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    renderPage()

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Beranda"
    )
    expect(screen.queryByText("Tenant aktif")).not.toBeInTheDocument()
    expect(screen.queryByText("Negara")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("heading", { name: /urutan dari server/ })
    ).not.toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(seen).toEqual([])
  })

  it("renders nothing without a session", () => {
    authState.value = { status: "anonymous", me: null }
    const { container } = renderPage()

    expect(container).toBeEmptyDOMElement()
  })
})

describe("DashboardPage removed surfaces (SP-BG-08)", () => {
  it("has no attention list, activity feed or failed-event metric", async () => {
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    renderPage()
    await within(metric("Tenant")).findByText("12")

    expect(screen.queryByText(/perlu ditangani/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/aktivitas/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/event gagal/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sesi aktif/i)).not.toBeInTheDocument()
  })
})
