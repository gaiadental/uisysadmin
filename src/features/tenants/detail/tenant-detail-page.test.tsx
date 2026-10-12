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

import { DialogsProvider } from "@/components/dialogs/dialogs"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import {
  FIXTURE_ADMIN_ACCOUNT_RETRY_SYNC_FAILED,
  FIXTURE_TENANT,
  FIXTURE_TENANT_DETAIL,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { TenantDetailPage } from "./tenant-detail-page"

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock("sonner", () => ({ toast: toastMock }))

// The page reads `me` to decide whether the Permissions tab shows (TODO-011).
vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => ({
    status: "authenticated",
    me: { ...FIXTURE_ME, branches: [] },
  }),
}))

const BASE_URL = "http://sp.test"
let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  queryClient = createQueryClient()
  window.history.replaceState(null, "", `/tenants/${FIXTURE_TENANT.id}`)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  toastMock.success.mockClear()
  toastMock.warning.mockClear()
  toastMock.error.mockClear()
})

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <DialogsProvider>
        <TenantDetailPage />
      </DialogsProvider>
    </QueryClientProvider>
  )
}

async function openProfile() {
  fireEvent.click(await screen.findByRole("tab", { name: "Profil" }))
  await screen.findByLabelText("URL logo")
}

function useDetail(overrides: Record<string, unknown>) {
  server.use(
    http.get(`${API}/tenants/:id`, () =>
      HttpResponse.json({ ...FIXTURE_TENANT_DETAIL, ...overrides })
    )
  )
}

function recordPatches(): Array<Record<string, unknown>> {
  const bodies: Array<Record<string, unknown>> = []
  server.use(
    http.patch(`${API}/tenants/:id`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      return HttpResponse.json({ ...FIXTURE_TENANT, ...body })
    })
  )
  return bodies
}

describe("TenantDetailPage states (D13)", () => {
  it("shows a loading status, then the tenant", async () => {
    renderPage()

    expect(screen.getByRole("status")).toHaveTextContent("Memuat tenant")
    expect(
      await screen.findByRole("heading", { name: "Klinik Andalas Dev" })
    ).toBeInTheDocument()
  })

  it("shows 'Data tidak ditemukan' for a 404", async () => {
    window.history.replaceState(null, "", "/tenants/missing")
    renderPage()

    expect(await screen.findByText("Data tidak ditemukan.")).toBeInTheDocument()
  })

  it("shows an error alert with a retry for a failed read", async () => {
    server.use(
      http.get(`${API}/tenants/:id`, () =>
        errorResponse(502, "INTERNAL_ERROR", "bad gateway")
      )
    )
    renderPage()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Layanan sedang bermasalah"
    )
    expect(
      screen.getByRole("button", { name: "Coba lagi" })
    ).toBeInTheDocument()
  })
})

describe("TenantDetailPage read-only fields (REQ-FE-022)", () => {
  it("shows the immutable fields as read-only inputs", async () => {
    renderPage()
    await openProfile()

    for (const label of [
      "Kode tenant",
      "Nama tenant",
      "Kategori tenant",
      "Tipe penyebaran",
      "Multi cabang",
      "E-mail admin tenant",
    ]) {
      expect(screen.getByLabelText(label)).toHaveAttribute("readonly")
    }
    expect(screen.getByLabelText("Kode tenant")).toHaveValue("ANDALAS-DEV")
    expect(screen.getByLabelText("URL logo")).not.toHaveAttribute("readonly")
    expect(screen.getByLabelText("Negara")).not.toBeDisabled()
  })

  it("has no delete control anywhere", async () => {
    renderPage()
    await openProfile()

    expect(screen.queryByRole("button", { name: /hapus|delete/i })).toBeNull()
    fireEvent.click(screen.getByRole("tab", { name: "Ringkasan" }))
    expect(screen.queryByRole("button", { name: /hapus|delete/i })).toBeNull()
  })
})

describe("TenantDetailPage PATCH (D5.3)", () => {
  it("keeps Save disabled until something changes", async () => {
    renderPage()
    await openProfile()

    expect(
      screen.getByRole("button", { name: "Simpan perubahan" })
    ).toBeDisabled()
  })

  it("sends only the changed key", async () => {
    const bodies = recordPatches()
    renderPage()
    await openProfile()

    fireEvent.change(screen.getByLabelText("URL logo"), {
      target: { value: "https://cdn.test/logo.png" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ logo_url: "https://cdn.test/logo.png" })
  })

  it("sends null for an emptied logo and only the keys that changed", async () => {
    useDetail({ logo_url: "https://cdn.test/old.png" })
    const bodies = recordPatches()
    renderPage()
    await openProfile()

    fireEvent.change(screen.getByLabelText("URL logo"), {
      target: { value: "" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ logo_url: null })
    expect(Object.keys(bodies[0] ?? {})).not.toContain("name")
  })

  it("sends a changed country alone", async () => {
    const bodies = recordPatches()
    renderPage()
    await openProfile()
    await screen.findByRole("option", { name: "Singapore (SG)" })

    fireEvent.change(screen.getByLabelText("Negara"), {
      target: { value: "SG" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ country_code: "SG" })
  })

  it("rejects a non-http logo URL before any request", async () => {
    const bodies = recordPatches()
    renderPage()
    await openProfile()

    fireEvent.change(screen.getByLabelText("URL logo"), {
      target: { value: "javascript:alert(1)" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Simpan perubahan" }))

    expect(
      await screen.findByText("URL logo harus diawali https://.")
    ).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })
})

describe("TenantDetailPage is_active (REQ-FE-023, REQ-FE-025)", () => {
  it("deactivates only after the confirm dialog, then follows the server", async () => {
    const bodies = recordPatches()
    renderPage()
    const toggle = await screen.findByRole("switch", { name: "Status tenant" })
    expect(toggle).toHaveAttribute("aria-checked", "true")

    // Make the refetch after the PATCH return the inactive tenant.
    useDetail({ is_active: false })
    fireEvent.click(toggle)
    const dialog = await screen.findByRole("dialog")
    expect(bodies).toHaveLength(0)
    fireEvent.click(within(dialog).getByRole("button", { name: "Nonaktifkan" }))

    await waitFor(() => expect(bodies).toEqual([{ is_active: false }]))
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "Status tenant" })
      ).toHaveAttribute("aria-checked", "false")
    )
  })

  it("sends nothing when the confirm dialog is cancelled", async () => {
    const bodies = recordPatches()
    renderPage()
    fireEvent.click(
      await screen.findByRole("switch", { name: "Status tenant" })
    )

    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(bodies).toHaveLength(0)
    expect(
      screen.getByRole("switch", { name: "Status tenant" })
    ).toHaveAttribute("aria-checked", "true")
  })

  it("reverts and shows the server message on 503, with no optimistic update", async () => {
    server.use(
      http.patch(`${API}/tenants/:id`, () =>
        errorResponse(
          503,
          "SERVICE_UNAVAILABLE",
          "Auth service is unavailable. Tenant status was not changed."
        )
      )
    )
    renderPage()
    fireEvent.click(
      await screen.findByRole("switch", { name: "Status tenant" })
    )
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Nonaktifkan" }))

    expect(
      await screen.findByText(
        "Auth service is unavailable. Tenant status was not changed."
      )
    ).toBeInTheDocument()
    expect(
      screen.getByRole("switch", { name: "Status tenant" })
    ).toHaveAttribute("aria-checked", "true")
  })

  it("reactivates without a confirm dialog", async () => {
    useDetail({ is_active: false })
    const bodies = recordPatches()
    renderPage()

    fireEvent.click(
      await screen.findByRole("switch", { name: "Status tenant" })
    )

    await waitFor(() => expect(bodies).toEqual([{ is_active: true }]))
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

describe("TenantDetailPage admin account (REQ-FE-024, SP-BG-01)", () => {
  it("always offers the resend button and calls the endpoint after the confirm dialog", async () => {
    let calls = 0
    server.use(
      http.post(`${API}/tenants/:id/admin-account`, () => {
        calls += 1
        return HttpResponse.json({
          tenant_id: FIXTURE_TENANT.id,
          admin_account: {
            status: "CREATED",
            user_status: "PENDING",
            tenant_status_sync: "SYNCED",
          },
        })
      })
    )
    renderPage()

    fireEvent.click(
      await screen.findByRole("button", { name: "Kirim ulang akun admin" })
    )
    const dialog = await screen.findByRole("dialog")
    expect(calls).toBe(0)
    fireEvent.click(within(dialog).getByRole("button", { name: "Kirim ulang" }))

    await waitFor(() => expect(calls).toBe(1))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Tenant dibuat, akun admin dikirim ke e-mail"
      )
    )
  })

  it("shows the sync warning when the retry answers sync FAILED", async () => {
    server.use(
      http.post(`${API}/tenants/:id/admin-account`, () =>
        HttpResponse.json(FIXTURE_ADMIN_ACCOUNT_RETRY_SYNC_FAILED)
      )
    )
    renderPage()

    fireEvent.click(
      await screen.findByRole("button", { name: "Kirim ulang akun admin" })
    )
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Kirim ulang" }))

    expect(
      await screen.findByText("Status tenant belum tersinkron ke auth")
    ).toBeInTheDocument()
  })
})

describe("TenantDetailPage logo (D9, D15)", () => {
  it("renders an https logo as an image", async () => {
    useDetail({ logo_url: "https://cdn.test/logo.png" })
    renderPage()

    const image = await screen.findByRole("img", {
      name: "Logo Klinik Andalas Dev",
    })
    expect(image).toHaveAttribute("src", "https://cdn.test/logo.png")
  })

  it("does not render a logo with a non-https, non-http scheme", async () => {
    useDetail({ logo_url: "javascript:alert(1)" })
    renderPage()

    await screen.findByRole("heading", { name: "Klinik Andalas Dev" })
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("does not render a data: logo", async () => {
    useDetail({ logo_url: "data:image/svg+xml,<svg/>" })
    renderPage()

    await screen.findByRole("heading", { name: "Klinik Andalas Dev" })
    expect(screen.queryByRole("img")).toBeNull()
  })
})
