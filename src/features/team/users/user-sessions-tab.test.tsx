// @vitest-environment jsdom
// TODO-026: force logout of another account and the session list, through the
// detail page (REQ-FE-032, REQ-FE-053, ARCH-FE-001 D4.10, D13.1).
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

import { GENERIC_READ_MESSAGE } from "@/features/tenants/shared/failure"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import {
  API,
  errorResponse,
  FIXTURE_ME,
  FIXTURE_OTHER_SESSION,
} from "@/test/handlers/auth"
import {
  FIXTURE_USER_ACTIVE,
  FIXTURE_USER_SELF,
} from "@/test/handlers/system-users"
import { server } from "@/test/server"

import {
  PROTECTED_ACCOUNT_MESSAGE,
  SELF_ACTION_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
  CONFLICT_MESSAGE,
} from "../shared/guard-failure"
import { ALL_USER_PERMISSIONS, renderWithClient } from "./test-support"
import { UserDetailPage } from "./user-detail-page"
import { USER_NOT_FOUND_MESSAGE } from "./user-failure"

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

async function openTab() {
  window.history.replaceState(null, "", `/system-users/${FIXTURE_USER_ACTIVE.id}`)
  renderWithClient(<UserDetailPage />, queryClient)
  await screen.findByRole("heading", { name: FIXTURE_USER_ACTIVE.loginId })
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Sesi aktif" }))
  fireEvent.click(screen.getByRole("tab", { name: "Sesi aktif" }))
  await screen.findByRole("table", { name: "Sesi aktif akun" })
}

async function confirmForceLogout() {
  fireEvent.click(screen.getByRole("button", { name: "Paksa keluar" }))
  const dialog = await screen.findByRole("dialog")
  fireEvent.click(within(dialog).getByRole("button", { name: "Paksa keluar" }))
}

describe("force logout of another account (D4.10, D13.1)", () => {
  it("success shows the success toast and refreshes the list", async () => {
    let lists = 0
    server.use(
      http.get(`${API}/system-users/:userId/sessions`, () => {
        lists += 1
        return HttpResponse.json({ data: [FIXTURE_OTHER_SESSION] })
      }),
      http.delete(`${API}/system-users/:userId/sessions`, () =>
        HttpResponse.json({ data: { status: "SESSIONS_REVOKED", count: 1 } })
      )
    )
    await openTab()
    await confirmForceLogout()

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Semua sesi akun diakhiri.")
    )
    await waitFor(() => expect(lists).toBe(2))
  })

  it.each([
    [409, "SELF_ACTION_NOT_ALLOWED", SELF_ACTION_MESSAGE],
    [403, "PLATFORM_ROLE_PROTECTED", PROTECTED_ACCOUNT_MESSAGE],
    [409, "SOMETHING_UNRECOGNISED", CONFLICT_MESSAGE],
    [503, "SERVICE_UNAVAILABLE", SERVICE_UNAVAILABLE_MESSAGE],
    [404, "SYSTEM_USER_NOT_FOUND", USER_NOT_FOUND_MESSAGE],
  ])(
    "%i %s shows the fixed copy with the reference id, never the server text",
    async (status, code, expected) => {
      server.use(
        http.delete(`${API}/system-users/:userId/sessions`, () =>
          HttpResponse.json(
            { code, message: "SERVER TEXT MUST NOT SHOW" },
            { status, headers: { "X-Correlation-ID": "corr-xyz-1" } }
          )
        )
      )
      await openTab()
      await confirmForceLogout()

      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent(expected)
      expect(alert).not.toHaveTextContent("SERVER TEXT MUST NOT SHOW")
      expect(alert).toHaveTextContent("Kode referensi: corr-xyz-1")
      expect(toastMock.success).not.toHaveBeenCalled()
    }
  )

  it("shows the force logout button for a principal target (no UI gate)", async () => {
    server.use(
      http.get(`${API}/system-users/:id`, () =>
        HttpResponse.json({
          data: {
            ...FIXTURE_USER_ACTIVE,
            systemRoleKey: "SYS_PRINCIPAL",
          },
        })
      )
    )
    await openTab()

    expect(screen.getByRole("button", { name: "Paksa keluar" })).toBeEnabled()
  })

  it("keeps the generic read message when the GET fails, with no principal handling", async () => {
    server.use(
      http.get(`${API}/system-users/:userId/sessions`, () =>
        errorResponse(500, "INTERNAL_ERROR", "SERVER TEXT MUST NOT SHOW")
      )
    )
    window.history.replaceState(
      null,
      "",
      `/system-users/${FIXTURE_USER_ACTIVE.id}`
    )
    renderWithClient(<UserDetailPage />, queryClient)
    await screen.findByRole("heading", { name: FIXTURE_USER_ACTIVE.loginId })
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Sesi aktif" }))
    fireEvent.click(screen.getByRole("tab", { name: "Sesi aktif" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(GENERIC_READ_MESSAGE)
    expect(alert).not.toHaveTextContent("SERVER TEXT MUST NOT SHOW")
  })
})

describe("own account", () => {
  it("has no tab", async () => {
    window.history.replaceState(null, "", `/system-users/${FIXTURE_USER_SELF.id}`)
    renderWithClient(<UserDetailPage />, queryClient)
    await screen.findByRole("heading", { name: FIXTURE_USER_SELF.loginId })

    expect(screen.queryByRole("tab", { name: "Sesi aktif" })).toBeNull()
  })
})
