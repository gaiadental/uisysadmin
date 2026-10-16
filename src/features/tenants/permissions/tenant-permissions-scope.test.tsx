// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, FIXTURE_ME } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { TenantPermissionsTab } from "./tenant-permissions-tab"

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

const TENANT_ID = "cfab6b98-98cf-4059-bd06-9a1cdf469b41"
const STAMP = "2026-10-01T03:00:00Z"
const PLATFORM_ID = 21
const TENANT_ID_PERMISSION = 23
const CATALOGUE = [
  {
    id: PLATFORM_ID,
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
    id: TENANT_ID_PERMISSION,
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
// The tenant holds a PLATFORM permission (saved before the scope rule) and a
// TENANT permission. Only the TENANT one is shown.
const SAVED = [
  {
    id: 100,
    masterPermissionId: PLATFORM_ID,
    masterPermissionKey: "system_roles:view",
    masterPermissionName: "View system roles",
    enabled: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: 101,
    masterPermissionId: TENANT_ID_PERMISSION,
    masterPermissionKey: "appointment:view",
    masterPermissionName: "View appointments",
    enabled: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
]

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = [
    "tenant_permissions:view",
    "master_permissions:view",
    "tenant_permissions:update",
  ]
  server.use(
    http.get(`${API}/master-permissions`, () =>
      HttpResponse.json({ data: CATALOGUE })
    ),
    http.get(`${API}/tenants/:tenantId/permissions`, () =>
      HttpResponse.json({ data: SAVED })
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

function renderTab() {
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantPermissionsTab tenantId={TENANT_ID} />
    </QueryClientProvider>
  )
}

describe("tenant Permissions tab shows TENANT scope only (REQ-FE-057)", () => {
  it("lists the TENANT permissions and hides the PLATFORM ones", async () => {
    renderTab()

    expect(
      await screen.findByRole("checkbox", { name: /View appointments/ })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("checkbox", { name: /View system roles/ })
    ).toBeNull()
  })

  it("the PUT still sends a saved PLATFORM id when a TENANT id is unchecked", async () => {
    const puts: { masterPermissionIds: number[] }[] = []
    server.use(
      http.put(`${API}/tenants/:tenantId/permissions`, async ({ request }) => {
        puts.push((await request.json()) as { masterPermissionIds: number[] })
        return HttpResponse.json({ data: [] })
      })
    )
    renderTab()
    fireEvent.click(
      await screen.findByRole("checkbox", { name: /View appointments/ })
    )
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]?.masterPermissionIds).toEqual([PLATFORM_ID])
  })
})

describe("tenant Permissions tab empty state (REQ-FE-038, D13.2)", () => {
  it("shows the tenant copy when the catalogue has no TENANT permission", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        HttpResponse.json({
          data: CATALOGUE.filter((item) => item.scope === "PLATFORM"),
        })
      )
    )
    renderTab()

    expect(
      await screen.findByText("Belum ada permission untuk tenant di katalog.")
    ).toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).toBeNull()
  })
})
