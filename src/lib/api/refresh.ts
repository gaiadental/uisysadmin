/**
 * Access token holder and refresh coordination (ARCH-FE-001 D4.1, D4.3; ADR-004).
 *
 * The access token is a module variable only. It is never written to storage,
 * React state or a cookie. One refresh runs at a time in this tab. Across tabs
 * the refresh is serialised with the Web Lock `sp-session-refresh`. When
 * `navigator.locks` is missing, only the in-tab single-flight applies
 * (A-03, RK-FE-01).
 *
 * This module does not perform HTTP. The caller passes the refresh call in,
 * so the transport in `client.ts` stays the only place that sends requests.
 */

import { isUnauthorized } from "./errors"

const REFRESH_LOCK_NAME = "sp-session-refresh"

/**
 * 401 codes that mean the access token or the session is no longer valid
 * (D4.2, D4.3, D4.4). A request with one of them triggers a refresh. A refresh
 * that returns one of them ends the session. FE-OQ-18 confirms the codes.
 */
export const AUTH_EXPIRY_CODES: ReadonlySet<string> = new Set([
  "UNAUTHORIZED",
  "INVALID_TOKEN",
  "SESSION_ENDED",
])

let accessToken: string | null = null
let inflight: Promise<string> | null = null
let logoutHandler: (() => void) | null = null

export function getAccessToken(): string | null {
  return accessToken
}

/** Stores a token without side effects. Login and password change use this. */
export function setAccessToken(token: string | null): void {
  accessToken = token
}

/**
 * Registers the logout callback. TODO-005 registers the cache clear and the
 * route to login here. Pass null to unregister.
 */
export function setLogoutHandler(handler: (() => void) | null): void {
  logoutHandler = handler
}

/**
 * Ends the session: clears the token, then calls the logout handler (D4.3, D4.4).
 */
export function endSession(): void {
  accessToken = null
  logoutHandler?.()
}

/**
 * Returns a usable access token after a 401 on a request sent with `sentToken`.
 *
 * - A refresh already in flight is shared (single-flight).
 * - When the stored token differs from `sentToken`, another caller already
 *   refreshed. The stored token is returned and no second refresh runs.
 *   Refresh tokens rotate on every call, so a repeat refresh is never needed.
 * - Resolves to null when the session has already ended.
 *
 * A 401 with an expiry code from the refresh call ends the session. Any other
 * failure, including a 401 with another code or a non-JSON body, rejects
 * without clearing state (D4.3).
 */
export async function refreshAccessToken(
  sentToken: string | null,
  refreshOnServer: () => Promise<string>
): Promise<string | null> {
  if (inflight !== null) return inflight
  if (accessToken !== sentToken) return accessToken
  inflight = runRefresh(refreshOnServer)
  return inflight
}

function runRefresh(refreshOnServer: () => Promise<string>): Promise<string> {
  return runExclusive(refreshOnServer)
    .then(
      (token) => {
        accessToken = token
        return token
      },
      (error: unknown) => {
        if (endsSession(error)) endSession()
        throw error
      }
    )
    .finally(() => {
      inflight = null
    })
}

function endsSession(error: unknown): boolean {
  return isUnauthorized(error) && AUTH_EXPIRY_CODES.has(error.code)
}

function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  const locks = lockManager()
  if (locks === undefined) return task()
  return locks.request(REFRESH_LOCK_NAME, () => task())
}

function lockManager(): LockManager | undefined {
  const browser: Partial<Pick<Navigator, "locks">> | undefined =
    typeof navigator === "undefined" ? undefined : navigator
  return browser?.locks
}
