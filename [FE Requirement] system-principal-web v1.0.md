---
id: RAG-FE-SP-001
title: FE Requirement — System Principal Web (API Integration Contract)
version: 1.0
date: 2026-10-10
audience: AI coding agent building the System Principal web app, FE developers
sources:
  - master-data-service output/docs/api-reference.md v1.3 (Approved)
  - auth-service source (controllers, DTOs, ApiExceptionHandler) as of 2026-10-10
  - apigateway src/main/resources/config/edge-routes.yml, GatewayErrorCode
status: Ready for implementation
---

# FE Requirement — System Principal Web

## 0. Purpose and golden rules

This document is the single source of truth for how the System Principal (SP) web app talks to the GAIA backend. It lists every endpoint the app uses, the exact request and response shapes, the errors, and the expected UI behavior. Build the app from this document. Do not invent endpoints, fields or error codes that are not listed here.

Golden rules (MUST):

1. The browser talks **only to the API Gateway**. Never call auth-service or master-data directly.
2. The FE sends **only** these headers: `Authorization: Bearer <accessToken>` (after login), `Content-Type: application/json` (when there is a body), `Accept: application/json`, and optionally `X-Correlation-ID` (`^[A-Za-z0-9-]{1,64}$`).
3. The FE **never** sends `X-User-ID`, `X-Role`, `X-Tenant-ID` or `X-Service-Token`. The gateway sets them after it validates the token.
4. Keep the access token **in memory only** (JS variable / state store). Never in `localStorage`, `sessionStorage` or a readable cookie.
5. The refresh token is an `HttpOnly` cookie set by the server. The FE cannot read it and must not try. Send requests with `credentials: 'include'` so the browser can attach it.
6. **Two JSON conventions exist** (section 2). auth-service uses camelCase wrapped in `{ "data": ... }`. master-data uses snake_case, unwrapped. Map them in the API layer, not in components.
7. Show or hide menus and buttons from `permissions` returned by `GET /api/v1/auth/me` (section 4). The backend still enforces every permission; hiding is UX only.
8. Every error body is `{ "code": "...", "message": "..." }`. Branch on `code` and HTTP status, never on the message text.

## 1. Architecture and environments

```
Browser (SP web)
   │  HTTPS, Authorization: Bearer <accessToken>, refresh cookie (HttpOnly)
   ▼
API Gateway  (host decides the context: system.* = SYSTEM)
   │  validates JWT + introspection, injects X-User-ID / X-Role / X-Service-Token
   ├──► auth-service   : /api/v1/auth/**, /api/v1/system-users/**, /api/v1/system-roles/**,
   │                     /api/v1/master-permissions/**, /api/v1/sessions/**, /api/v1/admin/**,
   │                     /api/v1/tenants/{id}/permissions/**, /api/v1/tenants/{id}/registration-settings/**
   └──► master-data    : /api/v1/tenants/**, /api/v1/tenant-categories/**, /api/v1/countries/**
```

The gateway routes by path. `/api/v1/tenants/{id}/permissions` and `/api/v1/tenants/{id}/registration-settings` go to auth-service; every other `/api/v1/tenants/**` path goes to master-data.

| Environment | Gateway base URL | Notes |
|---|---|---|
| Local dev | `http://system.gaia.localhost:8080` | Chrome/Firefox resolve `*.localhost` to 127.0.0.1. Safari: add `127.0.0.1 system.gaia.localhost` to `/etc/hosts`. Allowed CORS origin: `http://localhost:3000` |
| Staging / Prod | `https://<system host>` (to be provided) | Same paths. Use HTTPS only |

Configure the base URL with an environment variable, for example `VITE_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL`. Do not hard-code it.

### 1.1 Local dev: use a dev-server proxy (RECOMMENDED)

The refresh cookie is `Secure; SameSite=Strict; Path=/api/v1/auth/refresh`. With the FE on `http://localhost:3000` and the gateway on `http://system.gaia.localhost:8080`, the two are different sites, so the browser will not send a `SameSite=Strict` cookie and token refresh fails.

Fix: let the FE dev server proxy `/api/*` to the gateway and rewrite the Host header. The browser then sees one origin.

Vite example (tested pattern):

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: false,
        configure: (proxy) => {
          // The gateway picks the SYSTEM context from the Host header.
          proxy.on('proxyReq', (req) => req.setHeader('Host', 'system.gaia.localhost'));
        },
      },
    },
  },
});
```

`.env.development`: `VITE_API_BASE_URL=` (empty, so calls stay relative: `/api/v1/...`). Open the app at `http://localhost:3000` in Chrome or Firefox (they accept `Secure` cookies on `localhost`; Safari may not).

With the proxy, the FE uses a relative base URL (`/api/v1/...`). In staging/prod the FE is served from the same site as the gateway, or the gateway owner configures CORS with credentials.

## 2. Response conventions

### 2.1 auth-service endpoints (`/api/v1/auth/**`, system users, roles, permissions, sessions)

- JSON field names: **camelCase**.
- Success body is always wrapped: `{ "data": <payload> }`. `<payload>` may be an object, an array or `null`.
- Lists are **not paginated** (plain array inside `data`). Paginate and filter on the client.
- Delete usually returns `200 { "data": null }`. Registration-settings delete returns `204` with no body.

```json
{ "data": { "accessToken": "eyJ..." } }
```

### 2.2 master-data endpoints (`/api/v1/tenants/**`, `tenant-categories`, `countries`)

- JSON field names: **snake_case** (request and response).
- Single resource: the object itself, **no wrapper**.
- List: `{ "data": [ ... ], "pagination": { "page": 1, "limit": 20, "total": 15, "total_pages": 1 } }`.
- Query `page` is 1-based (default 1, min 1). `limit` default 20, range 1–100. Out of range → 400.
- Delete returns `204` with no body.
- Timestamps are ISO-8601 with offset (e.g. `2026-10-09T02:14:48.418971Z`).

### 2.3 Error body (all services and the gateway)

```json
{ "code": "RESOURCE_NOT_FOUND", "message": "Tenant not found." }
```

Nothing else is returned (no stack trace, no field list object). Validation messages are a single string, for example `"name: must not be blank; code: size must be between 0 and 50"` (master-data) or a field list joined by `; ` (auth-service, code `VALIDATION_FAILED`).

Note the different validation codes: master-data uses `VALIDATION_ERROR`, auth-service uses `VALIDATION_FAILED`. Treat both as "show validation message near the form".

## 3. Authentication and session

### 3.1 Token facts

| Item | Value |
|---|---|
| Access token | JWT (RS256), returned in the body. Lifetime 15 minutes (default `PT15M`) |
| Refresh token | `HttpOnly; Secure; SameSite=Strict` cookie, name `gaia_rt_sys` (system context), path `/api/v1/auth/refresh`, lifetime 30 days. Rotated on every refresh |
| Session | Server-side, max 30 days |

### 3.2 Flow

```
[Login page] --POST /api/v1/auth/login--> accessToken (memory) + refresh cookie
      │
      ▼
GET /api/v1/auth/me  --> userId, loginId, role, permissions, pwdChangeRequired
      │
      ├─ pwdChangeRequired = true  --> force [Change Password page] (block every other page)
      └─ else                      --> [Dashboard], build menu from permissions
      
Any API call returns 401 --> POST /api/v1/auth/refresh (once, single-flight)
      ├─ 200 --> store new accessToken, retry the original request once
      └─ 401 --> clear state, go to [Login page]

App start / page reload (token lost from memory):
      POST /api/v1/auth/refresh --> 200: continue (call /me) ; 401: show login

[Logout] --POST /api/v1/auth/logout--> clear memory, go to login
```

Single-flight refresh: if several requests get 401 at the same time, run **one** refresh call and let the others wait for it. Never loop: if the retried request gets 401 again, log out.

### 3.3 Endpoints

#### POST /api/v1/auth/login

Public (no Authorization header). Host must be the system host (the proxy handles this).

Request:

```json
{ "loginId": "principal@example.com", "password": "********" }
```

| Field | Rule |
|---|---|
| `loginId` | required, not blank (system users log in with their e-mail) |
| `password` | required, not blank |
| `tenantId` | do NOT send for the system app |

Response `200` (+ `Set-Cookie: gaia_rt_sys=...`):

```json
{ "data": { "accessToken": "eyJraWQiOiJsb2NhbC1r..." } }
```

Errors:

| HTTP | code | message | UI |
|---|---|---|---|
| 400 | `VALIDATION_FAILED` | field list | show under the form |
| 401 | `INVALID_CREDENTIALS` | `Invalid credentials.` | "Login ID atau password salah" (same text for unknown user and wrong password) |
| 403 | `ACCOUNT_NOT_ACTIVE` | `Account is not active. Contact your administrator.` | show message |
| 403 | `ACCOUNT_NOT_READY` | `Your account is awaiting activation.` | show message |
| 429 | `TOO_MANY_ATTEMPTS` / `RATE_LIMIT_EXCEEDED` | `Too many attempts. Try again later.` | disable submit for 60 s |

#### POST /api/v1/auth/refresh

No body, no Authorization header. Needs the refresh cookie (`credentials: 'include'`).

Response `200` (+ rotated cookie): `{ "data": { "accessToken": "eyJ..." } }`

Errors: `401 INVALID_TOKEN "Invalid token."` or `401 SESSION_ENDED "Session ended. Please log in again."` → go to login.

#### GET /api/v1/auth/me

Response `200`:

```json
{
  "data": {
    "userId": "640688ab-b751-4071-9a1d-d079552305d3",
    "loginId": "principal@example.com",
    "userType": "SYSTEM_USER",
    "context": null,
    "role": "SYS_PRINCIPAL",
    "permissions": ["system_users:view", "system_users:create", "master_permissions:view", "..."],
    "tenant": null,
    "branches": [],
    "pwdChangeRequired": false
  }
}
```

Values are illustrative. For a system user `tenant` is `null` and `branches` is empty. Use `permissions` for menu gating. Use `loginId` in the header/avatar. If `pwdChangeRequired` is `true`, route to Change Password and block all other routes.

#### POST /api/v1/auth/logout

Authorization required. No body. Always succeeds (idempotent).

Response `200`: `{ "data": { "status": "LOGGED_OUT" } }` and the refresh cookie is cleared. Clear the in-memory token and all cached data, then go to login.

#### POST /api/v1/auth/change-password

Authorization required.

Request:

```json
{
  "currentPassword": "old",
  "newPassword": "New-Strong-Pass-1",
  "newPasswordConfirmation": "New-Strong-Pass-1",
  "keepCurrentSession": true
}
```

Response `200`:

- `keepCurrentSession: true` → `{ "data": { "accessToken": "eyJ..." } }`. Replace the stored token; other sessions are ended.
- otherwise → `{ "data": { "status": "PASSWORD_CHANGED" } }`. Log the user out and show "Password changed, please log in again".

Errors: `401 INVALID_CREDENTIALS "Current password is incorrect."`; `400 PASSWORD_POLICY_VIOLATION` (e.g. `"Password and confirmation do not match."` or a policy message) → show under the field; `400 VALIDATION_FAILED`.

#### POST /api/v1/auth/forgot-password

Public. Request `{ "loginId": "principal@example.com" }`. Response `200 { "data": { "status": "<status>" } }`. Always show the same neutral text: "Jika akun terdaftar, link reset sudah dikirim ke e-mail." Never reveal whether the account exists.

#### POST /api/v1/auth/reset-password

Public. Page reached from the e-mail link (the link carries the token).

Request:

```json
{ "resetToken": "<from link>", "newPassword": "New-Strong-Pass-1", "newPasswordConfirmation": "New-Strong-Pass-1" }
```

Response `200 { "data": { "status": "<status>" } }` → go to login with a success notice. Errors: `400 INVALID_TOKEN "Invalid or expired token."` (show "Link tidak valid atau kedaluwarsa" and a link to forgot-password); `400 PASSWORD_POLICY_VIOLATION`.

### 3.4 Own sessions (any logged-in user)

| Method | Path | Response |
|---|---|---|
| GET | `/api/v1/sessions` | `{ "data": [ Session ] }` |
| DELETE | `/api/v1/sessions/{sessionId}` | `{ "data": null }` — revoke one session |
| DELETE | `/api/v1/sessions` | `{ "data": null }` — revoke all other sessions |

```json
{ "sessionId": "uuid", "ipAddress": "127.0.0.1", "userAgent": "Mozilla/5.0 ...", "lastActivityAt": "2026-10-10T05:00:00Z", "createdAt": "2026-10-10T04:00:00Z", "isCurrent": true }
```

Mark `isCurrent` with a badge and do not offer "revoke" on it (use Logout instead).

## 4. Permissions and menu gating

The menu is built from `me.permissions`. A missing key means hide the menu item or button. The backend answers `403 PERMISSION_DENIED "The authenticated principal does not have the required permission."` if the user calls it anyway.

| Feature / menu | Permission keys |
|---|---|
| System users — list, detail | `system_users:view` |
| System users — create | `system_users:create` |
| System users — change role | `system_users:update` |
| System users — delete | `system_users:delete` |
| System users — change status | server decides per target status (status-specific keys); show the action when the user has `system_users:update`, handle 403 |
| System users — reset password | `system_users:reset_password` |
| System roles — list, detail, view permissions | `system_roles:view` |
| System roles — create | `system_roles:create` |
| System roles — edit, replace permissions | `system_roles:update` |
| System roles — delete | `system_roles:delete` |
| Master permissions — list, detail | `master_permissions:view` |
| Master permissions — create / edit / delete | `master_permissions:create` / `:update` / `:delete` |
| Tenant permissions (per tenant) — view / replace | `tenant_permissions:view` / `tenant_permissions:update` |
| Tenant permissions — toggle one on / off | `tenant_permissions:activate` / `tenant_permissions:deactivate` |
| Sessions of another user — view / revoke | `sessions:view` / `sessions:revoke` |
| Master data (tenants, tenant categories, countries) | No permission key: allowed for role SYSTEM_PRINCIPAL (every SP user). Show always |

## 5. auth-service admin endpoints (camelCase, `{ "data": ... }`)

All require `Authorization`. Success status is `200` unless noted. Lists are not paginated.

### 5.1 System users — `/api/v1/system-users`

Object `SystemUser`:

```json
{
  "id": "640688ab-b751-4071-9a1d-d079552305d3",
  "loginId": "ops@gaia.com",
  "systemRoleId": 1,
  "systemRoleKey": "SYS_PRINCIPAL",
  "status": "ACTIVE",
  "createdAt": "2026-10-01T03:00:00Z",
  "updatedAt": "2026-10-01T03:00:00Z"
}
```

`status` ∈ `ACTIVE`, `SUSPENDED`, `DEACTIVATED`.

| Method | Path | Permission | Request | Response |
|---|---|---|---|---|
| GET | `/api/v1/system-users` | `system_users:view` | — | `{ "data": [SystemUser] }` |
| GET | `/api/v1/system-users/{id}` | `system_users:view` | — | `{ "data": SystemUser }` |
| POST | `/api/v1/system-users` | `system_users:create` | `{ "loginId": "email", "systemRoleId": 1 }` | `{ "data": SystemUser }` |
| PATCH | `/api/v1/system-users/{id}` | `system_users:update` | `{ "systemRoleId": 2 }` | `{ "data": SystemUser }` |
| DELETE | `/api/v1/system-users/{id}` | `system_users:delete` | — | `{ "data": null }` |
| PATCH | `/api/v1/system-users/{id}/status` | status-specific | `{ "status": "SUSPENDED" }` | `{ "data": SystemUser }` |
| POST | `/api/v1/system-users/{id}/reset-password` | `system_users:reset_password` | — | `{ "data": null }` |

Rules: `loginId` required and must be an e-mail; `systemRoleId` required on create. On create the server e-mails a temporary password; the new user must change it at first login (`pwdChangeRequired`). Reset password also sends an e-mail; show "Password sementara sudah dikirim ke e-mail user".

Errors: `409 SYSTEM_USER_LOGIN_EXISTS "A system user with this login already exists."`; `400 SYSTEM_ROLE_NOT_FOUND "System role not found."` (bad `systemRoleId`); `404 SYSTEM_USER_NOT_FOUND "System user not found."`; `403 PERMISSION_DENIED`; `400 VALIDATION_FAILED`.

UI: role dropdown filled from `GET /api/v1/system-roles`. Confirm dialog before delete, suspend, deactivate and reset password. Do not allow the user to suspend/delete their own account (`id === me.userId`).

### 5.2 System roles — `/api/v1/system-roles`

Object `SystemRole`:

```json
{ "id": 1, "key": "SYS_PRINCIPAL", "name": "System Principal", "description": "Full platform access", "createdAt": "...", "updatedAt": "..." }
```

| Method | Path | Permission | Request | Response |
|---|---|---|---|---|
| GET | `/api/v1/system-roles` | `system_roles:view` | — | `{ "data": [SystemRole] }` |
| GET | `/api/v1/system-roles/{id}` | `system_roles:view` | — | `{ "data": SystemRole }` |
| POST | `/api/v1/system-roles` | `system_roles:create` | `SystemRoleRequest` | `{ "data": SystemRole }` |
| PATCH | `/api/v1/system-roles/{id}` | `system_roles:update` | `SystemRoleRequest` | `{ "data": SystemRole }` |
| DELETE | `/api/v1/system-roles/{id}` | `system_roles:delete` | — | `{ "data": null }` |
| GET | `/api/v1/system-roles/{id}/permissions` | `system_roles:view` | — | `{ "data": ["system_users:view", "..."] }` (permission keys) |
| PUT | `/api/v1/system-roles/{id}/permissions` | `system_roles:update` | `{ "permissionKeys": ["system_users:view", "..."] }` | `{ "data": ["..."] }` (full replacement) |

`SystemRoleRequest`: `{ "key": "OPS_ADMIN" (required, max 100), "name": "Ops Admin" (required, max 100), "description": "...", "active": true }`. PATCH expects the same body: send all current values.

Errors: `409 SYSTEM_ROLE_KEY_EXISTS`; `404 SYSTEM_ROLE_NOT_FOUND`; a protected platform role (e.g. `SYS_PRINCIPAL`) may be refused with `PLATFORM_ROLE_PROTECTED` or `ROLE_GUARD_VIOLATION` ("Operation not permitted.") → show the message, disable edit/delete for that role.

UI: "Permissions" tab = checklist of all master permissions (from 5.3, grouped by `module` then `category`), pre-checked from `GET .../permissions`, saved with one PUT.

### 5.3 Master permissions — `/api/v1/master-permissions`

Object `MasterPermission`:

```json
{ "id": 10, "key": "system_users:view", "name": "View system users", "description": "...", "category": "system_users", "module": "auth", "createdAt": "...", "updatedAt": "..." }
```

| Method | Path | Permission | Request | Response |
|---|---|---|---|---|
| GET | `/api/v1/master-permissions` | `master_permissions:view` | — | `{ "data": [MasterPermission] }` |
| GET | `/api/v1/master-permissions/{id}` | `master_permissions:view` | — | `{ "data": MasterPermission }` |
| POST | `/api/v1/master-permissions` | `master_permissions:create` | `MasterPermissionRequest` | `{ "data": MasterPermission }` |
| PATCH | `/api/v1/master-permissions/{id}` | `master_permissions:update` | `MasterPermissionRequest` | `{ "data": MasterPermission }` |
| DELETE | `/api/v1/master-permissions/{id}` | `master_permissions:delete` | — | `{ "data": null }` |

`MasterPermissionRequest`: `key` (required, max 100), `name` (required, max 100), `description`, `category` (required, max 50), `module` (required, max 50), `active` (boolean), `customerPermitted` (boolean). Errors: `409 MASTER_PERMISSION_KEY_EXISTS`, `404`, `400 VALIDATION_FAILED`.

### 5.4 Tenant permissions — `/api/v1/tenants/{tenantId}/permissions` (routed to auth-service)

Which master permissions a tenant may use. `tenantId` comes from the master-data tenant list (section 6.3).

Object `TenantPermission`:

```json
{ "id": 55, "masterPermissionId": 10, "masterPermissionKey": "branches:view", "masterPermissionName": "View branches", "createdAt": "...", "updatedAt": "..." }
```

| Method | Path | Permission | Request | Response |
|---|---|---|---|---|
| GET | `/api/v1/tenants/{tenantId}/permissions` | `tenant_permissions:view` | — | `{ "data": [TenantPermission] }` |
| PUT | `/api/v1/tenants/{tenantId}/permissions` | `tenant_permissions:update` | `{ "masterPermissionIds": [10, 11, 12] }` | `{ "data": [TenantPermission] }` (full replacement) |
| PATCH | `/api/v1/tenants/{tenantId}/permissions/{id}` | `tenant_permissions:activate` (enabled=true) / `:deactivate` (false) | `{ "enabled": true }` | `{ "data": TenantPermission }` |

UI: on the Tenant detail page, a "Permissions" tab with a checklist of master permissions, saved with PUT.

### 5.5 Tenant registration settings — `/api/v1/tenants/{tenantId}/registration-settings` (optional feature)

Which tenant role new self-registered patients receive. Allowed for SYS_PRINCIPAL.

| Method | Path | Request | Response |
|---|---|---|---|
| GET | `.../registration-settings` | — | `{ "data": { "tenantId": "uuid", "defaultTenantRoleId": 7 } }` |
| PUT | `.../registration-settings` | `{ "defaultTenantRoleId": 7 }` | same as GET |
| DELETE | `.../registration-settings` | — | `204` no body |

Error `400 TENANT_ROLE_NOT_FOUND` for an invalid or non-CUSTOMER role. Limitation: SP has no endpoint to list a tenant's roles (tenant roles are tenant-scoped), so the role id is typed manually. Mark this feature "optional / phase 2".

### 5.6 Sessions of another user (admin)

| Method | Path | Permission | Response |
|---|---|---|---|
| GET | `/api/v1/admin/users/{userId}/sessions` | `sessions:view` | `{ "data": [Session] }` |
| DELETE | `/api/v1/admin/users/{userId}/sessions` | `sessions:revoke` | `{ "data": null }` — revokes all sessions of that user |

Use it on the System user detail page ("Active sessions" tab, "Force logout" button).

## 6. master-data endpoints (snake_case, unwrapped)

All require `Authorization`. Role SYSTEM_PRINCIPAL is allowed on every endpoint in this section. SP is **not** allowed on branch types, branches, facilities and tenant social links (403): those belong to the tenant admin app.

Send `Accept: application/json` on every request (a strict non-JSON `Accept` can turn an error into an empty 500).

### 6.1 Tenant categories — `/api/v1/tenant-categories`

Object `TenantCategory`:

```json
{
  "id": "c91b1adc-675d-4a80-b3b4-05a657cc57d9",
  "code": "DENTAL",
  "name": "Dental Clinic",
  "description": "Klinik gigi",
  "is_active": true,
  "created_at": "2026-10-01T03:00:00Z",
  "created_by": "11111111-1111-4111-8111-111111111111",
  "updated_at": "2026-10-01T03:00:00Z",
  "updated_by": "11111111-1111-4111-8111-111111111111"
}
```

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/api/v1/tenant-categories?page=1&limit=20&is_active=true&code=DENTAL` | filters optional (`code` exact) | `200` list |
| GET | `/api/v1/tenant-categories/{id}` | — | `200` TenantCategory |
| POST | `/api/v1/tenant-categories` | `{ "code": "DENTAL", "name": "Dental Clinic", "description": "..." }` | `201` TenantCategory |
| PUT | `/api/v1/tenant-categories/{id}` | `{ "name": "Dental Clinic", "description": "...", "is_active": true }` | `200` TenantCategory |
| DELETE | `/api/v1/tenant-categories/{id}` | — | `204` |

Rules: create `code` required max 50, `name` required max 100. Update `name` required, `is_active` required boolean; **never send `code` on PUT** (→ `400 FIELD_IMMUTABLE`). Show `code` read-only on the edit form.

Errors: `409 RESOURCE_CONFLICT` "Tenant category code already exists." / "Tenant category name already exists." / "Tenant category is used by one or more tenants and cannot be deleted."; `404 RESOURCE_NOT_FOUND "Tenant category not found."`.

### 6.2 Countries — `/api/v1/countries`

Path key is the 2-letter `code`, not a UUID.

Object `Country`:

```json
{ "code": "ID", "name": "Indonesia", "nationality_name": "Indonesian", "phone_code": "+62", "is_active": true, "created_at": "...", "created_by": "uuid", "updated_at": "...", "updated_by": "uuid" }
```

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/api/v1/countries?page=1&limit=20&is_active=true&search=indo` | `search` = case-insensitive substring of name | `200` list |
| GET | `/api/v1/countries/{code}` | — | `200` Country |
| POST | `/api/v1/countries` | `{ "code": "SG", "name": "Singapore", "nationality_name": "Singaporean", "phone_code": "+65" }` | `201` Country |
| PUT | `/api/v1/countries/{code}` | `{ "name": "Singapore", "nationality_name": "Singaporean", "phone_code": "+65", "is_active": true }` | `200` Country |
| DELETE | `/api/v1/countries/{code}` | — | `204` |

Rules: `code` required `^[A-Z]{2}$` (ISO 3166-1 alpha-2, uppercase the input), `name` required max 100, `nationality_name` max 100, `phone_code` max 10. Update requires `name` and `is_active`; never send `code` (→ `400 FIELD_IMMUTABLE`).

Errors: `409` "Country code already exists." / "Country is used by one or more tenants and cannot be deleted."; `404` "Country not found.".

### 6.3 Tenants — `/api/v1/tenants`

Object `Tenant` (list, PATCH response):

```json
{
  "id": "cfab6b98-98cf-4059-bd06-9a1cdf469b41",
  "code": "ANDALAS-DEV",
  "name": "Klinik Andalas Dev",
  "tenant_category_id": "c91b1adc-675d-4a80-b3b4-05a657cc57d9",
  "country_code": "ID",
  "deployment_type": "MULTI_TENANT",
  "multi_branch_enabled": true,
  "tenant_admin_email": "admin@gaia.com",
  "logo_url": null,
  "is_active": true,
  "created_at": "2026-10-09T02:14:48.418971Z",
  "created_by": "11111111-1111-4111-8111-111111111111",
  "updated_at": "2026-10-09T02:14:48.418971Z",
  "updated_by": "11111111-1111-4111-8111-111111111111"
}
```

| Method | Path | Request | Success |
|---|---|---|---|
| GET | `/api/v1/tenants?page=1&limit=20` + filters | `is_active`, `code` (exact), `category_id`, `country_code`, `deployment_type` | `200` list of Tenant |
| GET | `/api/v1/tenants/{id}` | — | `200` TenantDetail |
| POST | `/api/v1/tenants` | CreateTenant | `201` TenantCreated (always 201, see admin_account) |
| PATCH | `/api/v1/tenants/{id}` | only `is_active`, `logo_url`, `country_code` | `200` Tenant |
| POST | `/api/v1/tenants/{id}/admin-account` | no body | `200` AdminAccountRetry |
| DELETE | `/api/v1/tenants/{id}` | — | always `405`. **Do not show a delete button.** Deactivate with PATCH `is_active=false` |

**CreateTenant request**

```json
{
  "code": "SMILE",
  "name": "Smile Dental Group",
  "tenant_category_id": "c91b1adc-675d-4a80-b3b4-05a657cc57d9",
  "country_code": "ID",
  "deployment_type": "MULTI_TENANT",
  "multi_branch_enabled": true,
  "tenant_admin_email": "admin@smiledental.example.com",
  "logo_url": "https://smiledental.example.com/logo.png"
}
```

| Field | Rule | UI control |
|---|---|---|
| `code` | required, max 50, unique | text, uppercase hint |
| `name` | required, max 100 | text |
| `tenant_category_id` | required, active category | select from `GET /tenant-categories?is_active=true&limit=100` |
| `country_code` | optional, active country | select from `GET /countries?is_active=true&limit=100` |
| `deployment_type` | required: `DEDICATED` or `MULTI_TENANT` | radio. Only one live DEDICATED tenant is allowed |
| `multi_branch_enabled` | optional boolean, default `true` | switch |
| `tenant_admin_email` | required e-mail, max 100 | e-mail input |
| `logo_url` | optional http/https URL, max 500 | URL input |

**TenantCreated response (201)** = Tenant fields plus:

```json
{
  "default_branch_types": [
    { "id": "uuid", "code": "HEAD_OFFICE", "name": "Head Office" },
    { "id": "uuid", "code": "CLINIC", "name": "Clinic" }
  ],
  "admin_account": {
    "status": "CREATED",
    "user_id": "uuid",
    "message": "Admin account created.",
    "tenant_status_sync": "SYNCED"
  }
}
```

`admin_account` outcomes (HTTP is 201 in every case; the tenant IS created):

| `status` | `user_id` | `tenant_status_sync` | UI |
|---|---|---|---|
| `CREATED` | uuid | `SYNCED` | success toast "Tenant dibuat, akun admin dikirim ke e-mail" |
| `CREATED` | uuid | `FAILED` | success + warning "Status tenant belum tersinkron ke auth" with **Retry admin account** button |
| `FAILED` | `null` | absent | warning "Tenant dibuat, tetapi akun admin gagal dibuat" with **Retry admin account** button. `message` = "Admin account creation failed. Use POST /api/v1/tenants/{id}/admin-account to retry." |

Create errors: `400 VALIDATION_ERROR` ("Invalid tenant_category_id.", "Invalid country_code.", "Only one DEDICATED tenant is allowed per deployment.", or field messages); `409 RESOURCE_CONFLICT "Tenant code already exists."`.

**TenantDetail (GET by id)** = scalar Tenant fields plus:

```json
{
  "tenant_category": { "id": "uuid", "code": "DENTAL", "name": "Dental Clinic" },
  "country": { "code": "ID", "name": "Indonesia", "phone_code": "+62" },
  "social_links": [ { "id": "uuid", "platform_name": "instagram", "url": "https://instagram.com/x" } ]
}
```

`country` may be `null`. Social links are read-only for SP (managed by the tenant admin).

**PATCH /api/v1/tenants/{id}**

Send only the fields that change:

```json
{ "is_active": false }
{ "logo_url": "https://cdn.example.com/new.png" }
{ "country_code": null }
```

- Allowed: `is_active` (boolean, not null), `logo_url` (URL or `null`), `country_code` (`^[A-Z]{2}$` or `null`).
- Any of `code`, `name`, `tenant_category_id`, `deployment_type`, `multi_branch_enabled`, `tenant_admin_email` → `400 FIELD_IMMUTABLE`. Show these fields read-only on the edit page.
- `is_active` change → `503 SERVICE_UNAVAILABLE "Tenant status was not changed. Auth service is unavailable, please try again."` when auth-service is down. Nothing changed: keep the old toggle value and show the message.
- No change → `200` with the current tenant.

**POST /api/v1/tenants/{id}/admin-account** (Retry)

Response `200`:

```json
{ "tenant_id": "uuid", "admin_account": { "status": "CREATED", "user_status": "PENDING", "tenant_status_sync": "SYNCED" } }
```

Errors: `503 "Admin account was not created. Auth service is unavailable, please try again."`; `404 "Tenant not found."`. Safe to repeat.

## 7. Global error handling

| HTTP | Typical `code` | Source | FE behavior |
|---|---|---|---|
| 400 | `VALIDATION_ERROR`, `VALIDATION_FAILED`, `FIELD_IMMUTABLE`, `PASSWORD_POLICY_VIOLATION`, `INVALID_TOKEN` (reset) | service | Show `message` near the form or as an inline alert. Keep user input |
| 400 | `TENANT_RESOLUTION_FAILED`, `BAD_REQUEST` | gateway | Wrong host/config. Show generic error, log to console |
| 401 | `UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED` | gateway/auth | Run refresh flow (section 3.2). On login endpoint: `INVALID_CREDENTIALS` = wrong login |
| 403 | `FORBIDDEN`, `PERMISSION_DENIED` | gateway/service | Toast "Anda tidak punya akses untuk aksi ini". Do not log out |
| 403 | `PASSWORD_CHANGE_REQUIRED` | gateway | Route to Change Password page |
| 403 | `ACCOUNT_NOT_ACTIVE`, `ACCOUNT_NOT_READY` | auth (login) | Show message on login page |
| 404 | `RESOURCE_NOT_FOUND`, `SYSTEM_USER_NOT_FOUND`, `SYSTEM_ROLE_NOT_FOUND` | service | Detail page: "Data tidak ditemukan" + back button. List action: refresh list |
| 405 | `METHOD_NOT_ALLOWED` | master-data | Should not happen (no tenant delete button) |
| 409 | `RESOURCE_CONFLICT`, `*_EXISTS` | service | Show `message` (duplicate code, in-use delete) |
| 415 / 406 | `UNSUPPORTED_MEDIA_TYPE` / `NOT_ACCEPTABLE` | any | Bug in client headers. Always send JSON headers |
| 429 | `RATE_LIMIT_EXCEEDED`, `TOO_MANY_ATTEMPTS` | gateway/auth | "Terlalu banyak permintaan, coba lagi sebentar". Back off |
| 500 | `INTERNAL_SERVER_ERROR`, `INTERNAL_ERROR` | any | Generic error toast with the `X-Correlation-ID` from the response header (for support) |
| 502 | `INTERNAL_ERROR` (downstream failure) | gateway | "Layanan sedang bermasalah, coba lagi" |
| 503 | `SERVICE_UNAVAILABLE` | service/gateway | Show `message` as is (it explains what did not change). Offer retry |

Always read the `X-Correlation-ID` response header and include it in error toasts/logs.

## 8. Pages and the endpoints they use

| Page | Route (suggested) | Endpoints |
|---|---|---|
| Login | `/login` | POST auth/login → GET auth/me |
| Forgot password | `/forgot-password` | POST auth/forgot-password |
| Reset password | `/reset-password?token=...` | POST auth/reset-password |
| Change password (forced or voluntary) | `/account/password` | POST auth/change-password |
| My sessions | `/account/sessions` | GET/DELETE sessions |
| Dashboard | `/` | GET tenants?limit=5 (latest), counts from `pagination.total` of tenants, tenant-categories, countries |
| Tenants list | `/tenants` | GET tenants (filters: status, category, country, deployment type; search by exact code) |
| Tenant create | `/tenants/new` | GET tenant-categories, GET countries, POST tenants |
| Tenant detail | `/tenants/:id` | GET tenants/:id, PATCH tenants/:id, POST tenants/:id/admin-account |
| Tenant detail → Permissions tab | `/tenants/:id/permissions` | GET master-permissions, GET/PUT/PATCH tenants/:id/permissions |
| Tenant categories | `/tenant-categories` | GET/POST/PUT/DELETE tenant-categories |
| Countries | `/countries` | GET/POST/PUT/DELETE countries |
| System users | `/system-users`, `/system-users/:id` | system-users CRUD, status, reset-password, GET system-roles, admin sessions |
| System roles | `/system-roles`, `/system-roles/:id` | system-roles CRUD, GET/PUT permissions, GET master-permissions |
| Master permissions | `/master-permissions` | master-permissions CRUD |

List pages for master-data use server pagination (`page`, `limit`, `pagination.total_pages`). List pages for auth-service data use client-side pagination and search.

## 9. TypeScript types (reference)

```ts
// ---------- common ----------
export interface ApiError { code: string; message: string }

// auth-service envelope
export interface AuthEnvelope<T> { data: T }

// master-data list
export interface Pagination { page: number; limit: number; total: number; total_pages: number }
export interface PageResult<T> { data: T[]; pagination: Pagination }

// ---------- auth-service (camelCase) ----------
export interface LoginRequest { loginId: string; password: string }
export interface TokenResponse { accessToken: string }
export interface Me {
  userId: string; loginId: string; userType: 'SYSTEM_USER' | string;
  context: string | null; role: string; permissions: string[];
  tenant: { tenantId: string; name: string; logoUrl: string | null } | null;
  branches: { branchId: string; name: string }[];
  pwdChangeRequired: boolean;
}
export interface Session { sessionId: string; ipAddress: string; userAgent: string; lastActivityAt: string; createdAt: string; isCurrent: boolean }
export type UserAccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export interface SystemUser { id: string; loginId: string; systemRoleId: number; systemRoleKey: string; status: UserAccountStatus; createdAt: string; updatedAt: string }
export interface SystemRole { id: number; key: string; name: string; description: string | null; createdAt: string; updatedAt: string }
export interface SystemRoleRequest { key: string; name: string; description?: string; active?: boolean }
export interface MasterPermission { id: number; key: string; name: string; description: string | null; category: string; module: string; createdAt: string; updatedAt: string }
export interface MasterPermissionRequest { key: string; name: string; description?: string; category: string; module: string; active?: boolean; customerPermitted?: boolean }
export interface TenantPermission { id: number; masterPermissionId: number; masterPermissionKey: string; masterPermissionName: string; createdAt: string; updatedAt: string }

// ---------- master-data (snake_case) ----------
export interface Audit { created_at: string; created_by: string; updated_at: string; updated_by: string }
export interface TenantCategory extends Audit { id: string; code: string; name: string; description: string | null; is_active: boolean }
export interface Country extends Audit { code: string; name: string; nationality_name: string | null; phone_code: string | null; is_active: boolean }
export type DeploymentType = 'DEDICATED' | 'MULTI_TENANT';
export interface Tenant extends Audit {
  id: string; code: string; name: string; tenant_category_id: string; country_code: string | null;
  deployment_type: DeploymentType; multi_branch_enabled: boolean; tenant_admin_email: string;
  logo_url: string | null; is_active: boolean;
}
export interface CreateTenantRequest {
  code: string; name: string; tenant_category_id: string; country_code?: string;
  deployment_type: DeploymentType; multi_branch_enabled?: boolean; tenant_admin_email: string; logo_url?: string;
}
export interface AdminAccount { status: 'CREATED' | 'FAILED'; user_id: string | null; message: string; tenant_status_sync?: 'SYNCED' | 'FAILED' }
export interface TenantCreated extends Tenant { default_branch_types: { id: string; code: string; name: string }[]; admin_account: AdminAccount }
export interface TenantDetail extends Tenant {
  tenant_category: { id: string; code: string; name: string };
  country: { code: string; name: string; phone_code: string | null } | null;
  social_links: { id: string; platform_name: string; url: string }[];
}
export interface PatchTenantRequest { is_active?: boolean; logo_url?: string | null; country_code?: string | null }
export interface AdminAccountRetry { tenant_id: string; admin_account: { status: 'CREATED'; user_status: string; tenant_status_sync: 'SYNCED' | 'FAILED' } }
```

## 10. API client reference implementation

```ts
// api/client.ts
const BASE = import.meta.env.VITE_API_BASE_URL ?? ''; // '' when using the dev proxy

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

export const setToken = (t: string | null) => { accessToken = t; };

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public correlationId?: string) { super(message); }
}

async function doRefresh(): Promise<boolean> {
  const res = await fetch(`${BASE}/api/v1/auth/refresh`, {
    method: 'POST', credentials: 'include', headers: { Accept: 'application/json' },
  });
  if (!res.ok) { setToken(null); return false; }
  const body = await res.json();
  setToken(body.data.accessToken);
  return true;
}

function refreshOnce(): Promise<boolean> {
  if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...(init.headers as Record<string, string>) };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });

  const isAuthEndpoint = path.startsWith('/api/v1/auth/login') || path.startsWith('/api/v1/auth/refresh');
  if (res.status === 401 && retry && !isAuthEndpoint) {
    if (await refreshOnce()) return api<T>(path, init, false);
    window.location.assign('/login');
    throw new HttpError(401, 'UNAUTHORIZED', 'Session expired');
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new HttpError(res.status, body?.code ?? 'UNKNOWN', body?.message ?? res.statusText,
      res.headers.get('X-Correlation-ID') ?? undefined);
  }
  return body as T;
}

// auth-service helpers unwrap { data }
export const authApi = async <T>(path: string, init?: RequestInit) => (await api<{ data: T }>(path, init)).data;
// master-data helpers return the body as is
export const mdApi = api;
```

Usage examples:

```ts
// login
const { accessToken } = await authApi<TokenResponse>('/api/v1/auth/login', {
  method: 'POST', body: JSON.stringify({ loginId, password }),
});
setToken(accessToken);
const me = await authApi<Me>('/api/v1/auth/me');

// tenants list
const page = await mdApi<PageResult<Tenant>>(`/api/v1/tenants?page=${p}&limit=20&is_active=true`);

// create tenant
const created = await mdApi<TenantCreated>('/api/v1/tenants', { method: 'POST', body: JSON.stringify(form) });
if (created.admin_account.status === 'FAILED' || created.admin_account.tenant_status_sync === 'FAILED') {
  // show warning + Retry button -> POST /api/v1/tenants/{id}/admin-account
}

// deactivate tenant
await mdApi<Tenant>(`/api/v1/tenants/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active: false }) });
```

Recommended stack (not mandatory): React + TypeScript + Vite, TanStack Query for server state (invalidate the list after create/update/delete), React Hook Form + Zod for forms (mirror the validation rules in sections 5 and 6), a component library of choice.

## 11. Known limitations and notes

- auth-service lists (system users, roles, master permissions, tenant permissions) are not paginated. Do client-side pagination.
- master-data list search is exact-match on `code` (tenants, categories). Countries support `search` on name. No free-text tenant search on the server.
- Tenants cannot be deleted (405). Use deactivate.
- Creating a tenant can succeed while the admin account fails. Always check `admin_account` and offer Retry.
- PATCH `is_active` and admin-account retry depend on auth-service; they return 503 when it is down.
- Tenant registration settings need a tenant role id, and SP cannot list tenant roles. Treat as phase 2.
- Branch types, branches, facilities and social links are not part of this app (403 for SP).
- Read responses of master-data may carry `Cache-Control: private, no-store`. Do not add an HTTP cache layer; rely on TanStack Query in-memory cache.
- Patient (CUSTOMER) and staff (EMPLOYEE) flows are not in scope.

## 12. Acceptance checklist for the generated app

- [ ] All calls go to the gateway base URL (or the dev proxy). No direct service URL anywhere.
- [ ] No `X-User-ID`, `X-Role`, `X-Tenant-ID`, `X-Service-Token` header is ever sent.
- [ ] Access token kept in memory only; refresh via cookie with `credentials: 'include'`; single-flight refresh; reload keeps the session through `POST /auth/refresh`.
- [ ] `pwdChangeRequired = true` blocks the app until the password is changed.
- [ ] Menus and buttons follow `me.permissions` (section 4).
- [ ] camelCase (auth-service) and snake_case (master-data) mapped correctly; auth `{ data }` unwrapped.
- [ ] master-data lists use server pagination; auth lists use client pagination.
- [ ] Edit forms show immutable fields read-only and never send them (`code` everywhere; tenant fields listed in 6.3).
- [ ] Tenant create handles all three `admin_account` outcomes; Retry button works.
- [ ] PATCH `is_active` reverts the toggle and shows the message on 503.
- [ ] Error handling follows section 7; errors show `X-Correlation-ID`.
- [ ] Confirm dialogs for delete, deactivate, suspend, reset password, force logout.
- [ ] Logout clears memory and cached queries.

## 13. Smoke test (local)

```bash
LOGIN_ID='principal@example.com'; PASSWORD='***'
TOKEN=$(curl -s -H "Host: system.gaia.localhost" -H "Content-Type: application/json" \
  -d "{\"loginId\":\"$LOGIN_ID\",\"password\":\"$PASSWORD\"}" \
  http://localhost:8080/api/v1/auth/login | jq -r '.data.accessToken')
curl -s -H "Host: system.gaia.localhost" -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/auth/me" | jq
curl -s -H "Host: system.gaia.localhost" -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/v1/tenants?page=1&limit=5" | jq '.pagination'
```

Expected: `me` returns `permissions`; tenants returns a `pagination` object with `HTTP 200`.
