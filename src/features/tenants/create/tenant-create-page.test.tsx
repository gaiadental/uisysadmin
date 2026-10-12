// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import { createQueryClient } from "@/lib/query/client"
import { API, errorResponse } from "@/test/handlers/auth"
import {
  CREATE_CODE_ACCOUNT_FAILED,
  CREATE_CODE_DUPLICATE,
  CREATE_CODE_SECOND_DEDICATED,
  CREATE_CODE_SYNC_FAILED,
  FIXTURE_ADMIN_ACCOUNT_RETRY_SYNC_FAILED,
  FIXTURE_CATEGORY,
  FIXTURE_TENANT,
  FIXTURE_TENANT_CREATED,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { TenantCreatePage } from "./tenant-create-page"

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
vi.mock("sonner", () => ({ toast: toastMock }))

const BASE_URL = "http://sp.test"
const DETAIL_PATH = `/tenants/${FIXTURE_TENANT.id}`
let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  queryClient = createQueryClient()
  window.history.replaceState(null, "", "/tenants/new")
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  toastMock.success.mockClear()
  toastMock.warning.mockClear()
  toastMock.error.mockClear()
})

function renderPage() {
  return render(
    <QueryClientProvider client={queryClient}>
      <TenantCreatePage />
    </QueryClientProvider>
  )
}

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

async function next() {
  fireEvent.click(screen.getByRole("button", { name: "Lanjut" }))
  // The validation of a step is asynchronous.
  await waitFor(() => undefined)
}

/** Fills the identity step and moves on. The category option comes from the reference list. */
async function fillIdentity(code: string) {
  type("Kode tenant", code)
  type("Nama tenant", "Smile Dental Group")
  await screen.findByRole("option", { name: "Dental Clinic" })
  fireEvent.change(screen.getByLabelText("Kategori tenant"), {
    target: { value: FIXTURE_CATEGORY.id },
  })
  await next()
  await screen.findByText("Tipe penyebaran")
}

/** Walks the wizard to the review step. */
async function reachReview(code: string, deployment?: "DEDICATED") {
  await fillIdentity(code)
  if (deployment !== undefined) {
    fireEvent.click(screen.getByRole("radio", { name: /Dedicated/ }))
  }
  await next()
  await screen.findByLabelText("E-mail admin tenant")
  type("E-mail admin tenant", "admin@smile.example.com")
  await next()
  await screen.findByRole("button", { name: "Buat tenant" })
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: "Buat tenant" }))
}

function recordCreateBodies(): Array<Record<string, unknown>> {
  const bodies: Array<Record<string, unknown>> = []
  server.use(
    http.post(`${API}/tenants`, async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json(FIXTURE_TENANT_CREATED, { status: 201 })
    })
  )
  return bodies
}

describe("TenantCreatePage steps (D9)", () => {
  it("stays on a step and shows the field errors while the step is invalid", async () => {
    renderPage()

    await next()

    expect(screen.getByText("Kode tenant wajib diisi.")).toBeInTheDocument()
    expect(screen.getByText("Nama tenant wajib diisi.")).toBeInTheDocument()
    expect(screen.getByText("Kategori wajib dipilih.")).toBeInTheDocument()
    expect(screen.queryByText("Tipe penyebaran")).not.toBeInTheDocument()
  })

  it("does not create the tenant when Enter is pressed before the review step", async () => {
    const bodies = recordCreateBodies()
    renderPage()

    fireEvent.submit(screen.getByLabelText("Kode tenant").closest("form")!)
    await waitFor(() => undefined)

    expect(bodies).toHaveLength(0)
  })

  it("writes the code in uppercase", () => {
    renderPage()

    type("Kode tenant", "smile-1")

    expect(screen.getByLabelText("Kode tenant")).toHaveValue("SMILE-1")
  })

  it("sends only the whitelist keys, with empty optional fields left out", async () => {
    const bodies = recordCreateBodies()
    renderPage()

    await reachReview("SMILE")
    submit()

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      code: "SMILE",
      name: "Smile Dental Group",
      tenant_category_id: FIXTURE_CATEGORY.id,
      deployment_type: "MULTI_TENANT",
      multi_branch_enabled: true,
      tenant_admin_email: "admin@smile.example.com",
    })
  })
})

describe("TenantCreatePage outcomes (D8.2)", () => {
  it("CREATED + SYNCED: success toast, then the detail page", async () => {
    renderPage()

    await reachReview("SMILE")
    submit()

    await waitFor(() => expect(window.location.pathname).toBe(DETAIL_PATH))
    expect(toastMock.success).toHaveBeenCalledWith(
      "Tenant dibuat, akun admin dikirim ke e-mail"
    )
    expect(toastMock.warning).not.toHaveBeenCalled()
  })

  it("CREATED + sync FAILED: a sync warning with Retry, and Retry calls the admin-account endpoint", async () => {
    let retries = 0
    server.use(
      http.post(`${API}/tenants/:id/admin-account`, () => {
        retries += 1
        return HttpResponse.json(FIXTURE_ADMIN_ACCOUNT_RETRY_SYNC_FAILED)
      })
    )
    renderPage()

    await reachReview(CREATE_CODE_SYNC_FAILED)
    submit()

    expect(
      await screen.findByText("Status tenant belum tersinkron ke auth")
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe("/tenants/new")

    // The retry answers sync FAILED again: the warning stays.
    fireEvent.click(
      screen.getByRole("button", { name: "Kirim ulang akun admin" })
    )
    await waitFor(() => expect(retries).toBe(1))
    expect(
      await screen.findByText("Status tenant belum tersinkron ke auth")
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe("/tenants/new")
  })

  it("sync FAILED then a retry that answers SYNCED: success toast and the detail page", async () => {
    renderPage()

    await reachReview(CREATE_CODE_SYNC_FAILED)
    submit()
    fireEvent.click(
      await screen.findByRole("button", { name: "Kirim ulang akun admin" })
    )

    await waitFor(() => expect(window.location.pathname).toBe(DETAIL_PATH))
    expect(toastMock.success).toHaveBeenCalledWith(
      "Tenant dibuat, akun admin dikirim ke e-mail"
    )
  })

  it("admin account FAILED: a warning with Retry that calls the endpoint", async () => {
    let retries = 0
    server.use(
      http.post(`${API}/tenants/:id/admin-account`, () => {
        retries += 1
        return HttpResponse.json({
          tenant_id: FIXTURE_TENANT.id,
          admin_account: {
            status: "CREATED",
            user_status: "PENDING",
            tenant_status_sync: "SYNCED",
          },
        })
      })
    )
    renderPage()

    await reachReview(CREATE_CODE_ACCOUNT_FAILED)
    submit()

    expect(
      await screen.findByText("Tenant dibuat, tetapi akun admin gagal dibuat")
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole("button", { name: "Kirim ulang akun admin" })
    )

    await waitFor(() => expect(retries).toBe(1))
    await waitFor(() => expect(window.location.pathname).toBe(DETAIL_PATH))
  })

  it("a retry that fails with 503 shows the server message and keeps the page", async () => {
    server.use(
      http.post(`${API}/tenants/:id/admin-account`, () =>
        errorResponse(
          503,
          "SERVICE_UNAVAILABLE",
          "Auth service is unavailable. Nothing was changed."
        )
      )
    )
    renderPage()

    await reachReview(CREATE_CODE_ACCOUNT_FAILED)
    submit()
    fireEvent.click(
      await screen.findByRole("button", { name: "Kirim ulang akun admin" })
    )

    expect(
      await screen.findByText(
        "Auth service is unavailable. Nothing was changed."
      )
    ).toBeInTheDocument()
    expect(window.location.pathname).toBe("/tenants/new")
  })
})

describe("TenantCreatePage errors (D8.2, D13)", () => {
  it("shows the 409 message on the code field", async () => {
    renderPage()

    await reachReview(CREATE_CODE_DUPLICATE)
    submit()

    const message = await screen.findByText("Tenant code already exists.")
    expect(message).toHaveAttribute("id", "tenant-code-error")
    expect(screen.getByLabelText("Kode tenant")).toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(window.location.pathname).toBe("/tenants/new")
  })

  it("shows the DEDICATED refusal as a clear form alert", async () => {
    renderPage()

    await reachReview(CREATE_CODE_SECOND_DEDICATED, "DEDICATED")
    submit()

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(
      "Only one DEDICATED tenant is allowed per deployment."
    )
    expect(window.location.pathname).toBe("/tenants/new")
  })

  it("accepts VALIDATION_FAILED as a form validation error too", async () => {
    server.use(
      http.post(`${API}/tenants`, () =>
        errorResponse(400, "VALIDATION_FAILED", "Invalid country_code.")
      )
    )
    renderPage()

    await reachReview("SMILE")
    submit()

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid country_code."
    )
  })
})

describe("TenantCreatePage submit (SP-BG-11)", () => {
  it("disables the button in flight and sends one request, with no retry", async () => {
    let posts = 0
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    server.use(
      http.post(`${API}/tenants`, async () => {
        posts += 1
        await gate
        return HttpResponse.json(FIXTURE_TENANT_CREATED, { status: 201 })
      })
    )
    renderPage()

    await reachReview("SMILE")
    submit()

    const button = await screen.findByRole("button", {
      name: "Membuat tenant...",
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    release()

    await waitFor(() => expect(window.location.pathname).toBe(DETAIL_PATH))
    expect(posts).toBe(1)
  })
})
