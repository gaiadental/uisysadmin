/**
 * Copy for a failed write on the tenant screens (ARCH-FE-001 D8.2, D13).
 * Branching uses the HTTP status, the code and the error kind, never the
 * message text. The server message is shown for the cases where it states the
 * rule or what did not change: validation (400), conflict (409) and
 * unavailable (503). Anything else gets a generic line and the reference id.
 */

import { ApiError } from "@/lib/api/errors"

import { FORBIDDEN_MESSAGE } from "../shared/failure"
import { isFormValidationError } from "../shared/errors"

export const GENERIC_WRITE_MESSAGE = "Permintaan gagal. Coba lagi."

export interface WriteFailure {
  readonly message: string
  readonly referenceId: string | null
}

/** True for a 409 conflict. On tenant create it is the duplicate code. */
export function isConflict(error: unknown): error is ApiError {
  return (
    error instanceof ApiError && error.kind === "HTTP" && error.status === 409
  )
}

export function describeWriteFailure(error: unknown): WriteFailure {
  if (!(error instanceof ApiError)) {
    return { message: GENERIC_WRITE_MESSAGE, referenceId: null }
  }
  const referenceId = error.correlationId
  // Client kinds carry copy written by the frontend.
  if (error.kind !== "HTTP") return { message: error.message, referenceId }
  if (error.status === 403) return { message: FORBIDDEN_MESSAGE, referenceId }
  if (error.status === 409 || error.status === 503) {
    return { message: error.message, referenceId }
  }
  if (isFormValidationError(error))
    return { message: error.message, referenceId }
  return { message: GENERIC_WRITE_MESSAGE, referenceId }
}
