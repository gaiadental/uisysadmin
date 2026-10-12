import type { QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import {
  API,
  errorResponse,
  FIXTURE_ME,
  TEST_ACCESS_TOKEN,
} from "@/test/handlers/auth"
import { server } from "@/test/server"

import { clearPendingAuthNotice, setPendingAuthNotice } from "./auth-notice"
import { LoginPage } from "./login-page"
import {
  newTestQueryClient,
  renderRouterAt,
  renderWithProviders,
  TEST_API_BASE_URL,
} from "./test-helpers"

const CREDENTIALS = {
  loginId: "principal@example.com",
  password: "secret-pass",
}

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", TEST_API_BASE_URL)
  setAccessToken(null)
  queryClient = newTestQueryClient()
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  vi.spyOn(console, "warn").mockImplementation(() => undefined)
  window.history.replaceState(null, "", "/login")
  // No session at boot, so the login form is the only path to a session.
  server.use(
    http.post(`${API}/auth/refresh`, () =>
      errorResponse(401, "SESSION_ENDED", "Session ended. Please log in again.")
    )
  )
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

function fillAndSubmit(loginId: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email atau telepon"), {
    target: { value: loginId },
  })
  fireEvent.change(screen.getByLabelText("Kata sandi"), {
    target: { value: password },
  })
  fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }))
}

describe("LoginPage error mapping (D4.5)", () => {
  it("shows the credentials text, keeps the login ID and clears the password", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        errorResponse(401, "INVALID_CREDENTIALS", "Invalid credentials.")
      )
    )
    renderWithProviders(<LoginPage />, queryClient)

    fillAndSubmit(CREDENTIALS.loginId, "wrong-pass")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Login ID atau password salah"
    )
    expect(screen.getByLabelText("Email atau telepon")).toHaveValue(CREDENTIALS.loginId)
    expect(screen.getByLabelText("Kata sandi")).toHaveValue("")
  })

  it("shows the same text for an unknown user, whatever the server message says", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        errorResponse(401, "INVALID_CREDENTIALS", "User not found.")
      )
    )
    renderWithProviders(<LoginPage />, queryClient)

    fillAndSubmit("nobody@example.com", "any-pass")

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Login ID atau password salah")
    expect(alert).not.toHaveTextContent("User not found.")
  })

  it("shows the server message for an account that is not active", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        errorResponse(
          403,
          "ACCOUNT_NOT_ACTIVE",
          "Account is not active. Contact your administrator."
        )
      )
    )
    renderWithProviders(<LoginPage />, queryClient)

    fillAndSubmit(CREDENTIALS.loginId, CREDENTIALS.password)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Account is not active. Contact your administrator."
    )
  })

  it("locks the submit button for 60 seconds with a countdown after a 429", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        errorResponse(
          429,
          "TOO_MANY_ATTEMPTS",
          "Too many attempts. Try again later."
        )
      )
    )
    renderWithProviders(<LoginPage />, queryClient)

    fillAndSubmit(CREDENTIALS.loginId, CREDENTIALS.password)

    const locked = await screen.findByRole("button", {
      name: "Coba lagi dalam 60 detik",
    })
    expect(locked).toBeDisabled()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Terlalu banyak percobaan"
    )
  })

  it("links the field message to its input through aria-describedby (D19)", async () => {
    renderWithProviders(<LoginPage />, queryClient)

    fireEvent.click(screen.getByRole("button", { name: "Lanjutkan" }))

    await screen.findByText("Login ID wajib diisi.")
    const loginId = screen.getByLabelText("Email atau telepon")
    expect(loginId).toHaveAttribute("aria-invalid", "true")
    expect(loginId).toHaveAccessibleDescription("Login ID wajib diisi.")
  })
})

describe("LoginPage request and redirects", () => {
  it("sends only the login ID and the password, with no tenant field (D4.5)", async () => {
    let body: unknown = null
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
      })
    )
    renderWithProviders(<LoginPage />, queryClient)

    fillAndSubmit(CREDENTIALS.loginId, CREDENTIALS.password)

    await waitFor(() => expect(body).not.toBeNull())
    expect(body).toEqual(CREDENTIALS)
  })

  it("sends a forced password change to /account/password", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
      ),
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ data: { ...FIXTURE_ME, pwdChangeRequired: true } })
      )
    )
    renderRouterAt("/login", queryClient)
    // The router shows a loading screen until boot ends (status unknown), so wait for the form.
    await screen.findByLabelText("Email atau telepon")

    fillAndSubmit(CREDENTIALS.loginId, CREDENTIALS.password)

    await waitFor(() =>
      expect(window.location.pathname).toBe("/account/password")
    )
    expect(
      await screen.findByRole("heading", { name: "Ubah password" })
    ).toBeInTheDocument()
  })
})

describe("LoginPage one-time notice", () => {
  it("shows a pending notice once and then clears it", () => {
    setPendingAuthNotice("passwordChanged")
    const first = renderWithProviders(<LoginPage />, queryClient)
    expect(screen.getByRole("status")).toHaveTextContent(
      "Password changed, please log in again"
    )
    first.unmount()

    renderWithProviders(<LoginPage />, queryClient)
    expect(screen.queryByRole("status")).toBeNull()
  })
})
