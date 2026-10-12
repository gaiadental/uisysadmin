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
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import {
  FIXTURE_USER_ACTIVE,
  FIXTURE_USER_DEACTIVATED,
  FIXTURE_USER_SELF,
  FIXTURE_USER_SUSPENDED,
  FIXTURE_USERS,
  LOGIN_TAKEN,
  LOGIN_TAKEN_MESSAGE,
  MISSING_ROLE_ID,
} from "@/test/handlers/system-users"
import { server } from "@/test/server"

import { ALL_USER_PERMISSIONS, renderWithClient } from "./test-support"
import { ROLE_NOT_FOUND_MESSAGE } from "./user-failure"
import { UserListPage } from "./user-list-page"

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
  authMock.permissions = ALL_USER_PERMISSIONS
  window.history.replaceState(null, "", "/system-users")
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
  return renderWithClient(<UserListPage />, queryClient)
}

async function ready() {
  await screen.findByText(FIXTURE_USER_ACTIVE.loginId)
}

function button(name: string | RegExp) {
  return screen.queryByRole("button", { name })
}

function rowOf(loginId: string): HTMLElement {
  return screen.getByRole("row", { name: new RegExp(loginId) })
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe("states (D13)", () => {
  it("shows a loading status, then the rows with loginId only", async () => {
    renderPage()

    expect(screen.getByRole("status")).toHaveTextContent("Memuat akun")
    await ready()
    expect(screen.getByText(FIXTURE_USER_SUSPENDED.loginId)).toBeInTheDocument()
    expect(screen.getByText("Ditangguhkan")).toBeInTheDocument()
    expect(screen.getByText("Dinonaktifkan")).toBeInTheDocument()
    expect(
      screen.queryByText(/terakhir aktif|last active/i)
    ).not.toBeInTheDocument()
  })

  it("shows the empty state", async () => {
    server.use(
      http.get(`${API}/system-users`, () => HttpResponse.json({ data: [] }))
    )
    renderPage()

    expect(await screen.findByText("Belum ada akun.")).toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/system-users`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(500, "INTERNAL_ERROR", "boom")
          : HttpResponse.json({ data: FIXTURE_USERS })
      })
    )
    renderPage()

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }))
    await ready()
  })

  it("filters on the client and shows a no-match message", async () => {
    renderPage()
    await ready()

    fireEvent.change(screen.getByLabelText("Cari akun"), {
      target: { value: "suspended@" },
    })
    expect(
      screen.queryByText(FIXTURE_USER_ACTIVE.loginId)
    ).not.toBeInTheDocument()
    expect(screen.getByText(FIXTURE_USER_SUSPENDED.loginId)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Cari akun"), {
      target: { value: "zzz" },
    })
    expect(screen.getByText("Tidak ada akun yang cocok.")).toBeInTheDocument()
  })

  it("links each login ID to its detail page", async () => {
    renderPage()
    await ready()

    expect(
      screen.getByRole("link", { name: FIXTURE_USER_ACTIVE.loginId })
    ).toHaveAttribute("href", `/system-users/${FIXTURE_USER_ACTIVE.id}`)
  })
})

describe("self-protection (D6.6)", () => {
  it("marks the own account with a self badge and no other row", async () => {
    renderPage()
    await ready()

    expect(
      within(rowOf(FIXTURE_USER_SELF.loginId)).getByText("self")
    ).toBeInTheDocument()
    expect(
      within(rowOf(FIXTURE_USER_ACTIVE.loginId)).queryByText("self")
    ).not.toBeInTheDocument()
    expect(screen.getAllByText("self")).toHaveLength(1)
  })

  it("offers no suspend, deactivate or delete for the own account even with every permission", async () => {
    renderPage()
    await ready()

    const own = within(rowOf(FIXTURE_USER_SELF.loginId))
    expect(
      own.queryByRole("button", { name: /Tangguhkan/ })
    ).not.toBeInTheDocument()
    expect(
      own.queryByRole("button", { name: /Nonaktifkan/ })
    ).not.toBeInTheDocument()
    expect(own.queryByRole("button", { name: /Hapus/ })).not.toBeInTheDocument()

    const other = within(rowOf(FIXTURE_USER_ACTIVE.loginId))
    expect(
      other.getByRole("button", { name: /Tangguhkan/ })
    ).toBeInTheDocument()
    expect(
      other.getByRole("button", { name: /Nonaktifkan/ })
    ).toBeInTheDocument()
    expect(other.getByRole("button", { name: /Hapus/ })).toBeInTheDocument()
  })
})

describe("gates (D6.4)", () => {
  it("offers the status actions that fit each status", async () => {
    renderPage()
    await ready()

    const suspended = within(rowOf(FIXTURE_USER_SUSPENDED.loginId))
    expect(
      suspended.getByRole("button", { name: /Aktifkan/ })
    ).toBeInTheDocument()
    expect(
      suspended.queryByRole("button", { name: /Tangguhkan/ })
    ).not.toBeInTheDocument()
    expect(
      suspended.getByRole("button", { name: /Nonaktifkan/ })
    ).toBeInTheDocument()

    const deactivated = within(rowOf(FIXTURE_USER_DEACTIVATED.loginId))
    expect(
      deactivated.getByRole("button", { name: /Aktifkan/ })
    ).toBeInTheDocument()
    expect(
      deactivated.queryByRole("button", { name: /Nonaktifkan/ })
    ).not.toBeInTheDocument()

    const active = within(rowOf(FIXTURE_USER_ACTIVE.loginId))
    expect(
      active.queryByRole("button", { name: /Aktifkan/ })
    ).not.toBeInTheDocument()
  })

  it("hides every action with system_users:view only", async () => {
    authMock.permissions = ["system_users:view"]
    renderPage()
    await ready()

    expect(button("Tambah akun")).not.toBeInTheDocument()
    expect(
      button(/Tangguhkan|Nonaktifkan|Aktifkan|Hapus|Reset password/)
    ).not.toBeInTheDocument()
  })

  it.each([
    [
      "system_users:update",
      /Tangguhkan|Nonaktifkan|Aktifkan/,
      /Hapus|Reset password/,
    ],
    [
      "system_users:delete",
      /Hapus/,
      /Tangguhkan|Nonaktifkan|Aktifkan|Reset password/,
    ],
    [
      "system_users:reset_password",
      /Reset password/,
      /Tangguhkan|Nonaktifkan|Aktifkan|Hapus/,
    ],
  ])("%s shows only its own actions", async (key, shown, hidden) => {
    authMock.permissions = ["system_users:view", key]
    renderPage()
    await ready()

    expect(
      screen.getAllByRole("button", { name: shown }).length
    ).toBeGreaterThan(0)
    expect(button(hidden)).not.toBeInTheDocument()
  })

  it("shows Tambah akun only with create and the role list", async () => {
    authMock.permissions = ["system_users:view", "system_users:create"]
    const first = renderPage()
    await ready()
    expect(button("Tambah akun")).not.toBeInTheDocument()
    first.unmount()

    authMock.permissions = [
      "system_users:view",
      "system_users:create",
      "system_roles:view",
    ]
    renderPage()
    await ready()
    expect(button("Tambah akun")).toBeInTheDocument()
  })
})

describe("confirm dialogs (REQ-FE-039)", () => {
  function recordStatus() {
    const calls: Array<{ path: string; body: unknown }> = []
    server.use(
      http.patch(`${API}/system-users/:id/status`, async ({ request }) => {
        calls.push({
          path: new URL(request.url).pathname,
          body: await request.json(),
        })
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      })
    )
    return calls
  }

  async function open(name: string) {
    renderPage()
    await ready()
    fireEvent.click(screen.getByRole("button", { name }))
    return screen.findByRole("dialog")
  }

  it.each([
    [
      "Tangguhkan ops@gaia.com",
      "Tangguhkan",
      "SUSPENDED",
      "Akun ditangguhkan.",
    ],
    [
      "Nonaktifkan ops@gaia.com",
      "Nonaktifkan",
      "DEACTIVATED",
      "Akun dinonaktifkan.",
    ],
  ])(
    "%s asks first, then sends the status",
    async (name, confirmLabel, status, toastText) => {
      const calls = recordStatus()
      const dialog = await open(name)

      expect(calls).toHaveLength(0)
      fireEvent.click(
        within(dialog).getByRole("button", { name: confirmLabel })
      )

      await waitFor(() =>
        expect(toastMock.success).toHaveBeenCalledWith(toastText)
      )
      expect(calls).toEqual([
        {
          path: `/api/v1/system-users/${FIXTURE_USER_ACTIVE.id}/status`,
          body: { status },
        },
      ])
    }
  )

  it("does nothing when the confirmation is cancelled", async () => {
    const calls = recordStatus()
    const dialog = await open("Tangguhkan ops@gaia.com")

    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(calls).toHaveLength(0)
  })

  it("reactivates with no confirmation dialog", async () => {
    const calls = recordStatus()
    renderPage()
    await ready()

    fireEvent.click(
      screen.getByRole("button", {
        name: `Aktifkan ${FIXTURE_USER_SUSPENDED.loginId}`,
      })
    )

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Akun diaktifkan kembali.")
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(calls[0]?.body).toEqual({ status: "ACTIVE" })
  })

  it("deletes after confirmation and refetches the list", async () => {
    let deletes = 0
    let lists = 0
    server.use(
      http.delete(`${API}/system-users/:id`, () => {
        deletes += 1
        return HttpResponse.json({ data: null })
      }),
      http.get(`${API}/system-users`, () => {
        lists += 1
        return HttpResponse.json({ data: FIXTURE_USERS })
      })
    )
    const dialog = await open("Hapus ops@gaia.com")
    expect(deletes).toBe(0)

    fireEvent.click(within(dialog).getByRole("button", { name: "Hapus" }))

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Akun dihapus.")
    )
    expect(deletes).toBe(1)
    await waitFor(() => expect(lists).toBe(2))
  })

  it("resets the password after confirmation and shows the e-mail notice", async () => {
    let posts = 0
    server.use(
      http.post(`${API}/system-users/:id/reset-password`, () => {
        posts += 1
        return HttpResponse.json({ data: null })
      })
    )
    const dialog = await open("Reset password ops@gaia.com")
    expect(posts).toBe(0)

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Reset password" })
    )

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Password sementara sudah dikirim ke e-mail user."
      )
    )
    expect(posts).toBe(1)
  })

  it("refetches ['system','users'] after a status change (D12.1)", async () => {
    let lists = 0
    server.use(
      http.get(`${API}/system-users`, () => {
        lists += 1
        return HttpResponse.json({ data: FIXTURE_USERS })
      })
    )
    recordStatus()
    const dialog = await open("Tangguhkan ops@gaia.com")
    expect(lists).toBe(1)
    fireEvent.click(within(dialog).getByRole("button", { name: "Tangguhkan" }))

    await waitFor(() => expect(lists).toBe(2))
  })

  it("disables every action while one is in flight and sends one request", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let calls = 0
    server.use(
      http.post(`${API}/system-users/:id/reset-password`, async () => {
        calls += 1
        await gate
        return HttpResponse.json({ data: null })
      })
    )
    const dialog = await open("Reset password ops@gaia.com")
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Reset password" })
    )

    await waitFor(() => expect(calls).toBe(1))
    const resetButton = screen.getByRole("button", {
      name: "Reset password ops@gaia.com",
    })
    expect(resetButton).toBeDisabled()
    expect(resetButton).toHaveTextContent("Mengirim...")
    expect(
      screen.getByRole("button", { name: "Hapus ops@gaia.com" })
    ).toBeDisabled()
    fireEvent.click(resetButton)
    release()
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled())
    expect(calls).toBe(1)
  })

  it("shows the forbidden copy on a 403 and keeps the screen", async () => {
    server.use(
      http.patch(`${API}/system-users/:id/status`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )
    const dialog = await open("Tangguhkan ops@gaia.com")
    fireEvent.click(within(dialog).getByRole("button", { name: "Tangguhkan" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Anda tidak punya akses untuk aksi ini."
    )
    expect(screen.getByText(FIXTURE_USER_ACTIVE.loginId)).toBeInTheDocument()
    expect(toastMock.success).not.toHaveBeenCalled()
  })
})

describe("create dialog (REQ-FE-030)", () => {
  async function openCreate() {
    renderPage()
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Tambah akun" }))
    await screen.findByRole("dialog")
    await screen.findByRole("option", { name: /System Admin/ })
  }

  it("rejects an invalid e-mail and a missing role before sending", async () => {
    let posts = 0
    server.use(
      http.post(`${API}/system-users`, () => {
        posts += 1
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      })
    )
    await openCreate()

    fill("Login ID (e-mail)", "not-an-email")
    fireEvent.click(screen.getByRole("button", { name: "Buat akun" }))

    expect(
      await screen.findByText("Login ID harus berupa alamat e-mail.")
    ).toBeInTheDocument()
    expect(screen.getByText("Peran wajib dipilih.")).toBeInTheDocument()
    expect(posts).toBe(0)
  })

  it("loads the role options from system-roles", async () => {
    await openCreate()

    expect(
      screen.getByRole("option", { name: /System Principal/ })
    ).toBeInTheDocument()
  })

  it("sends loginId and numeric systemRoleId, disables the submit in flight, refetches and toasts", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let posts = 0
    let sent: unknown
    let lists = 0
    server.use(
      http.get(`${API}/system-users`, () => {
        lists += 1
        return HttpResponse.json({ data: FIXTURE_USERS })
      }),
      http.post(`${API}/system-users`, async ({ request }) => {
        posts += 1
        sent = await request.json()
        await gate
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      })
    )
    await openCreate()
    fill("Login ID (e-mail)", " new@gaia.com ")
    fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "2" } })
    fireEvent.click(screen.getByRole("button", { name: "Buat akun" }))

    await waitFor(() => expect(posts).toBe(1))
    const busy = screen.getByRole("button", { name: "Menyimpan..." })
    expect(busy).toBeDisabled()
    fireEvent.click(busy)
    release()

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Akun dibuat. Password sementara dikirim ke e-mail user."
      )
    )
    expect(posts).toBe(1)
    expect(sent).toEqual({ loginId: "new@gaia.com", systemRoleId: 2 })
    await waitFor(() => expect(lists).toBe(2))
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
  })

  it("shows the 409 on the login field and keeps the dialog open", async () => {
    await openCreate()
    fill("Login ID (e-mail)", LOGIN_TAKEN)
    fireEvent.change(screen.getByLabelText("Peran"), { target: { value: "2" } })
    fireEvent.click(screen.getByRole("button", { name: "Buat akun" }))

    expect(await screen.findByText(LOGIN_TAKEN_MESSAGE)).toBeInTheDocument()
    expect(screen.getByLabelText("Login ID (e-mail)")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("shows frontend copy for 400 SYSTEM_ROLE_NOT_FOUND", async () => {
    server.use(
      http.get(`${API}/system-roles`, () =>
        HttpResponse.json({
          data: [
            {
              id: MISSING_ROLE_ID,
              key: "GHOST",
              name: "Ghost",
              description: null,
              createdAt: "2026-10-01T03:00:00Z",
              updatedAt: "2026-10-01T03:00:00Z",
            },
          ],
        })
      )
    )
    renderPage()
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Tambah akun" }))
    await screen.findByRole("option", { name: /Ghost/ })
    fill("Login ID (e-mail)", "new@gaia.com")
    fireEvent.change(screen.getByLabelText("Peran"), {
      target: { value: String(MISSING_ROLE_ID) },
    })
    fireEvent.click(screen.getByRole("button", { name: "Buat akun" }))

    expect(await screen.findByText(ROLE_NOT_FOUND_MESSAGE)).toBeInTheDocument()
  })

  it("shows a role-list error with a retry and keeps the submit off", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/system-roles`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(500, "INTERNAL_ERROR", "boom")
          : HttpResponse.json({ data: [] })
      })
    )
    renderPage()
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Tambah akun" }))

    const dialog = await screen.findByRole("dialog")
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "Buat akun" })
    ).toBeDisabled()
    fireEvent.click(within(dialog).getByRole("button", { name: "Coba lagi" }))
    await waitFor(() => expect(calls).toBe(2))
  })
})
