// @vitest-environment jsdom
import { type QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { RoleDetailPage } from "./role-detail-page"
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

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock("sonner", () => ({ toast: toastMock }))

const STAMP = "2026-10-01T03:00:00Z"
const CATALOGUE = [
  {
    id: 21,
    key: "system_roles:view",
    name: "View system roles",
    description: null,
    category: "system_roles",
    module: "auth",
    scope: "PLATFORM",
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: 22,
    key: "tenants:view",
    name: "View tenants",
    description: null,
    category: "tenants",
    module: "tenant",
    scope: "PLATFORM",
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: 23,
    key: "appointment:view",
    name: "View appointments",
    description: null,
    category: "appointment",
    module: "clinic",
    scope: "TENANT",
    createdAt: STAMP,
    updatedAt: STAMP,
  },
]
const SERVER_TEXT = "Permission appointment:view is tenant scope on a system role"
const SCOPE_COPY = "Permission ini tidak dapat diberikan pada peran ini."

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL_ROLE_PERMISSIONS
  server.use(
    http.get(`${API}/master-permissions`, () =>
      HttpResponse.json({ data: CATALOGUE })
    )
  )
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

async function openPermissions(savedKeys: readonly string[] = []) {
  server.use(
    http.get(`${API}/system-roles/:id/permissions`, () =>
      HttpResponse.json({ data: savedKeys })
    )
  )
  window.history.replaceState(null, "", "/system-roles/2")
  renderWithClient(<RoleDetailPage />, queryClient)
  await screen.findByRole("heading", { name: "System Admin" })
  fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))
  await screen.findByRole("checkbox", { name: /View system roles/ })
}

describe("role Permissions tab shows PLATFORM scope only (REQ-FE-057)", () => {
  it("lists the PLATFORM permissions and hides the TENANT ones", async () => {
    await openPermissions()

    expect(
      screen.getByRole("checkbox", { name: /View system roles/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: /View tenants/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("checkbox", { name: /View appointments/ })
    ).toBeNull()
  })

  it("keeps a held key outside the shown catalogue in the PUT", async () => {
    const puts: { permissionKeys: string[] }[] = []
    server.use(
      http.put(`${API}/system-roles/:id/permissions`, async ({ request }) => {
        puts.push((await request.json()) as { permissionKeys: string[] })
        return HttpResponse.json({ data: puts[0]?.permissionKeys ?? [] })
      })
    )
    await openPermissions(["appointment:view"])

    fireEvent.click(screen.getByRole("checkbox", { name: /View tenants/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => expect(puts).toHaveLength(1))
    expect([...puts[0]!.permissionKeys].sort()).toEqual([
      "appointment:view",
      "tenants:view",
    ])
  })
})

describe("role permission save: PERMISSION_SCOPE_NOT_ALLOWED (REQ-FE-057)", () => {
  it("shows the fixed copy and the reference id, never the server text", async () => {
    server.use(
      http.put(`${API}/system-roles/:id/permissions`, () =>
        errorResponse(400, "PERMISSION_SCOPE_NOT_ALLOWED", SERVER_TEXT)
      )
    )
    await openPermissions()

    fireEvent.click(screen.getByRole("checkbox", { name: /View system roles/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(SCOPE_COPY)
    expect(alert).toHaveTextContent("Kode referensi")
    expect(screen.queryByText(SERVER_TEXT, { exact: false })).toBeNull()
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("a 400 with another code does not use the scope copy", async () => {
    server.use(
      http.put(`${API}/system-roles/:id/permissions`, () =>
        errorResponse(400, "SOMETHING_ELSE", "Other rule")
      )
    )
    await openPermissions()

    fireEvent.click(screen.getByRole("checkbox", { name: /View system roles/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    const alert = await screen.findByRole("alert")
    expect(alert).not.toHaveTextContent(SCOPE_COPY)
  })
})

describe("role Permissions tab empty state (REQ-FE-038, D13.2)", () => {
  it("shows the role copy when the catalogue has no PLATFORM permission", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({
          data: CATALOGUE.filter((item) => item.scope === "TENANT"),
        })
      )
    )
    window.history.replaceState(null, "", "/system-roles/2")
    renderWithClient(<RoleDetailPage />, queryClient)
    await screen.findByRole("heading", { name: "System Admin" })
    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))

    expect(
      await screen.findByText("Belum ada permission untuk peran sistem di katalog.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).toBeNull()
  })
})
