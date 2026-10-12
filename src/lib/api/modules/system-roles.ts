/**
 * System role endpoints (ARCH-FE-001 D5.1, D5.3, D6.4; FE doc 5.2). The user
 * screens use the list for role options and role labels (TODO-014). TODO-015
 * adds get, create, edit, delete and the role permission calls.
 *
 * Write whitelists (D5.3): create and edit send `key`, `name`, `description`
 * and `active` (edit sends all current values, `key` unchanged, FE-OQ-17). The
 * permission calls use permission KEYS, not ids: GET answers a list of keys and
 * PUT sends `{ permissionKeys }` as a full replacement. Create is not
 * idempotent (SP-BG-11): the caller disables the submit while in flight and
 * nothing retries it.
 */

import { z } from "zod"

import { apiRequest } from "../client"
import {
  SystemRoleListSchema,
  SystemRoleSchema,
  type SystemRole,
} from "@/types/system-role"

import { unwrapData } from "./auth"

const SYSTEM_ROLES_PATH = "/api/v1/system-roles"

/** GET /api/v1/system-roles. Requires `system_roles:view`. The list is not paginated. */
export async function listSystemRoles(): Promise<SystemRole[]> {
  const body = await apiRequest<unknown>(SYSTEM_ROLES_PATH, {
    route: "systemRoles.list",
  })
  return unwrapData(SystemRoleListSchema, body)
}

/** D5.3 request body (`SystemRoleRequest`). `description` is left out of create when empty. */
export interface SystemRoleInput {
  readonly key: string
  readonly name: string
  readonly description?: string
  readonly active: boolean
}

const PermissionKeysSchema = z.array(z.string())

function rolePath(id: number): string {
  return `${SYSTEM_ROLES_PATH}/${encodeURIComponent(String(id))}`
}

/** GET /api/v1/system-roles/{id}. 404 SYSTEM_ROLE_NOT_FOUND for an unknown id. */
export async function getSystemRole(id: number): Promise<SystemRole> {
  const body = await apiRequest<unknown>(rolePath(id), {
    route: "systemRoles.get",
  })
  return unwrapData(SystemRoleSchema, body)
}

/** POST /api/v1/system-roles. Requires `system_roles:create`. 409 SYSTEM_ROLE_KEY_EXISTS. */
export async function createSystemRole(
  input: SystemRoleInput
): Promise<SystemRole> {
  const body = await apiRequest<unknown>(SYSTEM_ROLES_PATH, {
    method: "POST",
    body: toRequestBody(input, false),
    route: "systemRoles.create",
  })
  return unwrapData(SystemRoleSchema, body)
}

/**
 * PATCH /api/v1/system-roles/{id}. Requires `system_roles:update`. The caller
 * sends every current value; `key` is the existing key, unchanged.
 */
export async function updateSystemRole(
  id: number,
  input: SystemRoleInput
): Promise<SystemRole> {
  const body = await apiRequest<unknown>(rolePath(id), {
    method: "PATCH",
    body: toRequestBody(input, true),
    route: "systemRoles.update",
  })
  return unwrapData(SystemRoleSchema, body)
}

/** DELETE /api/v1/system-roles/{id}. Requires `system_roles:delete`. Answers `{ "data": null }`. */
export async function deleteSystemRole(id: number): Promise<void> {
  const body = await apiRequest<unknown>(rolePath(id), {
    method: "DELETE",
    route: "systemRoles.delete",
  })
  unwrapData(z.null(), body)
}

/** GET /api/v1/system-roles/{id}/permissions. Requires `system_roles:view`. Answers permission keys. */
export async function listRolePermissionKeys(id: number): Promise<string[]> {
  const body = await apiRequest<unknown>(`${rolePath(id)}/permissions`, {
    route: "systemRoles.permissions",
  })
  return unwrapData(PermissionKeysSchema, body)
}

/**
 * PUT /api/v1/system-roles/{id}/permissions with `{ permissionKeys }`. Full
 * replacement: a key left out is removed. Requires `system_roles:update`.
 */
export async function replaceRolePermissionKeys(
  id: number,
  permissionKeys: readonly string[]
): Promise<string[]> {
  const body = await apiRequest<unknown>(`${rolePath(id)}/permissions`, {
    method: "PUT",
    body: { permissionKeys: [...permissionKeys] },
    route: "systemRoles.replacePermissions",
  })
  return unwrapData(PermissionKeysSchema, body)
}

/** Whitelist: only the contract keys are sent. An empty description is omitted on create and sent as "" on edit. */
function toRequestBody(
  input: SystemRoleInput,
  sendDescription: boolean
): Record<string, string | boolean> {
  const body: Record<string, string | boolean> = {
    key: input.key,
    name: input.name,
    active: input.active,
  }
  const description = input.description ?? ""
  if (sendDescription || description !== "") body.description = description
  return body
}
