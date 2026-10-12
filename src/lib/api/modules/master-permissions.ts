/**
 * Master permission catalogue reads (ARCH-FE-001 D5.4; FE doc 5.3). The list
 * is not paginated by the server: the whole catalogue is returned and the
 * screen paginates it on the client.
 *
 * Write (D5.3, FE doc 5.3): edit is PATCH with the full current values (the
 * screen sends every field, `key` unchanged). The catalogue is read-only in
 * the SP web (TODO-021): create and delete are not in this module.
 */

import { apiRequest } from "../client"
import {
  MasterPermissionListSchema,
  MasterPermissionSchema,
  type MasterPermission,
} from "@/types/master-permission"

import { unwrapData } from "./auth"

const MASTER_PERMISSIONS_PATH = "/api/v1/master-permissions"

/** D5.3 request body (`MasterPermissionRequest`). */
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

/**
 * GET /api/v1/master-permissions/{id}. Requires `master_permissions:view`.
 * The edit dialog reads the permission again just before the PATCH (TODO-021).
 */
export async function getMasterPermission(
  id: number
): Promise<MasterPermission> {
  const body = await apiRequest<unknown>(
    `${MASTER_PERMISSIONS_PATH}/${encodeURIComponent(String(id))}`,
    { route: "masterPermissions.get" }
  )
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
      body: toRequestBody(input),
      route: "masterPermissions.update",
    }
  )
  return unwrapData(MasterPermissionSchema, body)
}

/** Whitelist: only the contract keys are sent. An empty description is sent as "". */
function toRequestBody(
  input: MasterPermissionInput
): Record<string, string | boolean> {
  return {
    key: input.key,
    name: input.name,
    description: input.description ?? "",
    category: input.category,
    module: input.module,
    active: input.active,
    customerPermitted: input.customerPermitted,
  }
}
