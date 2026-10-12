import { describe, expect, it } from "vitest"

import {
  TENANT_PAGE_SIZE,
  TENANT_SEARCH_DEFAULTS,
  hasActiveFilter,
  parsePageParam,
  toListParams,
  type TenantSearch,
} from "./list-filters"

const NONE: TenantSearch = TENANT_SEARCH_DEFAULTS

describe("toListParams (D8.1)", () => {
  it("sends page 1 and the page size when no filter is set", () => {
    expect(toListParams(NONE)).toEqual({ page: 1, limit: TENANT_PAGE_SIZE })
  })

  it("maps every filter to its API parameter", () => {
    expect(
      toListParams({
        status: "inactive",
        category: "cat-1",
        country: "SG",
        deployment: "DEDICATED",
        code: " SMILE ",
        page: "3",
      })
    ).toEqual({
      page: 3,
      limit: TENANT_PAGE_SIZE,
      isActive: false,
      categoryId: "cat-1",
      countryCode: "SG",
      deploymentType: "DEDICATED",
      code: "SMILE",
    })
  })

  it("leaves the status out for all and maps active to true", () => {
    expect(toListParams({ ...NONE, status: "active" }).isActive).toBe(true)
    expect("isActive" in toListParams({ ...NONE, status: "" })).toBe(false)
  })

  it("ignores a deployment type or status that a hand-edited URL made up", () => {
    const params = toListParams({ ...NONE, deployment: "SHARED", status: "x" })

    expect("deploymentType" in params).toBe(false)
    expect("isActive" in params).toBe(false)
  })

  it("treats a bad page as page 1", () => {
    expect(parsePageParam("0")).toBe(1)
    expect(parsePageParam("-2")).toBe(1)
    expect(parsePageParam("abc")).toBe(1)
    expect(parsePageParam("4")).toBe(4)
  })
})

describe("hasActiveFilter", () => {
  it("is false for the defaults and for a page alone", () => {
    expect(hasActiveFilter(NONE)).toBe(false)
    expect(hasActiveFilter({ ...NONE, page: "2" })).toBe(false)
    expect(hasActiveFilter({ ...NONE, code: "  " })).toBe(false)
  })

  it("is true when any filter is set", () => {
    expect(hasActiveFilter({ ...NONE, country: "ID" })).toBe(true)
    expect(hasActiveFilter({ ...NONE, code: "GAIA" })).toBe(true)
  })
})
