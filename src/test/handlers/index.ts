import { authHandlers, sessionHandlers } from "./auth"
import { catalogHandlers } from "./catalog"
import { systemRoleHandlers } from "./system-roles"
import { systemUserHandlers } from "./system-users"
import { tenantPermissionHandlers } from "./tenant-permissions"
import { tenantHandlers } from "./tenants"

/** Every default handler. A test adds an override with `server.use(...)`. */
export const handlers = [
  ...authHandlers,
  ...sessionHandlers,
  ...tenantHandlers,
  ...catalogHandlers,
  ...tenantPermissionHandlers,
  ...systemUserHandlers,
  ...systemRoleHandlers,
]
