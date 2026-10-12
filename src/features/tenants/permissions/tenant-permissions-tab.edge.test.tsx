// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import {
  FIXTURE_TENANT_PERMISSION_BRANCHES,
} from "@/test/handlers/tenant-permissions"
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
const ALL_KEYS = [
  "tenant_permissions:view",
  "master_permissions:view",
  "tenant_permissions:update",
  "tenant_permissions:activate",
  "tenant_permissions:deactivate",
]

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL_KEYS
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

async function ready() {
  await screen.findByRole("checkbox", { name: /View branches/ })
}

function recordWrites() {
  const puts: unknown[] = []
  const patches: Array<{ path: string; body: unknown }> = []
  server.use(
    http.put(`${API}/tenants/:tenantId/permissions`, async ({ request }) => {
      puts.push(await request.json())
      return HttpResponse.json({ data: [FIXTURE_TENANT_PERMISSION_BRANCHES] })
    }),
    http.patch(
      `${API}/tenants/:tenantId/permissions/:permissionId`,
      async ({ request }) => {
        patches.push({
          path: new URL(request.url).pathname,
          body: await request.json(),
        })
        return HttpResponse.json({
          data: { ...FIXTURE_TENANT_PERMISSION_BRANCHES, enabled: false },
        })
      }
    )
  )
  return { puts, patches }
}

describe("edge cases (additional)", () => {
  it("shows an error alert with a retry when only the tenant read fails", async () => {
    server.use(
      http.get(`${API}/tenants/:tenantId/permissions`, () =>
        errorResponse(502, "INTERNAL_ERROR", "bad gateway")
      )
    )
    renderTab()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Layanan sedang bermasalah"
    )
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument()
  })

  it("recovers after Coba lagi when the read succeeds the second time", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/master-permissions`, () => {
        calls += 1
        if (calls === 1) return errorResponse(502, "INTERNAL_ERROR", "bad gateway")
        return undefined as never
      })
    )
    renderTab()
    fireEvent.click(await screen.findByRole("button", { name: "Coba lagi" }))
    await ready()
  })

  it("shows no switch and an unchecked list when the tenant has no permissions", async () => {
    server.use(
      http.get(`${API}/tenants/:tenantId/permissions`, () =>
        HttpResponse.json({ data: [] })
      )
    )
    renderTab()
    await screen.findByRole("checkbox", { name: /View branches/ })

    expect(screen.queryAllByRole("switch")).toHaveLength(0)
    expect(screen.getByRole("checkbox", { name: /View branches/ })).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled()
  })

  it("sends an empty list as a full replacement when every item is unchecked", async () => {
    const { puts } = recordWrites()
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("checkbox", { name: /View branches/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => expect(puts).toHaveLength(1))
    expect(puts[0]).toEqual({ masterPermissionIds: [] })
  })

  it("hides the switch of an assigned permission that is unchecked in the draft", async () => {
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("checkbox", { name: /View branches/ }))

    expect(screen.queryByRole("switch", { name: "Status View branches" })).toBeNull()
  })

  it("refetches the tenant permissions after a toggle (D12.1) and confirms with a toast", async () => {
    recordWrites()
    let reads = 0
    server.use(
      http.get(`${API}/tenants/:tenantId/permissions`, () => {
        reads += 1
        return HttpResponse.json({ data: [FIXTURE_TENANT_PERMISSION_BRANCHES] })
      })
    )
    renderTab()
    await ready()
    expect(reads).toBe(1)

    fireEvent.click(screen.getByRole("switch", { name: "Status View branches" }))

    await waitFor(() => expect(reads).toBe(2))
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Permission dinonaktifkan")
    )
  })

  it("shows only the activate switch when only :activate is held", async () => {
    authMock.permissions = [
      "tenant_permissions:view",
      "master_permissions:view",
      "tenant_permissions:activate",
    ]
    renderTab()
    await ready()

    expect(screen.getByRole("switch", { name: "Status View reports" })).toBeInTheDocument()
    expect(screen.queryByRole("switch", { name: "Status View branches" })).toBeNull()
    expect(screen.getByText("Aktif")).toBeInTheDocument()
  })

  it("sends no PATCH or PUT when the user lacks every write key", async () => {
    authMock.permissions = ["tenant_permissions:view", "master_permissions:view"]
    const { puts, patches } = recordWrites()
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("checkbox", { name: /View system users/ }))

    expect(screen.getByRole("checkbox", { name: /View system users/ })).not.toBeChecked()
    expect(puts).toHaveLength(0)
    expect(patches).toHaveLength(0)
  })
})
