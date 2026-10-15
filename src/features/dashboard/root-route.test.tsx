// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { cleanup, render, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import App from "@/App"
import appSource from "@/App.tsx?raw"
import { routeAccessFor } from "@/app/router"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { FIXTURE_ME } from "@/test/handlers/auth"
import {
  DASHBOARD_TOTALS,
  dashboardCountHandlers,
} from "@/test/handlers/dashboard"
import { server } from "@/test/server"

const authState = vi.hoisted(() => ({
  value: {
    status: "authenticated",
    me: null as unknown,
    logout: () => Promise.resolve(),
  },
}))

vi.mock("@/app/providers/auth-provider", () => ({
  useAuth: () => authState.value,
}))

let queryClient: QueryClient

function signInAs(role: string, permissions: readonly string[] = []) {
  authState.value = {
    status: "authenticated",
    me: { ...FIXTURE_ME, role, permissions },
    logout: () => Promise.resolve(),
  }
}

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  signInAs("SYS_PRINCIPAL")
  window.history.replaceState(null, "", "/")
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  })
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

async function shell(): Promise<HTMLElement> {
  return vi.waitFor(() => {
    const element = document.getElementById("main")
    if (element === null) throw new Error("No shell main element")
    return element
  })
}

function renderApp() {
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  )
}

describe("root route", () => {
  it("is a session route that any signed-in user may open", () => {
    expect(routeAccessFor("/")).toEqual({
      kind: "session",
      passwordChange: "enforced",
      gates: [],
    })
  })

  it("renders the dashboard widgets at / for SYS_PRINCIPAL", async () => {
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    renderApp()

    const main = await shell()
    expect(
      await within(main).findByText("Tenant aktif")
    ).toBeInTheDocument()
    expect(
      await within(main).findByRole("heading", {
        name: "Tenant (5 pertama, urutan dari server)",
      })
    ).toBeInTheDocument()
  })

  it("renders the neutral landing message at / for a user without SYS_PRINCIPAL", async () => {
    signInAs("SUPPORT", ["system_users:view"])
    server.use(...dashboardCountHandlers(DASHBOARD_TOTALS))
    renderApp()

    const main = await shell()
    expect(
      await within(main).findByRole("heading", { level: 1, name: "Beranda" })
    ).toBeInTheDocument()
    expect(within(main).queryByText("Tenant aktif")).toBeNull()
  })

  it("sends a signed-out visitor at / to the login path", async () => {
    authState.value = { ...authState.value, status: "anonymous", me: null }
    renderApp()

    await vi.waitFor(() => expect(window.location.pathname).toBe("/login"))
  })

  it("sends a signed-in user at /login to / without rendering the login form (REQ-FE-056)", async () => {
    window.history.replaceState(null, "", "/login")
    renderApp()

    await vi.waitFor(() => expect(window.location.pathname).toBe("/"))
    await shell()
    expect(
      document.querySelector('form input[type="password"]')
    ).toBeNull()
    expect(document.getElementById("main")).not.toBeNull()
  })

  it("App.tsx no longer renders LandingPage directly", () => {
    const source: string = appSource

    expect(source).not.toMatch(/LandingPage/)
    expect(source).not.toMatch(/landing-page/)
  })
})
