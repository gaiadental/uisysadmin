import type { QueryKey } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import { createQueryClient } from "./client"
import {
  applyInvalidation,
  planInvalidation,
  type MutationEvent,
} from "./invalidation"

/**
 * Each row is one line of the D12.1 table. The expected keys are written out
 * here, not read from keys.ts, so a wrong key in keys.ts fails this test.
 */
const D12_1_ROWS: ReadonlyArray<{
  readonly name: string
  readonly event: MutationEvent
  readonly keys: ReadonlyArray<QueryKey>
}> = [
  { name: "login", event: { kind: "login" }, keys: [["auth", "me"]] },
  {
    name: "change password with keepCurrentSession true",
    event: { kind: "changePassword", keepCurrentSession: true },
    keys: [["auth", "me"]],
  },
  {
    name: "revoke own sessions",
    event: { kind: "revokeOwnSessions" },
    keys: [["sessions", "own"]],
  },
  {
    name: "tenant create",
    event: { kind: "tenantCreate" },
    keys: [["master", "tenants"]],
  },
  {
    name: "tenant patch",
    event: { kind: "tenantPatch", tenantId: "t1" },
    keys: [
      ["master", "tenant", "t1"],
      ["master", "tenants"],
    ],
  },
  {
    name: "admin-account retry",
    event: { kind: "adminAccountRetry", tenantId: "t1" },
    keys: [["master", "tenant", "t1"]],
  },
  {
    name: "tenant category create, update or delete",
    event: { kind: "tenantCategoryWrite" },
    keys: [
      ["master", "tenantCategories"],
      ["ref", "tenantCategories"],
      ["master", "tenants"],
    ],
  },
  {
    name: "country create, update or delete",
    event: { kind: "countryWrite" },
    keys: [
      ["master", "countries"],
      ["ref", "countries"],
      ["master", "tenants"],
    ],
  },
  {
    name: "system user write with a known user",
    event: { kind: "systemUserWrite", userId: "u1" },
    keys: [
      ["system", "users"],
      ["system", "user", "u1"],
    ],
  },
  {
    name: "system user create without an id",
    event: { kind: "systemUserWrite" },
    keys: [["system", "users"]],
  },
  {
    name: "force logout (admin)",
    event: { kind: "forceLogout", userId: "u1" },
    keys: [["admin", "sessions", "u1"]],
  },
  {
    name: "system role write with a known role",
    event: { kind: "systemRoleWrite", roleId: 3 },
    keys: [
      ["system", "roles"],
      ["system", "users"],
      ["system", "role", 3],
    ],
  },
  {
    name: "system role create without an id",
    event: { kind: "systemRoleWrite" },
    keys: [
      ["system", "roles"],
      ["system", "users"],
    ],
  },
  {
    name: "role permissions replace",
    event: { kind: "rolePermissionsReplace", roleId: 3 },
    keys: [
      ["system", "rolePermissions", 3],
      ["system", "role", 3],
    ],
  },
  {
    name: "master permission create, update or delete",
    event: { kind: "masterPermissionWrite" },
    keys: [
      ["system", "masterPermissions"],
      ["system", "tenantPermissions"],
      ["system", "rolePermissions"],
    ],
  },
  {
    name: "tenant permissions replace or toggle",
    event: { kind: "tenantPermissionsWrite", tenantId: "t1" },
    keys: [["system", "tenantPermissions", "t1"]],
  },
]

/** Keys seeded in the cache. They cover every family, with other ids as controls. */
const SEEDED_KEYS: ReadonlyArray<QueryKey> = [
  ["auth", "me"],
  ["sessions", "own"],
  ["admin", "sessions", "u1"],
  ["admin", "sessions", "u2"],
  ["master", "tenants", { page: 1 }],
  ["master", "tenant", "t1"],
  ["master", "tenant", "t2"],
  ["ref", "tenantCategories"],
  ["master", "tenantCategories", {}],
  ["ref", "countries"],
  ["master", "countries", {}],
  ["system", "users", {}],
  ["system", "user", "u1"],
  ["system", "user", "u2"],
  ["system", "roles"],
  ["system", "role", 3],
  ["system", "role", 4],
  ["system", "rolePermissions", 3],
  ["system", "rolePermissions", 4],
  ["system", "masterPermissions"],
  ["system", "tenantPermissions", "t1"],
  ["system", "tenantPermissions", "t2"],
]

function startsWith(key: QueryKey, prefix: QueryKey): boolean {
  return prefix.every((part, index) => Object.is(key[index], part))
}

describe("invalidation plan (D12.1)", () => {
  it.each(D12_1_ROWS)(
    "invalidates the D12.1 keys for $name",
    ({ event, keys }) => {
      expect(planInvalidation(event)).toEqual({ clearAll: false, keys })
    }
  )

  it("clears the whole cache on logout (D12.2)", () => {
    expect(planInvalidation({ kind: "logout" })).toEqual({
      clearAll: true,
      keys: [],
    })
  })

  it("clears the whole cache when a password change ends every session (D4.6)", () => {
    expect(
      planInvalidation({ kind: "changePassword", keepCurrentSession: false })
    ).toEqual({ clearAll: true, keys: [] })
  })
})

describe("invalidation against a real cache (D12.1)", () => {
  it.each(D12_1_ROWS)(
    "marks only the matching queries stale for $name",
    async ({ event, keys }) => {
      const queryClient = createQueryClient()
      for (const key of SEEDED_KEYS)
        queryClient.setQueryData(key, { seeded: true })

      await applyInvalidation(queryClient, event)

      for (const key of SEEDED_KEYS) {
        const expected = keys.some((prefix) => startsWith(key, prefix))
        const isInvalidated = queryClient.getQueryState(key)?.isInvalidated
        expect(isInvalidated, JSON.stringify(key)).toBe(expected)
      }
    }
  )

  it("empties the cache on logout", async () => {
    const queryClient = createQueryClient()
    for (const key of SEEDED_KEYS)
      queryClient.setQueryData(key, { seeded: true })

    await applyInvalidation(queryClient, { kind: "logout" })

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})
