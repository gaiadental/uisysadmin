/**
 * Route table and router (ARCH-FE-001 D10). History API path routes with no
 * routing library (ADR-001; FE-OQ-37). Every route is lazy, has its own
 * Suspense and error boundary, and passes the route guard.
 *
 * The table holds the auth routes, each a lazy import of its page (TODO-008).
 * Each module TODO adds its routes here and its keys to routes-meta.ts.
 * The legacy hash router in `router/index.tsx` is not used by this file.
 *
 * A route that has a navigation item takes its access from that item
 * (`navItemAt(path).access`, ARCH-FE-001 D6.3), so the sidebar and the guard
 * share one gate. Public routes have no navigation item and declare their own.
 */

// The location helpers below are exported for use-search-state.ts. They share
// the private location store with AppRouter, so splitting them needs a file
// outside TODO-006 scope (same reasoning as auth-provider.tsx, TODO-005).
/* eslint-disable react-refresh/only-export-components */

import {
  lazy,
  Suspense,
  useSyncExternalStore,
  type ComponentType,
  type LazyExoticComponent,
} from "react"

import { RouteErrorBoundary } from "@/app/guards/route-error-boundary"
import {
  LOGIN_PATH,
  PASSWORD_CHANGE_PATH,
  RouteGuard,
  type RouteAccess,
} from "@/app/guards/route-guard"
import { RouteLoadingScreen } from "@/components/custom/status-screens"
import { navItemAt } from "@/app/navigation"
import { TENANT_PERMISSIONS_ACCESS } from "@/features/tenants/permissions/access"
import type { RouteKey } from "@/lib/routes-meta"

interface RouteSpec {
  readonly path: string
  readonly access: RouteAccess
  readonly Page: LazyExoticComponent<ComponentType>
}

interface MatchedRoute extends RouteSpec {
  readonly key: RouteKey
}

const ROUTE_SPECS: Record<RouteKey, RouteSpec> = {
  // Any signed-in user. The page decides which widgets the role may see (D7).
  dashboard: {
    path: "/",
    access: { kind: "session", passwordChange: "enforced", gates: [] },
    Page: lazy(() =>
      import("@/features/dashboard/dashboard-page").then((module) => ({
        default: module.DashboardPage,
      }))
    ),
  },
  "auth.login": {
    path: LOGIN_PATH,
    access: { kind: "public" },
    Page: lazy(() =>
      import("@/features/auth/login-page").then((module) => ({
        default: module.LoginPage,
      }))
    ),
  },
  "auth.forgot-password": {
    path: "/forgot-password",
    access: { kind: "public" },
    Page: lazy(() =>
      import("@/features/auth/forgot-password-page").then((module) => ({
        default: module.ForgotPasswordPage,
      }))
    ),
  },
  "auth.reset-password": {
    path: "/reset-password",
    access: { kind: "public" },
    Page: lazy(() =>
      import("@/features/auth/reset-password-page").then((module) => ({
        default: module.ResetPasswordPage,
      }))
    ),
  },
  "auth.change-password": {
    path: PASSWORD_CHANGE_PATH,
    access: navItemAt(PASSWORD_CHANGE_PATH).access,
    Page: lazy(() =>
      import("@/features/auth/change-password-page").then((module) => ({
        default: module.ChangePasswordPage,
      }))
    ),
  },
  "tenant.list": {
    path: "/tenants",
    access: navItemAt("/tenants").access,
    Page: lazy(() =>
      import("@/features/tenants/list/tenant-list-page").then((module) => ({
        default: module.TenantListPage,
      }))
    ),
  },
  "tenant.new": {
    path: "/tenants/new",
    access: navItemAt("/tenants/new").access,
    Page: lazy(() =>
      import("@/features/tenants/create/tenant-create-page").then((module) => ({
        default: module.TenantCreatePage,
      }))
    ),
  },
  // A ":name" segment matches one path segment. The page reads the value itself.
  "tenant.detail": {
    path: "/tenants/:id",
    access: navItemAt("/tenants").access,
    Page: lazy(() =>
      import("@/features/tenants/detail/tenant-detail-page").then((module) => ({
        default: module.TenantDetailPage,
      }))
    ),
  },
  // The Permissions tab is a path route on the detail page (D7). It adds the view keys to the role gate.
  "tenant.permissions": {
    path: "/tenants/:id/permissions",
    access: TENANT_PERMISSIONS_ACCESS,
    Page: lazy(() =>
      import("@/features/tenants/detail/tenant-detail-page").then((module) => ({
        default: module.TenantDetailPage,
      }))
    ),
  },
  "catalog.permission": {
    path: "/master-permissions",
    access: navItemAt("/master-permissions").access,
    Page: lazy(() =>
      import("@/features/catalog/master-permissions/permission-list-page").then(
        (module) => ({ default: module.PermissionListPage })
      )
    ),
  },
  "catalog.tenant-categories": {
    path: "/tenant-categories",
    access: navItemAt("/tenant-categories").access,
    Page: lazy(() =>
      import(
        "@/features/catalog/tenant-categories/tenant-category-list-page"
      ).then((module) => ({ default: module.TenantCategoryListPage }))
    ),
  },
  "catalog.countries": {
    path: "/countries",
    access: navItemAt("/countries").access,
    Page: lazy(() =>
      import("@/features/catalog/countries/country-list-page").then(
        (module) => ({ default: module.CountryListPage })
      )
    ),
  },
  "team.users": {
    path: "/system-users",
    access: navItemAt("/system-users").access,
    Page: lazy(() =>
      import("@/features/team/users/user-list-page").then((module) => ({
        default: module.UserListPage,
      }))
    ),
  },
  "team.user-detail": {
    path: "/system-users/:id",
    access: navItemAt("/system-users").access,
    Page: lazy(() =>
      import("@/features/team/users/user-detail-page").then((module) => ({
        default: module.UserDetailPage,
      }))
    ),
  },
  "team.roles": {
    path: "/system-roles",
    access: navItemAt("/system-roles").access,
    Page: lazy(() =>
      import("@/features/team/roles/role-list-page").then((module) => ({
        default: module.RoleListPage,
      }))
    ),
  },
  "team.role-detail": {
    path: "/system-roles/:id",
    access: navItemAt("/system-roles").access,
    Page: lazy(() =>
      import("@/features/team/roles/role-detail-page").then((module) => ({
        default: module.RoleDetailPage,
      }))
    ),
  },
  "account.sessions": {
    path: "/account/sessions",
    access: navItemAt("/account/sessions").access,
    Page: lazy(() =>
      import("@/features/auth/sessions-page").then((module) => ({
        default: module.SessionsPage,
      }))
    ),
  },
}

const ROUTE_KEYS = Object.keys(ROUTE_SPECS) as RouteKey[]

/** True when the spec path matches the path. A ":name" segment matches any one non-empty segment. */
function pathMatches(specPath: string, path: string): boolean {
  if (!specPath.includes(":")) return specPath === path
  const specParts = specPath.split("/")
  const parts = path.split("/")
  return (
    specParts.length === parts.length &&
    specParts.every(
      (part, index) =>
        part === parts[index] ||
        (part.startsWith(":") && (parts[index] ?? "") !== "")
    )
  )
}

/**
 * The route for a path (a trailing slash is ignored), or null. An exact path
 * wins over a pattern, so "/tenants/new" is not read as "/tenants/:id".
 */
function matchRoute(pathname: string): MatchedRoute | null {
  const path =
    pathname.length > 1 && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname
  let pattern: MatchedRoute | null = null
  for (const key of ROUTE_KEYS) {
    const spec = ROUTE_SPECS[key]
    if (!pathMatches(spec.path, path)) continue
    if (!spec.path.includes(":")) return { key, ...spec }
    pattern ??= { key, ...spec }
  }
  return pattern
}

/** The access the route table gives an exact path, or null when no route matches. */
export function routeAccessFor(pathname: string): RouteAccess | null {
  return matchRoute(pathname)?.access ?? null
}

const LOCATION_CHANGE_EVENT = "sp:locationchange"

/** The current path and query as one string, such as "/tenant?page=2". */
export function currentHref(): string {
  return `${window.location.pathname}${window.location.search}`
}

/** Splits an href into its path and its query, without the leading "?". */
export function splitHref(href: string): {
  readonly pathname: string
  readonly search: string
} {
  const queryStart = href.indexOf("?")
  if (queryStart === -1) return { pathname: href, search: "" }
  return {
    pathname: href.slice(0, queryStart),
    search: href.slice(queryStart + 1),
  }
}

function subscribeToLocation(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange)
  window.addEventListener(LOCATION_CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener("popstate", onChange)
    window.removeEventListener(LOCATION_CHANGE_EVENT, onChange)
  }
}

/** The current href. The caller re-renders on every navigation, back and forward included. */
export function useLocationHref(): string {
  return useSyncExternalStore(subscribeToLocation, currentHref)
}

export interface NavigateOptions {
  /** true replaces the current history entry instead of adding one. */
  readonly replace?: boolean
}

/** Moves this tab to an app path such as "/login". Navigating to the current href does nothing. */
export function navigateTo(to: string, options: NavigateOptions = {}): void {
  if (to === currentHref()) return
  if (options.replace === true) {
    window.history.replaceState(null, "", to)
  } else {
    window.history.pushState(null, "", to)
  }
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT))
}

function redirectReplace(to: string): void {
  navigateTo(to, { replace: true })
}

/** Renders the matched route inside the guard. Mount once, below the providers. */
export function AppRouter() {
  const { pathname } = splitHref(useLocationHref())
  const route = matchRoute(pathname)
  return (
    <RouteGuard access={route?.access ?? null} onRedirect={redirectReplace}>
      {route === null ? null : (
        <RouteErrorBoundary key={pathname} routeKey={route.key}>
          <Suspense fallback={<RouteLoadingScreen />}>
            <route.Page />
          </Suspense>
        </RouteErrorBoundary>
      )}
    </RouteGuard>
  )
}
