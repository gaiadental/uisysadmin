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
import { API, FIXTURE_ME } from "@/test/handlers/auth"
import {
  FIXTURE_USER_ACTIVE,
  FIXTURE_USERS,
} from "@/test/handlers/system-users"
import { server } from "@/test/server"

import { ALL_USER_PERMISSIONS, renderWithClient } from "./test-support"
import { UserDetailPage } from "./user-detail-page"
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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

// The role of this account (id 77) is not in the role list: it was deleted.
const ORPHAN = {
  ...FIXTURE_USER_ACTIVE,
  id: "11111111-aaaa-4aaa-8aaa-000000000077",
  loginId: "orphan@gaia.com",
  systemRoleId: 77,
  systemRoleKey: "OLD_ROLE",
}
const INACTIVE = "Peran tidak aktif"

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL_USER_PERMISSIONS
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  server.use(
    http.get(`${API}/system-users`, () =>
      HttpResponse.json({ data: [...FIXTURE_USERS, ORPHAN] })
    ),
    http.get(`${API}/system-users/${ORPHAN.id}`, () =>
      HttpResponse.json({ data: ORPHAN })
    )
  )
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("account list", () => {
  it("marks only the account whose role is gone", async () => {
    window.history.replaceState(null, "", "/system-users")
    renderWithClient(<UserListPage />, queryClient)

    await screen.findByRole("link", { name: ORPHAN.loginId })
    await waitFor(() => expect(screen.getAllByText(INACTIVE)).toHaveLength(1))
    const row = screen.getByRole("link", { name: ORPHAN.loginId }).closest("tr")
    expect(within(row as HTMLElement).getByText(INACTIVE)).toBeInTheDocument()
  })

  it("shows no marker without system_roles:view, since the roles are unknown", async () => {
    authMock.permissions = ["system_users:view"]
    window.history.replaceState(null, "", "/system-users")
    renderWithClient(<UserListPage />, queryClient)

    await screen.findByRole("link", { name: ORPHAN.loginId })
    expect(screen.queryByText(INACTIVE)).toBeNull()
  })
})

describe("account detail and role dialog", () => {
  function renderDetail() {
    window.history.replaceState(null, "", `/system-users/${ORPHAN.id}`)
    renderWithClient(<UserDetailPage />, queryClient)
  }

  it("marks the role and explains the change in the dialog", async () => {
    renderDetail()
    await screen.findByRole("heading", { name: ORPHAN.loginId })
    expect(await screen.findByText(INACTIVE)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")

    expect(within(dialog).getByRole("note")).toHaveTextContent(
      "Peran lama (OLD_ROLE) sudah dihapus"
    )
    await within(dialog).findByRole("option", { name: /System Admin/ })
    expect(within(dialog).getByLabelText("Peran")).toHaveValue("")
  })

  it("requires a new role before saving", async () => {
    let patches = 0
    server.use(
      http.patch(`${API}/system-users/:id/role`, () => {
        patches += 1
        return HttpResponse.json({ data: ORPHAN })
      })
    )
    renderDetail()
    await screen.findByText(INACTIVE)
    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")
    await within(dialog).findByRole("option", { name: /System Admin/ })

    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    expect(
      await within(dialog).findByText("Peran wajib dipilih.")
    ).toBeInTheDocument()
    expect(patches).toBe(0)
  })

  it("shows no marker and keeps the plain dialog for an account with a live role", async () => {
    window.history.replaceState(
      null,
      "",
      `/system-users/${FIXTURE_USER_ACTIVE.id}`
    )
    renderWithClient(<UserDetailPage />, queryClient)
    await screen.findByText("System Admin (SYS_ADMIN)")
    expect(screen.queryByText(INACTIVE)).toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Ubah peran" }))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).queryByRole("note")).toBeNull()
  })
})
