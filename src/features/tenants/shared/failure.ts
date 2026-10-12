/**
 * Copy for a failed read on the tenant screens (ARCH-FE-001 D13). Branching
 * uses the HTTP status and the error kind, never the message text. Copy is
 * Indonesian (C-09) and a proposed default until FE-OQ-22 is answered.
 */

import { ApiError } from "@/lib/api/errors"

export const FORBIDDEN_MESSAGE = "Anda tidak punya akses untuk aksi ini."
export const BAD_GATEWAY_MESSAGE = "Layanan sedang bermasalah, coba lagi."
export const GENERIC_READ_MESSAGE = "Data tidak dapat dimuat. Coba lagi."

/** The message to show, and the reference id to quote when there is one. */
export interface ReadFailure {
  readonly message: string
  readonly referenceId: string | null
}

export function describeReadFailure(error: unknown): ReadFailure {
  if (!(error instanceof ApiError)) {
    return { message: GENERIC_READ_MESSAGE, referenceId: null }
  }
  const referenceId = error.correlationId
  // Client kinds carry copy written by the frontend, so it is shown as is.
  if (error.kind !== "HTTP") return { message: error.message, referenceId }
  if (error.status === 403) return { message: FORBIDDEN_MESSAGE, referenceId }
  // 503 SERVICE_UNAVAILABLE states what did not change, so the server message is shown (D13).
  if (error.status === 503) return { message: error.message, referenceId }
  if (error.status === 502) {
    return { message: BAD_GATEWAY_MESSAGE, referenceId }
  }
  return { message: GENERIC_READ_MESSAGE, referenceId }
}
