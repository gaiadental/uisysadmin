import type { QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { API, errorResponse, FIXTURE_RESET_TOKEN } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { clearPendingAuthNotice } from "./auth-notice"
import { ResetPasswordPage } from "./reset-password-page"
import {
  newTestQueryClient,
  renderWithProviders,
  TEST_API_BASE_URL,
} from "./test-helpers"

const PASSWORD = "New-Strong-Pass-1"
const INVALID_LINK = "Link tidak valid atau kedaluwarsa"

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", TEST_API_BASE_URL)
  setAccessToken(null)
  queryClient = newTestQueryClient()
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  clearPendingAuthNotice()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  window.history.replaceState(null, "", "/")
})

function openWithToken(token: string) {
  window.history.replaceState(null, "", `/reset-password?token=${token}`)
}

function fillPasswords(password: string) {
  fireEvent.change(screen.getByLabelText("Password baru"), {
    target: { value: password },
  })
  fireEvent.change(screen.getByLabelText("Konfirmasi password baru"), {
    target: { value: password },
  })
}

describe("ResetPasswordPage token handling (D4.7)", () => {
  it("sends the token once and removes it from the address bar", async () => {
    openWithToken(FIXTURE_RESET_TOKEN)
    let body: unknown = null
    server.use(
      http.post(`${API}/auth/reset-password`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { status: "PASSWORD_RESET" } })
      })
    )
    renderWithProviders(<ResetPasswordPage />, queryClient)

    expect(window.location.search).toBe("")
    expect(window.location.pathname).toBe("/reset-password")

    fillPasswords(PASSWORD)
    fireEvent.click(
      screen.getByRole("button", { name: "Simpan password baru" })
    )

    await waitFor(() => expect(window.location.pathname).toBe("/login"))
    expect(body).toEqual({
      resetToken: FIXTURE_RESET_TOKEN,
      newPassword: PASSWORD,
      newPasswordConfirmation: PASSWORD,
    })
  })

  it("shows the invalid-link message and a link to forgot password when no token is given", () => {
    window.history.replaceState(null, "", "/reset-password")
    renderWithProviders(<ResetPasswordPage />, queryClient)

    expect(screen.getByRole("alert")).toHaveTextContent(INVALID_LINK)
    expect(
      screen.getByRole("link", { name: "Minta tautan atur ulang baru" })
    ).toHaveAttribute("href", "/forgot-password")
    expect(screen.queryByLabelText("Password baru")).toBeNull()
  })

  it("shows the invalid-link message when the server rejects an expired token", async () => {
    openWithToken(FIXTURE_RESET_TOKEN)
    server.use(
      http.post(`${API}/auth/reset-password`, () =>
        errorResponse(400, "INVALID_TOKEN", "Invalid or expired token.")
      )
    )
    renderWithProviders(<ResetPasswordPage />, queryClient)

    fillPasswords(PASSWORD)
    fireEvent.click(
      screen.getByRole("button", { name: "Simpan password baru" })
    )

    expect(await screen.findByRole("alert")).toHaveTextContent(INVALID_LINK)
    expect(
      screen.getByRole("link", { name: "Minta tautan atur ulang baru" })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Password baru")).toBeNull()
  })

  it("keeps the submit control disabled while the request is in flight (SP-BG-11)", async () => {
    openWithToken(FIXTURE_RESET_TOKEN)
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.post(`${API}/auth/reset-password`, async () => {
        await gate
        return HttpResponse.json({ data: { status: "PASSWORD_RESET" } })
      })
    )
    renderWithProviders(<ResetPasswordPage />, queryClient)

    fillPasswords(PASSWORD)
    const submit = screen.getByRole("button", { name: "Simpan password baru" })
    fireEvent.click(submit)

    await waitFor(() => expect(submit).toBeDisabled())
    release()
    await waitFor(() => expect(window.location.pathname).toBe("/login"))
  })

  it("shows a policy failure under the new password field", async () => {
    openWithToken(FIXTURE_RESET_TOKEN)
    server.use(
      http.post(`${API}/auth/reset-password`, () =>
        errorResponse(
          400,
          "PASSWORD_POLICY_VIOLATION",
          "Password must not repeat a recent one."
        )
      )
    )
    renderWithProviders(<ResetPasswordPage />, queryClient)

    fillPasswords(PASSWORD)
    fireEvent.click(
      screen.getByRole("button", { name: "Simpan password baru" })
    )

    await screen.findByText("Password must not repeat a recent one.")
    expect(screen.getByLabelText("Password baru")).toHaveAccessibleDescription(
      "Password must not repeat a recent one."
    )
  })
})
