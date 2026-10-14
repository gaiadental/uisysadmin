/**
 * Copy for a failed system user write (ARCH-FE-001 D13). Branching uses the
 * HTTP status and the code, never the message text. The two codes below carry
 * frontend copy; guard refusals and unrecognised 409/503 use fixed copy
 * (D13.1); every other failure goes through the shared write helper.
 */

import { ApiError } from "@/lib/api/errors"
import {
  describeWriteFailure,
  type WriteFailure,
} from "@/features/tenants/create/write-failure"
import { describeGuardFailure } from "../shared/guard-failure"

export const ROLE_NOT_FOUND_MESSAGE =
  "Peran yang dipilih tidak ditemukan. Muat ulang halaman, lalu pilih peran lagi."
export const USER_NOT_FOUND_MESSAGE = "Akun tidak ditemukan."

function isHttp(
  error: unknown,
  status: number,
  code: string
): error is ApiError {
  return (
    error instanceof ApiError &&
    error.kind === "HTTP" &&
    error.status === status &&
    error.code === code
  )
}

/** 409 SYSTEM_USER_LOGIN_EXISTS: the login ID is taken. */
export function isLoginExists(error: unknown): error is ApiError {
  return isHttp(error, 409, "SYSTEM_USER_LOGIN_EXISTS")
}

export function describeUserWriteFailure(error: unknown): WriteFailure {
  if (isHttp(error, 400, "SYSTEM_ROLE_NOT_FOUND")) {
    return { message: ROLE_NOT_FOUND_MESSAGE, referenceId: error.correlationId }
  }
  if (isHttp(error, 404, "SYSTEM_USER_NOT_FOUND")) {
    return { message: USER_NOT_FOUND_MESSAGE, referenceId: error.correlationId }
  }
  return describeGuardFailure(error, "account") ?? describeWriteFailure(error)
}
