// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi, type Mock } from "vitest"

import {
  useAuth,
  type AuthContextValue,
  type AuthStatus,
} from "@/app/providers/auth-provider"
import { hasPermissions } from "@/lib/access/gates"
import { SYS_PRINCIPAL } from "@/lib/access/roles"
import {
  NAV_ITEMS,
  isNavItemVisible,
  navItemAt,
  visibleNavSections,
} from "@/app/navigation"
import { routeAccessFor } from "@/app/router"
import type { Me } from "@/types/auth"

import {
  LOGIN_PATH,
  PASSWORD_CHANGE_PATH,
  RouteGuard,
  type RouteAccess,
} from "./route-guard"

vi.mock("@/app/providers/auth-provider", () => ({ useAuth: vi.fn() }))

const ME: Me = {
  userId: "usr-001",
  loginId: "principal@example.com",
  userType: "SYSTEM",
  context: "SYSTEM",
  role: SYS_PRINCIPAL,
  permissions: ["system_users:view"],
  tenant: null,
  branches: [],
  pwdChangeRequired: false,
}

const CHANGE_REQUIRED_ME: Me = { ...ME, pwdChangeRequired: true }

const SYS_ADMIN_ME: Me = { ...ME, role: "SYS_ADMIN", permissions: [] }

const ALL_PERMISSIONS = [
  "master_permissions:view",
  "system_users:view",
  "system_roles:view",
]

const PRINCIPAL_ME: Me = { ...ME, role: SYS_PRINCIPAL, permissions: [] }
const PRINCIPAL_ALL_ME: Me = { ...PRINCIPAL_ME, permissions: ALL_PERMISSIONS }
const PASSWORD_PENDING_ME: Me = { ...PRINCIPAL_ALL_ME, pwdChangeRequired: true }

const PAGE_TEXT = "Page content"

const PUBLIC: RouteAccess = { kind: "public" }
const CHANGE_PAGE: RouteAccess = {
  kind: "session",
  passwordChange: "exempt",
  gates: [],
}
const PROTECTED: RouteAccess = {
  kind: "session",
  passwordChange: "enforced",
  gates: [hasPermissions(["system_users:view"])],
}
const MISSING_PERMISSION: RouteAccess = {
  kind: "session",
  passwordChange: "enforced",
  gates: [hasPermissions(["sessions:revoke"])],
}

type Outcome =
  | { readonly kind: "render" }
  | { readonly kind: "redirect"; readonly to: string }
  | { readonly kind: "screen"; readonly heading: string }
  | { readonly kind: "loading" }

const NOT_FOUND = "Halaman tidak ditemukan"
const FORBIDDEN = "Akses ditolak"
const UNAVAILABLE = "Layanan tidak tersedia"

function authValue(
  status: AuthStatus,
  me: Me | null,
  retryBoot = vi.fn()
): AuthContextValue {
  return {
    status,
    me,
    login: vi.fn(),
    logout: vi.fn(),
    retryBoot,
    refreshMe: vi.fn(),
    completePasswordChange: vi.fn(),
  }
}

function renderGuard(
  access: RouteAccess | null,
  status: AuthStatus,
  me: Me | null
): Mock {
  vi.mocked(useAuth).mockReturnValue(authValue(status, me))
  const onRedirect = vi.fn()
  render(
    <RouteGuard access={access} onRedirect={onRedirect}>
      <p>{PAGE_TEXT}</p>
    </RouteGuard>
  )
  return onRedirect
}

function expectOutcome(outcome: Outcome, onRedirect: Mock): void {
  const pageShown = screen.queryByText(PAGE_TEXT) !== null
  if (outcome.kind === "render") {
    expect(pageShown).toBe(true)
    expect(onRedirect).not.toHaveBeenCalled()
    return
  }
  expect(pageShown).toBe(false)
  if (outcome.kind === "redirect") {
    expect(onRedirect).toHaveBeenCalledWith(outcome.to)
    return
  }
  expect(onRedirect).not.toHaveBeenCalled()
  if (outcome.kind === "loading") {
    expect(screen.getByRole("status")).toHaveTextContent("Memuat halaman")
    return
  }
  expect(
    screen.getByRole("heading", { name: outcome.heading })
  ).toBeInTheDocument()
}

afterEach(() => {
  cleanup()
})

describe("route guard redirect table (D6.1, D10, REQ-FE-012)", () => {
  it.each<[string, RouteAccess | null, AuthStatus, Me | null, Outcome]>([
    [
      "anonymous on a protected route goes to LOGIN",
      PROTECTED,
      "anonymous",
      null,
      { kind: "redirect", to: LOGIN_PATH },
    ],
    [
      "anonymous on a public route renders",
      PUBLIC,
      "anonymous",
      null,
      { kind: "render" },
    ],
    [
      "session with the permission renders",
      PROTECTED,
      "authenticated",
      ME,
      { kind: "render" },
    ],
    [
      "session without the permission gets the 403 screen",
      MISSING_PERMISSION,
      "authenticated",
      ME,
      { kind: "screen", heading: FORBIDDEN },
    ],
    [
      "session with a change pending goes to PASSWORD_CHANGE",
      PROTECTED,
      "authenticated",
      CHANGE_REQUIRED_ME,
      { kind: "redirect", to: PASSWORD_CHANGE_PATH },
    ],
    [
      "forced change blocks a public route",
      PUBLIC,
      "passwordChangeRequired",
      CHANGE_REQUIRED_ME,
      { kind: "redirect", to: PASSWORD_CHANGE_PATH },
    ],
    [
      "forced change blocks a protected route",
      PROTECTED,
      "passwordChangeRequired",
      CHANGE_REQUIRED_ME,
      { kind: "redirect", to: PASSWORD_CHANGE_PATH },
    ],
    [
      "forced change allows the change page",
      CHANGE_PAGE,
      "passwordChangeRequired",
      CHANGE_REQUIRED_ME,
      { kind: "render" },
    ],
    [
      "a voluntary change page renders for a session",
      CHANGE_PAGE,
      "authenticated",
      ME,
      { kind: "render" },
    ],
    [
      "an unknown path gets the 404 screen for a session",
      null,
      "authenticated",
      ME,
      { kind: "screen", heading: NOT_FOUND },
    ],
    [
      "an unknown path gets the 404 screen for anonymous",
      null,
      "anonymous",
      null,
      { kind: "screen", heading: NOT_FOUND },
    ],
    [
      "an unknown path during a forced change redirects",
      null,
      "passwordChangeRequired",
      CHANGE_REQUIRED_ME,
      { kind: "redirect", to: PASSWORD_CHANGE_PATH },
    ],
    [
      "boot in progress shows the loading state, not a redirect",
      PROTECTED,
      "unknown",
      null,
      { kind: "loading" },
    ],
    [
      "boot failure shows the unavailable screen, not the login page",
      PROTECTED,
      "error",
      null,
      { kind: "screen", heading: UNAVAILABLE },
    ],
  ])("%s", (_name, access, status, me, outcome) => {
    const onRedirect = renderGuard(access, status, me)
    expectOutcome(outcome, onRedirect)
  })

  it("offers retry on the unavailable screen after a boot error", () => {
    const retryBoot = vi.fn()
    vi.mocked(useAuth).mockReturnValue(authValue("error", null, retryBoot))
    render(
      <RouteGuard access={PROTECTED} onRedirect={vi.fn()}>
        <p>{PAGE_TEXT}</p>
      </RouteGuard>
    )
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }))
    expect(retryBoot).toHaveBeenCalledTimes(1)
  })
})

/** Sessions and states the sidebar and the guard are compared under. */
const CONTEXTS: ReadonlyArray<{
  readonly name: string
  readonly status: AuthStatus
  readonly me: Me | null
}> = [
  {
    name: "SYS_PRINCIPAL without permission keys",
    status: "authenticated",
    me: PRINCIPAL_ME,
  },
  {
    name: "SYS_PRINCIPAL with every permission key",
    status: "authenticated",
    me: PRINCIPAL_ALL_ME,
  },
  {
    name: "SYS_ADMIN without permission keys",
    status: "authenticated",
    me: SYS_ADMIN_ME,
  },
  {
    name: "SYS_ADMIN with the users key",
    status: "authenticated",
    me: { ...SYS_ADMIN_ME, permissions: ["system_users:view"] },
  },
  {
    name: "password change pending",
    status: "passwordChangeRequired",
    me: PASSWORD_PENDING_ME,
  },
  { name: "anonymous", status: "anonymous", me: null },
  { name: "boot in progress", status: "unknown", me: null },
  { name: "boot failed", status: "error", me: null },
]

describe("navigation items and routes share one gate (ARCH-FE-001 D6.3)", () => {
  it("the change-password route takes the access of its navigation item", () => {
    expect(routeAccessFor("/account/password")).toBe(
      navItemAt("/account/password").access
    )
  })

  it("a route whose item needs SYS_PRINCIPAL gives SYS_ADMIN with no permissions the 403 screen, and hides the item", () => {
    const item = navItemAt("/tenants")
    const onRedirect = renderGuard(item.access, "authenticated", SYS_ADMIN_ME)

    // FORBIDDEN is the 403 screen in TODO-006, not a redirect.
    expectOutcome({ kind: "screen", heading: FORBIDDEN }, onRedirect)
    expect(
      isNavItemVisible(item, { status: "authenticated", me: SYS_ADMIN_ME })
    ).toBe(false)
  })

  it("the same route renders for SYS_PRINCIPAL, and its item is shown", () => {
    const item = navItemAt("/tenants")
    const onRedirect = renderGuard(item.access, "authenticated", PRINCIPAL_ME)

    expectOutcome({ kind: "render" }, onRedirect)
    expect(
      isNavItemVisible(item, { status: "authenticated", me: PRINCIPAL_ME })
    ).toBe(true)
  })

  it("every navigation item is shown exactly when the guard renders its route", () => {
    for (const context of CONTEXTS) {
      for (const item of NAV_ITEMS) {
        renderGuard(item.access, context.status, context.me)
        const guardRenders = screen.queryByText(PAGE_TEXT) !== null
        cleanup()

        // While a password change is required, navigation is hidden (D4.6),
        // even though the change page itself renders.
        const expected =
          guardRenders && context.status !== "passwordChangeRequired"
        const shown = isNavItemVisible(item, {
          status: context.status,
          me: context.me,
        })
        expect({ item: item.id, context: context.name, shown }).toEqual({
          item: item.id,
          context: context.name,
          shown: expected,
        })
      }
    }
  })

  it("while a password change is required, the change page renders and no navigation item is shown (D4.6)", () => {
    const onRedirect = renderGuard(
      navItemAt("/account/password").access,
      "passwordChangeRequired",
      PASSWORD_PENDING_ME
    )

    expectOutcome({ kind: "render" }, onRedirect)
    expect(
      visibleNavSections({
        status: "passwordChangeRequired",
        me: PASSWORD_PENDING_ME,
      })
    ).toEqual([])
  })
})
