/**
 * Outcome of the admin-account part of a tenant create or retry (ARCH-FE-001
 * D8.2; FE doc 6.3). The tenant exists in every case. One pure function maps
 * `admin_account.status` and `tenant_status_sync` to the message and to
 * whether the Retry button is needed.
 *
 *   CREATED + SYNCED        -> success, no retry
 *   CREATED + FAILED/absent -> success with a sync warning, retry
 *   FAILED  + any           -> account warning, retry
 */

export type AdminAccountStatus = "CREATED" | "FAILED"
export type TenantStatusSync = "SYNCED" | "FAILED"

export interface AdminAccountState {
  readonly status: AdminAccountStatus
  /** Absent (null) when the account was not created. */
  readonly tenantStatusSync: TenantStatusSync | null
}

export type AdminAccountOutcomeKind =
  "success" | "sync-warning" | "account-warning"

export interface AdminAccountOutcome {
  readonly kind: AdminAccountOutcomeKind
  readonly message: string
  /** True when the Retry button calls the admin-account endpoint. */
  readonly needsRetry: boolean
}

export const SUCCESS_MESSAGE = "Tenant dibuat, akun admin dikirim ke e-mail"
export const SYNC_WARNING_MESSAGE = "Status tenant belum tersinkron ke auth"
export const ACCOUNT_WARNING_MESSAGE =
  "Tenant dibuat, tetapi akun admin gagal dibuat"

export function classifyAdminAccount(
  state: AdminAccountState
): AdminAccountOutcome {
  if (state.status === "FAILED") {
    return {
      kind: "account-warning",
      message: ACCOUNT_WARNING_MESSAGE,
      needsRetry: true,
    }
  }
  if (state.tenantStatusSync === "SYNCED") {
    return { kind: "success", message: SUCCESS_MESSAGE, needsRetry: false }
  }
  return {
    kind: "sync-warning",
    message: SYNC_WARNING_MESSAGE,
    needsRetry: true,
  }
}
