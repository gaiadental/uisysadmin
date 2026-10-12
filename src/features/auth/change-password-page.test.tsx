import type { QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getAccessToken, setAccessToken } from "@/lib/api/refresh"
import {
  API,
  errorResponse,
  FIXTURE_ME,
  TEST_ACCESS_TOKEN,
} from "@/test/handlers/auth"
import { server } from "@/test/server"

import { clearPendingAuthNotice } from "./auth-notice"
import {
  newTestQueryClient,
  renderRouterAt,
  TEST_API_BASE_URL,
} from "./test-helpers"

const CURRENT = "old-pass-1"
const NEW_PASSWORD = "New-Strong-Pass-1"
const ROTATED_TOKEN = "rotated-access-token"

let queryClient: QueryClient
let refreshCalls = 0

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", TEST_API_BASE_URL)
  setAccessToken(null)
  queryClient = newTestQueryClient()
  refreshCalls = 0
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  vi.spyOn(console, "warn").mockImplementation(() => undefined)
  window.history.replaceState(null, "", "/account/password")
  server.use(
    http.post(`${API}/auth/refresh`, () => {
      refreshCalls += 1
      return HttpResponse.json({ data: { accessToken: TEST_ACCESS_TOKEN } })
    })
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

/** Renders the change page through the router and waits until the session has booted. */
async function openChangePage() {
  renderRouterAt("/account/password", queryClient)
  // The first render of the lazy route includes a cold boot and React's Suspense
  // reveal throttle, which can pass the default 1000 ms under load (RCA-TODO-008).
  await screen.findByRole(
    "heading",
    { name: "Ubah password" },
    { timeout: 5000 }
  )
}

function fillAndSubmit({
  current = CURRENT,
  keepSession = true,
}: { readonly current?: string; readonly keepSession?: boolean } = {}) {
  fireEvent.change(screen.getByLabelText("Password saat ini"), {
    target: { value: current },
  })
  fireEvent.change(screen.getByLabelText("Password baru"), {
    target: { value: NEW_PASSWORD },
  })
  fireEvent.change(screen.getByLabelText("Konfirmasi password baru"), {
    target: { value: NEW_PASSWORD },
  })
  if (!keepSession)
    fireEvent.click(screen.getByLabelText("Tetap masuk di sesi ini"))
  fireEvent.click(screen.getByRole("button", { name: "Simpan password" }))
}

describe("ChangePasswordPage errors (D4.6)", () => {
  it("shows a wrong current password under its field and never refreshes (D4.4)", async () => {
    await openChangePage()
    const refreshBefore = refreshCalls
    server.use(
      http.post(`${API}/auth/change-password`, () =>
        errorResponse(401, "INVALID_CREDENTIALS", "Invalid credentials.")
      )
    )

    fillAndSubmit()

    await screen.findByText("Current password is incorrect.")
    expect(
      screen.getByLabelText("Password saat ini")
    ).toHaveAccessibleDescription("Current password is incorrect.")
    expect(refreshCalls).toBe(refreshBefore)
  })

  it("a 401 with another code still never refreshes", async () => {
    await openChangePage()
    const refreshBefore = refreshCalls
    server.use(
      http.post(`${API}/auth/change-password`, () =>
        errorResponse(401, "UNAUTHORIZED", "Unauthorized.")
      )
    )

    fillAndSubmit()

    expect(await screen.findByRole("alert")).toBeInTheDocument()
    expect(refreshCalls).toBe(refreshBefore)
  })

  it("shows a policy failure under the new password field", async () => {
    await openChangePage()
    server.use(
      http.post(`${API}/auth/change-password`, () =>
        errorResponse(
          400,
          "PASSWORD_POLICY_VIOLATION",
          "Password must not repeat a recent one."
        )
      )
    )

    fillAndSubmit()

    await screen.findByText("Password must not repeat a recent one.")
    expect(screen.getByLabelText("Password baru")).toHaveAccessibleDescription(
      "Password must not repeat a recent one."
    )
  })
})

describe("ChangePasswordPage outcomes (D4.6)", () => {
  it("keeps the session with the rotated token when the flag is on", async () => {
    await openChangePage()
    server.use(
      http.post(`${API}/auth/change-password`, () =>
        HttpResponse.json({ data: { accessToken: ROTATED_TOKEN } })
      )
    )

    fillAndSubmit({ keepSession: true })

    expect(
      await screen.findByText("Password berhasil diubah.")
    ).toBeInTheDocument()
    expect(getAccessToken()).toBe(ROTATED_TOKEN)
    expect(window.location.pathname).toBe("/account/password")
  })

  it("ends every session when the flag is off and sends the user to login with the notice", async () => {
    await openChangePage()
    server.use(
      http.post(`${API}/auth/change-password`, () =>
        HttpResponse.json({ data: { status: "PASSWORD_CHANGED" } })
      )
    )

    fillAndSubmit({ keepSession: false })

    await waitFor(() => expect(window.location.pathname).toBe("/login"))
    // The route loading screen also has role status, so wait for the notice text itself.
    expect(
      await screen.findByText("Password changed, please log in again")
    ).toBeInTheDocument()
    expect(getAccessToken()).toBeNull()
  })

  it("ends a forced change on the landing page and offers logout while it is required", async () => {
    let meCalls = 0
    server.use(
      http.get(`${API}/auth/me`, () => {
        meCalls += 1
        // The first read (boot) requires the change. The read after it does not.
        return HttpResponse.json({
          data: { ...FIXTURE_ME, pwdChangeRequired: meCalls === 1 },
        })
      }),
      http.post(`${API}/auth/change-password`, () =>
        HttpResponse.json({ data: { accessToken: ROTATED_TOKEN } })
      )
    )
    renderRouterAt("/account/password", queryClient)
    expect(
      await screen.findByText(
        "Anda harus mengubah password sebelum dapat melanjutkan."
      )
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Keluar" })).toBeInTheDocument()

    fillAndSubmit({ keepSession: true })

    await waitFor(() => expect(window.location.pathname).toBe("/"))
    expect(getAccessToken()).toBe(ROTATED_TOKEN)
  })
})
