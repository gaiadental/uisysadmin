/**
 * Fixed Indonesian copy for guard refusals on the Tim IT pages (ARCH-FE-001
 * D13.1, REQ-FE-053). Branching uses the HTTP status and the `code` only,
 * never the message text. The server `message` is never returned for these
 * codes, nor for an unrecognised 409 or 503. The correlation id is kept as the
 * reference id.
 *
 * Used only by the system account and system role mappers. Tenant and catalog
 * screens keep `describeWriteFailure` unchanged.
 */

import { ApiError } from "@/lib/api/errors"
import {
  GENERIC_WRITE_MESSAGE,
  type WriteFailure,
} from "@/features/tenants/create/write-failure"

export type GuardContext = "role" | "account"

export const SELF_ACTION_MESSAGE =
  "Aksi ini tidak dapat dilakukan pada akun Anda sendiri."
export const LAST_PRINCIPAL_MESSAGE =
  "Aksi ditolak. Harus selalu ada minimal satu administrator utama yang aktif."
export const ROLE_IN_USE_MESSAGE =
  "Peran masih dipakai akun. Pindahkan akunnya ke peran lain, lalu coba lagi."
export const SERVICE_UNAVAILABLE_MESSAGE =
  "Layanan sedang sibuk. Perubahan belum disimpan, silakan coba lagi."
export const PROTECTED_ROLE_MESSAGE =
  "Peran administrator utama dilindungi dan tidak dapat diubah atau dihapus."
export const PROTECTED_ACCOUNT_MESSAGE =
  "Hanya administrator utama yang aktif yang dapat melakukan aksi ini terhadap akun administrator utama."
export const CONFLICT_MESSAGE =
  "Perubahan bertentangan dengan data terbaru. Muat ulang halaman, lalu coba lagi."

/** Codes the callers handle themselves; the mapper leaves them alone. */
const OWN_HANDLING_CODES: readonly string[] = [
  "SYSTEM_USER_LOGIN_EXISTS",
  "SYSTEM_ROLE_KEY_EXISTS",
]

function messageFor(
  status: number,
  code: string,
  context: GuardContext
): string | null {
  if (status === 409 && code === "SELF_ACTION_NOT_ALLOWED") {
    return SELF_ACTION_MESSAGE
  }
  if (status === 409 && code === "LAST_SYSTEM_PRINCIPAL") {
    return LAST_PRINCIPAL_MESSAGE
  }
  if (status === 409 && code === "SYSTEM_ROLE_IN_USE") return ROLE_IN_USE_MESSAGE
  if (status === 503 && code === "SERVICE_UNAVAILABLE") {
    return SERVICE_UNAVAILABLE_MESSAGE
  }
  if (status === 403 && code === "PLATFORM_ROLE_PROTECTED") {
    return context === "role"
      ? PROTECTED_ROLE_MESSAGE
      : PROTECTED_ACCOUNT_MESSAGE
  }
  // Role pages only (v1.0.7); the account context is not specified and falls
  // through to the caller's mapping.
  if (
    status === 403 &&
    code === "ROLE_GUARD_VIOLATION" &&
    context === "role"
  ) {
    return PROTECTED_ROLE_MESSAGE
  }
  return null
}

/**
 * The fixed failure for a guard refusal or an unrecognised 409 or 503, or
 * `null` when the error is not covered here (the caller keeps its mapping).
 */
export function describeGuardFailure(
  error: unknown,
  context: GuardContext
): WriteFailure | null {
  if (!(error instanceof ApiError) || error.kind !== "HTTP") return null
  if (OWN_HANDLING_CODES.includes(error.code)) return null
  const referenceId = error.correlationId
  const status = error.status
  // An HTTP error without a status cannot match a guard rule.
  if (status === null) return { message: GENERIC_WRITE_MESSAGE, referenceId }
  const known = messageFor(status, error.code, context)
  if (known !== null) return { message: known, referenceId }
  if (status === 409) return { message: CONFLICT_MESSAGE, referenceId }
  if (status === 503) {
    return { message: SERVICE_UNAVAILABLE_MESSAGE, referenceId }
  }
  return null
}
