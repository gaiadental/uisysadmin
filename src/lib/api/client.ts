/**
 * The single HTTP pipeline for every API call (ARCH-FE-001 D3.1, D4.4; ADR-002).
 *
 * Modules call `apiRequest` and unwrap the payload (D5). This file owns the
 * URL rule, the header allow-list, the timeout, the response rules, the 401
 * policy and the one retry after a refresh. There is no other automatic retry.
 */

import {
  ApiError,
  contractError,
  httpError,
  isUnauthorized,
  networkError,
  nonJsonError,
  timeoutError,
} from "./errors"
import {
  AUTH_EXPIRY_CODES,
  endSession,
  getAccessToken,
  refreshAccessToken,
} from "./refresh"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface ApiRequestOptions {
  /** Defaults to GET. */
  readonly method?: HttpMethod
  /** Sent as JSON. Omit for a request without a body. */
  readonly body?: unknown
  /** Label for development logs. Defaults to the path without its query string. */
  readonly route?: string
}

/** D3.1 step 4: abort after 30 seconds. */
export const REQUEST_TIMEOUT_MS = 30_000

const API_PREFIX = "/api/v1/"
const REFRESH_PATH = "/api/v1/auth/refresh"
const CORRELATION_HEADER = "X-Correlation-ID"
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9-]{1,64}$/

// Request headers the client may send (D3.1 step 2). Anything else is refused.
// Never sent: X-User-ID, X-Role, X-Tenant-ID, X-Service-Token.
const ALLOWED_HEADERS: ReadonlySet<string> = new Set([
  "accept",
  "content-type",
  "authorization",
  "x-correlation-id",
])

// D4.4: a 401 on these endpoints never triggers a refresh.
const NO_REFRESH_PATHS: ReadonlySet<string> = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/change-password",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/logout",
])

// Public auth calls are sent without an Authorization header (D3.1 step 2).
const PUBLIC_AUTH_PATHS: ReadonlySet<string> = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
])

interface Exchange {
  readonly status: number
  readonly body: unknown
  readonly correlationId: string
}

/**
 * Sends one API request and resolves with its body. A 204 resolves with
 * undefined, so use `void` as T for it. Failures reject with an ApiError.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  assertApiPath(path)
  try {
    return (await sendWithRefresh(path, options)) as T
  } catch (error) {
    if (error instanceof ApiError) {
      logApiError(error, options.route ?? routeOf(path))
    }
    throw error
  }
}

/** A new UUID v4 for each attempt (D3.1 step 2). */
export function newCorrelationId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  // randomUUID needs a secure context. This fallback covers plain-HTTP origins.
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-")
}

/**
 * Refuses, in development, any outgoing header outside the allow-list. The
 * forbidden names (X-User-ID, X-Role, X-Tenant-ID, X-Service-Token) are not on
 * it. In production the header builder only ever emits allow-listed names.
 */
export function assertOutgoingHeaders(
  headers: Readonly<Record<string, string>>
): void {
  if (!isDevelopment()) return
  for (const name of Object.keys(headers)) {
    if (!ALLOWED_HEADERS.has(name.toLowerCase())) {
      throw new TypeError(
        `Header ${name} is not on the SP web request allow-list (D3.1).`
      )
    }
  }
}

async function sendWithRefresh(
  path: string,
  options: ApiRequestOptions
): Promise<unknown> {
  const sentToken = getAccessToken()
  try {
    return (await sendOnce(path, options, sentToken)).body
  } catch (error) {
    if (!isRefreshTrigger(error, path)) throw error

    const freshToken = await refreshAccessToken(sentToken, refreshOnServer)
    if (freshToken === null) throw error

    try {
      // The single retry. A second 401 ends the session and never loops (D4.3).
      return (await sendOnce(path, options, freshToken)).body
    } catch (retryError) {
      if (isUnauthorized(retryError)) endSession()
      throw retryError
    }
  }
}

function isRefreshTrigger(error: unknown, path: string): boolean {
  return (
    error instanceof ApiError &&
    error.kind === "HTTP" &&
    error.status === 401 &&
    AUTH_EXPIRY_CODES.has(error.code) &&
    !NO_REFRESH_PATHS.has(normalisedPath(path))
  )
}

/** Calls the refresh endpoint. Runs inside the refresh lock (D4.3). */
async function refreshOnServer(): Promise<string> {
  const { status, body, correlationId } = await sendOnce(
    REFRESH_PATH,
    { method: "POST", route: "auth.refresh" },
    null
  )
  const token = accessTokenFrom(body)
  if (token === null) throw contractError(status, correlationId)
  return token
}

/** One attempt: one correlation id, one timeout, one response. Never refreshes. */
async function sendOnce(
  path: string,
  options: ApiRequestOptions,
  token: string | null
): Promise<Exchange> {
  const requestId = newCorrelationId()
  const headers = buildHeaders(path, options, token, requestId)
  assertOutgoingHeaders(headers)

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    credentials: "include",
    signal: controller.signal,
  }
  if (options.body !== undefined) init.body = JSON.stringify(options.body)

  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, init)
    const correlationId = echoedCorrelationId(response) ?? requestId
    if (response.status === 204) {
      return { status: 204, body: undefined, correlationId }
    }
    const text = await response.text()
    return parseExchange(response.status, response.ok, text, correlationId)
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw timedOut ? timeoutError(requestId) : networkError(requestId)
  } finally {
    clearTimeout(timer)
  }
}

function parseExchange(
  status: number,
  ok: boolean,
  text: string,
  correlationId: string
): Exchange {
  const parsed = parseJson(text)
  if (parsed === null) throw nonJsonError(status, correlationId)
  if (!ok) throw httpError(status, parsed.value, correlationId)
  return { status, body: parsed.value, correlationId }
}

/** JSON is parsed only when it parses. An empty or invalid body returns null. */
function parseJson(text: string): { readonly value: unknown } | null {
  if (text === "") return null
  try {
    return { value: JSON.parse(text) as unknown }
  } catch {
    return null
  }
}

function buildHeaders(
  path: string,
  options: ApiRequestOptions,
  token: string | null,
  correlationId: string
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    [CORRELATION_HEADER]: correlationId,
  }
  if (options.body !== undefined) headers["Content-Type"] = "application/json"
  if (token !== null && !PUBLIC_AUTH_PATHS.has(normalisedPath(path))) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

function echoedCorrelationId(response: Response): string | null {
  const value = response.headers.get(CORRELATION_HEADER)
  return value !== null && CORRELATION_ID_PATTERN.test(value) ? value : null
}

function accessTokenFrom(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.data)) return null
  const token = body.data.accessToken
  return typeof token === "string" && token !== "" ? token : null
}

/** The path must resolve inside /api/v1/ after dot-segment normalisation. */
function assertApiPath(path: string): void {
  if (
    !path.startsWith(API_PREFIX) ||
    !normalisedPath(path).startsWith(API_PREFIX)
  ) {
    throw new TypeError(`API path must start with ${API_PREFIX}`)
  }
}

/**
 * Pathname only, with dot segments resolved, no trailing slash and lower case.
 * Exemption checks use this form, so a variant spelling cannot skip them.
 */
function normalisedPath(path: string): string {
  const { pathname } = new URL(path, "http://sp.invalid")
  return pathname.replace(/\/+$/, "").toLowerCase()
}

function routeOf(path: string): string {
  return path.split("?")[0]
}

function apiBaseUrl(): string {
  const configured: unknown = import.meta.env.VITE_API_BASE_URL
  return typeof configured === "string" ? configured.replace(/\/+$/, "") : ""
}

function isDevelopment(): boolean {
  return import.meta.env.DEV
}

/** D18 and REQ-FE-046: only reference id, status, code, route and kind. */
function logApiError(error: ApiError, route: string): void {
  if (!isDevelopment()) return
  console.error("[api]", {
    correlationId: error.correlationId,
    status: error.status,
    code: error.code,
    route,
    kind: error.kind,
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
