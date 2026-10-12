/**
 * System user endpoints (ARCH-FE-001 D5.1, D5.3, D6.4; FE doc 5.1). The lists
 * are not paginated by the server; the screen pages them on the client.
 *
 * Write whitelists (D5.3): create sends `loginId` and `systemRoleId`; a role
 * change sends `systemRoleId`; a status change sends `status`. Create and
 * reset-password send an e-mail and are not idempotent (SP-BG-11): the caller
 * disables the control while a request is in flight and nothing retries.
 */

import { z } from "zod"

import { apiRequest } from "../client"
import {
  SystemUserListSchema,
  SystemUserSchema,
  type SystemUser,
  type SystemUserStatus,
} from "@/types/system-user"

import { unwrapData } from "./auth"

const SYSTEM_USERS_PATH = "/api/v1/system-users"

/** D5.3 request body of a create. */
export interface SystemUserCreateInput {
  readonly loginId: string
  readonly systemRoleId: number
}

function userPath(id: string): string {
  return `${SYSTEM_USERS_PATH}/${encodeURIComponent(id)}`
}

/** GET /api/v1/system-users. Requires `system_users:view`. */
export async function listSystemUsers(): Promise<SystemUser[]> {
  const body = await apiRequest<unknown>(SYSTEM_USERS_PATH, {
    route: "systemUsers.list",
  })
  return unwrapData(SystemUserListSchema, body)
}

/** GET /api/v1/system-users/{id}. 404 SYSTEM_USER_NOT_FOUND for an unknown id. */
export async function getSystemUser(id: string): Promise<SystemUser> {
  const body = await apiRequest<unknown>(userPath(id), {
    route: "systemUsers.get",
  })
  return unwrapData(SystemUserSchema, body)
}

/** POST /api/v1/system-users. Requires `system_users:create`. 409 SYSTEM_USER_LOGIN_EXISTS, 400 SYSTEM_ROLE_NOT_FOUND. */
export async function createSystemUser(
  input: SystemUserCreateInput
): Promise<SystemUser> {
  const body = await apiRequest<unknown>(SYSTEM_USERS_PATH, {
    method: "POST",
    body: { loginId: input.loginId, systemRoleId: input.systemRoleId },
    route: "systemUsers.create",
  })
  return unwrapData(SystemUserSchema, body)
}

/** PATCH /api/v1/system-users/{id}. Requires `system_users:update`. Only `systemRoleId` is sent. */
export async function changeSystemUserRole(
  id: string,
  systemRoleId: number
): Promise<SystemUser> {
  const body = await apiRequest<unknown>(userPath(id), {
    method: "PATCH",
    body: { systemRoleId },
    route: "systemUsers.changeRole",
  })
  return unwrapData(SystemUserSchema, body)
}

/**
 * PATCH /api/v1/system-users/{id}/status. Suspend, deactivate and reactivate
 * are one call with a different `status`; the server decides per target
 * status which permission it needs and answers 403 when it is missing.
 */
export async function changeSystemUserStatus(
  id: string,
  status: SystemUserStatus
): Promise<SystemUser> {
  const body = await apiRequest<unknown>(`${userPath(id)}/status`, {
    method: "PATCH",
    body: { status },
    route: "systemUsers.changeStatus",
  })
  return unwrapData(SystemUserSchema, body)
}

/** DELETE /api/v1/system-users/{id}. Requires `system_users:delete`. Answers `{ "data": null }`. */
export async function deleteSystemUser(id: string): Promise<void> {
  const body = await apiRequest<unknown>(userPath(id), {
    method: "DELETE",
    route: "systemUsers.delete",
  })
  unwrapData(z.null(), body)
}

/** POST /api/v1/system-users/{id}/reset-password. Requires `system_users:reset_password`. The server e-mails a temporary password. */
export async function resetSystemUserPassword(id: string): Promise<void> {
  const body = await apiRequest<unknown>(`${userPath(id)}/reset-password`, {
    method: "POST",
    route: "systemUsers.resetPassword",
  })
  unwrapData(z.null(), body)
}
