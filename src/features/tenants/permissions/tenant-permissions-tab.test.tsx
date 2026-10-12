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

describe("states (D13)", () => {
  it("shows a loading status, then the checklist", async () => {
    renderTab()

    expect(screen.getByRole("status")).toHaveTextContent("Memuat permission")
    await ready()
  })

  it("shows an error alert with a retry when a read fails", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        errorResponse(502, "INTERNAL_ERROR", "bad gateway")
      )
    )
    renderTab()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Layanan sedang bermasalah"
    )
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument()
  })

  it("shows an empty message for an empty catalogue", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () => HttpResponse.json({ data: [] }))
    )
    renderTab()

    expect(
      await screen.findByText("Belum ada permission di katalog.")
    ).toBeInTheDocument()
  })
})

describe("checklist", () => {
  it("pre-checks the saved permissions and groups by module and category", async () => {
    renderTab()
    await ready()

    expect(screen.getByRole("checkbox", { name: /View branches/ })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: /View reports/ })).toBeChecked()
    expect(
      screen.getByRole("checkbox", { name: /View system users/ })
    ).not.toBeChecked()
    expect(screen.getByRole("group", { name: "auth / system_users" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "clinic / branches" })).toBeInTheDocument()
  })

  it("keeps Simpan disabled until the selection changes", async () => {
    renderTab()
    await ready()

    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled()
    fireEvent.click(screen.getByRole("checkbox", { name: /View system users/ }))
    expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled()
  })
})

describe("save (PUT)", () => {
  it("sends exactly one PUT with the selected ids", async () => {
    const { puts, patches } = recordWrites()
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("checkbox", { name: /View system users/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => expect(toastMock.success).toHaveBeenCalled())
    expect(puts).toHaveLength(1)
    expect(puts[0]).toEqual({ masterPermissionIds: [1, 3] })
    expect(patches).toHaveLength(0)
  })

  it("refetches the tenant permissions after a save (D12.1)", async () => {
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

    fireEvent.click(screen.getByRole("checkbox", { name: /View system users/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => expect(reads).toBe(2))
  })

  it("shows the server message and keeps the selection when the save fails", async () => {
    server.use(
      http.put(`${API}/tenants/:tenantId/permissions`, () =>
        errorResponse(400, "VALIDATION_FAILED", "Unknown permission id")
      )
    )
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("checkbox", { name: /View system users/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unknown permission id"
    )
    expect(
      screen.getByRole("checkbox", { name: /View system users/ })
    ).toBeChecked()
  })

  it("restores the saved selection with Batalkan", async () => {
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("checkbox", { name: /View system users/ }))
    fireEvent.click(screen.getByRole("button", { name: "Batalkan" }))

    expect(
      screen.getByRole("checkbox", { name: /View system users/ })
    ).not.toBeChecked()
  })
})

describe("toggle (PATCH)", () => {
  it("sends exactly one PATCH with enabled=false when an enabled permission is switched off", async () => {
    const { puts, patches } = recordWrites()
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("switch", { name: "Status View branches" }))

    await waitFor(() => expect(patches).toHaveLength(1))
    expect(patches[0]).toEqual({
      path: `/api/v1/tenants/${TENANT_ID}/permissions/10`,
      body: { enabled: false },
    })
    expect(puts).toHaveLength(0)
  })

  it("sends enabled=true when a disabled permission is switched on", async () => {
    const { patches } = recordWrites()
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("switch", { name: "Status View reports" }))

    await waitFor(() => expect(patches).toHaveLength(1))
    expect(patches[0]?.body).toEqual({ enabled: true })
    expect(patches[0]?.path).toBe(`/api/v1/tenants/${TENANT_ID}/permissions/11`)
  })

  it("shows the server message when the toggle fails", async () => {
    server.use(
      http.patch(`${API}/tenants/:tenantId/permissions/:permissionId`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )
    renderTab()
    await ready()

    fireEvent.click(screen.getByRole("switch", { name: "Status View branches" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Anda tidak punya akses untuk aksi ini."
    )
  })
})

describe("actions hidden when the permission key is absent (D6.4)", () => {
  const VIEW_ONLY = ["tenant_permissions:view", "master_permissions:view"]

  it("hides Simpan and Batalkan, and makes the checklist read-only, without :update", async () => {
    authMock.permissions = VIEW_ONLY
    renderTab()
    await ready()

    expect(screen.queryByRole("button", { name: "Simpan" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Batalkan" })).toBeNull()
    expect(screen.getByRole("checkbox", { name: /View branches/ })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
  })

  it("hides every switch with no activate or deactivate key and shows status text", async () => {
    authMock.permissions = VIEW_ONLY
    renderTab()
    await ready()

    expect(screen.queryAllByRole("switch")).toHaveLength(0)
    expect(screen.getByText("Aktif")).toBeInTheDocument()
    expect(screen.getByText("Nonaktif")).toBeInTheDocument()
  })

  it("shows only the switch the held key allows", async () => {
    authMock.permissions = [...VIEW_ONLY, "tenant_permissions:deactivate"]
    renderTab()
    await ready()

    // branches is enabled: turning it off needs :deactivate. reports is disabled: turning it on needs :activate.
    expect(
      screen.getByRole("switch", { name: "Status View branches" })
    ).toBeInTheDocument()
    expect(screen.queryByRole("switch", { name: "Status View reports" })).toBeNull()
  })
})
