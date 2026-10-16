import { describe, expect, it } from "vitest"

import { MasterPermissionSchema } from "./master-permission"

const BASE = {
  id: 1,
  key: "system_users:view",
  name: "View system users",
  description: null,
  category: "system_users",
  module: "auth",
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
}

describe("MasterPermissionSchema scope (REQ-FE-057)", () => {
  it.each(["PLATFORM", "TENANT"] as const)("accepts scope %s", (scope) => {
    const parsed = MasterPermissionSchema.parse({ ...BASE, scope })
    expect(parsed.scope).toBe(scope)
  })

  it("rejects a response without scope", () => {
    expect(MasterPermissionSchema.safeParse(BASE).success).toBe(false)
  })

  it.each(["platform", "SYSTEM", "", null, 1])(
    "rejects scope %j",
    (scope) => {
      expect(
        MasterPermissionSchema.safeParse({ ...BASE, scope }).success
      ).toBe(false)
    }
  )
})
