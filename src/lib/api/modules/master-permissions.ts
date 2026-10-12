/**
 * Master permission catalogue reads (ARCH-FE-001 D5.4; FE doc 5.3). The list
 * is not paginated by the server: the whole catalogue is returned and the
 * screen paginates it on the client.
 *
 * Writes (TODO-013; D5.3, FE doc 5.3): create is POST, edit is PATCH with the
 * full current values (the screen sends every field, `key` unchanged), delete
 * answers `{ "data": null }`. Create is not idempotent (SP-BG-11): the caller
 * disables the submit while in flight and nothing retries it.
 */

import { apiRequest } from "../client"
import {
  MasterPermissionListSchema,
  MasterPermissionSchema,
  type MasterPermission,
} from "@/types/master-permission"

import { unwrapData } from "./auth"

const MASTER_PERMISSIONS_PATH = "/api/v1/master-permissions"

/** D5.3 request body (`MasterPermissionRequest`). `description` is left out of create when empty. */
export interface MasterPermissionInput {
  readonly key: string
  readonly name: string
  readonly description?: string
  readonly category: string
  readonly module: string
  readonly active: boolean
  readonly customerPermitted: boolean
}

/** GET /api/v1/master-permissions. Requires `master_permissions:view`. */
export async function listMasterPermissions(): Promise<MasterPermission[]> {
  const body = await apiRequest<unknown>(MASTER_PERMISSIONS_PATH, {
    route: "masterPermissions.list",
  })
  return unwrapData(MasterPermissionListSchema, body)
}

/** POST /api/v1/master-permissions. Requires `master_permissions:create`. 409 for a taken key. */
export async function createMasterPermission(
  input: MasterPermissionInput
): Promise<MasterPermission> {
  const body = await apiRequest<unknown>(MASTER_PERMISSIONS_PATH, {
    method: "POST",
    body: toRequestBody(input, false),
    route: "masterPermissions.create",
  })
  return unwrapData(MasterPermissionSchema, body)
}

/**
 * PATCH /api/v1/master-permissions/{id}. Requires `master_permissions:update`.
 * The caller sends every current value; `key` is the existing key, unchanged.
 */
export async function updateMasterPermission(
  id: number,
  input: MasterPermissionInput
): Promise<MasterPermission> {
  const body = await apiRequest<unknown>(
    `${MASTER_PERMISSIONS_PATH}/${encodeURIComponent(String(id))}`,
    {
      method: "PATCH",
      body: toRequestBody(input, true),
      route: "masterPermissions.update",
    }
  )
  return unwrapData(MasterPermissionSchema, body)
}

/** DELETE /api/v1/master-permissions/{id}. Requires `master_permissions:delete`. */
export async function deleteMasterPermission(id: number): Promise<void> {
  await apiRequest<unknown>(
    `${MASTER_PERMISSIONS_PATH}/${encodeURIComponent(String(id))}`,
    { method: "DELETE", route: "masterPermissions.delete" }
  )
}

/** Whitelist: only the contract keys are sent. An empty description is omitted on create and sent as "" on edit. */
function toRequestBody(
  input: MasterPermissionInput,
  sendDescription: boolean
): Record<string, string | boolean> {
  const body: Record<string, string | boolean> = {
    key: input.key,
    name: input.name,
    category: input.category,
    module: input.module,
    active: input.active,
    customerPermitted: input.customerPermitted,
  }
  const description = input.description ?? ""
  if (sendDescription || description !== "") body.description = description
  return body
}
