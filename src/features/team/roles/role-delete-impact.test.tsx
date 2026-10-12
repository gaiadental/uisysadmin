// @vitest-environment jsdom
import { type QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { RoleListPage } from "./role-list-page"
import { ALL_ROLE_PERMISSIONS, renderWithClient } from "./test-support"

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
})

async function openDelete(name: string) {
  renderWithClient(<RoleListPage />, queryClient)
  await screen.findByRole("link", { name })
  fireEvent.click(screen.getByRole("button", { name: `Hapus ${name}` }))
  return screen.findByRole("dialog")
}

describe("delete role: accounts still using it", () => {
  it("warns with the number of accounts that use the role", async () => {
    // Fixture users: three SYS_ADMIN.
    const dialog = await openDelete("System Admin")

    expect(dialog).toHaveTextContent("3 akun masih memakai peran ini")
    expect(dialog).toHaveTextContent("Peran tidak aktif")
  })

  it("says so when no account uses the role", async () => {
    server.use(
      http.get(`${API}/system-users`, () => HttpResponse.json({ data: [] }))
    )
    const dialog = await openDelete("System Admin")

    expect(dialog).toHaveTextContent("Tidak ada akun yang memakai peran ini.")
  })

  it("asks to check the user list when the count cannot be read", async () => {
    server.use(
      http.get(`${API}/system-users`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )
    const dialog = await openDelete("System Admin")

    expect(
      within(dialog).getByText(/Cek dulu di daftar user/)
    ).toBeInTheDocument()
  })
})
