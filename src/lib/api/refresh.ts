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

import { ApiError, isUnauthorized } from "./errors"

const REFRESH_LOCK_NAME = "sp-session-refresh"

/**
 * 401 codes that mean the access token or the session is no longer valid
 * (D4.2, D4.4). A data request that gets one of them runs a refresh. These codes
 * only trigger the refresh; they do not decide its outcome. A refresh that
 * answers 401 with any code ends the session (D4.3, TODO-024). FE-OQ-18 confirms
 * the trigger codes.
 */
export const AUTH_EXPIRY_CODES: ReadonlySet<string> = new Set([
  "UNAUTHORIZED",
  "INVALID_TOKEN",
  "SESSION_ENDED",
])

/**
 * Why a session ended, when the end is an account state (REQ-FE-055). The
 * login page shows the notice for this reason. A 401 expiry has no reason.
 */
export type SessionEndReason = "accountNotActive" | "accountNotReady"

/**
 * 403 codes from a refresh or `GET /api/v1/auth/me` that end the session, with
 * the reason for each (D4.2, D4.3, REQ-FE-055). Other 403 codes keep the
 * session (D6.5).
 */
const ACCOUNT_END_REASONS: ReadonlyMap<string, SessionEndReason> = new Map<
  string,
  SessionEndReason
>([
  ["ACCOUNT_NOT_ACTIVE", "accountNotActive"],
  ["ACCOUNT_NOT_READY", "accountNotReady"],
])

let accessToken: string | null = null
let inflight: Promise<string | null> | null = null
// Counts every clear of the token (endSession, setAccessToken(null)). A refresh
// stores its token only when the count is the same as when it started, so a
// refresh that resolves after the session ended cannot bring the session back.
let endCount = 0
let logoutHandler: ((reason?: SessionEndReason) => void) | null = null

export function getAccessToken(): string | null {
  return accessToken
}

/** Stores a token without side effects. Login and password change use this. */
export function setAccessToken(token: string | null): void {
  if (token === null) endCount += 1
  accessToken = token
}

/**
 * Registers the logout callback. TODO-005 registers the cache clear and the
 * route to login here. The callback gets the reason when an account state
 * ended the session (REQ-FE-055). Pass null to unregister.
 */
export function setLogoutHandler(
  handler: ((reason?: SessionEndReason) => void) | null
): void {
  logoutHandler = handler
}

/**
 * Ends the session: clears the token, then calls the logout handler (D4.3, D4.4).
 * `reason` is passed only for an account state (REQ-FE-055).
 */
export function endSession(reason?: SessionEndReason): void {
  endCount += 1
  accessToken = null
  logoutHandler?.(reason)
}

/**
 * The session-end reason for an account-state 403 (`ACCOUNT_NOT_ACTIVE` or
 * `ACCOUNT_NOT_READY`), or null for any other error. Boot uses it for `me`, and
 * the refresh pipeline uses it for the refresh call.
 */
export function accountEndReason(error: unknown): SessionEndReason | null {
  if (
    error instanceof ApiError &&
    error.kind === "HTTP" &&
    error.status === 403
  ) {
    return ACCOUNT_END_REASONS.get(error.code) ?? null
  }
  return null
}

/**
 * Returns a usable access token after a 401 on a request sent with `sentToken`.
 *
 * - A refresh already in flight is shared (single-flight).
 * - When the stored token differs from `sentToken`, another caller already
 *   refreshed. The stored token is returned and no second refresh runs.
 *   Refresh tokens rotate on every call, so a repeat refresh is never needed.
 * - Resolves to null when the session has already ended, or when it ended while
 *   the refresh was in flight: the late token is discarded, never stored.
 *
 * A 401 from the refresh call ends the session whatever its code (TODO-024). A
 * 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` ends it too (REQ-FE-055), and
 * passes its reason to the logout handler. Any other failure, including a 403
 * with another code, a network error, a timeout or a 5xx, rejects without
 * clearing state (D4.3).
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

function runRefresh(
  refreshOnServer: () => Promise<string>
): Promise<string | null> {
  const startedAt = endCount
  const run: Promise<string | null> = runExclusive(refreshOnServer)
    .then(
      (token) => {
        // The session ended while the refresh ran: discard the token (TODO-024).
        if (endCount !== startedAt) return null
        accessToken = token
        return token
      },
      (error: unknown) => {
        // An ended session is already cleared and announced; do not end it twice.
        if (endCount === startedAt) endForError(error)
        throw error
      }
    )
    .finally(() => {
      if (inflight === run) inflight = null
    })
  return run
}

/**
 * Ends the session once when a refresh error is one that ends it (D4.3): any
 * 401 (TODO-024), or a 403 account state with its reason (REQ-FE-055).
 */
function endForError(error: unknown): void {
  const reason = accountEndReason(error)
  if (reason !== null) {
    endSession(reason)
  } else if (isUnauthorized(error)) {
    endSession()
  }
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
