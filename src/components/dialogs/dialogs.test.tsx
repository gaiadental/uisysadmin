// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useAuth, type AuthContextValue } from "@/app/providers/auth-provider"
import { SYS_PRINCIPAL } from "@/lib/access/roles"
import { NavUser } from "@/components/nav-user"
import type { Me } from "@/types/auth"

import { DialogsProvider, useDialogs, type ConfirmRequest } from "./dialogs"

vi.mock("@/app/providers/auth-provider", () => ({ useAuth: vi.fn() }))

const EXPLANATION =
  "Tenant TNT-001 akan dinonaktifkan. Pengguna tidak dapat masuk sampai tenant diaktifkan kembali."

const CONFIRM: ConfirmRequest = {
  title: "Nonaktifkan tenant",
  description: EXPLANATION,
  confirmLabel: "Nonaktifkan",
  tone: "destructive",
}

const ME: Me = {
  userId: "usr-001",
  loginId: "operator@example.com",
  userType: "SYSTEM",
  context: "SYSTEM",
  role: SYS_PRINCIPAL,
  permissions: [],
  tenant: null,
  branches: [],
  pwdChangeRequired: false,
}

afterEach(() => {
  cleanup()
  window.history.replaceState(null, "", "/")
})

/** An opener button that asks for a confirmation and reports the choice. */
function Opener({
  onResult,
}: {
  readonly onResult: (confirmed: boolean) => void
}) {
  const { confirm } = useDialogs()
  return (
    <button
      type="button"
      onClick={() => {
        void confirm(CONFIRM).then(onResult)
      }}
    >
      Buka konfirmasi
    </button>
  )
}

function renderOpener(onResult: (confirmed: boolean) => void) {
  render(
    <DialogsProvider>
      <Opener onResult={onResult} />
    </DialogsProvider>
  )
  const opener = screen.getByRole("button", { name: "Buka konfirmasi" })
  opener.focus()
  fireEvent.click(opener)
  return opener
}

describe("confirm dialog (ARCH-FE-001 D11, D16)", () => {
  it("renders the explanation text and no typed input", async () => {
    renderOpener(() => {})

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText(EXPLANATION)).toBeInTheDocument()
    expect(screen.queryByRole("textbox")).toBeNull()
  })

  it("returns focus to the opener when cancelled", async () => {
    const onResult = vi.fn()
    const opener = renderOpener(onResult)

    fireEvent.click(await screen.findByRole("button", { name: "Batal" }))

    await waitFor(() => expect(opener).toHaveFocus())
    expect(onResult).toHaveBeenCalledWith(false)
  })

  it("resolves true only when the confirm button is used", async () => {
    const onResult = vi.fn()
    renderOpener(onResult)

    fireEvent.click(await screen.findByRole("button", { name: "Nonaktifkan" }))

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
  })

  it("resolves false when the dialog is dismissed with Escape", async () => {
    const onResult = vi.fn()
    renderOpener(onResult)

    fireEvent.keyDown(await screen.findByRole("dialog"), { key: "Escape" })

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
  })
})

describe("logout from the sidebar (REQ-FE-016, D4.8)", () => {
  it("logs out through the auth provider and moves to the login page", async () => {
    const logout = vi.fn(async () => {})
    const auth: AuthContextValue = {
      status: "authenticated",
      me: ME,
      login: vi.fn(),
      logout,
      retryBoot: vi.fn(),
      refreshMe: vi.fn(),
      completePasswordChange: vi.fn(),
    }
    vi.mocked(useAuth).mockReturnValue(auth)
    window.history.replaceState(null, "", "/account/sessions")

    render(<NavUser />)
    expect(screen.getByText(ME.loginId)).toBeInTheDocument()
    expect(screen.getByText(SYS_PRINCIPAL)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Keluar" }))

    await waitFor(() => expect(window.location.pathname).toBe("/login"))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
