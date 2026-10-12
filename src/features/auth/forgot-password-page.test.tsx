import type { QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { API, errorResponse } from "@/test/handlers/auth"
import { server } from "@/test/server"

import { ForgotPasswordPage } from "./forgot-password-page"
import {
  newTestQueryClient,
  renderWithProviders,
  TEST_API_BASE_URL,
} from "./test-helpers"

const NEUTRAL = "Jika akun terdaftar, link reset sudah dikirim ke e-mail."

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", TEST_API_BASE_URL)
  setAccessToken(null)
  queryClient = newTestQueryClient()
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  vi.spyOn(console, "warn").mockImplementation(() => undefined)
  window.history.replaceState(null, "", "/forgot-password")
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  window.history.replaceState(null, "", "/")
})

function submitLoginId(loginId: string) {
  fireEvent.change(screen.getByLabelText("Login ID"), {
    target: { value: loginId },
  })
  fireEvent.click(screen.getByRole("button", { name: "Kirim link reset" }))
}

describe("ForgotPasswordPage (D4.7)", () => {
  it("shows the neutral text after a successful request and sends the login ID", async () => {
    let body: unknown = null
    server.use(
      http.post(`${API}/auth/forgot-password`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ data: { status: "ACCEPTED" } })
      })
    )
    renderWithProviders(<ForgotPasswordPage />, queryClient)

    submitLoginId("principal@example.com")

    expect(await screen.findByRole("status")).toHaveTextContent(NEUTRAL)
    expect(body).toEqual({ loginId: "principal@example.com" })
  })

  it.each([
    ["an unknown account", 404, "RESOURCE_NOT_FOUND"],
    ["a server failure", 500, "INTERNAL_SERVER_ERROR"],
  ])("shows the same neutral text for %s", async (_label, status, code) => {
    server.use(
      http.post(`${API}/auth/forgot-password`, () =>
        errorResponse(status, code, "Server detail that must not be shown.")
      )
    )
    renderWithProviders(<ForgotPasswordPage />, queryClient)

    submitLoginId("nobody@example.com")

    expect(await screen.findByRole("status")).toHaveTextContent(NEUTRAL)
    expect(screen.queryByRole("alert")).toBeNull()
    expect(
      screen.queryByText("Server detail that must not be shown.")
    ).toBeNull()
  })

  it("shows a validation error as an alert, not as the neutral text", async () => {
    server.use(
      http.post(`${API}/auth/forgot-password`, () =>
        errorResponse(400, "VALIDATION_FAILED", "loginId: must not be blank")
      )
    )
    renderWithProviders(<ForgotPasswordPage />, queryClient)

    submitLoginId("principal@example.com")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "loginId: must not be blank"
    )
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull())
  })
})
