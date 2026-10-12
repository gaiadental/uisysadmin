// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { cleanup, render, screen, waitFor, within } from "@testing-library/react"
import { delay, http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import { API, FIXTURE_ME, errorResponse } from "@/test/handlers/auth"
import {
  DASHBOARD_TOTALS,
  dashboardCountHandlers,
  type SeenRequest,
} from "@/test/handlers/dashboard"
import {
  FIXTURE_TENANT,
  FIXTURE_TENANT_INACTIVE,
  listBody,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { DashboardPage } from "./dashboard-page"

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

function signInAs(role: string, permissions: readonly string[] = []) {
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
  signInAs("SYS_PRINCIPAL")
  window.history.replaceState(null, "", "/")
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

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  )
}

function renderPageAndSidebar() {
  return render(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <AppSidebar />
        <DashboardPage />
      </SidebarProvider>
    </QueryClientProvider>
  )
}

function metric(label: string): HTMLElement {
  const card = screen
    .getAllByText(label)
    .map((node) => node.closest("[data-slot='card']"))
    .find((node) => node instanceof HTMLElement)
  if (!(card instanceof HTMLElement)) throw new Error(`No card for ${label}`)
  return card
}

function itemOf(label: string): HTMLElement {
  const item = screen.getByRole("link", { name: label }).closest("li")
  if (item === null) throw new Error(`No list item for ${label}`)
  return item
}

/** A gate a test opens to release one held request. */
function gate() {
  let open: () => void = () => undefined
  const promise = new Promise<void>((resolve) => {
    open = resolve
  })
  return { promise, open }
}

const LABELS = ["Tenant", "Tenant aktif", "Kategori tenant", "Negara"] as const

type Failing = "tenants" | "active" | "categories" | "countries"

function failing(which: Failing) {
  const fail = () => errorResponse(502, "BAD_GATEWAY", "Upstream failed.")
  switch (which) {
    case "tenants":
      return http.get(`${API}/tenants`, ({ request }) => {
        const params = new URL(request.url).searchParams
        return params.get("limit") === "1" && params.get("is_active") === null
          ? fail()
          : undefined
      })
    case "active":
      return http.get(`${API}/tenants`, ({ request }) =>
        new URL(request.url).searchParams.get("is_active") === "true"
          ? fail()
          : undefined
      )
    case "categories":
      return http.get(`${API}/tenant-categories`, () => fail())
    case "countries":
      return http.get(`${API}/countries`, () => fail())
  }
}

const FAILURES: ReadonlyArray<readonly [Failing, string]> = [
  ["tenants", "Tenant"],
  ["active", "Tenant aktif"],
  ["categories", "Kategori tenant"],
  ["countries", "Negara"],
]

const EXPECTED: Readonly<Record<string, string>> = {
  Tenant: "12",
  "Tenant aktif": "9",
  "Kategori tenant": "4",
  Negara: "7",
}

describe("DashboardPage: each count has its own state", () => {
  it.each(FAILURES)(
    "a failed %s count shows an alert and leaves the other counts and the tenant list ready",
    async (which, failedLabel) => {
      server.use(failing(which), ...dashboardCountHandlers(DASHBOARD_TOTALS))
      renderPage()

      expect(
        await within(metric(failedLabel)).findByRole("alert")
      ).toHaveTextContent("Gagal dimuat")
      for (const label of LABELS.filter((entry) => entry !== failedLabel)) {
        expect(
          await within(metric(label)).findByText(EXPECTED[label] ?? "")
        ).toBeInTheDocument()
        expect(within(metric(label)).queryByRole("alert")).toBeNull()
      }
      expect(await screen.findByText("Klinik Andalas Dev")).toBeInTheDocument()
      // The failed card shows no number.
      expect(
        within(metric(failedLabel)).queryByText(/^\d+$/)
      ).not.toBeInTheDocument()
    }
  )

  it("a slow count stays in loading while the others are ready", async () => {
    const hold = gate()
    server.use(
      http.get(`${API}/countries`, async () => {
        await hold.promise
        return HttpResponse.json(listBody([], 1, 1, 7))
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS)
    )
    renderPage()

    await within(metric("Tenant")).findByText("12")
    await within(metric("Kategori tenant")).findByText("4")
    expect(within(metric("Negara")).getByRole("status")).toHaveTextContent(
      "Memuat"
    )
    expect(within(metric("Negara")).queryByRole("alert")).toBeNull()
    expect(within(metric("Tenant")).queryByRole("status")).toBeNull()

    hold.open()
    expect(await within(metric("Negara")).findByText("7")).toBeInTheDocument()
    expect(within(metric("Negara")).queryByRole("status")).toBeNull()
  })

  it("shows a real zero as 0, not as loading or error", async () => {
    server.use(
      ...dashboardCountHandlers({
        tenants: 0,
        activeTenants: 0,
        categories: 0,
        countries: 0,
      })
    )
    renderPage()

    for (const label of LABELS) {
      expect(await within(metric(label)).findByText("0")).toBeInTheDocument()
      expect(within(metric(label)).queryByRole("alert")).toBeNull()
      expect(within(metric(label)).queryByRole("status")).toBeNull()
    }
  })

  it("sends exactly five list requests: four counts and one limit=5 list", async () => {
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    renderPage()
    await within(metric("Negara")).findByText("7")
    await screen.findByText("Klinik Andalas Dev")

    const shape = seen
      .map(
        (request) =>
          `${request.path}?limit=${request.query.get("limit")}` +
          `&is_active=${request.query.get("is_active")}`
      )
      .sort()
    expect(shape).toEqual([
      "countries?limit=1&is_active=null",
      "tenant-categories?limit=1&is_active=null",
      "tenants?limit=1&is_active=null",
      "tenants?limit=1&is_active=true",
      "tenants?limit=5&is_active=null",
    ])
  })
})

describe("DashboardPage tenant widget order and wording", () => {
  it("lists the rows in the order the server returned, without sorting", async () => {
    const reversed = [
      { ...FIXTURE_TENANT_INACTIVE, name: "Zeta Klinik" },
      { ...FIXTURE_TENANT, name: "Alpha Klinik" },
      { ...FIXTURE_TENANT, id: "id-3", code: "MID", name: "Mid Klinik" },
    ]
    server.use(
      http.get(`${API}/tenants`, ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit"))
        return HttpResponse.json(
          listBody(limit > 1 ? reversed : [], 1, limit, 3)
        )
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(1)
    )
    renderPage()

    await screen.findByText("Zeta Klinik")
    const names = screen
      .getAllByRole("listitem")
      .map((item) => within(item).getByRole("link").textContent)
    expect(names).toEqual(["Zeta Klinik", "Alpha Klinik", "Mid Klinik"])
  })

  it("never uses the word latest or terbaru anywhere on the page", async () => {
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    const { container } = renderPage()
    await screen.findByText("Klinik Andalas Dev")

    const text = (container.textContent ?? "").toLowerCase()
    expect(text).not.toMatch(/latest|terbaru|terakhir/)
  })

  it("shows the loading message for the list while it is pending", async () => {
    const hold = gate()
    server.use(
      http.get(`${API}/tenants`, async ({ request }) => {
        const limit = Number(new URL(request.url).searchParams.get("limit"))
        if (limit === 5) await hold.promise
        return HttpResponse.json(listBody([], 1, limit, 1))
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(1)
    )
    renderPage()

    expect(await screen.findByText("Memuat tenant...")).toBeInTheDocument()
    await within(metric("Negara")).findByText("7")
    hold.open()
    expect(await screen.findByText("Belum ada tenant.")).toBeInTheDocument()
  })

  it("a failed list leaves the four counts ready", async () => {
    server.use(
      http.get(`${API}/tenants`, ({ request }) => {
        const params = new URL(request.url).searchParams
        if (params.get("limit") === "5")
          return errorResponse(502, "BAD_GATEWAY", "Upstream failed.")
        return HttpResponse.json(
          listBody([], 1, 1, params.get("is_active") === "true" ? 9 : 12)
        )
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(1)
    )
    renderPage()

    for (const label of LABELS) {
      expect(
        await within(metric(label)).findByText(EXPECTED[label] ?? "")
      ).toBeInTheDocument()
    }
  })
})

describe("DashboardPage without SYS_PRINCIPAL", () => {
  it.each([
    ["SYS_ADMIN", ["master_permissions:view", "system_users:view"]],
    ["TENANT_ADMIN", ["tenants:view", "tenant_categories:view"]],
    ["", []],
  ])(
    "role %j with permissions sends no master-data request and shows the neutral page",
    async (role, permissions) => {
      signInAs(role, permissions)
      const seen: SeenRequest[] = []
      server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
      renderPage()

      expect(
        screen.getByRole("heading", { level: 1, name: "Beranda" })
      ).toBeInTheDocument()
      for (const label of LABELS) expect(screen.queryByText(label)).toBeNull()
      expect(screen.queryByText("Memuat tenant...")).toBeNull()
      expect(screen.queryByRole("status")).toBeNull()
      await new Promise((resolve) => setTimeout(resolve, 50))
      expect(seen).toEqual([])
    }
  )

  it("does not show the removed surfaces to anyone", async () => {
    signInAs("SYS_ADMIN", ["system_users:view"])
    const { container } = renderPage()

    const text = (container.textContent ?? "").toLowerCase()
    expect(text).not.toMatch(
      /perlu ditangani|aktivitas|event gagal|sesi aktif|activity/
    )
  })
})

describe("Counts follow the invalidation map (D12.1)", () => {
  it("keys every count under the family its list write invalidates", async () => {
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    renderPage()
    await within(metric("Negara")).findByText("7")

    const families = [
      queryKeys.tenants.all(),
      queryKeys.tenantCategories.all(),
      queryKeys.countries.all(),
    ]
    for (const family of families) {
      const keys = queryClient
        .getQueryCache()
        .findAll({ queryKey: family })
        .map((query) => query.queryKey)
      expect(keys.length).toBeGreaterThan(0)
    }
    // Both tenant counts and the widget list: three entries in the tenants family.
    expect(
      queryClient.getQueryCache().findAll({ queryKey: queryKeys.tenants.all() })
    ).toHaveLength(3)
  })

  it("a tenant category write refetches the category count and the tenant entries (D12.1 tenantCategoryWrite)", async () => {
    let total = 4
    const seen: SeenRequest[] = []
    server.use(
      http.get(`${API}/tenant-categories`, ({ request }) => {
        seen.push({
          path: "tenant-categories",
          query: new URL(request.url).searchParams,
        })
        return HttpResponse.json(listBody([], 1, 1, total))
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS, seen).filter(
        (_, index) => index !== 1
      )
    )
    renderPage()
    await within(metric("Kategori tenant")).findByText("4")
    await within(metric("Tenant aktif")).findByText("9")
    await within(metric("Tenant")).findByText("12")
    await screen.findByText("Klinik Andalas Dev")
    const tenantCallsBefore = seen.filter((r) => r.path === "tenants").length

    total = 5
    await applyInvalidation(queryClient, { kind: "tenantCategoryWrite" })

    expect(
      await within(metric("Kategori tenant")).findByText("5")
    ).toBeInTheDocument()
    // The map also invalidates the tenants family: total, active total and list.
    await waitFor(() =>
      expect(seen.filter((r) => r.path === "tenants")).toHaveLength(
        tenantCallsBefore + 3
      )
    )
  })

  it("a country write refetches the country count", async () => {
    let total = 7
    server.use(
      http.get(`${API}/countries`, () =>
        HttpResponse.json(listBody([], 1, 1, total))
      ),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(0, 2)
    )
    renderPage()
    await within(metric("Negara")).findByText("7")

    total = 8
    await applyInvalidation(queryClient, { kind: "countryWrite" })

    expect(await within(metric("Negara")).findByText("8")).toBeInTheDocument()
  })

  it("a tenant create refetches the total, the active total and the list", async () => {
    let total = 12
    let active = 9
    let rows: unknown[] = [FIXTURE_TENANT]
    server.use(
      http.get(`${API}/tenants`, ({ request }) => {
        const params = new URL(request.url).searchParams
        const limit = Number(params.get("limit"))
        return HttpResponse.json(
          listBody(
            limit > 1 ? rows : [],
            1,
            limit,
            params.get("is_active") === "true" ? active : total
          )
        )
      }),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(1)
    )
    renderPage()
    await within(metric("Tenant aktif")).findByText("9")

    total = 13
    active = 10
    rows = [{ ...FIXTURE_TENANT, name: "Klinik Baru" }]
    await applyInvalidation(queryClient, { kind: "tenantCreate" })

    expect(await within(metric("Tenant")).findByText("13")).toBeInTheDocument()
    expect(
      await within(metric("Tenant aktif")).findByText("10")
    ).toBeInTheDocument()
    expect(await screen.findByText("Klinik Baru")).toBeInTheDocument()
  })

  it("dashboard and sidebar share one request per resource", async () => {
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    renderPageAndSidebar()

    await within(itemOf("Negara")).findByText("7")
    await within(metric("Negara")).findByText("7")
    await screen.findByText("Klinik Andalas Dev")

    const limitOne = seen.filter(
      (request) =>
        request.query.get("limit") === "1" &&
        request.query.get("is_active") === null
    )
    expect(limitOne.map((request) => request.path).sort()).toEqual([
      "countries",
      "tenant-categories",
      "tenants",
    ])
  })

  it("a country write updates the sidebar badge and the dashboard card together", async () => {
    let total = 7
    server.use(
      http.get(`${API}/countries`, () =>
        HttpResponse.json(listBody([], 1, 1, total))
      ),
      ...dashboardCountHandlers(DASHBOARD_TOTALS).slice(0, 2)
    )
    renderPageAndSidebar()
    await within(itemOf("Negara")).findByText("7")

    total = 9
    await applyInvalidation(queryClient, { kind: "countryWrite" })

    expect(await within(itemOf("Negara")).findByText("9")).toBeInTheDocument()
    expect(await within(metric("Negara")).findByText("9")).toBeInTheDocument()
  })
})

describe("AppSidebar badge states", () => {
  it("shows no number while the counts load, then the totals", async () => {
    const hold = gate()
    server.use(
      http.get(`${API}/tenants`, async () => {
        await hold.promise
        return HttpResponse.json(listBody([], 1, 1, 12))
      }),
      http.get(`${API}/tenant-categories`, async () => {
        await delay(0)
        await hold.promise
        return HttpResponse.json(listBody([], 1, 1, 4))
      }),
      http.get(`${API}/countries`, async () => {
        await hold.promise
        return HttpResponse.json(listBody([], 1, 1, 7))
      })
    )
    render(
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </QueryClientProvider>
    )

    for (const label of ["Daftar tenant", "Kategori tenant", "Negara"]) {
      expect(within(itemOf(label)).queryByText(/^\d+$/)).toBeNull()
    }
    hold.open()
    expect(await within(itemOf("Daftar tenant")).findByText("12")).toBeTruthy()
    expect(await within(itemOf("Kategori tenant")).findByText("4")).toBeTruthy()
    expect(await within(itemOf("Negara")).findByText("7")).toBeTruthy()
  })

  it.each([
    ["tenants", "Daftar tenant"],
    ["categories", "Kategori tenant"],
    ["countries", "Negara"],
  ] as const)(
    "a failed %s count removes only that badge",
    async (which, failedLabel) => {
      server.use(failing(which), ...dashboardCountHandlers(DASHBOARD_TOTALS))
      render(
        <QueryClientProvider client={queryClient}>
          <SidebarProvider>
            <AppSidebar />
          </SidebarProvider>
        </QueryClientProvider>
      )
      const expected: Record<string, string> = {
        "Daftar tenant": "12",
        "Kategori tenant": "4",
        Negara: "7",
      }
      for (const label of Object.keys(expected).filter(
        (entry) => entry !== failedLabel
      )) {
        expect(
          await within(itemOf(label)).findByText(expected[label] ?? "")
        ).toBeTruthy()
      }
      expect(within(itemOf(failedLabel)).queryByText(/^\d+$/)).toBeNull()
    }
  )

  it("shows a total of 0 as a badge", async () => {
    server.use(
      ...dashboardCountHandlers({
        tenants: 0,
        activeTenants: 0,
        categories: 0,
        countries: 0,
      })
    )
    render(
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </QueryClientProvider>
    )

    expect(await within(itemOf("Negara")).findByText("0")).toBeTruthy()
    expect(within(itemOf("Daftar tenant")).getByText("0")).toBeTruthy()
  })

  it("shows no badge for SYS_ADMIN with every master-data permission", async () => {
    signInAs("SYS_ADMIN", [
      "master_permissions:view",
      "system_users:view",
      "system_roles:view",
    ])
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    render(
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </QueryClientProvider>
    )

    expect(screen.getAllByRole("link").length).toBeGreaterThan(0)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByText(/^\d+$/)).toBeNull()
    expect(seen).toEqual([])
  })

  it("has no failed-event or active-session badge or menu entry", async () => {
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    render(
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </QueryClientProvider>
    )
    await within(itemOf("Negara")).findByText("7")

    const numbers = screen
      .getAllByText(/^\d+$/)
      .map((node) => node.closest("li")?.textContent ?? "")
    expect(numbers).toHaveLength(3)
    expect(screen.queryByRole("link", { name: /event|housekeeping/i })).toBeNull()
    expect(screen.queryByText(/sesi aktif|event gagal/i)).toBeNull()
  })

  it("waits for an authenticated session before it requests counts", async () => {
    authState.value = {
      status: "anonymous",
      me: { ...FIXTURE_ME, role: "SYS_PRINCIPAL", permissions: [] },
      logout: () => Promise.resolve(),
    }
    const seen: SeenRequest[] = []
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS, seen))
    render(
      <QueryClientProvider client={queryClient}>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </QueryClientProvider>
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(seen).toEqual([])
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })
})
