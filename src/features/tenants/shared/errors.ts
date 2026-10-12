/**
 * Error classification for the master-data and auth-service write forms
 * (ARCH-FE-001 D9, D13). master-data answers a 400 with `VALIDATION_ERROR`
 * and auth-service with `VALIDATION_FAILED` (amendment 2026-10-12). Both are
 * form validation errors and show as one form-level alert. The check uses the
 * status and the code, never the message text (D13).
 *
 * `errors.ts` in the API layer has no such helper yet, so this is the single
 * place for tenant screens until that file takes it over.
 */

import { ApiError } from "@/lib/api/errors"

export const VALIDATION_ERROR_CODES: ReadonlySet<string> = new Set([
  "VALIDATION_ERROR",
  "VALIDATION_FAILED",
])

/** True for an HTTP 400 that carries one of the two validation codes. */
export function isFormValidationError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.kind === "HTTP" &&
    error.status === 400 &&
    VALIDATION_ERROR_CODES.has(error.code)
  )
}
