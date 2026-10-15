/**
 * Copy for a failed system role write (ARCH-FE-001 D6.6, D13). Branching uses
 * the HTTP status and the code, never the message text.
 *
 * A refusal with PLATFORM_ROLE_PROTECTED or ROLE_GUARD_VIOLATION marks the
 * role as refused (see `refused-roles.ts`). Both 403 codes and the other guard
 * codes show fixed copy (`guard-failure.ts`, D13.1); the server message is
 * never shown. The BE refuses nothing today (SP-BG-13).
 */

import { ApiError } from "@/lib/api/errors"
import {
  describeWriteFailure,
  type WriteFailure,
} from "@/features/tenants/create/write-failure"
import { describeGuardFailure } from "../shared/guard-failure"

export const ROLE_NOT_FOUND_MESSAGE = "Peran tidak ditemukan."
const REFUSAL_CODES: readonly string[] = [
  "PLATFORM_ROLE_PROTECTED",
  "ROLE_GUARD_VIOLATION",
]

function isHttp(error: unknown): error is ApiError {
  return error instanceof ApiError && error.kind === "HTTP"
}

/** True for a protected-role refusal (any status; the code decides). */
export function isRoleRefusal(error: unknown): error is ApiError {
  return isHttp(error) && REFUSAL_CODES.includes(error.code)
}

/** 409 SYSTEM_ROLE_KEY_EXISTS: the role key is taken. */
export function isRoleKeyExists(error: unknown): error is ApiError {
  return isHttp(error) && error.status === 409 && error.code === "SYSTEM_ROLE_KEY_EXISTS"
}

export function describeRoleWriteFailure(error: unknown): WriteFailure {
  const guard = describeGuardFailure(error, "role")
  if (guard !== null) return guard
  if (isHttp(error) && error.status === 404 && error.code === "SYSTEM_ROLE_NOT_FOUND") {
    return { message: ROLE_NOT_FOUND_MESSAGE, referenceId: error.correlationId }
  }
  return describeWriteFailure(error)
}
