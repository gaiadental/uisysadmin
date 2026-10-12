---
id: MASTER-TODO
title: Master TODO — System Principal Web (Frontend)
owner: project_manager
status: Approved
version: 1.9
last_updated: 2026-10-12
source_requirements: [REQ-FE-001, REQ-FE-002, REQ-FE-003, REQ-FE-004, REQ-FE-005, REQ-FE-006, REQ-FE-007, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011, REQ-FE-012, REQ-FE-013, REQ-FE-014, REQ-FE-015, REQ-FE-016, REQ-FE-017, REQ-FE-018, REQ-FE-019, REQ-FE-020, REQ-FE-021, REQ-FE-022, REQ-FE-023, REQ-FE-024, REQ-FE-025, REQ-FE-026, REQ-FE-028, REQ-FE-029, REQ-FE-030, REQ-FE-031, REQ-FE-032, REQ-FE-033, REQ-FE-034, REQ-FE-035, REQ-FE-036, REQ-FE-037, REQ-FE-038, REQ-FE-039, REQ-FE-040, REQ-FE-041, REQ-FE-042, REQ-FE-043, REQ-FE-045, REQ-FE-046, REQ-FE-047, REQ-FE-048, REQ-FE-049, REQ-FE-050, REQ-FE-051]
related_artifacts: [ARCH-FE-001, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, IMPLEMENTATION-PLAN, PROGRESS-TRACKER]
blocking_open_questions: 0
---

Title: Master TODO — System Principal Web (Frontend)

Owner: project_manager

Status: Approved

Version: 1.9

Last Updated: 2026-10-12

Approved: 2026-10-10 (user, Checkpoint B gate)

Change: 2026-10-10 — amendment: @testing-library/dom (ADR-007 v1.2)

Change: 2026-10-12 — TODO-021 added (user decision 2026-10-12: Katalog > Permission read-only; ARCH-FE-001 v1.0.4 Pending Approval). TODO-021 is Not Started and may not start `/build` until v1.0.4 is Approved. TODO-013 stays Completed. Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.3, user approved): TODO-010 File scope adds `src/lib/routes-meta.ts` and `src/features/tenants/list/` and records the TODO-009 regression gate and the five-combination classifier tests; TODO-015 Gate rewritten as two tests; TODO-017 note on `tenant.list`. Statuses unchanged. Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.4, user decision 2026-10-12, option 1): TODO-008 File scope adds `src/assets/login/` (untracked brand assets `background.webp` and `logo.png`, loaded by `login-shell.tsx` via `import.meta.glob`). TODO-008 status unchanged (Completed). Status unchanged (Approved).

Change: 2026-10-12 — TODO-019 Completed (Unit Test Report `execution_overall: PASS`, 886/886, 70 files). Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.5, user decision 2026-10-12, option 1): TODO-019 added after QA (QA D-1, High, `output/reports/qa-report-validate.md`). The frontend accepts `null` for `updated_by` in the countries and tenant-categories wire contracts; `created_by` and all other fields are unchanged. TODO-019 is `Not Started`; no other TODO status changed (TODO-012 remains `Completed`). Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.7, user decision 2026-10-12, frontend fix): TODO-020 added. The frontend accepts the live tenant detail shape: `GET /api/v1/tenants/{id}` returns nested `tenant_category` and `country` and no top-level `tenant_category_id` or `country_code`, so the detail parse failed with CONTRACT (new QA finding on `tenants.get`, 2026-10-12). The create and list shapes are unchanged. TODO-020 is `Not Started`; no other TODO status changed (TODO-010 remains `Completed`). Status unchanged (Approved). (The front matter read `version: 1.6` with no v1.6 change line; this amendment sets 1.7.)

Change: 2026-10-12 — TODO-020 Completed (Unit Test Report `execution_overall: PASS`, 890/890, 70 files; user confirmed on 2026-10-12 that the live `GET /api/v1/tenants/{id}` body contains `social_links`). QA re-check of `tenants.get` on the live stack is pending and is not part of the unit gate. Version unchanged (1.7); Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.9, user approved 2026-10-12): TODO-021 `createMasterPermission` and `deleteMasterPermission` removed from `src/lib/api/modules/master-permissions.ts` with their module tests and route names (previously left in place); `toRequestBody` always sends `description` (empty string when absent); update PATCH unchanged. Test count 909 passed in 75 files (was 917). No File scope path changes; TODO-021 stays Completed. Status unchanged (Approved).

Source Requirements:
- REQ-FE-001 to REQ-FE-051 (ARCH-FE-001 v1.0). REQ-FE-027 (deferred), REQ-FE-041 (excluded), REQ-FE-044 (external) are not in any TODO; see `implementation-plan.md` -> Requirement Coverage.

Related Artifacts:
- `output/plans/implementation-plan.md` (phases, dependency sequence, open questions OQ-P-01 to OQ-P-11)
- `output/plans/progress-tracker.md`
- `output/architecture/ARCH-FE-001.md` v1.0
- `output/decisions/ADR-001-base-frontend-stack.md` to `ADR-007-runtime-dependency-set.md` (Pending Approval)

## At a Glance

- 20 TODOs (TODO-019 and TODO-020 added after QA, 2026-10-12). Owner is `developer_frontend` for every TODO (this repository is frontend only). Status of each TODO is tracked in `progress-tracker.md`.
- Priority: Critical 10 (TODO-001 to TODO-008, TODO-019 and TODO-020), High 8 (TODO-009 to TODO-015 and TODO-017), Medium 1 (TODO-016), Low 1 (TODO-018, deferred).
- OQ-P-01 (jsdom with `@testing-library/jest-dom`, ADR-007 v1.1) and OQ-P-02 (History API path routes, no routing library) are answered (2026-10-10). No TODO is gated by an open question.
- Every TODO has one owner, a concrete File scope and traces to REQ-FE, ADR-00N and ARCH-FE-001.

## Purpose

Executable work items for the SP web frontend. Each item is traceable to requirements, the architecture section it implements and the ADR that decided its technology.

## Scope

Frontend only, in this repository. Platform TODOs (SP-BG-01 to SP-BG-11) are external and are not tracked here. A TODO whose screen depends on a platform gap names the gap and the fallback in Dependencies and Notes.

## References

- `output/plans/implementation-plan.md` (Dependencies, Phases, Requirement Coverage)
- `output/architecture/ARCH-FE-001.md` v1.0 (D1 to D20, Tables 1 to 5)
- `.claude/rules/artifact-standards.md` -> Master TODO (entry format, status and priority values)
- `../Microservices/gaia-platform-architecture/output/clarifications.md` (SP-BG-01 to SP-BG-11)

## Gate for every TODO

- Unit and component tests PASS for the TODO's scope (`execution_overall: PASS` in the Unit Test Report).
- No new lint errors in the TODO's files.
- Errors in legacy mock files are listed by path in the Unit Test Report and are not fixed in this TODO (PM-RK-01).
- The project-wide build, typecheck and lint gate applies from TODO-017.
- Shared-file touches follow the order in `implementation-plan.md` -> Shared-file rule.

---

# TODO-001

Description:

Apply ADR-007 v1.1 and ARCH-FE-001 Table 5 to `package.json`. Remove `recharts`, `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@tanstack/react-table` and `@fontsource-variable/geist`. Move `shadcn` to devDependencies. Add `@tanstack/react-query` 5.x, `react-hook-form` 7.x and `@hookform/resolvers` (a version that supports Zod 4). Add `vitest`, `@testing-library/react` 16.x and `msw` 2.x. Add `jsdom` and `@testing-library/jest-dom` as devDependencies, per the OQ-P-01 answer (jsdom as the Vitest DOM environment, jest-dom for matchers) and the ADR-007 v1.1 Dev Dependency Amendment. Add `@testing-library/dom` as a devDependency, the required peer of React Testing Library 16 (user answer to PM-RK-15, 2026-10-10; ADR-007 v1.2). None of these packages is in ARCH-FE-001 Table 5 v1.0. Add the `test` script. Pin exact versions. Keep every other dependency unchanged.

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

No TODO. External: OQ-P-01 and OQ-P-02 answered (done, 2026-10-10); ADR-007 v1.1 in effect for `jsdom` and `@testing-library/jest-dom`; ADR-007 v1.2 for `@testing-library/dom` (decision-manager amendment); Checkpoint B gate recorded by the orchestrator.

Related Requirement:

REQ-FE-049, REQ-FE-050, REQ-FE-051

Related ADR:

ADR-007 v1.2 (primary; Dev Dependency Amendments v1.1 and v1.2), ADR-001, ADR-003, ADR-005

Related Architecture:

ARCH-FE-001 v1.0 D1.3, D15, D19, Table 4 SD-12, Table 5 (Table 5 v1.0 is Approved and is not edited; the dev packages are recorded in ADR-007 v1.1 and v1.2)

File scope:

- `package.json` (adds devDependencies `jsdom` and `@testing-library/jest-dom` (ADR-007 v1.1) and `@testing-library/dom` (ADR-007 v1.2))
- `package-lock.json`

Notes:

Single owner of `package.json` until TODO-018. `jsdom` and `@testing-library/jest-dom` are devDependencies with exact pinned versions (ADR-007 v1.1). Neither is in ARCH-FE-001 Table 5 v1.0. `@testing-library/dom` is added as a devDependency with an exact pinned version: it is the required peer of React Testing Library 16 (ADR-007 v1.2; user answer to PM-RK-15, 2026-10-10, resolved). Use npm (ADR-001 SD-02). Do not add Playwright (ARCH-FE-001 A-25; TODO-018). Keep `inter` and `plus-jakarta-sans` until FE-OQ-28 is decided. Keep `next-themes` (DM-12). No table library is added; re-adding `@tanstack/react-table` needs an ADR-007 amendment. Check the resolver's peer range for Zod 4 before pinning. Gate: `npm ls` reports no missing peers; no import of a removed package remains (grep); lint and existing tests run.

---

# TODO-002

Description:

Apply the TypeScript compiler options that REQ-FE-051 requires in `tsconfig.app.json`: enable `exactOptionalPropertyTypes` and `noImplicitReturns`, and add `forceConsistentCasingInFileNames` and `resolveJsonModule`. In `index.html`, set `lang="id"` on `<html>` and replace the placeholder title `vite-app`. Change no other compiler option.

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

None. Checkpoint B approval of ADR-001.

Related Requirement:

REQ-FE-051 (language: C-09)

Related ADR:

ADR-001

Related Architecture:

ARCH-FE-001 v1.0 D1.3, C-09, Table 4 SD-05

File scope:

- `tsconfig.app.json`
- `index.html`
- `src/components/ui/sonner.tsx` (amendment 2026-10-10: one-line cast fix for TS2375 under exactOptionalPropertyTypes; user decision)

Notes:

The options apply to the whole `src/` tree. Legacy mock files produce type errors until TODO-017 (PM-RK-02, OQ-P-05). Record the error list by path in the Unit Test Report. Do not fix legacy files here. Title text: OQ-P-04 (documented default "System Principal"). Amendment 2026-10-10: this TODO also changes `src/components/ui/sonner.tsx` (one-line cast fix for TS2375, user decision). Other TypeScript source files are not changed, so their errors are not attributed to this TODO. Gate: the Unit Test Report lists the `tsc` errors by path.

---

# TODO-003

Description:

In `vite.config.ts`, add `server.port: 3000` and `strictPort: true`, and a `/api` proxy to `http://127.0.0.1:8080` that rewrites the Host header to `system.gaia.localhost`. Proxy no other path. Add a build-time guard that fails `vite build` when `VITE_API_BASE_URL` is set and does not start with `https://`. Create `.env.development` and `.env.production`, each with an empty `VITE_API_BASE_URL`. Keep the React and Tailwind plugins and the `@` alias.

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

None in this plan. External (operator, outside this repository): the gateway development host table lists `system.gaia.localhost` with origin `http://localhost:3000` (ARCH-FE-001 D1.1, RK-FE-15). Verified before the TODO-017 smoke test; not assumed here.

Related Requirement:

REQ-FE-001, REQ-FE-002, REQ-FE-003, REQ-FE-047 (build guard)

Related ADR:

ADR-006, ADR-001

Related Architecture:

ARCH-FE-001 v1.0 D1.1, D1.2

File scope:

- `vite.config.ts`
- `.env.development`
- `.env.production`

Notes:

`VITE_*` values are public. No secret goes into them (D1.2). Staging uses the production build with the same empty value under the recommended topology (ADR-006). The fallback topology would need a value and is not planned. Hostnames are outside this repository (FE-OQ-36). This is a configuration TODO with no unit tests. Gate: `npm run dev` serves on port 3000 and does not move to another port; `vite build` fails with a non-https `VITE_API_BASE_URL` (checked with the variable set; result in the Unit Test Report). `vitest.config.ts` (TODO-004) merges this configuration.

---

# TODO-004

Description:

Implement the single HTTP pipeline and the refresh module. `src/lib/api/errors.ts` defines `ApiError` with `code`, `message`, `status`, `kind` (HTTP, NETWORK, TIMEOUT, NON_JSON, CONTRACT) and `correlationId` (D3.2). `src/lib/api/client.ts` applies D3.1: URL must start with `/api/v1/`; header allow-list; in development, refuse to send `X-User-ID`, `X-Role`, `X-Tenant-ID` and `X-Service-Token`; `credentials: 'include'`; 30-second timeout through AbortController; 204 returns no body; JSON parsed only when valid; 401 policy (refresh only for `UNAUTHORIZED`, `INVALID_TOKEN` and `SESSION_ENDED` on non-exempt endpoints); 403 `PASSWORD_CHANGE_REQUIRED` is returned to the caller and routed; no automatic retry; a new correlation id per attempt. `src/lib/api/refresh.ts` keeps the access token in a module-level variable (D4.1), runs one single-flight refresh promise, serialises refresh with `navigator.locks.request('sp-session-refresh')`, falls back to in-tab single-flight when Web Locks is unavailable (A-03, RK-FE-01), retries the original request once, and exposes a logout callback that TODO-005 registers. Create `vitest.config.ts`.

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

TODO-001, TODO-002, TODO-003. External: FE-OQ-18 (refresh trigger codes; the default is used in tests and verified before TODO-005 integration tests). Checkpoint B approval of ADR-002 and ADR-004.

Related Requirement:

REQ-FE-001, REQ-FE-004, REQ-FE-005, REQ-FE-006, REQ-FE-008, REQ-FE-010, REQ-FE-038, REQ-FE-046, REQ-FE-050

Related ADR:

ADR-002, ADR-004, ADR-005

Related Architecture:

ARCH-FE-001 v1.0 D3.1, D3.2, D4.1, D4.3, D4.4, D13, D18, D19

File scope:

- `src/lib/api/client.ts`
- `src/lib/api/client.test.ts`
- `src/lib/api/errors.ts`
- `src/lib/api/errors.test.ts`
- `src/lib/api/refresh.ts`
- `src/lib/api/refresh.test.ts`
- `vitest.config.ts`

Notes:

Tests run in the Vitest `node` environment with a stubbed `fetch` and a stubbed `navigator.locks`. No DOM is needed. Development logs carry only the reference id, status, code, route name and kind (REQ-FE-046). SP-BG-10: the request id is the fallback for `correlationId` (matters only under the fallback topology). This module does not import query code; TODO-005 registers the cache-clear callback. Gate (REQ-FE-050 cases): concurrent 401s produce one refresh call; 401, refresh, one retry, then logout on a second 401; exempt endpoints never refresh; `INVALID_CREDENTIALS` never refreshes; 204 returns no body; NETWORK, TIMEOUT and NON_JSON mapping; forbidden headers never sent; lock fallback when `navigator.locks` is missing.

---

# TODO-005

Description:

Build the auth and session data layer and the query foundation. `src/lib/api/modules/auth.ts` implements the auth-service endpoints (login, me, logout best effort, change-password with both `keepCurrentSession` outcomes, forgot-password, reset-password), unwraps `data` (D5.1) and validates each response with a Zod 4 schema (CONTRACT on mismatch, D5.5). `src/lib/api/modules/sessions.ts` implements own sessions (list, revoke one, revoke all others) and admin sessions for one user (list, force logout). `src/lib/query/client.ts` sets the QueryClient defaults (retry off, no window-focus refetch, no persister; D12.2). `src/lib/query/keys.ts` defines every key family of D12.1. `src/lib/query/invalidation.ts` implements the full D12.1 mutation-to-key table. `src/app/providers/auth-provider.tsx` holds the auth view state (unknown, error, anonymous, authenticated, passwordChangeRequired) in React context, runs boot (D4.2), performs login with no tenant field (D4.5) and logout (D4.8) with the `sp-session` BroadcastChannel signal, and caches `me` under `['auth','me']`. Remove `src/app/dashboard/data.json` (D1.3). Create the MSW server and the auth handlers from the FE doc examples, not from `src/data`.

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

TODO-004 (client and refresh), TODO-001 (TanStack Query, MSW). External: FE-OQ-30 (React context default); FE-OQ-18 verified against a live expired token before integration tests against the platform; ADR-004 approval (and DM-02 if the user requires security_architect sign-off).

Related Requirement:

REQ-FE-005, REQ-FE-007, REQ-FE-009, REQ-FE-011, REQ-FE-012, REQ-FE-013, REQ-FE-016, REQ-FE-017, REQ-FE-032, REQ-FE-043, REQ-FE-048, REQ-FE-050

Related ADR:

ADR-004, ADR-003, ADR-002, ADR-005

Related Architecture:

ARCH-FE-001 v1.0 D4.1 to D4.10 (API and state), D5.1, D5.5, D12, D12.1, D12.2, D19

File scope:

- `src/lib/api/modules/auth.ts`
- `src/lib/api/modules/auth.test.ts`
- `src/lib/api/modules/sessions.ts`
- `src/lib/api/modules/sessions.test.ts`
- `src/types/auth.ts`
- `src/types/session.ts`
- `src/lib/query/client.ts`
- `src/lib/query/keys.ts`
- `src/lib/query/invalidation.ts`
- `src/lib/query/invalidation.test.ts`
- `src/app/providers/auth-provider.tsx`
- `src/app/providers/auth-provider.test.tsx` (uses jsdom, per OQ-P-01, through a per-file environment comment)
- `src/app/dashboard/data.json` (delete; no importer, D1.3)
- `src/test/server.ts`
- `src/test/setup.ts`
- `src/test/handlers/index.ts`
- `src/test/handlers/auth.ts`
- `vitest.config.ts` (add the setup file)

Notes:

Logout is best effort; a 401 on logout counts as logged out (D4.4, D4.8). A 401 on change-password never refreshes (exempt). Reset-token handling is in TODO-008. Guards in TODO-006 read the status this TODO exposes. Admin session functions live here (D2) and are first used by TODO-014. Gate: unit and MSW integration tests PASS for the auth and sessions modules; the invalidation map test PASS; boot and logout state paths PASS. Fix round 2026-10-12: MeSchema branches accepts null or absent (SP-CF-01, user decision). File scope unchanged.

---

# TODO-006

Description:

Build the routing foundation and access gates. `src/app/router.tsx` defines the History API path route table with lazy route components, one Suspense boundary and one error boundary per route (D10). It starts with the public routes registered in TODO-008; each module TODO adds its own routes. `src/hooks/use-search-state.ts` keeps filters and page in search params (D10). `src/lib/access/roles.ts` holds the single `SYS_PRINCIPAL` constant with a comment that cites ARCH-SEC-001 section 9.2 c and SP-DEC-01 (D6.2). `src/lib/access/gates.ts` implements the four strategies (Authenticated, PasswordChanged, HasPermissions, HasRole), combined with AND (D6.1). `src/app/guards/route-guard.tsx` maps LOGIN to `/login`, PASSWORD_CHANGE to `/account/password` and FORBIDDEN to the 403 screen; while `passwordChangeRequired` is true, only `/account/password` and logout are reachable (REQ-FE-012); unknown paths show 404. `src/app/guards/route-error-boundary.tsx` is the per-route error boundary. `src/components/custom/status-screens.tsx` provides the 403, 404 and service-unavailable screens (with retry) for D13 and the D4.2 boot error. `src/lib/routes-meta.ts` is rewritten for the new route keys (file kept).

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

TODO-005 (auth view state). No routing library: OQ-P-02 is answered as History API path routes (ADR-001 OQ2 closed).

Related Requirement:

REQ-FE-012, REQ-FE-018, REQ-FE-019, REQ-FE-045

Related ADR:

ADR-001 (History API routes; no amendment), ADR-004

Related Architecture:

ARCH-FE-001 v1.0 D6.1, D6.2, D6.5, D10, D13, D16, D4.2

File scope:

- `src/app/router.tsx`
- `src/app/guards/route-guard.tsx`
- `src/app/guards/route-guard.test.tsx`
- `src/app/guards/route-error-boundary.tsx`
- `src/lib/access/roles.ts`
- `src/lib/access/gates.ts`
- `src/lib/access/gates.test.ts`
- `src/hooks/use-search-state.ts`
- `src/components/custom/status-screens.tsx`
- `src/lib/routes-meta.ts`
- `src/app/providers/auth-provider.test.tsx` (amendment 2026-10-11: test-only addition for GATE-11 (logout reachable while passwordChangeRequired); user decision)

Notes:

From this TODO, new code no longer uses the legacy hash router in `src/router/index.tsx`; that file is removed in TODO-017 (PM-RK-01). The `SYS_PRINCIPAL` constant changes only with SEC-OQ-02 (RK-FE-03). The gate truth table (D6) is a pure test. The route guard render test uses the DOM environment (OQ-P-01). Gate: gate truth table and redirect table PASS; route guard tests PASS.

---

# TODO-007

Description:

Compose the app shell. `src/main.tsx` composes StrictMode, the existing ThemeProvider, QueryClientProvider, AuthProvider, TooltipProvider, Toaster and DialogsProvider. `src/App.tsx` renders the router. `src/app/layouts/public-layout.tsx` and `src/app/layouts/authenticated-layout.tsx` (sidebar and header). `src/app/navigation.ts` is the single navigation config (label, route, gate), read by the sidebar, the command palette and the route guard (D6.3). `src/components/app-sidebar.tsx` shows items by gate from `me.permissions` and `me.role`; it has no mock badges (badges come in TODO-016). `src/components/command-palette.tsx` reads the navigation config and drops its mock imports. `src/components/nav-user.tsx` shows `me.loginId` and the role label and offers logout (REQ-FE-016). `src/components/site-header.tsx` shows breadcrumbs from routes-meta. `src/components/dialogs/dialogs.tsx` provides confirm variants (destructive, with explanation text, no typed input), removes the typed tenant-delete dialog and its mock types, and returns focus to the opener (D11, D16). `src/lib/notify.ts` shows errors with the reference id "Kode referensi: <id>" (D13). `src/app/landing-page.tsx` shows the neutral message when no module is visible (D6.3).

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

TODO-006. TODO-001 (DOM environment for component tests). External: FE-OQ-22 (copy; documented defaults used), FE-OQ-29 (desktop first).

Related Requirement:

REQ-FE-008, REQ-FE-016, REQ-FE-018, REQ-FE-019, REQ-FE-039, REQ-FE-045

Related ADR:

ADR-001, ADR-003, ADR-004

Related Architecture:

ARCH-FE-001 v1.0 D6.3, D6.5, D11, D13, D16; Table 2 (app-sidebar, command-palette, nav-user, site-header, dialogs)

File scope:

- `src/main.tsx`
- `src/App.tsx`
- `src/app/layouts/public-layout.tsx`
- `src/app/layouts/authenticated-layout.tsx`
- `src/app/navigation.ts`
- `src/app/navigation.test.ts`
- `src/app/landing-page.tsx`
- `src/lib/notify.ts`
- `src/components/app-sidebar.tsx`
- `src/components/command-palette.tsx`
- `src/components/nav-user.tsx`
- `src/components/site-header.tsx`
- `src/components/dialogs/dialogs.tsx`
- `src/components/dialogs/dialogs.test.tsx`
- `src/app/guards/route-guard.tsx` (amendment 2026-10-11: route guard and router read access from navigation.ts (D6.3); user decision)
- `src/app/guards/route-guard.test.tsx` (amendment 2026-10-11: route guard and router read access from navigation.ts (D6.3); user decision)
- `src/app/router.tsx` (amendment 2026-10-11: route guard and router read access from navigation.ts (D6.3); user decision)

Notes:

`src/components/theme-provider.tsx` is kept as is; its `theme` key in localStorage is allowed (D4.11). `src/components/ui/sonner.tsx` is not changed (DM-12 deferred). Components stay in place (OQ-P-07). Legacy pages call `dialogs.tsx`; the call sites are removed in TODO-017 (PM-RK-01). Gate: gating tests PASS (SYS_PRINCIPAL sees master-data items; a user with SYS_ADMIN and no permissions sees only own-account items and the landing page, D6.2); logout clears state and routes to `/login`.

---

# TODO-008

Description:

Build the auth screens and the shared form pieces. Screens: login (`/login`; error mapping per D4.5; 60-second submit lock with countdown on 429; no tenant field); forgot password (`/forgot-password`; the same neutral message for every non-validation outcome); reset password (`/reset-password`; reads `token` once, then replaces the URL with `history.replaceState`; invalid or expired token handling); change password (`/account/password`; forced and voluntary; both `keepCurrentSession` outcomes; error placement per D4.6); my sessions (`/account/sessions`; client-paged list; current-session badge; revoke one, never the current session; revoke all others). Shared pieces: `src/lib/forms/zod-form.ts` (zodResolver wiring), `src/components/custom/form-alert.tsx` (form-level alert with `role="alert"` and reference id), `src/hooks/use-client-paged-list.ts` (one shared client pagination hook, D5.4). Schemas in `src/features/auth/schema.ts`. Add the auth routes to `src/app/router.tsx`. Set the DOM test environment in `vitest.config.ts` per OQ-P-01.

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

TODO-007, TODO-005, TODO-006. External: FE-OQ-19 (reset link URL; documented default used); SP-BG-11 (in-flight disable on reset-password); OQ-P-01 (component test environment).

Related Requirement:

REQ-FE-008, REQ-FE-009, REQ-FE-012, REQ-FE-013, REQ-FE-014, REQ-FE-015, REQ-FE-017, REQ-FE-036, REQ-FE-045, REQ-FE-049

Related ADR:

ADR-004, ADR-003, ADR-005

Related Architecture:

ARCH-FE-001 v1.0 D4.5, D4.6, D4.7, D4.9, D5.4, D9, D16, D19

File scope:

- `src/features/auth/` (pages, components, schema and tests)
- `src/lib/forms/zod-form.ts`
- `src/components/custom/form-alert.tsx`
- `src/hooks/use-client-paged-list.ts`
- `src/hooks/use-client-paged-list.test.ts`
- `src/app/router.tsx` (add the auth routes)
- `src/test/handlers/auth.ts` (extend)
- `vitest.config.ts` (DOM environment)
- `src/lib/routes-meta.ts` (amendment 2026-10-11: one new routes-meta key account.sessions for the /account/sessions route (user decision). Legacy keys stay until TODO-017)
- `src/assets/login/` (amendment 2026-10-12: untracked brand assets background.webp and logo.png loaded by login-shell.tsx via import.meta.glob; user decision 2026-10-12, option 1)

Notes:

Component tests: login error texts; a forced password change redirects to `/account/password`; forgot-password neutral text; reset with an invalid token; the sessions list never offers revoke for the current session. A 401 on change-password never refreshes (D4.4). Gate: component and MSW tests PASS; React Hook Form errors reach `aria-describedby` (D19). Amendment 2026-10-12 (user decision, option 1): File scope adds `src/assets/login/`. Status unchanged (Completed).

---

# TODO-009

Description:

Build the Tenants API module and the tenant list. `src/lib/api/modules/tenants.ts` implements the master-data endpoints with explicit snake_case to camelCase mappers (D5.2), the write whitelists (D5.3: create; patch with only `isActive`, `logoUrl` and `countryCode`; no delete), server pagination with `page` and `limit` and the documented filters (D5.4, D8.1), the admin-account retry (`POST /api/v1/tenants/{id}/admin-account`), and Zod 4 response validation (CONTRACT). `src/lib/api/modules/tenant-categories.ts` and `src/lib/api/modules/countries.ts` implement the read and reference loaders (`limit=100`, and fetch every page when the total is above 100; D5.4). Screen `/tenants`: filters for status, category, country, deployment type and exact code; contract columns only; loading, empty and error states; no name search. `src/components/table-card.tsx` and `src/components/table-pagination.tsx` become the compound of D11. `src/components/tenant-bits.tsx` drops its mock imports. Types in `src/types/tenant.ts`, `src/types/tenant-category.ts` and `src/types/country.ts`.

Owner:

developer_frontend

Status:

Completed

Priority:

High

Dependencies:

TODO-008. External: SP-BG-02 (fallback: branch, user and session columns removed); SP-BG-09 (fallback: exact code only); FE-OQ-31 (E-01 and E-02 paths verified before integration tests).

Related Requirement:

REQ-FE-007, REQ-FE-019, REQ-FE-020, REQ-FE-036, REQ-FE-038, REQ-FE-040, REQ-FE-050

Related ADR:

ADR-002, ADR-003, ADR-005

Related Architecture:

ARCH-FE-001 v1.0 D5.2, D5.3, D5.4, D5.5, D8.1, D11, D13; Table 2 (`tenant-list`, `tenant-bits`, `data/tenants`, `data/tenant-categories`, `data/countries`)

File scope:

- `src/lib/api/modules/tenants.ts`
- `src/lib/api/modules/tenants.test.ts`
- `src/lib/api/modules/tenant-categories.ts`
- `src/lib/api/modules/countries.ts`
- `src/lib/api/modules/reference.test.ts`
- `src/types/tenant.ts`
- `src/types/tenant-category.ts`
- `src/types/country.ts`
- `src/features/tenants/list/`
- `src/features/tenants/shared/`
- `src/components/table-card.tsx`
- `src/components/table-pagination.tsx`
- `src/components/tenant-bits.tsx`
- `src/app/router.tsx` (add `/tenants`)
- `src/test/handlers/tenants.ts`
- `src/test/handlers/index.ts` (add entry)

Notes:

Mappers cover every field of D5.2; unknown keys are ignored; a missing required key gives CONTRACT. The tenant list uses tenant categories and countries only as reference loaders for joins (D5.4). The write side of categories and countries is TODO-012. Gate: mapper and whitelist type tests PASS; list state tests (loading, empty, error) PASS; MSW integration PASS. Amendment 2026-10-12 (user): the API layer treats both VALIDATION_ERROR (master-data) and VALIDATION_FAILED (auth-service) as form validation errors; acceptance adds a test for both codes in this TODO. File scope unchanged.

---

# TODO-010

Description:

Build the tenant create wizard and the tenant detail page (tabs Ringkasan and Profil). Create (`/tenants/new`): four steps (Identitas, Penyimpanan, Admin awal, Tinjau dan buat) with React Hook Form and Zod per step (D9); one pure function `classifyAdminAccount` for the five combinations of `admin_account.status` and `tenant_status_sync` (D8.2), with unit tests; success toast, or a warning with a Retry button that calls the admin-account endpoint; the tenant exists in every case, so the page navigates to the detail page after the outcome is shown; the submit button is disabled in flight; no automatic retry. Detail (`/tenants/:id`): code, name, tenant category, deployment type, multi-branch and tenant admin e-mail are read-only; `is_active` is a switch with no optimistic update (reverts on 503); `logo_url` and `country_code` are editable; PATCH sends only changed keys; deactivate has a confirm dialog; "Kirim ulang akun admin" is always offered with a confirm dialog; no delete control. Messages per D8.2 (409 on code; 400 as a form alert).

Owner:

developer_frontend

Status:

Completed

Priority:

High

Dependencies:

TODO-009. External: SP-BG-01 (admin-account state on detail; the always-offer fallback applies); SP-BG-11 (retry and create are not idempotent by contract); FE-OQ-20 (logo image policy; the https render check is part of this TODO).

Related Requirement:

REQ-FE-021, REQ-FE-022, REQ-FE-023, REQ-FE-024, REQ-FE-025, REQ-FE-038, REQ-FE-039, REQ-FE-040, REQ-FE-048, REQ-FE-049

Related ADR:

ADR-003, ADR-002

Related Architecture:

ARCH-FE-001 v1.0 D8.2, D9, D12.1, D12.3, D14, D15 (logo https); Table 2 (`tenant-create`, `tenant-detail`)

File scope:

- `src/features/tenants/create/`
- `src/features/tenants/detail/`
- `src/features/tenants/schema.ts`
- `src/features/tenants/schema.test.ts`
- `src/app/router.tsx` (add `/tenants/new` and `/tenants/:id`)
- `src/test/handlers/tenants.ts` (extend)
- `src/lib/routes-meta.ts` (amendment 2026-10-12 (user): only the keys tenant.new and tenant.detail, and moving tenant.list out of the legacy keys; no other route is touched)
- `src/features/tenants/list/` (amendment 2026-10-12 (user): the "Tambah tenant" button and the code link to the detail page, deferred from TODO-009)

Notes:

`logoUrl` renders as an image only when the scheme is https (http in development), checked at render time (D9, D15). Component tests: all five combinations of `classifyAdminAccount` (`admin_account.status` and `tenant_status_sync`), including `tenant_status_sync` = FAILED and its Retry; immutable fields are read-only; PATCH sends only allowed keys; `is_active` reverts on 503; no delete control. Gate: classifier and schema unit tests PASS; component tests PASS. Amendment 2026-10-12 (user): when a second DEDICATED tenant is refused (400; the GAIA seed is already DEDICATED), the wizard shows the master-data message "Only one DEDICATED tenant is allowed per deployment." clearly. Acceptance adds a component test for it. Amendment 2026-10-12 (user): File scope adds `src/lib/routes-meta.ts` and `src/features/tenants/list/` (see File scope). Regression: the TODO-009 tenant-list tests must still PASS in the TODO-010 Unit Test Report.

---

# TODO-011

Description:

Build the tenant Permissions tab. `src/lib/api/modules/tenant-permissions.ts` implements the list (GET), the full replacement (PUT with `masterPermissionIds`) and the toggle (PATCH with `enabled`). `src/lib/api/modules/master-permissions.ts` implements the list read with client pagination (D5.4); the write side is TODO-013. The Permissions tab is added to the tenant detail page at `/tenants/:id/permissions`. Gates: SYS_PRINCIPAL, `tenant_permissions:view` and `master_permissions:view`; save needs `tenant_permissions:update`; toggle on needs `:activate`; toggle off needs `:deactivate` (D6.4). The checklist uses a React Hook Form `Controller` (D9). Invalidation per D12.1.

Owner:

developer_frontend

Status:

Completed

Priority:

High

Dependencies:

TODO-010 (detail page), TODO-009. External: FE-OQ-24 (the Permissions tab replaces "Fitur aktif"; documented default used).

Related Requirement:

REQ-FE-018, REQ-FE-026, REQ-FE-036, REQ-FE-040, REQ-FE-048

Related ADR:

ADR-003, ADR-002, ADR-005

Related Architecture:

ARCH-FE-001 v1.0 D6.4, D7 (row `/tenants/:id/permissions`), D9, D12.1; Table 2 ("Fitur aktif" REPLACE)

File scope:

- `src/lib/api/modules/tenant-permissions.ts`
- `src/lib/api/modules/tenant-permissions.test.ts`
- `src/lib/api/modules/master-permissions.ts`
- `src/lib/api/modules/master-permissions.test.ts`
- `src/types/tenant-permission.ts`
- `src/types/master-permission.ts`
- `src/features/tenants/permissions/`
- `src/features/tenants/detail/tenant-detail-page.tsx` (add the Permissions tab; second touch after TODO-010)
- `src/app/router.tsx` (add the permissions route)
- `src/test/handlers/tenant-permissions.ts`
- `src/test/handlers/index.ts` (add entry)

Notes:

The mock feature flags (`data/tenant-features.ts`) are not used (Table 2). Gate: component tests show one PUT on save, one PATCH on toggle, and actions hidden when the permission key is absent; MSW tests PASS.

---

# TODO-012

Description:

Build the Tenant categories and Countries catalog screens with write operations. `src/lib/api/modules/tenant-categories.ts` adds create, update (name, description, isActive; no `code`) and delete. `src/lib/api/modules/countries.ts` adds create (code uppercased, `^[A-Z]{2}$`), update (no `code`) and delete (path key `code`). Screens `/tenant-categories` and `/countries`: list, create, edit and delete. `code` is immutable after create for categories (REQ-FE-028). Delete asks for confirmation. Per-category and per-country tenant counts are removed (FE-OQ-35 default). A 409 in-use message is shown next to the action.

Owner:

developer_frontend

Status:

Completed

Priority:

High

Dependencies:

TODO-011 (serial by design), TODO-009 (read functions and types). External: SP-BG-11 (create is not idempotent; in-flight disable).

Related Requirement:

REQ-FE-028, REQ-FE-029, REQ-FE-039, REQ-FE-040, REQ-FE-048, REQ-FE-049

Related ADR:

ADR-003, ADR-002

Related Architecture:

ARCH-FE-001 v1.0 D5.3, D7 (routes `/tenant-categories`, `/countries`), D9, D12.1; Table 2 (`katalog-kategori`, `katalog-negara`)

File scope:

- `src/lib/api/modules/tenant-categories.ts` (second touch)
- `src/lib/api/modules/countries.ts` (second touch)
- `src/lib/api/modules/catalog.test.ts`
- `src/features/catalog/tenant-categories/`
- `src/features/catalog/countries/`
- `src/app/router.tsx` (add the routes)
- `src/test/handlers/catalog.ts`
- `src/test/handlers/index.ts` (add entry)

Notes:

Mock field names (`key`, `label`, `iso2`, `dialCode`, `active`) are replaced by contract names (Table 2). Gate: the update input has no `code` (type test); schema tests PASS; component tests for immutable code, uppercase input, delete confirmation and the 409 message PASS. Amendment 2026-10-12 (user): deleting a country is permanent for its code (the code is the primary key and delete is soft; a deleted code cannot be reused, 409; a country used by a tenant cannot be deleted, 409). The confirm dialog must say this, and the UI suggests deactivating instead of deleting. Acceptance adds a component test for the dialog text and the suggestion. File scope unchanged.

---

# TODO-013

Description:

Build the Master permissions catalog. `src/lib/api/modules/master-permissions.ts` adds create (`key`, `name`, `description`, `category`, `module`, `active`, `customerPermitted`), edit (sends all current values) and delete. Screen `/master-permissions`: list with client pagination (hook from TODO-008); create, edit and delete are gated by `master_permissions:create`, `:update` and `:delete`; the list is gated by `master_permissions:view`. The `key` is read-only on edit (FE-OQ-17 default). The locked flag and bound-tenant count are removed. Delete asks for confirmation. Invalidation per D12.1: master permissions, all tenant permissions, and role permissions.

Owner:

developer_frontend

Status:

Completed

Priority:

High

Dependencies:

TODO-012 (serial by design), TODO-011 (read side). External: SP-BG-07 (locked flag and bound-tenant count; fallback: removed); SP-BG-11 (create); FE-OQ-17 (`key` read-only; default used).

Related Requirement:

REQ-FE-018, REQ-FE-035, REQ-FE-036, REQ-FE-039, REQ-FE-040, REQ-FE-048

Related ADR:

ADR-003, ADR-002

Related Architecture:

ARCH-FE-001 v1.0 D5.3, D6.4, D7, D9, D12.1; Table 2 (`katalog-permission`)

File scope:

- `src/lib/api/modules/master-permissions.ts` (second touch)
- `src/lib/api/modules/master-permissions.test.ts` (extend)
- `src/features/catalog/master-permissions/`
- `src/app/router.tsx` (add the route)
- `src/test/handlers/catalog.ts` (extend)

Notes:

The mock permission keys (for example `patient.view`) are not used. Keys come from the platform catalogue as data. Gate: write tests (edit sends all current values with `key` unchanged); component tests for the gates and delete confirmation PASS.

---

# TODO-014

Description:

Build the System users screens (Tim IT > Akun) and the user detail. `src/lib/api/modules/system-users.ts` implements list, create (`loginId`, `systemRoleId`), get, role change (PATCH `systemRoleId`), status change (suspend, deactivate, reactivate; the server decides per target status), delete and the reset-password trigger, with mappers, Zod validation and tests. `src/lib/api/modules/system-roles.ts` implements the read list for role options (gate `system_roles:view`). Screen `/system-users`: client-paged list (`loginId` shown; no display name or last-active time; statuses ACTIVE, SUSPENDED and DEACTIVATED; a "self" badge when `id === me.userId`). Screen `/system-users/:id`: tabs Detail and "Sesi aktif" (gate `sessions:view`; force logout behind a confirm dialog with `sessions:revoke`, hidden for the own account; D4.10). Own account: no suspend, deactivate or delete; role change hidden (D6.6; FE-OQ-25 default). Confirm dialogs for suspend, deactivate, delete, reset password and force logout. Actions per D6.4.

Owner:

developer_frontend

Status:

Completed

Priority:

High

Dependencies:

TODO-013 (serial by design), TODO-008 (client-paged hook; auth screens), TODO-005 (admin session functions). External: SP-BG-04 (display name and last-active; fallback: loginId only); SP-BG-05 (statuses; product decision on the INACTIVE mapping first); SP-BG-11 (create and reset-password e-mail); FE-OQ-25 (own role change hidden; default used).

Related Requirement:

REQ-FE-018, REQ-FE-030, REQ-FE-031, REQ-FE-032, REQ-FE-036, REQ-FE-039, REQ-FE-040, REQ-FE-048

Related ADR:

ADR-003, ADR-002, ADR-004

Related Architecture:

ARCH-FE-001 v1.0 D4.10, D5.1, D6.4, D6.6, D7, D9, D12.1; Table 2 (`tim-akun`)

File scope:

- `src/lib/api/modules/system-users.ts`
- `src/lib/api/modules/system-users.test.ts`
- `src/lib/api/modules/system-roles.ts` (read side)
- `src/lib/api/modules/system-roles.test.ts`
- `src/types/system-user.ts`
- `src/types/system-role.ts`
- `src/features/team/users/`
- `src/app/router.tsx` (add the routes)
- `src/test/handlers/system-users.ts`
- `src/test/handlers/index.ts` (add entry)

Notes:

Role member counts are derived in TODO-015 from the user list. Gate: component tests for self-protection hiding suspend; role options require `system_roles:view`; force logout asks for confirmation and invalidates the admin sessions key. Amendment 2026-10-12 (user): the UI must not offer deactivate or delete for the user's own account (id equals me.userId); acceptance adds a test for it. The BE has no such guard (SP-BG-13). File scope unchanged.

---

# TODO-015

Description:

Build the System roles screens (Tim IT > Peran) and the permission checklist. `src/lib/api/modules/system-roles.ts` adds create (`key`, `name`, `description`, `active`), edit (all current values; `key` read-only, FE-OQ-17 default), delete, and role permissions get and replace (one PUT). Screen `/system-roles`: list with member counts derived from the user list. Screen `/system-roles/:id`: tabs Detail and Permissions; the checklist comes from the master permission catalogue (requires `master_permissions:view`) and is saved with one PUT. Protected role: the role with key `SYS_PRINCIPAL` is locked statically in the UI; it cannot be deactivated, deleted, or have its permissions changed (user decision 2026-10-12; auth-service does not guard it, SP-BG-13). For other roles, refusal-driven disable is kept as a fallback: after a refusal with `PLATFORM_ROLE_PROTECTED` or `ROLE_GUARD_VIOLATION`, edit and delete for that role are disabled for the rest of the session and the server message is shown (D6.6). The BE refuses nothing today (SP-BG-13). The refused-role state is held in memory and cleared on logout. Gates per D6.4. The mock role keys OWNER, OPERATOR and VIEWER are not used.

Owner:

developer_frontend

Status:

Completed

Priority:

High

Dependencies:

TODO-014 (serial by design; role read and user list), TODO-013 (master permissions read). External: SP-BG-06 (protected-role flag; not available: `SYS_PRINCIPAL` is locked statically in the UI, other roles use the refusal-driven disable fallback; the BE refuses nothing today, SP-BG-13); SP-BG-11 (create); FE-OQ-17 (`key` read-only; default used).

Related Requirement:

REQ-FE-018, REQ-FE-033, REQ-FE-034, REQ-FE-039, REQ-FE-040, REQ-FE-048, REQ-FE-049

Related ADR:

ADR-003, ADR-002

Related Architecture:

ARCH-FE-001 v1.0 D6.4, D6.6, D7, D9, D12.1; Table 2 (`tim-peran`)

File scope:

- `src/lib/api/modules/system-roles.ts` (second touch)
- `src/lib/api/modules/system-roles.test.ts` (extend)
- `src/features/team/roles/`
- `src/app/router.tsx` (add the routes)
- `src/test/handlers/system-roles.ts`
- `src/test/handlers/index.ts` (add entry)

Notes:

Gate: two component tests: (1) the controls to deactivate, delete, edit and change permissions are unavailable for SYS_PRINCIPAL (static lock); (2) edit and delete are disabled after a BE refusal for other roles; the checklist sends one PUT; schema tests PASS. Design change 2026-10-12 (user): the role with key SYS_PRINCIPAL is locked statically in the UI: it cannot be deactivated, deleted, or have its permissions changed. Other roles keep the refusal-driven disable as a fallback (Description); the BE refuses nothing today (SP-BG-13). Acceptance adds a component test that these controls are unavailable for SYS_PRINCIPAL. File scope unchanged.

---

# TODO-016

Description:

Build the dashboard and the sidebar badges. Dashboard `/` (authenticated; master-data widgets need SYS_PRINCIPAL): counts from `pagination.total` of `limit=1` requests for tenants, active tenants, tenant categories and countries (D7); the latest-tenants widget uses `limit=5` and is labelled with the server order, not "latest" (FE-OQ-16 default). Sidebar badges come from the contract totals: `src/app/navigation.ts` gets badge keys, and the sidebar reads them. The "Perlu ditangani" list, the activity feed, and the failed-event and active-session badges are removed (SP-BG-08). `src/components/metric-card.tsx` is kept and updated if needed.

Owner:

developer_frontend

Status:

Completed

Priority:

Medium

Dependencies:

TODO-015 (serial by design). Read dependencies: TODO-009 (tenant list), TODO-012 (categories and countries lists), TODO-007 (navigation and sidebar). External: SP-BG-08 (fallback: removed); FE-OQ-16 (default used).

Related Requirement:

REQ-FE-018, REQ-FE-019, REQ-FE-037, REQ-FE-038

Related ADR:

ADR-003

Related Architecture:

ARCH-FE-001 v1.0 D7 (dashboard row and counts), D8.1, D12.1; Table 2 (`beranda`, `data/nav`, `data/home`)

File scope:

- `src/features/dashboard/`
- `src/components/metric-card.tsx`
- `src/app/navigation.ts` (second touch)
- `src/components/app-sidebar.tsx` (third touch)
- `src/app/router.tsx` (add `/`)
- `src/test/handlers/dashboard.ts`
- `src/test/handlers/index.ts` (add entry)

Notes:

Count queries use the same query keys as the lists (D12.1), so the invalidation map keeps them fresh. Gate: component tests for counts from `pagination.total`, sidebar badges, and widgets hidden without SYS_PRINCIPAL PASS.

---

# TODO-017

Description:

Remove the mock code and the retired surfaces, and add the static checks. Delete all 15 files in `src/data/`, the 15 legacy files in `src/pages/` (including `registry.tsx`, `sistem-sesi.tsx`, `sistem-event.tsx`, `sistem-housekeeping.tsx`, `sistem-audit.tsx` and `sistem-pengaturan.tsx`), and the legacy hash router `src/router/index.tsx`. Delete any other file that has no importer after the module TODOs, confirmed by grep: `src/hooks/use-pagination.ts`, `src/assets/react.svg` and `src/components/tenant-bits.tsx` if unused. Add `src/test/static-rules.test.ts` for the D19 static checks: no `localStorage` or `sessionStorage` for auth or session data (the `theme` key stays allowed, D4.11); no `X-User-ID`, `X-Role`, `X-Tenant-ID` or `X-Service-Token` string in non-test source; no `dangerouslySetInnerHTML`; no `VITE_*` name that holds a secret. Verify REQ-FE-041 by search: no route, file or menu item for branches, facilities, social links, patient or employee flows. Record the FE doc 12 acceptance mapping in the Unit Test Report. Measure the production bundle and record it (FE-OQ-28; no budget is set here). Run the full build, typecheck and lint.

Owner:

developer_frontend

Status:

Completed

Priority:

High

Dependencies:

TODO-009 to TODO-016 (all Completed). External: SP-BG-03 and SP-BG-08 (surfaces removed); FE-OQ-23 (removed surfaces; default used); TODO-003 development host entry verified before the smoke test. The FE doc 13 smoke test runs at `/validate` (QA), not in this TODO.

Related Requirement:

REQ-FE-041, REQ-FE-042, REQ-FE-046, REQ-FE-005

Related ADR:

ADR-005, ADR-007

Related Architecture:

ARCH-FE-001 v1.0 D2, D19 (static checks; acceptance mapping), D1.3, D17; Table 2 (REMOVE and REMOVE-V1 rows); A-16

File scope:

- `src/data/` (delete all 15 files)
- `src/pages/` (delete all 15 files)
- `src/router/index.tsx` (delete)
- `src/hooks/use-pagination.ts` (delete if no importer)
- `src/assets/react.svg` (delete if no importer)
- `src/components/tenant-bits.tsx` (delete if no importer)
- `src/test/static-rules.test.ts` (new)

Notes:

The static check excludes test files, because tests assert that forbidden headers are never sent. The localStorage check covers auth and session data only. Gate: `npm run build`, `npm run typecheck` and `npm run lint` PASS; static checks PASS; no import of `src/data` or `src/pages` remains. Amendment 2026-10-12: `tenant.list` was moved out of the legacy routes-meta keys in TODO-010, so it is not done twice and not put back.

---

# TODO-018

Description:

Add Playwright end-to-end tests for the four flows named in ARCH-FE-001 D19: login, forced password change, creating a tenant whose admin account FAILED and then Retry, and deactivating a tenant. Add `@playwright/test` at an exact version, `playwright.config.ts`, a `test:e2e` script and specs under `tests/e2e/`.

Owner:

developer_frontend

Status:

Not Started

Priority:

Low

Dependencies:

TODO-010 (Tenants integration), TODO-008 (login flows), TODO-001 (package.json). External: a running platform test stack (gateway, auth-service, master-data-service). The FAILED admin-account state is produced by running master-data with a wrong SERVICE_TOKEN_VALUE (see Notes).

Related Requirement:

REQ-FE-012, REQ-FE-024, REQ-FE-025, REQ-FE-042

Related ADR:

ADR-005

Related Architecture:

ARCH-FE-001 v1.0 D19 (E2E row), A-25, FE-OQ-34

File scope:

- `package.json` (second touch; ordered after TODO-001)
- `package-lock.json` (second touch)
- `playwright.config.ts`
- `tests/e2e/`

Notes:

Deferred by ARCH-FE-001 A-25 and FE-OQ-34. Do not start before TODO-010 is Completed. The location follows the tech-stack-frontend example (OQ-P-10). The E2E runs against a real stack, so it is not a unit gate. Amendment 2026-10-12 (user): the forced password change needs the temporary password sent by e-mail; in development read it from the Mailpit API (localhost:8025). The admin_account = FAILED state is produced by running master-data with a wrong SERVICE_TOKEN_VALUE; the retry then gets 503, and a successful retry needs a second run with the correct token. File scope unchanged.

---

# TODO-019

Description:

Make `updated_by` nullable in the countries and tenant-categories wire contracts and in their mapped models. The live `countries.list` and `tenant-categories.list` responses return `updated_by: null` on seed rows (`created_by` is the system UUID `00000000-0000-0000-0000-000000000001`). The frontend schemas require a string, so both list responses fail contract validation (QA D-1, High). Changes: in `src/types/country.ts`, `CountryWireSchema.updated_by` becomes `z.string().nullable()` and the mapped `Country.updatedBy` becomes `string | null`; `mapCountry` passes the value through unchanged. In `src/types/tenant-category.ts`, the same change to `TenantCategoryWireSchema.updated_by` and `TenantCategory.updatedBy`. Keep `created_by`, `created_at`, `updated_at` and every other field unchanged. Fix every consumer that breaks typecheck (none found on 2026-10-12, see Notes). Add a unit test in each list response: a row with `updated_by: null` parses and maps to `updatedBy: null`. Do not change the platform repository.

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

TODO-012 (Completed; the countries and tenant-categories write side and their wire schemas). QA D-1 (`output/reports/qa-report-validate.md`, High, open): this TODO is the frontend fix that closes D-1.

Related Requirement:

REQ-FE-007 (the snake_case to camelCase mapping runs in the API layer, ARCH-FE-001 D5.2)

Related ADR:

ADR-001 (Zod 4 at the mapper boundary, ARCH-FE-001 D5.5), ADR-005 (Vitest unit tests)

Related Architecture:

ARCH-FE-001 v1.0 D5.2 (wire mapping of `updated_by` to `updatedBy`) and D5.5 (response validation; a mismatch produces `CONTRACT`)

File scope:

- `src/types/country.ts`
- `src/types/tenant-category.ts`
- `src/lib/api/modules/countries.ts`
- `src/lib/api/modules/tenant-categories.ts`
- `src/lib/api/modules/reference.test.ts`
- `src/lib/api/modules/catalog.test.ts`

Notes:

Amendment 2026-10-12 (user decision 2026-10-12, option 1): the frontend accepts `null` for audit actor fields. TODO-019 is added after QA (D-1). The module files are listed as their list and write functions parse through these schemas; they are expected to need no logic change.

Requirement fit: REQ-FE-005 (token storage) and REQ-FE-046 (client logs) do not apply to this change. ARCH-FE-001 D5.2 and D5.5 are design sections, not REQ rows, so the trace uses REQ-FE-007.

Consumers: a grep for `updatedBy` under `src/` on 2026-10-12 found no component, page, hook or query file that reads it. The hits are the two producer types above, the list tests in `reference.test.ts` (they read typed string fixtures and are not affected), and the tenant fixtures in `src/lib/api/modules/tenants.test.ts` and `src/test/handlers/tenants.ts` (the tenant type is not changed). If the implementer finds a consumer that reads `updatedBy` as a string, that file is added to File scope by amendment before it is edited. A consumer that displays `updatedBy` shows a dash for `null`.

Not changed: `created_by` stays non-null. The tenant wire schema in `src/types/tenant.ts` stays non-null (QA found that the tenant list parses on live data). If the platform later sends `null` on tenant rows, a new TODO is needed.

Gate: the TODO-019 Unit Test Report shows `execution_overall: PASS`, including the two new list tests with `updated_by: null`. The regression set (TODO-009 to TODO-017 tests for these modules and screens) PASS. `npm run build` PASS (`tsc -b` is the real type check, OQ-P-61; `npm run typecheck` checks nothing). `npm run lint` adds no error in the files listed. The QA re-run of C-10 (no `[contract]` line on `/countries` and `/tenant-categories`) is a QA step after this TODO is Completed; it is not part of this TODO's gate.

---

# TODO-020

Description:

Frontend accepts the live tenant detail shape. `TenantDetailWireSchema` (`src/types/tenant.ts`) must not require the flat `tenant_category_id` and `country_code` keys. The live `GET /api/v1/tenants/{id}` response has no top-level `tenant_category_id` or `country_code`; it returns the nested `tenant_category` `{id, code, name}` and `country` `{code, name, phone_code}` or `null`. `mapTenantDetail` (`src/lib/api/modules/tenants.ts`) derives `tenantCategoryId` from `tenant_category.id` and `countryCode` from `country.code`, or `null` when `country` is `null`. The create response (POST) and the list responses keep the flat fields and their mapper, unchanged. Unit tests: (1) detail with nested `tenant_category` and `country: null` maps and passes validation; (2) detail with `country` present maps `countryCode` from `country.code`; (3) create and list still map the flat `tenant_category_id` and `country_code`. The platform repository is not changed.

Owner:

developer_frontend

Status:

Completed

Priority:

Critical

Dependencies:

TODO-010 (Completed; tenant detail page and its `tenants.get` read). QA finding: new CONTRACT error on `tenants.get` (`GET /api/v1/tenants/{id}`, keys `tenant_category_id` and `country_code`), reported 2026-10-12. As of this amendment the finding is not recorded in `output/reports/qa-report-validate.md` (see Notes). The QA report is QA-owned and is not edited here.

Related Requirement:

REQ-FE-007 (snake_case to camelCase mapping in the API layer, ARCH-FE-001 D5.2); REQ-FE-021 to REQ-FE-025 (tenant detail, as traced in TODO-010)

Related ADR:

ADR-001 (Zod 4 at the mapper boundary, ARCH-FE-001 D5.5), ADR-002 (master-data API, as TODO-009), ADR-005 (Vitest unit tests)

Related Architecture:

ARCH-FE-001 v1.0 D5.2 (detail joins: `tenant_category` to `tenantCategory`, `country` to `country`; the detail model keeps `tenantCategoryId` and `countryCode`) and D5.5 (response validation; a mismatch produces `CONTRACT`)

File scope:

- `src/types/tenant.ts`
- `src/lib/api/modules/tenants.ts`
- `src/lib/api/modules/tenants.test.ts`
- `src/test/handlers/tenants.ts` (builds the detail fixture `FIXTURE_TENANT_DETAIL` served by the `GET /tenants/:id` handler; the test fixture is changed to the live shape for the nested-only case)

Notes:

Decision: user decision 2026-10-12 (frontend fix). Amendment: this TODO is added as v1.7 of this artifact; no other TODO changes.

Derivation rule (detail only): `tenantCategoryId` = `tenant_category.id` (required; a missing `tenant_category` gives CONTRACT, as today); `countryCode` = `country.code` when `country` is present, otherwise `null`. Flat `tenant_category_id` and `country_code` keys, if the server sends them, are ignored (unknown keys are ignored, D5.2). `TenantWireSchema` (create and list) keeps the flat keys required. Implementation shape is for developer_frontend: a shared core schema without the two flat keys, extended by the list and create schema and by the detail schema, is one option.

Field gap to check: the current detail schema also requires `social_links` (array). The live detail body was not checked for `social_links` in this amendment. Before this TODO is Completed, the implementer confirms the top-level key set of the live body (key names only, no values; D13). If `social_links` is absent live, that is an amendment to this TODO (make it optional), not a silent change.

Confirmation (2026-10-12, user): the live `GET /api/v1/tenants/{id}` body was checked and its top-level keys include `social_links` (current value an empty array `[]`). The key is present, so no amendment to make it optional is needed. The QA re-check on the live stack is still pending (QA finding, see progress-tracker OQ-P-63).

Architecture note: ARCH-FE-001 v1.0 D5.2 is not edited here. The derivation rule is recorded in this TODO by user decision. If the architect owners want D5.2 to state it, that is an architecture amendment by the owner, not by project_manager.

QA record: the QA report `output/reports/qa-report-validate.md` (last written 10:39) does not record this finding. Its C-8 row records `GET /api/v1/tenants/{id}` 200, and its summary records the tenant detail reads as working on the live stack. The finding is cited here as reported on 2026-10-12. QA owner to record it. This does not block the unit gate.

Gate: unit tests for the tenants module PASS, including the three cases above; `TODO-009` tenant list and `TODO-010` create and detail tests PASS as regressions; `npm run build` PASS (`tsc -b`). QA re-check after Completed (not part of the unit gate): `/tenants/:id` loads with no `[contract]` line on the live stack.

# TODO-021

Description:

Make Katalog > Permission (`/master-permissions`) read-only (user product decision 2026-10-12; ARCH-FE-001 v1.0.4, Pending Approval). Remove from the UI: the create button and create dialog path, the activate/deactivate (`active`) switch, and the delete action including its confirmation dialog and the `RowDeleteButton` usage on this page. Keep: list, detail, and edit of `name` and `description` only. The edit PATCH sends the full current body (`key`, `category`, `module`, `active`, `customerPermitted` unchanged; FE-OQ-38 default); `key` is read-only and `active` is shown as a read-only status. Gates per D6.4: the page needs `master_permissions:view`; the edit action needs `master_permissions:update`; no control is offered for `:create`, `:delete` or the `active` toggle, even when the session holds all `master_permissions:*` keys. Invalidation after edit per D12.1 (`['system','masterPermissions']`, all `['system','tenantPermissions']`, `['system','rolePermissions']`). Remove code that becomes unused in the page and form dialog (create mode, delete handler, `active` switch field, create-only schema parts). The API functions `createMasterPermission` and `deleteMasterPermission` in `master-permissions.ts`: ARCH-FE-001 v1.0.4 does not say to remove them, so they were removed from `master-permissions.ts` together with their module tests and route names (user-approved amendment 2026-10-12, v1.9; supersedes the earlier instruction to leave them). `toRequestBody` now always sends `description` (empty string when absent); the update PATCH is unchanged. Tenant permission activate/deactivate (`tenant_permissions:*`) is not affected.

Owner:

developer_frontend

Status:

Completed (2026-10-12; Unit Test Report `execution_overall: PASS`, 909 passed in 75 files, was 917; file-provenance rows FP-230 to FP-237)

Priority:

High

Dependencies:

TODO-013 (Completed; this TODO is new and does not reopen it). Gate: ARCH-FE-001 v1.0.4 Approved (cleared 2026-10-12). External, not blocking: BG-12 / SP-BG-13 (server-side guard against deactivate/delete of core master permissions; platform repository, auth-service architect_backend); FE-OQ-38 (partial vs full PATCH body; documented default: full body).

Related Requirement:

REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048

Related ADR:

ADR-003, ADR-002, ADR-005

Related Architecture:

ARCH-FE-001 v1.0.4 REQ-FE-035, D5.3, D6.4, D7, D8 Table 2 (`katalog-permission`), D9, D12.1, BG-12, FE-OQ-38

File scope:

- `src/features/catalog/master-permissions/permission-list-page.tsx`
- `src/features/catalog/master-permissions/permission-list-page.test.tsx`
- `src/features/catalog/master-permissions/permission-form-dialog.tsx`
- `src/features/catalog/master-permissions/schema.ts`
- `src/features/catalog/master-permissions/schema.test.ts`
- `src/lib/api/modules/master-permissions.ts` (add `getMasterPermission(id)` for GET `/api/v1/master-permissions/{id}`, verified absent today; removal of create/delete only if approved, see Description)
- `src/lib/api/modules/master-permissions.test.ts`
- `src/test/handlers/catalog.ts` (POST and DELETE `/master-permissions` handlers removed; PATCH handler stays; add GET `/master-permissions/:id` handler, verified absent today)
- `src/lib/query/invalidation.ts` and `src/lib/query/invalidation.test.ts` (verify only: event `masterPermissionWrite` is still used by edit; change only if the D12.1 set differs)
- `src/features/team/roles/refused-roles.test.tsx` (verify only: it fires `masterPermissionWrite`; no change expected)

Notes:

Decision: user decision 2026-10-12. Amendment: added as v1.8 of this artifact; TODO-013 stays Completed. Files verified by grep: all use of `createMasterPermission`, `deleteMasterPermission` and `RowDeleteButton` for master permissions is in the files listed above; `RowDeleteButton` itself (`src/components/delete-button.tsx`) is still used by tenant categories and countries and is not changed. `src/app/router.tsx`, `src/app/navigation.ts` and the route guard keep `master_permissions:view` and are not changed. Added acceptance criterion (user, 2026-10-12): fields other than `name` and `description` (`key`, `category`, `module`, `active`, `customerPermitted`) are read-only in the edit dialog. The FE re-fetches the permission from the server (GET `/api/v1/master-permissions/{id}`) just before the PATCH and sends those fields unchanged together with the edited `name` and `description`. Tests must cover: (1) the PATCH body carries the freshly fetched values of the read-only fields, not the stale list values (e.g. the server changed `active` or `customerPermitted` after the list loaded); (2) those fields are not editable controls in the dialog; (3) a failed re-fetch blocks the PATCH and shows the error. Acceptance: component tests show no create control, no active switch and no delete control render even when the session holds `master_permissions:view`, `:create`, `:update`, `:delete` and `:activate`/`:deactivate` keys; the edit of name/description sends exactly one PATCH with the full current body and `key` unchanged; the edit action is hidden without `master_permissions:update`; invalidation after edit matches D12.1; `tsc`, `eslint` and `vitest` PASS, with TODO-011, TODO-013 and TODO-015 related regressions (tenant permissions tab, role permission checklist) PASS. File-provenance rows are added at `/build`, not here.

---

---

## Open Questions

None owned by this artifact. OQ-P-01 and OQ-P-02 are answered (see `implementation-plan.md`).
