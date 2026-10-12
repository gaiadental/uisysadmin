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
  CATEGORY_CODE_DUPLICATE,
  CATEGORY_IN_USE_MESSAGE,
} from "@/test/handlers/catalog"
import {
  FIXTURE_CATEGORY,
  FIXTURE_CATEGORY_GENERAL,
  listBody,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { TenantCategoryListPage } from "./tenant-category-list-page"

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
  window.history.replaceState(null, "", "/tenant-categories")
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
        <TenantCategoryListPage />
      </DialogsProvider>
    </QueryClientProvider>
  )
}

/** Records bodies of requests to a write handler and answers with the default. */
function recordBodies(
  method: "post" | "put",
  path: string,
  answer: (body: Record<string, unknown>) => Response
): Array<Record<string, unknown>> {
  const bodies: Array<Record<string, unknown>> = []
  server.use(
    http[method](`${API}${path}`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      bodies.push(body)
      return answer(body)
    })
  )
  return bodies
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe("TenantCategoryListPage list states", () => {
  it("shows a loading status, then the rows without tenant counts", async () => {
    renderPage()
    expect(screen.getByRole("status")).toHaveTextContent("Memuat kategori")
    expect(await screen.findByText("DENTAL")).toBeInTheDocument()
    expect(screen.getByText("General Clinic")).toBeInTheDocument()
    expect(screen.queryByText(/jumlah tenant/i)).not.toBeInTheDocument()
  })

  it("shows the empty state", async () => {
    server.use(
      http.get(`${API}/tenant-categories`, () => HttpResponse.json(listBody([])))
    )
    renderPage()
    expect(await screen.findByText("Belum ada kategori tenant.")).toBeInTheDocument()
  })

  it("shows an error with a retry that reloads", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/tenant-categories`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(500, "INTERNAL_ERROR", "boom")
          : HttpResponse.json(listBody([FIXTURE_CATEGORY]))
      })
    )
    renderPage()
    expect(await screen.findByRole("alert")).toHaveTextContent("Data tidak dapat dimuat")
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }))
    expect(await screen.findByText("DENTAL")).toBeInTheDocument()
  })
})

describe("create", () => {
  it("posts code and name, disables the submit while in flight, then refetches the list", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let posts = 0
    let lists = 0
    server.use(
      http.get(`${API}/tenant-categories`, () => {
        lists += 1
        return HttpResponse.json(listBody([FIXTURE_CATEGORY]))
      }),
      http.post(`${API}/tenant-categories`, async ({ request }) => {
        posts += 1
        const body = (await request.json()) as Record<string, unknown>
        await gate
        return HttpResponse.json(
          { ...FIXTURE_CATEGORY_GENERAL, code: body.code, name: body.name },
          { status: 201 }
        )
      })
    )
    renderPage()
    await screen.findByText("DENTAL")
    fireEvent.click(screen.getByRole("button", { name: "Tambah kategori" }))
    fill("Kode kategori", "GENERAL")
    fill("Nama kategori", "General Clinic")
    const submit = screen.getByRole("button", { name: "Buat kategori" })
    fireEvent.click(submit)
    await waitFor(() => expect(screen.getByRole("button", { name: "Menyimpan..." })).toBeDisabled())
    fireEvent.click(screen.getByRole("button", { name: "Menyimpan..." }))
    release()
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(posts).toBe(1)
    await waitFor(() => expect(lists).toBeGreaterThanOrEqual(2))
    expect(toastMock.success).toHaveBeenCalledWith("Kategori dibuat.")
  })

  it("validates before sending", async () => {
    let posts = 0
    server.use(
      http.post(`${API}/tenant-categories`, () => {
        posts += 1
        return HttpResponse.json(FIXTURE_CATEGORY, { status: 201 })
      })
    )
    renderPage()
    await screen.findByText("DENTAL")
    fireEvent.click(screen.getByRole("button", { name: "Tambah kategori" }))
    fireEvent.click(screen.getByRole("button", { name: "Buat kategori" }))
    expect(await screen.findByText("Kode kategori wajib diisi.")).toBeInTheDocument()
    expect(screen.getByText("Nama kategori wajib diisi.")).toBeInTheDocument()
    expect(posts).toBe(0)
  })

  it("shows the 409 message in the dialog and keeps it open", async () => {
    renderPage()
    await screen.findByText("DENTAL")
    fireEvent.click(screen.getByRole("button", { name: "Tambah kategori" }))
    fill("Kode kategori", CATEGORY_CODE_DUPLICATE)
    fill("Nama kategori", "X")
    fireEvent.click(screen.getByRole("button", { name: "Buat kategori" }))
    const dialog = await screen.findByRole("dialog")
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Tenant category code already exists."
    )
  })
})

describe("edit (immutable code)", () => {
  it("shows the code read-only and sends no code on PUT", async () => {
    const bodies = recordBodies("put", "/tenant-categories/:id", (body) =>
      HttpResponse.json({ ...FIXTURE_CATEGORY, name: body.name, is_active: body.is_active })
    )
    renderPage()
    await screen.findByText("DENTAL")
    fireEvent.click(screen.getByRole("button", { name: "Ubah kategori Dental Clinic" }))
    const code = await screen.findByLabelText("Kode kategori")
    expect(code).toHaveAttribute("readonly")
    expect(code).toHaveValue("DENTAL")
    fireEvent.change(code, { target: { value: "HACK" } })
    expect(code).toHaveValue("DENTAL")
    fill("Nama kategori", "Dental Clinic 2")
    fireEvent.click(screen.getByRole("switch", { name: "Kategori aktif" }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      name: "Dental Clinic 2",
      description: "Klinik gigi",
      is_active: false,
    })
    expect(bodies[0]).not.toHaveProperty("code")
  })
})

describe("delete", () => {
  it("asks for confirmation and does nothing on cancel", async () => {
    let deletes = 0
    server.use(
      http.delete(`${API}/tenant-categories/:id`, () => {
        deletes += 1
        return new HttpResponse(null, { status: 204 })
      })
    )
    renderPage()
    await screen.findByText("General Clinic")
    fireEvent.click(screen.getByRole("button", { name: "Hapus kategori General Clinic" }))
    const dialog = await screen.findByRole("dialog")
    expect(dialog).toHaveTextContent("Hapus kategori General Clinic?")
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(deletes).toBe(0)
  })

  it("deletes after confirmation and refetches", async () => {
    let deletes = 0
    let lists = 0
    server.use(
      http.get(`${API}/tenant-categories`, () => {
        lists += 1
        return HttpResponse.json(listBody([FIXTURE_CATEGORY, FIXTURE_CATEGORY_GENERAL]))
      }),
      http.delete(`${API}/tenant-categories/:id`, () => {
        deletes += 1
        return new HttpResponse(null, { status: 204 })
      })
    )
    renderPage()
    await screen.findByText("General Clinic")
    fireEvent.click(screen.getByRole("button", { name: "Hapus kategori General Clinic" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Hapus" }))
    await waitFor(() => expect(deletes).toBe(1))
    await waitFor(() => expect(lists).toBeGreaterThanOrEqual(2))
  })

  it("shows the 409 in-use message next to the table and keeps the row", async () => {
    renderPage()
    await screen.findByText("DENTAL")
    fireEvent.click(screen.getByRole("button", { name: "Hapus kategori Dental Clinic" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Hapus" }))
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(CATEGORY_IN_USE_MESSAGE)
    expect(alert).toHaveTextContent("Dental Clinic")
    expect(screen.getByText("DENTAL")).toBeInTheDocument()
  })
})
