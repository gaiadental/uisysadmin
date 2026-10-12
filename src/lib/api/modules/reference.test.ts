import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  API,
} from "@/test/handlers/auth"
import {
  FIXTURE_CATEGORY,
  FIXTURE_CATEGORY_GENERAL,
  FIXTURE_COUNTRY,
  FIXTURE_COUNTRY_SG,
  listBody,
  pagingOf,
} from "@/test/handlers/tenants"
import { server } from "@/test/server"

import { ApiError } from "../errors"
import { setAccessToken } from "../refresh"

import { listAllCountries, listCountries } from "./countries"
import { listAllTenantCategories, listTenantCategories } from "./tenant-categories"

const BASE_URL = "http://sp.test"

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL)
  setAccessToken(null)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  setAccessToken(null)
})

/** `count` categories with distinct ids and codes, for the multi-page loader tests. */
function manyCategories(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...FIXTURE_CATEGORY,
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    code: `CAT-${index}`,
  }))
}

function manyCountries(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    ...FIXTURE_COUNTRY,
    code: `C${String.fromCharCode(65 + (index % 26))}${index}`,
  }))
}

describe("tenant categories (FE doc 6.1)", () => {
  it("maps every field of a category to camelCase", async () => {
    const result = await listTenantCategories({ page: 1, limit: 20 })

    expect(result.data[0]).toEqual({
      id: FIXTURE_CATEGORY.id,
      code: "DENTAL",
      name: "Dental Clinic",
      description: "Klinik gigi",
      isActive: true,
      createdAt: FIXTURE_CATEGORY.created_at,
      createdBy: FIXTURE_CATEGORY.created_by,
      updatedAt: FIXTURE_CATEGORY.updated_at,
      updatedBy: FIXTURE_CATEGORY.updated_by,
    })
    expect(result.data[1]?.description).toBeNull()
  })

  it("sends the documented filters", async () => {
    let query: URLSearchParams | null = null
    server.use(
      http.get(`${API}/tenant-categories`, ({ request }) => {
        query = new URL(request.url).searchParams
        return HttpResponse.json(listBody([], 1, 20, 0))
      })
    )

    await listTenantCategories({ page: 3, limit: 50, isActive: true, code: "DENTAL" })

    expect(Object.fromEntries(query ?? [])).toEqual({
      page: "3",
      limit: "50",
      is_active: "true",
      code: "DENTAL",
    })
  })

  it("loads the reference list with limit=100 in one request when the total is 100 or less", async () => {
    const limits: string[] = []
    server.use(
      http.get(`${API}/tenant-categories`, ({ request }) => {
        limits.push(new URL(request.url).searchParams.get("limit") ?? "")
        return HttpResponse.json(
          listBody([FIXTURE_CATEGORY, FIXTURE_CATEGORY_GENERAL], 1, 100, 2)
        )
      })
    )

    const all = await listAllTenantCategories()

    expect(limits).toEqual(["100"])
    expect(all.map((item) => item.code)).toEqual(["DENTAL", "GENERAL"])
  })

  it("fetches every page when the total is above 100", async () => {
    const items = manyCategories(230)
    const pages: number[] = []
    server.use(
      http.get(`${API}/tenant-categories`, ({ request }) => {
        const { page, limit } = pagingOf(new URL(request.url))
        pages.push(page)
        const start = (page - 1) * limit
        return HttpResponse.json(
          listBody(items.slice(start, start + limit), page, limit, items.length)
        )
      })
    )

    const all = await listAllTenantCategories()

    expect(pages).toEqual([1, 2, 3])
    expect(all).toHaveLength(230)
    expect(new Set(all.map((item) => item.id)).size).toBe(230)
  })

  it("accepts a null updated_by and maps it to updatedBy null", async () => {
    server.use(
      http.get(`${API}/tenant-categories`, () =>
        HttpResponse.json(
          listBody([{ ...FIXTURE_CATEGORY, updated_by: null }], 1, 20, 1)
        )
      )
    )

    const result = await listTenantCategories({ page: 1, limit: 20 })

    expect(result.data[0]?.updatedBy).toBeNull()
    expect(result.data[0]?.createdBy).toBe(FIXTURE_CATEGORY.created_by)
  })

  it("reports a category without is_active as CONTRACT", async () => {
    const broken: Record<string, unknown> = { ...FIXTURE_CATEGORY }
    delete broken.is_active
    server.use(
      http.get(`${API}/tenant-categories`, () =>
        HttpResponse.json(listBody([broken], 1, 100, 1))
      )
    )

    await expect(listAllTenantCategories()).rejects.toMatchObject({
      kind: "CONTRACT",
    })
  })
})

describe("countries (FE doc 6.2)", () => {
  it("maps every field of a country to camelCase", async () => {
    const result = await listCountries()

    expect(result.data[0]).toEqual({
      code: "ID",
      name: "Indonesia",
      nationalityName: "Indonesian",
      phoneCode: "+62",
      isActive: true,
      createdAt: FIXTURE_COUNTRY.created_at,
      createdBy: FIXTURE_COUNTRY.created_by,
      updatedAt: FIXTURE_COUNTRY.updated_at,
      updatedBy: FIXTURE_COUNTRY.updated_by,
    })
    expect(result.data[1]?.code).toBe(FIXTURE_COUNTRY_SG.code)
  })

  it("accepts a null updated_by and maps it to updatedBy null", async () => {
    server.use(
      http.get(`${API}/countries`, () =>
        HttpResponse.json(
          listBody([{ ...FIXTURE_COUNTRY, updated_by: null }])
        )
      )
    )

    const result = await listCountries()

    expect(result.data[0]?.updatedBy).toBeNull()
    expect(result.data[0]?.createdBy).toBe(FIXTURE_COUNTRY.created_by)
  })

  it("accepts null nationality and phone code", async () => {
    server.use(
      http.get(`${API}/countries`, () =>
        HttpResponse.json(
          listBody([{ ...FIXTURE_COUNTRY, nationality_name: null, phone_code: null }])
        )
      )
    )

    const result = await listCountries()

    expect(result.data[0]?.nationalityName).toBeNull()
    expect(result.data[0]?.phoneCode).toBeNull()
  })

  it("sends the search filter and the pagination keys", async () => {
    let query: URLSearchParams | null = null
    server.use(
      http.get(`${API}/countries`, ({ request }) => {
        query = new URL(request.url).searchParams
        return HttpResponse.json(listBody([], 1, 20, 0))
      })
    )

    await listCountries({ page: 2, limit: 10, isActive: false, search: "indo" })

    expect(Object.fromEntries(query ?? [])).toEqual({
      page: "2",
      limit: "10",
      is_active: "false",
      search: "indo",
    })
  })

  it("fetches every page of the reference list when the total is above 100", async () => {
    const items = manyCountries(101)
    const limits: string[] = []
    server.use(
      http.get(`${API}/countries`, ({ request }) => {
        const url = new URL(request.url)
        limits.push(url.searchParams.get("limit") ?? "")
        const { page, limit } = pagingOf(url)
        const start = (page - 1) * limit
        return HttpResponse.json(
          listBody(items.slice(start, start + limit), page, limit, items.length)
        )
      })
    )

    const all = await listAllCountries()

    expect(limits).toEqual(["100", "100"])
    expect(all).toHaveLength(101)
  })

  it("does not retry a failed page automatically", async () => {
    let calls = 0
    server.use(
      http.get(`${API}/countries`, () => {
        calls += 1
        return HttpResponse.json(
          { code: "SERVICE_UNAVAILABLE", message: "down" },
          { status: 503 }
        )
      })
    )

    await expect(listAllCountries()).rejects.toBeInstanceOf(ApiError)
    expect(calls).toBe(1)
  })
})
