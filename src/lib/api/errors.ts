/**
 * Error model for the SP web HTTP pipeline (ARCH-FE-001 D3.2, D13).
 *
 * Every failure is an ApiError. For a server error, `code` and `message` come
 * from the response body. For a client-side failure, `code` is the kind.
 * Components branch on `code` and `status`, never on the message text.
 */

export type ApiErrorKind =
  "HTTP" | "NETWORK" | "TIMEOUT" | "NON_JSON" | "CONTRACT"

export interface ApiErrorInit {
  readonly code: string
  readonly message: string
  readonly status: number | null
  readonly kind: ApiErrorKind
  readonly correlationId: string | null
}

export class ApiError extends Error {
  readonly code: string
  readonly status: number | null
  readonly kind: ApiErrorKind
  readonly correlationId: string | null

  constructor(init: ApiErrorInit) {
    super(init.message)
    this.name = "ApiError"
    this.code = init.code
    this.status = init.status
    this.kind = init.kind
    this.correlationId = init.correlationId
  }
}

// Used when a server error body has no usable `code`. It equals the client
// kind, so it is never a server code and is never derived from message text.
const HTTP_CODE = "HTTP"
const HTTP_FALLBACK_MESSAGE = "Permintaan gagal. Coba lagi."

/** Maps a non-2xx response whose body parsed as JSON (kind HTTP). */
export function httpError(
  status: number,
  body: unknown,
  correlationId: string | null
): ApiError {
  const record = isRecord(body) ? body : null
  return new ApiError({
    code: readText(record, "code") ?? HTTP_CODE,
    message: readText(record, "message") ?? HTTP_FALLBACK_MESSAGE,
    status,
    kind: "HTTP",
    correlationId,
  })
}

/** The request did not reach the server (fetch rejected). */
export function networkError(correlationId: string | null): ApiError {
  return clientError(
    "NETWORK",
    "Tidak dapat terhubung ke server. Periksa koneksi, lalu coba lagi.",
    null,
    correlationId
  )
}

/** The request was aborted after the 30-second timeout. */
export function timeoutError(correlationId: string | null): ApiError {
  return clientError(
    "TIMEOUT",
    "Server tidak merespons tepat waktu. Coba lagi.",
    null,
    correlationId
  )
}

/** The response body is not JSON (for example a proxy error page). */
export function nonJsonError(
  status: number,
  correlationId: string | null
): ApiError {
  return clientError(
    "NON_JSON",
    "Respons server tidak dapat dibaca. Coba lagi.",
    status,
    correlationId
  )
}

/** A 2xx body does not match the documented shape (kind CONTRACT). */
export function contractError(
  status: number | null,
  correlationId: string | null
): ApiError {
  return clientError(
    "CONTRACT",
    "Respons server tidak sesuai kontrak. Coba lagi.",
    status,
    correlationId
  )
}

/** True for any error that carries HTTP status 401. */
export function isUnauthorized(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 401
}

function clientError(
  kind: Exclude<ApiErrorKind, "HTTP">,
  message: string,
  status: number | null,
  correlationId: string | null
): ApiError {
  return new ApiError({ code: kind, message, status, kind, correlationId })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readText(
  record: Record<string, unknown> | null,
  key: string
): string | null {
  const value = record?.[key]
  return typeof value === "string" && value.trim() !== "" ? value : null
}
