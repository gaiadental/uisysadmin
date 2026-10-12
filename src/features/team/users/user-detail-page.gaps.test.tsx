// @vitest-environment jsdom
// Gap coverage for TODO-014 detail screen (unit-test-writer). Complements
// user-detail-page.test.tsx: gate keys one by one, status transition
// visibility, confirm cancel, error mapping, double-send, sessions tab gates,
// paging and D12.1 invalidation.
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

import { GENERIC_WRITE_MESSAGE } from "@/features/tenants/create/write-failure"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"
import {
  API,
  errorResponse,
  FIXTURE_ME,
  FIXTURE_OTHER_SESSION,
  FIXTURE_SESSION,
} from "@/test/handlers/auth"
import {
  FIXTURE_USER_ACTIVE,
  FIXTURE_USER_DEACTIVATED,
  FIXTURE_USER_SELF,
  FIXTURE_USER_SUSPENDED,
} from "@/test/handlers/system-users"
import { server } from "@/test/server"

import { ALL_USER_PERMISSIONS, renderWithClient } from "./test-support"
import { ROLE_NOT_FOUND_MESSAGE, USER_NOT_FOUND_MESSAGE } from "./user-failure"
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

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL_USER_PERMISSIONS
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

/** Labels of the action buttons in the detail header (aria-label minus the login ID, plus "Ubah peran"). */
function headerActions(loginId: string): string[] {
  return screen
    .queryAllByRole("button")
    .map((node) => node.getAttribute("aria-label") ?? node.textContent ?? "")
    .filter((label) => label === "Ubah peran" || label.endsWith(` ${loginId}`))
    .map((label) => label.replace(` ${loginId}`, ""))
    .sort()
}

async function confirmFlow(openName: string, confirmLabel: string) {
  fireEvent.click(screen.getByRole("button", { name: openName }))
  const dialog = await screen.findByRole("dialog")
  fireEvent.click(within(dialog).getByRole("button", { name: confirmLabel }))
}

describe("each gate key independently (D6.4)", () => {
  it.each([
    ["system_users:update", ["Nonaktifkan", "Tangguhkan"]],
    ["system_users:delete", ["Hapus"]],
    ["system_users:reset_password", ["Reset password"]],
  ])("%s alone gives exactly its buttons on an ACTIVE account", async (key, expected) => {
    authMock.permissions = ["system_users:view", key]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(headerActions(FIXTURE_USER_ACTIVE.loginId)).toEqual([...expected].sort())
  })

  it("system_users:update plus system_roles:view adds Ubah peran", async () => {
    authMock.permissions = [
      "system_users:view",
      "system_users:update",
      "system_roles:view",
    ]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(headerActions(FIXTURE_USER_ACTIVE.loginId)).toEqual(
      ["Nonaktifkan", "Tangguhkan", "Ubah peran"].sort()
    )
  })

  it("system_users:view only has no action buttons", async () => {
    authMock.permissions = ["system_users:view"]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(headerActions(FIXTURE_USER_ACTIVE.loginId)).toEqual([])
  })

  it("the own account with every permission keeps only reset password", async () => {
    renderDetail(FIXTURE_USER_SELF.id)
    await readyFor(FIXTURE_USER_SELF.loginId)

    expect(headerActions(FIXTURE_USER_SELF.loginId)).toEqual(["Reset password"])
  })

  it("the own account with a non-ACTIVE status gets reactivate only besides reset (OQ-P-31, OQ-P-32)", async () => {
    server.use(
      http.get(`${API}/system-users/:id`, () =>
        HttpResponse.json({ data: { ...FIXTURE_USER_SELF, status: "SUSPENDED" } })
      )
    )
    renderDetail(FIXTURE_USER_SELF.id)
    await readyFor(FIXTURE_USER_SELF.loginId)

    expect(headerActions(FIXTURE_USER_SELF.loginId)).toEqual(
      ["Aktifkan", "Reset password"].sort()
    )
  })
})

describe("status transition visibility", () => {
  it("SUSPENDED: reactivate, deactivate, reset, delete; no suspend", async () => {
    renderDetail(FIXTURE_USER_SUSPENDED.id)
    await readyFor(FIXTURE_USER_SUSPENDED.loginId)

    expect(headerActions(FIXTURE_USER_SUSPENDED.loginId)).toEqual(
      ["Aktifkan", "Hapus", "Nonaktifkan", "Reset password", "Ubah peran"].sort()
    )
    expect(screen.getByText("Ditangguhkan")).toBeInTheDocument()
  })

  it("DEACTIVATED: reactivate, reset, delete; no suspend or deactivate", async () => {
    renderDetail(FIXTURE_USER_DEACTIVATED.id)
    await readyFor(FIXTURE_USER_DEACTIVATED.loginId)

    expect(headerActions(FIXTURE_USER_DEACTIVATED.loginId)).toEqual(
      ["Aktifkan", "Hapus", "Reset password", "Ubah peran"].sort()
    )
    expect(screen.getByText("Dinonaktifkan")).toBeInTheDocument()
  })

  it("after a suspend the detail refetches and shows the new status buttons", async () => {
    let status: "ACTIVE" | "SUSPENDED" = "ACTIVE"
    server.use(
      http.get(`${API}/system-users/:id`, () =>
        HttpResponse.json({ data: { ...FIXTURE_USER_ACTIVE, status } })
      ),
      http.patch(`${API}/system-users/:id/status`, () => {
        status = "SUSPENDED"
        return HttpResponse.json({
          data: { ...FIXTURE_USER_ACTIVE, status },
        })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    await confirmFlow(`Tangguhkan ${FIXTURE_USER_ACTIVE.loginId}`, "Tangguhkan")

    expect(
      await screen.findByRole("button", {
        name: `Aktifkan ${FIXTURE_USER_ACTIVE.loginId}`,
      })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", {
        name: `Tangguhkan ${FIXTURE_USER_ACTIVE.loginId}`,
      })
    ).not.toBeInTheDocument()
    expect(screen.getByText("Ditangguhkan")).toBeInTheDocument()
  })
})

describe("confirm dialogs on the detail page", () => {
  it.each([
    ["Tangguhkan"],
    ["Nonaktifkan"],
    ["Hapus"],
    ["Reset password"],
  ])("cancelling %s sends nothing", async (label) => {
    const calls: string[] = []
    server.use(
      http.patch(`${API}/system-users/:id/status`, () => {
        calls.push("patch")
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      }),
      http.delete(`${API}/system-users/:id`, () => {
        calls.push("delete")
        return HttpResponse.json({ data: null })
      }),
      http.post(`${API}/system-users/:id/reset-password`, () => {
        calls.push("post")
        return HttpResponse.json({ data: null })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    fireEvent.click(
      screen.getByRole("button", { name: `${label} ${FIXTURE_USER_ACTIVE.loginId}` })
    )
    const dialog = await screen.findByRole("dialog")

    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(calls).toEqual([])
    expect(window.location.pathname).toBe(
      `/system-users/${FIXTURE_USER_ACTIVE.id}`
    )
  })

  it("deactivate and reset confirm send DEACTIVATED and an empty reset POST", async () => {
    const seen: Array<{ path: string; body: unknown }> = []
    server.use(
      http.patch(`${API}/system-users/:id/status`, async ({ request }) => {
        seen.push({
          path: new URL(request.url).pathname,
          body: await request.json(),
        })
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      }),
      http.post(`${API}/system-users/:id/reset-password`, ({ request }) => {
        seen.push({ path: new URL(request.url).pathname, body: null })
        return HttpResponse.json({ data: null })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    await confirmFlow(`Nonaktifkan ${FIXTURE_USER_ACTIVE.loginId}`, "Nonaktifkan")
    await waitFor(() => expect(seen).toHaveLength(1))
    await confirmFlow(
      `Reset password ${FIXTURE_USER_ACTIVE.loginId}`,
      "Reset password"
    )
    await waitFor(() => expect(seen).toHaveLength(2))

    expect(seen[0]).toEqual({
      path: `/api/v1/system-users/${FIXTURE_USER_ACTIVE.id}/status`,
      body: { status: "DEACTIVATED" },
    })
    expect(seen[1]?.path).toBe(
      `/api/v1/system-users/${FIXTURE_USER_ACTIVE.id}/reset-password`
    )
  })
})

describe("error mapping on the detail page (D13)", () => {
  it("403 on delete shows the forbidden copy and stays on the page", async () => {
    server.use(
      http.delete(`${API}/system-users/:id`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    await confirmFlow(`Hapus ${FIXTURE_USER_ACTIVE.loginId}`, "Hapus")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Anda tidak punya akses untuk aksi ini."
    )
    expect(window.location.pathname).toBe(
      `/system-users/${FIXTURE_USER_ACTIVE.id}`
    )
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("404 on delete shows the not-found copy and does not navigate", async () => {
    server.use(
      http.delete(`${API}/system-users/:id`, () =>
        errorResponse(404, "SYSTEM_USER_NOT_FOUND", "raw")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    await confirmFlow(`Hapus ${FIXTURE_USER_ACTIVE.loginId}`, "Hapus")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      USER_NOT_FOUND_MESSAGE
    )
    expect(window.location.pathname).toBe(
      `/system-users/${FIXTURE_USER_ACTIVE.id}`
    )
  })

  it("409 on a status change shows the server message", async () => {
    server.use(
      http.patch(`${API}/system-users/:id/status`, () =>
        errorResponse(409, "SYSTEM_USER_STATE_CONFLICT", "Already suspended.")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    await confirmFlow(`Tangguhkan ${FIXTURE_USER_ACTIVE.loginId}`, "Tangguhkan")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Already suspended."
    )
  })

  it("500 on reset shows the generic line", async () => {
    server.use(
      http.post(`${API}/system-users/:id/reset-password`, () =>
        errorResponse(500, "INTERNAL_ERROR", "trace")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    await confirmFlow(
      `Reset password ${FIXTURE_USER_ACTIVE.loginId}`,
      "Reset password"
    )

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(GENERIC_WRITE_MESSAGE)
    expect(alert).not.toHaveTextContent("trace")
  })

  it("role change 400 SYSTEM_ROLE_NOT_FOUND shows frontend copy and keeps the dialog", async () => {
    server.use(
      http.patch(`${API}/system-users/:id`, () =>
        errorResponse(400, "SYSTEM_ROLE_NOT_FOUND", "raw role text")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByRole("option", { name: /System Principal/ })
    fireEvent.change(within(dialog).getByLabelText("Peran"), {
      target: { value: "1" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      ROLE_NOT_FOUND_MESSAGE
    )
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it.each([
    [403, "PERMISSION_DENIED", "Anda tidak punya akses untuk aksi ini."],
    [404, "SYSTEM_USER_NOT_FOUND", USER_NOT_FOUND_MESSAGE],
    [409, "SYSTEM_USER_STATE_CONFLICT", "Role locked."],
  ])("role change %i shows the mapped copy", async (status, code, expected) => {
    server.use(
      http.patch(`${API}/system-users/:id`, () =>
        errorResponse(status, code, "Role locked.")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByRole("option", { name: /System Principal/ })
    fireEvent.change(within(dialog).getByLabelText("Peran"), {
      target: { value: "1" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(expected)
  })

  it("a failed role change does not invalidate the user keys", async () => {
    server.use(
      http.patch(`${API}/system-users/:id`, () =>
        errorResponse(409, "SYSTEM_USER_STATE_CONFLICT", "Role locked.")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    queryClient.setQueryData(queryKeys.systemUsers.all(), [])
    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByRole("option", { name: /System Principal/ })
    fireEvent.change(within(dialog).getByLabelText("Peran"), {
      target: { value: "1" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))
    await within(dialog).findByRole("alert")

    expect(queryClient.getQueryState(queryKeys.systemUsers.all())?.isInvalidated).toBe(false)
  })
})

describe("in-flight double-send guard", () => {
  it("role change submit sends one PATCH while in flight", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let patches = 0
    server.use(
      http.patch(`${API}/system-users/:id`, async () => {
        patches += 1
        await gate
        return HttpResponse.json({ data: { ...FIXTURE_USER_ACTIVE, systemRoleId: 1 } })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByRole("option", { name: /System Principal/ })
    fireEvent.change(within(dialog).getByLabelText("Peran"), {
      target: { value: "1" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    await waitFor(() => expect(patches).toBe(1))
    const busy = within(dialog).getByRole("button", { name: "Menyimpan..." })
    expect(busy).toBeDisabled()
    fireEvent.click(busy)
    release()
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Peran diubah.")
    )
    expect(patches).toBe(1)
  })

  it("a delete in flight disables the other detail actions", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let deletes = 0
    server.use(
      http.delete(`${API}/system-users/:id`, async () => {
        deletes += 1
        await gate
        return HttpResponse.json({ data: null })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    await confirmFlow(`Hapus ${FIXTURE_USER_ACTIVE.loginId}`, "Hapus")

    await waitFor(() => expect(deletes).toBe(1))
    for (const label of ["Tangguhkan", "Nonaktifkan", "Reset password"]) {
      expect(
        screen.getByRole("button", { name: `${label} ${FIXTURE_USER_ACTIVE.loginId}` })
      ).toBeDisabled()
    }
    expect(screen.getByRole("button", { name: "Ubah peran" })).toBeDisabled()
    release()
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Akun dihapus."))
    expect(deletes).toBe(1)
  })
})

describe("Sesi aktif tab gates and behaviour (D4.10)", () => {
  function openTab() {
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Sesi aktif" }))
    fireEvent.click(screen.getByRole("tab", { name: "Sesi aktif" }))
  }

  it("sessions:revoke alone does not show the tab", async () => {
    authMock.permissions = ["system_users:view", "sessions:revoke"]
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    expect(screen.queryByRole("tab", { name: "Sesi aktif" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Paksa keluar" })).not.toBeInTheDocument()
  })

  it("sessions:view alone shows the list without a request until the tab opens", async () => {
    authMock.permissions = ["system_users:view", "sessions:view"]
    let lists = 0
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () => {
        lists += 1
        return HttpResponse.json({ data: [FIXTURE_OTHER_SESSION] })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    expect(lists).toBe(0)

    openTab()

    expect(await screen.findByText("10.0.0.5")).toBeInTheDocument()
    expect(lists).toBe(1)
  })

  it("marks the current session", async () => {
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () =>
        HttpResponse.json({ data: [FIXTURE_SESSION, FIXTURE_OTHER_SESSION] })
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()

    await screen.findByText("10.0.0.5")
    expect(screen.getAllByText("Sesi ini")).toHaveLength(1)
  })

  it("a 403 on the session list shows the forbidden copy and no table", async () => {
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Anda tidak punya akses untuk aksi ini.")
    expect(screen.queryByRole("table", { name: "Sesi aktif akun" })).not.toBeInTheDocument()
  })

  it("pages 12 sessions as 10 then 2 with one GET", async () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      ...FIXTURE_OTHER_SESSION,
      sessionId: `7a9e4d21-3b5c-4f60-8e12-c0d4b6a1f9${String(index).padStart(2, "0")}`,
      ipAddress: `10.1.0.${index + 1}`,
      isCurrent: false,
    }))
    let gets = 0
    server.use(
      http.get(`${API}/admin/users/:userId/sessions`, () => {
        gets += 1
        return HttpResponse.json({ data: many })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    openTab()

    await screen.findByText("10.1.0.1")
    expect(screen.getByText("10.1.0.10")).toBeInTheDocument()
    expect(screen.queryByText("10.1.0.11")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }))
    expect(await screen.findByText("10.1.0.11")).toBeInTheDocument()
    expect(screen.getByText("10.1.0.12")).toBeInTheDocument()
    expect(gets).toBe(1)
  })

  describe("force logout", () => {
    async function openForceLogout() {
      renderDetail(FIXTURE_USER_ACTIVE.id)
      await readyFor(FIXTURE_USER_ACTIVE.loginId)
      openTab()
      await screen.findByRole("table", { name: "Sesi aktif akun" })
      fireEvent.click(screen.getByRole("button", { name: "Paksa keluar" }))
      return screen.findByRole("dialog")
    }

    it("names the account in the confirm title", async () => {
      const dialog = await openForceLogout()

      expect(
        within(dialog).getByText(`Paksa keluar ${FIXTURE_USER_ACTIVE.loginId}?`)
      ).toBeInTheDocument()
    })

    it.each([
      [404, "SYSTEM_USER_NOT_FOUND", USER_NOT_FOUND_MESSAGE],
      [409, "SESSION_CONFLICT", "Sessions changed."],
      [500, "INTERNAL_ERROR", GENERIC_WRITE_MESSAGE],
    ])("maps %i to its copy and does not toast or refetch", async (status, code, expected) => {
      let lists = 0
      server.use(
        http.get(`${API}/admin/users/:userId/sessions`, () => {
          lists += 1
          return HttpResponse.json({ data: [FIXTURE_OTHER_SESSION] })
        }),
        http.delete(`${API}/admin/users/:userId/sessions`, () =>
          errorResponse(status, code, "Sessions changed.")
        )
      )
      const dialog = await openForceLogout()
      fireEvent.click(within(dialog).getByRole("button", { name: "Paksa keluar" }))

      expect(await screen.findByRole("alert")).toHaveTextContent(expected)
      expect(toastMock.success).not.toHaveBeenCalled()
      expect(lists).toBe(1)
      expect(screen.getByRole("button", { name: "Paksa keluar" })).toBeEnabled()
    })

    it("sends one DELETE while in flight and disables the button", async () => {
      let release: () => void = () => undefined
      const gate = new Promise<void>((resolve) => {
        release = resolve
      })
      let deletes = 0
      server.use(
        http.delete(`${API}/admin/users/:userId/sessions`, async () => {
          deletes += 1
          await gate
          return HttpResponse.json({ data: null })
        })
      )
      const dialog = await openForceLogout()
      fireEvent.click(within(dialog).getByRole("button", { name: "Paksa keluar" }))

      await waitFor(() => expect(deletes).toBe(1))
      const busy = screen.getByRole("button", { name: "Memproses..." })
      expect(busy).toBeDisabled()
      fireEvent.click(busy)
      release()
      await waitFor(() =>
        expect(toastMock.success).toHaveBeenCalledWith("Semua sesi akun diakhiri.")
      )
      expect(deletes).toBe(1)
    })

    it("invalidates only ['admin','sessions', userId] (D12.1)", async () => {
      queryClient.setQueryData(queryKeys.adminSessions.ofUser("someone-else"), [])
      queryClient.setQueryData(queryKeys.sessions.own(), [])
      queryClient.setQueryData(
        queryKeys.systemUsers.detail("unrelated-user"),
        FIXTURE_USER_SUSPENDED
      )
      const dialog = await openForceLogout()
      fireEvent.click(within(dialog).getByRole("button", { name: "Paksa keluar" }))
      await waitFor(() => expect(toastMock.success).toHaveBeenCalled())

      const state = (key: readonly unknown[]) =>
        queryClient.getQueryState(key)?.isInvalidated
      expect(state(queryKeys.adminSessions.ofUser(FIXTURE_USER_ACTIVE.id))).toBe(false)
      // The active key was refetched, so it is fresh; the others must not be touched.
      expect(state(queryKeys.adminSessions.ofUser("someone-else"))).toBe(false)
      expect(state(queryKeys.sessions.own())).toBe(false)
      expect(state(queryKeys.systemUsers.detail("unrelated-user"))).toBe(false)
    })
  })
})

describe("D12.1 invalidation from the detail page", () => {
  it("a successful status change refetches the detail once more", async () => {
    let details = 0
    server.use(
      http.get(`${API}/system-users/:id`, () => {
        details += 1
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      })
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)
    expect(details).toBe(1)

    await confirmFlow(`Tangguhkan ${FIXTURE_USER_ACTIVE.loginId}`, "Tangguhkan")

    await waitFor(() => expect(details).toBe(2))
  })

  it("a failed status change does not refetch the detail", async () => {
    let details = 0
    server.use(
      http.get(`${API}/system-users/:id`, () => {
        details += 1
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      }),
      http.patch(`${API}/system-users/:id/status`, () =>
        errorResponse(409, "SYSTEM_USER_STATE_CONFLICT", "Nope.")
      )
    )
    renderDetail(FIXTURE_USER_ACTIVE.id)
    await readyFor(FIXTURE_USER_ACTIVE.loginId)

    await confirmFlow(`Tangguhkan ${FIXTURE_USER_ACTIVE.loginId}`, "Tangguhkan")
    await screen.findByRole("alert")

    expect(details).toBe(1)
  })
})
