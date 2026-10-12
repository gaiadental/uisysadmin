// @vitest-environment jsdom
import { type QueryClient } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import { ROLE_KEY_TAKEN } from "@/test/handlers/system-roles"
import { server } from "@/test/server"

import { RoleListPage } from "./role-list-page"
import { ALL_ROLE_PERMISSIONS, renderWithClient } from "./test-support"
import { confirmPermanent } from "@/test/confirm"

const authMock = vi.hoisted(() => ({ permissions: [] as readonly string[] }))
vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => ({
    status: "authenticated",
    me: {
      ...FIXTURE_ME,
      permissions: [...authMock.permissions],
      branches: [],
    },
  }),
}))

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
  authMock.permissions = ALL_ROLE_PERMISSIONS
  window.history.replaceState(null, "", "/system-roles")
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

function renderList() {
  return renderWithClient(<RoleListPage />, queryClient)
}

function rowOf(name: string) {
  return screen.getByRole("link", { name }).closest("tr") as HTMLElement
}

describe("list, states and member counts", () => {
  it("shows a loading status, then the roles with derived member counts", async () => {
    renderList()
    expect(screen.getByRole("status")).toHaveTextContent("Memuat peran")

    await screen.findByRole("link", { name: "System Admin" })
    // Fixture users: one SYS_PRINCIPAL (self), three SYS_ADMIN.
    await waitFor(() => {
      expect(within(rowOf("System Principal")).getByText("1")).toBeInTheDocument()
      expect(within(rowOf("System Admin")).getByText("3")).toBeInTheDocument()
    })
  })

  it("reads member counts from the shared user list key", async () => {
    renderList()
    await screen.findByRole("link", { name: "System Admin" })
    await waitFor(() => {
      expect(queryClient.getQueryData(queryKeys.systemUsers.all())).toBeDefined()
    })
  })

  it("shows a dash and does not fetch users without system_users:view", async () => {
    authMock.permissions = ["system_roles:view"]
    let userCalls = 0
    server.use(
      http.get(`${API}/system-users`, () => {
        userCalls += 1
        return HttpResponse.json({ data: [] })
      })
    )
    renderList()

    await screen.findByRole("link", { name: "System Admin" })

    expect(within(rowOf("System Admin")).getAllByText("-").length).toBeGreaterThan(0)
    expect(userCalls).toBe(0)
  })

  it("shows an empty state", async () => {
    server.use(http.get(`${API}/system-roles`, () => HttpResponse.json({ data: [] })))
    renderList()

    expect(await screen.findByText("Belum ada peran.")).toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/system-roles`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(503, "SERVICE_UNAVAILABLE", "down")
          : HttpResponse.json({ data: [] })
      })
    )
    renderList()

    fireEvent.click(await screen.findByRole("button", { name: "Coba lagi" }))

    expect(await screen.findByText("Belum ada peran.")).toBeInTheDocument()
  })

  it("filters by search text", async () => {
    renderList()
    await screen.findByRole("link", { name: "System Admin" })

    fireEvent.change(screen.getByLabelText("Cari peran"), {
      target: { value: "principal" },
    })

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "System Admin" })).not.toBeInTheDocument()
    })
    expect(screen.getByRole("link", { name: "System Principal" })).toBeInTheDocument()
  })
})

describe("gates per key (D6.4)", () => {
  it("SYS_PRINCIPAL row has no edit or delete and shows the lock", async () => {
    renderList()
    await screen.findByRole("link", { name: "System Principal" })
    const row = rowOf("System Principal")

    expect(within(row).queryByRole("button")).not.toBeInTheDocument()
    expect(within(row).getByText("Terkunci")).toBeInTheDocument()
  })

  it("system_roles:update alone gives Ubah only; :delete alone gives Hapus only", async () => {
    authMock.permissions = ["system_roles:view", "system_roles:update"]
    const first = renderList()
    await screen.findByRole("link", { name: "System Admin" })
    expect(screen.getByRole("button", { name: "Ubah System Admin" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Hapus System Admin" })).not.toBeInTheDocument()
    first.unmount()

    authMock.permissions = ["system_roles:view", "system_roles:delete"]
    renderList()
    await screen.findByRole("link", { name: "System Admin" })
    expect(screen.getByRole("button", { name: "Hapus System Admin" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Ubah System Admin" })).not.toBeInTheDocument()
  })

  it("the create button needs system_roles:create", async () => {
    authMock.permissions = ["system_roles:view"]
    const first = renderList()
    await screen.findByRole("link", { name: "System Admin" })
    expect(screen.queryByRole("button", { name: "Tambah peran" })).not.toBeInTheDocument()
    first.unmount()

    authMock.permissions = ["system_roles:view", "system_roles:create"]
    renderList()
    expect(await screen.findByRole("button", { name: "Tambah peran" })).toBeInTheDocument()
  })

  it("disables edit and delete in the list after a BE refusal", async () => {
    server.use(
      http.delete(`${API}/system-roles/:id`, () =>
        errorResponse(403, "PLATFORM_ROLE_PROTECTED", "Operation not permitted.")
      )
    )
    renderList()
    await screen.findByRole("link", { name: "System Admin" })

    fireEvent.click(screen.getByRole("button", { name: "Hapus System Admin" }))
    confirmPermanent(await screen.findByRole("dialog"), "Hapus")

    expect(await screen.findByText("Operation not permitted.")).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Ubah System Admin" })).toBeDisabled()
    })
    expect(screen.getByRole("button", { name: "Hapus System Admin" })).toBeDisabled()
  })
})

describe("create dialog (SP-BG-11)", () => {
  async function openCreate() {
    fireEvent.click(await screen.findByRole("button", { name: "Tambah peran" }))
    return screen.findByRole("dialog")
  }

  it("validates required fields before sending", async () => {
    let posts = 0
    server.use(
      http.post(`${API}/system-roles`, () => {
        posts += 1
        return HttpResponse.json({ data: null })
      })
    )
    renderList()
    const dialog = await openCreate()

    fireEvent.click(within(dialog).getByRole("button", { name: "Buat peran" }))

    expect(await within(dialog).findByText("Key wajib diisi.")).toBeInTheDocument()
    expect(within(dialog).getByText("Nama wajib diisi.")).toBeInTheDocument()
    expect(posts).toBe(0)
  })

  it("sends one POST, disables the submit while in flight, and invalidates the role keys", async () => {
    const posts: unknown[] = []
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.post(`${API}/system-roles`, async ({ request }) => {
        posts.push(await request.json())
        await gate
        return HttpResponse.json({
          data: {
            id: 9,
            key: "OPS_ADMIN",
            name: "Ops Admin",
            description: null,
            active: true,
            createdAt: "2026-10-01T03:00:00Z",
            updatedAt: "2026-10-01T03:00:00Z",
          },
        })
      })
    )
    renderList()
    await screen.findByRole("link", { name: "System Admin" })
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const dialog = await openCreate()
    fireEvent.change(within(dialog).getByLabelText("Key"), {
      target: { value: "OPS_ADMIN" },
    })
    fireEvent.change(within(dialog).getByLabelText("Nama"), {
      target: { value: "Ops Admin" },
    })

    const submit = within(dialog).getByRole("button", { name: "Buat peran" })
    fireEvent.click(submit)
    await waitFor(() => {
      expect(
        within(dialog).getByRole("button", { name: "Menyimpan..." })
      ).toBeDisabled()
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Menyimpan..." }))
    release()

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Peran dibuat.")
    })
    expect(posts).toEqual([{ key: "OPS_ADMIN", name: "Ops Admin", active: true }])
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey)
    expect(keys).toContainEqual(queryKeys.systemRoles.all())
    expect(keys).toContainEqual(queryKeys.systemUsers.all())
  })

  it("shows a 409 on the key field", async () => {
    renderList()
    const dialog = await openCreate()
    fireEvent.change(within(dialog).getByLabelText("Key"), {
      target: { value: ROLE_KEY_TAKEN },
    })
    fireEvent.change(within(dialog).getByLabelText("Nama"), {
      target: { value: "Taken" },
    })

    fireEvent.click(within(dialog).getByRole("button", { name: "Buat peran" }))

    expect(
      await within(dialog).findByText("System role key already exists.")
    ).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Buat peran" })).toBeEnabled()
  })
})
