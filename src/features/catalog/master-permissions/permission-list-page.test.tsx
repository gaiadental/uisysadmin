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
import { queryKeys } from "@/lib/query/keys"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import {
  PERMISSION_IN_USE_MESSAGE,
  PERMISSION_KEY_TAKEN,
  PERMISSION_KEY_TAKEN_MESSAGE,
} from "@/test/handlers/catalog"
import { FIXTURE_MASTER_PERMISSION_BRANCHES } from "@/test/handlers/tenant-permissions"
import { server } from "@/test/server"

import { PermissionListPage } from "./permission-list-page"
import { confirmPermanent } from "@/test/confirm"

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
]

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL
  window.history.replaceState(null, "", "/master-permissions")
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
        <PermissionListPage />
      </DialogsProvider>
    </QueryClientProvider>
  )
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

/** The customer-flag confirm dialog. It opens after validation, so this waits for its title. */
async function findCustomerConfirm(): Promise<HTMLElement> {
  const title = await screen.findByText("Ubah akses role pelanggan?")
  const dialog = title.closest("[role='dialog']")
  if (!(dialog instanceof HTMLElement)) {
    throw new Error("The confirm dialog was not found.")
  }
  return dialog
}

describe("list states", () => {
  it("shows a loading status, then the rows with no locked flag or tenant count", async () => {
    renderPage()
    expect(screen.getByRole("status")).toHaveTextContent("Memuat permission")
    expect(await screen.findByText("branches:view")).toBeInTheDocument()
    expect(screen.getByText("reports:view")).toBeInTheDocument()
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
          : HttpResponse.json({ data: [FIXTURE_MASTER_PERMISSION_BRANCHES] })
      })
    )
    renderPage()
    expect(await screen.findByRole("alert")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }))
    expect(await screen.findByText("branches:view")).toBeInTheDocument()
  })

  it("filters on the client and shows a no-match message", async () => {
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.change(screen.getByLabelText("Cari permission"), {
      target: { value: "reports" },
    })
    expect(screen.queryByText("branches:view")).not.toBeInTheDocument()
    expect(screen.getByText("reports:view")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Cari permission"), {
      target: { value: "zzz" },
    })
    expect(
      screen.getByText("Tidak ada permission yang cocok.")
    ).toBeInTheDocument()
  })
})

describe("gates (D6.4)", () => {
  it("hides create, edit and delete when only :view is granted", async () => {
    authMock.permissions = [VIEW]
    renderPage()
    await screen.findByText("branches:view")
    expect(
      screen.queryByRole("button", { name: "Tambah permission" })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Ubah/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Hapus/ })).not.toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: "Aksi" })
    ).not.toBeInTheDocument()
  })

  it.each([
    ["master_permissions:create", "Tambah permission", null],
    ["master_permissions:update", null, /Ubah permission/],
    ["master_permissions:delete", null, /Hapus permission/],
  ])("%s shows only its own action", async (key, pageButton, rowButton) => {
    authMock.permissions = [VIEW, key as string]
    renderPage()
    await screen.findByText("branches:view")
    const createButton = screen.queryByRole("button", {
      name: "Tambah permission",
    })
    const edit = screen.queryAllByRole("button", { name: /Ubah permission/ })
    const del = screen.queryAllByRole("button", { name: /Hapus permission/ })
    expect(createButton !== null).toBe(pageButton !== null)
    expect(edit.length > 0).toBe(rowButton?.source === "Ubah permission")
    expect(del.length > 0).toBe(rowButton?.source === "Hapus permission")
  })
})

describe("create", () => {
  it("rejects blank required fields before sending", async () => {
    let posts = 0
    server.use(
      http.post(`${API}/master-permissions`, () => {
        posts += 1
        return HttpResponse.json({ data: FIXTURE_MASTER_PERMISSION_BRANCHES })
      })
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(screen.getByRole("button", { name: "Tambah permission" }))
    fireEvent.click(screen.getByRole("button", { name: "Buat permission" }))
    expect(await screen.findByText("Key wajib diisi.")).toBeInTheDocument()
    expect(posts).toBe(0)
  })

  it("sends the body, disables the submit in flight, refetches and toasts", async () => {
    let posts = 0
    let sent: Record<string, unknown> = {}
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.post(`${API}/master-permissions`, async ({ request }) => {
        posts += 1
        sent = (await request.json()) as Record<string, unknown>
        await gate
        return HttpResponse.json({
          data: { ...FIXTURE_MASTER_PERMISSION_BRANCHES, id: 50, ...sent },
        })
      })
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(screen.getByRole("button", { name: "Tambah permission" }))
    fill("Key", "tenants:view")
    fill("Nama", "View tenants")
    fill("Kategori", "TENANT")
    fill("Modul", "master")
    const submit = screen.getByRole("button", { name: "Buat permission" })
    fireEvent.click(submit)
    await waitFor(() => expect(posts).toBe(1))
    expect(screen.getByRole("button", { name: "Menyimpan..." })).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Menyimpan..." }))
    release()
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission dibuat.")
    )
    expect(posts).toBe(1)
    expect(sent).toMatchObject({
      key: "tenants:view",
      active: true,
      customerPermitted: false,
    })
    expect(sent).not.toHaveProperty("description")
  })

  it("shows the 409 message on the key field and keeps the dialog open", async () => {
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(screen.getByRole("button", { name: "Tambah permission" }))
    fill("Key", PERMISSION_KEY_TAKEN)
    fill("Nama", "View reports")
    fill("Kategori", "REPORT")
    fill("Modul", "reporting")
    fireEvent.click(screen.getByRole("button", { name: "Buat permission" }))
    expect(
      await screen.findByText(PERMISSION_KEY_TAKEN_MESSAGE)
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Key")).toHaveAttribute("aria-invalid", "true")
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})

describe("edit", () => {
  it("shows the key read-only and sends every current value with the key unchanged", async () => {
    let sent: Record<string, unknown> = {}
    let path = ""
    server.use(
      http.patch(`${API}/master-permissions/:id`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        path = new URL(request.url).pathname
        return HttpResponse.json({
          data: { ...FIXTURE_MASTER_PERMISSION_BRANCHES, ...sent },
        })
      })
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission branches:view" })
    )
    const keyInput = screen.getByLabelText("Key")
    expect(keyInput).toHaveAttribute("readonly")
    expect(keyInput).toHaveValue("branches:view")

    fill("Nama", "View all branches")
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission disimpan.")
    )
    expect(path).toBe("/api/v1/master-permissions/1")
    expect(sent).toEqual({
      key: "branches:view",
      name: "View all branches",
      description: "Read branches",
      category: "branches",
      module: "clinic",
      active: true,
      customerPermitted: false,
    })
  })
})

describe("delete", () => {
  async function openDelete(key: string) {
    renderPage()
    await screen.findByText(key)
    fireEvent.click(screen.getByRole("button", { name: `Hapus permission ${key}` }))
    return screen.findByRole("dialog")
  }

  it("does not delete when the confirmation is cancelled", async () => {
    let deletes = 0
    server.use(
      http.delete(`${API}/master-permissions/:id`, () => {
        deletes += 1
        return HttpResponse.json({ data: null })
      })
    )
    const dialog = await openDelete("reports:view")
    expect(dialog).toHaveTextContent("reports:view")
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(deletes).toBe(0)
  })

  it("deletes after confirmation and toasts", async () => {
    const dialog = await openDelete("reports:view")
    confirmPermanent(dialog, "Hapus")
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission dihapus.")
    )
  })

  it("shows the 409 message next to the table when the permission is bound", async () => {
    const dialog = await openDelete("branches:view")
    confirmPermanent(dialog, "Hapus")
    expect(
      await screen.findByText(new RegExp(PERMISSION_IN_USE_MESSAGE))
    ).toBeInTheDocument()
    expect(screen.getByText("branches:view")).toBeInTheDocument()
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})

describe("gates, each key independently (D6.4)", () => {
  it(":create alone shows the page button but no Aksi column", async () => {
    authMock.permissions = [VIEW, "master_permissions:create"]
    renderPage()
    await screen.findByText("branches:view")
    expect(screen.getByRole("button", { name: "Tambah permission" })).toBeInTheDocument()
    expect(
      screen.queryByRole("columnheader", { name: "Aksi" })
    ).not.toBeInTheDocument()
  })

  it(":update alone shows Ubah without Hapus, :delete alone the reverse", async () => {
    authMock.permissions = [VIEW, "master_permissions:update"]
    renderPage()
    await screen.findByText("branches:view")
    expect(screen.getAllByRole("button", { name: /Ubah permission/ })).toHaveLength(3)
    expect(screen.queryByRole("button", { name: /Hapus permission/ })).toBeNull()
    cleanup()
    authMock.permissions = [VIEW, "master_permissions:delete"]
    renderPage()
    await screen.findByText("branches:view")
    expect(screen.getAllByRole("button", { name: /Hapus permission/ })).toHaveLength(3)
    expect(screen.queryByRole("button", { name: /Ubah permission/ })).toBeNull()
    expect(screen.getByRole("columnheader", { name: "Aksi" })).toBeInTheDocument()
  })
})

describe("client pagination (D5.4)", () => {
  function manyPermissions(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      ...FIXTURE_MASTER_PERMISSION_BRANCHES,
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
      tenant: queryClient.getQueryState(queryKeys.tenantPermissions.ofTenant("t1"))
        ?.isInvalidated,
      role: queryClient.getQueryState(queryKeys.rolePermissions.ofRole(5))
        ?.isInvalidated,
      master: queryClient.getQueryState(queryKeys.masterPermissions.all())
        ?.isInvalidated,
    })
  }

  it("create invalidates master, tenant and role permission queries", async () => {
    const read = seedFamilies()
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(screen.getByRole("button", { name: "Tambah permission" }))
    fill("Key", "tenants:view")
    fill("Nama", "View tenants")
    fill("Kategori", "TENANT")
    fill("Modul", "master")
    fireEvent.click(screen.getByRole("button", { name: "Buat permission" }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled())
    await waitFor(() => {
      expect(read().tenant).toBe(true)
      expect(read().role).toBe(true)
    })
  })

  it("edit and delete invalidate the same three families", async () => {
    const read = seedFamilies()
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission reports:view" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Permission disimpan."))
    await waitFor(() => expect(read().tenant).toBe(true))
    expect(read().role).toBe(true)

    queryClient.setQueryData(queryKeys.tenantPermissions.ofTenant("t1"), [])
    queryClient.setQueryData(queryKeys.rolePermissions.ofRole(5), [])
    fireEvent.click(
      screen.getByRole("button", { name: "Hapus permission reports:view" })
    )
    const dialog = await screen.findByRole("dialog")
    confirmPermanent(dialog, "Hapus")
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Permission dihapus."))
    expect(read().tenant).toBe(true)
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
    await screen.findByText("branches:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission reports:view" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await screen.findByRole("alert")
    expect(read().tenant).toBe(false)
    expect(read().role).toBe(false)
  })
})

describe("form validation limits in the dialog", () => {
  it("shows required messages on edit when fields are cleared and does not send", async () => {
    let patches = 0
    server.use(
      http.patch(`${API}/master-permissions/:id`, () => {
        patches += 1
        return HttpResponse.json({ data: FIXTURE_MASTER_PERMISSION_BRANCHES })
      })
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission branches:view" })
    )
    fill("Nama", "   ")
    fill("Kategori", "")
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    expect(await screen.findByText("Nama wajib diisi.")).toBeInTheDocument()
    expect(screen.getByText("Kategori wajib diisi.")).toBeInTheDocument()
    expect(patches).toBe(0)
  })

  it("caps the inputs at the contract lengths", async () => {
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(screen.getByRole("button", { name: "Tambah permission" }))
    expect(screen.getByLabelText("Key")).toHaveAttribute("maxlength", "100")
    expect(screen.getByLabelText("Nama")).toHaveAttribute("maxlength", "100")
    expect(screen.getByLabelText("Kategori")).toHaveAttribute("maxlength", "50")
    expect(screen.getByLabelText("Modul")).toHaveAttribute("maxlength", "50")
  })
})

describe("error paths", () => {
  it("edit failure shows an alert, keeps the dialog open and does not toast", async () => {
    server.use(
      http.patch(`${API}/master-permissions/:id`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission branches:view" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Permintaan gagal. Coba lagi.")
    expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled()
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("edit 409 shows the server message in the alert", async () => {
    server.use(
      http.patch(`${API}/master-permissions/:id`, () =>
        errorResponse(409, "RESOURCE_CONFLICT", "Conflict on update.")
      )
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission branches:view" })
    )
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Conflict on update.")
  })

  it("create 500 shows a generic alert, keeps typed values and allows retry", async () => {
    server.use(
      http.post(`${API}/master-permissions`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(screen.getByRole("button", { name: "Tambah permission" }))
    fill("Key", "tenants:view")
    fill("Nama", "View tenants")
    fill("Kategori", "TENANT")
    fill("Modul", "master")
    fireEvent.click(screen.getByRole("button", { name: "Buat permission" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Permintaan gagal. Coba lagi.")
    expect(screen.getByLabelText("Key")).toHaveValue("tenants:view")
    expect(screen.getByRole("button", { name: "Buat permission" })).toBeEnabled()
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("delete non-409 failure shows the generic message and keeps the row", async () => {
    server.use(
      http.delete(`${API}/master-permissions/:id`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    renderPage()
    await screen.findByText("reports:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Hapus permission reports:view" })
    )
    const dialog = await screen.findByRole("dialog")
    confirmPermanent(dialog, "Hapus")
    expect(
      await screen.findByText(/tidak dihapus\. Permintaan gagal/)
    ).toBeInTheDocument()
    expect(screen.getByText("reports:view")).toBeInTheDocument()
  })
})

describe("edit value fidelity", () => {
  it("sends active=false and customerPermitted=true as toggled, with a cleared description as an empty string", async () => {
    let sent: Record<string, unknown> = {}
    server.use(
      http.patch(`${API}/master-permissions/:id`, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ data: FIXTURE_MASTER_PERMISSION_BRANCHES })
      })
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission branches:view" })
    )
    fill("Deskripsi (opsional)", "")
    fireEvent.click(screen.getByRole("switch", { name: "Permission aktif" }))
    fireEvent.click(screen.getByRole("switch", { name: "Boleh dipakai role pelanggan" }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    const confirmDialog = await findCustomerConfirm()
    fireEvent.click(
      within(confirmDialog).getByRole("button", { name: "Simpan perubahan" })
    )
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled())
    expect(sent).toMatchObject({
      key: "branches:view",
      description: "",
      active: false,
      customerPermitted: true,
    })
  })

  it("prefills the stored flags instead of the fallbacks when the server provides them", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({
          data: [
            {
              ...FIXTURE_MASTER_PERMISSION_BRANCHES,
              active: false,
              customerPermitted: true,
            },
          ],
        })
      )
    )
    renderPage()
    await screen.findByText("branches:view")
    expect(screen.getByText("Boleh dipakai")).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission branches:view" })
    )
    expect(screen.getByRole("switch", { name: "Permission aktif" })).not.toBeChecked()
    expect(screen.getByRole("switch", { name: "Boleh dipakai role pelanggan" })).toBeChecked()
  })
})

describe("category and module combobox", () => {
  async function openCreate() {
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(screen.getByRole("button", { name: "Tambah permission" }))
  }

  function optionValues(input: HTMLElement): string[] {
    const listId = input.getAttribute("list")
    const list = listId === null ? null : document.getElementById(listId)
    if (!(list instanceof HTMLDataListElement)) {
      throw new Error("The field has no datalist.")
    }
    return Array.from(list.options, (option) => option.value)
  }

  function captureCreate() {
    const captured: { posts: number; sent: Record<string, unknown> } = {
      posts: 0,
      sent: {},
    }
    server.use(
      http.post(`${API}/master-permissions`, async ({ request }) => {
        captured.posts += 1
        captured.sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          data: { ...FIXTURE_MASTER_PERMISSION_BRANCHES, id: 50, ...captured.sent },
        })
      })
    )
    return captured
  }

  it("(a) offers the distinct categories and modules from the list data", async () => {
    await openCreate()
    const category = screen.getByRole("combobox", { name: "Kategori" })
    const module = screen.getByRole("combobox", { name: "Modul" })
    expect(optionValues(category)).toEqual(["branches", "reports", "system_users"])
    expect(optionValues(module)).toEqual(["auth", "clinic"])
  })

  it("(b) accepts a new category, shows the add helper and submits it", async () => {
    const captured = captureCreate()
    await openCreate()
    fill("Key", "wellness:view")
    fill("Nama", "View wellness")
    fill("Kategori", "  wellness ")
    fill("Modul", "clinic")
    expect(screen.getByText('Tambah "wellness" sebagai nilai baru.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Buat permission" }))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission dibuat.")
    )
    expect(captured.posts).toBe(1)
    expect(captured.sent).toMatchObject({
      key: "wellness:view",
      category: "wellness",
      module: "clinic",
    })
  })

  it("(c) submits the existing spelling when the typed value matches ignoring case", async () => {
    const captured = captureCreate()
    await openCreate()
    fill("Key", "branches:edit")
    fill("Nama", "Edit branches")
    fill("Kategori", "BRANCHES")
    fill("Modul", "Clinic")
    expect(screen.queryByText(/sebagai nilai baru/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Mirip dengan/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Buat permission" }))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission dibuat.")
    )
    expect(captured.sent).toMatchObject({ category: "branches", module: "clinic" })
  })

  it("shows a non-blocking similarity warning and still submits", async () => {
    const captured = captureCreate()
    await openCreate()
    fill("Key", "branch:edit")
    fill("Nama", "Edit branch")
    fill("Kategori", "Report")
    fill("Modul", "clinic")
    expect(
      screen.getByText("Mirip dengan 'reports'. Yakin ini nilai baru?")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Kategori")).toHaveAttribute("aria-invalid", "false")
    fireEvent.click(screen.getByRole("button", { name: "Buat permission" }))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission dibuat.")
    )
    expect(captured.sent).toMatchObject({ category: "Report" })
  })
})

describe("customerPermitted confirmation on edit", () => {
  it("(d) asks before saving a changed customer flag and sends only after confirmation", async () => {
    let patches = 0
    let sent: Record<string, unknown> = {}
    server.use(
      http.patch(`${API}/master-permissions/:id`, async ({ request }) => {
        patches += 1
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({
          data: { ...FIXTURE_MASTER_PERMISSION_BRANCHES, ...sent },
        })
      })
    )
    renderPage()
    await screen.findByText("branches:view")
    fireEvent.click(
      screen.getByRole("button", { name: "Ubah permission branches:view" })
    )
    expect(
      screen.getByText(
        "Role konteks pelanggan hanya boleh memegang permission ini jika diaktifkan. Perubahan dicatat sebagai security event."
      )
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("switch", { name: "Boleh dipakai role pelanggan" }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    const confirm = await findCustomerConfirm()
    expect(confirm).toHaveTextContent("Ubah akses role pelanggan?")
    expect(confirm).toHaveTextContent("security event")
    expect(patches).toBe(0)

    fireEvent.click(within(confirm).getByRole("button", { name: "Batal" }))
    await waitFor(() =>
      expect(screen.queryByText("Ubah akses role pelanggan?")).not.toBeInTheDocument()
    )
    expect(patches).toBe(0)
    expect(toastMock.success).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    const again = await findCustomerConfirm()
    fireEvent.click(within(again).getByRole("button", { name: "Simpan perubahan" }))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission disimpan.")
    )
    expect(patches).toBe(1)
    expect(sent).toMatchObject({ key: "branches:view", customerPermitted: true })
  })
})
