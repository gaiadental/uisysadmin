---
id: UTR-TODO-017
title: Unit Test Report TODO-017
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 09:58
related_todo: TODO-017
execution_overall: PASS
source_requirements: [REQ-FE-041, REQ-FE-042, REQ-FE-046, REQ-FE-005]
related_artifacts: [ARCH-FE-001, ADR-005, ADR-007, TODO-017]
blocking_open_questions: 0
---

Title: Unit Test Report TODO-017 (Legacy removal and static checks)
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 09:58
Source Requirements: REQ-FE-041, REQ-FE-042, REQ-FE-046, REQ-FE-005
Related Artifacts: ARCH-FE-001 v1.0 (D2, D19, D1.3, D17, Table 2, A-16), ADR-005, ADR-007, TODO-017, OQ-P-60

## At a Glance

- Static source checks (`src/test/static-rules.test.ts`, 16 tests) and a new `useIsMobile` test (6 tests). The TODO-017 gate (build, typecheck, lint, static checks, no import of removed folders) passes.
- Overall PASS. 70 files / 884 tests in the full suite, no regressions.
- Includes the FE doc 12 acceptance mapping, the REQ-FE-041 search result, the bundle measurement (record only, FE-OQ-28) and the OQ-P-60 scope extension.

## Purpose

Verify TODO-017 and record scope, test cases, execution, acceptance mapping, bundle size, coverage, edge cases and mocking.

## Scope

TODO file scope: deletion of `src/data/` (15 files), `src/pages/` (15 files), `src/router/index.tsx`, `src/hooks/use-pagination.ts`, `src/assets/react.svg`; new `src/test/static-rules.test.ts`. `src/components/tenant-bits.tsx` is kept: it has three importers (permission, tenant-category and country list pages).

Scope extension (user decision on OQ-P-60, option 1), outside the TODO file list:
- `eslint.config.js`: override turns off `react-refresh/only-export-components` for `src/components/ui/**` (shadcn files export variants next to components).
- `src/hooks/use-mobile.ts`: rewritten with `useSyncExternalStore` (same behaviour: mobile means width below 768 px). This removes the setState-in-effect lint error.

No production code was changed by unit-test-writer. Stack: frontend (Vitest 5, React Testing Library, MSW, jsdom).

## Test Cases

Implementer-authored, reviewed by unit-test-writer: `src/test/static-rules.test.ts` (16 tests).
- Sanity (2): more than 50 production files scanned, no test file in the scanned set, theme provider present; comment stripping removes header names in comments and keeps `http://` URLs.
- Browser storage (4): no `sessionStorage` in production source; `localStorage` only in `theme-provider.tsx`; provider keeps the `"theme"` key and none of its string literals contains an auth word; no `window.localStorage` or `window.sessionStorage`.
- Forbidden headers (4, `it.each`): `X-User-ID`, `X-Role`, `X-Tenant-ID`, `X-Service-Token`, matched case-insensitively with `-`, `_`, space or nothing as separator.
- Unsafe HTML (1): no `dangerouslySetInnerHTML`.
- Environment (2): no secret-like `VITE_*` name in source (the test also asserts at least one `VITE_*` name is read, which guards against an empty scan); none in `.env*` files.
- Removed surfaces (3, REQ-FE-041): no file path containing branch, facility, social, patient, employee or the Indonesian equivalents; no file under `src/data`, `src/pages`, `src/router`; no import from those folders.

Review for pass-by-construction: none found. Evidence:
- The sanity test fails if the glob matches nothing or a test file leaks into the scan, so an empty scan cannot pass the "equals []" checks.
- Mutation check run by unit-test-writer: a temporary file `src/zz-mutation.ts` containing `sessionStorage`, an `"X-Role"` header string and `VITE_API_SECRET` made exactly three tests fail (sessionStorage, X-Role, VITE_* secret). The file was removed and the suite returned to 16/16.
- Limits (not defects): the scan is textual. A header built from concatenated parts, or a storage access through an alias, would not be seen. The path check for removed surfaces tests file names only; content is covered by the search below.

Added by unit-test-writer (6 tests, 1 new file): `src/hooks/use-mobile.test.ts` (jsdom, no such test existed).
- True at 767 px and at 0 px; false at 768 px (boundary) and 1440 px.
- Subscribes once to `(max-width: 767px)`.
- Re-renders to the new value when the media query change fires (500 px then 900 px).
- Removes its listener on unmount (listener count back to 0).

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx vitest run |
| Run at | 2026-10-12 09:55 |
| Total | 884 (70 files) |
| Passed | 884 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

TODO-017 scope alone: `static-rules.test.ts` 16/16, `use-mobile.test.ts` 6/6. Before the added file: 878 tests in 69 files.

## Execution Results

884 tests passed.

Project-wide gate (run by implementer and re-run by unit-test-writer where noted):
- `npm run lint`: PASS (re-run 09:55, no findings).
- `npm run typecheck` (`tsc --noEmit`): PASS (re-run 09:55). The legacy type errors listed in TODO-016 (`src/pages/*`, OQ-P-17) are gone with the deleted folders.
- `npm run build`: PASS (implementer).
- No import of `src/data`, `src/pages` or `src/router` remains (static check plus `tsc`).

## Handoff (FAIL only)

Not applicable (PASS).

## REQ-FE-041 search result

Surfaces (route, menu, page, file): none.
- `src/app/router.tsx` paths: `/`, `/login`, `/forgot-password`, `/reset-password`, password change, `/tenants`, `/tenants/new`, `/tenants/:id`, `/tenants/:id/permissions`, `/master-permissions`, `/tenant-categories`, `/countries`, `/system-users`, `/system-users/:id`, `/system-roles`, `/system-roles/:id`, `/account/sessions`. None is for branches, facilities, social links, patients or employees.
- `src/app/navigation.ts` has no entry for those words. File names under `src/` have none (asserted by the test).
- `src/app/dashboard/` is an empty directory left on disk (untracked by git, no files).

Remaining word hits in content (case-insensitive search of `src/`), all data-contract or read-only and not a surface:
- `src/types/auth.ts`: `branches` on the `me` payload (nullish, SP-CF-01), read as `[]` when missing.
- `src/types/tenant.ts`: wire fields `multi_branch_enabled`, `social_links`, and a note that `default_branch_types` is not mapped. `socialLinks` is mapped into the type but no component renders or edits it.
- `multiBranchEnabled` is shown as the read-only "Multi cabang" value on tenant detail and sent as a creation field on tenant create (a tenant storage property per the BE contract, not a branch screen).
- `branches:view` is a permission key string shown in permission lists and used in fixtures.
- Test handlers and fixtures only otherwise.
Result: no UI surface for the removed flows. Product decision FE-OQ-23 (default used) stands; the data-contract fields above are recorded for review, not changed.

## FE doc 12 acceptance mapping

Source: `[FE Requirement] system-principal-web v1.0.md` section 12. "Unit" means covered by a named automated test in this repository. "Smoke" means it needs the FE doc 13 smoke test against a running gateway at `/validate` (QA).

| # | Acceptance item | Evidence | Result |
|---|-----------------|----------|--------|
| 1 | All calls go to the gateway base URL or the dev proxy; no direct service URL | `src/lib/api/client.test.ts` (base URL), vite `^/api/` proxy (TODO-003); `.env.*` hold an empty `VITE_API_BASE_URL`; MSW `onUnhandledRequest: "error"` fails any call outside the handlers | Unit |
| 2 | No `X-User-ID`, `X-Role`, `X-Tenant-ID`, `X-Service-Token` header sent | `static-rules.test.ts` forbidden headers (4); `client.test.ts` request headers | Unit |
| 3 | Access token in memory only; refresh cookie with `credentials: 'include'`; single-flight refresh; reload keeps session via `POST /auth/refresh` | `static-rules.test.ts` storage checks; `client.test.ts` (credentials include); `refresh.test.ts` (single-flight); `auth-provider.test.tsx` (bootstrap refresh) | Unit |
| 4 | `pwdChangeRequired = true` blocks the app until the password is changed | `route-guard.test.tsx`, `auth-provider.test.tsx`, `navigation.test.ts`, `login-page.test.tsx`, `change-password-page.test.tsx` | Unit |
| 5 | Menus and buttons follow `me.permissions` | `gates.test.ts`, `navigation.test.ts`, `access.test.ts` files for users, roles and tenant permissions, list-page tests per screen | Unit |
| 6 | camelCase and snake_case mapped; auth `{ data }` unwrapped | `lib/api/modules/*.test.ts` (auth, tenants, catalog, reference, sessions, system-roles, system-users, master-permissions, tenant-permissions) | Unit |
| 7 | master-data lists server pagination; auth lists client pagination | `tenant-list-page.test.tsx`, `country-list-page.test.tsx` (server); `use-client-paged-list.test.ts`, `user-list-page.test.tsx` (client) | Unit |
| 8 | Edit forms show immutable fields read-only and never send them | `profile-patch.test.ts`, `tenant-detail-page.test.tsx`, `tenants.test.ts` (type-level `@ts-expect-error` on immutable field), `country-list-page.test.tsx`, `permission-list-page.test.tsx` (key read-only) | Unit |
| 9 | Tenant create handles the three `admin_account` outcomes; Retry works | `classify-admin-account.test.ts`, `tenant-create-page.test.tsx` | Unit |
| 10 | PATCH `is_active` reverts the toggle and shows the message on 503 | `tenant-detail-page.test.tsx`, `tenant-list-page.test.tsx` | Unit |
| 11 | Error handling follows section 7; errors show `X-Correlation-ID` | `errors.test.ts`, `client.test.ts`, `failure.test.ts`, `tenant-list-page.test.tsx` | Unit |
| 12 | Confirm dialogs for delete, deactivate, suspend, reset password, force logout | `dialogs.test.tsx`, user detail, session and list-page tests | Unit |
| 13 | Logout clears memory and cached queries | `auth-provider.test.tsx` (query cache cleared), `sessions-page.test.tsx` | Unit |

Items needing a running gateway for end-to-end proof (1 real host, 3 real cookie refresh across reload, 10 real 503): the FE doc 13 smoke test at `/validate`, as the TODO notes state. This report maps by file name; each file was read for scope, but a line-level trace per item is left to review and QA.

## Bundle measurement (record only, FE-OQ-28; no budget set)

Measured on the production build (`dist/assets`, run at 09:53):
- `dist/assets` on disk: 1580 KB (`du -sk`).
- All JavaScript, gzip total: about 252 KB (implementer figure, not re-measured).
- Main chunk `index-*.js`: 252.45 kB raw, 79.09 kB gzip. Next largest: `createBaseUIEventDetails` 197 kB raw, `tooltip` 84 kB raw, `tenant-list-page` 46 kB raw. Routes are split into per-page chunks.
- No budget, no gate. Recorded for the later FE-OQ-28 decision.

## Coverage

No coverage run is configured, so no percentage is recorded and the 80 percent guideline is not verified numerically. Behavioural coverage against the TODO gate: all seven static rules (storage, four headers, unsafe HTML, VITE secrets, removed surfaces, removed imports) and every branch of `useIsMobile` (true, false, boundary, change event, cleanup). The acceptance mapping above ties the doc 12 checklist to existing suites.

## Edge Cases

- Static rules: comment containing a forbidden name (stripped), URL with `//` (kept), empty scan (sanity guards), header spelling variants (`X_Role`, `x role`), `.env.development` and `.env.production`, secret-like `VITE_*` names in source and env files.
- `useIsMobile`: 0 px, 767 px, 768 px, 1440 px, repeated change events, unmount.
- Idempotency: not applicable (no write path in this TODO).

## Mocking Strategy

- `static-rules.test.ts` uses no mocks: it reads source through Vite `import.meta.glob` with `?raw`, eager, node environment.
- `use-mobile.test.ts` replaces `window.matchMedia` with a stub that records queries and listeners, and sets `window.innerWidth` per test; both are restored in `afterEach`. jsdom environment through the file docblock, matching the other component tests.
- Global MSW server from `src/test/setup.ts` stays active; neither file makes a request.

## Observations (no production change made)

- The directory `src/app/dashboard/` is empty and can be removed by the implementer (untracked by git, harmless).
- The static scan is textual (see limits above). A stricter AST check was not added; it is outside the TODO.
- The `src/components/ui/**` lint override (OQ-P-60) is broad by directory, so a future non-component export in that folder would not be flagged by that rule.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ-P-60 | Fix the lint errors in shadcn `ui/**` and `use-mobile.ts` | Needed for the project-wide lint gate | Scope extension on `eslint.config.js` and `use-mobile.ts` | project-manager | No | Answered | User chose option 1: ui override plus `useSyncExternalStore` rewrite; tested here |
| FE-OQ-28 | Bundle budget | Bundle is recorded, not gated | None for this TODO | architect-frontend | No | Deferred | Record only; figures above |
| FE-OQ-23 | Removed surfaces (branches, facilities, social, patient, employee) | Basis of the REQ-FE-041 check | None | architect-frontend | No | Answered | Default used; no UI surface found |
