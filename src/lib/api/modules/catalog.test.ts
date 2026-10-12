import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest"

import { API } from "@/test/handlers/auth"
import {
  CATEGORY_CODE_DUPLICATE,
  CATEGORY_IN_USE_MESSAGE,
  COUNTRY_IN_USE_MESSAGE,
} from "@/test/handlers/catalog"
import {
  FIXTURE_CATEGORY,
  FIXTURE_CATEGORY_GENERAL,
  FIXTURE_COUNTRY,
  FIXTURE_COUNTRY_SG,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import {
  createCountry,
  deleteCountry,
  updateCountry,
  type CountryCreateInput,
  type CountryUpdateInput,
} from "./countries"
import {
  createTenantCategory,
  deleteTenantCategory,
  updateTenantCategory,
  type TenantCategoryUpdateInput,
} from "./tenant-categories"

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://sp.test")
  setAccessToken(null)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  setAccessToken(null)
})

interface Recorded {
  method: string
  url: string
  body: Record<string, unknown> | null
}

/** Records the next request to a handler and answers with `status`. */
function record(
  method: "post" | "put" | "delete",
  path: string,
  answer: () => Response
): Recorded[] {
  const seen: Recorded[] = []
  server.use(
    http[method](`${API}${path}`, async ({ request }) => {
      const text = await request.text()
      seen.push({
        method: request.method,
        url: new URL(request.url).pathname,
        body: text === "" ? null : (JSON.parse(text) as Record<string, unknown>),
      })
      return answer()
    })
  )
  return seen
}

describe("write inputs (D5.3 whitelist, type test)", () => {
  it("has no code in the update inputs", () => {
    expectTypeOf<TenantCategoryUpdateInput>().not.toHaveProperty("code")
    expectTypeOf<CountryUpdateInput>().not.toHaveProperty("code")
    expectTypeOf<CountryCreateInput>().toHaveProperty("code")
    const category: TenantCategoryUpdateInput = {
      name: "X",
      isActive: true,
      // @ts-expect-error `code` is immutable and absent from the update input
      code: "X",
    }
    expect(category.name).toBe("X")
  })
})

describe("tenant categories (writes)", () => {
  it("POST sends code and name, and omits an empty description", async () => {
    const seen = record("post", "/tenant-categories", () =>
      HttpResponse.json(FIXTURE_CATEGORY_GENERAL, { status: 201 })
    )
    const created = await createTenantCategory({
      code: "GENERAL",
      name: "General Clinic",
      description: "",
    })
    expect(seen[0]?.body).toEqual({ code: "GENERAL", name: "General Clinic" })
    expect(created.id).toBe(FIXTURE_CATEGORY_GENERAL.id)
    expect(created.isActive).toBe(true)
  })

  it("POST sends the description when it is filled", async () => {
    const seen = record("post", "/tenant-categories", () =>
      HttpResponse.json(FIXTURE_CATEGORY, { status: 201 })
    )
    await createTenantCategory({ code: "DENTAL", name: "D", description: "Klinik" })
    expect(seen[0]?.body).toEqual({ code: "DENTAL", name: "D", description: "Klinik" })
  })

  it("PUT sends name, description and is_active, never code", async () => {
    const seen = record("put", "/tenant-categories/:id", () =>
      HttpResponse.json(FIXTURE_CATEGORY)
    )
    // A loosely typed caller with a stray `code` must not leak it.
    const loose = {
      name: "Dental",
      description: "Klinik gigi",
      isActive: false,
      code: "HACK",
    } as TenantCategoryUpdateInput
    await updateTenantCategory(FIXTURE_CATEGORY.id, loose)
    expect(seen[0]?.url).toBe(`/api/v1/tenant-categories/${FIXTURE_CATEGORY.id}`)
    expect(seen[0]?.body).toEqual({
      name: "Dental",
      description: "Klinik gigi",
      is_active: false,
    })
    expect(seen[0]?.body).not.toHaveProperty("code")
  })

  it("DELETE resolves on 204", async () => {
    const seen = record("delete", "/tenant-categories/:id", () =>
      new HttpResponse(null, { status: 204 })
    )
    await expect(
      deleteTenantCategory(FIXTURE_CATEGORY_GENERAL.id)
    ).resolves.toBeUndefined()
    expect(seen[0]?.method).toBe("DELETE")
  })

  it("rejects 409 on a taken code and on an in-use delete, with the server message", async () => {
    await expect(
      createTenantCategory({ code: CATEGORY_CODE_DUPLICATE, name: "X" })
    ).rejects.toMatchObject({ kind: "HTTP", status: 409 })
    const error = await deleteTenantCategory(FIXTURE_CATEGORY.id).catch(
      (e: unknown) => e
    )
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toBe(CATEGORY_IN_USE_MESSAGE)
  })

  it("rejects a response that breaks the contract", async () => {
    record("put", "/tenant-categories/:id", () => HttpResponse.json({ id: 1 }))
    await expect(
      updateTenantCategory("x", { name: "n", isActive: true })
    ).rejects.toMatchObject({ kind: "CONTRACT" })
  })
})

describe("countries (writes)", () => {
  it("POST sends snake_case keys and omits empty optional keys", async () => {
    const seen = record("post", "/countries", () =>
      HttpResponse.json(FIXTURE_COUNTRY_SG, { status: 201 })
    )
    await createCountry({ code: "SG", name: "Singapore", phoneCode: "" })
    expect(seen[0]?.body).toEqual({ code: "SG", name: "Singapore" })
    await createCountry({
      code: "SG",
      name: "Singapore",
      nationalityName: "Singaporean",
      phoneCode: "+65",
    })
    expect(seen[1]?.body).toEqual({
      code: "SG",
      name: "Singapore",
      nationality_name: "Singaporean",
      phone_code: "+65",
    })
  })

  it("PUT puts the code in the path only", async () => {
    const seen = record("put", "/countries/:code", () =>
      HttpResponse.json(FIXTURE_COUNTRY_SG)
    )
    const loose = {
      name: "Singapore",
      isActive: true,
      code: "HACK",
    } as CountryUpdateInput
    await updateCountry("SG", loose)
    expect(seen[0]?.url).toBe("/api/v1/countries/SG")
    expect(seen[0]?.body).toEqual({ name: "Singapore", is_active: true })
    expect(seen[0]?.body).not.toHaveProperty("code")
  })

  it("DELETE resolves on 204 and rejects 409 when a tenant uses the country", async () => {
    await expect(deleteCountry("SG")).resolves.toBeUndefined()
    const error = await deleteCountry(FIXTURE_COUNTRY.code).catch(
      (e: unknown) => e
    )
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).message).toBe(COUNTRY_IN_USE_MESSAGE)
  })
})
