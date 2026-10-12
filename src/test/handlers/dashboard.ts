/**
 * MSW helpers for the dashboard and sidebar count tests (TODO-016;
 * ARCH-FE-001 D7, D19). The default GET handlers in `tenants.ts` answer the
 * list endpoints from two fixtures, so the totals there are 2. A test that
 * needs other totals installs `dashboardCountHandlers(...)` with
 * `server.use(...)`. The handlers answer an empty page with the chosen
 * `pagination.total`, like the server does for `limit=1`, and record the
 * query string of each request in `seen`.
 *
 * There is no default entry in `index.ts`: a default here would shadow the
 * list handlers that the other screen tests rely on.
 */

import { http, HttpResponse } from "msw"

import { API } from "./auth"
import { FIXTURE_TENANT, listBody, pagingOf } from "./tenants"

export interface DashboardTotals {
  readonly tenants: number
  readonly activeTenants: number
  readonly categories: number
  readonly countries: number
}

export const DASHBOARD_TOTALS: DashboardTotals = {
  tenants: 12,
  activeTenants: 9,
  categories: 4,
  countries: 7,
}

export interface SeenRequest {
  readonly path: "tenants" | "tenant-categories" | "countries"
  readonly query: URLSearchParams
}

/** Count handlers. `limit=1` returns no rows; `limit=5` returns up to five tenants. */
export function dashboardCountHandlers(
  totals: DashboardTotals,
  seen: SeenRequest[] = []
) {
  return [
    http.get(`${API}/tenants`, ({ request }) => {
      const url = new URL(request.url)
      seen.push({ path: "tenants", query: url.searchParams })
      const { limit } = pagingOf(url)
      const total =
        url.searchParams.get("is_active") === "true"
          ? totals.activeTenants
          : totals.tenants
      const rows = limit > 1 ? [FIXTURE_TENANT] : []
      return HttpResponse.json(listBody(rows, 1, limit, total))
    }),
    http.get(`${API}/tenant-categories`, ({ request }) => {
      const url = new URL(request.url)
      seen.push({ path: "tenant-categories", query: url.searchParams })
      return HttpResponse.json(
        listBody([], 1, pagingOf(url).limit, totals.categories)
      )
    }),
    http.get(`${API}/countries`, ({ request }) => {
      const url = new URL(request.url)
      seen.push({ path: "countries", query: url.searchParams })
      return HttpResponse.json(
        listBody([], 1, pagingOf(url).limit, totals.countries)
      )
    }),
  ]
}
