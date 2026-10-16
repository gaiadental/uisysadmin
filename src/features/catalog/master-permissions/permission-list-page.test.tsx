// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DialogsProvider } from "@/components/dialogs/dialogs"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import { FIXTURE_MASTER_PERMISSION_APPOINTMENT } from "@/test/handlers/tenant-permissions"
import { server } from "@/test/server"

import { PermissionListPage } from "./permission-list-page"

const authMock = vi.hoisted(() => ({ permissions: [] as string[] }))
vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => ({
    status: "authenticated",
    me: { ...FIXTURE_ME, permissions: authMock.permissions, branches: [] },
  }),
}))

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock("sonner", () => ({ toast: toastMock }))

const VIEW = "master_permissions:view"
const ALL = [
  VIEW,
  "master_permissions:create",
  "master_permissions:update",
  "master_permissions:delete",
  "master_permissions:activate",
  "master_permissions:deactivate",
]

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL
  window.history.replaceState(null, "", "/master-permissions")
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  // The shared fixture has no flags; the save needs them from the server.
  server.use(
    http.get(`${API}/master-permissions/:id`, () =>
      HttpResponse.json({
        data: {
          ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
          active: true,
          customerPermitted: false,
        },
      })
    )
  )
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
        <PermissionListPage />
      </DialogsProvider>
    </QueryClientProvider>
  )
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe("list states", () => {
  it("shows a loading status, then the rows with no locked flag or tenant count", async () => {
    renderPage()
    expect(screen.getByRole("status")).toHaveTextContent("Memuat permission")
    expect(await screen.findByText("appointment:view")).toBeInTheDocument()
    expect(screen.getByText("patient_profile:view")).toBeInTheDocument()
    expect(screen.queryByText(/terkunci|locked|core/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/jumlah tenant/i)).not.toBeInTheDocument()
  })

  it("shows the empty state", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({ data: [] })
      )
    )
    renderPage()
    expect(await screen.findByText("Belum ada permission.")).toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/master-permissions`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(500, "INTERNAL_ERROR", "boom")
          : HttpResponse.json({ data: [FIXTURE_MASTER_PERMISSION_APPOINTMENT] })
      })
    )
    renderPage()
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }))
    expect(await screen.findByText("appointment:view")).toBeInTheDocument()
  })

  it("filters on the client and shows a no-match message", async () => {
    renderPage()
    await screen.findByText("appointment:view")
    fireEvent.change(screen.getByLabelText("Cari permission"), {
      target: { value: "patient" },
    })
    expect(screen.queryByText("appointment:view")).not.toBeInTheDocument()
    expect(screen.getByText("patient_profile:view")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Cari permission"), {
      target: { value: "zzz" },
    })
    expect(
      screen.getByText("Tidak ada permission yang cocok.")
    ).toBeInTheDocument()
  })
})

describe("gates (D6.4, TODO-021)", () => {
  it("offers no Ubah and no Aksi column with only :view", async () => {
    authMock.permissions = [VIEW]
    renderPage()
    await screen.findByText("appointment:view")
    expect(
      screen.queryByRole("button", { name: /Ubah/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: "Aksi" })
    ).not.toBeInTheDocument()
  })

  it("shows Ubah with :update", async () => {
    authMock.permissions = [VIEW, "master_permissions:update"]
    renderPage()
    await screen.findByText("appointment:view")
    expect(
      screen.getAllByRole("button", { name: /Ubah permission/ })
    ).toHaveLength(3)
  })

  it.each([
    "master_permissions:create",
    "master_permissions:delete",
    "master_permissions:activate",
    "master_permissions:deactivate",
  ])("%s alone shows no action at all", async (key) => {
    authMock.permissions = [VIEW, key]
    renderPage()
    await screen.findByText("appointment:view")
    expect(
      screen.queryByRole("button", { name: /Ubah|Tambah|Hapus/ })
    ).toBeNull()
    expect(screen.queryByRole("columnheader", { name: "Aksi" })).toBeNull()
  })

  it("renders no create, active or delete control even with every master_permissions key", async () => {
    authMock.permissions = ALL
    renderPage()
    await screen.findByText("appointment:view")
    expect(screen.queryByRole("button", { name: /Tambah/ })).toBeNull()
    expect(screen.queryByRole("button", { name: /Hapus/ })).toBeNull()
    expect(screen.queryByRole("switch")).toBeNull()
    expect(screen.queryByRole("checkbox")).toBeNull()
    expect(
      screen.getAllByRole("button", { name: /Ubah permission/ })
    ).toHaveLength(3)
  })
})

describe("edit dialog (TODO-021)", () => {
  async function openEdit(key = "appointment:view") {
    renderPage()
    await screen.findByText(key)
    fireEvent.click(
      screen.getByRole("button", { name: `Ubah permission ${key}` })
    )
    return screen.findByRole("dialog")
  }

  function capturePatch() {
    const seen: { count: number; body: Record<string, unknown>; path: string } =
      {
        count: 0,
        body: {},
        path: "",
      }
    server.use(
      http.patch(`${API}/master-permissions/:id`, async ({ request }) => {
        seen.count += 1
        seen.body = (await request.json()) as Record<string, unknown>
        seen.path = new URL(request.url).pathname
        return HttpResponse.json({
          data: { ...FIXTURE_MASTER_PERMISSION_APPOINTMENT, ...seen.body },
        })
      })
    )
    return seen
  }

  it("sends exactly one PATCH with the edited name and description", async () => {
    const seen = capturePatch()
    await openEdit()
    fill("Nama", "View all branches")
    fill("Deskripsi (opsional)", "")
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission disimpan.")
    )
    expect(seen.count).toBe(1)
    expect(seen.path).toBe("/api/v1/master-permissions/1")
    expect(seen.body).toEqual({
      key: "appointment:view",
      name: "View all branches",
      description: "",
      category: "appointment",
      module: "clinic",
      active: true,
      customerPermitted: false,
    })
  })

  it("sends the freshly fetched read-only values, not the stale list values", async () => {
    const seen = capturePatch()
    // The list was loaded with the default fixture; the server then changed.
    server.use(
      http.get(`${API}/master-permissions/:id`, () =>
        HttpResponse.json({
          data: {
            ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
            category: "branches_v2",
            module: "ops",
            active: false,
            customerPermitted: true,
          },
        })
      )
    )
    await openEdit()
    fill("Nama", "Renamed")
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => expect(seen.count).toBe(1))
    expect(seen.body).toEqual({
      key: "appointment:view",
      name: "Renamed",
      description: "Read appointments",
      category: "branches_v2",
      module: "ops",
      active: false,
      customerPermitted: true,
    })
  })

  it.each(["active", "customerPermitted"] as const)(
    "refuses to save and sends no PATCH when the re-fetch lacks %s",
    async (missing) => {
      const seen = capturePatch()
      const incomplete: Record<string, unknown> = {
        ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
        active: true,
        customerPermitted: true,
      }
      delete incomplete[missing]
      server.use(
        http.get(`${API}/master-permissions/:id`, () =>
          HttpResponse.json({ data: incomplete })
        )
      )
      await openEdit()
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent("tidak lengkap")
      expect(alert).toHaveTextContent("tidak disimpan")
      expect(seen.count).toBe(0)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled()
      expect(toastMock.success).not.toHaveBeenCalled()
    }
  )

  it("sends active=false and customerPermitted=true unchanged when both are present", async () => {
    const seen = capturePatch()
    server.use(
      http.get(`${API}/master-permissions/:id`, () =>
        HttpResponse.json({
          data: {
            ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
            active: false,
            customerPermitted: true,
          },
        })
      )
    )
    await openEdit()
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => expect(seen.count).toBe(1))
    expect(seen.body).toMatchObject({ active: false, customerPermitted: true })
  })

  it("re-fetches before the PATCH", async () => {
    const order: string[] = []
    server.use(
      http.get(`${API}/master-permissions/:id`, () => {
        order.push("GET")
        return HttpResponse.json({
          data: {
            ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
            active: true,
            customerPermitted: false,
          },
        })
      }),
      http.patch(`${API}/master-permissions/:id`, () => {
        order.push("PATCH")
        return HttpResponse.json({ data: FIXTURE_MASTER_PERMISSION_APPOINTMENT })
      })
    )
    await openEdit()
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled())
    expect(order).toEqual(["GET", "PATCH"])
  })

  it("shows key, category, module, active and customerPermitted as read-only text, not controls", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({
          data: [{ ...FIXTURE_MASTER_PERMISSION_APPOINTMENT, active: true }],
        })
      )
    )
    const dialog = await openEdit()
    expect(dialog).toHaveTextContent("appointment:view")
    expect(dialog).toHaveTextContent("appointment")
    expect(dialog).toHaveTextContent("clinic")
    expect(dialog).toHaveTextContent("Aktif")
    expect(dialog).toHaveTextContent("Internal")
    expect(screen.queryByLabelText("Key")).toBeNull()
    expect(screen.queryByLabelText("Kategori")).toBeNull()
    expect(screen.queryByLabelText("Modul")).toBeNull()
    expect(screen.queryByRole("switch")).toBeNull()
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(
      screen.getAllByRole("textbox").map((input) => input.getAttribute("id"))
    ).toEqual(["permission-name", "permission-description"])
  })

  it("blocks the PATCH when the re-fetch fails, shows the error and keeps the dialog open", async () => {
    const seen = capturePatch()
    server.use(
      http.get(`${API}/master-permissions/:id`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    await openEdit()
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Permintaan gagal. Coba lagi.")
    expect(seen.count).toBe(0)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled()
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("rejects a blank name before any request", async () => {
    const seen = capturePatch()
    await openEdit()
    fill("Nama", "   ")
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    expect(await screen.findByText("Nama wajib diisi.")).toBeInTheDocument()
    expect(seen.count).toBe(0)
  })

  it("caps the name input at the contract length", async () => {
    await openEdit()
    expect(screen.getByLabelText("Nama")).toHaveAttribute("maxlength", "100")
  })

  it("PATCH failure shows an alert, keeps the dialog open and does not toast", async () => {
    server.use(
      http.patch(`${API}/master-permissions/:id`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    await openEdit()
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Permintaan gagal. Coba lagi."
    )
    expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled()
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("PATCH 409 shows the server message in the alert", async () => {
    server.use(
      http.patch(`${API}/master-permissions/:id`, () =>
        errorResponse(409, "RESOURCE_CONFLICT", "Conflict on update.")
      )
    )
    await openEdit()
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Conflict on update."
    )
  })

  it("shows the stored status and customer flag from the list", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({
          data: [
            {
              ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
              active: false,
              customerPermitted: true,
            },
          ],
        })
      )
    )
    const dialog = await openEdit()
    expect(dialog).toHaveTextContent("Nonaktif")
    expect(dialog).toHaveTextContent("Boleh dipakai")
  })
})

describe("client pagination (D5.4)", () => {
  function manyPermissions(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
      id: index + 1,
      key: `item_${String(index + 1).padStart(2, "0")}:view`,
      name: `Item ${index + 1}`,
    }))
  }

  it("pages 25 items as 20 then 5 without a second request", async () => {
    let gets = 0
    server.use(
      http.get(`${API}/master-permissions`, () => {
        gets += 1
        return HttpResponse.json({ data: manyPermissions(25) })
      })
    )
    renderPage()
    await screen.findByText("item_01:view")
    expect(screen.getByText("item_20:view")).toBeInTheDocument()
    expect(screen.queryByText("item_21:view")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }))
    expect(await screen.findByText("item_21:view")).toBeInTheDocument()
    expect(screen.queryByText("item_01:view")).not.toBeInTheDocument()
    expect(gets).toBe(1)
  })

  it("returns to page 1 when the search changes", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({ data: manyPermissions(25) })
      )
    )
    renderPage()
    await screen.findByText("item_01:view")
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }))
    await screen.findByText("item_21:view")
    fireEvent.change(screen.getByLabelText("Cari permission"), {
      target: { value: "item_03" },
    })
    expect(await screen.findByText("item_03:view")).toBeInTheDocument()
  })
})

describe("invalidation (D12.1)", () => {
  function seedFamilies() {
    queryClient.setQueryData(queryKeys.tenantPermissions.ofTenant("t1"), [])
    queryClient.setQueryData(queryKeys.rolePermissions.ofRole(5), [])
    return () => ({
      tenant: queryClient.getQueryState(
        queryKeys.tenantPermissions.ofTenant("t1")
      )?.isInvalidated,
      role: queryClient.getQueryState(queryKeys.rolePermissions.ofRole(5))
        ?.isInvalidated,
    })
  }

  it("edit invalidates master, tenant and role permission queries", async () => {
    const read = seedFamilies()
    renderPage()
    await screen.findByText("appointment:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission patient_profile:view" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission disimpan.")
    )
    await waitFor(() => expect(read().tenant).toBe(true))
    expect(read().role).toBe(true)
  })

  it("a failed write invalidates nothing", async () => {
    const read = seedFamilies()
    server.use(
      http.patch(`${API}/master-permissions/:id`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    renderPage()
    await screen.findByText("appointment:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission patient_profile:view" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await screen.findByRole("alert")
    expect(read().tenant).toBe(false)
    expect(read().role).toBe(false)
  })
})

describe("scope column (REQ-FE-057, TODO-027)", () => {
  function rowOf(key: string) {
    const row = screen.getByText(key).closest("tr")
    if (row === null) throw new Error(`no row for ${key}`)
    return row
  }

  it("shows a Scope column with a PLATFORM or TENANT badge per row", async () => {
    renderPage()
    await screen.findByText("appointment:view")
    expect(
      screen.getByRole("columnheader", { name: "Scope" })
    ).toBeInTheDocument()
    expect(rowOf("system_users:view")).toHaveTextContent("PLATFORM")
    expect(rowOf("appointment:view")).toHaveTextContent("TENANT")
    expect(rowOf("patient_profile:view")).toHaveTextContent("TENANT")
  })

  it("has no scope filter", async () => {
    renderPage()
    await screen.findByText("appointment:view")
    expect(screen.queryByRole("combobox")).toBeNull()
    expect(screen.queryByRole("radio")).toBeNull()
    expect(screen.queryByLabelText(/scope/i)).toBeNull()
    expect(screen.queryByRole("button", { name: /scope/i })).toBeNull()
  })

  it("search also matches the scope", async () => {
    renderPage()
    await screen.findByText("appointment:view")
    fireEvent.change(screen.getByLabelText("Cari permission"), {
      target: { value: "platform" },
    })
    expect(screen.getByText("system_users:view")).toBeInTheDocument()
    expect(screen.queryByText("appointment:view")).not.toBeInTheDocument()
    expect(screen.queryByText("patient_profile:view")).not.toBeInTheDocument()
  })

  it("the empty-state row spans all eight columns with Aksi", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({ data: [] })
      )
    )
    renderPage()
    const message = await screen.findByText("Belum ada permission.")
    expect(message.closest("td")).toHaveAttribute("colspan", "8")
  })
})

describe("PATCH never sends scope (REQ-FE-057, TODO-027)", () => {
  it("omits scope even when the re-fetched permission carries it", async () => {
    authMock.permissions = ALL
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.get(`${API}/master-permissions/:id`, () =>
        HttpResponse.json({
          data: {
            ...FIXTURE_MASTER_PERMISSION_APPOINTMENT,
            active: true,
            customerPermitted: false,
            scope: "TENANT",
          },
        })
      ),
      http.patch(`${API}/master-permissions/:id`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json({
          data: { ...FIXTURE_MASTER_PERMISSION_APPOINTMENT, scope: "TENANT" },
        })
      })
    )
    renderPage()
    await screen.findByText("appointment:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission appointment:view" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).not.toHaveProperty("scope")
  })
})
