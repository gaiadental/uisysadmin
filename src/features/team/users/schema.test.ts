import { describe, expect, it } from "vitest"

import { userCreateSchema, userRoleChangeSchema } from "./schema"

function messageFor(
  schema: typeof userCreateSchema,
  value: Record<string, unknown>,
  field: string
): string | null {
  const result = schema.safeParse(value)
  if (result.success) return null
  return (
    result.error.issues.find((issue) => issue.path[0] === field)?.message ??
    null
  )
}

describe("userCreateSchema (FE doc 5.1)", () => {
  it("accepts an e-mail and a role, trims the login, and outputs a numeric role id", () => {
    const result = userCreateSchema.safeParse({
      loginId: "  ops@gaia.com  ",
      systemRoleId: "2",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ loginId: "ops@gaia.com", systemRoleId: 2 })
    }
  })

  it.each(["", "   "])("requires a login ID (%j)", (loginId) => {
    expect(
      messageFor(userCreateSchema, { loginId, systemRoleId: "1" }, "loginId")
    ).toBe("Login ID wajib diisi.")
  })

  it.each(["ops", "ops@", "@gaia.com", "ops@gaia", "a b@gaia.com"])(
    "rejects %j as not an e-mail",
    (loginId) => {
      expect(
        messageFor(userCreateSchema, { loginId, systemRoleId: "1" }, "loginId")
      ).toBe("Login ID harus berupa alamat e-mail.")
    }
  )

  it.each(["", "abc", "-1", "1.5"])("requires a role (%j)", (systemRoleId) => {
    expect(
      messageFor(
        userCreateSchema,
        { loginId: "a@b.co", systemRoleId },
        "systemRoleId"
      )
    ).toBe("Peran wajib dipilih.")
  })
})

describe("userRoleChangeSchema", () => {
  it("outputs the numeric role id", () => {
    expect(userRoleChangeSchema.parse({ systemRoleId: "3" })).toEqual({
      systemRoleId: 3,
    })
  })

  it("requires a role", () => {
    expect(userRoleChangeSchema.safeParse({ systemRoleId: "" }).success).toBe(
      false
    )
  })
})
