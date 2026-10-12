/**
 * The single navigation config (ARCH-FE-001 D6.3). Each item carries the route
 * access that the router gives its route (`navItemAt(path).access`), so the
 * sidebar, the command palette and the route guard use one gate. Visibility is
 * decided by the guard's own function (`resolveRouteAccess`).
 *
 * This file holds data and pure functions only (no React), so the gating is
 * tested in the node environment. These gates decide what the UI shows. The
 * backend enforces every permission (FE doc section 4).
 */

import { resolveRouteAccess, type RouteAccess } from "@/app/guards/route-guard"
import { hasPermissions, hasRole, type GateContext } from "@/lib/access/gates"
import { SYS_PRINCIPAL } from "@/lib/access/roles"
import { routeMeta, type RouteKey } from "@/lib/routes-meta"

export type NavSectionId = "tenant" | "catalog" | "team" | "account"

/** Sidebar group order. `account` holds the items every signed-in user sees. */
export const NAV_SECTION_ORDER: readonly NavSectionId[] = [
  "tenant",
  "catalog",
  "team",
  "account",
]

const SECTION_LABELS: Record<NavSectionId, string> = {
  tenant: "Tenant",
  catalog: "Katalog",
  team: "Tim IT",
  account: "Akun",
}

export type NavItemId =
  | "tenant.list"
  | "tenant.create"
  | "catalog.permission"
  | "catalog.kategori"
  | "catalog.negara"
  | "team.akun"
  | "team.peran"
  | "account.sessions"
  | "account.password"

/**
 * Which contract total a sidebar badge shows (REQ-FE-038). The sidebar reads
 * the count for the key; navigation.ts holds the key only.
 */
export type NavBadgeKey = "tenants" | "tenantCategories" | "countries"

export interface NavItem {
  readonly id: NavItemId
  readonly section: NavSectionId
  readonly label: string
  /** App path. A deeper path (for example /system-users/:id) belongs to this item. */
  readonly path: string
  /** The route access of this item's route. The router and the sidebar read the same value. */
  readonly access: RouteAccess
  /** A routes-meta key whose breadcrumb is used for this path. */
  readonly metaKey?: RouteKey
  /** The total shown as a badge beside the label. */
  readonly badge?: NavBadgeKey
}

/** Master-data screens (D6.2): a session, the password-change rule, and the SYS_PRINCIPAL role. */
const MASTER_DATA_ACCESS: RouteAccess = {
  kind: "session",
  passwordChange: "enforced",
  gates: [hasRole(SYS_PRINCIPAL)],
}

/** Auth-service screens (D6.4): a session, the password-change rule, and the listed permission keys. */
function permissionAccess(keys: readonly string[]): RouteAccess {
  return {
    kind: "session",
    passwordChange: "enforced",
    gates: [hasPermissions(keys)],
  }
}

/** Own sessions: any signed-in user, with the password-change rule. */
const OWN_SESSIONS_ACCESS: RouteAccess = {
  kind: "session",
  passwordChange: "enforced",
  gates: [],
}

/** Voluntary password change. It stays reachable while a change is required (REQ-FE-012). */
const CHANGE_PASSWORD_ACCESS: RouteAccess = {
  kind: "session",
  passwordChange: "exempt",
  gates: [],
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "tenant.list",
    section: "tenant",
    label: "Daftar tenant",
    path: "/tenants",
    access: MASTER_DATA_ACCESS,
    badge: "tenants",
  },
  {
    id: "tenant.create",
    section: "tenant",
    label: "Tambah tenant",
    path: "/tenants/new",
    access: MASTER_DATA_ACCESS,
  },
  {
    id: "catalog.permission",
    section: "catalog",
    label: "Permission",
    path: "/master-permissions",
    access: permissionAccess(["master_permissions:view"]),
  },
  {
    id: "catalog.kategori",
    section: "catalog",
    label: "Kategori tenant",
    path: "/tenant-categories",
    access: MASTER_DATA_ACCESS,
    badge: "tenantCategories",
  },
  {
    id: "catalog.negara",
    section: "catalog",
    label: "Negara",
    path: "/countries",
    access: MASTER_DATA_ACCESS,
    badge: "countries",
  },
  {
    id: "team.akun",
    section: "team",
    label: "Akun",
    path: "/system-users",
    access: permissionAccess(["system_users:view"]),
  },
  {
    id: "team.peran",
    section: "team",
    label: "Peran",
    path: "/system-roles",
    access: permissionAccess(["system_roles:view"]),
  },
  {
    id: "account.sessions",
    section: "account",
    label: "Sesi saya",
    path: "/account/sessions",
    access: OWN_SESSIONS_ACCESS,
  },
  {
    id: "account.password",
    section: "account",
    label: "Ubah password",
    path: "/account/password",
    access: CHANGE_PASSWORD_ACCESS,
    metaKey: "auth.change-password",
  },
]

/** The item whose path is exactly `path`. Throws when none has it, so a route cannot name a missing item. */
export function navItemAt(path: string): NavItem {
  const item = NAV_ITEMS.find((candidate) => candidate.path === path)
  if (item === undefined) {
    throw new Error(`No navigation item at ${path}.`)
  }
  return item
}

/**
 * Whether the sidebar and the palette show an item. The item's route access
 * goes through the guard's decision. While a password change is required,
 * navigation is hidden (D4.6), and the change page is reached by redirect.
 */
export function isNavItemVisible(item: NavItem, context: GateContext): boolean {
  if (context.status === "passwordChangeRequired") return false
  return (
    resolveRouteAccess({
      access: item.access,
      status: context.status,
      me: context.me,
    }).kind === "render"
  )
}

export interface VisibleNavSection {
  readonly id: NavSectionId
  readonly label: string
  readonly items: readonly NavItem[]
}

/** The items the context may see, grouped in sidebar order. Empty groups are left out. */
export function visibleNavSections(
  context: GateContext
): readonly VisibleNavSection[] {
  return NAV_SECTION_ORDER.map((id) => ({
    id,
    label: SECTION_LABELS[id],
    items: NAV_ITEMS.filter(
      (item) => item.section === id && isNavItemVisible(item, context)
    ),
  })).filter((section) => section.items.length > 0)
}

/** True when at least one item outside the own-account section is visible. */
export function hasVisibleModule(context: GateContext): boolean {
  return visibleNavSections(context).some((section) => section.id !== "account")
}

/**
 * The item for an app path: the longest item path that equals the path or is
 * its parent. Returns null when no item covers the path.
 */
export function findNavItem(pathname: string): NavItem | null {
  let best: NavItem | null = null
  for (const item of NAV_ITEMS) {
    const covers =
      pathname === item.path || pathname.startsWith(`${item.path}/`)
    if (covers && (best === null || item.path.length > best.path.length)) {
      best = item
    }
  }
  return best
}

/**
 * The breadcrumb for an app path, or null when no item covers it. An item
 * with a routes-meta key uses that key's breadcrumb (ARCH-FE-001 D10).
 */
export function breadcrumbFor(pathname: string): readonly string[] | null {
  const item = findNavItem(pathname)
  if (item === null) return null
  if (item.metaKey !== undefined) return routeMeta[item.metaKey].breadcrumb
  return [SECTION_LABELS[item.section], item.label]
}
