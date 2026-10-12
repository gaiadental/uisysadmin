/**
 * auth-service endpoints for sign-in, the signed-in user and the password
 * flows (ARCH-FE-001 D4.2, D4.5 to D4.8, D5.1, D5.5; FE doc section 3).
 *
 * Each function sends one request through `apiRequest`, unwraps `data` and
 * validates the payload with a Zod schema. A mismatch throws a CONTRACT error.
 */

import { z } from "zod"

import { apiRequest } from "../client"
import { contractError } from "../errors"
import {
  LogoutResultSchema,
  MeSchema,
  PasswordChangedSchema,
  StatusResultSchema,
  TokenResponseSchema,
  type ChangePasswordRequest,
  type LoginRequest,
  type Me,
  type PasswordChangeOutcome,
  type ResetPasswordRequest,
  type TokenResponse,
} from "@/types/auth"

const AUTH_PATH = "/api/v1/auth"

/**
 * Reads `data` from an auth-service envelope (D5.1) and checks it against
 * `schema`. A body without `data`, or with a `data` that does not match, is a
 * CONTRACT error (D5.5). The client does not return the correlation id with the
 * body, so the error carries none.
 */
export function unwrapData<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(isRecord(body) ? body.data : undefined)
  if (!parsed.success) throw contractError(null, null)
  return parsed.data
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** POST /api/v1/auth/login. The body carries loginId and password only (D4.5). */
export async function login(input: LoginRequest): Promise<TokenResponse> {
  const body = await apiRequest<unknown>(`${AUTH_PATH}/login`, {
    method: "POST",
    body: { loginId: input.loginId, password: input.password },
    route: "auth.login",
  })
  return unwrapData(TokenResponseSchema, body)
}

/** GET /api/v1/auth/me. The result is cached under ['auth', 'me'] by the caller. */
export async function getMe(): Promise<Me> {
  const body = await apiRequest<unknown>(`${AUTH_PATH}/me`, {
    route: "auth.me",
  })
  return unwrapData(MeSchema, body)
}

/**
 * POST /api/v1/auth/refresh, called by the boot sequence (D4.2). The refresh
 * pipeline in refresh.ts calls it through `refreshAccessToken`.
 */
export async function refreshSession(): Promise<string> {
  const body = await apiRequest<unknown>(`${AUTH_PATH}/refresh`, {
    method: "POST",
    route: "auth.refresh",
  })
  return unwrapData(TokenResponseSchema, body).accessToken
}

/**
 * POST /api/v1/auth/logout, best effort (D4.8). The result is ignored. A 401
 * means the session is already over, and logout is exempt from refresh (D4.4).
 * Every failure is swallowed, so the caller always ends the local session.
 */
export async function logout(): Promise<void> {
  try {
    const body = await apiRequest<unknown>(`${AUTH_PATH}/logout`, {
      method: "POST",
      route: "auth.logout",
    })
    unwrapData(LogoutResultSchema, body)
  } catch {
    // Intentionally ignored. See the doc comment above.
  }
}

/**
 * POST /api/v1/auth/change-password. The response shape depends on
 * `keepCurrentSession` and is checked against the request (D4.6). A 401 is
 * exempt from refresh (D4.4).
 */
export async function changePassword(
  input: ChangePasswordRequest
): Promise<PasswordChangeOutcome> {
  const body = await apiRequest<unknown>(`${AUTH_PATH}/change-password`, {
    method: "POST",
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      newPasswordConfirmation: input.newPasswordConfirmation,
      keepCurrentSession: input.keepCurrentSession,
    },
    route: "auth.changePassword",
  })
  if (input.keepCurrentSession) {
    const { accessToken } = unwrapData(TokenResponseSchema, body)
    return { kind: "SESSION_KEPT", accessToken }
  }
  unwrapData(PasswordChangedSchema, body)
  return { kind: "PASSWORD_CHANGED" }
}

/** POST /api/v1/auth/forgot-password. Public. The UI never reveals whether the account exists. */
export async function forgotPassword(loginId: string): Promise<void> {
  const body = await apiRequest<unknown>(`${AUTH_PATH}/forgot-password`, {
    method: "POST",
    body: { loginId },
    route: "auth.forgotPassword",
  })
  unwrapData(StatusResultSchema, body)
}

/** POST /api/v1/auth/reset-password. Public. The token comes from the e-mail link (D4.7). */
export async function resetPassword(
  input: ResetPasswordRequest
): Promise<void> {
  const body = await apiRequest<unknown>(`${AUTH_PATH}/reset-password`, {
    method: "POST",
    body: {
      resetToken: input.resetToken,
      newPassword: input.newPassword,
      newPasswordConfirmation: input.newPasswordConfirmation,
    },
    route: "auth.resetPassword",
  })
  unwrapData(StatusResultSchema, body)
}
