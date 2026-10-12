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
import { API, errorResponse } from "@/test/handlers/auth"
import {
  COUNTRY_CODE_TAKEN_MESSAGE,
  COUNTRY_IN_USE_MESSAGE,
} from "@/test/handlers/catalog"
import {
  FIXTURE_COUNTRY,
  FIXTURE_COUNTRY_SG,
  listBody,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { CountryListPage } from "./country-list-page"
import { confirmPermanent } from "@/test/confirm"

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock("sonner", () => ({ toast: toastMock }))

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  window.history.replaceState(null, "", "/countries")
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  toastMock.success.mockClear()
})

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <DialogsProvider>
        <CountryListPage />
      </DialogsProvider>
    </QueryClientProvider>
  )
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe("CountryListPage list states", () => {
  it("shows a loading status, then the rows without tenant counts", async () => {
    renderPage()
    expect(screen.getByRole("status")).toHaveTextContent("Memuat negara")
    expect(await screen.findByText("Indonesia")).toBeInTheDocument()
    expect(screen.getByText("Singapore")).toBeInTheDocument()
    expect(screen.queryByText(/jumlah tenant/i)).not.toBeInTheDocument()
  })

  it("shows the empty state", async () => {
    server.use(
      http.get(`${API}/countries`, () => HttpResponse.json(listBody([])))
    )
    renderPage()
    expect(await screen.findByText("Belum ada negara.")).toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/countries`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(500, "INTERNAL_ERROR", "boom")
          : HttpResponse.json(listBody([FIXTURE_COUNTRY]))
      })
    )
    renderPage()
    expect(await screen.findByRole("alert")).toHaveTextContent("Data tidak dapat dimuat")
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }))
    expect(await screen.findByText("Indonesia")).toBeInTheDocument()
  })
})

describe("create", () => {
  it("uppercases the code as the user types", async () => {
    renderPage()
    await screen.findByText("Indonesia")
    fireEvent.click(screen.getByRole("button", { name: "Tambah negara" }))
    fill("Kode negara", "sg")
    expect(screen.getByLabelText("Kode negara")).toHaveValue("SG")
  })

  it("rejects a code that is not two letters before sending", async () => {
    let posts = 0
    server.use(
      http.post(`${API}/countries`, () => {
        posts += 1
        return HttpResponse.json(FIXTURE_COUNTRY_SG, { status: 201 })
      })
    )
    renderPage()
    await screen.findByText("Indonesia")
    fireEvent.click(screen.getByRole("button", { name: "Tambah negara" }))
    fill("Kode negara", "s1")
    fill("Nama negara", "Singapore")
    fireEvent.click(screen.getByRole("button", { name: "Buat negara" }))
    expect(await screen.findByText(/Kode negara harus 2 huruf besar/)).toBeInTheDocument()
    expect(posts).toBe(0)
  })

  it("posts the upper-case code, disables the submit in flight and refetches", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const bodies: Array<Record<string, unknown>> = []
    let lists = 0
    server.use(
      http.get(`${API}/countries`, () => {
        lists += 1
        return HttpResponse.json(listBody([FIXTURE_COUNTRY]))
      }),
      http.post(`${API}/countries`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        await gate
        return HttpResponse.json(FIXTURE_COUNTRY_SG, { status: 201 })
      })
    )
    renderPage()
    await screen.findByText("Indonesia")
    fireEvent.click(screen.getByRole("button", { name: "Tambah negara" }))
    fill("Kode negara", "sg")
    fill("Nama negara", "Singapore")
    fill("Kode telepon (opsional)", "+65")
    fireEvent.click(screen.getByRole("button", { name: "Buat negara" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Menyimpan..." })).toBeDisabled())
    fireEvent.click(screen.getByRole("button", { name: "Menyimpan..." }))
    release()
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(bodies).toEqual([{ code: "SG", name: "Singapore", phone_code: "+65" }])
    await waitFor(() => expect(lists).toBeGreaterThanOrEqual(2))
  })

  it("shows the 409 message on the code field", async () => {
    renderPage()
    await screen.findByText("Indonesia")
    fireEvent.click(screen.getByRole("button", { name: "Tambah negara" }))
    fill("Kode negara", "id")
    fill("Nama negara", "Indonesia")
    fireEvent.click(screen.getByRole("button", { name: "Buat negara" }))
    expect(await screen.findByText(COUNTRY_CODE_TAKEN_MESSAGE)).toBeInTheDocument()
    expect(screen.getByLabelText("Kode negara")).toHaveAttribute("aria-invalid", "true")
  })
})

describe("edit (immutable code)", () => {
  it("shows the code read-only and sends no code on PUT", async () => {
    const bodies: Array<Record<string, unknown>> = []
    let path = ""
    server.use(
      http.put(`${API}/countries/:code`, async ({ request, params }) => {
        path = String(params.code)
        bodies.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json(FIXTURE_COUNTRY_SG)
      })
    )
    renderPage()
    await screen.findByText("Singapore")
    fireEvent.click(screen.getByRole("button", { name: "Ubah negara Singapore" }))
    const code = await screen.findByLabelText("Kode negara")
    expect(code).toHaveAttribute("readonly")
    expect(code).toHaveValue("SG")
    fill("Nama negara", "Republic of Singapore")
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(path).toBe("SG")
    expect(bodies[0]).toEqual({
      name: "Republic of Singapore",
      nationality_name: "Singaporean",
      phone_code: "+65",
      is_active: true,
    })
    expect(bodies[0]).not.toHaveProperty("code")
  })
})

describe("delete", () => {
  it("says that delete is permanent for the code and suggests deactivating", async () => {
    let deletes = 0
    server.use(
      http.delete(`${API}/countries/:code`, () => {
        deletes += 1
        return new HttpResponse(null, { status: 204 })
      })
    )
    renderPage()
    await screen.findByText("Singapore")
    fireEvent.click(screen.getByRole("button", { name: "Hapus negara Singapore" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("Hapus negara SG?")
    expect(dialog).toHaveTextContent("Kode SG tidak dapat dipakai lagi untuk negara baru")
    expect(dialog).toHaveTextContent("Negara yang dipakai tenant tidak dapat dihapus")
    expect(dialog).toHaveTextContent("sebaiknya nonaktifkan saja")
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(deletes).toBe(0)
  })

  it("deletes after confirmation", async () => {
    let deletedCode = ""
    server.use(
      http.delete(`${API}/countries/:code`, ({ params }) => {
        deletedCode = String(params.code)
        return new HttpResponse(null, { status: 204 })
      })
    )
    renderPage()
    await screen.findByText("Singapore")
    fireEvent.click(screen.getByRole("button", { name: "Hapus negara Singapore" }))
    const dialog = await screen.findByRole("dialog")
    confirmPermanent(dialog, "Hapus permanen")
    await waitFor(() => expect(deletedCode).toBe("SG"))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Negara dihapus."))
  })

  it("shows the 409 in-use message next to the table and keeps the row", async () => {
    renderPage()
    await screen.findByText("Indonesia")
    fireEvent.click(screen.getByRole("button", { name: "Hapus negara Indonesia" }))
    const dialog = await screen.findByRole("dialog")
    confirmPermanent(dialog, "Hapus permanen")
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(COUNTRY_IN_USE_MESSAGE)
    expect(alert).toHaveTextContent("Indonesia")
    expect(screen.getByText("Indonesia")).toBeInTheDocument()
  })
})
