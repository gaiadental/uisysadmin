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
import type { ReactElement } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import { server } from "@/test/server"

import {
  CONFLICT_MESSAGE,
  LAST_PRINCIPAL_MESSAGE,
  PROTECTED_ACCOUNT_MESSAGE,
  PROTECTED_ROLE_MESSAGE,
  ROLE_IN_USE_MESSAGE,
  SELF_ACTION_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
} from "../shared/guard-failure"
import { RoleDetailPage } from "./role-detail-page"
import { RoleListPage } from "./role-list-page"
import { ALL_ROLE_PERMISSIONS, renderWithClient } from "./test-support"
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

const STAMP = "2026-10-01T03:00:00Z"
const THIRD = {
  id: 3,
  key: "SYS_AUDIT",
  name: "System Audit",
  description: null,
  active: true,
  createdAt: STAMP,
  updatedAt: STAMP,
}
const PROTECTED = "Operation not permitted."

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

function mount(ui: ReactElement, path: string) {
  window.history.replaceState(null, "", path)
  return renderWithClient(ui, queryClient)
}
const btn = (name: string | RegExp) => screen.queryByRole("button", { name })

function threeRoles() {
  server.use(
    http.get(`${API}/system-roles`, () =>
      HttpResponse.json({
        data: [
          {
            id: 1,
            key: "SYS_PRINCIPAL",
            name: "System Principal",
            description: null,
            createdAt: STAMP,
            updatedAt: STAMP,
          },
          {
            id: 2,
            key: "SYS_ADMIN",
            name: "System Admin",
            description: null,
            createdAt: STAMP,
            updatedAt: STAMP,
          },
          THIRD,
        ],
      })
    )
  )
}

async function confirmDelete(name: string) {
  fireEvent.click(screen.getByRole("button", { name: `Hapus ${name}` }))
  confirmPermanent(await screen.findByRole("dialog"), "Hapus")
}

describe("list: refusal isolation and non-refusal failures", () => {
  it("a refusal for one role leaves the other deletable role enabled", async () => {
    threeRoles()
    server.use(
      http.delete(`${API}/system-roles/:id`, () =>
        errorResponse(403, "ROLE_GUARD_VIOLATION", PROTECTED)
      )
    )
    mount(<RoleListPage />, "/system-roles")
    await screen.findByRole("link", { name: "System Audit" })
    expect(btn("Hapus System Admin")).toBeEnabled()
    expect(btn("Hapus System Audit")).toBeEnabled()

    await confirmDelete("System Admin")

    await waitFor(() => {
      expect(btn("Hapus System Admin")).toBeDisabled()
    })
    expect(btn("Ubah System Admin")).toBeDisabled()
    expect(btn("Ubah System Audit")).toBeEnabled()
    expect(btn("Hapus System Audit")).toBeEnabled()
    // SYS_PRINCIPAL stays locked, not "refused".
    expect(btn(/System Principal/)).not.toBeInTheDocument()
  })

  it("a 500 on delete shows an error but does NOT disable edit or delete", async () => {
    server.use(
      http.delete(`${API}/system-roles/:id`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    mount(<RoleListPage />, "/system-roles")
    await screen.findByRole("link", { name: "System Admin" })

    await confirmDelete("System Admin")

    await waitFor(() => {
      expect(btn("Hapus System Admin")).toBeEnabled()
    })
    expect(btn("Ubah System Admin")).toBeEnabled()
    expect(screen.queryByText("Ditolak server")).not.toBeInTheDocument()
  })

  it("a 409 on delete (role with members, OQ-P-44) is a generic failure, not a refusal", async () => {
    server.use(
      http.delete(`${API}/system-roles/:id`, () =>
        errorResponse(409, "SYSTEM_ROLE_IN_USE", "Role in use.")
      )
    )
    mount(<RoleListPage />, "/system-roles")
    await screen.findByRole("link", { name: "System Admin" })

    await confirmDelete("System Admin")

    await waitFor(() => {
      expect(btn("Hapus System Admin")).toBeEnabled()
    })
    expect(btn("Ubah System Admin")).toBeEnabled()
  })

  it("refusal state set in the list disappears after queryClient.clear() on a remounted list", async () => {
    server.use(
      http.delete(`${API}/system-roles/:id`, () =>
        errorResponse(403, "PLATFORM_ROLE_PROTECTED", PROTECTED)
      )
    )
    const first = mount(<RoleListPage />, "/system-roles")
    await screen.findByRole("link", { name: "System Admin" })
    await confirmDelete("System Admin")
    await waitFor(() => {
      expect(btn("Ubah System Admin")).toBeDisabled()
    })
    first.unmount()
    queryClient.clear()
    server.resetHandlers()

    mount(<RoleListPage />, "/system-roles")
    await screen.findByRole("link", { name: "System Admin" })

    expect(btn("Ubah System Admin")).toBeEnabled()
  })
})

describe("list: member counts", () => {
  it("shows 0 for a role without users when system_users:view is held", async () => {
    threeRoles()
    mount(<RoleListPage />, "/system-roles")
    await screen.findByRole("link", { name: "System Audit" })
    const row = screen.getByRole("link", { name: "System Audit" }).closest("tr") as HTMLElement
    await waitFor(() => {
      expect(within(row).getByText("0")).toBeInTheDocument()
    })
    expect(within(row).queryByText("-")).not.toBeInTheDocument()
  })

  it("shows a dash on every row without system_users:view, including empty roles", async () => {
    authMock.permissions = ["system_roles:view"]
    threeRoles()
    mount(<RoleListPage />, "/system-roles")
    await screen.findByRole("link", { name: "System Audit" })
    for (const name of ["System Principal", "System Admin", "System Audit"]) {
      const row = screen.getByRole("link", { name }).closest("tr") as HTMLElement
      expect(within(row).getByText("-")).toBeInTheDocument()
      expect(within(row).queryByText(/^\d+$/)).not.toBeInTheDocument()
    }
  })

  it("keeps counts out when the user list fails (no false zero)", async () => {
    server.use(
      http.get(`${API}/system-users`, () =>
        errorResponse(503, "SERVICE_UNAVAILABLE", "down")
      )
    )
    mount(<RoleListPage />, "/system-roles")
    await screen.findByRole("link", { name: "System Admin" })
    const row = screen.getByRole("link", { name: "System Admin" }).closest("tr") as HTMLElement
    await waitFor(() => {
      expect(within(row).getByText("-")).toBeInTheDocument()
    })
    expect(within(row).queryByText("0")).not.toBeInTheDocument()
  })
})

describe("detail: each gate key independently", () => {
  async function open() {
    mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })
  }

  it("system_roles:update alone: Ubah yes, Hapus no", async () => {
    authMock.permissions = ["system_roles:view", "system_roles:update"]
    await open()
    expect(btn("Ubah System Admin")).toBeInTheDocument()
    expect(btn("Hapus System Admin")).not.toBeInTheDocument()
  })

  it("system_roles:delete alone: Hapus yes, Ubah no", async () => {
    authMock.permissions = ["system_roles:view", "system_roles:delete"]
    await open()
    expect(btn("Hapus System Admin")).toBeInTheDocument()
    expect(btn("Ubah System Admin")).not.toBeInTheDocument()
  })

  it("view only: neither action button is offered", async () => {
    authMock.permissions = ["system_roles:view"]
    await open()
    expect(btn(/^Ubah/)).not.toBeInTheDocument()
    expect(btn(/^Hapus/)).not.toBeInTheDocument()
  })

  it("update without master_permissions:view: no checklist tab, so no save", async () => {
    authMock.permissions = ["system_roles:view", "system_roles:update"]
    await open()
    expect(screen.queryByRole("tab", { name: "Permissions" })).not.toBeInTheDocument()
    expect(btn("Simpan")).not.toBeInTheDocument()
  })

  it("master_permissions:view + update but no delete: checklist editable", async () => {
    authMock.permissions = [
      "system_roles:view",
      "system_roles:update",
      "master_permissions:view",
    ]
    await open()
    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))
    const box = await screen.findByRole("checkbox", { name: /View reports/ })
    expect(box).not.toHaveAttribute("aria-disabled", "true")
    expect(btn("Hapus System Admin")).not.toBeInTheDocument()
  })
})

describe("detail: checklist PUT behaviour", () => {
  async function openChecklist() {
    mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })
    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))
    await screen.findByRole("checkbox", { name: /View branches/ })
  }

  it("keeps keys outside the catalogue in the PUT (OQ-P-40)", async () => {
    const puts: { permissionKeys: string[] }[] = []
    server.use(
      http.get(`${API}/system-roles/:id/permissions`, () =>
        HttpResponse.json({ data: ["branches:view", "legacy:gone"] })
      ),
      http.put(`${API}/system-roles/:id/permissions`, async ({ request }) => {
        const body = (await request.json()) as { permissionKeys: string[] }
        puts.push(body)
        return HttpResponse.json({ data: body.permissionKeys })
      })
    )
    await openChecklist()

    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(puts).toHaveLength(1)
    })
    expect([...puts[0]!.permissionKeys].sort()).toEqual(
      ["branches:view", "legacy:gone", "reports:view"].sort()
    )
  })

  it("unchecking everything sends one PUT with an empty list", async () => {
    const puts: unknown[] = []
    server.use(
      http.put(`${API}/system-roles/:id/permissions`, async ({ request }) => {
        puts.push(await request.json())
        return HttpResponse.json({ data: [] })
      })
    )
    await openChecklist()

    fireEvent.click(screen.getByRole("checkbox", { name: /View branches/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(puts).toHaveLength(1)
    })
    expect(puts[0]).toEqual({ permissionKeys: [] })
  })

  it("Batalkan restores the saved set and sends nothing", async () => {
    let puts = 0
    server.use(
      http.put(`${API}/system-roles/:id/permissions`, () => {
        puts += 1
        return HttpResponse.json({ data: [] })
      })
    )
    await openChecklist()

    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    expect(screen.getByRole("checkbox", { name: /View reports/ })).toBeChecked()
    fireEvent.click(screen.getByRole("button", { name: "Batalkan" }))

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /View reports/ })).not.toBeChecked()
    })
    expect(btn("Simpan")).toBeDisabled()
    expect(puts).toBe(0)
  })

  it("invalidates this role's permissions (D12.1): GET refetches once after the save", async () => {
    let gets = 0
    server.use(
      http.get(`${API}/system-roles/:id/permissions`, () => {
        gets += 1
        return HttpResponse.json({
          data: gets === 1 ? ["branches:view"] : ["branches:view", "reports:view"],
        })
      })
    )
    await openChecklist()
    expect(gets).toBe(1)

    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Permission peran disimpan.")
    })
    await waitFor(() => {
      expect(gets).toBe(2)
    })
    expect(screen.getByRole("checkbox", { name: /View reports/ })).toBeChecked()
    expect(btn("Simpan")).toBeDisabled()
  })

  it("a 500 on the PUT keeps the checklist editable (not a refusal) and shows the error", async () => {
    server.use(
      http.put(`${API}/system-roles/:id/permissions`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    await openChecklist()

    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(toastMock.success).not.toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(btn("Simpan")).toBeEnabled()
    })
    expect(screen.getByRole("checkbox", { name: /View reports/ })).not.toHaveAttribute(
      "aria-disabled",
      "true"
    )
    expect(btn("Ubah System Admin")).toBeEnabled()
  })

  it("shows the empty-catalogue message", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () => HttpResponse.json({ data: [] }))
    )
    mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })
    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))

    expect(await screen.findByText("Belum ada permission di katalog.")).toBeInTheDocument()
  })

  it("shows the error state when the catalogue fails", async () => {
    server.use(
      http.get(`${API}/master-permissions`, () =>
        errorResponse(503, "SERVICE_UNAVAILABLE", "down")
      )
    )
    mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })
    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))

    expect(await screen.findByRole("button", { name: "Coba lagi" })).toBeInTheDocument()
  })
})

describe("detail: edit and refusal paths", () => {
  it("a successful edit invalidates the role list, user list and detail (D12.1)", async () => {
    mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    fireEvent.click(screen.getByRole("button", { name: "Ubah System Admin" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Nama"), {
      target: { value: "Renamed" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalled()
    })
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey)
    expect(keys).toContainEqual(["system", "roles"])
    expect(keys).toContainEqual(["system", "users"])
    expect(keys).toContainEqual(["system", "role", 2])
  })

  it("a 500 on the edit PATCH does not mark the role refused", async () => {
    server.use(
      http.patch(`${API}/system-roles/:id`, () =>
        errorResponse(500, "INTERNAL_ERROR", "boom")
      )
    )
    mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })

    fireEvent.click(screen.getByRole("button", { name: "Ubah System Admin" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))
    await waitFor(() => {
      expect(within(dialog).getByRole("button", { name: "Simpan" })).toBeEnabled()
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(btn("Ubah System Admin")).toBeEnabled()
    expect(btn("Hapus System Admin")).toBeEnabled()
  })

  it("a refused permission PUT on role 2 leaves role 3 editable in the same session", async () => {
    threeRoles()
    server.use(
      http.get(`${API}/system-roles/:id`, ({ params }) =>
        HttpResponse.json({
          data: Number(params.id) === 3 ? THIRD : { ...THIRD, id: 2, key: "SYS_ADMIN", name: "System Admin" },
        })
      ),
      http.put(`${API}/system-roles/2/permissions`, () =>
        errorResponse(403, "PLATFORM_ROLE_PROTECTED", PROTECTED)
      )
    )
    const first = mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })
    fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))
    await screen.findByRole("checkbox", { name: /View branches/ })
    fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => {
      expect(btn("Ubah System Admin")).toBeDisabled()
    })
    first.unmount()

    mount(<RoleDetailPage />, "/system-roles/3")
    await screen.findByRole("heading", { name: "System Audit" })
    expect(btn("Ubah System Audit")).toBeEnabled()
    expect(btn("Hapus System Audit")).toBeEnabled()
  })
})

const SERVER_TEXT = "Server text that must stay hidden."
const GUARD_CASES: readonly (readonly [number, string, string])[] = [
  [409, "SELF_ACTION_NOT_ALLOWED", SELF_ACTION_MESSAGE],
  [409, "LAST_SYSTEM_PRINCIPAL", LAST_PRINCIPAL_MESSAGE],
  [409, "SYSTEM_ROLE_IN_USE", ROLE_IN_USE_MESSAGE],
  [503, "SERVICE_UNAVAILABLE", SERVICE_UNAVAILABLE_MESSAGE],
  [403, "PLATFORM_ROLE_PROTECTED", PROTECTED_ROLE_MESSAGE],
  [403, "ROLE_GUARD_VIOLATION", PROTECTED_ROLE_MESSAGE],
  [409, "SOME_NEW_CONFLICT", CONFLICT_MESSAGE],
  [503, "SOME_NEW_OUTAGE", SERVICE_UNAVAILABLE_MESSAGE],
]

describe("system role pages: fixed guard copy (D13.1, REQ-FE-053)", () => {
  it.each(GUARD_CASES)(
    "delete on the detail page: %i %s shows the fixed copy and the reference id",
    async (status, code, expected) => {
      server.use(
        http.delete(`${API}/system-roles/:id`, () =>
          errorResponse(status, code, SERVER_TEXT)
        )
      )
      mount(<RoleDetailPage />, "/system-roles/2")
      await screen.findByRole("heading", { name: "System Admin" })

      await confirmDelete("System Admin")

      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent(expected)
      expect(alert).toHaveTextContent("Kode referensi")
      expect(screen.queryByText(SERVER_TEXT, { exact: false })).toBeNull()
    }
  )

  it.each(GUARD_CASES)(
    "delete in the list: %i %s shows the fixed copy",
    async (status, code, expected) => {
      threeRoles()
      server.use(
        http.delete(`${API}/system-roles/:id`, () =>
          errorResponse(status, code, SERVER_TEXT)
        )
      )
      mount(<RoleListPage />, "/system-roles")
      await screen.findByRole("link", { name: "System Audit" })

      await confirmDelete("System Audit")

      expect(await screen.findByText(expected)).toBeInTheDocument()
      expect(screen.queryByText(SERVER_TEXT, { exact: false })).toBeNull()
    }
  )

  it.each(GUARD_CASES)(
    "edit form: %i %s shows the fixed copy inside the dialog",
    async (status, code, expected) => {
      server.use(
        http.patch(`${API}/system-roles/:id`, () =>
          errorResponse(status, code, SERVER_TEXT)
        )
      )
      mount(<RoleDetailPage />, "/system-roles/2")
      await screen.findByRole("heading", { name: "System Admin" })

      fireEvent.click(screen.getByRole("button", { name: "Ubah System Admin" }))
      const dialog = await screen.findByRole("dialog")
      fireEvent.click(within(dialog).getByRole("button", { name: "Simpan" }))

      const alert = await within(dialog).findByRole("alert")
      expect(alert).toHaveTextContent(expected)
      expect(alert).toHaveTextContent("Kode referensi")
      expect(alert).not.toHaveTextContent(SERVER_TEXT)
    }
  )

  it.each(GUARD_CASES)(
    "create form: %i %s shows the fixed copy inside the dialog",
    async (status, code, expected) => {
      server.use(
        http.post(`${API}/system-roles`, () =>
          errorResponse(status, code, SERVER_TEXT)
        )
      )
      mount(<RoleListPage />, "/system-roles")
      fireEvent.click(await screen.findByRole("button", { name: "Tambah peran" }))
      const dialog = await screen.findByRole("dialog")
      fireEvent.change(within(dialog).getByLabelText("Key"), {
        target: { value: "SYS_NEW" },
      })
      fireEvent.change(within(dialog).getByLabelText("Nama"), {
        target: { value: "New Role" },
      })
      fireEvent.click(within(dialog).getByRole("button", { name: "Buat peran" }))

      const alert = await within(dialog).findByRole("alert")
      expect(alert).toHaveTextContent(expected)
      expect(alert).not.toHaveTextContent(SERVER_TEXT)
    }
  )

  it.each(GUARD_CASES)(
    "permission replace: %i %s shows the fixed copy",
    async (status, code, expected) => {
      server.use(
        http.put(`${API}/system-roles/:id/permissions`, () =>
          errorResponse(status, code, SERVER_TEXT)
        )
      )
      mount(<RoleDetailPage />, "/system-roles/2")
      await screen.findByRole("heading", { name: "System Admin" })
      fireEvent.click(await screen.findByRole("tab", { name: "Permissions" }))
      await screen.findByRole("checkbox", { name: /View branches/ })
      fireEvent.click(screen.getByRole("checkbox", { name: /View reports/ }))
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }))

      const alert = await screen.findByRole("alert")
      expect(alert).toHaveTextContent(expected)
      expect(alert).toHaveTextContent("Kode referensi")
      expect(alert).not.toHaveTextContent(SERVER_TEXT)
    }
  )

  it("PLATFORM_ROLE_PROTECTED shows the role copy here, which differs from the account copy", async () => {
    server.use(
      http.delete(`${API}/system-roles/:id`, () =>
        errorResponse(403, "PLATFORM_ROLE_PROTECTED", SERVER_TEXT)
      )
    )
    mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })
    await confirmDelete("System Admin")

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(PROTECTED_ROLE_MESSAGE)
    expect(alert).not.toHaveTextContent(PROTECTED_ACCOUNT_MESSAGE)
    expect(PROTECTED_ROLE_MESSAGE).not.toBe(PROTECTED_ACCOUNT_MESSAGE)
  })

  it("SYSTEM_ROLE_KEY_EXISTS keeps its own field error on create", async () => {
    server.use(
      http.post(`${API}/system-roles`, () =>
        errorResponse(409, "SYSTEM_ROLE_KEY_EXISTS", "Key already used.")
      )
    )
    mount(<RoleListPage />, "/system-roles")
    fireEvent.click(await screen.findByRole("button", { name: "Tambah peran" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Key"), {
      target: { value: "SYS_ADMIN" },
    })
    fireEvent.change(within(dialog).getByLabelText("Nama"), {
      target: { value: "Dup" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Buat peran" }))

    expect(await within(dialog).findByText("Key already used.")).toBeInTheDocument()
    expect(within(dialog).queryByText(CONFLICT_MESSAGE)).toBeNull()
  })
})

describe("ROLE_GUARD_VIOLATION on the role detail delete (v1.0.7)", () => {
  it("shows the fixed role copy and reference id, hides the server text and marks the role refused", async () => {
    server.use(
      http.delete(`${API}/system-roles/:id`, () =>
        errorResponse(403, "ROLE_GUARD_VIOLATION", SERVER_TEXT)
      )
    )
    mount(<RoleDetailPage />, "/system-roles/2")
    await screen.findByRole("heading", { name: "System Admin" })

    await confirmDelete("System Admin")

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(PROTECTED_ROLE_MESSAGE)
    expect(alert).toHaveTextContent("Kode referensi")
    expect(screen.queryByText(SERVER_TEXT, { exact: false })).toBeNull()
    await waitFor(() => {
      expect(btn("Ubah System Admin")).toBeDisabled()
      expect(btn("Hapus System Admin")).toBeDisabled()
    })
  })
})
