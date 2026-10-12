import { describe, expect, it } from "vitest"

import type { GateContext } from "@/lib/access/gates"
import { SYS_PRINCIPAL } from "@/lib/access/roles"
import type { Me } from "@/types/auth"

import {
  NAV_ITEMS,
  breadcrumbFor,
  findNavItem,
  hasVisibleModule,
  navItemAt,
  visibleNavSections,
  type NavItemId,
} from "./navigation"

const BASE_ME: Me = {
  userId: "usr-001",
  loginId: "operator@example.com",
  userType: "SYSTEM",
  context: "SYSTEM",
  role: SYS_PRINCIPAL,
  permissions: [],
  tenant: null,
  branches: [],
  pwdChangeRequired: false,
}

function signedIn(overrides: Partial<Me>): GateContext {
  return { status: "authenticated", me: { ...BASE_ME, ...overrides } }
}

function visibleIds(context: GateContext): NavItemId[] {
  return visibleNavSections(context).flatMap((section) =>
    section.items.map((item) => item.id)
  )
}

const ALL_PERMISSIONS = [
  "master_permissions:view",
  "system_users:view",
  "system_roles:view",
]

describe("navigation gating (ARCH-FE-001 D6.2, D6.3)", () => {
  it("shows the master-data items to SYS_PRINCIPAL", () => {
    const ids = visibleIds(signedIn({ role: SYS_PRINCIPAL, permissions: [] }))

    expect(ids).toContain("tenant.list")
    expect(ids).toContain("tenant.create")
    expect(ids).toContain("catalog.kategori")
    expect(ids).toContain("catalog.negara")
    expect(ids).toContain("account.sessions")
    expect(ids).toContain("account.password")
  })

  it("hides the permission-gated items from SYS_PRINCIPAL without those keys", () => {
    const ids = visibleIds(signedIn({ role: SYS_PRINCIPAL, permissions: [] }))

    expect(ids).not.toContain("catalog.permission")
    expect(ids).not.toContain("team.akun")
    expect(ids).not.toContain("team.peran")
  })

  it("shows only own-account items to SYS_ADMIN with no permissions (D6.2)", () => {
    const context = signedIn({ role: "SYS_ADMIN", permissions: [] })

    expect(visibleIds(context)).toEqual([
      "account.sessions",
      "account.password",
    ])
    expect(hasVisibleModule(context)).toBe(false)
  })

  it("shows a permission-gated item only when its key is held", () => {
    const context = signedIn({
      role: "SYS_ADMIN",
      permissions: ["system_users:view"],
    })
    const ids = visibleIds(context)

    expect(ids).toContain("team.akun")
    expect(ids).not.toContain("team.peran")
    expect(hasVisibleModule(context)).toBe(true)
  })

  it("shows every permission-gated item when all keys are held", () => {
    const ids = visibleIds(
      signedIn({ role: "SYS_ADMIN", permissions: ALL_PERMISSIONS })
    )

    expect(ids).toContain("catalog.permission")
    expect(ids).toContain("team.akun")
    expect(ids).toContain("team.peran")
  })

  it("hides every item while a password change is required (D4.6)", () => {
    // The auth provider sets this status from `me.pwdChangeRequired`.
    const context: GateContext = {
      status: "passwordChangeRequired",
      me: {
        ...BASE_ME,
        role: SYS_PRINCIPAL,
        permissions: ALL_PERMISSIONS,
        pwdChangeRequired: true,
      },
    }

    expect(visibleIds(context)).toEqual([])
  })

  it("shows nothing without a session", () => {
    const context: GateContext = { status: "anonymous", me: null }

    expect(visibleIds(context)).toEqual([])
    expect(hasVisibleModule(context)).toBe(false)
  })
})

describe("navigation config shape", () => {
  it("gives every item a unique id and an absolute path", () => {
    const ids = NAV_ITEMS.map((item) => item.id)
    const paths = NAV_ITEMS.map((item) => item.path)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(paths).size).toBe(paths.length)
    for (const path of paths) expect(path.startsWith("/")).toBe(true)
  })

  it("finds the item that covers an app path", () => {
    expect(findNavItem("/tenants/new")?.id).toBe("tenant.create")
    expect(findNavItem("/tenants/9f2c")?.id).toBe("tenant.list")
    expect(findNavItem("/system-users/123")?.id).toBe("team.akun")
    expect(findNavItem("/tenantsx")).toBeNull()
    expect(findNavItem("/login")).toBeNull()
  })

  it("looks up an item by its exact path and refuses a path with no item", () => {
    expect(navItemAt("/tenants").id).toBe("tenant.list")
    expect(() => navItemAt("/tenants/new/extra")).toThrow(
      "No navigation item at /tenants/new/extra."
    )
  })

  it("uses routes-meta for the change-password breadcrumb and the item label otherwise", () => {
    expect(breadcrumbFor("/account/password")).toEqual([
      "Akun",
      "Ubah password",
    ])
    expect(breadcrumbFor("/system-users")).toEqual(["Tim IT", "Akun"])
    expect(breadcrumbFor("/login")).toBeNull()
  })
})
