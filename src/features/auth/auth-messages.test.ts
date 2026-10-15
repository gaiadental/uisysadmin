import { describe, expect, it } from "vitest"

import { httpError, networkError } from "@/lib/api/errors"

import {
  ACCOUNT_NOT_ACTIVE_MESSAGE,
  ACCOUNT_NOT_READY_MESSAGE,
  CURRENT_PASSWORD_MESSAGE,
  FORGOT_NEUTRAL_MESSAGE,
  GENERIC_FAILURE_MESSAGE,
  LOGIN_CREDENTIALS_MESSAGE,
  classifyChangePasswordError,
  classifyForgotError,
  classifyLoginError,
  classifyResetError,
  genericFailure,
  noticeText,
  PASSWORD_CHANGED_MESSAGE,
} from "./auth-messages"

const REF = "3f9c0a1b-0000-4000-8000-000000000001"

describe("classifyLoginError (D4.5)", () => {
  it("gives the same credentials outcome whatever the server message says", () => {
    const wrongPassword = classifyLoginError(
      httpError(
        401,
        { code: "INVALID_CREDENTIALS", message: "Invalid credentials." },
        REF
      )
    )
    const unknownUser = classifyLoginError(
      httpError(
        401,
        { code: "INVALID_CREDENTIALS", message: "User not found." },
        REF
      )
    )
    expect(wrongPassword).toEqual({ kind: "credentials" })
    expect(unknownUser).toEqual({ kind: "credentials" })
    expect(LOGIN_CREDENTIALS_MESSAGE).toBe("Login ID atau password salah")
  })

  it("starts the lock for both rate-limit codes", () => {
    for (const code of ["TOO_MANY_ATTEMPTS", "RATE_LIMIT_EXCEEDED"]) {
      expect(
        classifyLoginError(httpError(429, { code, message: "x" }, null))
      ).toEqual({
        kind: "rateLimited",
      })
    }
  })

  it("shows fixed copy with the reference id for ACCOUNT_NOT_ACTIVE, never the server message (REQ-FE-055)", () => {
    expect(
      classifyLoginError(
        httpError(
          403,
          { code: "ACCOUNT_NOT_ACTIVE", message: "Account is not active." },
          REF
        )
      )
    ).toEqual({
      kind: "notice",
      message: "Akun Anda tidak aktif. Hubungi administrator.",
      referenceId: REF,
    })
    expect(ACCOUNT_NOT_ACTIVE_MESSAGE).toBe(
      "Akun Anda tidak aktif. Hubungi administrator."
    )
  })

  it("shows fixed copy with the reference id for ACCOUNT_NOT_READY, never the server message (REQ-FE-055)", () => {
    expect(
      classifyLoginError(
        httpError(
          403,
          { code: "ACCOUNT_NOT_READY", message: "Account is not ready." },
          REF
        )
      )
    ).toEqual({
      kind: "notice",
      message: "Akun Anda belum siap digunakan. Hubungi administrator.",
      referenceId: REF,
    })
    expect(ACCOUNT_NOT_READY_MESSAGE).toBe(
      "Akun Anda belum siap digunakan. Hubungi administrator."
    )
  })

  it("shows the server message for a validation failure (D4.5)", () => {
    expect(
      classifyLoginError(
        httpError(
          400,
          { code: "VALIDATION_FAILED", message: "loginId: must not be blank" },
          null
        )
      )
    ).toEqual({
      kind: "notice",
      message: "loginId: must not be blank",
      referenceId: null,
    })
  })

  it("shows generic copy and the reference id for an unmapped server error", () => {
    expect(
      classifyLoginError(
        httpError(
          500,
          { code: "INTERNAL_SERVER_ERROR", message: "stack trace" },
          REF
        )
      )
    ).toEqual({
      kind: "notice",
      message: GENERIC_FAILURE_MESSAGE,
      referenceId: REF,
    })
  })

  it("shows the client copy for a network failure", () => {
    const outcome = classifyLoginError(networkError(null))
    expect(outcome.kind).toBe("notice")
    if (outcome.kind !== "notice") return
    expect(outcome.message).toBe(
      "Tidak dapat terhubung ke server. Periksa koneksi, lalu coba lagi."
    )
  })
})

describe("classifyForgotError (D4.7)", () => {
  it("shows a validation error as a validation outcome", () => {
    expect(
      classifyForgotError(
        httpError(
          400,
          { code: "VALIDATION_ERROR", message: "loginId: bad" },
          REF
        )
      )
    ).toEqual({ kind: "validation", message: "loginId: bad", referenceId: REF })
  })

  it("answers every other outcome with the neutral text", () => {
    expect(
      classifyForgotError(
        httpError(500, { code: "INTERNAL_SERVER_ERROR", message: "x" }, REF)
      )
    ).toEqual({
      kind: "neutral",
    })
    expect(
      classifyForgotError(
        httpError(404, { code: "RESOURCE_NOT_FOUND", message: "x" }, null)
      )
    ).toEqual({
      kind: "neutral",
    })
    expect(classifyForgotError(networkError(null))).toEqual({ kind: "neutral" })
    expect(FORGOT_NEUTRAL_MESSAGE).toBe(
      "Jika akun terdaftar, link reset sudah dikirim ke e-mail."
    )
  })
})

describe("classifyResetError (D4.7)", () => {
  it("maps an invalid token, a policy failure and a validation failure", () => {
    expect(
      classifyResetError(
        httpError(400, { code: "INVALID_TOKEN", message: "x" }, REF)
      )
    ).toEqual({
      kind: "invalidToken",
      referenceId: REF,
    })
    expect(
      classifyResetError(
        httpError(
          400,
          { code: "PASSWORD_POLICY_VIOLATION", message: "Too short." },
          null
        )
      )
    ).toEqual({ kind: "policy", message: "Too short." })
    expect(
      classifyResetError(
        httpError(
          400,
          { code: "VALIDATION_FAILED", message: "newPassword: blank" },
          null
        )
      )
    ).toEqual({
      kind: "notice",
      message: "newPassword: blank",
      referenceId: null,
    })
  })
})

describe("classifyChangePasswordError (D4.6)", () => {
  it("places a wrong current password under its field", () => {
    expect(
      classifyChangePasswordError(
        httpError(
          401,
          { code: "INVALID_CREDENTIALS", message: "Invalid credentials." },
          null
        )
      )
    ).toEqual({ kind: "currentPassword", message: CURRENT_PASSWORD_MESSAGE })
    expect(CURRENT_PASSWORD_MESSAGE).toBe("Current password is incorrect.")
  })

  it("places a policy failure under the new password field", () => {
    expect(
      classifyChangePasswordError(
        httpError(
          400,
          { code: "PASSWORD_POLICY_VIOLATION", message: "Reused." },
          null
        )
      )
    ).toEqual({ kind: "newPassword", message: "Reused." })
  })

  it("does not treat another 401 as a wrong current password", () => {
    const outcome = classifyChangePasswordError(
      httpError(401, { code: "UNAUTHORIZED", message: "x" }, REF)
    )
    expect(outcome).toEqual({
      kind: "notice",
      message: GENERIC_FAILURE_MESSAGE,
      referenceId: REF,
    })
  })
})

describe("genericFailure and notice copy", () => {
  it("never shows the server text of an HTTP error", () => {
    expect(
      genericFailure(
        httpError(500, { code: "X", message: "db password leaked" }, REF)
      ).message
    ).toBe(GENERIC_FAILURE_MESSAGE)
  })

  it("names the one-time notices as the architecture quotes them", () => {
    expect(noticeText("passwordChanged")).toBe(PASSWORD_CHANGED_MESSAGE)
    expect(PASSWORD_CHANGED_MESSAGE).toBe(
      "Password changed, please log in again"
    )
    expect(noticeText("passwordReset")).toBe(
      "Password berhasil diatur ulang. Silakan masuk."
    )
  })

  it("gives the account notices the same fixed copy as the login error", () => {
    expect(noticeText("accountNotActive")).toBe(ACCOUNT_NOT_ACTIVE_MESSAGE)
    expect(noticeText("accountNotReady")).toBe(ACCOUNT_NOT_READY_MESSAGE)
    expect(noticeText("accountNotActive")).toBe(
      "Akun Anda tidak aktif. Hubungi administrator."
    )
    expect(noticeText("accountNotReady")).toBe(
      "Akun Anda belum siap digunakan. Hubungi administrator."
    )
  })
})
