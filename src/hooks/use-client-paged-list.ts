/**
 * One client-side search and pagination hook for lists that auth-service
 * returns whole (ARCH-FE-001 D5.4). The search text and the page live in the
 * URL search params (D10), so the browser back button and a shared link keep
 * the view. A new search goes back to page 1.
 *
 * The pure functions below hold the rules. The hook only connects them to the
 * URL, so the rules are tested without a React tree.
 */

import { useCallback, useMemo } from "react"

import { useSearchState } from "@/hooks/use-search-state"

export const DEFAULT_PAGE_SIZE = 20

const SEARCH_DEFAULTS = { q: "", page: "1" } as const

export interface ClientPagedListOptions<T> {
  readonly pageSize?: number
  /** True when the item matches the query. The query is trimmed and lower-cased. */
  readonly matches: (item: T, query: string) => boolean
}

export interface ClientPagedList<T> {
  /** The raw search text from the URL, as the user typed it. */
  readonly query: string
  readonly setQuery: (query: string) => void
  /** The current page, 1-based and clamped to the page count. */
  readonly page: number
  readonly setPage: (page: number) => void
  readonly pageCount: number
  readonly pageItems: readonly T[]
  /** How many items match the query. */
  readonly total: number
  /** 1-based index of the first item on the page, or 0 when nothing matches. */
  readonly from: number
  /** 1-based index of the last item on the page, or 0 when nothing matches. */
  readonly to: number
  readonly pageSize: number
}

/** Trims and lower-cases the search text. An empty result matches everything. */
export function normaliseQuery(raw: string): string {
  return raw.trim().toLocaleLowerCase()
}

/** Keeps the items that match a normalised query. An empty query keeps every item. */
export function filterItems<T>(
  items: readonly T[],
  query: string,
  matches: (item: T, query: string) => boolean
): readonly T[] {
  if (query === "") return items
  return items.filter((item) => matches(item, query))
}

/** A page number from the URL. Anything that is not a positive integer is page 1. */
export function parsePage(raw: string): number {
  const value = Number.parseInt(raw, 10)
  return Number.isInteger(value) && value >= 1 ? value : 1
}

export function pageCountFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}

export interface PageSlice<T> {
  readonly page: number
  readonly pageCount: number
  readonly pageItems: readonly T[]
  readonly from: number
  readonly to: number
}

/** Cuts one page out of the matching items. A page past the end is clamped to the last page. */
export function sliceItemsPage<T>(
  matching: readonly T[],
  requestedPage: number,
  pageSize: number
): PageSlice<T> {
  const pageCount = pageCountFor(matching.length, pageSize)
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const start = (page - 1) * pageSize
  const pageItems = matching.slice(start, start + pageSize)
  const isEmpty = matching.length === 0
  return {
    page,
    pageCount,
    pageItems,
    from: isEmpty ? 0 : start + 1,
    to: isEmpty ? 0 : start + pageItems.length,
  }
}

export function useClientPagedList<T>(
  items: readonly T[],
  options: ClientPagedListOptions<T>
): ClientPagedList<T> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const { matches } = options
  const [search, setSearch] = useSearchState(SEARCH_DEFAULTS)

  const query = normaliseQuery(search.q)
  const matching = useMemo(
    () => filterItems(items, query, matches),
    [items, query, matches]
  )
  const slice = useMemo(
    () => sliceItemsPage(matching, parsePage(search.page), pageSize),
    [matching, search.page, pageSize]
  )

  // A changed search drops the page parameter, so the new results start on page 1.
  const setQuery = useCallback(
    (raw: string) => {
      setSearch({ q: raw, page: null }, { replace: true })
    },
    [setSearch]
  )

  const setPage = useCallback(
    (page: number) => {
      const clamped = Math.min(Math.max(1, Math.trunc(page)), slice.pageCount)
      setSearch({ page: String(clamped) })
    },
    [setSearch, slice.pageCount]
  )

  return {
    query: search.q,
    setQuery,
    page: slice.page,
    setPage,
    pageCount: slice.pageCount,
    pageItems: slice.pageItems,
    total: matching.length,
    from: slice.from,
    to: slice.to,
    pageSize,
  }
}
