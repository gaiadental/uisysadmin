// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DialogsProvider } from "@/components/dialogs/dialogs"
import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API } from "@/test/handlers/auth"
import { FIXTURE_COUNTRY_SG } from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { CountryListPage } from "./country-list-page"
import { countryCreateSchema, countryEditSchema } from "./schema"

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  queryClient = createQueryClient()
  window.history.replaceState(null, "", "/countries")
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("country edge cases", () => {
  it("sends is_active false when the active switch is turned off", async () => {
    const bodies: Array<Record<string, unknown>> = []
    server.use(
      http.put(`${API}/countries/:code`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return HttpResponse.json(FIXTURE_COUNTRY_SG)
      })
    )
    render(
      <QueryClientProvider client={queryClient}>
        <DialogsProvider>
          <CountryListPage />
        </DialogsProvider>
      </QueryClientProvider>
    )
    await screen.findByText("Singapore")
    fireEvent.click(screen.getByRole("button", { name: "Ubah negara Singapore" }))
    fireEvent.click(await screen.findByRole("switch", { name: "Negara aktif" }))
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ is_active: false })
    expect(bodies[0]).not.toHaveProperty("code")
  })

  it("trims padded text and rejects a whitespace-only name on edit", () => {
    const ok = countryCreateSchema.parse({
      code: " SG ",
      name: "  Singapore ",
      nationalityName: "",
      phoneCode: " +65 ",
    })
    expect(ok).toMatchObject({ code: "SG", name: "Singapore", phoneCode: "+65" })
    expect(
      countryEditSchema.safeParse({
        name: "   ",
        nationalityName: "",
        phoneCode: "",
        isActive: true,
      }).success
    ).toBe(false)
  })
})
