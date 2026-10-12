---
id: UNIT-TEST-REPORT-TODO-006
title: Unit Test Report — TODO-006 Routing foundation and access gates
owner: unit_test_writer
status: Pending Approval
version: 1.1
last_updated: 2026-10-11 20:11
related_todo: TODO-006
execution_overall: PASS
source_requirements: [REQ-FE-012, REQ-FE-018, REQ-FE-019, REQ-FE-045]
related_artifacts: [TODO-006, ADR-001, ADR-004, ARCH-FE-001, UNIT-TEST-REPORT-TODO-005, FP-027]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-006 Routing foundation and access gates
Owner: unit_test_writer
Status: Pending Approval
Version: 1.1
Last Updated: 2026-10-11 20:11
Source Requirements: REQ-FE-012, REQ-FE-018, REQ-FE-019, REQ-FE-045
Related Artifacts:
- output/plans/master-todo.md (TODO-006, Gate; scope amendment 2026-10-11)
- output/plans/file-provenance-register.md (FP-027 auth-provider.test.tsx; FP-033 to FP-042)
- output/architecture/ARCH-FE-001.md v1.0 (D4.2, D4.8, D6.1, D6.2, D6.5, D10, D13, D16)
- output/reports/unit-test-report-TODO-005.md (format reference; logout tests)

## At a Glance

- Overall PASS on the re-run. `npx vitest run` exited 0 on both runs: 9 files, 169 of 169 tests passed, identical sorted test-name sets.
- GATE-11 (logout reachable while `passwordChangeRequired` is true) now has a named test that passes: "GATE-11: logout is reachable while passwordChangeRequired is true" in `src/app/providers/auth-provider.test.tsx`. All 13 Gate items are covered.
- ESLint on the 11 TODO-006 files (the 10 File-scope files plus the amended test file): 0 errors, 0 warnings. Two known pre-existing errors remain in untouched files (`src/hooks/use-mobile.ts`, `src/hooks/use-pagination.ts`).
- `tsc -p tsconfig.app.json`: only the 2 known legacy errors in `src/pages/tenant-create.tsx` (lines 514 and 519). None in TODO-006 scope.
- Status: Pending Approval. Blocking open questions: 0 (TDR-006-OQ9 answered by the 2026-10-11 scope amendment). Failure handoff clears; the TODO-006 status change and the provenance update belong to the orchestrator and project-manager.

## Purpose

Record the re-run of Checkpoint C for TODO-006 after the GATE-11 fix. The previous run (2026-10-11 20:00 to 20:02) read FAIL because one Gate item had no named test. This run confirms that test, re-runs the suite and the static checks, and re-maps every Gate item to named tests.

## Scope

In scope: the TODO-006 File scope test files and the code they test, plus the test-only amendment file added to scope on 2026-10-11.
- `src/lib/access/gates.ts` and `gates.test.ts`; `src/lib/access/roles.ts` (used by the tests; no test of its own).
- `src/app/guards/route-guard.tsx` and `route-guard.test.tsx`.
- `src/components/custom/status-screens.tsx` (rendered and checked through the guard tests).
- `src/app/router.tsx` (checked by reading; its path-to-route mapping is private and untested, see TDR-006-OQ7).
- `src/app/providers/auth-provider.test.tsx` (amendment 2026-10-11, test-only; GATE-11 logout test; the provider code it exercises is TODO-005 scope and was not changed).
- `src/app/guards/route-error-boundary.tsx`, `src/hooks/use-search-state.ts`, `src/lib/routes-meta.ts`: no unit tests in this TODO (see Open Questions).

The suite run covers all 9 test files under `src/`: the 44 TODO-006 tests (43 from the first run plus GATE-11) and the 125 tests from TODO-004 and TODO-005. The TODO-004 and TODO-005 tests were re-run, not re-reviewed.

Out of scope:
- Production code, test code and configuration: not changed by this run.
- Logout control in the UI and nav-user (TODO-007); boot and auth provider behavior (TODO-005); end-to-end tests (TODO-018).

Checks run:
1. `npx vitest run --reporter=verbose` twice: exit codes, totals, per-file counts, and a comparison of the sorted test-name lists.
2. Gate mapping: each Gate item matched to named tests. The assertions were read in `auth-provider.test.tsx` (GATE-11). The redirect and gate assertions were re-checked by grep in `route-guard.test.tsx`; the files are unchanged since the previous run (mtime check).
3. `npx eslint src/app src/lib src/hooks src/components/custom vitest.config.ts -f json`, errors by file, a check that all 11 TODO-006 files were linted, and a check that the two error files are unchanged against HEAD.
4. `npx tsc -p tsconfig.app.json --noEmit`, errors grouped by path.

Environment: darwin (arm64), Node v26.4.0, npm 11.17.0, Vitest 5.0.3. The default test environment is `node` (`vitest.config.ts`). `route-guard.test.tsx` and `auth-provider.test.tsx` run under jsdom by per-file comment.

## References

- `output/plans/master-todo.md` -> TODO-006 (Description, File scope incl. the 2026-10-11 amendment, Notes, Gate)
- `output/plans/file-provenance-register.md` -> FP-027 (`auth-provider.test.tsx`, "test added for GATE-11")
- `output/architecture/ARCH-FE-001.md` v1.0 (D4.2, D4.8, D6.1, D6.2, D6.5, D10, D13, D16)
- `output/reports/unit-test-report-TODO-005.md` (format reference; logout tests; carried items)
- `output/reports/unit-test-report-TODO-006.md` version 1.0 (FAIL, 2026-10-11 20:02; superseded by this version)
- `src/lib/access/gates.ts` (doc comment on the D6.1 reading of `authenticated`; TDR-006-OQ4)

## Retry History

| Run | Time (local) | Result | Notes |
|-----|--------------|--------|-------|
| 1 | 2026-10-11 20:00 to 20:02 | FAIL (Path A, obvious) | 168 of 168 passed. GATE-11 had no named test. Failure handoff set. |
| Fix | 2026-10-11 20:08 (test file written) | Test added in `auth-provider.test.tsx` | Scope amendment in master-todo 2026-10-11; user decision (option A for TDR-006-OQ9). Provenance row FP-027 updated. No production code changed. |
| 2 (this run) | 2026-10-11 20:10 | PASS | 169 of 169 passed on both runs. Exit 0 on both. GATE-11 passes. |

## Test Cases

### TODO-006 Gate coverage

Names are as printed by the verbose run (full names in the files).

| # | Gate item | Covering test(s) | Result |
|---|-----------|------------------|--------|
| 1 | Gate truth table: Authenticated alone (D6.1) | `gates.test.ts` > authenticated gate (D6.1): "status authenticated gives ALLOW", "status passwordChangeRequired gives ALLOW", "status anonymous gives LOGIN", "status unknown gives LOGIN", "status error gives LOGIN" (5) | Covered |
| 2 | Gate truth table: PasswordChanged alone (D6.1) | `gates.test.ts` > passwordChanged gate (D6.1): "allows when no change is required", "denies with PASSWORD_CHANGE when a change is required", "fails closed to LOGIN without a loaded me" (3) | Covered |
| 3 | Gate truth table: HasPermissions alone (D6.1) | `gates.test.ts` > hasPermissions gate (D6.1): "required keys ["system_users:view"] give ALLOW", "required keys ["system_users:view","system_roles:view"] give ALLOW", "required keys ["system_users:view","sessions:revoke"] give FORBIDDEN", "required keys ["sessions:revoke"] give FORBIDDEN", "required keys [] give ALLOW", "fails closed to LOGIN without a loaded me" (6) | Covered |
| 4 | Gate truth table: HasRole alone (D6.2) | `gates.test.ts` > hasRole gate (D6.2): "allows the matching role", "denies another system role with FORBIDDEN", "fails closed to LOGIN without a loaded me" (3) | Covered |
| 5 | Gate truth table: AND combinations (D6.1, D6) | `gates.test.ts` > AND combinations (D6.1), 11 tests: "no gates allow any state", "session with no change pending", "anonymous stops at Authenticated", "change pending gives PASSWORD_CHANGE", "forced-change status gives PASSWORD_CHANGE", "exempt route (Authenticated only) allows a forced-change status", "permission present and role matches", "role mismatch gives FORBIDDEN", "missing permission gives FORBIDDEN", "anonymous with a missing permission gives LOGIN, not FORBIDDEN", "first deny wins: FORBIDDEN before PASSWORD_CHANGE" | Covered |
| 6 | Redirect table: LOGIN to `/login` | `route-guard.test.tsx` > route guard redirect table (D6.1, D10, REQ-FE-012): "anonymous on a protected route goes to LOGIN". Asserts `onRedirect` is called with `LOGIN_PATH` (`/login`) and the page is not shown. | Covered |
| 7 | Redirect table: PASSWORD_CHANGE to `/account/password` | "session with a change pending goes to PASSWORD_CHANGE"; "forced change blocks a public route"; "forced change blocks a protected route"; "an unknown path during a forced change redirects". Each asserts `onRedirect` with `PASSWORD_CHANGE_PATH`. | Covered |
| 8 | Redirect table: FORBIDDEN to the 403 screen | "session without the permission gets the 403 screen". Asserts the heading "Akses ditolak" and no redirect. | Covered |
| 9 | Redirect table: allowed routes render | "session with the permission renders"; "anonymous on a public route renders"; "a voluntary change page renders for a session". Asserts the page is shown and no redirect. | Covered |
| 10 | passwordChangeRequired: only `/account/password` is reachable (REQ-FE-012) | "forced change allows the change page" (the exempt page renders). Blocking of other routes: rows 7 and "an unknown path during a forced change redirects". | Covered |
| 11 | passwordChangeRequired: logout is reachable (REQ-FE-012) | `auth-provider.test.tsx` > logout (D4.8): "GATE-11: logout is reachable while passwordChangeRequired is true". Starts with `/auth/me` returning `pwdChangeRequired: true` (status `passwordChangeRequired`), clicks the logout control, then asserts: status becomes `anonymous`; `POST /auth/logout` is called exactly once; the access token is null; one `{ type: "logout" }` message is broadcast on `sp-session`. | Covered (added 2026-10-11) |
| 12 | Unknown paths show 404 | "an unknown path gets the 404 screen for a session"; "an unknown path gets the 404 screen for anonymous". Both pass `access = null` into the guard. The URL-to-route step is not tested (TDR-006-OQ7). | Covered |
| 13 | Boot states (D4.2, D13) | "boot in progress shows the loading state, not a redirect"; "boot failure shows the unavailable screen, not the login page"; "offers retry on the unavailable screen after a boot error" (calls `retryBoot` once). | Covered |

All 13 Gate items have a named test that asserts the outcome. No Gate item is missing.

Scope note on row 11: the GATE-11 test exercises the auth provider's logout action in the `passwordChangeRequired` status, through a test harness control named "log out". The visible logout control in the layout is built in TODO-007 (nav-user) and is not tested here (TDR-006-OQ10).

### Test count by file

| File | Tests | Breakdown | New in TODO-006 |
|------|-------|-----------|-----------------|
| `src/lib/access/gates.test.ts` | 28 | authenticated 5; passwordChanged 3; hasPermissions 6; hasRole 3; AND combinations 11 | Yes |
| `src/app/guards/route-guard.test.tsx` | 15 | redirect table, boot and retry tests, all under the describe "route guard redirect table (D6.1, D10, REQ-FE-012)" | Yes |
| `src/lib/query/invalidation.test.ts` | 35 | invalidation plan 18; invalidation against a real cache 17 | No |
| `src/lib/api/client.test.ts` | 33 | request construction 8; refresh policy 13; response handling 6; forbidden headers 5; development logging 1 | No |
| `src/lib/api/modules/auth.test.ts` | 20 | login 3; getMe 3; refreshSession 2; logout 3; changePassword 5; forgotPassword and resetPassword 4 | No |
| `src/app/providers/auth-provider.test.tsx` | 12 | boot 5; login 1; password change outcomes 2; logout 4 (incl. GATE-11) | GATE-11 only (amendment 2026-10-11) |
| `src/lib/api/modules/sessions.test.ts` | 9 | own sessions 5; sessions of another user 4 | No |
| `src/lib/api/refresh.test.ts` | 9 | refreshAccessToken single-flight 5; refresh outcomes 4 | No |
| `src/lib/api/errors.test.ts` | 8 | ApiError 1; httpError 3; client-side error kinds 3; isUnauthorized 1 | No |
| Total | 169 | 125 from TODO-004 and TODO-005 + 44 new (43 in gates and route guard, 1 GATE-11) | 44 new |

### Gate checks (G1 to G5)

| ID | Check | Command | Expected | Result |
|----|-------|---------|----------|--------|
| G1 | Vitest, run 1 | `npx vitest run --reporter=verbose` | Exit 0 | PASS. Exit 0. 9 files passed, 169 tests passed. |
| G2 | Vitest, run 2 (determinism) | `npx vitest run --reporter=verbose` | Exit 0, same totals and names | PASS. Exit 0. 9 files passed, 169 tests passed. Sorted test-name lists from runs 1 and 2 are identical (169 lines each). File blocks printed in a different order (parallel workers); no test name differs. |
| G3 | ESLint, TODO-006 files | `npx eslint src/app src/lib src/hooks src/components/custom vitest.config.ts` | 0 errors in TODO-006 files | PASS. All 11 TODO-006 files linted: 0 errors, 0 warnings. The command exits 1 because of 2 errors in untouched files (table below). |
| G4 | Typecheck by path | `npx tsc -p tsconfig.app.json --noEmit` | Only the legacy errors; none in TODO-006 scope | PASS. Exit 2, 2 errors, both TS2375 in `src/pages/tenant-create.tsx` (line 514 and line 519). 0 in TODO-006 scope. |
| G5 | Gate items covered by named tests | Read of test names and bodies | Every Gate item has a named test that asserts it | PASS. 13 of 13 Gate items covered. GATE-11 now has a named, asserting test. |

ESLint result by file:

| Path | Errors | Warnings | Attribution |
|------|--------|----------|-------------|
| 11 TODO-006 files (`src/app/router.tsx`, `src/app/guards/route-guard.tsx`, `src/app/guards/route-guard.test.tsx`, `src/app/guards/route-error-boundary.tsx`, `src/components/custom/status-screens.tsx`, `src/hooks/use-search-state.ts`, `src/lib/access/gates.ts`, `src/lib/access/gates.test.ts`, `src/lib/access/roles.ts`, `src/lib/routes-meta.ts`, `src/app/providers/auth-provider.test.tsx`) | 0 | 0 | TODO-006 scope: clean |
| `src/hooks/use-mobile.ts:14:5` | 1 | 0 | `react-hooks/set-state-in-effect`. Unmodified against HEAD (`git diff HEAD` empty). Pre-existing; not attributable to TODO-006. |
| `src/hooks/use-pagination.ts:24:27` | 1 | 0 | `react-hooks/set-state-in-effect`. Unmodified against HEAD (`git diff HEAD` empty). Pre-existing; not attributable to TODO-006. |

Total: 32 files linted, 2 errors, 0 warnings. Both errors are in files outside this TODO's File scope.

TypeScript result by path:

| Path | Errors | Codes | Attribution |
|------|--------|-------|-------------|
| `src/pages/tenant-create.tsx` line 514 | 1 | TS2375 | Legacy mock file (PM-RK-02). Known. |
| `src/pages/tenant-create.tsx` line 519 | 1 | TS2375 | Legacy mock file (PM-RK-02). Known. |
| TODO-006 files | 0 | — | Clean |

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npx vitest run --reporter=verbose` (run 1 and run 2) |
| Run at | 2026-10-11 20:10 (run 1 started 20:10:07; run 2 started 20:10:09, local time) |
| Total | 169 |
| Passed | 169 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Notes on the run:
- Exit codes: run 1 = 0; run 2 = 0. Vitest summary on both runs: 9 files passed, 169 tests passed.
- Sorted test-name lists from both runs are identical (169 lines each).
- Node prints an ExperimentalWarning about `localStorage` in each worker. It is a Node runtime notice, not a test result.
- Node version for the team stays open (TDR-006-OQ6).

## Execution Results

169 tests passed in 9 files on two identical runs (exit 0 both); GATE-11 passes; no test failed.

## Handoff

Not required on PASS. The orchestrator clears `failure_handoff` for TODO-006 and records the gate outcome. The TODO-006 status change (In Progress to Completed) and the provenance check are the orchestrator's and project-manager's decisions; this report does not change them. FP-027 already records the amended test file.

## Coverage

Not measured. `node_modules/@vitest` contains only `mocker` and `spy`, so no coverage provider is installed, and the 80% guideline is not evaluated for TODO-006. Carried as TDR-004-OQ4.

## Edge Cases

Covered (by the named tests above):
- Null and absent: `me` null fails closed to LOGIN in the passwordChanged, hasPermissions and hasRole gates; a null route (unknown path) renders the 404 screen for a session and for anonymous; boot states `unknown` and `error` never redirect.
- Empty: an empty permission list allows.
- Boundary: one missing key out of two gives FORBIDDEN; FORBIDDEN outranks PASSWORD_CHANGE (first deny wins).
- Invalid: a role mismatch (`SYS_SUPPORT`) gives FORBIDDEN; anonymous with a missing permission gives LOGIN, not FORBIDDEN.
- Failure: a boot error shows the unavailable screen, and retry calls `retryBoot` once; a forced change blocks public and protected routes; an unknown path during a forced change redirects.
- Logout from a forced-change status: ends the session, clears the token and broadcasts the logout (GATE-11).

Not exercised (see Open Questions):
- The visible logout control in the layout while `passwordChangeRequired` is true (TDR-006-OQ10; TODO-007).
- The URL-to-route step (`matchRoute` in `router.tsx` is private; TDR-006-OQ7).
- Behavior of `route-error-boundary.tsx` (TDR-006-OQ8).
- Focus after a route change (D16 is not implemented in TODO-006 files; TDR-006-OQ3).

Idempotency (checklist item): not applicable. TODO-006 makes no API calls and no writes in its gates or guard. The gates are pure functions and the guard only renders or redirects. The GATE-11 test issues one logout POST under mock and asserts a single call.

## Mocking Strategy

- `gates.test.ts`: pure functions with fixed fixtures (`ME` with `role: SYS_PRINCIPAL`). No mocks. Default `node` environment.
- `route-guard.test.tsx`: jsdom by per-file comment (OQ-P-01). `vi.mock("@/app/providers/auth-provider", ...)` replaces `useAuth` with a `vi.fn()` that returns a fixed context per test (status, me, retryBoot). `onRedirect` is a `vi.fn()`. React Testing Library `render`, with `cleanup` in `afterEach`. No MSW: the guard makes no requests. No fake timers.
- `auth-provider.test.tsx` (GATE-11): jsdom by per-file comment. MSW (`server.use`) overrides `GET /auth/me` to return `pwdChangeRequired: true`; a call counter wraps `POST /auth/logout`; a `BroadcastChannel("sp-session")` observer records announcements and is closed in `finally`. The test uses the existing provider harness and does not change the provider.
- Consequence: the guard tests do not run the real `AuthProvider`. The real status transitions (boot, forced change, logout) are covered in `auth-provider.test.tsx`.
- Determinism: the sorted test-name lists from both runs are identical. Each test renders fresh and gets a fresh mock. No shared state between tests.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| TDR-006-OQ1 | (a) The `/` route is missing. `matchRoute("/")` returns null, so the root shows the 404 screen. | Users who open the app root see a 404. | Visible until the home route exists. | developer_frontend (TODO-007 landing page; TODO-016) | No | Deferred | Documented default: the root shows 404 until TODO-007 or TODO-016 adds the route. |
| TDR-006-OQ2 | (b) `use-search-state.ts` has no unit test. It is not in the Gate. | Search state drives filters and paging on list pages. | Untested until its first consumer. | developer_frontend | No | Deferred | Documented default: verify in TODO-010. |
| TDR-006-OQ3 | (c) D16 focus to the page heading after a route change is not implemented. No focus code exists in `router.tsx`, `route-guard.tsx`, `status-screens.tsx` or `use-search-state.ts`. | Keyboard and screen reader users land at the top of the page after navigation. | Accessibility gap against D16. | developer_frontend | No | Deferred | Documented default: implement in TODO-007 or in each page TODO. |
| TDR-006-OQ4 | (d) D6.1 interpretation. The `authenticated` gate allows status `passwordChangeRequired`, so REQ-FE-012 reaches the change page through `passwordChanged`. D6.1 names only the `authenticated` status. | Decides which pages a forced-change session can reach. | If the reading is wrong, a forced-change session cannot reach the change page, or it reaches the login page. | architect_frontend (confirm) | No | Open | Documented default: the reading is kept (`gates.ts` doc comment; this report). Covered by `gates.test.ts` "status passwordChangeRequired gives ALLOW". |
| TDR-006-OQ5 | (e) The legacy `routes-meta.ts` keys are kept until TODO-007. | Breadcrumbs and titles read these keys. | Legacy keys remain in the file until TODO-007. | developer_frontend (TODO-007) | No | Answered | User decision 2026-10-11: keep the legacy keys until TODO-007. |
| TDR-006-OQ6 | (f) The Node version for the team is still open. This run used Node v26.4.0. | Results may differ on other Node versions. | Machine-dependent results. | user (decision); project_manager (record) | No | Open | Not decided. No default set here. |
| TDR-006-OQ7 | The path-to-route mapping (`matchRoute` in `router.tsx`) is private and has no direct test. The 404 tests pass `access = null` straight into `RouteGuard`. | An unknown URL reaching the 404 screen through `AppRouter` is not exercised. | A regression in the mapping (for example in trailing-slash handling) would not be caught. | developer_frontend | No | Open | Documented default: accepted for TODO-006. Candidate test: `AppRouter` under jsdom with `history.pushState`, in TODO-007 or TODO-016. |
| TDR-006-OQ8 | `route-error-boundary.tsx` (TODO-006 File scope) has no unit test. It is not named in the Gate. | The per-route boundary catches route render errors (D10). | Its fallback and reset path are untested. | developer_frontend | No | Open | Documented default: accepted for TODO-006. Add a boundary test in TODO-006 or TODO-010. |
| TDR-006-OQ9 | Where does the test for "logout reachable while `passwordChangeRequired` is true" live? | REQ-FE-012 names logout as reachable, and the Gate needs test evidence for it. | Blocked the TODO-006 gate in run 1. | orchestrator (decides scope); developer_frontend (writes the test) | No | Answered | User decision 2026-10-11: option A. Test-only addition in `auth-provider.test.tsx`, recorded as a TODO-006 scope amendment in master-todo and as FP-027. Covered by GATE-11 (PASS in this run). |
| TDR-006-OQ10 | The visible logout control while `passwordChangeRequired` is true (the layout and nav-user) is not built yet and is not tested in TODO-006. | The Gate test covers the provider logout action. The user-facing control arrives with nav-user. | A regression in the visible control would not be caught by TODO-006 tests. | developer_frontend (TODO-007) | No | Deferred | Documented default: TODO-007 adds a gate test that the logout control is shown and works in the `passwordChangeRequired` status. |

Carried unchanged from TODO-005 (non-blocking): TDR-005-OQ1 to TDR-005-OQ8, and TDR-004-OQ4 (coverage not measured).

Blocking open questions: 0.
