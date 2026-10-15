/**
 * Copy and error classification for the auth screens (ARCH-FE-001 D4.5 to
 * D4.7, D13; FE doc 3.3). Pure functions: the pages call them and show the
 * result. Branching uses the HTTP status and the error code, never the message
 * text (D13).
 *
 * Copy quoted from the architecture or the FE doc is used as written. Other
 * copy is a proposed default until FE-OQ-22 is answered.
 */

import { ApiError } from "@/lib/api/errors"

import type { AuthNotice } from "./auth-notice"

export const LOGIN_CREDENTIALS_MESSAGE = "Login ID atau password salah"
export const LOGIN_RATE_LIMIT_MESSAGE =
  "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi."
export const LOGIN_LOCK_SECONDS = 60
export const ACCOUNT_NOT_ACTIVE_MESSAGE =
  "Akun Anda tidak aktif. Hubungi administrator."
export const ACCOUNT_NOT_READY_MESSAGE =
  "Akun Anda belum siap digunakan. Hubungi administrator."

export const FORGOT_NEUTRAL_MESSAGE =
  "Jika akun terdaftar, link reset sudah dikirim ke e-mail."
export const RESET_INVALID_LINK_MESSAGE = "Link tidak valid atau kedaluwarsa"
export const CURRENT_PASSWORD_MESSAGE = "Current password is incorrect."
export const PASSWORD_CHANGED_MESSAGE = "Password changed, please log in again"
export const RESET_SUCCESS_MESSAGE =
  "Password berhasil diatur ulang. Silakan masuk."
export const GENERIC_FAILURE_MESSAGE = "Permintaan gagal. Coba lagi."

const VALIDATION_CODES: ReadonlySet<string> = new Set([
  "VALIDATION_ERROR",
  "VALIDATION_FAILED",
])
const INVALID_CREDENTIALS_CODES: ReadonlySet<string> = new Set([
  "INVALID_CREDENTIALS",
])
const INVALID_TOKEN_CODES: ReadonlySet<string> = new Set(["INVALID_TOKEN"])
const POLICY_CODES: ReadonlySet<string> = new Set(["PASSWORD_POLICY_VIOLATION"])
const RATE_LIMIT_CODES: ReadonlySet<string> = new Set([
  "TOO_MANY_ATTEMPTS",
  "RATE_LIMIT_EXCEEDED",
])
const ACCOUNT_CODES: ReadonlySet<string> = new Set([
  "ACCOUNT_NOT_ACTIVE",
  "ACCOUNT_NOT_READY",
])

/** A message to show in a form alert, with the reference id when there is one (D13). */
export interface FailureNotice {
  readonly message: string
  readonly referenceId: string | null
}

export type LoginFailure =
  | { readonly kind: "credentials" }
  | { readonly kind: "rateLimited" }
  | ({ readonly kind: "notice" } & FailureNotice)

export type ForgotFailure =
  | ({ readonly kind: "validation" } & FailureNotice)
  | { readonly kind: "neutral" }

export type ResetFailure =
  | { readonly kind: "invalidToken"; readonly referenceId: string | null }
  | { readonly kind: "policy"; readonly message: string }
  | ({ readonly kind: "notice" } & FailureNotice)

export type ChangePasswordFailure =
  | { readonly kind: "currentPassword"; readonly message: string }
  | { readonly kind: "newPassword"; readonly message: string }
  | ({ readonly kind: "notice" } & FailureNotice)

/** True when the error is an HTTP error with one of the given status and codes. */
function isHttpError(
  error: unknown,
  status: number,
  codes: ReadonlySet<string>
): error is ApiError {
  return (
    error instanceof ApiError &&
    error.kind === "HTTP" &&
    error.status === status &&
    codes.has(error.code)
  )
}

/**
 * The notice for a failure with no specific mapping. Client kinds (network,
 * timeout, non-JSON, contract) carry frontend copy, so it is shown. An HTTP
 * error shows the generic copy, so no server text leaks into the page.
 */
export function genericFailure(error: unknown): FailureNotice {
  if (error instanceof ApiError && error.kind !== "HTTP") {
    return { message: error.message, referenceId: error.correlationId }
  }
  const referenceId = error instanceof ApiError ? error.correlationId : null
  return { message: GENERIC_FAILURE_MESSAGE, referenceId }
}

/** The text of a one-time notice on the login page. */
export function noticeText(notice: AuthNotice): string {
  switch (notice) {
    case "passwordChanged":
      return PASSWORD_CHANGED_MESSAGE
    case "passwordReset":
      return RESET_SUCCESS_MESSAGE
    case "accountNotActive":
      return ACCOUNT_NOT_ACTIVE_MESSAGE
    case "accountNotReady":
      return ACCOUNT_NOT_READY_MESSAGE
  }
}

/** Fixed copy for an account-state code. The server message is never shown (REQ-FE-055). */
function accountMessage(code: string): string {
  return code === "ACCOUNT_NOT_READY"
    ? ACCOUNT_NOT_READY_MESSAGE
    : ACCOUNT_NOT_ACTIVE_MESSAGE
}

/**
 * Login (D4.5). INVALID_CREDENTIALS gives one text for an unknown user and a
 * wrong password. A 429 starts the 60-second lock. Account states show fixed
 * copy with the reference id. Validation shows the server message.
 */
export function classifyLoginError(error: unknown): LoginFailure {
  if (isHttpError(error, 401, INVALID_CREDENTIALS_CODES)) {
    return { kind: "credentials" }
  }
  if (isHttpError(error, 429, RATE_LIMIT_CODES)) {
    return { kind: "rateLimited" }
  }
  if (isHttpError(error, 403, ACCOUNT_CODES)) {
    return {
      kind: "notice",
      message: accountMessage(error.code),
      referenceId: error.correlationId,
    }
  }
  if (isHttpError(error, 400, VALIDATION_CODES)) {
    return {
      kind: "notice",
      message: error.message,
      referenceId: error.correlationId,
    }
  }
  return { kind: "notice", ...genericFailure(error) }
}

/**
 * Forgot password (D4.7). Only a validation error is shown as such. Every
 * other outcome, network failures included, gets the same neutral text, so the
 * page never reveals whether the account exists.
 */
export function classifyForgotError(error: unknown): ForgotFailure {
  if (isHttpError(error, 400, VALIDATION_CODES)) {
    return {
      kind: "validation",
      message: error.message,
      referenceId: error.correlationId,
    }
  }
  return { kind: "neutral" }
}

/** Reset password (D4.7). An invalid token and a policy failure have their own placement. */
export function classifyResetError(error: unknown): ResetFailure {
  if (isHttpError(error, 400, INVALID_TOKEN_CODES)) {
    return { kind: "invalidToken", referenceId: error.correlationId }
  }
  if (isHttpError(error, 400, POLICY_CODES)) {
    return { kind: "policy", message: error.message }
  }
  if (isHttpError(error, 400, VALIDATION_CODES)) {
    return {
      kind: "notice",
      message: error.message,
      referenceId: error.correlationId,
    }
  }
  return { kind: "notice", ...genericFailure(error) }
}

/**
 * Change password (D4.6). A wrong current password is shown under that field,
 * a policy failure under the new password. A 401 here never refreshes (D4.4),
 * so it reaches this function as an ApiError.
 */
export function classifyChangePasswordError(
  error: unknown
): ChangePasswordFailure {
  if (isHttpError(error, 401, INVALID_CREDENTIALS_CODES)) {
    return { kind: "currentPassword", message: CURRENT_PASSWORD_MESSAGE }
  }
  if (isHttpError(error, 400, POLICY_CODES)) {
    return { kind: "newPassword", message: error.message }
  }
  if (isHttpError(error, 400, VALIDATION_CODES)) {
    return {
      kind: "notice",
      message: error.message,
      referenceId: error.correlationId,
    }
  }
  return { kind: "notice", ...genericFailure(error) }
}
