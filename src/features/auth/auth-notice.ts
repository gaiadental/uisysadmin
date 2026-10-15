/**
 * One-time notice for the login page, set by a password flow just before it
 * sends the user to /login (ARCH-FE-001 D4.6, D4.7), or by a session end on an
 * account state (D4.2, D4.3, REQ-FE-055). It lives in memory for this tab only.
 * It is not written to browser storage (D4.11) and not put in the URL, so it
 * leaves no trace in history or logs.
 */

export type AuthNotice =
  "passwordChanged" | "passwordReset" | "accountNotActive" | "accountNotReady"

let pendingNotice: AuthNotice | null = null

export function setPendingAuthNotice(notice: AuthNotice): void {
  pendingNotice = notice
}

/** Reads the pending notice without clearing it. Safe to call in a state initializer. */
export function peekPendingAuthNotice(): AuthNotice | null {
  return pendingNotice
}

export function clearPendingAuthNotice(): void {
  pendingNotice = null
}
