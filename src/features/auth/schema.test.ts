import { describe, expect, it } from "vitest"

import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "./schema"

describe("loginSchema", () => {
  it("accepts a login ID and a password and trims the login ID", () => {
    const result = loginSchema.safeParse({
      loginId: "  principal@example.com ",
      password: "secret-pass",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.loginId).toBe("principal@example.com")
    }
  })

  it("rejects a blank login ID and a blank password", () => {
    const result = loginSchema.safeParse({ loginId: "   ", password: " " })
    expect(result.success).toBe(false)
    if (result.success) return
    const paths = result.error.issues.map((issue) => issue.path[0])
    expect(paths).toEqual(["loginId", "password"])
  })

  it("has no tenant field", () => {
    const result = loginSchema.safeParse({
      loginId: "principal@example.com",
      password: "secret-pass",
      tenantId: "t-1",
    })
    expect(result.success && "tenantId" in result.data).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("rejects a blank login ID", () => {
    expect(forgotPasswordSchema.safeParse({ loginId: "" }).success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("rejects a confirmation that differs from the new password", () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: "New-Strong-Pass-1",
      newPasswordConfirmation: "New-Strong-Pass-2",
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(["newPasswordConfirmation"])
  })

  it("accepts matching passwords", () => {
    expect(
      resetPasswordSchema.safeParse({
        newPassword: "New-Strong-Pass-1",
        newPasswordConfirmation: "New-Strong-Pass-1",
      }).success
    ).toBe(true)
  })
})

describe("changePasswordSchema", () => {
  const base = {
    currentPassword: "old-pass",
    newPassword: "New-Strong-Pass-1",
    newPasswordConfirmation: "New-Strong-Pass-1",
    keepCurrentSession: true,
  }

  it("accepts matching passwords with a boolean keepCurrentSession", () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true)
    expect(
      changePasswordSchema.safeParse({ ...base, keepCurrentSession: false })
        .success
    ).toBe(true)
  })

  it("rejects a missing current password", () => {
    const result = changePasswordSchema.safeParse({
      ...base,
      currentPassword: "",
    })
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(["currentPassword"])
  })

  it("rejects a confirmation that differs from the new password", () => {
    const result = changePasswordSchema.safeParse({
      ...base,
      newPasswordConfirmation: "other",
    })
    expect(result.success).toBe(false)
  })
})
