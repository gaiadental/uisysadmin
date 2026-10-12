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
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { ALL_ROLE_PERMISSIONS, renderWithClient } from "./test-support"
import { RoleDetailPage } from "./role-detail-page"
import { confirmPermanent } from "@/test/confirm"

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

const PRINCIPAL_ID = 1
const ADMIN_ID = 2
const PROTECTED_MESSAGE = "Operation not permitted."

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL_ROLE_PERMISSIONS
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

function renderDetail(roleId: number | string) {
  window.history.replaceState(null, "", `/system-roles/${roleId}`)
  return renderWithClient(<RoleDetailPage />, queryClient)
}

async function readyFor(name: string) {
  await screen.findByRole("heading", { name })
}

function button(name: string | RegExp) {
  return screen.queryByRole("button", { name })
}

async function openPermissionsTab() {
  fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))
  await screen.findByRole("checkbox", { name: /View branches/ })
}

function refuseWith(method: "patch" | "delete" | "put", code: string) {
  const path =
    method === "put" ? "/system-roles/:id/permissions" : "/system-roles/:id"
  server.use(
    http[method](`${API}${path}`, () =>
      errorResponse(403, code, PROTECTED_MESSAGE)
    )
  )
}

describe("SYS_PRINCIPAL static lock (D6.6, SP-BG-13)", () => {
  it("offers no deactivate/edit, no delete and no permission change", async () => {
    renderDetail(PRINCIPAL_ID)
    await readyFor("System Principal")

    expect(button(/^Ubah/)).not.toBeInTheDocument()
    expect(button(/^Hapus/)).not.toBeInTheDocument()
    expect(screen.getByText("Terkunci")).toBeInTheDocument()

    await openPermissionsTab()
    expect(button("Simpan")).not.toBeInTheDocument()
    expect(button("Batalkan")).not.toBeInTheDocument()
    for (const box of screen.getAllByRole("checkbox")) {
      expect(box).toHaveAttribute("aria-disabled", "true")
    }
  })

  it("still locks it when the user holds every permission key", async () => {
    authMock.permissions = [...ALL_ROLE_PERMISSIONS, "system_roles:activate"]
    renderDetail(PRINCIPAL_ID)
    await readyFor("System Principal")

    expect(button(/^Ubah/)).not.toBeInTheDocument()
    expect(button(/^Hapus/)).not.toBeInTheDocument()
  })
})

describe("refusal-driven disable for other roles (D6.6)", () => {
  it("disables edit and delete after a refused delete, and shows the server message", async () => {
    refuseWith("delete", "PLATFORM_ROLE_PROTECTED")
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    expect(button("Ubah System Admin")).toBeEnabled()

    fireEvent.click(screen.getByRole("button", { name: "Hapus System Admin" }))
    const dialog = await screen.findByRole("dialog")
    confirmPermanent(dialog, "Hapus")

    expect(await screen.findByText(PROTECTED_MESSAGE)).toBeInTheDocument()
    await waitFor(() => {
      expect(button("Ubah System Admin")).toBeDisabled()
      expect(button("Hapus System Admin")).toBeDisabled()
    })
  })

  it("disables edit and delete after a refused edit (ROLE_GUARD_VIOLATION)", async () => {
    refuseWith("patch", "ROLE_GUARD_VIOLATION")
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")

    fireEvent.click(screen.getByRole("button", { name: "Ubah System Admin" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    expect(await within(dialog).findByText(PROTECTED_MESSAGE)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Simpan" })).toBeDisabled()
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))
    await waitFor(() => {
      expect(button("Ubah System Admin")).toBeDisabled()
    })
    expect(button("Hapus System Admin")).toBeDisabled()
  })

  it("makes the checklist read-only after a refused permission save", async () => {
    refuseWith("put", "PLATFORM_ROLE_PROTECTED")
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    await openPermissionsTab()

    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    expect(await screen.findByText(PROTECTED_MESSAGE)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /View reports/ })).toHaveAttribute("aria-disabled", "true")
    })
    expect(button("Ubah System Admin")).toBeDisabled()
  })

  it("clears the refused state on logout (cache cleared)", async () => {
    refuseWith("delete", "ROLE_GUARD_VIOLATION")
    const first = renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    fireEvent.click(screen.getByRole("button", { name: "Hapus System Admin" }))
    confirmPermanent(await screen.findByRole("dialog"), "Hapus")
    await waitFor(() => {
      expect(button("Ubah System Admin")).toBeDisabled()
    })

    // Logout clears the whole cache (D12.2); the next session mounts the page again.
    first.unmount()
    queryClient.clear()
    server.resetHandlers()
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")

    expect(button("Ubah System Admin")).toBeEnabled()
    expect(button("Hapus System Admin")).toBeEnabled()
  })

  it("keeps the refusal for the role only, not for another role", async () => {
    refuseWith("delete", "PLATFORM_ROLE_PROTECTED")
    const first = renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    fireEvent.click(screen.getByRole("button", { name: "Hapus System Admin" }))
    confirmPermanent(await screen.findByRole("dialog"), "Hapus")
    await waitFor(() => {
      expect(button("Hapus System Admin")).toBeDisabled()
    })
    first.unmount()

    server.use(
      http.get(`${API}/system-roles/:id`, () =>
        HttpResponse.json({
          data: {
            id: 5,
            key: "SYS_SUPPORT",
            name: "Support",
            description: null,
            createdAt: "2026-10-01T03:00:00Z",
            updatedAt: "2026-10-01T03:00:00Z",
          },
        })
      )
    )
    renderDetail(5)
    await readyFor("Support")

    expect(button("Hapus Support")).toBeEnabled()
  })
})

describe("permission checklist (REQ-FE-034)", () => {
  it("pre-checks from the role keys and sends ONE PUT with permissionKeys", async () => {
    const puts: unknown[] = []
    server.use(
      http.put(`${API}/system-roles/:id/permissions`, async ({ request }) => {
        puts.push(await request.json())
        return HttpResponse.json({ data: ["branches:view", "reports:view"] })
      })
    )
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    await openPermissionsTab()
    expect(screen.getByRole("checkbox", { name: /View branches/ })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: /View reports/ })).not.toBeChecked()
    expect(button("Simpan")).toBeDisabled()

    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /View system users/ }))
    fireEvent.click(screen.getByRole("checkbox", { name: /View system users/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Permission peran disimpan.")
    })
    expect(puts).toHaveLength(1)
    expect(puts[0]).toEqual({
      permissionKeys: expect.arrayContaining(["branches:view", "reports:view"]) as string[],
    })
    expect((puts[0] as { permissionKeys: string[] }).permissionKeys).toHaveLength(2)
  })

  it("groups by module then category", async () => {
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    await openPermissionsTab()

    expect(screen.getByText("auth / system_users")).toBeInTheDocument()
    expect(screen.getByText("clinic / branches")).toBeInTheDocument()
  })

  it("is read-only without system_roles:update, with no save button", async () => {
    authMock.permissions = ["system_roles:view", "master_permissions:view"]
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    await openPermissionsTab()

    expect(screen.getByRole("checkbox", { name: /View branches/ })).toHaveAttribute("aria-disabled", "true")
    expect(button("Simpan")).not.toBeInTheDocument()
  })

  it("has no Permissions tab without master_permissions:view", async () => {
    authMock.permissions = ["system_roles:view", "system_roles:update"]
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")

    expect(screen.queryByRole("tab", { name: "Permissions" })).not.toBeInTheDocument()
  })

  it("shows an error with a retry when the role permissions fail", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/system-roles/:id/permissions`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(503, "SERVICE_UNAVAILABLE", "down")
          : HttpResponse.json({ data: ["branches:view"] })
      })
    )
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))

    fireEvent.click(await screen.findByRole("button", { name: "Coba lagi" }))

    expect(
      await screen.findByRole("checkbox", { name: /View branches/ })
    ).toBeChecked()
  })

  it("shows the loading status first", async () => {
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")
    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))

    expect(screen.getByRole("status")).toHaveTextContent("Memuat permission")
    await screen.findByRole("checkbox", { name: /View branches/ })
  })
})

describe("edit and states", () => {
  it("shows the key read-only and sends every current value on edit", async () => {
    const patches: unknown[] = []
    server.use(
      http.patch(`${API}/system-roles/:id`, async ({ request }) => {
        patches.push(await request.json())
        return HttpResponse.json({
          data: {
            id: 2,
            key: "SYS_ADMIN",
            name: "Renamed",
            description: null,
            createdAt: "2026-10-01T03:00:00Z",
            updatedAt: "2026-10-01T03:00:00Z",
          },
        })
      })
    )
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")

    fireEvent.click(screen.getByRole("button", { name: "Ubah System Admin" }))
    const dialog = await screen.findByRole("dialog")
    const key = within(dialog).getByLabelText("Key")
    expect(key).toHaveAttribute("readonly")
    fireEvent.change(within(dialog).getByLabelText("Nama"), {
      target: { value: "Renamed" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(patches).toHaveLength(1)
    })
    expect(patches[0]).toEqual({
      key: "SYS_ADMIN",
      name: "Renamed",
      description: "",
      active: true,
    })
  })

  it("deletes after confirmation and returns to the list", async () => {
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")

    fireEvent.click(screen.getByRole("button", { name: "Hapus System Admin" }))
    confirmPermanent(await screen.findByRole("dialog"), "Hapus")

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Peran dihapus.")
    })
    expect(window.location.pathname).toBe("/system-roles")
  })

  it("does not delete when the confirm dialog is cancelled", async () => {
    let deletes = 0
    server.use(
      http.delete(`${API}/system-roles/:id`, () => {
        deletes += 1
        return HttpResponse.json({ data: null })
      })
    )
    renderDetail(ADMIN_ID)
    await readyFor("System Admin")

    fireEvent.click(screen.getByRole("button", { name: "Hapus System Admin" }))
    fireEvent.click(
      within(await screen.findByRole("dialog")).getByRole("button", {
        name: "Batal",
      })
    )

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(deletes).toBe(0)
  })

  it("shows not-found for an unknown id and for a non-numeric id", async () => {
    const first = renderDetail(999)
    expect(await screen.findByText("Peran tidak ditemukan.")).toBeInTheDocument()
    first.unmount()

    renderDetail("abc")
    expect(await screen.findByText("Peran tidak ditemukan.")).toBeInTheDocument()
  })

  it("shows an error with a retry when the role fails to load", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/system-roles/:id`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(503, "SERVICE_UNAVAILABLE", "down")
          : HttpResponse.json({
              data: {
                id: 2,
                key: "SYS_ADMIN",
                name: "System Admin",
                description: null,
                createdAt: "2026-10-01T03:00:00Z",
                updatedAt: "2026-10-01T03:00:00Z",
              },
            })
      })
    )
    renderDetail(ADMIN_ID)

    fireEvent.click(await screen.findByRole("button", { name: "Coba lagi" }))

    await readyFor("System Admin")
  })
})
