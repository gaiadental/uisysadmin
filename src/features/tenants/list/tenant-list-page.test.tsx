// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, errorResponse } from "@/test/handlers/auth"
import {
  FIXTURE_TENANT,
  FIXTURE_TENANT_INACTIVE,
  listBody,
  pagingOf,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { TenantListPage } from "./tenant-list-page"

const BASE_URL = "http://sp.test"
let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  queryClient = createQueryClient()
  window.history.replaceState(null, "", "/tenants")
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantListPage />
    </QueryClientProvider>
  )
}

/** Records the query string of every tenants list request. */
function recordTenantRequests(): URLSearchParams[] {
  const seen: URLSearchParams[] = []
  server.use(
    http.get(`${API}/tenants`, ({ request }) => {
      seen.push(new URL(request.url).searchParams)
      return HttpResponse.json(listBody([FIXTURE_TENANT], 1, 20, 1))
    })
  )
  return seen
}

describe("TenantListPage states (D13)", () => {
  it("shows a loading status first, then the rows", async () => {
    renderPage()

    expect(screen.getByRole("status")).toHaveTextContent("Memuat tenant")
    expect(await screen.findByText("ANDALAS-DEV")).toBeInTheDocument()
    expect(screen.queryByText("Memuat tenant...")).not.toBeInTheDocument()
  })

  it("shows an empty message when there are no tenants and no filter", async () => {
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(listBody([], 1, 20, 0))
      )
    )
    renderPage()

    expect(await screen.findByText("Belum ada tenant.")).toBeInTheDocument()
  })

  it("shows a different empty message when a filter is set", async () => {
    window.history.replaceState(null, "", "/tenants?code=NOPE")
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(listBody([], 1, 20, 0))
      )
    )
    renderPage()

    expect(
      await screen.findByText("Tidak ada tenant yang cocok dengan filter.")
    ).toBeInTheDocument()
  })

  it("shows an alert with the reference id and a retry button on an error, and no automatic retry", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/tenants`, () => {
        calls += 1
        return HttpResponse.json(
          { code: "SERVICE_UNAVAILABLE", message: "Master data is down." },
          { status: 503, headers: { "X-Correlation-ID": "ref-503" } }
        )
      })
    )
    renderPage()

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Master data is down.")
    expect(alert).toHaveTextContent("Kode referensi: ref-503")
    expect(calls).toBe(1)

    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(listBody([FIXTURE_TENANT], 1, 20, 1))
      )
    )
    fireEvent.click(within(alert).getByRole("button", { name: "Coba lagi" }))
    expect(await screen.findByText("ANDALAS-DEV")).toBeInTheDocument()
  })

  it("never shows the server text of a 500", async () => {
    server.use(
      http.get(`${API}/tenants`, () =>
        errorResponse(500, "INTERNAL_SERVER_ERROR", "NullPointerException at X")
      )
    )
    renderPage()

    const alert = await screen.findByRole("alert")
    expect(alert).not.toHaveTextContent("NullPointerException")
  })

  it("shows a contract failure as a generic alert", async () => {
    server.use(
      http.get(`${API}/tenants`, () => HttpResponse.json({ data: [] }))
    )
    renderPage()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Respons server tidak sesuai kontrak"
    )
  })
})

describe("TenantListPage columns and joins (D8.1, D5.4)", () => {
  it("shows the contract columns with the category and country joined from the reference lists", async () => {
    renderPage()

    const headers = (await screen.findAllByRole("columnheader")).map(
      (header) => header.textContent
    )
    expect(headers).toEqual([
      "Kode",
      "Nama",
      "Kategori",
      "Negara",
      "Penyebaran",
      "Status",
    ])

    const row = (await screen.findByText("ANDALAS-DEV")).closest("tr")
    expect(row).not.toBeNull()
    await waitFor(() => {
      expect(
        within(row as HTMLElement).getByText("Dental Clinic")
      ).toBeInTheDocument()
    })
    expect(
      within(row as HTMLElement).getByText("Indonesia")
    ).toBeInTheDocument()
    expect(
      within(row as HTMLElement).getByText("Multi-tenant")
    ).toBeInTheDocument()
    expect(within(row as HTMLElement).getByText("ACTIVE")).toBeInTheDocument()

    const inactive = screen.getByText("SMILE").closest("tr") as HTMLElement
    expect(within(inactive).getByText("INACTIVE")).toBeInTheDocument()
    expect(within(inactive).getByText("Dedicated")).toBeInTheDocument()
    expect(
      within(inactive).getByLabelText("Tidak ada negara")
    ).toBeInTheDocument()
  })

  it("has no name search and no delete control", async () => {
    renderPage()
    await screen.findByText("ANDALAS-DEV")

    expect(screen.queryByPlaceholderText(/cari/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /hapus/i })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText("Kode tenant (persis)")).toBeInTheDocument()
  })

  it("does not fetch the reference lists once per row", async () => {
    let categoryCalls = 0
    let countryCalls = 0
    server.use(
      http.get(`${API}/tenant-categories`, () => {
        categoryCalls += 1
        return HttpResponse.json(listBody([], 1, 100, 0))
      }),
      http.get(`${API}/countries`, () => {
        countryCalls += 1
        return HttpResponse.json(listBody([], 1, 100, 0))
      })
    )
    renderPage()
    await screen.findByText("SMILE")

    expect(categoryCalls).toBe(1)
    expect(countryCalls).toBe(1)
  })
})

describe("TenantListPage filters and pagination (D8.1, D5.4, D10)", () => {
  it("sends the filters from the URL as API parameters", async () => {
    window.history.replaceState(
      null,
      "",
      "/tenants?status=active&category=cat-1&country=ID&deployment=DEDICATED&code=GAIA&page=2"
    )
    const seen = recordTenantRequests()
    renderPage()
    await screen.findByText("ANDALAS-DEV")

    expect(Object.fromEntries(seen[0] ?? [])).toEqual({
      page: "2",
      limit: "20",
      is_active: "true",
      category_id: "cat-1",
      country_code: "ID",
      deployment_type: "DEDICATED",
      code: "GAIA",
    })
  })

  it("applies the exact code on submit, writes it to the URL and returns to page 1", async () => {
    window.history.replaceState(null, "", "/tenants?page=3")
    const seen = recordTenantRequests()
    renderPage()
    await screen.findByText("ANDALAS-DEV")

    fireEvent.change(screen.getByLabelText("Kode tenant (persis)"), {
      target: { value: "SMILE" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Terapkan" }))

    await waitFor(() => {
      expect(window.location.search).toBe("?code=SMILE")
    })
    await waitFor(() => {
      expect(seen.at(-1)?.get("code")).toBe("SMILE")
    })
    expect(seen.at(-1)?.get("page")).toBe("1")
  })

  it("resets every filter with one button", async () => {
    window.history.replaceState(null, "", "/tenants?status=inactive&code=SMILE")
    renderPage()
    await screen.findByText("SMILE")

    fireEvent.click(screen.getByRole("button", { name: "Reset filter" }))

    await waitFor(() => {
      expect(window.location.search).toBe("")
    })
  })

  it("pages on the server: next sends page 2 and the footer shows the range", async () => {
    const all = Array.from({ length: 45 }, (_, index) => ({
      ...FIXTURE_TENANT,
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      code: `T-${String(index).padStart(2, "0")}`,
    }))
    const pages: number[] = []
    server.use(
      http.get(`${API}/tenants`, ({ request }) => {
        const { page, limit } = pagingOf(new URL(request.url))
        pages.push(page)
        const start = (page - 1) * limit
        return HttpResponse.json(
          listBody(all.slice(start, start + limit), page, limit, all.length)
        )
      })
    )
    renderPage()

    expect(await screen.findByText("T-00")).toBeInTheDocument()
    expect(screen.getByText(/1–20 \/ 45 tenant/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }))

    expect(await screen.findByText("T-20")).toBeInTheDocument()
    expect(pages).toEqual([1, 2])
    expect(window.location.search).toBe("?page=2")
    expect(screen.getByText(/21–40 \/ 45 tenant/)).toBeInTheDocument()
  })

  it("hides the pagination bar when there is one page", async () => {
    server.use(
      http.get(`${API}/tenants`, () =>
        HttpResponse.json(listBody([FIXTURE_TENANT_INACTIVE], 1, 20, 1))
      )
    )
    renderPage()
    await screen.findByText("SMILE")

    expect(
      screen.queryByRole("navigation", { name: /paginasi/i })
    ).not.toBeInTheDocument()
  })
})
