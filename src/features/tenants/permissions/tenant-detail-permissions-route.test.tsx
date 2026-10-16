// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DialogsProvider } from "@/components/dialogs/dialogs"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { FIXTURE_ME } from "@/test/handlers/auth"
import { FIXTURE_TENANT } from "@/test/handlers/tenants"

import { TenantDetailPage } from "../detail/tenant-detail-page"

const authMock = vi.hoisted(() => ({ permissions: [] as string[] }))
vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => ({
    status: "authenticated",
    me: { ...FIXTURE_ME, permissions: authMock.permissions, branches: [] },
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
  authMock.permissions = ["tenant_permissions:view", "master_permissions:view"]
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

function renderAt(path: string) {
  window.history.replaceState(null, "", path)
  return render(
    <QueryClientProvider client={queryClient}>
      <DialogsProvider>
        <TenantDetailPage />
      </DialogsProvider>
    </QueryClientProvider>
  )
}

describe("Permissions tab on the detail page (D7)", () => {
  it("opens the Permissions tab on /tenants/:id/permissions", async () => {
    renderAt(`/tenants/${FIXTURE_TENANT.id}/permissions`)

    expect(
      await screen.findByRole("checkbox", { name: /View appointments/ })
    ).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Permissions" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("moves the address to the permissions path when the tab is chosen, and back for Ringkasan", async () => {
    renderAt(`/tenants/${FIXTURE_TENANT.id}`)

    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))
    expect(window.location.pathname).toBe(
      `/tenants/${FIXTURE_TENANT.id}/permissions`
    )

    fireEvent.click(screen.getByRole("tab", { name: "Ringkasan" }))
    expect(window.location.pathname).toBe(`/tenants/${FIXTURE_TENANT.id}`)
  })

  it("carries the chosen tab in the address, so Profil survives the route change from Permissions", async () => {
    renderAt(`/tenants/${FIXTURE_TENANT.id}/permissions`)

    fireEvent.click(await screen.findByRole("tab", { name: "Profil" }))
    expect(window.location.pathname).toBe(`/tenants/${FIXTURE_TENANT.id}`)
    expect(window.location.search).toBe("?tab=profile")

    // The router remounts the page on a route change. Mount it again at the new address.
    cleanup()
    renderAt(`${window.location.pathname}${window.location.search}`)

    expect(await screen.findByRole("tab", { name: "Profil" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("opens Ringkasan when the address has no tab", async () => {
    renderAt(`/tenants/${FIXTURE_TENANT.id}`)

    expect(
      await screen.findByRole("tab", { name: "Ringkasan" })
    ).toHaveAttribute("aria-selected", "true")
  })

  it("does not render the Permissions tab without both view keys", async () => {
    authMock.permissions = ["tenant_permissions:view"]
    renderAt(`/tenants/${FIXTURE_TENANT.id}`)

    await screen.findByRole("tab", { name: "Ringkasan" })
    expect(screen.queryByRole("tab", { name: "Permissions" })).toBeNull()
  })
})
