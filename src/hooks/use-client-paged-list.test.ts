// @vitest-environment jsdom
// The hook keeps its search text and page in the URL (ARCH-FE-001 D10), so it
// needs the DOM. The file opts in with the same comment the component tests use.
import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import {
  filterItems,
  normaliseQuery,
  parsePage,
  sliceItemsPage,
  useClientPagedList,
} from "./use-client-paged-list"

const ITEMS = Array.from({ length: 25 }, (_, index) => `item-${index + 1}`)
const matches = (item: string, query: string) => item.includes(query)

afterEach(() => {
  cleanup()
  window.history.replaceState(null, "", "/")
})

describe("pure pagination rules (D5.4)", () => {
  it("trims and lower-cases the search text", () => {
    expect(normaliseQuery("  ABC  ")).toBe("abc")
  })

  it("keeps every item for an empty query and filters otherwise", () => {
    expect(filterItems(ITEMS, "", matches)).toHaveLength(25)
    expect(filterItems(ITEMS, "item-2", matches)).toHaveLength(7)
  })

  it("reads a page from the URL and treats anything else as page 1", () => {
    expect(parsePage("3")).toBe(3)
    expect(parsePage("abc")).toBe(1)
    expect(parsePage("0")).toBe(1)
    expect(parsePage("-2")).toBe(1)
    expect(parsePage("")).toBe(1)
  })

  it("cuts one page and clamps a page past the end to the last page", () => {
    const third = sliceItemsPage(ITEMS, 3, 10)
    expect(third.page).toBe(3)
    expect(third.pageItems).toEqual([
      "item-21",
      "item-22",
      "item-23",
      "item-24",
      "item-25",
    ])
    expect({ from: third.from, to: third.to }).toEqual({ from: 21, to: 25 })

    const clamped = sliceItemsPage(ITEMS, 9, 10)
    expect(clamped.page).toBe(3)
  })

  it("reports zero indexes and one empty page when nothing matches", () => {
    const empty = sliceItemsPage([], 1, 10)
    expect(empty).toEqual({
      page: 1,
      pageCount: 1,
      pageItems: [],
      from: 0,
      to: 0,
    })
  })
})

describe("useClientPagedList", () => {
  it("shows the first page of a whole list", () => {
    const { result } = renderHook(() =>
      useClientPagedList(ITEMS, { pageSize: 10, matches })
    )
    expect(result.current.page).toBe(1)
    expect(result.current.pageCount).toBe(3)
    expect(result.current.pageItems).toHaveLength(10)
    expect({
      from: result.current.from,
      to: result.current.to,
      total: result.current.total,
    }).toEqual({
      from: 1,
      to: 10,
      total: 25,
    })
  })

  it("moves to a page and writes it to the URL", () => {
    const { result } = renderHook(() =>
      useClientPagedList(ITEMS, { pageSize: 10, matches })
    )
    act(() => result.current.setPage(2))
    expect(window.location.search).toBe("?page=2")
    expect(result.current.page).toBe(2)
    expect(result.current.from).toBe(11)
  })

  it("starts a new search on page 1 and drops the page from the URL", () => {
    window.history.replaceState(null, "", "/account/sessions?page=2")
    const { result } = renderHook(() =>
      useClientPagedList(ITEMS, { pageSize: 10, matches })
    )
    expect(result.current.page).toBe(2)

    act(() => result.current.setQuery("item-1"))
    expect(window.location.search).toBe("?q=item-1")
    expect(result.current.page).toBe(1)
    expect(result.current.total).toBe(11)
  })

  it("treats a page value that is not a number as page 1", () => {
    window.history.replaceState(null, "", "/account/sessions?page=abc")
    const { result } = renderHook(() =>
      useClientPagedList(ITEMS, { pageSize: 10, matches })
    )
    expect(result.current.page).toBe(1)
  })
})
