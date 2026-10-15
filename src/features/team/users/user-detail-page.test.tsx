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
import {
  API,
  errorResponse,
  FIXTURE_ME,
  FIXTURE_OTHER_SESSION,
  FIXTURE_SESSION,
} from "@/test/handlers/auth"
import {
  FIXTURE_USER_ACTIVE,
  FIXTURE_USER_SELF,
  FIXTURE_USER_SUSPENDED,
} from "@/test/handlers/system-users"
import { server } from "@/test/server"

import { ALL_USER_PERMISSIONS, renderWithClient } from "./test-support"
import { UserDetailPage } from "./user-detail-page"

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

// Other-account sessions are suspended (OTHER_ACCOUNT_SESSIONS_ENABLED = false).
// The kept tab code is exercised with the flag mocked to true; the default is
// the real behaviour (false).
const flagMock = vi.hoisted(() => ({ enabled: false }))
vi.mock("./access", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./access")>()
  return {
    ...actual,
    canViewUserSessions: (permissions: readonly string[]) =>
      flagMock.enabled && permissions.includes("sessions:view"),
    canForceLogout: (permissions: readonly string[], isSelf: boolean) =>
      flagMock.enabled && permissions.includes("sessions:revoke") && !isSelf,
  }
})

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL_USER_PERMISSIONS
  flagMock.enabled = false
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

function renderDetail(userId: string) {
  window.history.replaceState(null, "", `/system-users/${userId}`)
  return renderWithClient(<UserDetailPage />, queryClient)
}

async function readyFor(loginId: string) {
  await screen.findByRole("heading", { name: loginId })
}

function button(name: string | RegExp) {
  return screen.queryByRole("button", { name })
}

describe("states (D13)", () => {
  it("shows a loading status, then the detail", async () => {
    renderDetail(FIXTURE_USER_ACTIVE.id)

    expect(screen.getByRole("status")).toHaveTextContent("Memuat akun")
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    expect(screen.getByText("Aktif")).toBeInTheDocument()
  })

  it("shows the role name from the role list", async () => {
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(
      await screen.findByText("System Admin (SYS_ADMIN)")
    ).toBeInTheDocument()
  })

  it("falls back to the role key without system_roles:view", async () => {
    authMock.permissions = ["system_users:view"]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(screen.getByText("SYS_ADMIN")).toBeInTheDocument()
  })

  it("shows not-found for an unknown id", async () => {
    renderDetail("missing")

    expect(await screen.findByText("Akun tidak ditemukan.")).toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/system-users/:id`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(500, "INTERNAL_ERROR", "boom")
          : HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }))
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
  })
})

describe("self-protection (D6.6, TODO-014 amendment 2026-10-12)", () => {
  it("shows the self badge and no suspend, deactivate or role change for the own account", async () => {
    renderDetail(FIXTURE_USER_SELF.id)
    await readyFor(FIXTURE_USER_SELF.loginId)

    expect(screen.getByText("self")).toBeInTheDocument()
    expect(button(/Tangguhkan/)).not.toBeInTheDocument()
    expect(button(/Nonaktifkan/)).not.toBeInTheDocument()
    expect(button(/Hapus/)).not.toBeInTheDocument()
    expect(button("Ubah peran")).not.toBeInTheDocument()
  })

  it("offers every action except Hapus on another account with the same permissions", async () => {
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(screen.queryByText("self")).not.toBeInTheDocument()
    expect(button(/Tangguhkan/)).toBeInTheDocument()
    expect(button(/Nonaktifkan/)).toBeInTheDocument()
    expect(button(/Hapus/)).not.toBeInTheDocument()
    expect(button("Ubah peran")).toBeInTheDocument()
  })
})

describe("role change (D6.4)", () => {
  it("is hidden without system_roles:view", async () => {
    authMock.permissions = ["system_users:view", "system_users:update"]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(button("Ubah peran")).not.toBeInTheDocument()
  })

  it("is hidden without system_users:update", async () => {
    authMock.permissions = ["system_users:view", "system_roles:view"]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(button("Ubah peran")).not.toBeInTheDocument()
  })

  it("preselects the current role, sends systemRoleId only and refetches the detail", async () => {
    let sent: unknown
    let path = ""
    let details = 0
    server.use(
      http.get(`${API}/system-users/:id`, () => {
        details += 1
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      }),
      http.patch(`${API}/system-users/:id`, async ({ request }) => {
        sent = await request.json()
        path = new URL(request.url).pathname
        return HttpResponse.json({
          data: { ...FIXTURE_USER_ACTIVE, systemRoleId: 1 },
        })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByRole("option", { name: /System Principal/ })

    const select = within(dialog).getByLabelText("Peran")
    await waitFor(() => expect(select).toHaveValue("2"))
    fireEvent.change(select, { target: { value: "1" } })
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Peran diubah.")
    )
    expect(path).toBe(`/api/v1/system-users/${FIXTURE_USER_ACTIVE.id}`)
    expect(sent).toEqual({ systemRoleId: 1 })
    await waitFor(() => expect(details).toBe(2))
  })

  it("sends nothing when the role is unchanged", async () => {
    let patches = 0
    server.use(
      http.patch(`${API}/system-users/:id`, () => {
        patches += 1
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByRole("option", { name: /System Principal/ })
    await waitFor(() =>
      expect(within(dialog).getByLabelText("Peran")).toHaveValue("2")
    )

    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(patches).toBe(0)
  })
})

describe("actions on the detail page", () => {
  it("reactivates a suspended account without a dialog", async () => {
    let body: unknown
    server.use(
      http.patch(`${API}/system-users/:id/status`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: FIXTURE_USER_SUSPENDED })
      })
    )
    renderDetail(FIXTURE_USER_SUSPENDED.id)
    await readyFor(FIXTURE_USER_SUSPENDED.loginId)

    fireEvent.click(screen.getByRole("button", { name: /Aktifkan/ }))

    await waitFor(() => expect(body).toEqual({ status: "ACTIVE" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})

describe("Sesi aktif tab (D4.10, flag mocked on)", () => {
  beforeEach(() => {
    flagMock.enabled = true
  })

  function openTab() {
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Sesi aktif" }))
    fireEvent.click(screen.getByRole("tab", { name: "Sesi aktif" }))
  }

  it("is hidden without sessions:view", async () => {
    authMock.permissions = ["system_users:view"]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(
      screen.queryByRole("tab", { name: "Sesi aktif" })
    ).not.toBeInTheDocument()
  })

  it("lists the sessions of that user", async () => {
    let path = ""
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, ({ request }) => {
        path = new URL(request.url).pathname
        return HttpResponse.json({
          data: [FIXTURE_SESSION, FIXTURE_OTHER_SESSION],
        })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()

    expect(await screen.findByText("10.0.0.5")).toBeInTheDocument()
    expect(path).toBe(`/api/v1/admin/users/${FIXTURE_USER_ACTIVE.id}/sessions`)
  })

  it("shows the empty state", async () => {
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () =>
        HttpResponse.json({ data: [] })
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()

    expect(await screen.findByText("Tidak ada sesi aktif.")).toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(500, "INTERNAL_ERROR", "boom")
          : HttpResponse.json({ data: [FIXTURE_OTHER_SESSION] })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()

    fireEvent.click(await screen.findByRole("button", { name: "Coba lagi" }))
    expect(await screen.findByText("10.0.0.5")).toBeInTheDocument()
  })

  it("hides force logout without sessions:revoke", async () => {
    authMock.permissions = ["system_users:view", "sessions:view"]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()
    await screen.findByRole("table", { name: "Sesi aktif akun" })

    expect(button("Paksa keluar")).not.toBeInTheDocument()
  })

  it("hides force logout for the own account even with sessions:revoke", async () => {
    renderDetail(FIXTURE_USER_SELF.id)
    await readyFor(FIXTURE_USER_SELF.loginId)
    openTab()
    await screen.findByRole("table", { name: "Sesi aktif akun" })

    expect(button("Paksa keluar")).not.toBeInTheDocument()
  })

  it("asks for confirmation, then revokes and invalidates the admin sessions key", async () => {
    let deletes = 0
    let path = ""
    let lists = 0
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () => {
        lists += 1
        return HttpResponse.json({ data: [FIXTURE_OTHER_SESSION] })
      }),
      http.delete(`${API}/admin/users/:userId/sessions`, ({ request }) => {
        deletes += 1
        path = new URL(request.url).pathname
        return HttpResponse.json({
          data: { status: "SESSIONS_REVOKED", count: 1 },
        })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()
    await screen.findByText("10.0.0.5")

    fireEvent.click(screen.getByRole("button", { name: "Paksa keluar" }))
    const dialog = await screen.findByRole("dialog")
    expect(deletes).toBe(0)
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(deletes).toBe(0)

    fireEvent.click(screen.getByRole("button", { name: "Paksa keluar" }))
    const second = await screen.findByRole("dialog")
    fireEvent.click(
      within(second).getByRole("button", { name: "Paksa keluar" })
    )

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith(
        "Semua sesi akun diakhiri."
      )
    )
    expect(deletes).toBe(1)
    expect(path).toBe(`/api/v1/admin/users/${FIXTURE_USER_ACTIVE.id}/sessions`)
    await waitFor(() => expect(lists).toBe(2))
  })

  it("shows the forbidden copy when the server refuses the force logout", async () => {
    server.use(
      http.delete(`${API}/admin/users/:userId/sessions`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()
    await screen.findByRole("table", { name: "Sesi aktif akun" })

    fireEvent.click(screen.getByRole("button", { name: "Paksa keluar" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Paksa keluar" })
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Anda tidak punya akses untuk aksi ini."
    )
  })
})

describe("Sesi aktif suspended (REQ-FE-052, D4.10)", () => {
  it("shows no tab, no force logout and makes no sessions request for another account", async () => {
    let sessionRequests = 0
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () => {
        sessionRequests += 1
        return HttpResponse.json({ data: [] })
      }),
      http.delete(`${API}/admin/users/:userId/sessions`, () => {
        sessionRequests += 1
        return new HttpResponse(null, { status: 204 })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(
      screen.queryByRole("tab", { name: "Sesi aktif" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Paksa keluar" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Lihat sesi saya" })
    ).not.toBeInTheDocument()
    expect(sessionRequests).toBe(0)
  })

  it("links the own account to /account/sessions", async () => {
    let sessionRequests = 0
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () => {
        sessionRequests += 1
        return HttpResponse.json({ data: [] })
      })
    )
    renderDetail(FIXTURE_USER_SELF.id)
    await readyFor(FIXTURE_USER_SELF.loginId)

    expect(
      screen.queryByRole("tab", { name: "Sesi aktif" })
    ).not.toBeInTheDocument()
    const link = screen.getByRole("link", { name: "Lihat sesi saya" })
    expect(link).toHaveAttribute("href", "/account/sessions")
    expect(link).not.toHaveAttribute("target")
    expect(screen.queryByRole("button", { name: "Lihat sesi saya" })).toBeNull()
    fireEvent.click(link)
    expect(window.location.pathname).toBe("/account/sessions")
    expect(sessionRequests).toBe(0)
  })
})
