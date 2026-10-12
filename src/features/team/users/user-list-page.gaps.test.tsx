// @vitest-environment jsdom
// Gap coverage for TODO-014 list screen (unit-test-writer). Complements
// user-list-page.test.tsx: exact button sets per gate key, status transition
// visibility, cancel paths, error mapping, double-send guard, client paging
// and D12.1 invalidation.
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

import { GENERIC_WRITE_MESSAGE } from "@/features/tenants/create/write-failure"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { queryKeys } from "@/lib/query/keys"
import { API, errorResponse, FIXTURE_ME } from "@/test/handlers/auth"
import {
  FIXTURE_USER_ACTIVE,
  FIXTURE_USER_DEACTIVATED,
  FIXTURE_USER_SELF,
  FIXTURE_USER_SUSPENDED,
  FIXTURE_USERS,
} from "@/test/handlers/system-users"
import { server } from "@/test/server"

import { ALL_USER_PERMISSIONS, renderWithClient } from "./test-support"
import { USER_NOT_FOUND_MESSAGE } from "./user-failure"
import { UserListPage } from "./user-list-page"
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

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  authMock.permissions = ALL_USER_PERMISSIONS
  window.history.replaceState(null, "", "/system-users")
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

async function ready() {
  await screen.findByText(FIXTURE_USER_ACTIVE.loginId)
}

function rowOf(loginId: string): HTMLElement {
  return screen.getByRole("row", { name: new RegExp(loginId) })
}

/** Accessible names of the action buttons in one row, e.g. "Tangguhkan ops@gaia.com". */
function actionNames(loginId: string): string[] {
  return within(rowOf(loginId))
    .queryAllByRole("button")
    .map((node) => node.getAttribute("aria-label") ?? node.textContent ?? "")
}

function names(loginId: string, labels: string[]): string[] {
  return labels.map((label) => `${label} ${loginId}`)
}

async function openDialogFor(name: string) {
  renderWithClient(<UserListPage />, queryClient)
  await ready()
  fireEvent.click(screen.getByRole("button", { name }))
  return screen.findByRole("dialog")
}

describe("each gate key independently (D6.4)", () => {
  it.each([
    [
      "system_users:update",
      {
        active: ["Nonaktifkan", "Tangguhkan"],
        suspended: ["Aktifkan", "Nonaktifkan"],
        deactivated: ["Aktifkan"],
      },
    ],
    [
      "system_users:delete",
      { active: ["Hapus"], suspended: ["Hapus"], deactivated: ["Hapus"] },
    ],
    [
      "system_users:reset_password",
      {
        active: ["Reset password"],
        suspended: ["Reset password"],
        deactivated: ["Reset password"],
      },
    ],
  ])("%s alone gives exactly its buttons per status", async (key, expected) => {
    authMock.permissions = ["system_users:view", key]
    renderWithClient(<UserListPage />, queryClient)
    await ready()

    const sorted = (loginId: string) => actionNames(loginId).sort()
    expect(sorted(FIXTURE_USER_ACTIVE.loginId)).toEqual(
      names(FIXTURE_USER_ACTIVE.loginId, expected.active).sort()
    )
    expect(sorted(FIXTURE_USER_SUSPENDED.loginId)).toEqual(
      names(FIXTURE_USER_SUSPENDED.loginId, expected.suspended).sort()
    )
    expect(sorted(FIXTURE_USER_DEACTIVATED.loginId)).toEqual(
      names(FIXTURE_USER_DEACTIVATED.loginId, expected.deactivated).sort()
    )
  })

  it("system_users:view only renders no action button anywhere", async () => {
    authMock.permissions = ["system_users:view"]
    renderWithClient(<UserListPage />, queryClient)
    await ready()

    for (const user of FIXTURE_USERS) {
      expect(actionNames(user.loginId)).toEqual([])
    }
  })

  it("system_roles:view and system_users:create without update add no row action", async () => {
    authMock.permissions = [
      "system_users:view",
      "system_users:create",
      "system_roles:view",
    ]
    renderWithClient(<UserListPage />, queryClient)
    await ready()

    for (const user of FIXTURE_USERS) {
      expect(actionNames(user.loginId)).toEqual([])
    }
  })
})

describe("own account (D6.6, amendment 2026-10-12)", () => {
  it("keeps only reset password on the own ACTIVE row with every permission", async () => {
    renderWithClient(<UserListPage />, queryClient)
    await ready()

    expect(actionNames(FIXTURE_USER_SELF.loginId)).toEqual(
      names(FIXTURE_USER_SELF.loginId, ["Reset password"])
    )
  })

  it("offers reactivate (and still no deactivate or delete) when the own status is not ACTIVE (OQ-P-32)", async () => {
    server.use(
      http.get(`${API}/system-users`, () =>
        HttpResponse.json({
          data: [{ ...FIXTURE_USER_SELF, status: "SUSPENDED" }, FIXTURE_USER_ACTIVE],
        })
      )
    )
    renderWithClient(<UserListPage />, queryClient)
    await ready()

    expect(actionNames(FIXTURE_USER_SELF.loginId).sort()).toEqual(
      names(FIXTURE_USER_SELF.loginId, ["Aktifkan", "Reset password"]).sort()
    )
  })

  it("does not treat a user as self when ids differ only by the loginId", async () => {
    server.use(
      http.get(`${API}/system-users`, () =>
        HttpResponse.json({
          data: [
            { ...FIXTURE_USER_ACTIVE, loginId: FIXTURE_USER_SELF.loginId },
          ],
        })
      )
    )
    renderWithClient(<UserListPage />, queryClient)
    await screen.findByText(FIXTURE_USER_SELF.loginId)

    expect(screen.queryByText("self")).not.toBeInTheDocument()
    expect(actionNames(FIXTURE_USER_SELF.loginId)).toContain(
      `Hapus ${FIXTURE_USER_SELF.loginId}`
    )
  })
})

describe("confirm dialogs cancel and confirm", () => {
  it.each([
    ["Nonaktifkan ops@gaia.com", "patch"],
    ["Hapus ops@gaia.com", "delete"],
    ["Reset password ops@gaia.com", "post"],
  ])("cancelling %s sends nothing and leaves no toast", async (name, method) => {
    const calls: string[] = []
    server.use(
      http.patch(`${API}/system-users/:id/status`, () => {
        calls.push("patch")
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      }),
      http.delete(`${API}/system-users/:id`, () => {
        calls.push("delete")
        return HttpResponse.json({ data: null })
      }),
      http.post(`${API}/system-users/:id/reset-password`, () => {
        calls.push("post")
        return HttpResponse.json({ data: null })
      })
    )
    const dialog = await openDialogFor(name)

    fireEvent.click(within(dialog).getByRole("button", { name: "Batal" }))

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(calls).not.toContain(method)
    expect(calls).toEqual([])
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("names the target account in the confirm title", async () => {
    const dialog = await openDialogFor("Hapus ops@gaia.com")

    expect(within(dialog).getByText("Hapus akun ops@gaia.com?")).toBeInTheDocument()
  })

  it("shows a status transition result: reactivate from DEACTIVATED sends ACTIVE once", async () => {
    const bodies: unknown[] = []
    server.use(
      http.patch(`${API}/system-users/:id/status`, async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({ data: FIXTURE_USER_DEACTIVATED })
      })
    )
    renderWithClient(<UserListPage />, queryClient)
    await ready()

    fireEvent.click(
      screen.getByRole("button", {
        name: `Aktifkan ${FIXTURE_USER_DEACTIVATED.loginId}`,
      })
    )

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ status: "ACTIVE" })
  })

  it("suspended row: deactivate sends DEACTIVATED to that row's id", async () => {
    const calls: Array<{ path: string; body: unknown }> = []
    server.use(
      http.patch(`${API}/system-users/:id/status`, async ({ request }) => {
        calls.push({
          path: new URL(request.url).pathname,
          body: await request.json(),
        })
        return HttpResponse.json({ data: FIXTURE_USER_SUSPENDED })
      })
    )
    const dialog = await openDialogFor(
      `Nonaktifkan ${FIXTURE_USER_SUSPENDED.loginId}`
    )
    fireEvent.click(within(dialog).getByRole("button", { name: "Nonaktifkan" }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]).toEqual({
      path: `/api/v1/system-users/${FIXTURE_USER_SUSPENDED.id}/status`,
      body: { status: "DEACTIVATED" },
    })
  })
})

describe("error mapping on row actions (D13)", () => {
  async function confirmAndFail(
    name: string,
    confirmLabel: string,
    handler: ReturnType<typeof http.patch | typeof http.delete | typeof http.post>
  ) {
    server.use(handler)
    const dialog = await openDialogFor(name)
    if (confirmLabel === "Hapus") {
      confirmPermanent(dialog, confirmLabel)
    } else {
      fireEvent.click(within(dialog).getByRole("button", { name: confirmLabel }))
    }
    return screen.findByRole("alert")
  }

  it("404 SYSTEM_USER_NOT_FOUND on delete shows the frontend not-found copy", async () => {
    const alert = await confirmAndFail(
      "Hapus ops@gaia.com",
      "Hapus",
      http.delete(`${API}/system-users/:id`, () =>
        errorResponse(404, "SYSTEM_USER_NOT_FOUND", "raw server text")
      )
    )

    expect(alert).toHaveTextContent(USER_NOT_FOUND_MESSAGE)
    expect(alert).not.toHaveTextContent("raw server text")
    expect(toastMock.success).not.toHaveBeenCalled()
  })

  it("409 on a status change shows the server message", async () => {
    const alert = await confirmAndFail(
      "Tangguhkan ops@gaia.com",
      "Tangguhkan",
      http.patch(`${API}/system-users/:id/status`, () =>
        errorResponse(409, "SYSTEM_USER_STATE_CONFLICT", "State already changed.")
      )
    )

    expect(alert).toHaveTextContent("State already changed.")
  })

  it("400 without a validation code shows the generic line, not the server text", async () => {
    const alert = await confirmAndFail(
      "Reset password ops@gaia.com",
      "Reset password",
      http.post(`${API}/system-users/:id/reset-password`, () =>
        errorResponse(400, "SOMETHING_ELSE", "internal detail")
      )
    )

    expect(alert).toHaveTextContent(GENERIC_WRITE_MESSAGE)
    expect(alert).not.toHaveTextContent("internal detail")
  })

  it("400 VALIDATION_FAILED shows the server message", async () => {
    const alert = await confirmAndFail(
      "Reset password ops@gaia.com",
      "Reset password",
      http.post(`${API}/system-users/:id/reset-password`, () =>
        errorResponse(400, "VALIDATION_FAILED", "Mail address rejected.")
      )
    )

    expect(alert).toHaveTextContent("Mail address rejected.")
  })

  it("500 shows the generic line and re-enables the buttons", async () => {
    const alert = await confirmAndFail(
      "Hapus ops@gaia.com",
      "Hapus",
      http.delete(`${API}/system-users/:id`, () =>
        errorResponse(500, "INTERNAL_ERROR", "stack trace")
      )
    )

    expect(alert).toHaveTextContent(GENERIC_WRITE_MESSAGE)
    expect(alert).not.toHaveTextContent("stack trace")
    expect(screen.getByRole("button", { name: "Hapus ops@gaia.com" })).toBeEnabled()
  })

  it("a failed write does not refetch the list and the row stays", async () => {
    let lists = 0
    server.use(
      http.get(`${API}/system-users`, () => {
        lists += 1
        return HttpResponse.json({ data: FIXTURE_USERS })
      })
    )
    await confirmAndFail(
      "Hapus ops@gaia.com",
      "Hapus",
      http.delete(`${API}/system-users/:id`, () =>
        errorResponse(409, "SYSTEM_USER_IN_USE", "In use.")
      )
    )

    expect(lists).toBe(1)
    expect(screen.getByText(FIXTURE_USER_ACTIVE.loginId)).toBeInTheDocument()
  })

  it("clears the previous failure when the next action starts", async () => {
    let calls = 0
    server.use(
      http.delete(`${API}/system-users/:id`, () => {
        calls += 1
        return calls === 1
          ? errorResponse(409, "SYSTEM_USER_IN_USE", "In use.")
          : HttpResponse.json({ data: null })
      })
    )
    renderWithClient(<UserListPage />, queryClient)
    await ready()
    fireEvent.click(screen.getByRole("button", { name: "Hapus ops@gaia.com" }))
    confirmPermanent(await screen.findByRole("dialog"), "Hapus")
    await screen.findByRole("alert")

    fireEvent.click(screen.getByRole("button", { name: "Hapus ops@gaia.com" }))
    confirmPermanent(await screen.findByRole("dialog"), "Hapus")

    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Akun dihapus.")
    )
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})

describe("in-flight double-send guard", () => {
  it("two confirms of the same suspend send one PATCH", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    let patches = 0
    server.use(
      http.patch(`${API}/system-users/:id/status`, async () => {
        patches += 1
        await gate
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      })
    )
    const dialog = await openDialogFor("Tangguhkan ops@gaia.com")
    const confirmButton = within(dialog).getByRole("button", {
      name: "Tangguhkan",
    })
    fireEvent.click(confirmButton)
    fireEvent.click(confirmButton)

    await waitFor(() => expect(patches).toBe(1))
    release()
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledTimes(1))
    expect(patches).toBe(1)
  })

  it("disables the buttons of every other row while one action runs", async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.patch(`${API}/system-users/:id/status`, async () => {
        await gate
        return HttpResponse.json({ data: FIXTURE_USER_ACTIVE })
      })
    )
    const dialog = await openDialogFor("Tangguhkan ops@gaia.com")
    fireEvent.click(within(dialog).getByRole("button", { name: "Tangguhkan" }))

    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: `Aktifkan ${FIXTURE_USER_SUSPENDED.loginId}`,
        })
      ).toBeDisabled()
    )
    expect(
      screen.getByRole("button", { name: `Reset password ${FIXTURE_USER_SELF.loginId}` })
    ).toBeDisabled()
    release()
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled())
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: `Aktifkan ${FIXTURE_USER_SUSPENDED.loginId}`,
        })
      ).toBeEnabled()
    )
  })
})

describe("client paging (D5.4)", () => {
  function many(count: number) {
    return Array.from({ length: count }, (_, index) => ({
      ...FIXTURE_USER_ACTIVE,
      id: `22222222-aaaa-4aaa-8aaa-${String(index).padStart(12, "0")}`,
      loginId: `user${String(index + 1).padStart(2, "0")}@gaia.com`,
    }))
  }

  it("pages 25 accounts as 20 then 5 with one GET", async () => {
    let gets = 0
    server.use(
      http.get(`${API}/system-users`, () => {
        gets += 1
        return HttpResponse.json({ data: many(25) })
      })
    )
    renderWithClient(<UserListPage />, queryClient)
    await screen.findByText("user01@gaia.com")

    expect(screen.getByText("user20@gaia.com")).toBeInTheDocument()
    expect(screen.queryByText("user21@gaia.com")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }))
    expect(await screen.findByText("user21@gaia.com")).toBeInTheDocument()
    expect(screen.getByText("user25@gaia.com")).toBeInTheDocument()
    expect(screen.queryByText("user01@gaia.com")).not.toBeInTheDocument()
    expect(gets).toBe(1)
  })

  it("returns to page 1 when the search changes", async () => {
    server.use(
      http.get(`${API}/system-users`, () =>
        HttpResponse.json({ data: many(25) })
      )
    )
    renderWithClient(<UserListPage />, queryClient)
    await screen.findByText("user01@gaia.com")
    fireEvent.click(screen.getByRole("button", { name: "Halaman berikutnya" }))
    await screen.findByText("user21@gaia.com")

    fireEvent.change(screen.getByLabelText("Cari akun"), {
      target: { value: "user03" },
    })

    expect(await screen.findByText("user03@gaia.com")).toBeInTheDocument()
  })

  it("shows no pagination bar for a single page", async () => {
    renderWithClient(<UserListPage />, queryClient)
    await ready()

    expect(
      screen.queryByRole("navigation", { name: "Paginasi akun" })
    ).not.toBeInTheDocument()
  })
})

describe("invalidation (D12.1)", () => {
  function seed() {
    queryClient.setQueryData(
      queryKeys.systemUsers.detail(FIXTURE_USER_ACTIVE.id),
      FIXTURE_USER_ACTIVE
    )
    queryClient.setQueryData(
      queryKeys.systemUsers.detail(FIXTURE_USER_SUSPENDED.id),
      FIXTURE_USER_SUSPENDED
    )
    queryClient.setQueryData(queryKeys.tenants.all(), [])
    queryClient.setQueryData(queryKeys.adminSessions.ofUser(FIXTURE_USER_ACTIVE.id), [])
  }
  const invalidated = (key: readonly unknown[]) =>
    queryClient.getQueryState(key)?.isInvalidated

  it("a status change invalidates that user's detail and the list, nothing else", async () => {
    seed()
    const dialog = await openDialogFor("Tangguhkan ops@gaia.com")
    fireEvent.click(within(dialog).getByRole("button", { name: "Tangguhkan" }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled())

    expect(invalidated(queryKeys.systemUsers.detail(FIXTURE_USER_ACTIVE.id))).toBe(true)
    expect(invalidated(queryKeys.systemUsers.detail(FIXTURE_USER_SUSPENDED.id))).toBe(false)
    expect(invalidated(queryKeys.tenants.all())).toBe(false)
    expect(
      invalidated(queryKeys.adminSessions.ofUser(FIXTURE_USER_ACTIVE.id))
    ).toBe(false)
  })

  it("a reset password invalidates the user keys", async () => {
    seed()
    const dialog = await openDialogFor("Reset password ops@gaia.com")
    fireEvent.click(within(dialog).getByRole("button", { name: "Reset password" }))
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled())

    expect(invalidated(queryKeys.systemUsers.detail(FIXTURE_USER_ACTIVE.id))).toBe(true)
  })

  it("a failed write invalidates nothing", async () => {
    seed()
    server.use(
      http.patch(`${API}/system-users/:id/status`, () =>
        errorResponse(403, "PERMISSION_DENIED", "denied")
      )
    )
    const dialog = await openDialogFor("Tangguhkan ops@gaia.com")
    fireEvent.click(within(dialog).getByRole("button", { name: "Tangguhkan" }))
    await screen.findByRole("alert")

    expect(invalidated(queryKeys.systemUsers.detail(FIXTURE_USER_ACTIVE.id))).toBe(false)
  })
})
