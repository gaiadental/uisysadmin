---
id: ARCH-FE-001
title: System Principal Web — Frontend Architecture
owner: architect_frontend
status: Approved
version: 1.0.13
last_updated: 2026-10-15
artifact_kind: target
source_requirements: [RAG-FE-SP-001]
related_artifacts: [PROJECT-PROFILE, CLARIFICATIONS, ORCHESTRATION-STATE, PLATFORM-ARCH-SOLUTION-001, PLATFORM-ARCH-SEC-001, PLATFORM-ARCH-BE-001, PLATFORM-ADR-009, GW-ARCH-SEC-002, GW-ARCH-BE-002, AUTH-ARCH-SEC-001, AUTH-ARCH-SEC-003, AUTH-ARCH-BE-003, MDS-API-REFERENCE-v1.3]
blocking_open_questions: 0
---

Title: System Principal Web — Frontend Architecture

Owner: architect_frontend

Status: Approved

Version: 1.0.13

Last Updated: 2026-10-15

Source Requirements:
- RAG-FE-SP-001 "[FE Requirement] system-principal-web v1.0" (sections 0–13): the API integration contract (referred to below as "FE doc")
- REQ-FE-001 to REQ-FE-056 (assigned in this document, see Requirements Addressed)

Related Artifacts:
- Platform clarifications SP-BG-13 (Closed 2026-10-14) and SP-BG-14 (Closed 2026-10-15, user decision), `../Microservices/gaia-platform-architecture/output/clarifications.md` v1.2
- This repository: `output/project-profile.md`, `output/clarifications.md`, `output/plans/orchestration-state.md`
- Platform, read-only (`../Microservices/gaia-platform-architecture/output/`): `architecture/ARCH-SOLUTION-001.md` v1.1, `architecture/ARCH-SEC-001.md` v0.4, `architecture/ARCH-BE-001.md` v0.2, `decisions/ADR-009`, `clarifications.md` (SP-DEC-01), `plans/orchestration-state.md`
- Gateway (`../Microservices/apigateway/output/architecture/`): `ARCH-SEC-002.md`, `ARCH-BE-002.md`; operator host table `apigateway/edge-dev.local.yml` (git-excluded, read 2026-10-10)
- auth-service (`../Microservices/auth-service/output/architecture/`): `ARCH-SEC-001.md`, `ARCH-SEC-003.md`, `ARCH-BE-003.md`
- master-data-service: `output/docs/api-reference.md` v1.3

Version History:
- v0.1 (Draft, 2026-10-10): first full draft; 13 Blocking open questions on the stack, the topology and the dependency set.
- v0.2 (Draft, 2026-10-10): base stack accepted (Vite 8 SPA, npm, Tailwind 4, Base UI under shadcn, Zod 4, TypeScript 6); TanStack Query, React Hook Form, Vitest with RTL and MSW adopted; fetch client and first-party login accepted as deviations; same-origin topology recommended; dependency justifications (Table 5); ADR candidate list added. FE-OQ-01 to FE-OQ-13 answered; Blocking count 0.
- v1.0 (Approved, 2026-10-10): approved by the user at the Checkpoint A gate, 2026-10-10.
- v1.0.1 (Approved, 2026-10-10): wording-only corrections: FE-OQ-37 answered (History API path routes, no routing library; Checkpoint B gate, ADR-001 v1.0.1 OQ2); D15 and RK-FE-10 cite OQ-P-09 for the dependency audit; version history rows added; SD-01 and A-10 updated to the FE-OQ-37 answer; non-blocking count changed from 24 to 23 (At a Glance and Blocking summary).
- v1.0.3 (Approved, 2026-10-12): user-approved design change: SYS_PRINCIPAL role locked statically in the UI (no deactivate, delete or permission change), replacing refusal-driven disable; own account offers no deactivate or delete. Sections: REQ-FE-033, D6.6, Table 2 (tim-peran), BG-06 (SP-BG-13).
- v1.0.4 (Approved, 2026-10-12; user approval "Setuju ARCH-FE-001 v1.0.4 dan TODO-021"): user product decision 2026-10-12: Katalog > Permission (`/master-permissions`) becomes read-only. Create, activate/deactivate and delete of master permissions are removed; list, detail and edit of name and description stay. Tenant permission activate/deactivate (`tenant_permissions:*`) is not affected. Sections: REQ-FE-035, D5.3, D6.4, D7, D8 Table 2 (katalog-permission), D9, D12.1, BG-12 (new), FE-OQ-32, FE-OQ-38 (new).
- v1.0.5 (Approved, 2026-10-14; user approval "Setuju v1.0.5" recorded 2026-10-14; amendment drafted for TODO-022): user decision 2026-10-14 (a) hides the "Sesi aktif" tab and force logout for other accounts until platform item SP-BG-14 is Closed (the endpoint `/api/v1/admin/users/{userId}/sessions` serves tenant employees only and returns 404 for a system user), with a link to `/account/sessions` on the own account; (b) replaces "server message shown as is" with Indonesian copy mapped by status and `code` for the auth-service guard refusals closed in SP-BG-13. **Supersedes SP-BG-13's "No FE code change"** (platform `clarifications.md` v1.2) and the v1.0.3 line in D6.6 that said a refusal for `PLATFORM_ROLE_PROTECTED` still shows the server message. Sections: REQ-FE-032 (changed), REQ-FE-052 and REQ-FE-053 (new), D4.10, D6.6, D7, D8 Table 2 (sistem-sesi), D13 (rows CONFLICT, UNAVAILABLE, FORBIDDEN; new D13.1), D2 pointer, Table 3 (BG-13 new), FE-OQ-22, FE-OQ-39 and FE-OQ-40 (new). The fallthrough rule (D13.1, REQ-FE-053) was added at approval by user instruction: on Tim IT pages a 409 or 503 with an unrecognised code uses fixed Indonesian copy, never server text. Approved by the user 2026-10-14.
- v1.0.6 (Approved, 2026-10-14; user approval recorded 2026-10-14; FE-OQ-41 and FE-OQ-42 answered with their documented defaults, non-blocking count changed from 26 to 24; the backend gap on `DELETE /system-users/{id}` and `PLATFORM_ROLE_PROTECTED` is taken by the user separately to the platform): user decision 2026-10-14: the system account pages (Tim IT > Akun) have no "Hapus" action in the list row or on the detail page. Reason: in auth-service `DELETE /api/v1/system-users/{id}` only sets status `DEACTIVATED` (no hard or soft delete), the same result as "Nonaktifkan", so the label is misleading. Suspend ("Tangguhkan") and deactivate ("Nonaktifkan") stay, and their confirm dialogs get explanatory text. `deleteSystemUser` may stay in the API module but no UI calls it. Sections: REQ-FE-030, REQ-FE-031, REQ-FE-039 (changed), REQ-FE-054 (new), D6.4, D6.6, D7 (routes and confirm dialogs), D8 Table 2 (tim-akun), D12.1, D13.1 (new reachability table), D19, FE-OQ-41 and FE-OQ-42 (new). Role delete, tenant category delete and country delete are unchanged.
- v1.0.7 (Approved, 2026-10-14; user-ordered correction to v1.0.6 by user order 2026-10-14, no new design decision; bumped only to keep the history traceable, as for v1.0.1): on Tim IT pages (system accounts and system roles) the server message is never shown. `403 ROLE_GUARD_VIOLATION` on system role pages now uses the same fixed copy as `PLATFORM_ROLE_PROTECTED` in the role context, and the role is still marked refused (refused-roles, edit and delete disabled) as today. Test requirement added. Confirms (no change) that the own-account sessions entry in REQ-FE-052 and D4.10 is a link (`AppLink`) to `/account/sessions`. Sections: REQ-FE-053, D13 (rows FORBIDDEN, GUARD), D13.1. No Open Questions row existed for `ROLE_GUARD_VIOLATION` in this document (the questions OQ1 and OQ2 live only in the TODO-022 review and QA reports), so none is added or closed here.
- v1.0.8 (Approved, 2026-10-15; user approval 2026-10-15 with one adjustment): a refresh or `GET /api/v1/auth/me` that fails with 403 `ACCOUNT_NOT_ACTIVE` or 403 `ACCOUNT_NOT_READY` ends the session. The user goes to the login page with a notice for that code. The login page shows fixed Indonesian copy for both codes and never the server `message`. The change follows the manual test of 2026-10-15 against platform SP-BG-13. Sections: REQ-FE-055 (new), D4.2, D4.3, D4.5, D6.5, D13 (ACCOUNT row), FE-OQ-43 to FE-OQ-45 (new). User adjustment: FE-OQ-44 is yes, so `ACCOUNT_NOT_READY` also ends the session (the first draft limited the session end to `ACCOUNT_NOT_ACTIVE`). FE-OQ-45 is recorded: the gateway checks the session per request (30-second cache), so a data request after a suspend gets 401, then refresh gets 403 and the session ends.
- v1.0.9 (Approved, 2026-10-15; user decision 2026-10-15 "opsi 2"): the session end for 403 `ACCOUNT_NOT_ACTIVE` and 403 `ACCOUNT_NOT_READY` (REQ-FE-055) applies to every refresh and every `GET /api/v1/auth/me` that fails with that code, wherever the call happens: at boot, and after a kept-session password change (`keepCurrentSession = true`, `refreshMe`). The user goes to `/login` with the notice for that code. Sections: REQ-FE-055, D4.6. Reason: review M2 and QA M2 of TODO-024. The M2 scope question is answered by this version (the rule covers the `me` call after a kept-session password change, not only boot). No Open Questions row is added.
- v1.0.10 (Approved, 2026-10-15; user decision 2026-10-15): a refresh (`POST /api/v1/auth/refresh`) that answers 401 with any error code ends the session: token and cache cleared, status `anonymous`, route to `/login` with no account notice. `AUTH_EXPIRY_CODES` (`UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED`) remains only the trigger that makes a data call run a refresh; it no longer decides the outcome of the refresh call. The 403 rule for `ACCOUNT_NOT_ACTIVE` and `ACCOUNT_NOT_READY` (REQ-FE-055) is unchanged. Reason: TODO-024 manual test failed (suspend mid-session: data call 401, refresh 401 `SESSION_TERMINATED`, error screen instead of login); found 2026-10-15. Sections: REQ-FE-010, D4.2, D4.3, D4.4. No Open Questions row is added; Blocking summary unchanged (0 blocking).
- v1.0.11 (Approved, 2026-10-15; user decision 2026-10-15, L9): at boot, `GET /api/v1/auth/me` that answers 401 with any error code removes the token from memory and gives status `anonymous`: route to `/login` with no account notice. This is the same rule as a refresh 401 (D4.3, v1.0.10). The 403 rule for `ACCOUNT_NOT_ACTIVE` and `ACCOUNT_NOT_READY` (REQ-FE-055) is unchanged. Reason: TODO-024 code review (L9) and QA. Sections: D4.2, Open Questions (FE-OQ-46 new, non-blocking). Blocking summary: 0 blocking, non-blocking count changed from 24 to 25.
- v1.0.12 (Approved, 2026-10-15; user decision 2026-10-15): a public route marked guest-only, opened with status `authenticated`, redirects (replace) to the dashboard `/`. Guest-only routes are `/login` and `/forgot-password`; `/reset-password` (e-mail link) is not guest-only and is unchanged. Status `passwordChangeRequired` keeps REQ-FE-012; `unknown`, `error` and `anonymous` are unchanged. Reason: bug report 2026-10-15, an authenticated user who opened `/login` (second tab, typed URL) saw the login form inside the authenticated layout. Sections: Requirements Addressed (REQ-FE-056 new), D6.1, D10. Implemented in TODO-025. No new open question; blocking count 0 and non-blocking count 25 unchanged.
- v1.0.13 (Approved, 2026-10-15; user decision 2026-10-15): platform item SP-BG-14 is Closed (user decision 2026-10-15). `OTHER_ACCOUNT_SESSIONS_ENABLED` becomes `true`: the "Sesi aktif" tab and the "Paksa keluar" action on `/system-users/:id` are enabled for another account, on `GET` and `DELETE /api/v1/system-users/{id}/sessions` (`sessions:view`, `sessions:revoke`). The own account keeps the link to `/account/sessions` and gets no tab and no force logout. Force logout for a principal target follows the suspend and role-change pattern (button visible, the server decides). Fact recorded in D4.10: `GET` has no principal protection and never answers 403 `PLATFORM_ROLE_PROTECTED`. Route labels `admin.sessions.*` are unchanged. Supersedes the v1.0.5 suspension of the sessions tab. Sections: Requirements Addressed (REQ-FE-032 and REQ-FE-052 changed), D4.10, D7, D8 Table 2 (sistem-sesi), Table 3 (BG-13 Closed), FE-OQ-39 (Answered). Implemented in TODO-026. No new open question; blocking count 0 and non-blocking count 25 unchanged (FE-OQ-39 was already counted as answered).

## At a Glance

- Frontend architecture for the System Principal (SP) web app in this repository: a Vite + React single-page app that talks only to the GAIA API Gateway. Covers topology, auth and session, gating, the API layer, server state, forms, tests, the mock-to-contract replacement plan, errors, security and accessibility.
- Accepted base stack: Vite 8 SPA, React 19, TypeScript 6, npm, Tailwind 4, Base UI under shadcn/ui, Zod 4. Mandatory tools adopted: TanStack Query 5, React Hook Form with the Zod resolver, Vitest with React Testing Library, MSW 2.x. Accepted deviations: fetch client (no Axios) and first-party login (no NextAuth).
- Status: Approved v1.0 at Checkpoint A (user approval 2026-10-10); v1.0.4 (master permissions read-only) is Approved (user approval 2026-10-12); v1.0.5 (sessions tab hidden for other accounts, guard-failure copy and fallthrough rule) is Approved (user approval 2026-10-14); v1.0.6 (no "Hapus" on system accounts, explanatory text in suspend and deactivate dialogs) is Approved (user approval 2026-10-14); v1.0.7 (`ROLE_GUARD_VIOLATION` fixed copy on role pages) is a user-ordered correction, Approved; v1.0.8 (session end and fixed copy for `ACCOUNT_NOT_ACTIVE` and `ACCOUNT_NOT_READY` on login, refresh and `me`) is Approved (user approval 2026-10-15); v1.0.9 (session end for `ACCOUNT_NOT_ACTIVE` and `ACCOUNT_NOT_READY` also at boot and after a kept-session password change) is Approved (user decision 2026-10-15); v1.0.10 (a refresh 401 with any code ends the session with no account notice; `AUTH_EXPIRY_CODES` is only the data-call trigger) is Approved (user decision 2026-10-15); v1.0.11 (a boot `me` 401 with any code ends the session as `anonymous`, no account notice) is Approved (user decision 2026-10-15); v1.0.12 (guest-only public routes `/login` and `/forgot-password` redirect an authenticated user to `/`) is Approved (user decision 2026-10-15); v1.0.13 (sessions of another system account enabled: SP-BG-14 Closed, `OTHER_ACCOUNT_SESSIONS_ENABLED = true`, calls on `/api/v1/system-users/{id}/sessions`) is Approved (user decision 2026-10-15). 0 Blocking open questions. 25 non-blocking open questions, with documented defaults. FE-OQ-01 to FE-OQ-13 are answered. The seven ADR candidates are Pending Approval for /decision.
- Topology: same-origin path routing. One SP host per environment serves the static FE and sends `/api/*` to the gateway. Same-site sibling subdomains are the second option. Cross-site is not supported.
- Platform impact: none. No platform artifact is modified. Backend needs are listed in Table 3 (BG-01 to BG-13) for routing only.
- Scope: the platform frontend Domain Scope is Cancelled by design (split decision). See C-07.

## Purpose

Define how the SP web app is built, so a developer can implement it from this document and the FE doc without re-deciding transport, authentication, gating, error handling, tooling, or how the mock UI is replaced. The FE doc is the contract. This document elaborates it for this repository and records every point where the repository or the stack standard differs from it, and how each difference is resolved.

## Scope

In scope:
- Every screen in FE doc section 8, plus the login and account screens required by sections 3.3 and 3.4.
- Repository files: `src/`, `vite.config.ts`, `index.html`, `tsconfig.app.json`, `package.json` (dependency set and conformance only), environment variables.
- Replacement plan for every mock data file and every mock page (Table 2).
- Deployment requirements for the SP host and the operator edge file (REQ-FE-047).

Out of scope:
- Platform services (gateway, auth-service, master-data-service): referenced by ID and section, not duplicated.
- Visual design and UI copy approval (Product Designer, FE-OQ-22).
- Branch types, branches, facilities, tenant social links, patient and employee flows (FE doc sections 6 and 11: not part of this app, or 403 for SP).
- Deployment of the static host (FE-OQ-20 covers the header and CSP inputs; FE-OQ-36 covers domain names).

## References

Governance (rule files, loaded by path under `.claude/rules/`):
- `agent-governance.md`, `artifact-standards.md`, `artifact-templates/artifact-templates-design.md` (Domain template), `architecture-principles.md`, `coding-standards.md`, `standards-frontend.md`, `tech-stack-frontend.md`, `tech-stack-security.md`, `tech-stack-integration.md`, `document-encoding.md`

Platform and service facts relied on (cited, not copied):
- Platform ARCH-SEC-001 v0.4: section 2.5 (identity cache, 30 s maximum, fail closed with 503); section 4.6 (host table) and 4.7 (per-origin CORS); section 9.2 c and 9.6 (`SYS_PRINCIPAL` maps to the edge role SYSTEM_PRINCIPAL; `SYS_ADMIN` and `SYS_SUPPORT` receive no edge role); section 10 items 3 and 4 (seeded credentials, SEC-OQ-13).
- Platform ARCH-SOLUTION-001 v1.1: BD-05, BD-06 (identity headers), BD-16 (per-request identity check); Domain Scope frontend = Cancelled (unchanged, see C-07).
- Gateway ARCH-SEC-002: SC2-HDR-01 to SC2-HDR-14 (header strip and forward rules; SC2-HDR-10 and SC2-HDR-11 for `Cookie` and `Set-Cookie`; SC2-HDR-13 removes downstream `Access-Control-*` headers); SC2-CORS-01 to SC2-CORS-06 (CORS per exact origin; SC2-CORS-05 unsafe-method `Origin` check, E-33, which never rejects the host's own origin).
- Gateway ARCH-BE-002 section 6 (host table) and section 13 (error vocabulary and envelope; `UNAUTHORIZED` 401, `FORBIDDEN` 403, `PASSWORD_CHANGE_REQUIRED` 403, `SERVICE_UNAVAILABLE` 503, `RATE_LIMIT_EXCEEDED` 429, `RESOURCE_NOT_FOUND` 404; `Cache-Control: no-store` on gateway errors).
- auth-service ARCH-SEC-001 section 3 (refresh rotation; reuse detection is mandatory and cannot be disabled) and section 8 (revocation effects: a reused token revokes every token in its rotation chain, deactivates the sessions that reference them, and blacklists the user's active access-token `jti`s).
- auth-service ARCH-SEC-003 section 10 (refresh cookie: `HttpOnly; Secure; SameSite=Strict`, host-only with no `Domain`, path `/api/v1/auth/refresh`, names `gaia_rt_emp`, `gaia_rt_cus`, `gaia_rt_sys`; SC-CK-09: same-site is not same-origin).
- auth-service ARCH-BE-003: endpoint inventory (login, refresh, logout, me, change-password, forgot-password, reset-password, sessions, system-users, system-roles, master-permissions, tenant permissions, registration settings). Verified against the controllers on 2026-10-10.
- master-data-service `api-reference.md` v1.3: section 6.5 (`Cache-Control: private, no-store` on countries and other reads); tenant, tenant-category and country endpoints.
- Platform clarifications register SP-DEC-01 (2026-10-10): interim master-data access rule (SYS_PRINCIPAL only).

## Requirements Addressed

Greenfield repository: this table is the requirement source for the SP web. Each row traces to the FE doc section (or to the stack standard where the FE doc is silent).

| ID | Requirement | Source | Design |
|----|-------------|--------|--------|
| REQ-FE-001 | The browser calls only the gateway base URL (or the dev proxy, or the same-origin `/api/*` path in production). No direct service URL. | FE doc 0 rule 1, 1 | D1 |
| REQ-FE-002 | Dev server on port 3000 with `strictPort`; `/api` proxied to the gateway with Host rewrite; relative base URL in dev. | FE doc 1.1; ARCH-SEC-002 SC2-CORS-05 | D1.1 |
| REQ-FE-003 | Base URL from an environment variable per environment; HTTPS only in staging and production; not hard-coded. | FE doc 1 | D1.2 |
| REQ-FE-004 | Only the documented request headers are sent. `X-User-ID`, `X-Role`, `X-Tenant-ID`, `X-Service-Token` are never sent. | FE doc 0 rules 2 and 3 | D3 |
| REQ-FE-005 | The access token is held in memory only (no `localStorage`, `sessionStorage`, readable cookie). | FE doc 0 rule 4, 3.1 | D4.1, D4.11 |
| REQ-FE-006 | Requests use `credentials: 'include'`. The FE never reads or sets the refresh cookie. | FE doc 0 rule 5, 3.1 | D4.3 |
| REQ-FE-007 | The two JSON conventions (camelCase with `data` envelope; snake_case unwrapped) are mapped in the API layer, not in components. | FE doc 0 rule 6, 2 | D5 |
| REQ-FE-008 | Error handling branches on HTTP status and `code`, never on message text. The correlation id is shown and logged. | FE doc 0 rule 8, 2.3, 7 | D13 |
| REQ-FE-009 | Login with the error mapping of FE doc 3.3. The tenant id is never sent for the system app. | FE doc 3.2, 3.3 | D4.5 |
| REQ-FE-010 | Refresh is single-flight; a refreshed request is retried once; a second 401 logs out. A 401 from the refresh call itself, with any error code, ends the session: token and cache cleared, status `anonymous`, route to `/login` with no account notice (`AUTH_EXPIRY_CODES` does not decide this; it only triggers a refresh for a data call). | FE doc 3.2; user decision 2026-10-15 (v1.0.10) | D4.2, D4.3, D4.4 |
| REQ-FE-011 | App start and reload call refresh, then `me`. | FE doc 3.2 | D4.2 |
| REQ-FE-012 | `pwdChangeRequired = true` blocks every route except change password. `PASSWORD_CHANGE_REQUIRED` routes to the same page. | FE doc 3.2, 7 | D4.6 |
| REQ-FE-013 | Change password supports both `keepCurrentSession` outcomes. | FE doc 3.3 | D4.6 |
| REQ-FE-014 | Forgot password shows the same neutral message for every input. | FE doc 3.3 | D4.7 |
| REQ-FE-015 | Reset password reads the token from the link; invalid or expired tokens are handled. | FE doc 3.3 | D4.7 |
| REQ-FE-016 | Logout clears the memory token and all cached data, then goes to login. | FE doc 3.3, 12 | D4.8, D12.2 |
| REQ-FE-017 | My sessions: list; revoke one (never the current one); revoke all others. | FE doc 3.4 | D4.9 |
| REQ-FE-018 | Menus, routes and actions for auth-service screens are gated by `me.permissions`. | FE doc 4 | D6 |
| REQ-FE-019 | Master-data screens (tenants, tenant categories, countries) are visible only to SYS_PRINCIPAL (interim). | FE doc 4 as narrowed by SP-DEC-01 | D6.2 |
| REQ-FE-020 | Tenant list uses server pagination and the documented filters; name search is not offered. | FE doc 6.3, 8, 11 | D8.1 |
| REQ-FE-021 | Tenant create: documented fields and rules; the three `admin_account` outcomes; retry. | FE doc 6.3 | D8.2 |
| REQ-FE-022 | Tenant detail: immutable fields read-only; PATCH sends only the three allowed fields. | FE doc 6.3 | D8.2 |
| REQ-FE-023 | The `is_active` toggle reverts and shows the message on 503. No optimistic update. | FE doc 6.3 | D8.2 |
| REQ-FE-024 | Admin-account retry is offered where needed and is safe to repeat. | FE doc 6.3 | D8.2 |
| REQ-FE-025 | No tenant delete control. Deactivate with PATCH `is_active=false`. | FE doc 6.3, 11 | D8.2 |
| REQ-FE-026 | Tenant detail Permissions tab: list, full replacement (PUT), single toggle (PATCH). | FE doc 5.4 | D7 |
| REQ-FE-027 | Registration settings are an optional phase 2 feature and are not routed in v1. | FE doc 5.5 | D7 |
| REQ-FE-028 | Tenant categories: list, create, edit, delete. `code` is immutable after create. | FE doc 6.1 | D7 |
| REQ-FE-029 | Countries: list, create, edit, delete. Path key is `code`; input is uppercased. | FE doc 6.2 | D7, D9 |
| REQ-FE-030 | System users: list, detail, create, role change, status change, reset password. No delete (REQ-FE-054). | FE doc 5.1 | D7 |
| REQ-FE-031 | System users: role options from system roles; no suspend or deactivate of the own account. | FE doc 5.1 | D6.6 |
| REQ-FE-032 | Another user's sessions: view and force logout on the user detail page, for another account only, behind the flag `OTHER_ACCOUNT_SESSIONS_ENABLED`, which is `true` since SP-BG-14 is Closed (v1.0.13; it was `false` in v1.0.5 to v1.0.12). Calls: `GET` and `DELETE /api/v1/system-users/{id}/sessions`. The own account has no tab and no force logout (REQ-FE-052). | FE doc 5.6; SP-BG-14 (Closed 2026-10-15) | D4.10 |
| REQ-FE-033 | System roles: list, create, edit, delete. The SYS_PRINCIPAL role is locked statically in the UI (no deactivate, delete or permission change). | FE doc 5.2 | D6.6 |
| REQ-FE-034 | Role permission checklist from the master permission catalogue, saved with one PUT. | FE doc 5.2 | D7 |
| REQ-FE-035 | Master permissions are read-only in the UI: list, detail, and edit of name and description only. No create, no activate/deactivate, no delete (user decision 2026-10-12; catalogue changes ship as Flyway migrations with the feature that uses them). Tenant permission activate/deactivate (`tenant_permissions:*`) is unaffected. | FE doc 5.3 | D6.4, D7 |
| REQ-FE-036 | Pagination model: master-data server-side (`page`, `limit`); auth-service lists client-side. | FE doc 2.1, 2.2, 8 | D5.4 |
| REQ-FE-037 | Dashboard counts come from `pagination.total`. | FE doc 8 | D7 |
| REQ-FE-038 | Every async operation has loading, empty and error states. No automatic retry of reads or writes. | FE doc 7; tech-stack-frontend API Integration Standard | D3.1, D13 |
| REQ-FE-039 | Confirm dialogs for delete (tenant categories, countries, system roles; not system accounts, REQ-FE-054), deactivate, suspend, reset password and force logout. | FE doc 12 | D7 |
| REQ-FE-040 | Immutable fields are never sent (`code` everywhere; tenant fields of FE doc 6.3). | FE doc 6.1, 6.2, 6.3, 12 | D5.3 |
| REQ-FE-041 | Branch types, branches, facilities, social links, patient and employee flows are not built. | FE doc 6, 11 | D2 |
| REQ-FE-042 | The acceptance checklist (FE doc 12) and smoke test (FE doc 13) are test requirements. | FE doc 12, 13 | D19 |
| REQ-FE-043 | No HTTP or browser cache layer for master-data reads; in-memory server-state cache only, cleared on logout. | FE doc 11 | D12 |
| REQ-FE-044 | CSP, frame policy and referrer policy are coordinated with `security-architect` before production. | tech-stack-frontend Security Standard | D15 |
| REQ-FE-045 | WCAG 2.1 Level AA considerations for all user-facing UI. | tech-stack-frontend Accessibility Standard | D16 |
| REQ-FE-046 | Client logs contain no tokens, passwords, bodies or personal data (e-mail addresses are personal data). | tech-stack-frontend Logging Standard; tech-stack-security | D18 |
| REQ-FE-047 | Same-origin deployment: the operator edge file per environment contains the SP host with context SYSTEM; the reverse proxy passes the Host header unchanged and sends only `/api/` to the gateway. The fallback topology needs same-site hosts and listed origins. | Coordinator direction v0.2; ARCH-SEC-002 SC2-CORS-05, SC2-HDR-11; ARCH-SEC-003 SC-CK-01, SC-CK-09 | D1.2 |
| REQ-FE-048 | After every mutation, invalidate every server-state query that the mutation affects (table in D12.1). | tech-stack-frontend Server State Standard; FE-OQ-08 | D12.1 |
| REQ-FE-049 | Every form uses React Hook Form with the Zod resolver; validation schemas are Zod 4 schemas. | tech-stack-frontend Form Validation Standard; FE-OQ-10 | D9 |
| REQ-FE-050 | `api/client.ts` has Vitest unit tests for single-flight refresh, 401 then refresh then retry, 204 handling and error mapping to `{code, message}`. API integration tests use MSW 2.x. | tech-stack-frontend Testing Standard; FE-OQ-12 | D19 |
| REQ-FE-051 | TypeScript strict options required by the standard are enabled (`exactOptionalPropertyTypes`, `noImplicitReturns`, `forceConsistentCasingInFileNames`, `resolveJsonModule`). | tech-stack-frontend TypeScript Configuration Standard; FE-OQ-06 | D1.3 |
| REQ-FE-052 | On `/system-users/:id`, with `OTHER_ACCOUNT_SESSIONS_ENABLED` `true` (v1.0.13): another account shows the "Sesi aktif" tab (needs `sessions:view`) and the "Paksa keluar" action (needs `sessions:revoke`). The own account shows no tab and no force-logout action, only a link to `/account/sessions` ("Sesi saya"). The flag is one constant that cites SP-BG-14 (Closed). | User decision 2026-10-14 (v1.0.5); user decision 2026-10-15 (v1.0.13); SP-BG-14 | D4.10, D7 |
| REQ-FE-053 | Guard refusals from auth-service show fixed Indonesian copy, never the raw server `message`, mapped by HTTP status and `code` (not message text), from one shared module `features/team/shared/guard-failure.ts` used by `user-failure.ts` and `role-failure.ts`. A 409 or 503 with an unrecognised `code` on these pages also uses fixed Indonesian copy (no server text, reference id still shown); `describeWriteFailure` in `tenants/create/write-failure.ts` is unchanged because tenant pages use it. `403 PLATFORM_ROLE_PROTECTED` has two copies by context (role pages, account pages). `403 ROLE_GUARD_VIOLATION` on role pages uses the role-context `PLATFORM_ROLE_PROTECTED` copy and still marks the role refused (v1.0.7, user order 2026-10-14: on Tim IT pages the server message is never shown). Each code has a component test, plus one test that proves the two contexts differ and one that the mapping is not used on tenant paths. Scope: system account and system role pages only (FE-OQ-40). | User decision 2026-10-14; SP-BG-13 (Closed) | D13.1 |
| REQ-FE-054 | System account pages (Tim IT > Akun) offer no "Hapus" action, on the list row or on the detail page, and no code path in the UI calls `deleteSystemUser` (the function may stay in `lib/api/modules/system-users.ts`). No UI gate uses `system_users:delete`. Reason: auth-service `DELETE /api/v1/system-users/{id}` only sets status `DEACTIVATED`, identical to deactivate. The confirm dialogs carry this text. Suspend, title `Tangguhkan akun {loginId}?`: "Blokir sementara akun ini, misalnya saat cuti atau investigasi. Semua sesinya diakhiri. Bisa diaktifkan kembali." Deactivate, title `Nonaktifkan akun {loginId}?`: "Untuk anggota yang sudah tidak bertugas. Semua sesinya diakhiri. Bisa diaktifkan kembali bila diperlukan." The old description "Akun akan dihapus dari platform." and the toast "Akun dihapus." are removed. Tests: no "Hapus" control on list row or detail for a user holding every `system_users:*` permission; dialog texts shown; `deleteSystemUser` not imported by `features/team/users` (static check). | User decision 2026-10-14; auth-service `SystemUserService.delete` behaviour | D6.4, D7, D13.1 |
| REQ-FE-055 | A refresh, or `GET /api/v1/auth/me`, that fails with 403 `ACCOUNT_NOT_ACTIVE` or 403 `ACCOUNT_NOT_READY` ends the session: token and cache cleared, and the user goes to `/login` with a notice for that code. Other 403 codes on these calls keep the session. On `/login` the server `message` is never shown for these two codes. The fixed copy is "Akun Anda tidak aktif. Hubungi administrator." (`ACCOUNT_NOT_ACTIVE`) and "Akun Anda belum siap digunakan. Hubungi administrator." (`ACCOUNT_NOT_READY`), with the reference id. Boot with either code gives status `anonymous` with the notice, not `error`. The rule applies at boot and after a kept-session password change (any `me` call that is part of the refresh or session flows). | User decision 2026-10-15 (manual test; FE-OQ-43, FE-OQ-44); platform SP-BG-13 (Closed 2026-10-14) | D4.2, D4.3, D4.5, D6.5, D13 |
| REQ-FE-056 | A public route marked guest-only, opened with status `authenticated`, redirects (replace) to the dashboard `/`. Guest-only routes: `/login` and `/forgot-password`. `/reset-password` (e-mail link) is not guest-only and renders as before. Status `passwordChangeRequired` keeps REQ-FE-012 (redirect to `/account/password`). Status `unknown`, `error` and `anonymous` behave as before. Tests: `authenticated` on `/login` and on `/forgot-password` replaces to `/`; `authenticated` on `/reset-password` renders the page; `passwordChangeRequired` on `/login` goes to `/account/password`; `anonymous` on both guest-only routes renders the page; `resolveRouteAccess` stays pure and returns the same result for the same input. | User decision 2026-10-15 (bug report 2026-10-15; TODO-025) | D6.1, D10 |

## Constraints

- C-01 — The FE doc is the contract. Endpoints, fields and codes that are not in it are not used. Missing needs are listed in Table 3, not designed in the FE.
- C-02 — Trust is consumed, not decided. The FE relies on: platform ARCH-SEC-001 section 9 (X-Role mapping); gateway ARCH-SEC-002 header rules and E-33; auth-service ARCH-SEC-003 section 10 (cookie attributes and path). The FE does not decide the authentication mechanism, token format or cookie policy (ARCH-SEC-001 and ARCH-BE-003 own them).
- C-03 — Reuse detection is mandatory on the platform (AUTH ARCH-SEC-001 section 3, not configurable off). The FE must not create concurrent refresh calls with the same cookie.
- C-04 — Interim decision SP-DEC-01 (2026-10-10): only SYS_PRINCIPAL reaches master-data. SYS_ADMIN and SYS_SUPPORT default deny. ARCH-SEC-001 SEC-OQ-02 stays Open (security_architect owns the final decision).
- C-05 — The gateway is the only CORS authority (ARCH-SEC-002 SC2-HDR-13). In the recommended same-origin topology SP needs no CORS grant at all. CORS applies only to the fallback topology.
- C-06 — Greenfield, enforced (project profile). The mock UI may be reused for layout and components only. Its data is not the contract.
- C-07 — Scope cross-trace. Platform ARCH-SOLUTION-001 Domain Scope frontend = Cancelled by design (split decision): the SP web frontend is designed in this repository. Cross-reference: SP-DEC-01 (platform clarifications register), which fixes the interim master-data access rule used here. The split decision itself is recorded in the platform `orchestration-state.md` ("User decision (scope)", 2026-10-10). No platform artifact is changed by this document.
- C-08 — Stack standards apply (`tech-stack-frontend.md`, `standards-frontend.md`, `tech-stack-security.md`, `tech-stack-integration.md`, `architecture-principles.md`). Table 4 records the accepted base stack and the adopted tools. Two deviations are accepted with justification: the fetch client (no Axios) and the first-party login (no NextAuth). Every decision in Table 4 is an ADR candidate; none is Approved.
- C-09 — UI copy is Indonesian (mock and FE doc messages). Server `message` text is English. The FE shows copy keyed by `code` (FE-OQ-22).
- C-10 — Deployment topology is an operator responsibility outside the FE code. The edge file per environment must contain the SP host with context SYSTEM (REQ-FE-047). Domain names are an infrastructure open question (FE-OQ-36), not a design blocker.

## Design

### D0. Design summary

- SPA on Vite 8 and React 19 (accepted base stack, Table 4, ADR-FE-01). Path-based routes, one route table.
- One HTTP client for the whole app (D3). Module per backend service and resource (D5). Feature folders for screens (D2).
- Access token in memory only. Refresh is single-flight in the tab and serialised across tabs with the Web Locks API (D4.3).
- Server state: TanStack Query 5 (mandatory). Every mutation invalidates the queries it affects (D12.1). Forms: React Hook Form with the Zod resolver (D9).
- Gating is a UX layer built from the strategies in D6. The backend enforces every rule.
- Deployment: same origin for the static FE and `/api/*` (D1.2).

```
Browser (SP SPA, path routes)
  |  features/*  (screens, gates, forms with react-hook-form + zodResolver)
  |  lib/api/modules/*  (auth unwrap, master-data mappers, write whitelists)
  |  lib/query/*  (TanStack Query keys and mutation invalidation map)
  |  lib/api/client.ts  (headers, timeout, 401 policy, error mapping to {code, message})
  |  lib/api/refresh.ts  (single-flight + Web Lock + token holder in memory)
  v
Dev:   Vite /api proxy (127.0.0.1:8080, Host: system.gaia.localhost)       -> API Gateway
Prod:  https://system.<env-domain>/  static FE; /api/* -> reverse proxy    -> API Gateway
       (same origin; fallback: sibling host in the same site, FE-OQ-01)
```

### D1. Transport, topology and environments

#### D1.1 Local development (REQ-FE-001, REQ-FE-002)

- `vite.config.ts`: add `server.port: 3000` and `strictPort: true`, and a proxy for `/api` to `http://127.0.0.1:8080` that rewrites the Host header to `system.gaia.localhost` (the pattern in FE doc 1.1). Keep the existing React and Tailwind plugins and the `@` alias. Do not proxy any other path.
- Port 3000 is fixed because the operator host table lists `http://localhost:3000` as the allowed origin for the system host (`edge-dev.local.yml`, read 2026-10-10). Vite's default 5173 is not allowed.
- Unsafe methods (POST, PUT, PATCH, DELETE) carry `Origin: http://localhost:3000` through the proxy. The gateway rejects an unsafe request whose `Origin` is present and not listed for the host (SC2-CORS-05, E-33 returns 403 FORBIDDEN). This is a hard dependency: if the origin is missing from the host table, every write fails with 403 in development. The developer smoke test (FE doc 13) must include one POST.
- Why a proxy in development: the refresh cookie is `Secure; HttpOnly; SameSite=Strict`, host-only, path `/api/v1/auth/refresh` (ARCH-SEC-003 SC-CK-01, SC-CK-03). A page on `localhost:3000` that calls `system.gaia.localhost:8080` directly is a cross-origin call, and the cookie is not sent (FE doc 1.1). The proxy makes the browser see one origin, so the cookie is sent and no CORS grant is needed. This is the same reasoning as the production same-origin topology (D1.2).
- `VITE_API_BASE_URL` is empty in development (`.env.development`), so every call is relative (`/api/v1/...`).
- No hosts-file entry is needed for the SP in development, because the proxy sets the Host header. The gateway still needs the system host in its table.
- Supported development browsers: Chrome and Firefox. Safari does not accept `Secure` cookies on `http://localhost` (FE doc 1.1).

#### D1.2 Staging and production (REQ-FE-003, REQ-FE-047)

Recommended topology: same-origin path routing.
- One SP host per environment, for example `https://system.<env-domain>`. The static FE is served at `/`. Requests to `/api/*` go to the API gateway through the reverse proxy in front of the SP host. Domain names are an infrastructure decision (FE-OQ-36).
- The reverse proxy forwards the `Host` header unchanged to the gateway, so the gateway host table maps `system.<env-domain>` to context SYSTEM. The gateway host table is the operator edge file for the environment (P-13). Rule SC2-HDR-05 concerns the gateway's own downstream calls and is not affected. The apigateway owner confirms the Host passthrough (Dependencies).
- The reverse proxy routes only the `/api/` prefix to the gateway. `/internal/` and `/.well-known/` are not routed; the gateway blocks them as well (defence in depth).
- `VITE_API_BASE_URL` is empty. The FE calls relative `/api/v1/...` paths. SP needs no CORS grant.
- Cookie: auth-service sets `gaia_rt_sys`; the gateway passes `Set-Cookie` unchanged (SC2-HDR-11). The cookie is host-only on `system.<env-domain>`, `Secure`, `HttpOnly`, `SameSite=Strict`, path `/api/v1/auth/refresh`. Same origin means it is always sent. auth-service is unchanged.
- Unsafe methods: the browser sends `Origin: https://system.<env-domain>`, which is the host's own origin. SC2-CORS-05 never rejects the host's own origin, so SP needs no origin-list entry for itself.
- Operator edge file per environment: must contain the SP host with context SYSTEM (REQ-FE-047). No other entry is needed for SP in this topology.

Fallback (accepted second option): same-site sibling subdomains, for example `https://sp.<env-domain>` calling `https://system-api.<env-domain>`.
- `VITE_API_BASE_URL` is the absolute `https://` origin of the API host.
- The operator edge file lists the exact SP origin in the system host's `cors-allowed-origins`. The gateway sends `Access-Control-Allow-Credentials: true` for that origin only (SC2-CORS-02). Preflight is answered by the gateway (SC2-CORS-03).
- The cookie is set on the API host (host-only) and sent because the two hosts are same-site (`SameSite=Strict`).
- Costs: origin-list maintenance; BG-10 is needed for a readable `X-Correlation-ID` (otherwise the request id is shown, D3.2); the SP CSP must list the API origin in `connect-src`; the sibling-host analysis (AUTH SC-CK-09, GT-19) needs security_architect acceptance (FE-OQ-20).

Not supported: cross-site (different registrable domain). The refresh cookie is `SameSite=Strict`, so it is not sent on cross-site requests, whatever CORS says.

Correction to FE doc 1.1: its last sentence ("In staging/prod the FE is served from the same site as the gateway, or the gateway owner configures CORS with credentials") is wrong for cross-site deployments. Same-site is necessary, and CORS with credentials is not sufficient on its own. This document corrects it. The FE doc itself is not edited in this task.

Build guard: a production build fails when `VITE_API_BASE_URL` is set and is not `https://`. Every `VITE_*` value is public (it is in the bundle), so no secret is ever stored in a `VITE_*` variable.

ADR candidate: ADR-FE-06 (topology).

#### D1.3 Build and project conformance (REQ-FE-051)

Required conformance fixes. They are accepted requirements, applied in the first TODO that touches each file. This document does not apply them.
- `tsconfig.app.json`: enable `exactOptionalPropertyTypes` and `noImplicitReturns` (not set today), and add `forceConsistentCasingInFileNames` and `resolveJsonModule` (missing today). The standard lists all four (`tech-stack-frontend.md` TypeScript Configuration Standard). Table 4 SD-05 records the version choice.
- `index.html`: set `lang="id"` (UI language, C-09) and replace the placeholder `<title>vite-app</title>`.
- `package.json`: move the `shadcn` CLI to devDependencies (only `shadcn/tailwind.css` is imported at runtime, from `index.css`). Remove the unused dependencies in Table 5. Add the adopted tools in Table 5 when the first TODO needs them.
- `src/app/dashboard/data.json` has no importer. Remove it in the TODO that first touches `src/app`.

### D2. Module structure (REQ-FE-041)

Feature-based layout (`standards-frontend.md`, `tech-stack-frontend.md` Frontend Architecture Standard). The mock folder structure is kept where it already fits.

```
src/
  app/                       route table, providers (query client, auth, toaster, dialogs, theme), route guards, error boundary
  lib/
    api/
      client.ts              single request pipeline (D3); the api/client.ts of the accepted test contract (REQ-FE-050)
      refresh.ts             single-flight refresh + Web Lock + token holder (D4)
      errors.ts              ApiError and error kinds (D3.2)
      modules/
        auth.ts              auth-service endpoints (unwrap data)
        system-users.ts      auth-service
        system-roles.ts      auth-service
        master-permissions.ts
        tenant-permissions.ts
        sessions.ts          own sessions and admin sessions
        registration-settings.ts   defined, not routed in v1
        tenants.ts           master-data (snake_case mappers)
        tenant-categories.ts
        countries.ts
    query/
      client.ts              QueryClient defaults (D12)
      keys.ts                query key factory per resource (D12.1)
      invalidation.ts        mutation-to-query invalidation map (D12.1)
    access/                  gate strategies and the role constant (D6)
    forms/                   shared form helpers (zodResolver wiring, field error mapping for client errors only)
    format.ts, utils.ts, routes-meta.ts (kept; route names changed)
  features/
    auth/                    login, forgot, reset, change password, account sessions, session view state
    dashboard/
    tenants/                 list, create wizard, detail, permissions tab
    catalog/                 tenant categories, countries, master permissions
    team/                    system users (Tim IT > Akun), system roles (Tim IT > Peran), user detail
  components/                ui/ (shadcn primitives on Base UI, kept), custom/, layout/, dialogs/ (D11)
  types/                     domain types (camelCase) shared by features
  test/                      MSW 2.x handlers and fixtures written from FE doc examples (D19)
```

- `src/data/*` is not imported by runtime code after this change. Mock files are either replaced by API modules or removed (Table 2).
- Each feature folder follows `components`, `hooks`, `services` (API calls through `lib/api`), `types`, `schema` (Zod, D9).

### D3. HTTP client (REQ-FE-004, REQ-FE-008, REQ-FE-038, REQ-FE-050)

#### D3.1 Request pipeline (applies to every call)

1. Resolve the URL: base from `VITE_API_BASE_URL` (empty in dev and in the recommended production topology). Reject any path that does not start with `/api/v1/`.
2. Headers: `Accept: application/json`; `Content-Type: application/json` only when there is a body; `Authorization: Bearer <token>` only when a token is held and the call is not a public auth call; `X-Correlation-ID` set to a new UUID v4 per attempt. No other header. The client refuses to send `X-User-ID`, `X-Role`, `X-Tenant-ID` or `X-Service-Token` (runtime assertion in development, plus a static test, D19).
3. `credentials: 'include'`.
4. Timeout: 30 seconds with an abort signal (`tech-stack-frontend.md` API Client Standard). An abort produces error kind `TIMEOUT`.
5. Response: `204` returns no body. Other responses are read once as text. JSON is parsed only when it parses; otherwise the error kind is `NON_JSON` with the HTTP status. A parse failure never throws an unhandled exception.
6. `401`: apply the policy in D4.4.
7. `403 PASSWORD_CHANGE_REQUIRED`: route to change password (D4.6) and still return the error to the caller.
8. Any other non-2xx: fail with an error object (D3.2).
9. 2xx: the module converts the body (D5). Conversion failures produce kind `CONTRACT`.

No automatic retry for any call, read or write, in v1. The refresh call (D4.3) is the only internal retry. Users retry with an explicit button. Reason: writes (tenant create, system user create, reset-password e-mail) are not idempotent (FE-OQ-26, BG-11). TanStack Query's default retry is switched off in the query client (D12.2), so the rule holds for cached reads too.

#### D3.2 Error model and mapping to `{code, message}`

Every failure resolves to an error object with the FE-facing shape `{ code, message }`, plus `status`, `kind` and `correlationId` when they exist.
- Server errors: `code` and `message` come from the response body (`{ "code", "message" }`, FE doc 2.3). The body `message` is kept, but components branch on `code` and `status` only (FE doc golden rule 8).
- Client-side failures: `code` is the kind, never a server code and never derived from message text.

| kind | Meaning | Who sets it | `code` in the mapped object |
|------|---------|-------------|------------------------------|
| HTTP | Server returned a non-2xx JSON error body | client | the server `code` |
| NETWORK | Request did not reach the server (fetch rejected) | client | `NETWORK` |
| TIMEOUT | Abort after 30 s | client | `TIMEOUT` |
| NON_JSON | Non-2xx or 2xx without a JSON body (for example a proxy error page) | client | `NON_JSON` |
| CONTRACT | 2xx body does not match the documented shape | module mapper | `CONTRACT` |

These client codes are FE-internal classes. They are not server codes and are never sent to the server.

`correlationId`: the response header `X-Correlation-ID` when it is readable, otherwise the id generated for the request. The gateway echoes an id that matches its pattern, so the two are equal in the normal case. Using the request id as the fallback keeps the id visible even when the response header is not exposed to a cross-origin page (BG-10, fallback topology only).

### D4. Authentication and session (REQ-FE-005, REQ-FE-006, REQ-FE-009 to REQ-FE-017)

#### D4.1 Token holder and auth state (REQ-FE-005)

- The access token is a field of a module-level holder in `lib/api/refresh.ts`. It is not React state, not storage and not a cookie. A page reload loses it by design (D4.2 restores it).
- The UI auth status is a React context with the values `unknown`, `error` (boot or refresh failed for a reason other than an expired session), `anonymous`, `authenticated` and `passwordChangeRequired`. `me` is cached in the server-state cache (D12), not in the token holder.

#### D4.2 Boot and reload (REQ-FE-011)

1. Status `unknown`. Call refresh (D4.3).
2. Refresh 200: the token is stored in memory. Call `GET /api/v1/auth/me`.
   - `pwdChangeRequired = true`: status `passwordChangeRequired`, route to change password (D4.6).
   - Otherwise: status `authenticated`, render the app.
   - `me` 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY`: end the session (token and cache cleared, D4.3), status `anonymous`, route to `/login` with the notice for that code (D4.5, REQ-FE-055).
   - `me` 401 with any error code: the token is removed from memory, status `anonymous`, route to `/login` with no account notice (v1.0.11, user decision 2026-10-15). This is the same rule as a refresh 401 (step 3, D4.3).
3. Refresh 401 with any code (`SESSION_ENDED`, `INVALID_TOKEN`, `SESSION_TERMINATED`, `TOKEN_EXPIRED`, `UNAUTHORIZED` or any other): status `anonymous`, route to `/login`, with no account notice (v1.0.10). Refresh 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY`: the same, with the notice for that code (REQ-FE-055).
4. Refresh network failure, timeout or 5xx: status `error`, show a "service unavailable" screen with a retry button. Do not show the login form as if the session had ended, and do not clear anything.

React StrictMode runs effects twice in development (`main.tsx` uses StrictMode). The module-level single-flight (D4.3) makes both runs share one refresh call.

#### D4.3 Refresh: single-flight in a tab and serialised across tabs (REQ-FE-006, REQ-FE-010)

- In a tab: one module-level promise in `lib/api/refresh.ts`. Concurrent 401s and both StrictMode runs await the same promise.
- Across tabs: the refresh call runs inside `navigator.locks.request('sp-session-refresh', ...)`. The lock is held until the response has arrived, including `Set-Cookie`, so the next tab sends the rotated cookie.
- Why the lock is required: refresh tokens rotate on every call. Presenting an already rotated token is treated as reuse. Reuse revokes every token of the rotation chain, deactivates the sessions that reference them and blacklists the user's active access-token `jti`s (AUTH ARCH-SEC-001 sections 3 and 8). Two tabs that refresh at the same moment with the same cookie would therefore log the user out everywhere. The platform rule cannot be relaxed (for example, by a grace window), so the FE serialises the calls.
- Fallback when `navigator.locks` is unavailable: in-tab single-flight only. The residual risk is recorded as RK-FE-01. The alternative is a leader election over `BroadcastChannel`; it adds code and gives the same guarantee, so it is not chosen for v1 (A-03).
- Refresh result: 200 stores the new token and resolves. Any 401 from the refresh call, with any error code (for example `SESSION_ENDED`, `INVALID_TOKEN`, `SESSION_TERMINATED`, `TOKEN_EXPIRED`), clears the token and cache, sets `anonymous` and routes to `/login` with no account notice (v1.0.10). 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` does the same, and the notice is the account notice for that code (D4.5, REQ-FE-055). The session ends once, through `endSession`, which passes the reason to the logout handler. Any other failure (5xx, network, timeout, other 403) rejects without clearing state. `AUTH_EXPIRY_CODES` (D4.4) no longer decides the outcome of the refresh call: a refresh 401 ends the session whatever its code.
- The caller retries its original request once, with the new token. If that retry returns 401 again, the client logs out (D4.4). It never loops.
- Suspended account, mid-session (FE-OQ-45): the gateway checks the session on each request (30-second cache). A data request after the suspend gets 401. The refresh that follows answers 403 `ACCOUNT_NOT_ACTIVE` (or `ACCOUNT_NOT_READY`), so the session ends, the cache is cleared and the login page shows the notice. No page keeps showing a data error.

#### D4.4 Which 401 triggers refresh (REQ-FE-010)

- Refresh only when the status is 401 and the code is `UNAUTHORIZED`, `INVALID_TOKEN` or `SESSION_ENDED`, and the endpoint is not in the exempt list.
- `AUTH_EXPIRY_CODES` (`UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED`) is the trigger for a data call only and does not decide the outcome of the refresh call, where any 401 ends the session (D4.3, v1.0.10).
- Exempt (never refresh): `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/change-password`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`, `POST /api/v1/auth/logout`.
- `INVALID_CREDENTIALS` is never a refresh trigger. A wrong current password is not an expired session. The FE doc's reference client refreshes on every 401 except login and refresh, which would refresh on a wrong current password. This design corrects that.
- Logout is best effort: a 401 on logout is treated as already logged out (D4.8).
- The exact code for an expired access token is confirmed in FE-OQ-18.

#### D4.5 Login (REQ-FE-009)

- Fields: `loginId` (required; e-mail format checked on the client only, the server is authoritative), `password` (required). No tenant field.
- `POST /api/v1/auth/login` then `GET /api/v1/auth/me` (D4.2 rules after `me`).
- Error mapping (FE doc 3.3, copy in FE-OQ-22):
  - 401 `INVALID_CREDENTIALS`: "Login ID atau password salah" (same text for unknown user and wrong password). Keep the login ID, clear the password.
  - 403 `ACCOUNT_NOT_ACTIVE`: "Akun Anda tidak aktif. Hubungi administrator." 403 `ACCOUNT_NOT_READY`: "Akun Anda belum siap digunakan. Hubungi administrator." Show the reference id. The server `message` is never shown for these two codes (REQ-FE-055; FE-OQ-43 approved 2026-10-15).
  - 400 `VALIDATION_FAILED`: show the server message as a form alert. Keep input.
  - 429 `TOO_MANY_ATTEMPTS` or `RATE_LIMIT_EXCEEDED`: disable the submit button for 60 seconds with a visible countdown.
- `password` uses `autocomplete="current-password"`. It is never logged or stored.

#### D4.6 Forced and voluntary password change (REQ-FE-012, REQ-FE-013)

- While `passwordChangeRequired`, only `/account/password` and logout are reachable. Navigation is hidden and every other route redirects to change password.
- Form fields: `currentPassword`, `newPassword`, `newPasswordConfirmation`, `keepCurrentSession` (boolean). Client check: the confirmation equals the new password. The server repeats it.
- Response handling:
  - `keepCurrentSession = true` returns `{ accessToken }`: replace the token in memory, then call `GET /api/v1/auth/me` again. The flag is now false, so the app opens. The `me` call that follows the rotated token ends the session on 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` (D4.3, REQ-FE-055): the call rejects and the user goes to `/login` with the notice for that code.
  - `keepCurrentSession = false` returns `{ status: PASSWORD_CHANGED }`: clear the token and cache, route to `/login` with the notice "Password changed, please log in again" (copy: FE-OQ-22).
- Errors: 401 `INVALID_CREDENTIALS` ("Current password is incorrect.") under the current-password field. 400 `PASSWORD_POLICY_VIOLATION` under the new-password field. 400 `VALIDATION_FAILED` as a form alert. None of these triggers refresh (D4.4).

#### D4.7 Forgot and reset password (REQ-FE-014, REQ-FE-015)

- Forgot: one form (`loginId`). Any 200 response, and any error other than a validation error, shows the same neutral text from FE doc 3.3. Never reveal whether the account exists.
- Reset: the page reads `token` from the query string once, then replaces the URL with the same path and no query (`history.replaceState`) so the token is not kept in history. The token is never logged or stored.
- Submit `{ resetToken, newPassword, newPasswordConfirmation }`. Success goes to `/login` with a success notice. `400 INVALID_TOKEN` shows "Link tidak valid atau kedaluwarsa" and a link to forgot password. `400 PASSWORD_POLICY_VIOLATION` shows under the field.
- The reset link is generated by auth-service. Its base URL is not in the platform artifacts (FE-OQ-19). Default in this design: the link targets `/reset-password?token=` on the SP origin.

#### D4.8 Logout (REQ-FE-016)

1. Call `POST /api/v1/auth/logout` with the token if one is held. Do not refresh on its 401 (D4.4). Ignore the result.
2. Clear the token holder and every cached query (D12.2).
3. Post `logout` on a `BroadcastChannel` named `sp-session` so other tabs clear their token and cache and go to `/login`. Only the logout signal is sent over the channel. Tokens are never sent to another tab.
4. Route to `/login`.

Access tokens already held by other tabs remain valid at the edge for a short window (the platform accepts up to 30 seconds for revocation visibility, ARCH-SEC-001 section 2.5). This is recorded as RK-FE-13.

#### D4.9 My sessions (REQ-FE-017)

- `GET /api/v1/sessions`; list is client-paginated (FE doc 2.1).
- The row marked `isCurrent` shows a badge. Its revoke action is hidden; the user logs out instead.
- "Revoke" on one row: `DELETE /api/v1/sessions/{sessionId}`. "Revoke all others": `DELETE /api/v1/sessions`. Neither logs the current tab out.

#### D4.10 Another user's sessions (REQ-FE-032, REQ-FE-052)

- History: v1.0.5 (user decision 2026-10-14) suspended the tab and the force-logout action for other accounts while SP-BG-14 was Open; v1.0.13 (user decision 2026-10-15) enables them because SP-BG-14 is Closed.
- Flag: `OTHER_ACCOUNT_SESSIONS_ENABLED = true`, one exported constant in the system-users feature, with a comment citing SP-BG-14 (Closed 2026-10-15).
- Contract (final, FE-OQ-39): `GET /api/v1/system-users/{id}/sessions` needs `sessions:view` (the caller is a system user). `DELETE /api/v1/system-users/{id}/sessions` needs `sessions:revoke`: own account -> 409 `SELF_ACTION_NOT_ALLOWED`; the target holds `SYS_PRINCIPAL` and the caller is not a principal -> 403 `PLATFORM_ROLE_PROTECTED`; not a system user -> 404 `SYSTEM_USER_NOT_FOUND`; success -> `SESSIONS_REVOKED` with a count. Response shapes equal the tenant session endpoints. The route labels `admin.sessions.*` stay unchanged. The earlier endpoint `/api/v1/admin/users/{userId}/sessions` serves tenant employees only and is no longer used for system users.
- Fact (checked by the user in auth-service `SystemUserSessionService.listSessions`; the principal protection of `revokeAllSessions` is at lines 104-105): `GET` has no principal protection and never answers 403 `PLATFORM_ROLE_PROTECTED`. The FE adds no handling for that case; a read error keeps the generic read message.
- Another account (target id differs from the signed-in id): the page renders the "Sesi aktif" tab when the caller holds `sessions:view`, and the "Paksa keluar" action behind a confirm dialog when the caller holds `sessions:revoke`.
- Force logout for a principal target follows the suspend and role-change pattern: the button is visible and the server decides; there is no extra UI gate. Errors use the D13.1 copy: `SELF_ACTION_NOT_ALLOWED`, `PLATFORM_ROLE_PROTECTED` (account-page version), an unrecognised 409, 503, and for 404 the copy "Akun tidak ditemukan.". The server text is never shown.
- Own account (target id equals the signed-in id): no tab and no force-logout action. Instead the page shows a link to `/account/sessions` ("Sesi saya", D7), which uses `GET /api/v1/sessions` and stays unchanged.

#### D4.11 Browser storage policy (REQ-FE-005)

| Storage | Use |
|---------|-----|
| Access token | Memory only (module holder) |
| Refresh cookie | Set by server, HttpOnly, never read by JS |
| `localStorage` | Theme preference only, key `theme` (existing `theme-provider`); not sensitive |
| `sessionStorage` | Not used |
| IndexedDB | Not used |
| Server-state cache | In memory only (TanStack Query); no persister |
| Form drafts | Not persisted. A reload clears them |
| URL | Filters and page number for lists (search params). The reset token is removed from the URL at once (D4.7) |

#### D4.12 CSRF posture (coordination with security_architect)

- The FE sends no CSRF token. Protections relied on: the refresh cookie is `SameSite=Strict`, host-only and path-scoped (ARCH-SEC-003 SC-CK-01 for attributes, SC-CK-03 for per-context names); the gateway rejects unsafe methods with a present, unlisted `Origin` (SC2-CORS-05); all state changes use a bearer token that the browser does not attach on its own.
- Limit (SC-CK-09): `SameSite` does not separate sibling hosts of the same site. This matters only for the fallback topology. The control for that is the gateway origin check and the exact origin lists (FE-OQ-20).

### D5. API layer: two JSON conventions (REQ-FE-007, REQ-FE-036, REQ-FE-040)

#### D5.1 auth-service modules (camelCase, `{ "data": ... }`)

- The module unwraps `data`. Objects are typed as they arrive (`SystemUser`, `SystemRole`, `MasterPermission`, `TenantPermission`, `Session`, `Me`). Lists are plain arrays.
- `delete` returns `{ data: null }` and the module returns `void`. The registration-settings delete returns 204.

#### D5.2 master-data modules (snake_case, unwrapped)

Explicit mapper functions per type. No generic key-case transform (A-06). Unknown keys are ignored. A missing required key produces `CONTRACT`.

| Contract (snake_case) | Component model (camelCase) |
|-----------------------|-----------------------------|
| `tenant_category_id` | `tenantCategoryId` |
| `country_code` | `countryCode` |
| `deployment_type` | `deploymentType` (`DEDICATED` or `MULTI_TENANT`, values unchanged) |
| `multi_branch_enabled` | `multiBranchEnabled` |
| `tenant_admin_email` | `tenantAdminEmail` |
| `logo_url` | `logoUrl` |
| `is_active` | `isActive` |
| `created_at`, `created_by`, `updated_at`, `updated_by` | `createdAt`, `createdBy`, `updatedAt`, `updatedBy` |
| `tenant_category` (detail) `{id, code, name}` | `tenantCategory` |
| `country` (detail) `{code, name, phone_code}` or null | `country` `{code, name, phoneCode}` or null |
| `social_links` (detail, read-only) | `socialLinks` (not rendered in v1) |
| `nationality_name`, `phone_code` (country) | `nationalityName`, `phoneCode` |
| `pagination.total_pages` | `pagination.totalPages` |
| `admin_account.user_id`, `tenant_status_sync`, `user_status` | `userId`, `tenantStatusSync`, `userStatus` |
| `default_branch_types` (create response) | Not mapped (not used by SP) |

The master-data `Tenant` list item and the create response share one mapper. `TenantDetail` adds the joined fields.

#### D5.3 Write whitelists (REQ-FE-040)

Each write has its own input type. Fields that the contract marks immutable are absent from the type, so they cannot be sent.

| Write | Input type (camelCase) | Notes |
|-------|------------------------|-------|
| Tenant create | code, name, tenantCategoryId, deploymentType, multiBranchEnabled, tenantAdminEmail, countryCode?, logoUrl? | Optional fields are omitted when empty (never sent as null) |
| Tenant patch | isActive?, logoUrl?: string or null, countryCode?: string or null | Only these three keys exist in the type. `code`, `name`, `tenantCategoryId`, `deploymentType`, `multiBranchEnabled`, `tenantAdminEmail` are not in the type |
| Tenant category create | code, name, description? | `code` max 50, `name` max 100 |
| Tenant category update | name, description?, isActive | `code` absent |
| Country create | code (uppercased), name, nationalityName?, phoneCode? | `code` matches `^[A-Z]{2}$` |
| Country update | name, nationalityName?, phoneCode?, isActive | `code` absent |
| System user create | loginId, systemRoleId | `loginId` is an e-mail |
| System user role change | systemRoleId | PATCH `/api/v1/system-users/{id}` |
| System role create or edit | key, name, description?, active? | Edit sends all current values (FE-OQ-17 for `key`) |
| Master permission edit (name and description only; no create) | key, name, description?, category, module, active?, customerPermitted? | PATCH sends all current values, with only `name` and `description` editable; `key`, `category`, `module`, `active` and `customerPermitted` are sent unchanged (FE-OQ-38). User rule (2026-10-12): fields other than `name` and `description` (`key`, `category`, `module`, `active`, `customerPermitted`) are read-only; before the PATCH the FE re-fetches the permission from the server and sends those fields unchanged with the edited `name` and `description` |
| Tenant permissions replace | masterPermissionIds[] | PUT, full replacement |
| Tenant permission toggle | enabled | PATCH `/api/v1/tenants/{tenantId}/permissions/{id}` |

#### D5.4 Pagination model (REQ-FE-036)

- Master-data lists: server pagination with `page` (1-based, default 1) and `limit` (default 20, range 1–100). The UI sends the documented filters only.
- auth-service lists (system users, roles, master permissions, tenant permissions, sessions): fetched whole and paginated and searched on the client by one shared hook.
- Reference data for joins and selects (tenant categories, countries): fetched with `limit=100`. If `pagination.total` exceeds 100, the loader fetches every page. Results are cached as server state (D12). Joins by id use the cached list, so the tenant list needs no extra request per row.

#### D5.5 Response validation

Each module validates the response shape with a Zod 4 schema (accepted, Table 4 SD-06). A mismatch produces `CONTRACT`. This catches drift between the FE doc and the services early, which the platform already has evidence for (R-012 history, master-data B-02 status, FE-OQ-31).

### D6. Authorization gating (UX only) (REQ-FE-018, REQ-FE-019, REQ-FE-031, REQ-FE-033)

Backend enforcement is authoritative (FE doc 0 rule 7, 4). Gates only decide what the UI shows.

#### D6.1 Gate strategies (Strategy pattern, D18)

| Gate | Input | Allow when | Deny result |
|------|-------|------------|-------------|
| Authenticated | status | status is `authenticated` | `LOGIN` |
| PasswordChanged | `me.pwdChangeRequired` | false | `PASSWORD_CHANGE` |
| HasPermissions(keys) | `me.permissions` | every key present | `FORBIDDEN` |
| HasRole(key) | `me.role` | equals key | `FORBIDDEN` |

Gates combine with AND. The route guard maps `LOGIN` to `/login`, `PASSWORD_CHANGE` to `/account/password`, and `FORBIDDEN` to a 403 screen. A missing menu item is not the only protection: the route guard is.

Guest-only public routes (REQ-FE-056, v1.0.12): the `public` kind of the route access type has one optional flag, `guestOnly`. A public route with `guestOnly` set, opened with status `authenticated`, redirects (replace) to the dashboard `/`; this is one branch in the pure decision `resolveRouteAccess`. `/login` and `/forgot-password` are guest-only; `/reset-password` is not. Status `passwordChangeRequired` keeps REQ-FE-012 and goes to `/account/password`; status `unknown`, `error` and `anonymous` are unchanged.

#### D6.2 Master-data gate: role key, not permission key (REQ-FE-019)

- Master-data (tenants, tenant categories, countries) has no permission keys in the FE doc (section 4). The only signal that matches the backend rule is the role. auth-service maps `SYS_PRINCIPAL` to the edge role SYSTEM_PRINCIPAL and gives no edge role to any other system role. The gateway copies that value into `X-Role` and never derives it (ARCH-SEC-001 sections 9.2 c and 9.6). So the UI gate is `HasRole('SYS_PRINCIPAL')`, the system role key the FE can see.
- The string lives in one constant, `lib/access/roles.ts`, with a comment that cites ARCH-SEC-001 section 9.2 c and SP-DEC-01. If SEC-OQ-02 changes the mapping, the constant and this section change together.
- Why not a permission gate: the keys would be invented. Why not "show to everyone and rely on 403": SP-DEC-01 narrows visibility, and screens that always return 403 are poor UX.
- Naming: FE doc section 4 writes `SYSTEM_PRINCIPAL`, which is the `X-Role` value that the FE never sees. The FE reads `me.role = SYS_PRINCIPAL` (FE doc 3.3 example). FE-OQ-14.
- Result by role: SYS_PRINCIPAL sees master-data screens. SYS_ADMIN and SYS_SUPPORT do not (SP-DEC-01). Those roles have no seeded permissions (ARCH-SEC-001 section 9, AUTH V4), so they see only "Akun saya" and a neutral landing page.

#### D6.3 Route and menu configuration (Configuration-driven nav)

- A single navigation config lists each item with its label, route, and gate. The sidebar, the command palette and the route guard all read the same config, so a gate cannot differ between them.
- The landing page, when no module is visible, shows a neutral message (copy: FE-OQ-22) rather than an empty dashboard.

#### D6.4 Action gates (REQ-FE-018, REQ-FE-030, REQ-FE-035, REQ-FE-054)

| Action | Gate |
|--------|------|
| Tenant create, edit, deactivate, retry admin account | HasRole SYS_PRINCIPAL |
| Tenant permissions view | SYS_PRINCIPAL and `tenant_permissions:view` and `master_permissions:view` |
| Tenant permissions edit (PUT) | ... and `tenant_permissions:update` |
| Tenant permission toggle on | ... and `tenant_permissions:activate` |
| Tenant permission toggle off | ... and `tenant_permissions:deactivate` |
| System users list or detail | `system_users:view` |
| System user create | `system_users:create` |
| System user role change | `system_users:update` and `system_roles:view` (the role dropdown needs the role list) |
| System user suspend, deactivate, reactivate | `system_users:update` (the server decides per target status; handle 403) |
| System user delete | No UI action (REQ-FE-054). `system_users:delete` is not checked by any UI gate; `access.ts` has no `canDelete` and no `USERS_DELETE` constant. The own-account rule (D6.6) now covers suspend and deactivate only |
| System user reset password | `system_users:reset_password` |
| System roles list or detail | `system_roles:view` |
| System role create | `system_roles:create` |
| System role edit, permissions save | `system_roles:update` (checklist also needs `master_permissions:view`) |
| System role delete | `system_roles:delete` |
| Master permissions list | `master_permissions:view` |
| Master permission edit (name and description) | `master_permissions:update` |
| Master permission create, activate/deactivate, delete | No UI action (read-only page, REQ-FE-035; BG-12). `master_permissions:create`, `:delete` and the `active` toggle are not offered |
| Admin sessions view, force logout | `sessions:view`, `sessions:revoke` |
| Own sessions, change password | Authenticated only |

#### D6.5 403 handling

A 403 shows the toast "Anda tidak punya akses untuk aksi ini" (FE doc 7). It never logs the user out. The screen stays. A 403 `PASSWORD_CHANGE_REQUIRED` is the only 403 that routes (D4.6). One exception: a refresh or `me` 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` ends the session (D4.2, D4.3, REQ-FE-055). Every other 403, on any call, keeps this rule.

#### D6.6 Self-protection and protected roles (REQ-FE-031, REQ-FE-033)

- On the system user list and detail, the own account (`id === me.userId`) shows no suspend or deactivate action (FE doc 5.1; there is no delete action, REQ-FE-054). Role change of the own account is hidden by default (FE-OQ-25).
- The system role with key `SYS_PRINCIPAL` is locked statically in the UI (user decision 2026-10-12, SP-BG-13): no deactivate, no delete, no permission replacement. This replaces the refusal-driven disable. Reason: auth-service has no guard for that role, so the backend never refuses and a refusal-driven button would never disable; one deactivation would lock out all system administrators. The lock constant sits with the role constant in `lib/access/roles.ts`. Server refusals (`PLATFORM_ROLE_PROTECTED`, `SELF_ACTION_NOT_ALLOWED`, `LAST_SYSTEM_PRINCIPAL`, `SYSTEM_ROLE_IN_USE`, `SERVICE_UNAVAILABLE`) are now guarded server-side (SP-BG-13 Closed 2026-10-14) and shown as fixed Indonesian copy by D13.1, never the server message (v1.0.5). The static lock and the own-account hiding stay as UX; the server is the boundary. The own account offers no suspend or deactivate (above; TODO-014 acceptance); delete is not offered to any account on the Tim IT account pages (REQ-FE-054). The role-delete lock on SYS_PRINCIPAL is unchanged.

### D7. Screens and endpoint usage (REQ-FE-018 to REQ-FE-039)

Table 1 — endpoint usage map (FE doc section 8, with gates and section references).

| Route | Screen | Gate | Endpoints (FE doc section) |
|-------|--------|------|----------------------------|
| `/login` | Login | Public, guest-only (REQ-FE-056) | POST `/api/v1/auth/login`; GET `/api/v1/auth/me` (3.3) |
| `/forgot-password` | Forgot password | Public, guest-only (REQ-FE-056) | POST `/api/v1/auth/forgot-password` (3.3) |
| `/reset-password?token=` | Reset password | Public, not guest-only | POST `/api/v1/auth/reset-password` (3.3) |
| `/account/password` | Change password | Authenticated; forced when `pwdChangeRequired` | POST `/api/v1/auth/change-password`; GET `/api/v1/auth/me` (3.3) |
| `/account/sessions` | My sessions | Authenticated | GET `/api/v1/sessions`; DELETE `/api/v1/sessions/{sessionId}`; DELETE `/api/v1/sessions` (3.4) |
| `/` | Dashboard | Authenticated; master-data widgets need SYS_PRINCIPAL | GET `/api/v1/tenants?limit=1` (total; also with `is_active=true`); GET `/api/v1/tenants?limit=5`; GET `/api/v1/tenant-categories?limit=1`; GET `/api/v1/countries?limit=1` (section 8 counts) |
| `/tenants` | Tenant list | SYS_PRINCIPAL | GET `/api/v1/tenants` with filters; GET `/api/v1/tenant-categories` and `/api/v1/countries` (reference loaders, D5.4) (6.3, 8) |
| `/tenants/new` | Tenant create | SYS_PRINCIPAL | GET `/api/v1/tenant-categories?is_active=true&limit=100`; GET `/api/v1/countries?is_active=true&limit=100`; POST `/api/v1/tenants`; POST `/api/v1/tenants/{id}/admin-account` (retry) (6.3) |
| `/tenants/:id` | Tenant detail | SYS_PRINCIPAL | GET `/api/v1/tenants/{id}`; PATCH `/api/v1/tenants/{id}`; POST `/api/v1/tenants/{id}/admin-account` (6.3). DELETE is never called |
| `/tenants/:id/permissions` | Tenant permissions | SYS_PRINCIPAL and `tenant_permissions:view` and `master_permissions:view` | GET `/api/v1/master-permissions`; GET, PUT `/api/v1/tenants/{id}/permissions`; PATCH `/api/v1/tenants/{id}/permissions/{permissionId}` (5.4) |
| `/tenant-categories` | Tenant categories | SYS_PRINCIPAL | GET, POST `/api/v1/tenant-categories`; GET, PUT, DELETE `/api/v1/tenant-categories/{id}` (6.1) |
| `/countries` | Countries | SYS_PRINCIPAL | GET, POST `/api/v1/countries`; GET, PUT, DELETE `/api/v1/countries/{code}` (6.2) |
| `/master-permissions` | Master permissions (read-only) | `master_permissions:view`; edit `master_permissions:update` | GET `/api/v1/master-permissions`; GET, PATCH `/api/v1/master-permissions/{id}` (name and description only; no POST, no DELETE, no active toggle) (5.3) |
| `/system-users` | System users (Tim IT > Akun) | `system_users:view` | GET, POST `/api/v1/system-users`; GET `/api/v1/system-roles` (role options; needs `system_roles:view`) (5.1) |
| `/system-users/:id` | System user detail (tab: Detail; tab "Sesi aktif" for another account only, D4.10; the own account shows the link "Sesi saya" to `/account/sessions`) | `system_users:view`; sessions tab `sessions:view` (another account only); force logout `sessions:revoke` | GET, PATCH `/api/v1/system-users/{id}`; DELETE `/api/v1/system-users/{id}` is never called (REQ-FE-054); PATCH `/api/v1/system-users/{id}/status`; POST `/api/v1/system-users/{id}/reset-password`; GET, DELETE `/api/v1/system-users/{id}/sessions` for another account only (5.1, 5.6; SP-BG-14 Closed; v1.0.13) |
| `/system-roles` | System roles (Tim IT > Peran) | `system_roles:view` | GET, POST `/api/v1/system-roles` (5.2) |
| `/system-roles/:id` | System role detail (tabs: Detail, Permissions) | `system_roles:view`; edit `system_roles:update` | GET, PATCH, DELETE `/api/v1/system-roles/{id}`; GET, PUT `/api/v1/system-roles/{id}/permissions`; GET `/api/v1/master-permissions` (5.2) |

Not routed in v1: `/tenants/:id/registration-settings` (FE doc 5.5, phase 2).

Dashboard counts (REQ-FE-037): totals come from `pagination.total` of `limit=1` requests. The sidebar badges use the same totals. Badges for failed events and active sessions are removed (no contract, BG-08).

Confirm dialogs (REQ-FE-039, REQ-FE-054): delete (tenant category, country, system role; no delete for system accounts), deactivate tenant, suspend and deactivate system user (with the explanatory text of REQ-FE-054), reset password, force logout. Reactivating a user has no confirm dialog. The typed-confirmation dialog keyed to the tenant code (`src/components/dialogs/dialogs.tsx`) is removed, because tenant delete is not offered (405).

Tenant wizard (REQ-FE-021): the mock wizard has five steps. The contract has no feature-set step at create. The steps become: Identitas (code, name, category, country, logo, multi-branch), Penyimpanan (deployment type), Admin awal (tenant admin e-mail), Tinjau dan buat. Features are configured on the Permissions tab after creation (FE-OQ-24).

### D8. Tenant flows and the mock replacement (REQ-FE-020 to REQ-FE-025)

#### D8.1 Tenant list

- Filters and their parameters: status (`is_active=true|false`, omitted for all), category (`category_id`), country (`country_code`), deployment type (`deployment_type`), exact code (`code`). Name search is not offered (no contract, BG-09).
- Columns from the contract only: code, name, category name (joined), country (joined), deployment type, active flag. The mock columns branches, users, active sessions and registration state are removed (BG-02).
- The "latest" dashboard widget uses `limit=5`. The contract does not define the sort order, so the UI labels the widget with the server order, not "latest" (FE-OQ-16).

#### D8.2 Tenant create, detail and edit

- Create (REQ-FE-021): submit `POST /api/v1/tenants` from a React Hook Form form (D9). The button is disabled while the request is in flight; there is no automatic retry (D3.1). Outcome classification, applied to the 201 body:
  - `admin_account.status = CREATED` and `tenant_status_sync = SYNCED`: success toast "Tenant dibuat, akun admin dikirim ke e-mail".
  - Any other combination: a warning with a Retry button that calls `POST /api/v1/tenants/{id}/admin-account`. Warning text (FE doc 6.3): `status = FAILED` shows "Tenant dibuat, tetapi akun admin gagal dibuat"; `status = CREATED` with a sync that is not `SYNCED` shows "Status tenant belum tersinkron ke auth". The mapping is one pure function with unit tests (D19).
  - The tenant exists in every case. The UI navigates to the tenant detail page after the outcome is shown.
- Retry (safe to repeat, FE doc 6.3): success when `admin_account.status = CREATED` and `tenant_status_sync = SYNCED`; otherwise the warning stays with Retry.
- Detail (REQ-FE-022): tenant fields `code`, `name`, `tenant_category_id`, `deployment_type`, `multi_branch_enabled`, `tenant_admin_email` are shown read-only. The editable controls are `is_active` (switch), `logo_url` (URL input, empty means null) and `country_code` (select, empty means null). The edit form is a React Hook Form form.
- Save (REQ-FE-022): PATCH sends only the changed keys, from the whitelist type (D5.3). A save with no change is still valid (returns 200).
- Activation toggle (REQ-FE-023): no optimistic update. The switch changes only after a 200. On 503 `SERVICE_UNAVAILABLE` the switch keeps its old value and the server message is shown. This applies to deactivate and reactivate.
- Deactivate (REQ-FE-025): confirm dialog, then PATCH `is_active=false`. No delete control anywhere (405 by contract).
- Admin account on the detail page (REQ-FE-024, BG-01): the detail response has no admin-account state. The page therefore always offers "Kirim ulang akun admin" with a confirm dialog. Retry is idempotent by contract.
- Errors: 409 `RESOURCE_CONFLICT` ("Tenant code already exists.") shown on the code field; 400 `VALIDATION_ERROR` messages ("Invalid tenant_category_id.", "Invalid country_code.", "Only one DEDICATED tenant is allowed per deployment.") shown as form alerts, not parsed into fields (golden rule 8, D9).

#### D8.3 Mock-to-contract replacement

Table 2 — mock file and page replacement. Dispositions: REPLACE (contract endpoint), DERIVE (computed from contract responses), NEW (screen required by FE doc, no mock), KEEP (layout or component reused), UPDATE (reused with changed behaviour), REMOVE-V1 (no contract; not shown in v1), REMOVE (deleted from the repository).

| Mock file | Disposition | Contract source | Notes |
|-----------|-------------|-----------------|-------|
| `pages/beranda.tsx` (Dashboard) | UPDATE | `pagination.total` counts; `GET /tenants?limit=5` (section 8) | "Perlu ditangani" and activity feed REMOVE-V1 (BG-08) |
| `pages/tenant-list.tsx` | UPDATE | `GET /tenants` with filters (6.3) | Branch, user, session and registration columns REMOVE-V1 (BG-02). Name search REMOVE-V1 (BG-09) |
| `pages/tenant-create.tsx` | UPDATE | POST `/tenants` (6.3); categories and countries lists | Five steps become four (D7). Feature step REMOVE-V1 (FE-OQ-24) |
| `pages/tenant-detail.tsx` | UPDATE | GET, PATCH, POST admin-account (6.3) | Tabs: Ringkasan, Profil, Permissions (replaces Fitur aktif). Delete dialog REMOVE. Last-event timestamp REMOVE-V1 |
| (Tenant detail tab "Fitur aktif") | REPLACE | Tenant permissions (5.4) | Mock flags REMOVE (see `data/tenant-features.ts`) |
| `pages/katalog-kategori.tsx` | UPDATE | `/tenant-categories` CRUD (6.1) | `key` becomes `code` (immutable after create); `label` becomes `name`; `is_active` added to edit; per-category count DERIVE or REMOVE-V1 (FE-OQ-35) |
| `pages/katalog-negara.tsx` | UPDATE | `/countries` CRUD (6.2) | `iso2` becomes `code`; `dialCode` becomes `phone_code`; `nationality_name` added; `active` becomes `is_active`; count as above |
| `pages/katalog-permission.tsx` | UPDATE | `/master-permissions` read plus name/description edit (5.3) | Read-only (REQ-FE-035): create button, enable switch and delete REMOVE; edit of name and description stays (PATCH with full current body, FE-OQ-38); `active` shown as a read-only status. `core` and bound-tenant count REMOVE-V1 (BG-07); server guard BG-12. Mock keys (`patient.view` style) are replaced by the catalogue's `resource:action` keys |
| `pages/tim-akun.tsx` (Akun) | UPDATE | `/system-users` (5.1); `/system-roles` for options | Name and last-active REMOVE-V1 (BG-04; show `loginId`). Status `INACTIVE` maps to `DEACTIVATED` (BG-05). `PENDING_APPROVAL` REMOVE-V1 (BG-05). Self badge = `id === me.userId`. Per-user session count only on detail. No "Hapus" on the row or in the detail (REQ-FE-054); row actions: Tangguhkan, Nonaktifkan, Aktifkan, ubah peran, reset password |
| `pages/tim-peran.tsx` (Peran) | UPDATE | `/system-roles` and `/permissions` (5.2) | `isSystem` replaced by a static lock on `SYS_PRINCIPAL` (D6.6; BG-06, SP-BG-13). Member count DERIVE from the user list. Mock role keys (OWNER, OPERATOR, VIEWER) are stale: contract keys are SYS_PRINCIPAL, SYS_ADMIN, SYS_SUPPORT and others |
| `pages/sistem-sesi.tsx` (Sesi aktif) | UPDATE | Own sessions (3.4); admin sessions (5.6) | Tenant session aggregate REMOVE-V1 (BG-03). Cross-account list is REMOVE-V1; per-user sessions of another account are on the user detail page tab, on `/api/v1/system-users/{id}/sessions` (D4.10, v1.0.13); the user detail page links to this page for the own account |
| `pages/sistem-event.tsx` | REMOVE-V1 | none | BG-08 |
| `pages/sistem-housekeeping.tsx` | REMOVE-V1 | none | BG-08 |
| `pages/sistem-audit.tsx` | REMOVE-V1 | none | BG-08 |
| `pages/sistem-pengaturan.tsx` | REMOVE-V1 | none | BG-08 (token and retention values have no contract; not editable) |
| `pages/registry.tsx` | UPDATE | none | Maps the new route names to the new pages |
| (new) login, forgot, reset, change password, my sessions | NEW | Section 3 | No mock |
| (new) system user detail, system role detail, Permissions tab | NEW | Sections 5.1, 5.2, 5.4, 5.6 | No mock |
| (new) 403, 404, service-unavailable screens | NEW | D13 | No mock |
| `data/tenants.ts` | REPLACE | `GET /tenants` | Mock-only fields removed (branchCount, userCount, activeSessions, registrationState); `storageMode` becomes `deployment_type` |
| `data/tenant-categories.ts` | REPLACE | `/tenant-categories` | Mock ids replaced by UUIDs from the API |
| `data/countries.ts` | REPLACE | `/countries` | Path key is `code` |
| `data/permissions.ts` | REPLACE | `/master-permissions` | Clinic-domain catalogue is not the platform catalogue |
| `data/system-roles.ts` | REPLACE | `/system-roles` | Stale role keys removed |
| `data/it-accounts.ts` | REPLACE | `/system-users` | Name, last-active and pending status removed (BG-04, BG-05) |
| `data/tenant-detail.ts` | UPDATE | Tenant detail (6.3) | Identity from contract; conditions limited to contract fields; last-event timestamp removed |
| `data/tenant-features.ts` | REMOVE | none | Replaced by Permissions tab (FE-OQ-24) |
| `data/nav.ts` | REPLACE | Totals (section 8) | Badges from contract totals. Failed-event and active-session badges removed (BG-08) |
| `data/home.ts` | REMOVE-V1 | none | BG-08 |
| `data/events.ts` | REMOVE | none | BG-08 |
| `data/housekeeping.ts` | REMOVE | none | BG-08 |
| `data/audit-logs.ts` | REMOVE | none | BG-08 |
| `data/platform-settings.ts` | REMOVE | none | BG-08 |
| `data/sessions.ts` | REMOVE | none | BG-03 and BG-08 |
| `app/dashboard/data.json` | REMOVE | none | Unused template file (D1.3) |

Components (kept unless marked):
- KEEP: `components/ui/*` (shadcn primitives on Base UI, accepted base stack), `metric-card`, `table-card`, `table-pagination`, `icon-button` (already has `sr-only` labels), `page-header`, `wizard-steps`, `info-tooltip`, `theme-provider`, `tenant-bits` (verify it imports no mock data in the TODO that touches it).
- UPDATE: `app-sidebar` (config-driven gates, D6.3), `command-palette` (same config), `nav-user` (`me.loginId` and role label), `site-header` (breadcrumbs from route meta), `dialogs` (remove the typed tenant-delete dialog; add confirm variants), `routes-meta` (new route keys).

### D9. Forms and validation (REQ-FE-029, REQ-FE-040, REQ-FE-049)

- Every form uses React Hook Form (adopted, FE-OQ-10) with the Zod resolver from `@hookform/resolvers` (zod adapter). The resolver version must support Zod 4; it is pinned in the TODO that adds it.
- Each form has a Zod 4 schema in `features/<name>/schema.ts`. Schemas mirror the FE doc rules and are the client check. The server is authoritative.
- Forms in scope: login, forgot password, reset password, change password, tenant create, tenant edit (PATCH), tenant category create and edit, country create and edit, system user create, system user role change, system role create and edit, master permission edit (name and description). The tenant permission checklist and the role permission checklist are controlled checkbox groups (React Hook Form `Controller`), not free-text forms.
- Rules to encode (FE doc reference):
  - Tenant: `code` required, max 50 (no transform); `name` required, max 100; `tenantCategoryId` required; `deploymentType` required, one of two values; `multiBranchEnabled` boolean, default true; `tenantAdminEmail` required e-mail, max 100; `countryCode` optional, `^[A-Z]{2}$`; `logoUrl` optional, `http` or `https` URL, max 500.
  - Category: `code` required, max 50, immutable after create; `name` required, max 100.
  - Country: `code` `^[A-Z]{2}$` (uppercased on input); `name` required, max 100; `nationalityName` max 100; `phoneCode` max 10.
  - System user: `loginId` required, e-mail; `systemRoleId` required.
  - System role: `key` required, max 100; `name` required, max 100; `description` optional; `active` boolean.
  - Master permission (edit only): `key` read-only; `name` required, max 100; `description` optional; `category` required, max 50; `module` required, max 50.
  - Login: `loginId` required; `password` required.
  - Change password: current, new and confirmation required; confirmation equals new.
  - Reset password: new and confirmation required; confirmation equals new.
- Server messages: a 400 `VALIDATION_ERROR` or `VALIDATION_FAILED` message is shown as one form-level alert next to the form. The UI does not split the message text into fields. Golden rule 8 forbids branching on message text. Field-level errors come only from the client schema.
- Input is kept on error, except the password fields on `INVALID_CREDENTIALS` (D4.5).
- `logoUrl` is also checked at render time: only `https:` (and `http:` in development) URLs are used as an image source (D15).

### D10. Routing and navigation (REQ-FE-012, REQ-FE-018)

- Path routes with the History API, one route table (`app/router.tsx`). The current mock uses hash routes (`#/tenant`). Path routes are needed for the reset link (D4.7) and for the FE doc's suggested paths. The routing question is answered: History API path routes, with no routing library (FE-OQ-37).
- Each route declares its gate (D6). A public route may set the optional `guestOnly` flag (D6.1, REQ-FE-056): `/login` and `/forgot-password` are guest-only and redirect (replace) an `authenticated` user to `/`; `/reset-password` is not guest-only. Route-level code splitting with `React.lazy` and one `Suspense` boundary per route.
- Error boundary per route. Unknown paths show a 404 screen. Denied routes show a 403 screen.
- Filters and pagination for lists live in search params, so the browser back button and shared links keep the view.
- Page titles and breadcrumbs come from `routes-meta.ts`.

### D11. Component architecture (Composition pattern)

- Layers: `components/ui` (primitives on Base UI under shadcn), `components/custom` (shared composed blocks), `components/layout` (shell), `features/*/components` (screen-specific blocks).
- Composition: `TableCard` is a compound (header, toolbar, table, footer with `TablePagination`). Screens compose it. Tabs and wizard steps follow the same pattern.
- Dialogs: one `DialogsProvider` for confirm dialogs. Confirm variants: destructive, with explanation text, with no typed input.

### D12. State management (REQ-FE-038, REQ-FE-043, REQ-FE-048)

Hierarchy: local state, then feature state, then global, then server state (`standards-frontend.md` State Management Standard).

| Kind | Mechanism | Rule |
|------|-----------|------|
| Server state | TanStack Query 5 (mandatory; adopted, ADR-FE-03) | Keys per resource from `lib/query/keys.ts` (D12.1). Every mutation invalidates the affected keys (D12.1). `staleTime` is set per resource in the TODO, not invented here |
| Global auth view state | React context (default; FE-OQ-30) | Holds status and `me`. The token lives in the module holder (D4.1) |
| Global UI | Sonner toaster; dialogs provider; theme provider | Existing components |
| Local and forms | React Hook Form with the Zod resolver (D9) | Form state is local to the form |
| URL | Search params | Filters and pagination only |

#### D12.1 Query keys and invalidation after every mutation (REQ-FE-048)

Key families (from `lib/query/keys.ts`): `['auth','me']`; `['sessions','own']`; `['admin','sessions', userId]`; `['master','tenants', filters]`, `['master','tenant', id]`; `['ref','tenantCategories']` and `['ref','countries']` (reference loaders); `['master','tenantCategories', filters]`, `['master','countries', filters]`; `['system','users', ...]`, `['system','user', id]`; `['system','roles']`, `['system','role', id]`, `['system','rolePermissions', id]`; `['system','masterPermissions']`; `['system','tenantPermissions', tenantId]`.

A mutation invalidates, in addition to its own resource, everything the table lists for it. Invalidation is a prefix match on the key family.

| Mutation | Invalidated keys |
|----------|------------------|
| Login | `['auth','me']` (set from the response, then refetched) |
| Logout | Clear the whole cache (D12.2) |
| Change password, `keepCurrentSession = true` | `['auth','me']` |
| Change password, `keepCurrentSession = false` | Clear the whole cache |
| Revoke own session (one or all) | `['sessions','own']` |
| Tenant create | `['master','tenants']` (lists and dashboard totals) |
| Tenant patch (including deactivate) | `['master','tenant', id]`, `['master','tenants']` |
| Admin-account retry | `['master','tenant', id]` |
| Tenant category create, update, delete | `['master','tenantCategories']`, `['ref','tenantCategories']`, `['master','tenants']` (names are joined in the tenant list) |
| Country create, update, delete | `['master','countries']`, `['ref','countries']`, `['master','tenants']` (country join) |
| System user create, role change, status change, reset password (no delete, REQ-FE-054) | `['system','users']`, `['system','user', id]` (role member counts derive from the user list) |
| Force logout (admin) | `['admin','sessions', userId]` |
| System role create, update, delete | `['system','roles']`, `['system','role', id]`, `['system','users']` (role labels) |
| Role permissions replace (PUT) | `['system','rolePermissions', id]`, `['system','role', id]` |
| Master permission update (name, description) | `['system','masterPermissions']`, `['system','tenantPermissions']` (all tenants), `['system','rolePermissions']` (checklists) |
| Tenant permissions replace (PUT) or toggle (PATCH) | `['system','tenantPermissions', tenantId]` |

#### D12.2 Logout and query client defaults

- Logout clears the whole server-state cache (`queryClient.clear()`) (REQ-FE-016).
- Query client defaults in `lib/query/client.ts`: retry disabled (D3.1), so no automatic retry of reads; window-focus refetch disabled in v1, so that focus events do not cause refresh-token rotations (documented default; revisit in the TODO that tunes caching).
- No persister. Cache contents are not written to any storage.

#### D12.3 Optimistic updates

- No optimistic updates for writes that touch auth-replicated state (tenant `is_active`, D8.2). Other writes are not optimistic in v1 either; the invalidation table above is the single rule for freshness.

### D13. Error handling (REQ-FE-008, REQ-FE-038, REQ-FE-044)

Taxonomy by disposition. Each row names what the user sees. Copy is proposed (FE-OQ-22).

| Disposition | Trigger (HTTP, code or kind) | UI behaviour |
|-------------|------------------------------|--------------|
| FORM | 400 `VALIDATION_ERROR`, `VALIDATION_FAILED`, `FIELD_IMMUTABLE`, `PASSWORD_POLICY_VIOLATION`, `INVALID_TOKEN` (reset), `TENANT_ROLE_NOT_FOUND` | Form-level alert with server message; input kept |
| REFRESH | 401 with refreshable code (D4.4) | Refresh and retry once; then logout |
| CREDENTIALS | 401 `INVALID_CREDENTIALS` | Login or change-password text (D4.5, D4.6) |
| FORBIDDEN | 403 `PERMISSION_DENIED`, `FORBIDDEN` | Toast "Anda tidak punya akses untuk aksi ini"; no logout |
| PASSWORD_CHANGE | 403 `PASSWORD_CHANGE_REQUIRED` | Route to change password |
| ACCOUNT | 403 `ACCOUNT_NOT_ACTIVE`, `ACCOUNT_NOT_READY` | On login: fixed copy by code (D4.5), reference id shown, server message never shown. On refresh or `me`: session ends and the login page shows the same copy as a notice (D4.2, D4.3, REQ-FE-055) |
| NOT_FOUND | 404 `RESOURCE_NOT_FOUND`, `SYSTEM_USER_NOT_FOUND`, `SYSTEM_ROLE_NOT_FOUND`, "Tenant not found." | Detail: "Data tidak ditemukan" with back button. List action: refresh list |
| CONFLICT | 409 `RESOURCE_CONFLICT`, `*_EXISTS` | Server message next to the action; form kept. Exception on Tim IT pages (system accounts and roles): an unrecognised 409 code shows fixed copy (D13.1), never server text |
| GUARD | 403 `PLATFORM_ROLE_PROTECTED`, 403 `ROLE_GUARD_VIOLATION` (role pages); 409 `SELF_ACTION_NOT_ALLOWED`, `LAST_SYSTEM_PRINCIPAL`, `SYSTEM_ROLE_IN_USE` | Fixed Indonesian copy by status and code (D13.1); never the server message; action stays available to retry after the cause is fixed |
| RATE_LIMIT | 429 `RATE_LIMIT_EXCEEDED`, `TOO_MANY_ATTEMPTS` | "Terlalu banyak permintaan, coba lagi sebentar"; login submit disabled 60 s |
| UNAVAILABLE | 503 `SERVICE_UNAVAILABLE` | Fixed Indonesian copy (D13.1) on team (system user and role) mutations; elsewhere the earlier rule holds (retry button; toggles keep old value, no optimistic update) |
| BAD_GATEWAY | 502 `INTERNAL_ERROR` | "Layanan sedang bermasalah, coba lagi" with reference id |
| SERVER | 500 `INTERNAL_SERVER_ERROR`, `INTERNAL_ERROR` | Generic toast with reference id |
| BAD_CLIENT | 400 `BAD_REQUEST`, `TENANT_RESOLUTION_FAILED` (gateway), 405, 406, 415 | Generic error with reference id and a console log (these are configuration or client bugs) |
| NETWORK | kind NETWORK, TIMEOUT, NON_JSON | Generic retry message; no reference id when none exists |
| CONTRACT | kind CONTRACT | Generic message with reference id; log the module name and missing key, never the body |

#### D13.1 Guard-failure copy (REQ-FE-053)

Module: `features/team/shared/guard-failure.ts`, used by `features/team/users/user-failure.ts` and `features/team/roles/role-failure.ts` (the two keep their other mappings). The mapper returns a copy key, never the server `message`; it branches on HTTP status plus `code` only (REQ-FE-008). Copy is the user's text of 2026-10-14; it still goes through the FE-OQ-22 approval but is not left to a default.

| Status | Code | Context | Copy (Indonesian) |
|--------|------|---------|-------------------|
| 409 | `SELF_ACTION_NOT_ALLOWED` | any | Aksi ini tidak dapat dilakukan pada akun Anda sendiri. |
| 409 | `LAST_SYSTEM_PRINCIPAL` | any | Aksi ditolak. Harus selalu ada minimal satu administrator utama yang aktif. |
| 409 | `SYSTEM_ROLE_IN_USE` | role pages | Peran masih dipakai akun. Pindahkan akunnya ke peran lain, lalu coba lagi. |
| 503 | `SERVICE_UNAVAILABLE` | team mutations | Layanan sedang sibuk. Perubahan belum disimpan, silakan coba lagi. |
| 403 | `PLATFORM_ROLE_PROTECTED` | role pages | Peran administrator utama dilindungi dan tidak dapat diubah atau dihapus. |
| 403 | `ROLE_GUARD_VIOLATION` | role pages | Peran administrator utama dilindungi dan tidak dapat diubah atau dihapus. (same string as `PLATFORM_ROLE_PROTECTED` in the role context; the role is still marked refused, edit and delete stay disabled; v1.0.7) |
| 403 | `PLATFORM_ROLE_PROTECTED` | account pages | Hanya administrator utama yang aktif yang dapat melakukan aksi ini terhadap akun administrator utama. |

- The context is passed by the caller (`role` or `account`), not inferred from the message.
- Scope (FE-OQ-40): only system account pages (Tim IT > Akun) and system role pages (Tim IT > Peran). Tenant role paths keep current handling and never use this module; `PLATFORM_ROLE_PROTECTED` there means a protected tenant role, and `SYSTEM_ROLE_IN_USE` is not returned there.
- Fallthrough removal (user instruction at approval, 2026-10-14), system account and system role pages only: a 409 or 503 whose `code` is not recognised does not fall through to the shared write helper and never shows server text. The correlation id is still shown.
  - Other 409: "Perubahan bertentangan dengan data terbaru. Muat ulang halaman, lalu coba lagi."
  - Other 503: same copy as `SERVICE_UNAVAILABLE` ("Layanan sedang sibuk. Perubahan belum disimpan, silakan coba lagi.").
  - Codes with their own handling stay as today: `SYSTEM_USER_LOGIN_EXISTS` (`isLoginExists`) and `SYSTEM_ROLE_KEY_EXISTS` (`isRoleKeyExists`).
  - Implemented in `guard-failure.ts`, `user-failure.ts` and `role-failure.ts`. `describeWriteFailure` in `features/tenants/create/write-failure.ts` is NOT changed (tenant pages use it).
- Any other status or code (not 409 or 503, and not the 403 codes in the table above) falls through to the existing mapping of the page. `403 ACCOUNT_NOT_ACTIVE` stays out of scope here (login handling, row ACCOUNT).
- The reference id rule below still applies to these toasts and alerts.
- Tests (Vitest and RTL, MSW): one component test per row; one test that `PLATFORM_ROLE_PROTECTED` yields the role copy on a role page and the account copy on an account page, and that the two strings differ; one test that the new mapping is not used on a tenant path (verified 2026-10-14: `src/` has no tenant-role screen or call today, so this test applies when such a path is added; until then it is a guard test on `guard-failure.ts` callers, which must be only `user-failure.ts` and `role-failure.ts`); one test that the raw server `message` is never rendered for these codes; one test (v1.0.7) that a role-page 403 `ROLE_GUARD_VIOLATION` (edit and delete) with a server `message` shows exactly the role-context `PLATFORM_ROLE_PROTECTED` copy, never the server text, and that the role is still marked refused (edit and delete disabled), with the reference id shown; fallthrough tests: a 409 with an unknown code on the account page, a 409 with an unknown code on the role page, and a 503 with an unknown code (account and role pages) each show the fixed copy above and no server text, with the reference id shown; one test that the tenant create page still shows the server message for an unknown 409 (`describeWriteFailure` unchanged).

##### D13.1a Guard codes reachable per remaining account action (v1.0.6, REQ-FE-054)

Source: auth-service `ARCH-BE-004` section 4 and the per-operation table (read-only, `../Microservices/auth-service/output/architecture/`). Account delete is no longer a UI action, so the tests that triggered guard refusals through delete must use the actions below.

| UI action (endpoint) | `SELF_ACTION_NOT_ALLOWED` | `LAST_SYSTEM_PRINCIPAL` | `PLATFORM_ROLE_PROTECTED` | `SERVICE_UNAVAILABLE` |
|----------------------|---------------------------|-------------------------|---------------------------|-----------------------|
| Tangguhkan, Nonaktifkan (PATCH `/system-users/{id}/status`, status not ACTIVE) | Yes (own account; UI hides the button, so MSW only) | Yes (target is the last active principal holder) | Not specified for this operation | Yes (lock timeout) |
| Ubah peran (PATCH `/system-users/{id}`) | Yes (own account) | Yes (moving the last active principal holder away from SYS_PRINCIPAL) | Yes (assigning SYS_PRINCIPAL by an actor who is not an active principal) | Yes |
| Reset password (POST `/system-users/{id}/reset-password`) | No (self reset is allowed) | No | Yes (target holds SYS_PRINCIPAL, actor not an active principal) | No (no holder lock) |
| Aktifkan (PATCH `/system-users/{id}/status`, status ACTIVE) | No | No | No | No (promotion has no guard) |

- `SYSTEM_ROLE_IN_USE` is a role-delete code only; it is unaffected by this amendment.
- The account-page copy of `PLATFORM_ROLE_PROTECTED` (table above) is reachable from role change and reset password. For suspend and deactivate of a principal holder by a non-principal actor the platform documents no `PLATFORM_ROLE_PROTECTED` (FE-OQ-41); tests must not assert it on those actions.
- TODO-022 tests that sent DELETE `/system-users/{id}` to produce `SELF_ACTION_NOT_ALLOWED`, `LAST_SYSTEM_PRINCIPAL` or `PLATFORM_ROLE_PROTECTED` are re-pointed: SELF and LAST to deactivate (status) or role change; PROTECTED to role change (assign SYS_PRINCIPAL) or reset password. Tests for the unrecognised-409/503 fallthrough re-point to any of these actions. Role-page tests (role delete, `SYSTEM_ROLE_IN_USE`, `PLATFORM_ROLE_PROTECTED` role copy) are unchanged.
- Platform note: SP-BG-13 (Closed 2026-10-14) resolution text lists the codes without naming operations; its original request text names delete (with deactivate, suspend, change role) as guarded. That is accurate on the server (`DELETE` is deactivation) but must not be read as a reason for a UI delete.

- Every toast and alert that comes from an error shows the reference id: the response `X-Correlation-ID` when readable, otherwise the request id (D3.2). Format: "Kode referensi: <id>" (copy FE-OQ-22).
- The gateway returns `Cache-Control: no-store` on its own errors (ARCH-BE-002 section 13). No client cache handling is needed for errors.

### D14. Tenant-specific rules (summary)

- Only one live DEDICATED tenant per deployment (server rule; FE shows the server message, D8.2).
- Create response: `default_branch_types` is ignored.
- `country` may be null on detail; render "—".
- `logo_url` may be null; PATCH with `null` clears it.

### D15. Security controls (REQ-FE-044, REQ-FE-046)

| Control | Design | Owner |
|---------|--------|-------|
| Token storage | Memory only (D4.1, D4.11) | architect_frontend |
| XSS | React escaping; no `dangerouslySetInnerHTML`; server strings rendered as text; `logoUrl` allowed only as `https:` at render time | architect_frontend |
| Input validation | Zod client schemas (D9); server authoritative | architect_frontend |
| Clickjacking | Frame policy at the static host (`frame-ancestors 'none'` or `X-Frame-Options: DENY`) | security_architect, ops (FE-OQ-20) |
| CSP inputs (proposal, not a policy) | `default-src 'self'`; `script-src 'self'` (no inline script in the build); `connect-src 'self'` (same-origin topology, D1.2; the API origin is added only under the fallback topology); `img-src 'self' https:` for tenant logos (FE-OQ-20); `style-src 'self' 'unsafe-inline'` only if the popper positioning needs it (to confirm); `object-src 'none'`; `base-uri 'self'`; `form-action 'self'` | security_architect (FE-OQ-20) |
| Referrer | `Referrer-Policy` no more than `strict-origin-when-cross-origin`, so the reset token is not leaked in a Referer header; the URL is also cleaned at once (D4.7) | security_architect (FE-OQ-20) |
| CSRF | No token; relies on SameSite and gateway origin check (D4.12) | security_architect |
| Secrets | None in the bundle. No `VITE_*` secret (D1.2) | architect_frontend |
| Logging | Reference id, status, code, route name only. No token, password, reset token, request or response body, or e-mail address (REQ-FE-046, D18) | architect_frontend |
| Dependencies | Each runtime dependency has a recorded justification and a decision (Table 5); audit: OQ-P-09 (CI and dependency audit not defined; default: static checks as Vitest tests, no CI gate) | architect_frontend |
| Idle timeout | None in v1 (no contract; FE-OQ-21) | security_architect |

### D16. Accessibility (REQ-FE-045)

WCAG 2.1 Level AA considerations (`standards-frontend.md` Accessibility Standard):
- Keyboard: every table row action and every dialog action is reachable by keyboard. Base UI primitives provide focus trapping in dialogs; the feature must not disable it.
- Focus: after a dialog closes, focus returns to the control that opened it. After a route change, focus moves to the page heading.
- Labels: every input has a visible `<label>`. Icon-only buttons keep the `sr-only` label (`IconButton` already does this).
- Errors: an invalid field has `aria-invalid` and `aria-describedby` to its message. Form-level alerts use `role="alert"`. React Hook Form error state drives both.
- Status: toasts (sonner) use a live region. Loading states on tables use `aria-busy`.
- Colour: status badges show text, not colour alone ("Aktif", "Nonaktif", "Ditangguhkan"). Confirm dialogs name the action in text.
- Language: `lang="id"` (D1.3).
- Viewport: the console is desktop-first. Minimum supported width is not defined (FE-OQ-29).

### D17. Performance (REQ-FE-038, REQ-FE-043)

- Route-level lazy loading. Icons are imported by name (`@tabler/icons-react`). No chart library is used (`recharts` is removed, Table 5).
- Fonts: two variable font packages are imported (`inter`, `plus-jakarta-sans`); the `geist` package is installed but not imported and is removed (Table 5). Keep one family after the design owner decides (FE-OQ-28). Bundle budget: defined after the first production build is measured (FE-OQ-28). No budget number is set in this document.
- Lists are server-paged (master-data) or client-paged over a small set (auth-service). Virtualisation is not needed at these sizes.
- Images: tenant logos use fixed dimensions and `loading="lazy"`.

### D18. Architectural patterns and logging

Pattern decision matrix (`architecture-principles.md`, Architectural Pattern Design; `tech-stack-frontend.md` patterns):

| Pattern | Decision | Reason |
|---------|----------|--------|
| Plugin / Registry | Not selected | Single application. No separately deployed or tenant-specific feature modules. A registry would add indirection with no second consumer |
| Strategy | Selected for access gates (D6.1) | Gate kinds vary by context and are composed. Each gate is testable in isolation |
| Configuration-driven | Selected for navigation and route gates (D6.3). Not selected for forms | Navigation config is shared by sidebar, palette and guard. Forms have distinct rules (12 forms); a field-renderer registry is not justified for v1 (revisit if forms multiply) |
| Composition | Selected for tables, dialogs, wizard and tabs (D11) | Reusable compound blocks with clear parent-child context |

Logging: client errors are written to the console in development. In production there is no sink in the contract or the platform (FE-OQ-27). Each log line is the reference id, status, code, route name and kind. No bodies, tokens, passwords or e-mail addresses (REQ-FE-046).

### D19. Testing strategy (REQ-FE-042, REQ-FE-050)

Adopted test stack (`tech-stack-frontend.md` Testing Standard; FE-OQ-12; ADR-FE-05):
- Vitest is the unit and component runner. It is chosen over Jest because the project already builds with Vite and Vitest shares that configuration.
- React Testing Library 16.x for component tests.
- MSW 2.x for API integration tests. MSW is adopted by default: the standard mandates it for API integration tests and the user did not address it. This document adopts it and records the adoption as a default, to be confirmed in ADR-FE-05.
- Exact versions are pinned in the TODO that installs them. The test scripts are added to `package.json` in that TODO.
- Playwright (E2E) is planned after the Tenants module integration works. It is not part of the initial phase.

| Layer | Scope | Examples |
|-------|-------|----------|
| Unit (mandatory for `lib/api/client.ts`, Vitest) | HTTP pipeline and refresh | Single-flight refresh (concurrent 401s produce one refresh call); 401 then refresh then retry once; second 401 logs out; exempt endpoints never refresh; 204 returns no body; error mapping to `{code, message}` with kinds (NETWORK, TIMEOUT, NON_JSON, CONTRACT); headers allow-list and forbidden headers never sent |
| Unit | Mappers, schemas, gates, admin-account classifier, query invalidation map | Snake-to-camel for every type; `classifyAdminAccount` for the five combinations; 401 policy table (D4.4); gate truth table (D6); invalidation map (D12.1) |
| Component (RTL) | Screens with MSW | Login error texts; forced password change redirects; tenant create three outcomes and Retry; immutable fields read-only; PATCH sends only allowed keys; `is_active` reverts on 503; no delete control (tenants; and no "Hapus" on system accounts, REQ-FE-054); self-protection hides suspend; React Hook Form errors reach `aria-describedby` |
| Integration (MSW 2.x) | All API modules against handlers from FE doc examples; route guards; query invalidation after mutations | Permission gating per route; SP-only master-data screens; SYS_ADMIN landing; FE doc 7 error behaviour per code |
| Static checks (CI) | Source scan | No `localStorage`/`sessionStorage` use for auth; no `X-User-ID`, `X-Role`, `X-Tenant-ID`, `X-Service-Token` string in `src`; no `dangerouslySetInnerHTML`; no `VITE_*` secret name |
| E2E (Playwright, later) | After Tenants integration works; not initial phase | Login, forced password change, create tenant with admin FAILED then Retry, deactivate |

FE doc section 12 acceptance mapping: each checklist line maps to at least one test in the table above. Smoke test (FE doc 13) is run manually against the local stack once per release. Coverage target 80% (guideline, `tech-stack-frontend.md`).

Test data: MSW handlers and fixtures are written from the FE doc examples and the contract. They never import from the mock `src/data` files, which are removed.

### D20. Dependencies on platform fixes (conditional)

Items below work with the current backend. They become visible only when the platform changes; the FE needs no redesign for them.

- Tenant admin-account state on detail (BG-01).
- Protected role flag (BG-06).
- Expose `X-Correlation-ID` to cross-origin pages (BG-10), only if the fallback topology (same-site sibling hosts) is chosen.

## Alternatives Considered

Each row records options and the disposition. The ADR candidates at the end of this document carry the decision-worthy items to `/decision`. The dispositions below form part of the approved design. The ADR candidates at the end remain Pending Approval.

| ID | Decision | Options | Disposition and reason |
|----|----------|---------|------------------------|
| A-01 | Local dev topology | (a) Vite `/api` proxy with Host rewrite; (b) direct cross-origin calls to the gateway with credentials; (c) Vite proxy without Host rewrite | (a) chosen (FE doc 1.1; coordinator direction v0.2). (b) rejected: `SameSite=Strict` refresh cookie not sent cross-site. (c) rejected: the gateway picks the SYSTEM context from Host, so the call fails with the wrong context |
| A-02 | Token storage | (a) memory; (b) `sessionStorage`; (c) `localStorage`; (d) HttpOnly cookie read by a BFF | (a) chosen. (b) and (c) are prohibited without justification (tech-stack-security; FE doc 0 rule 4). (d) would add a server component the platform does not have (no BFF in scope) |
| A-03 | Refresh concurrency across tabs | (a) in-tab single-flight only; (b) single-flight plus Web Lock; (c) `BroadcastChannel` leader election; (d) platform grace window for rotated refresh tokens | (b) chosen. (a) leaves cross-tab reuse risk (RK-FE-01). (c) gives the same guarantee with more code. (d) rejected: it weakens reuse detection, which is mandatory and cannot be configured off (AUTH ARCH-SEC-001 section 3) |
| A-04 | Refresh timing | (a) reactive: refresh on 401; (b) proactive timer before the 15-minute expiry | (a) chosen. (b) adds refresh calls, increases the chance of cross-tab races, and runs timers in background tabs |
| A-05 | Master-data gate | (a) `me.role` equals SYS_PRINCIPAL; (b) permission keys with invented master-data keys; (c) show to all SP users and rely on 403 | (a) chosen (D6.2). (b) rejected: keys do not exist in the contract. (c) rejected by SP-DEC-01 |
| A-06 | JSON mapping | (a) explicit mappers per type; (b) generic key-case transform; (c) snake_case in components | (a) chosen: typed and reviewable. (b) rejected: hides drift and renames keys silently. (c) rejected by FE doc 0 rule 6 |
| A-07 | Response validation | (a) Zod 4 at the mapper boundary; (b) types only | (a) chosen (D5.5). Runtime cost is small; it reports drift as `CONTRACT` |
| A-08 | Server-state library | (a) TanStack Query 5 (mandatory standard); (b) custom cache | (a) adopted (FE-OQ-08, ADR-FE-03). (b) rejected: it would have to meet the same invalidation and retry rules by hand |
| A-09 | Global state | (a) React context for auth view state (default); (b) Zustand; (c) Redux Toolkit | Default (a): no new dependency, one global concern. Options (b) and (c) are presented for the project decision (FE-OQ-30); not self-selected |
| A-10 | Routing | (a) path routes with History API and a routing library; (b) keep the hash router | (a) chosen: reset link and suggested paths need path routes. History API path routes (FE-OQ-37 answered 2026-10-10) |
| A-11 | Application framework | (a) Vite 8 SPA (accepted base stack); (b) Next.js 15 App Router (standard default) | (a) accepted (FE-OQ-02, ADR-FE-01). Reasons: the user's direction assumes the Vite dev proxy; the platform needs no server-side rendering for an authenticated console; the team has the Vite tooling in place |
| A-12 | Forms | (a) React Hook Form with the Zod resolver (standard); (b) native form state | (a) adopted for every form (FE-OQ-10, ADR-FE-03). Schemas stay library-independent (D9) |
| A-13 | Correlation id display | (a) response header; (b) request id generated by the client | Both: response header when readable, request id otherwise (D3.2). Works for cross-origin without new gateway work |
| A-14 | Automatic retry | (a) none; (b) one retry for GET on network error | (a) chosen for v1: writes are not idempotent (BG-11); cached reads do not retry either (D12.2). A single explicit retry button is simple and visible. Revisit with BG-11 |
| A-15 | Tenant create UI | (a) keep the wizard, four steps; (b) single form | (a) keeps the mock layout (reuse). Step count reduced to the contract |
| A-16 | Mock surfaces with no contract | (a) show as disabled placeholders; (b) remove from v1 navigation | (b) chosen. Empty screens with fake data are the risk the mock already carries |
| A-17 | Idle timeout | (a) none in v1; (b) client inactivity logout | (a) default. No contract or platform requirement; FE-OQ-21 |
| A-18 | Tenant logo | (a) external `https` image with render-time check; (b) gateway proxy for logos; (c) no logos | (a) chosen. (b) is new backend scope. (c) drops a contract field |
| A-19 | Patterns | Plugin/Registry; Configuration-driven forms | Not selected (D18). Reasons recorded there |
| A-20 | Production topology | (a) same-origin path routing: one SP host serves static FE and `/api/*` to the gateway; (b) same-site sibling hosts with CORS credentials; (c) cross-site | (a) recommended (REQ-FE-047, ADR-FE-06). (b) accepted as the second option, with costs listed in D1.2. (c) not supported: the `SameSite=Strict` refresh cookie is not sent cross-site |
| A-21 | HTTP client | (a) `fetch` wrapper (FE doc section 10 reference); (b) Axios with interceptors (standard) | (a) accepted as a deviation (FE-OQ-09, ADR-FE-02). Justification in Table 4 SD-08 |
| A-22 | Authentication library | (a) first-party login: access token from `POST /api/v1/auth/login`, refresh cookie from the platform; (b) NextAuth (Auth.js) 5 beta (standard) | (a) accepted as the standard exception (FE-OQ-11, ADR-FE-04). NextAuth needs an OIDC or OAuth provider in scope, which does not exist; a second session layer would duplicate reuse detection and revocation, which the platform owns |
| A-23 | Unit and integration test runner | (a) Vitest; (b) Jest 29 | (a) adopted (FE-OQ-12, ADR-FE-05). Shares the Vite configuration; (b) would need a separate transform setup |
| A-24 | API mocking | (a) MSW 2.x; (b) hand-written `fetch` mocks | (a) adopted by default (ADR-FE-05). Keeps integration tests on the wire format of the FE doc |
| A-25 | E2E timing | (a) Playwright now; (b) Playwright after the Tenants module integration works | (b) chosen: initial phase is unit, component and MSW tests. Playwright follows the first working integration |
| A-26 | Dependency set | (a) keep every installed package; (b) keep only packages with a recorded use and justification | (b) chosen (FE-OQ-13, ADR-FE-07, Table 5). Unused packages are removed in the TODO that touches them |

## Risks

| ID | Risk | Likelihood | Impact | Mitigation | Residual |
|----|------|------------|--------|------------|----------|
| RK-FE-01 | Cross-tab or StrictMode refresh overlap presents a rotated cookie and revokes the user's sessions (reuse) | Medium | High | Single-flight in tab; Web Lock across tabs (D4.3); test for concurrent 401s (D19) | Low with Web Locks; Medium on browsers without `navigator.locks` |
| RK-FE-02 | Same-site misconfiguration in staging or production makes refresh fail, and the app loops to login | Medium | High | Recommended same-origin topology removes the cross-site question (D1.2); startup check of the base URL; E2E on staging after the Tenants integration | Low |
| RK-FE-03 | Gate drift: the backend changes the SYS_PRINCIPAL mapping (SEC-OQ-02), and the UI hides or shows screens wrongly | Low | Medium | One constant (D6.2); the change is listed in the platform change set | Low |
| RK-FE-04 | Accepted deviations (fetch client, first-party login) are later questioned without their ADR, or the adopted tools are not installed in time | Medium | Medium | ADR candidates listed (end of document); TODO for installing the adopted tools (Table 5) | Low once ADRs are decided |
| RK-FE-05 | Mock data is mistaken for the contract (for example `branchCount`, OWNER keys, clinic permission keys) | High | High | Data files removed from runtime (D2, Table 2); fixtures written from the FE doc | Low |
| RK-FE-06 | Contract drift: master-data v1.3 says B-02 is Open while auth-service now has the E-01 and E-02 controllers | Medium | Medium | Mapper validation (D5.5); FE handles every `admin_account` outcome (D8.2); FE-OQ-31 | Low |
| RK-FE-07 | Non-idempotent writes duplicated by user resubmission (tenant create, system user create, reset-password e-mail) | Medium | Medium | In-flight disable; server 409 handling; no automatic retry (D3.1); BG-11 | Medium until BG-11 |
| RK-FE-08 | Tenant admin account missing and not visible on the detail page | Medium | High | Retry on detail always offered (D8.2); BG-01 | Medium until BG-01 |
| RK-FE-09 | English server messages shown to Indonesian users | High | Low | Copy keyed by `code` (C-09, D13); FE-OQ-22 | Low |
| RK-FE-10 | Runtime dependencies without use or justification increase supply-chain exposure | Medium | Medium | Table 5 decisions; removal of unused packages in the TODO; audit: OQ-P-09 (CI and dependency audit not defined; default: static checks as Vitest tests, no CI gate) | Low after Table 5 is applied |
| RK-FE-11 | External logo URL used as image source (tracking or unsafe scheme) | Medium | Medium | `https` check at render; CSP `img-src` (D15); FE-OQ-20 | Low after FE-OQ-20 |
| RK-FE-12 | Access token lost on reload | High | Low | Expected: refresh at boot (D4.2) | Accepted |
| RK-FE-13 | Logout in one tab leaves other tabs' access tokens usable for a short window | Medium | Low | Logout broadcast (D4.8); platform 30-second edge window (ARCH-SEC-001 section 2.5) | Accepted |
| RK-FE-14 | Legacy `refreshToken` cookie at `Path=/` in development browsers | Low | Low | Server ignores the legacy name (ARCH-SEC-003 SC-CK-07); development browsers may need one manual cookie clear | Low |
| RK-FE-15 | Unlisted development origin (not `localhost:3000`) gets 403 on every write | Medium | Medium | Host table entry is part of the developer setup; smoke test includes a POST (D1.1) | Low |
| RK-FE-16 | Reverse proxy does not pass the Host header unchanged, so the gateway maps the SP host to the wrong context or rejects it | Medium | High | Operator edge file per environment with the SP host and context SYSTEM (REQ-FE-047); apigateway owner confirms the Host passthrough (Dependencies); post-deploy smoke test | Low |
| RK-FE-17 | Reverse proxy sends `/internal/` or `/.well-known/` to the gateway | Low | Medium | The gateway blocks both on every host (ARCH-SEC-002); the proxy routes only `/api/` (D1.2) | Low |

## Dependencies

- Platform (read-only): ARCH-SOLUTION-001 v1.1; ARCH-SEC-001 v0.4; ARCH-BE-001 v0.2; ADR-009 (Approved). No platform artifact is changed by this document.
- Gateway: ARCH-SEC-002 and ARCH-BE-002 (header rules, CORS, host table, error vocabulary). The apigateway owner confirms that the Host header passed by the production reverse proxy is the host-table key (ARCH-BE-002 section 6).
- Operator: the production edge file per environment, with the SP host and context SYSTEM (REQ-FE-047; P-13 procedure). Fallback topology only: the exact SP origin in the system host's `cors-allowed-origins`.
- Infrastructure: domain names and reverse-proxy configuration (FE-OQ-36).
- auth-service: ARCH-SEC-003 section 10 (cookie), ARCH-SEC-001 section 3 and 8 (refresh and reuse), ARCH-BE-003 (endpoints). auth-service is unchanged by the same-origin topology.
- master-data-service: `api-reference.md` v1.3 (fields, filters, headers, cache).
- Operations: static-host headers (FE-OQ-20); client error sink (FE-OQ-27).
- Product and user: UI copy (FE-OQ-22), navigation scope (FE-OQ-23), feature mapping (FE-OQ-24).
- Security: CSP and frame inputs (FE-OQ-20), storage and idle policy (FE-OQ-21), sibling-host analysis for the fallback topology.
- Tooling: installation of TanStack Query, React Hook Form, the Zod resolver, Vitest, React Testing Library and MSW, and removal of unused packages, in the first TODO that needs them (Table 5).

Table 3 — backend gaps (for routing only; not designed here). None of these blocks the FE from being built; the affected screen or field is removed or degraded until the gap is closed.

| ID | Need | Where it shows | Evidence | Route to |
|----|------|----------------|----------|----------|
| BG-01 | Admin-account state (`status`, `tenant_status_sync`) on the tenant detail response | Tenant detail (D8.2) | FE doc 6.3: `admin_account` only on create and retry responses | master-data-service architect (platform TODO) |
| BG-02 | Tenant aggregates (branch count, user count, active sessions) and setup state (`registration_state`) | Tenant list, detail, dashboard | No field in FE doc 6.3. Branches are not accessible to SP (403) | solution_architect (scope), master-data-service |
| BG-03 | Tenant-wide session aggregate and revoke-all for a tenant. The mock comment proposes `DELETE /admin/tenants/{tenantId}/sessions`; that path is not in the contract and is not designed here | Sessions screen (mock) | FE doc 3.4, 5.6 are per user only | auth-service architect_backend, with security review |
| BG-04 | System user display name and last-active time | Akun list | `SystemUser` has `loginId` and timestamps only (FE doc 5.1) | auth-service architect_backend |
| BG-05 | System user statuses beyond ACTIVE, SUSPENDED, DEACTIVATED (mock has INACTIVE and PENDING_APPROVAL) | Akun list and filters | FE doc 5.1 status enum. Mapping INACTIVE to DEACTIVATED needs product confirmation first | solution_architect (product), then auth-service if needed |
| BG-06 | Protected or system marker on system roles | Peran list and actions | `SystemRole` has no such field (FE doc 5.2); the guard in SystemRoleService and SystemUserService was added under SP-BG-13 (Closed 2026-10-14, v1.0.5). Original text: auth-service has no guard for SYS_PRINCIPAL (SystemRoleService allows update, delete and permission replacement). The FE locks SYS_PRINCIPAL statically (D6.6). Escalated as SP-BG-13 (platform clarifications), which also covers the missing self-deactivation guard in SystemUserService | auth-service architect_backend |
| BG-07 | Locked (`core`) flag on master permissions and per-permission bound-tenant count | Katalog permission | `MasterPermission` has `active` and `customerPermitted` only (FE doc 5.3) | auth-service architect_backend, product |
| BG-08 | Operations surfaces: domain events and reprocess, deletion queue and scheduler, audit log, platform settings, dashboard attention and activity feeds | Mock Sistem pages, dashboard | No endpoint in FE doc sections 3 to 6 or 8 | solution_architect (which service owns each is not defined) |
| BG-09 | Free-text tenant search by name | Tenant list | Contract supports exact `code` only (FE doc 11) | master-data-service (only if product requires) |
| BG-10 | `Access-Control-Expose-Headers` for `X-Correlation-ID` on cross-origin SP origins | Error reference ids | Gateway is the single CORS authority and removes `Access-Control-*` from downstream responses (SC2-HDR-13); no expose list is defined. Not needed in the recommended same-origin topology | apigateway architect_backend (ARCH-SEC-002 owner); only if the fallback topology is chosen |
| BG-11 | Idempotency key for non-idempotent public writes (tenant create, system user create, reset-password e-mail trigger, master-data and role creates). The FE doc defines none | Tenant create, system user create, reset password | `tech-stack-backend.md` Idempotency Standard applies to retryable writes; FE does not retry (D3.1) | architect_backend of each service and platform ARCH-BE-001 owner (conformance question) |
| BG-12 | Server-side guard: auth-service must refuse deactivate and delete of master permissions still used by active system roles (at least the core keys `system_users:*`, `system_roles:*`, `master_permissions:*`, `sessions:*`). Reason: `PermissionResolutionService` uses only active, non-deleted master permissions, so deactivating or deleting a core key revokes it from every role including SYS_PRINCIPAL and can lock out all admins. The FE removes these actions (REQ-FE-035) but the API still allows them | Katalog permission (defence in depth; same family as BG-06) | User decision 2026-10-12; handled in the platform repository as an addition to SP-BG-13 | auth-service architect_backend |
| BG-13 | `GET` and `DELETE /api/v1/system-users/{id}/sessions` for another system user (`sessions:view`, `sessions:revoke`; own account -> 409 `SELF_ACTION_NOT_ALLOWED`; `SYS_PRINCIPAL` holder only by an active principal, else 403 `PLATFORM_ROLE_PROTECTED`). The admin sessions endpoint `/api/v1/admin/users/{userId}/sessions` serves tenant employees only (404 for system users) and is not used for system users. GET has no principal protection (D4.10) | System user detail, tab "Sesi aktif" (D4.10), enabled by `OTHER_ACCOUNT_SESSIONS_ENABLED=true` (v1.0.13) | Platform item SP-BG-14 (Closed 2026-10-15); user decisions 2026-10-14 and 2026-10-15 | auth-service architect_backend |

Table 4 — stack decision register (`tech-stack-frontend.md`). Version 0.2 records the coordinator's decisions. Every row is an ADR candidate for `/decision` (Pending Approval). No row is Blocking.

| ID | Standard requires | Repository and decision (v0.2) | Justification | ADR candidate |
|----|-------------------|--------------------------------|---------------|---------------|
| SD-01 | Next.js 15 App Router for web applications | Accepted: Vite 8 SPA. Next-specific items (`next/image`, Next config headers) do not apply; hosting headers per D15. History API path routes; no routing library (FE-OQ-37 answered 2026-10-10) | Coordinator direction; the dev proxy in FE doc 1.1 is Vite-based; the authenticated console needs no server rendering | ADR-FE-01 |
| SD-02 | Bun as package manager (`bun.lock`) | Accepted: npm (`package-lock.json`) | Existing lockfile; the team's tooling | ADR-FE-01 |
| SD-03 | Tailwind CSS 3.4.x | Accepted: Tailwind 4 (`@tailwindcss/vite`) | Existing configuration and `index.css`; the shadcn theme import is in place | ADR-FE-01 |
| SD-04 | shadcn/ui on Radix UI | Accepted: shadcn/ui components on Base UI (`@base-ui/react`) | Existing components (20 files use Base UI); Base UI is part of the accepted base stack | ADR-FE-01 |
| SD-05 | TypeScript 5.7 strict, with the listed compiler options | Accepted: TypeScript 6. Required conformance fixes: `exactOptionalPropertyTypes`, `noImplicitReturns`, `forceConsistentCasingInFileNames`, `resolveJsonModule` (D1.3, REQ-FE-051) | Existing toolchain; strictness kept by the listed options | ADR-FE-01 |
| SD-06 | Zod 3.x | Accepted: Zod 4. The resolver version must support Zod 4 (D9) | Existing dependency; schemas are written for Zod 4 | ADR-FE-01 |
| SD-07 | TanStack Query 5.x for API-backed features | Adopted (mandatory): install TanStack Query 5, pinned in the TODO. Invalidation rules in D12.1 | Mandatory standard; accepted by the coordinator (FE-OQ-08) | ADR-FE-03 |
| SD-08 | Axios with interceptors through one approved API client | Accepted deviation: `fetch`-based client in `lib/api/client.ts` (FE doc section 10). Axios is not used | The pipeline is one module with one owner; its needs (headers, timeout, 401 policy, error mapping) are covered by `fetch` with `AbortController`; Axios would add a dependency for interceptors this design does not need; the FE doc reference client is fetch-based; the module is fully unit-tested (D19). Trade-off: no built-in interceptor chain, so the pipeline must stay complete and tested | ADR-FE-02 |
| SD-09 | React Hook Form 7 with Zod resolver for forms with input | Adopted (mandatory): React Hook Form with `@hookform/resolvers` (zod adapter) for every form (D9) | Mandatory standard; accepted by the coordinator (FE-OQ-10) | ADR-FE-03 |
| SD-10 | NextAuth (Auth.js) 5 beta (OIDC or OAuth 2) for protected applications; OIDC preferred | Accepted exception: first-party login (`POST /api/v1/auth/login`, platform access token, platform refresh cookie). NextAuth is not used | Platform login is the decided mechanism (AUTH ADR-001 RS256; ARCH-SEC-001; ARCH-BE-003). No OIDC or OAuth provider is in scope. A second session layer would duplicate reuse detection and revocation. The standard's storage, CSRF and cookie rules are met by D4 and D15 | ADR-FE-04 |
| SD-11 | Vitest or Jest 29 with React Testing Library 16 and MSW 2 | Adopted: Vitest, React Testing Library 16.x, MSW 2.x (by default, see D19). Playwright after Tenants integration | Standard permits Vitest; coordinator direction (FE-OQ-12); MSW adopted by default because the standard mandates it | ADR-FE-05 |
| SD-12 | Dependencies justified (purpose, justification, risk) | Accepted with decisions per package in Table 5. Unused packages are removed in the TODO that touches them; missing adopted tools are added | Standard requirement; Table 5 holds the verified use of each package | ADR-FE-07 |

Table 5 — runtime dependency justifications (`package.json` as read on 2026-10-10; usage verified by search of `src/` and the Vite and HTML entry points).

| Package (range) | Used in | Justification | Decision |
|-----------------|---------|---------------|----------|
| `react` ^19.2.6, `react-dom` ^19.2.6 | Whole application | Accepted base framework (SD-01) | Keep |
| `vite` ^8 (dev), `@vitejs/plugin-react` ^6 (dev) | Build and dev server; `vite.config.ts` | Accepted build tool (SD-01); dev proxy (D1.1) | Keep |
| `typescript` ~6 (dev) | Type checking | Accepted (SD-05) | Keep; apply compiler options (D1.3) |
| `tailwindcss` ^4, `@tailwindcss/vite` ^4 | `index.css`, `vite.config.ts` | Accepted styling (SD-03) | Keep |
| `tw-animate-css` ^1.4.0 | Imported in `index.css` | Animation utilities required by the shadcn theme | Keep |
| `shadcn` ^4.19.0 | `shadcn/tailwind.css` imported in `index.css`; `components.json` | Provides the theme import at build time. The CLI is not used at runtime | Keep; move to devDependencies in the TODO |
| `@base-ui/react` ^1.7.0 | 20 files in `components/ui` | Accepted UI primitives (SD-04) | Keep |
| `class-variance-authority` ^0.7.1 | 6 files in `components/ui` (variants) | Variant styling of the shadcn primitives | Keep |
| `clsx` ^2.1.1, `tailwind-merge` ^3.6.0 | `lib/utils.ts` (`cn`) | Class-name composition used by all components | Keep |
| `@tabler/icons-react` ^3.46.0 | 34 files | Icon set; imported by name so only used icons are bundled | Keep |
| `@fontsource-variable/inter` ^5.3.0, `@fontsource-variable/plus-jakarta-sans` ^5.3.0 | Imported in `index.css` | Two font families are loaded; keep one after the design decision (FE-OQ-28) | Keep pending FE-OQ-28 |
| `@fontsource-variable/geist` ^5.3.0 | Not imported anywhere | Installed but unused | Remove |
| `sonner` ^2.0.8 | 16 files (toasts), `main.tsx` (`Toaster`) | Feedback for success and error states (D13) | Keep |
| `next-themes` ^0.4.6 | `components/ui/sonner.tsx` only | Supplies the theme to Sonner. The app also has its own `theme-provider` with a `theme` key, so there are two theme sources | Keep for now; consolidate to one theme source in the theme TODO, then remove if unused |
| `recharts` ^3.8.0 | Not imported anywhere | No chart in the contract or the mock is built with it | Remove; re-add only through a decision |
| `@dnd-kit/core` ^6.3.1, `@dnd-kit/modifiers` ^9.0.0, `@dnd-kit/sortable` ^10.0.0, `@dnd-kit/utilities` ^3.2.2 | Not imported anywhere | No drag-and-drop in the FE doc | Remove |
| `@tanstack/react-table` ^9.2.4 | Not imported anywhere | Server-paged tables do not need a headless table library; TanStack Query is the adopted data library | Remove unless a table TODO justifies it |
| `zod` ^4.5.2 | Not yet imported (schemas to be written, D9) | Validation schemas and mapper validation (D5.5, D9) | Keep; used by the adopted design |
| `react-hook-form`, `@hookform/resolvers`, `@tanstack/react-query` | Not installed | Adopted tools (SD-07, SD-09) | Add in the first TODO that needs them; pin exact versions |
| `vitest`, `@testing-library/react` 16.x, `msw` 2.x | Not installed (dev) | Adopted test stack (SD-11) | Add in the first TODO that needs them; pin exact versions; add test scripts to `package.json` |
| `@playwright/test` | Not installed | E2E planned after Tenants integration | Add later, not in the initial phase |

Items not in Table 4 or 5 (conformance, non-blocking): client error reporting is mandatory for production (FE-OQ-27). Bundle budget is conditional (FE-OQ-28). Automated accessibility checks are conditional (FE-OQ-34).

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| FE-OQ-01 | What is the staging and production topology of the SP origin and the gateway host? | The refresh cookie is `SameSite=Strict`; cross-site requests do not carry it | Production build, `VITE_API_BASE_URL`, operator edge file, CSP `connect-src` | user, ops, solution_architect | No | Answered | Same-site. Recommended: same-origin path routing, one SP host per environment serves the static FE and sends `/api/*` to the gateway; the Host header is passed through; FE uses relative `/api` paths; no CORS for SP. Second option: sibling subdomains in the same site with CORS credentials in the operator edge file. Cross-site not supported. Deployment requirement REQ-FE-047. ADR-FE-06 (Pending Approval). Domain names: FE-OQ-36 |
| FE-OQ-02 | SD-01: Vite SPA or Next.js 15 App Router? | Application shell, routing, header delivery | Whole application | user, decision-manager | No | Answered | Vite 8 SPA accepted as base stack (ADR-FE-01). Routing library split to FE-OQ-37 |
| FE-OQ-03 | SD-02: npm or Bun? | CI and onboarding | Tooling only | user | No | Answered | npm accepted (ADR-FE-01) |
| FE-OQ-04 | SD-03: Tailwind 4 or 3.4? | Styling tokens and config | Styling, `index.css` | user | No | Answered | Tailwind 4 accepted (ADR-FE-01) |
| FE-OQ-05 | SD-04: Base UI or Radix UI under shadcn? | Focus and dialog behaviour (D16) | Components in `components/ui` | user | No | Answered | Base UI under shadcn accepted as part of the base stack (ADR-FE-01) |
| FE-OQ-06 | SD-05: TypeScript 6 or 5.7? | Compiler version and options (D1.3) | Build | user | No | Answered | TypeScript 6 accepted (ADR-FE-01). Required compiler options are conformance fixes (REQ-FE-051) |
| FE-OQ-07 | SD-06: Zod 4 or Zod 3? | Schema and mapper validation (D5.5, D9) | Schemas | user | No | Answered | Zod 4 accepted (ADR-FE-01). The resolver version must support Zod 4 |
| FE-OQ-08 | SD-07: TanStack Query 5? | Server-state rules (D12) | Data layer | user, decision-manager | No | Answered | Adopted as the mandatory server-state layer. Invalidation after every mutation (D12.1, REQ-FE-048). ADR-FE-03 |
| FE-OQ-09 | SD-08: Axios or `fetch`? | Pipeline (D3) | Data layer | user, decision-manager | No | Answered | `fetch`-based client accepted as a deviation with justification (Table 4 SD-08). Axios not used. ADR-FE-02 |
| FE-OQ-10 | SD-09: React Hook Form? | Form implementation (D9) | Forms | user | No | Answered | React Hook Form with `@hookform/resolvers` (zod adapter) for every form (REQ-FE-049). ADR-FE-03 |
| FE-OQ-11 | SD-10: NextAuth? | Mandatory standard item | Authentication module (D4) | user, security_architect | No | Answered | Read as accepted: first-party platform login is the standard exception. NextAuth not used. ADR-FE-04 |
| FE-OQ-12 | SD-11: Vitest or Jest, with RTL and MSW? | Test layers (D19) | Test tooling | user | No | Answered | Vitest with React Testing Library 16.x. MSW 2.x adopted by default (the standard mandates it; the user did not address it). `api/client.ts` unit tests are mandatory (REQ-FE-050). Playwright later. ADR-FE-05 |
| FE-OQ-13 | SD-12: justify each runtime dependency? | Dependency standard | Bundle and supply chain | user | No | Answered | Justification and decision per package in Table 5. Unused packages (`recharts`, `@dnd-kit/*`, `@tanstack/react-table`, `@fontsource-variable/geist`) removed in the TODO that touches them. ADR-FE-07 |
| FE-OQ-14 | FE doc section 4 writes role `SYSTEM_PRINCIPAL`; `me.role` carries `SYS_PRINCIPAL`. Confirm the FE value | Master-data gate (D6.2) | One constant | architect_frontend, FE doc owner | No | Open | Documented default: `me.role = SYS_PRINCIPAL` (FE doc 3.3 example; ARCH-SEC-001 section 9.2 c). FE doc wording to be corrected |
| FE-OQ-15 | FE doc section 4 says "show always" for every SP user. SP-DEC-01 narrows master-data visibility to SYS_PRINCIPAL. Confirm the narrowing is the FE rule | Master-data gate (D6.2) | Which screens SYS_ADMIN and SYS_SUPPORT see | user | No | Open | Documented default: SP-DEC-01 applies (SYS_PRINCIPAL only). Revisit when SEC-OQ-02 is decided |
| FE-OQ-16 | Default sort order of `GET /api/v1/tenants` is not defined in the contract | "Latest" dashboard widget (D8.1) | Label and data order | architect_frontend, master-data architect | No | Open | Documented default: server order, labelled without "latest" |
| FE-OQ-17 | Is `key` immutable on PATCH of system roles and master permissions? The contract does not say | Edit forms | Whether `key` is read-only and sent unchanged | auth-service architect_backend | No | Open | Documented default: `key` is read-only in edit forms and sent unchanged. Renaming a system role key would change the role string that the UI gates on (D6.2) |
| FE-OQ-18 | Which 401 code does an expired access token return at the gateway and at auth-service? | Refresh trigger set (D4.4) | Refresh behaviour | architect_frontend, auth-service architect_backend | No | Open | Documented default: `UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED` trigger refresh. Verify with a live expired token before the first integration test |
| FE-OQ-19 | Which URL does the reset e-mail contain? | Reset page route (D4.7) | Reset flow end to end | auth-service architect_backend, ops | No | Open | Documented default: `/reset-password?token=` on the SP origin |
| FE-OQ-20 | CSP, frame, referrer and image policy for the static host: `connect-src`, `img-src` for tenant logos, `style-src` (`unsafe-inline` for popper positioning, to confirm), `frame-ancestors`, `Referrer-Policy`; sibling-host analysis if the fallback topology is chosen | Security controls (D15, D4.12) | Build headers; logo rendering | security_architect, ops | No | Open | Documented default: the proposal in D15. Blocking only if the security decision changes the design (for example, a logo proxy in the gateway) |
| FE-OQ-21 | Browser storage and idle timeout policy. The contract has no idle timeout | Session UX (D4.11, D15) | Inactivity logout | security_architect | No | Open | Documented default: theme preference only in storage; no idle logout in v1 |
| FE-OQ-22 | UI language and error copy: Indonesian copy keyed by `code` (proposed), with server messages as fallback. Approve the copy deck | Every visible message (D13) | Copy | user, product | No | Open | Documented default: Indonesian copy for the codes named in the FE doc; server `message` shown only where D13 says so. v1.0.5: the six guard-failure strings in D13.1 are fixed by the user (2026-10-14); the rest of the deck stays open |
| FE-OQ-23 | v1 navigation scope: are the removed mock surfaces (events, housekeeping, audit, platform settings, dashboard feeds, tenant session aggregate) out of v1? | Table 2 | Navigation and scope | user, product | No | Open | Documented default: REMOVE-V1 as shown in Table 2 |
| FE-OQ-24 | Does the mock "Fitur aktif" (feature modules and flags) map to the tenant Permissions tab (FE doc 5.4)? | Tenant detail and wizard (D7, Table 2) | Feature configuration after create | user, product | No | Open | Documented default: yes, the Permissions tab replaces it; mock flags are removed |
| FE-OQ-25 | Should the own account be able to change its own system role in the UI? | System user detail (D6.6) | One action | user | No | Open | Documented default: hidden in the UI. Backend behaviour not defined in the contract |
| FE-OQ-26 | Idempotency for non-idempotent public writes (BG-11) | Duplicate creates and e-mails (RK-FE-07) | Retry policy | architect_backend (platform) | No | Open | Documented default: no automatic retry in the FE; in-flight disable; 409 handled |
| FE-OQ-27 | Client error reporting sink for production (mandatory per standard) | Observability (D18) | Production readiness | ops, user | No | Open | Documented default: console plus reference id in development. A sink must be defined before the first production deployment |
| FE-OQ-28 | Bundle budget and the second font family | Performance (D17) | Build measurement | architect_frontend | No | Open | Documented default: budget set after the first measured production build; keep one font family after the design owner decides |
| FE-OQ-29 | Minimum supported viewport and whether the console supports phone widths | Layout and accessibility (D16) | Responsive scope | user, product | No | Open | Documented default: desktop-first; no phone layout commitment |
| FE-OQ-30 | Global state library: React context (default) or Zustand or Redux Toolkit | Standard requires a documented project decision (D12, A-09) | Global state code | architect_frontend, user | No | Open | Documented default: React context for auth view state only |
| FE-OQ-31 | Verify the master-data and auth-service E-01 and E-02 paths end to end. master-data `api-reference.md` v1.3 still lists B-02 as Open | Tenant create outcomes (RK-FE-06) | Integration test planning | architect_frontend, master-data and auth-service architects | No | Open | Documented default: FE handles all outcomes (D8.2); verify before integration test |
| FE-OQ-32 | Routing of backend gaps BG-01 to BG-12 to platform TODOs | Table 3 | Backend backlog | solution_architect | No | Open | Documented default: routed as shown in Table 3; not designed here |
| FE-OQ-33 | Expose `X-Correlation-ID` to cross-origin SP pages (BG-10) | Reference ids (D3.2) | Only if the fallback topology is chosen (FE-OQ-01) | apigateway architect_backend | No | Open | Documented default: not needed in the recommended topology; the request id is shown as fallback (D3.2) |
| FE-OQ-34 | Automated accessibility checks and E2E tests: when and where? | Conditional standard items (D16, D19) | Test automation | architect_frontend, qa | No | Open | Documented default: Playwright planned after Tenants integration works (not initial phase); accessibility checked manually in QA until automated checks are decided |
| FE-OQ-35 | Show per-category and per-country tenant counts (derived with one call per row, or removed)? | Mock `tenantCount` (Table 2) | N+1 requests | user, product | No | Open | Documented default: removed in v1 |
| FE-OQ-36 | Domain names for the staging and production SP hosts and the gateway host | Same-origin host (D1.2, REQ-FE-047) | Operator edge file and certificates | ops | No | Open | Documented default: `system.<env-domain>` per environment. Infrastructure decision, not a design blocker |
| FE-OQ-37 | Routing library for path routes (or custom History API routing) | Route table (D10); the mock uses hash routes | Routing code | architect_frontend, user | No | Answered | History API path routes, with no routing library (Checkpoint B gate, 2026-10-10; ADR-001 v1.0.1 OQ2) |
| FE-OQ-38 | Does PATCH `/api/v1/master-permissions/{id}` for name and description accept a partial body, or must it carry the full current body including `active` and `customerPermitted`? FE doc 5.3 is not explicit about partial bodies | Master permission edit (D5.3, D7) | Request body shape | auth-service architect_backend | No | Open | Documented default: send the full current body with `key`, `category`, `module`, `active`, `customerPermitted` unchanged (existing D5.3 rule "Edit sends all current values") |
| FE-OQ-39 | When SP-BG-14 is Closed, what is the final contract for `/api/v1/system-users/{id}/sessions` and who flips `OTHER_ACCOUNT_SESSIONS_ENABLED`? | D4.10, BG-13 | A later amendment, not TODO-022 | auth-service architect_backend, architect_frontend | No | Answered | User 2026-10-15: SP-BG-14 is Closed. Final contract as in D4.10 (GET `sessions:view`; DELETE `sessions:revoke` with 409 `SELF_ACTION_NOT_ALLOWED`, 403 `PLATFORM_ROLE_PROTECTED`, 404 `SYSTEM_USER_NOT_FOUND`, `SESSIONS_REVOKED`). The flag is flipped by this amendment (v1.0.13), implemented in TODO-026 |
| FE-OQ-40 | Do the guard-failure messages also apply to tenant role paths, and which pages are "account pages" and "role pages"? | D13.1 | Scope of `guard-failure.ts` | auth-service architect_backend, user | No | Answered | User 2026-10-14: the six messages apply only to system account pages (Tim IT > Akun) and system role pages (Tim IT > Peran). Tenant role paths are not covered: `SYSTEM_ROLE_IN_USE` is never returned there (SP-BG-13 open question (b) stays open; if answered yes the code would be `TENANT_ROLE_IN_USE`), and `PLATFORM_ROLE_PROTECTED` on a tenant path means a protected tenant role, not the principal administrator. Pages that touch tenant roles keep current handling |
| FE-OQ-41 | Does `system_users:delete` stay in the system role permission matrices (checklist on the role detail page) and in auth-service seed data, now that the UI never uses it? And does auth-service plan to change `DELETE /system-users/{id}` (real soft delete, or removal)? | D6.4, REQ-FE-054; role permission checklist; platform SP-BG-13 follow-up | Role permission screens show an unused permission; a later real delete would need a new amendment | auth-service architect_backend, user | No | Answered | Answered by the user 2026-10-14: default adopted. Documented default: the permission stays in the catalogue and the role checklist unchanged (the UI lists whatever the catalogue returns; no FE filtering); `deleteSystemUser` stays in the API module; re-add the UI action only through a later amendment if the server gains a real delete |
| FE-OQ-42 | Does the platform document `PLATFORM_ROLE_PROTECTED` for suspend or deactivate of a SYS_PRINCIPAL holder by a non-principal actor? ARCH-BE-004 lists it for role assignment and reset password only | D13.1a test re-pointing | Which action a test may use to produce the account-page `PLATFORM_ROLE_PROTECTED` copy | auth-service architect_backend | No | Answered | Answered by the user 2026-10-14: default adopted. Documented default: tests use role change or reset password for this code; suspend and deactivate tests do not assert it |
| FE-OQ-43 | Copy for `403 ACCOUNT_NOT_ACTIVE` and `403 ACCOUNT_NOT_READY` on the login page, and as the login-page notice after a session end | D4.5, D13 (ACCOUNT), REQ-FE-055 | Login and notice text | user, product | No | Answered | Answered by the user 2026-10-15: "Akun Anda tidak aktif. Hubungi administrator." (ACCOUNT_NOT_ACTIVE) and "Akun Anda belum siap digunakan. Hubungi administrator." (ACCOUNT_NOT_READY). Both show the reference id; the server message is never shown |
| FE-OQ-44 | Does `403 ACCOUNT_NOT_READY` on refresh or `me` also end the session, or only `ACCOUNT_NOT_ACTIVE`? | D4.3, REQ-FE-055 | Session end rule | user, auth-service architect_backend | No | Answered | Answered by the user 2026-10-15: yes. `ACCOUNT_NOT_READY` on refresh or `me` ends the session with its own notice, the same as `ACCOUNT_NOT_ACTIVE`. Other 403 codes keep the session |
| FE-OQ-45 | How long does a suspended account keep working in the open app? | D4.3, D6.5 | Mid-session behaviour after a suspend | security_architect, auth-service architect_backend | No | Answered | Recorded by the user 2026-10-15: the gateway checks the session per request (30-second cache). A data request after the suspend gets 401, the refresh gets 403 `ACCOUNT_NOT_ACTIVE` and the session ends. Covered by a TODO-024 test (request 401, refresh 403, session end, cache cleared, login page with notice) |
| FE-OQ-46 | Does auth-service accept an access token after logout or session end? | D4.2, D4.3 | Whether the FE can rely on server rejection of a stale token | security_architect | No | Open | Documented default: the FE clears the token on every session end and does not rely on server rejection |

Blocking summary: Blocking open questions = 0. Answered: FE-OQ-01 to FE-OQ-13, FE-OQ-39, FE-OQ-40, FE-OQ-41, FE-OQ-42, FE-OQ-43, FE-OQ-44, FE-OQ-45. 25 non-blocking open questions, with documented defaults (FE-OQ-14 to FE-OQ-38 except answered rows, and FE-OQ-46; FE-OQ-14 to FE-OQ-31 keep their v0.1 defaults). Platform blocking questions: none added.

## ADR Candidates for /decision

All candidates are proposals. Status for each: Pending Approval. None is approved by this document. The decision owner is the user; decision-manager records the ADRs at `/decision`.

| ADR candidate | Decision | Scope and stack rows | Alternatives presented | Why decision-worthy |
|---------------|----------|----------------------|------------------------|---------------------|
| ADR-FE-01 | Base frontend stack: Vite 8 SPA, React 19, npm, Tailwind 4, Base UI under shadcn/ui, TypeScript 6 with the required compiler options, Zod 4 | SD-01 to SD-06 | Next.js 15 App Router, Bun, Tailwind 3.4, Radix UI, TypeScript 5.7, Zod 3 (standard defaults) | Deviates from the standard's default stack; sets the application shell |
| ADR-FE-02 | HTTP client: `fetch`-based client in `lib/api/client.ts`; Axios not used | SD-08 | Axios with interceptors (standard) | Accepted deviation with justification; the pipeline's correctness depends on it |
| ADR-FE-03 | Server state and forms: TanStack Query 5 (mandatory) with the invalidation map; React Hook Form with the Zod resolver for every form | SD-07, SD-09 | Custom cache and native forms | Mandatory standard adopted; sets the data-layer contract for every screen |
| ADR-FE-04 | First-party login as the standard exception to NextAuth | SD-10 | NextAuth (Auth.js) 5 beta with an OIDC or OAuth provider | Standard exception on authentication; trust-related |
| ADR-FE-05 | Test stack: Vitest, React Testing Library 16.x, MSW 2.x (by default); Playwright after Tenants integration | SD-11 | Jest 29; Playwright now | Mandatory standard adopted; MSW adopted by default |
| ADR-FE-06 | Deployment topology: same-origin path routing (recommended); same-site sibling hosts with CORS credentials (second option); cross-site not supported | FE-OQ-01, REQ-FE-047 | Direct cross-origin calls (rejected); cross-site (rejected) | Topology decision that changes operator configuration and the CSP |
| ADR-FE-07 | Runtime dependency set: justifications and removals in Table 5 | SD-12 | Keep every installed package | Dependency standard; removes unused packages |

## Change Log (v0.2, 2026-10-10)

- Base stack accepted (Vite 8 SPA, npm, Tailwind 4, Base UI under shadcn, Zod 4, TypeScript 6): D0, Table 4, ADR-FE-01.
- TanStack Query 5 adopted as mandatory server-state layer with a mutation invalidation map (D12, D12.1).
- React Hook Form with the Zod resolver adopted for all forms (D9).
- Vitest, React Testing Library and MSW 2.x adopted; `api/client.ts` unit tests mandatory; Playwright deferred until after Tenants integration (D19).
- fetch-based client accepted with justification; Axios not used (Table 4 SD-08, ADR-FE-02).
- First-party login accepted as the NextAuth exception (Table 4 SD-10, ADR-FE-04).
- Same-origin topology recommended; same-site fallback; cross-site not supported; FE doc 1.1 last sentence corrected (D1.2, REQ-FE-047, ADR-FE-06).
- Dependency justifications and removals (Table 5, ADR-FE-07); TypeScript compiler options and package conformance recorded (D1.3, REQ-FE-051).
- Scope cross-trace: platform frontend Domain Scope Cancelled by design (split decision), referenced to SP-DEC-01 (C-07).
- FE-OQ-01 to FE-OQ-13 answered; Blocking count 0; FE-OQ-36 and FE-OQ-37 added; FE-OQ-34 updated for Playwright timing.
- REQ-FE-047 to REQ-FE-051 added; RK-FE-16 and RK-FE-17 added; A-20 to A-26 added.
