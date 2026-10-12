---
id: UNIT-TEST-REPORT-TODO-007
title: Unit Test Report — TODO-007 App shell and navigation gate
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-11 21:54
related_todo: TODO-007
execution_overall: PASS
source_requirements: [REQ-FE-008, REQ-FE-016, REQ-FE-018, REQ-FE-019, REQ-FE-039, REQ-FE-045]
related_artifacts: [TODO-007, TODO-006, ADR-001, ADR-003, ADR-004, ARCH-FE-001, UNIT-TEST-REPORT-TODO-006]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-007 App shell and navigation gate
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-11 21:54
Source Requirements: REQ-FE-008, REQ-FE-016, REQ-FE-018, REQ-FE-019, REQ-FE-039, REQ-FE-045
Related Artifacts:
- output/plans/master-todo.md (TODO-007, File scope incl. the 2026-10-11 amendment, Gate)
- output/reports/unit-test-report-TODO-006.md (format reference; open items carried)
- ARCH-FE-001 v1.0 (D4.6, D6.2, D6.3, D11, D13, D16)

## At a Glance

- Overall PASS. `npx vitest run` exited 0 on both runs: 11 files, 190 of 190 tests passed, identical sorted test-name sets and per-file counts.
- All 4 Gate items have named asserting tests. The 3 amendment checks (2026-10-11) have named tests: the navigation drift test, the 403 on /tenants for SYS_ADMIN with no permissions, and the change-password route access.
- ESLint on the 17 TODO-007 files: 0 errors, 0 warnings. Vite build: exit 0. Typecheck: 17 errors, all in `src/pages/` (legacy set, PM-RK-01); 0 in TODO-007 files.
- Not gating, but open: the forced-change logout control has no test (TDR-007-OQ9), and `src/lib/notify.ts` has no test (TDR-007-OQ8). Both are non-blocking under the stated criteria; see Open Questions.

## Purpose

Record the Checkpoint C run for TODO-007 (app shell, navigation config, route guard, logout routing). Confirm the suite, map every Gate item and amendment check to named tests, and record the static checks and the legacy typecheck set.

## Scope

In scope: the 17 TODO-007 File-scope files (master-todo, including the 2026-10-11 amendment for `route-guard.tsx`, `route-guard.test.tsx` and `router.tsx`), and the test files under them. The suite run covers all 11 test files under `src/`: the 21 new TODO-007 tests and the 169 tests from TODO-004, TODO-005 and TODO-006 (re-run, not re-reviewed).

Out of scope: production code, test code and configuration (not changed by this run); the dashboard, the module pages and their navigation items (later TODOs); end-to-end tests (QA, TODO-018).

## References

- `output/plans/master-todo.md` -> TODO-007 (Description, File scope, Notes, Gate)
- `output/reports/unit-test-report-TODO-006.md` (format; carried items TDR-006-OQ2, OQ7, OQ8)
- `src/app/navigation.ts` (single navigation config; 9 items)
- `src/app/guards/route-guard.tsx` (guard; reads access from the navigation config, D6.3)

## Test Cases

### Gate coverage (master-todo TODO-007 Gate)

Names are as printed by the verbose run.

| # | Gate item | Covering test(s) | Result |
|---|-----------|------------------|--------|
| G-1 | SYS_PRINCIPAL sees master-data items | `src/app/navigation.test.ts` > "navigation gating (ARCH-FE-001 D6.2, D6.3)" > "shows the master-data items to SYS_PRINCIPAL" (asserts tenant.list, tenant.create, catalog.kategori, catalog.negara, account.sessions, account.password). Companion: "hides the permission-gated items from SYS_PRINCIPAL without those keys". | Covered |
| G-2 | SYS_ADMIN with no permissions sees only own-account items and the landing page (D6.2) | `src/app/navigation.test.ts` > "shows only own-account items to SYS_ADMIN with no permissions (D6.2)": the visible ids are exactly ["account.sessions", "account.password"], and `hasVisibleModule` is false, which is the landing-page decision. The landing page render is not tested (TDR-007-OQ5). | Covered (decision); render not tested |
| G-3 | Logout routes to `/login` | `src/components/dialogs/dialogs.test.tsx` > "logout from the sidebar (REQ-FE-016, D4.8)" > "logs out through the auth provider and moves to the login page": clicks "Keluar", waits for `window.location.pathname` to be `/login`, and asserts `logout` was called once. | Covered |
| G-4 | Logout clears state (token, cache, view) | `src/app/providers/auth-provider.test.tsx` > "logout (D4.8)" > "calls the server, then clears the token, the cache and the view" (status anonymous, one POST, token null, `me` cache undefined); also "still ends the local session when the server call fails" and "ends this session when another tab announces a logout (sp-session)". These are TODO-005 provider tests. The dialogs test mocks `logout`, so the clearing is asserted here, not in dialogs. | Covered (TODO-005 tests) |

### Amendment checks (master-todo scope amendment 2026-10-11)

| # | Check | Covering test | Result |
|---|-------|---------------|--------|
| A-1 | Route and sidebar gate agree (drift test): 9 items x 8 session states | `src/app/guards/route-guard.test.tsx` > "navigation items and routes share one gate (ARCH-FE-001 D6.3)" > "every navigation item is shown exactly when the guard renders its route". One test loops over 9 `NAV_ITEMS` and 8 contexts (72 cases). Nav visibility must equal guard render, except during a required password change (D4.6). | Covered |
| A-2 | SYS_ADMIN with no permissions gets the 403 screen on `/tenants` | `route-guard.test.tsx` > "a route whose item needs SYS_PRINCIPAL gives SYS_ADMIN with no permissions the 403 screen, and hides the item". Uses `navItemAt("/tenants")` and a SYS_ADMIN with `permissions: []`. Asserts the FORBIDDEN screen with no redirect, and that the item is hidden. | Covered |
| A-3 | Change-password route takes its navigation item's access | `route-guard.test.tsx` > "the change-password route takes the access of its navigation item"; "the same route renders for SYS_PRINCIPAL, and its item is shown"; "while a password change is required, the change page renders and no navigation item is shown (D4.6)". | Covered |

All 4 Gate items and all 3 amendment checks have named, asserting tests. No Gate item is missing.

### Test count by file

| File | Tests | Breakdown | New in TODO-007 |
|------|-------|-----------|-----------------|
| `src/app/navigation.test.ts` | 11 | gating 7; config shape 4 | Yes |
| `src/components/dialogs/dialogs.test.tsx` | 5 | confirm dialog 4; logout from the sidebar 1 | Yes |
| `src/app/guards/route-guard.test.tsx` | 20 | TODO-006 redirect table 15; amendment (navigation share one gate) 5 | 5 (amendment) |
| `src/lib/access/gates.test.ts` | 28 | TODO-006 | No |
| `src/app/providers/auth-provider.test.tsx` | 12 | TODO-005 and GATE-11 (TODO-006) | No |
| `src/lib/api/client.test.ts` | 33 | TODO-004 | No |
| `src/lib/api/modules/auth.test.ts` | 20 | TODO-005 | No |
| `src/lib/api/modules/sessions.test.ts` | 9 | TODO-005 | No |
| `src/lib/api/refresh.test.ts` | 9 | TODO-004 | No |
| `src/lib/api/errors.test.ts` | 8 | TODO-004 | No |
| `src/lib/query/invalidation.test.ts` | 35 | TODO-004 | No |
| Total | 190 | 169 from TODO-004 to TODO-006 + 21 new in TODO-007 | 21 |

## Checks

| ID | Check | Command | Expected | Result |
|----|-------|---------|----------|--------|
| C1 | Vitest, run 1 | `npx vitest run --reporter=verbose` | Exit 0 | PASS. Exit 0. 11 files passed, 190 tests passed. |
| C2 | Vitest, run 2 (determinism) | same | Exit 0, same totals and names | PASS. Exit 0. 11 files, 190 tests. Sorted test-name lists identical (190 lines each). Per-file counts identical. |
| C3 | ESLint, TODO-007 files | `npx eslint` on the 17 File-scope files | 0 errors in TODO-007 files | PASS. 17 files linted: 0 errors, 0 warnings. Exit 0. |
| C4 | Production build | `npx vite build --outDir <scratchpad>/dist-todo007-report --emptyOutDir` | Exit 0 | PASS. Exit 0, built in 2.10 s. The output went to the session scratchpad, not the repo. Vite reports a chunk-size notice (main JS 520.54 kB, 160.06 kB gzip); this is a warning, not an error. |
| C5 | Typecheck by path | `npx tsc -p tsconfig.app.json --noEmit` | 0 errors in TODO-007 files; only the legacy `src/pages/` set | PASS by path. Exit 2 with 17 errors, all in `src/pages/`. 0 in TODO-007 files. Detail below. |
| C6 | Gate and amendment coverage | Read of test names and bodies | Every Gate item and amendment check has a named, asserting test | PASS. 4 of 4 Gate items; 3 of 3 amendment checks. |

ESLint result by file (17 TODO-007 files):

| Scope | Files | Errors | Warnings |
|-------|-------|--------|----------|
| TODO-007 File scope (incl. amendment) | 17 | 0 | 0 |

Typecheck result by path (17 errors, all in `src/pages/`):

| Path | Line | Code | Cause |
|------|------|------|-------|
| `src/pages/katalog-kategori.tsx` | 37 | TS2339 | Removed `dialogs.open` call (no `open` on DialogsContextValue) |
| `src/pages/katalog-kategori.tsx` | 40 | TS7006 | Callback parameter `category` loses its type inside the removed `open` call |
| `src/pages/katalog-negara.tsx` | 37 | TS2339 | Removed `dialogs.open` call |
| `src/pages/katalog-negara.tsx` | 40 | TS7006 | Callback parameter `country` inside the removed `open` call |
| `src/pages/katalog-permission.tsx` | 56 | TS2339 | Removed `dialogs.open` call |
| `src/pages/sistem-sesi.tsx` | 102 | TS2339 | Removed `dialogs.open` call |
| `src/pages/tenant-create.tsx` | 113 | TS2339 | Removed `dialogs.open` call |
| `src/pages/tenant-create.tsx` | 514 | TS2375 | Pre-existing: `hint` typed string or undefined under `exactOptionalPropertyTypes` (PM-RK-02) |
| `src/pages/tenant-create.tsx` | 519 | TS2375 | Pre-existing, same cause (PM-RK-02) |
| `src/pages/tenant-detail.tsx` | 134, 149, 159, 370 | TS2339 | Removed `dialogs.open` call (4 sites) |
| `src/pages/tenant-list.tsx` | 194 | TS2339 | Removed `dialogs.open` call |
| `src/pages/tim-akun.tsx` | 129 | TS2339 | Removed `dialogs.open` call |
| `src/pages/tim-peran.tsx` | 104 | TS2339 | Removed `dialogs.open` call |
| `src/pages/tim-peran.tsx` | 107 | TS7006 | Callback parameter `permissionKeys` inside the removed `open` call |

Count: 12 TS2339 + 3 TS7006 = 15 from removed `open` call sites (expected by PM-RK-01, to be removed in TODO-017); 2 TS2375 pre-existing in `tenant-create.tsx`. Total 17. No error in any TODO-007 file.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npx vitest run --reporter=verbose` (run 1 and run 2) |
| Run at | 2026-10-11 21:51 (run 1 started 21:51:51; run 2 started 21:51:53, local time) |
| Total | 190 |
| Passed | 190 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Notes on the run:
- Exit codes: run 1 = 0; run 2 = 0. Vitest summary on both runs: 11 files passed, 190 tests passed.
- Sorted test-name lists from both runs are identical (190 lines each).
- Node prints an ExperimentalWarning about `localStorage` (8 lines per run). It is a Node runtime notice, not a test result. No `act()` warnings or unhandled errors appear in the output.
- No `.skip`, `.only` or `.todo` markers exist in the test files.

## Execution Results

190 tests passed in 11 files on two identical runs (exit 0 both). All 4 Gate items and 3 amendment checks are covered. No test failed.

## Handoff

Not required on PASS. The orchestrator clears any `failure_handoff` for TODO-007 and records the gate outcome. The TODO-007 status change (In Progress to Completed) and the provenance update belong to the orchestrator and project-manager; this report does not change them.

## Coverage

Not measured. `node_modules/@vitest` contains only `mocker` and `spy`, so no coverage provider is installed and the 80% guideline is not evaluated for TODO-007. Carried as TDR-004-OQ4.

## Edge Cases

Covered (by the named tests above):
- Null and absent: a null `me` shows no navigation items ("shows nothing without a session"); the drift test's "boot in progress" and "boot failed" contexts (both `me` null) show no items; `findNavItem("/login")` is null.
- Empty: a SYS_ADMIN with an empty permission list sees only the two own-account items.
- Boundary: SYS_PRINCIPAL with and without the permission keys; "/tenantsx" is not matched by "/tenants" (prefix boundary).
- Invalid: `navItemAt` throws for a path with no item ("refuses a path with no item").
- Failure: while a password change is required, every navigation item is hidden and the change page still renders; a SYS_ADMIN with no permissions gets the 403 screen on `/tenants`; a logout whose server call fails still ends the local session (TODO-005 test).

Idempotency (checklist item): not applicable. TODO-007 adds no API writes. The logout POST is asserted as one call in the TODO-005 test.

Not exercised (see Open Questions):
- The visible logout control while `passwordChangeRequired` is true (TDR-007-OQ9).
- The landing page render (TDR-007-OQ5).
- The D13 reference line in error toasts (TDR-007-OQ8).
- Render of the sidebar, command palette, site header and layouts (TDR-007-OQ10).
- Focus after a route change (D16; TDR-007-OQ2).

## Mocking Strategy

- `navigation.test.ts`: pure functions with a fixed fixture (`BASE_ME`). No mocks. Default `node` environment.
- `route-guard.test.tsx`: jsdom by per-file comment. `vi.mock("@/app/providers/auth-provider")` replaces `useAuth` with a `vi.fn()` that returns a fixed context per test. The drift test renders each case and calls `cleanup()` between cases. No MSW: the guard makes no requests. No fake timers.
- `dialogs.test.tsx`: `useAuth` is mocked, with `logout` as a `vi.fn()`. The path is set with `window.history.replaceState`. React Testing Library `render`, `fireEvent` and `waitFor`. The logout test asserts routing only; state clearing is asserted in the auth-provider tests.
- `auth-provider.test.tsx`: unchanged in TODO-007. MSW and the existing provider harness (TODO-005).
- Determinism: sorted test-name lists from both runs are identical. Each test renders fresh and gets a fresh mock.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| TDR-007-OQ1 | Only the change-password route has a navigation item. Module routes need routes-meta keys before the router can take their access. | Module pages cannot be gated until their keys exist. | Module routes are not reachable through the gate until their TODOs land. | developer_frontend (module TODOs) | No | Deferred | Documented default: each module TODO adds its navigation item, routes-meta keys and router access. |
| TDR-007-OQ2 | D16 focus to the page heading after a route change is not implemented (carried from TDR-006-OQ3). | Keyboard and screen reader users land at the top of the page after navigation. | Accessibility gap against D16. | developer_frontend (module TODOs) | No | Deferred | Documented default: each page TODO moves focus to its heading. |
| TDR-007-OQ3 | `me` has no role label, so nav-user shows the role key. | The role is shown as a raw key until copy is set. | Display only. | developer_frontend; product (FE-OQ-22) | No | Deferred | Documented default: show the role key; copy is set under FE-OQ-22. |
| TDR-007-OQ4 | The dialogs API changed: `confirm(request)` replaces `open(req)`. Removed request kinds must be recreated by the module TODOs that need them. | 15 legacy call sites in `src/pages/` no longer typecheck (see Checks, C5). | Legacy pages do not typecheck until TODO-017 (PM-RK-01). | developer_frontend (TODO-017; module TODOs) | No | Deferred | Documented default: the legacy call sites are removed in TODO-017 (PM-RK-01). |
| TDR-007-OQ5 | The Landing component is not rendered in a test. Its decision (show or hide the neutral message) is covered through `hasVisibleModule`. | A render regression in `landing-page.tsx` would not be caught. | Low. | developer_frontend | No | Deferred | Documented default: accepted. The decision is tested in `navigation.test.ts`. |
| TDR-007-OQ6 | The Node version for the team is open (carried from TDR-006-OQ6). This run used Node v26.4.0. | Results may differ on other Node versions. | Machine-dependent results. | user (decision); project_manager (record) | No | Open | Not decided. No default set here. |
| TDR-007-OQ7 | The "/" route is handled in `App.tsx` until the dashboard TODO. | Root-path behavior lives outside the router until then. | Limited to the root path. | developer_frontend (dashboard TODO) | No | Answered | User decision 2026-10-11: handled in `App.tsx` until the dashboard TODO. |
| TDR-007-OQ8 | `src/lib/notify.ts` has no test. The reference line "Kode referensi: <id>" (D13) is not asserted in any test, and `notifyError` is not tested. This was not in the Gate. | A regression in the reference id shown on errors would not be caught. | Added by this run. The Completion Checklist item "tests exist for the implemented behavior" is not fully met for this file. | developer_frontend; orchestrator (decides where the test lands) | No | Open | Documented default: accepted for TODO-007 (not in the Gate). The orchestrator decides whether a `notify` test is added before TODO-007 is marked Completed or in a later TODO. |
| TDR-007-OQ9 | The forced-change logout control is not tested. TDR-006-OQ10 defaulted to a TODO-007 test that the visible logout control is shown and works in `passwordChangeRequired`. No TODO-007 test sets that status for `NavUser`; the dialogs logout test uses the `authenticated` status. | REQ-FE-012 requires logout while a change is required. `App.tsx` renders the authenticated layout for both statuses and `NavUser` is in the sidebar footer, so the control is present but not asserted. | A regression that hides the visible logout control in the forced-change status would not be caught. The TDR-006-OQ10 default is not met. | developer_frontend; orchestrator (decides where the test lands) | No | Open | Documented default: none set here. Candidate: add the test to the forced-change work in TODO-008, or before TODO-007 is marked Completed. The orchestrator decides. |
| TDR-007-OQ10 | `app-sidebar.tsx`, `command-palette.tsx`, `site-header.tsx`, both layouts and `App.tsx` are not rendered in a unit test. Their gate behavior is covered by the navigation config tests and the drift test. | A render regression in the shell (a missing item or a broken breadcrumb) would not be caught by unit tests. | Shell render relies on the drift test and on QA end-to-end tests (TODO-018). | developer_frontend | No | Deferred | Documented default: accepted for TODO-007. Sidebar badges come in TODO-016 and need a render test then. |

Carried from TODO-006 (non-blocking, unchanged): TDR-006-OQ2 (`use-search-state.ts` has no unit test), TDR-006-OQ7 (`matchRoute` in `router.tsx` is private and untested), TDR-006-OQ8 (`route-error-boundary.tsx` has no unit test), and TDR-004-OQ4 (coverage not measured). Carried from TDR-005-OQ1 to OQ8 (non-blocking).

Blocking open questions: 0.
