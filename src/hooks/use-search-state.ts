/**
 * Filters and page kept in the URL search params (ARCH-FE-001 D10). The
 * browser back button and a shared link restore the view. A value equal to its
 * default, or null, is left out of the URL.
 *
 * Values are strings. The caller parses and validates them (a page number, for
 * example) before use. Pass `defaults` as a module-level constant, so the
 * setter keeps a stable identity.
 */

import { useCallback, useMemo } from "react"

import {
  currentHref,
  navigateTo,
  splitHref,
  useLocationHref,
} from "@/app/router"

export type SearchDefaults = Readonly<Record<string, string>>

export type SearchState<S extends SearchDefaults> = {
  readonly [K in keyof S]: string
}

/** A key set to a string is written. A key set to null is removed (back to its default). */
export type SearchPatch<S extends SearchDefaults> = {
  readonly [K in keyof S]?: string | null
}

export interface SearchStateOptions {
  /** true replaces the history entry. The default adds one, so back restores the previous view. */
  readonly replace?: boolean
}

function readState<S extends SearchDefaults>(
  defaults: S,
  params: URLSearchParams
): SearchState<S> {
  const state: Record<string, string> = {}
  for (const key of Object.keys(defaults)) {
    state[key] = params.get(key) ?? defaults[key] ?? ""
  }
  // Object.keys(defaults) is exactly the key set of S, so the shape matches.
  // TypeScript cannot relate a Record over string keys to a mapped type over S.
  return state as SearchState<S>
}

/**
 * Returns the current values (each falls back to its default) and a setter.
 * The setter writes the patch into the URL and keeps every other key as it is.
 */
export function useSearchState<S extends SearchDefaults>(
  defaults: S
): readonly [
  SearchState<S>,
  (patch: SearchPatch<S>, options?: SearchStateOptions) => void,
] {
  const href = useLocationHref()
  const { search } = splitHref(href)
  const state = useMemo(
    () => readState(defaults, new URLSearchParams(search)),
    [defaults, search]
  )

  const setSearch = useCallback(
    (patch: SearchPatch<S>, options: SearchStateOptions = {}) => {
      // Read the URL at call time, so two calls in one event see each other.
      const { pathname, search: current } = splitHref(currentHref())
      const next = new URLSearchParams(current)
      for (const key of Object.keys(patch) as Array<keyof S & string>) {
        const value = patch[key]
        if (value === null || value === undefined || value === defaults[key]) {
          next.delete(key)
        } else {
          next.set(key, value)
        }
      }
      const query = next.toString()
      navigateTo(query === "" ? pathname : `${pathname}?${query}`, {
        replace: options.replace === true,
      })
    },
    [defaults]
  )

  return [state, setSearch] as const
}
