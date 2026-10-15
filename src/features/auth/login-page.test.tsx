import type { QueryClient } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  FORBIDDEN_MESSAGE,
  GENERIC_READ_MESSAGE,
} from "@/features/tenants/shared/failure"
import { setAccessToken } from "@/lib/api/refresh"
import { referenceLine } from "@/lib/notify"
import {
  API,
  errorResponse,
  FIXTURE_ME,
  TEST_ACCESS_TOKEN,
} from "@/test/handlers/auth"
import { server } from "@/test/server"

import { clearPendingAuthNotice, setPendingAuthNotice } from "./auth-notice"
import {
  ACCOUNT_NOT_ACTIVE_MESSAGE,
  ACCOUNT_NOT_READY_MESSAGE,
} from "./auth-messages"
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

const REFERENCE_ID = "3f9c0a1b-0000-4000-8000-000000000001"

/** A 403 for an account state, with the correlation id the client reads back. */
function accountRefusal(code: string, message: string) {
  return HttpResponse.json(
    { code, message },
    { status: 403, headers: { "X-Correlation-ID": REFERENCE_ID } }
  )
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

  it.each([
    ["ACCOUNT_NOT_ACTIVE", ACCOUNT_NOT_ACTIVE_MESSAGE],
    ["ACCOUNT_NOT_READY", ACCOUNT_NOT_READY_MESSAGE],
  ])(
    "shows the fixed copy for %s with the reference id, never the server message (REQ-FE-055)",
    async (code, copy) => {
      server.use(
        http.post(`${API}/auth/login`, () =>
          accountRefusal(code, "Server says no.")
        )
      )
      renderWithProviders(<LoginPage />, queryClient)

      fillAndSubmit(CREDENTIALS.loginId, CREDENTIALS.password)

      const alert = await screen.findByRole("alert")
      expect(within(alert).getByText(copy)).toBeInTheDocument()
      expect(
        within(alert).getByText(referenceLine(REFERENCE_ID))
      ).toBeInTheDocument()
      expect(alert).not.toHaveTextContent("Server says no.")
    }
  )

  it("still shows the server message for a VALIDATION_FAILED response (D4.5)", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        errorResponse(400, "VALIDATION_FAILED", "loginId: must not be blank")
      )
    )
    renderWithProviders(<LoginPage />, queryClient)

    fillAndSubmit(CREDENTIALS.loginId, CREDENTIALS.password)

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "loginId: must not be blank"
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

  it.each([
    ["accountNotActive", ACCOUNT_NOT_ACTIVE_MESSAGE],
    ["accountNotReady", ACCOUNT_NOT_READY_MESSAGE],
  ] as const)(
    "shows the %s notice after a session end once, then clears it (D4.11)",
    (notice, copy) => {
      setPendingAuthNotice(notice)
      const first = renderWithProviders(<LoginPage />, queryClient)
      expect(screen.getByRole("status")).toHaveTextContent(copy)
      first.unmount()

      renderWithProviders(<LoginPage />, queryClient)
      expect(screen.queryByRole("status")).toBeNull()
    }
  )
})

describe("LoginPage after a session ends on an account state (FE-OQ-45)", () => {
  it.each([
    ["ACCOUNT_NOT_ACTIVE", ACCOUNT_NOT_ACTIVE_MESSAGE],
    ["ACCOUNT_NOT_READY", ACCOUNT_NOT_READY_MESSAGE],
  ])(
    "a data request 401 then a refresh 403 %s ends the session, shows the login notice and no read error",
    async (code, copy) => {
      // The boot refresh succeeds. The refresh after the data 401 is refused.
      let refreshCalls = 0
      server.use(
        http.post(`${API}/auth/refresh`, () => {
          refreshCalls += 1
          return refreshCalls === 1
            ? HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
            : errorResponse(403, code, "Server says no.")
        }),
        http.get(`${API}/tenants`, () =>
          errorResponse(401, "UNAUTHORIZED", "Unauthorized.")
        )
      )

      renderRouterAt("/", queryClient)

      expect(await screen.findByText(copy)).toBeInTheDocument()
      expect(window.location.pathname).toBe("/login")
      expect(refreshCalls).toBe(2)
      expect(queryClient.getQueryCache().findAll()).toHaveLength(0)
      expect(screen.queryByText(GENERIC_READ_MESSAGE)).toBeNull()
      expect(screen.queryByText(FORBIDDEN_MESSAGE)).toBeNull()
    }
  )
})

describe("LoginPage after a boot account refusal (REQ-FE-055)", () => {
  it.each([
    ["ACCOUNT_NOT_ACTIVE", ACCOUNT_NOT_ACTIVE_MESSAGE],
    ["ACCOUNT_NOT_READY", ACCOUNT_NOT_READY_MESSAGE],
  ])(
    "a boot me 401 then a refresh 403 %s lands on /login with the notice, not the error screen",
    async (code, copy) => {
      // The boot refresh succeeds and `me` is expired once. The refresh that the
      // `me` 401 triggers is refused, so the cache clear cancels `me`.
      let refreshCalls = 0
      server.use(
        http.post(`${API}/auth/refresh`, () => {
          refreshCalls += 1
          return refreshCalls === 1
            ? HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
            : errorResponse(403, code, "Server says no.")
        }),
        http.get(
          `${API}/auth/me`,
          () => errorResponse(401, "INVALID_TOKEN", "Server says no."),
          { once: true }
        )
      )

      renderRouterAt("/", queryClient)

      expect(await screen.findByText(copy)).toBeInTheDocument()
      expect(window.location.pathname).toBe("/login")
      expect(refreshCalls).toBe(2)
      expect(screen.getByRole("button", { name: "Lanjutkan" })).toBeEnabled()
      expect(screen.queryByText(GENERIC_READ_MESSAGE)).toBeNull()
    }
  )
})
