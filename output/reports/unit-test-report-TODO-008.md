---
id: UNIT-TEST-REPORT-TODO-008
title: Unit Test Report — TODO-008 Auth screens and shared form pieces
owner: unit_test_writer
status: Pending Approval
version: 1.1
last_updated: 2026-10-11 23:26
related_todo: TODO-008
execution_overall: PASS
source_requirements: [REQ-FE-008, REQ-FE-009, REQ-FE-012, REQ-FE-013, REQ-FE-014, REQ-FE-015, REQ-FE-017, REQ-FE-036, REQ-FE-045, REQ-FE-049]
related_artifacts: [TODO-008, UNIT-TEST-REPORT-TODO-007, RCA-TODO-008, ARCH-FE-001, ADR-003, ADR-004, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-008 Auth screens and shared form pieces
Owner: unit_test_writer
Status: Pending Approval
Version: 1.1
Last Updated: 2026-10-11 23:26
Source Requirements: REQ-FE-008, REQ-FE-009, REQ-FE-012, REQ-FE-013, REQ-FE-014, REQ-FE-015, REQ-FE-017, REQ-FE-036, REQ-FE-045, REQ-FE-049
Related Artifacts:
- output/plans/master-todo.md (TODO-008, File scope, Notes, Gate)
- output/reports/unit-test-report-TODO-007.md (format reference)
- output/reports/rca-report-TODO-008.md (RCA for the first FAIL; fix proposed in section 7)
- ARCH-FE-001 v1.0 (D4.4, D4.5, D4.6, D4.7, D4.9, D5.4, D19)

## At a Glance

- Overall PASS. Three full runs of `npx vitest run` exited 0, each with 19 files and 248 tests passed. The outcome of every test is identical across the three runs.
- The D4.4 test in `change-password-page.test.tsx` passed in all three full runs and in 10 of 10 isolated runs of that file. The wait fix is in place: the heading wait in `openChangePage` carries `{ timeout: 5000 }` (lines 60-64).
- All 8 Gate items (G-1 to G-8) have named, asserting tests.
- ESLint: 0 errors and 0 warnings on the 28 TODO-008 files. Vite build: exit 0. Typecheck: 17 errors, all in the known legacy set in `src/pages/`; none in TODO-008 files.
- Status: Pending Approval. TODO-008 stays `In Progress` (this run did not change the TODO, the progress tracker, the RCA or the orchestration state). The orchestrator clears `failure_handoff` on PASS.
- Not run in this re-run: the parallel-load stress check from RCA section 8 (check 3). It is recorded as TDR-008-OQ10; run it before TODO-008 is marked Completed if fresh load evidence is wanted.

## Purpose

Record the Checkpoint C re-run for TODO-008 after the failure retry. Re-run the full suite, the isolated loop of the timing-sensitive file, the Gate coverage check and the static checks, and record the retry history.

## Retry History

| Attempt | Date (local) | Result | Basis |
|---------|--------------|--------|-------|
| 1 | 2026-10-11 22:54 (runs 1-2) | FAIL | Run 1: the D4.4 test in `change-password-page.test.tsx` timed out at the default 1000 ms `findByRole` budget in `openChangePage` (no assertion mismatch). Run 2 passed. Failure class `unclear`. Path B: debugger RCA `output/reports/rca-report-TODO-008.md` (last updated 2026-10-11 23:14). |
| Fix | Test file mtime 2026-10-11 23:23 | Applied by the implementer | `{ timeout: 5000 }` added to the heading wait in `openChangePage`. Test file only; no assertion, other wait or other test changed. The RCA (section 7) proposed a single-line call at line 58; the applied form is the same option in a multi-line call (lines 60-64, comments at 58-59). Same budget. |
| 2 (this run) | 2026-10-11 23:24 | PASS | Three full runs, 10-run isolated loop, Gate check, ESLint, vite build, tsc by path. |

## Scope

In scope: the TODO-008 File scope.
- `src/features/auth/` (pages, components, schema and tests), `src/lib/forms/zod-form.ts`, `src/components/custom/form-alert.tsx`, `src/hooks/use-client-paged-list.ts` and its test, `src/app/router.tsx` (auth routes), `src/test/handlers/auth.ts`, `vitest.config.ts` (DOM environment), `src/lib/routes-meta.ts` (`account.sessions` key, 2026-10-11 amendment).
- The vitest suite: 19 files and 248 tests. Eight files are new in TODO-008 (58 tests). Eleven files (190 tests) from TODO-004 to TODO-007 were re-run, not re-reviewed.

Out of scope: production code, test code and configuration (not changed by this run); the parallel-load stress check (TDR-008-OQ10); end-to-end tests (QA, TODO-018); TODO status changes (orchestrator).

## References

- `output/plans/master-todo.md` -> TODO-008 (Description, File scope, Notes, Gate)
- `output/reports/rca-report-TODO-008.md` (sections 5, 7 and 8)
- `src/features/auth/change-password-page.test.tsx` lines 55-65 (`openChangePage`, applied fix; D4.4 test at lines 80-96)
- `src/lib/routes-meta.ts` line 119 and `src/app/router.tsx` lines 86-88 (`account.sessions`)
- `.claude/rules/artifact-templates/artifact-templates-build.md` -> Unit Test Report
- Session scratchpad logs (not part of the repo): `rerun-vitest-run1.txt` to `rerun-vitest-run3.txt`, `rerun-cp-loop1.txt` to `rerun-cp-loop10.txt`, `rerun-eslint.txt`, `rerun-vite-build.txt`, `rerun-tsc.txt`

## Test Cases

### Gate coverage (master-todo TODO-008 Notes and Gate)

Names are as printed by the verbose run. "Runs 1-3" means the test passed in all three full runs of this re-run.

| # | Gate item | Covering test(s) (file > describe > test) | Result |
|---|-----------|-------------------------------------------|--------|
| G-1 | Login error texts (D4.5) | `src/features/auth/login-page.test.tsx` > "LoginPage error mapping (D4.5)" > "shows the credentials text, keeps the login ID and clears the password"; "shows the same text for an unknown user, whatever the server message says"; "shows the server message for an account that is not active"; "locks the submit button for 60 seconds with a countdown after a 429". Unit: `auth-messages.test.ts` > "classifyLoginError (D4.5)" (5 tests). | Covered (runs 1-3) |
| G-2 | A forced password change redirects to `/account/password` | `login-page.test.tsx` > "LoginPage request and redirects" > "sends a forced password change to /account/password" (asserts `window.location.pathname` is `/account/password`, line 186). Companion: `change-password-page.test.tsx` > "ChangePasswordPage outcomes (D4.6)" > "ends a forced change on the landing page and offers logout while it is required". | Covered (runs 1-3) |
| G-3 | Forgot-password neutral text (D4.7) | `src/features/auth/forgot-password-page.test.tsx` > "ForgotPasswordPage (D4.7)" > "shows the neutral text after a successful request and sends the login ID"; "shows the same neutral text for an unknown account"; "shows the same neutral text for a server failure". A validation error is an alert, not the neutral text: "shows a validation error as an alert, not as the neutral text". | Covered (runs 1-3) |
| G-4 | Reset with an invalid token (D4.7) | `src/features/auth/reset-password-page.test.tsx` > "ResetPasswordPage token handling (D4.7)" > "shows the invalid-link message and a link to forgot password when no token is given"; "shows the invalid-link message when the server rejects an expired token". | Covered (runs 1-3) |
| G-5 | The sessions list never offers revoke for the current session (D4.9) | `src/features/auth/sessions-page.test.tsx` > "SessionsPage (D4.9)" > "marks the current session with a badge and never offers revoke for it"; "disables revoke all when the current session is the only one". | Covered (runs 1-3) |
| G-6 | A 401 on change-password never refreshes (D4.4) | `src/features/auth/change-password-page.test.tsx` > "ChangePasswordPage errors (D4.6)" > "shows a wrong current password under its field and never refreshes (D4.4)" (asserts `refreshCalls` is unchanged, line 101; passed in runs 1-3 and in 10 of 10 isolated runs); "a 401 with another code still never refreshes". Unit: `auth-messages.test.ts` > "classifyChangePasswordError (D4.6)" > "does not treat another 401 as a wrong current password". | Covered (runs 1-3; isolated 10 of 10) |
| G-7 | MSW tests through the handlers | Five TODO-008 page test files import `server` from `@/test/server` or the handlers from `@/test/handlers/auth`: login, forgot password, reset password, change password and sessions page. Each test overrides endpoints per test with `server.use`. Examples: "sends only the login ID and the password, with no tenant field (D4.5)" (login); "keeps the submit control disabled while the request is in flight (SP-BG-11)" (reset). | Covered (runs 1-3) |
| G-8 | React Hook Form errors reach `aria-describedby` (D19) | `login-page.test.tsx` > "LoginPage error mapping (D4.5)" > "links the field message to its input through aria-describedby (D19)". Companions: `reset-password-page.test.tsx` > "shows a policy failure under the new password field"; `change-password-page.test.tsx` > "shows a policy failure under the new password field", and the D4.4 test asserts `toHaveAccessibleDescription` on the current password field. | Covered (runs 1-3) |

All 8 Gate items have a named, asserting test. No Gate item is missing.

### Amendment check (master-todo scope amendment 2026-10-11, routes-meta)

| # | Check | Evidence | Result |
|---|-------|----------|--------|
| A-1 | `account.sessions` routes-meta key exists and the router takes access from the navigation item | `src/lib/routes-meta.ts:119` defines the key. `src/app/router.tsx:86-88` maps `/account/sessions` with `access: navItemAt("/account/sessions").access`. Re-checked by grep in this run. | Present |
| A-2 | A test covers the key by name | No test names the routes-meta key. The TODO-007 drift test (`route-guard.test.tsx` > "navigation items and routes share one gate (ARCH-FE-001 D6.3)") passed in runs 1-3. | Indirect only (TDR-008-OQ7) |

### Test count by file

| File | Expected | Run 1 | Run 2 | Run 3 | New in TODO-008 |
|------|----------|-------|-------|-------|-----------------|
| `src/features/auth/schema.test.ts` | 9 | 9 | 9 | 9 | Yes |
| `src/features/auth/auth-messages.test.ts` | 13 | 13 | 13 | 13 | Yes |
| `src/features/auth/login-page.test.tsx` | 8 | 8 | 8 | 8 | Yes |
| `src/features/auth/forgot-password-page.test.tsx` | 4 | 4 | 4 | 4 | Yes |
| `src/features/auth/reset-password-page.test.tsx` | 5 | 5 | 5 | 5 | Yes |
| `src/features/auth/change-password-page.test.tsx` | 6 | 6 | 6 | 6 | Yes |
| `src/features/auth/sessions-page.test.tsx` | 4 | 4 | 4 | 4 | Yes |
| `src/hooks/use-client-paged-list.test.ts` | 9 | 9 | 9 | 9 | Yes |
| TODO-008 subtotal | 58 | 58 | 58 | 58 | 8 files |
| Re-run from TODO-004 to TODO-007 (11 files) | 190 | 190 | 190 | 190 | No |
| Total (19 files) | 248 | 248 | 248 | 248 | 8 files |

## Checks

| ID | Check | Command | Expected | Result |
|----|-------|---------|----------|--------|
| C1 | Vitest, full run 1 | `npx vitest run --reporter=verbose` | Exit 0; 19 files; 248 tests | PASS. Exit 0. 19 of 19 files; 248 of 248 tests. |
| C2 | Vitest, full run 2 | same | same | PASS. Exit 0. 19 of 19 files; 248 of 248 tests. |
| C3 | Vitest, full run 3 | same | same | PASS. Exit 0. 19 of 19 files; 248 of 248 tests. |
| C4 | Determinism (runs 1, 2, 3) | Compare the sorted per-test outcome lines of the three verbose outputs | Identical outcomes and names | PASS. The 248 outcome lines are identical in runs 1, 2 and 3. No failed marks in any run. |
| C5 | Per-file counts | Verbose output of runs 1-3 | schema 9, auth-messages 13, login 8, forgot 4, reset 5, change-password 6, sessions-page 4, use-client-paged-list 9 | PASS. All eight match in each run. |
| C6 | Isolated loop, change-password file | `npx vitest run src/features/auth/change-password-page.test.tsx`, ten times | 10 of 10 exit 0; "6 passed" each | PASS. 10 of 10 exit 0; "Tests 6 passed (6)" each. Ran after the full runs (about 23:24). |
| C7 | Gate coverage | Read of test names and bodies; grep of MSW imports | Every Gate item has a named, asserting test | PASS. 8 of 8 items. MSW imports confirmed in 5 page test files. |
| C8 | ESLint, TODO-008 scope | `npx eslint` on the TODO-008 scope (21 files under `src/features/auth/` and `src/lib/forms/`, plus `src/components/custom/form-alert.tsx`, `src/hooks/use-client-paged-list.ts` and its test, `src/test/handlers/auth.ts`, `src/app/router.tsx`, `src/lib/routes-meta.ts`, `vitest.config.ts`; 28 files) | Exit 0; 0 errors in TODO-008 files | PASS. Exit 0. No output (0 errors, 0 warnings). |
| C9 | Production build | `npx vite build --outDir <scratchpad>/dist-todo008-rerun` | Exit 0 | PASS. Exit 0; "built in 559 ms". One chunk-size notice (warning, not an error). Output in the session scratchpad, not the repo. |
| C10 | Typecheck by path | `npx tsc -p tsconfig.app.json --noEmit --pretty false` | 0 errors in TODO-008 files; only the legacy set | PASS by path. Exit 2 with 17 errors, all in `src/pages/`. 0 in TODO-008 files. The set is the same as the previous run and the TODO-007 legacy set (table below). |
| C11 | Parallel-load stress (RCA section 8, check 3) | Three full suites in parallel, five rounds (15 runs) | Not part of this re-run's brief | NOT RUN in this re-run. RCA evidence R6 (15 of 15 passing with the same 5000 ms budget under parallel load) stands. See TDR-008-OQ10. |

Typecheck result by path (17 errors, all in `src/pages/`; the same set as the previous run):

| Path | Line | Code | Cause |
|------|------|------|-------|
| `src/pages/katalog-kategori.tsx` | 37, 40 | TS2339, TS7006 | Removed `dialogs.open` call (PM-RK-01) |
| `src/pages/katalog-negara.tsx` | 37, 40 | TS2339, TS7006 | Removed `dialogs.open` call (PM-RK-01) |
| `src/pages/katalog-permission.tsx` | 56 | TS2339 | Removed `dialogs.open` call (PM-RK-01) |
| `src/pages/sistem-sesi.tsx` | 102 | TS2339 | Removed `dialogs.open` call (PM-RK-01) |
| `src/pages/tenant-create.tsx` | 113 | TS2339 | Removed `dialogs.open` call (PM-RK-01) |
| `src/pages/tenant-create.tsx` | 514, 519 | TS2375 | Pre-existing: `hint` typed string or undefined under `exactOptionalPropertyTypes` (PM-RK-02) |
| `src/pages/tenant-detail.tsx` | 134, 149, 159, 370 | TS2339 | Removed `dialogs.open` call (PM-RK-01) |
| `src/pages/tenant-list.tsx` | 194 | TS2339 | Removed `dialogs.open` call (PM-RK-01) |
| `src/pages/tim-akun.tsx` | 129 | TS2339 | Removed `dialogs.open` call (PM-RK-01) |
| `src/pages/tim-peran.tsx` | 104, 107 | TS2339, TS7006 | Removed `dialogs.open` call (PM-RK-01) |

Count: 12 TS2339 + 3 TS7006 = 15 from removed `open` call sites (PM-RK-01, to be removed in TODO-017); 2 TS2375 pre-existing in `tenant-create.tsx` (PM-RK-02). Total 17. No error in any TODO-008 file.

## Execution Summary

| Metric | Run 1 | Run 2 | Run 3 |
|--------|-------|-------|-------|
| Command | `npx vitest run --reporter=verbose` | same | same |
| Run at (local) | 2026-10-11 23:24:13 | 2026-10-11 23:24:17 | 2026-10-11 23:24:21 |
| Exit code | 0 | 0 | 0 |
| Test files (total / passed / failed) | 19 / 19 / 0 | 19 / 19 / 0 | 19 / 19 / 0 |
| Total tests | 248 | 248 | 248 |
| Passed | 248 | 248 | 248 |
| Failed | 0 | 0 | 0 |
| Errors | 0 | 0 | 0 |
| Skipped | 0 | 0 | 0 |
| Overall | PASS | PASS | PASS |

Isolated loop (`src/features/auth/change-password-page.test.tsx`, ten runs, after the full runs): 10 of 10 exit 0; each run "Tests 6 passed (6)". Overall: PASS.

Environment: Node v26.4.0; vitest 5.0.3; darwin-arm64.

Notes on the runs:
- No `.skip`, `.only` or `.todo` markers were found in the TODO-008 test files in the previous run; this run did not change any test file.
- The verbose output of the three full runs contains no "unhandled" error line and no MSW "unhandled request" warning.

## Execution Results

248 of 248 tests passed in each of the three full runs (19 of 19 files). The change-password file passed 6 of 6 in each of 10 isolated runs. No failures.

## Handoff

Not applicable (PASS). The orchestrator may clear `failure_handoff` for TODO-008 (agent-orchestration, test failure handoff). TODO-008 is not set to `Completed` by this report; the orchestrator sets the TODO status when the gate clears.

## Coverage

Not measured. `node_modules/@vitest` contains only `mocker` and `spy`, so no coverage provider is installed and the 80% guideline is not evaluated for TODO-008. Carried as TDR-004-OQ4.

## Edge Cases

Covered (by the named tests above):
- Null and absent: no reset token shows the invalid-link message and hides the form ("shows the invalid-link message and a link to forgot password when no token is given"). The null-session case belongs to TODO-007 and is not repeated here.
- Empty: blank login ID and blank password are rejected ("rejects a blank login ID and a blank password"); blank login ID on forgot password ("rejects a blank login ID"); revoke all is disabled when the current session is the only one.
- Boundary: the 60-second submit lock after a 429 ("locks the submit button for 60 seconds with a countdown after a 429"); both rate-limit codes start the lock ("starts the lock for both rate-limit codes"); pagination clamps a page past the end ("cuts one page and clamps a page past the end to the last page"), reports zero indexes when nothing matches, and treats a non-numeric page as page 1.
- Invalid: a confirmation that differs from the new password is rejected (reset and change schemas); a missing current password is rejected; an expired reset token ("shows the invalid-link message when the server rejects an expired token"); another 401 is not a wrong current password.
- Failure: server failure on forgot password shows the neutral text; an unmapped server error shows generic copy and the reference id ("shows generic copy and the reference id for an unmapped server error"); a network failure shows client copy ("shows the client copy for a network failure"); the server text of an HTTP error is never shown ("never shows the server text of an HTTP error"); the reset submit is disabled while in flight (SP-BG-11); a policy failure is placed under the new password field.

Idempotency (checklist item): not applicable as a retry path. TODO-008 specifies no retried or redelivered writes with an idempotency key. The reset submit has an in-flight disable test (SP-BG-11), which is not an idempotency test. No duplicate-delivery test is claimed.

Not exercised (see Open Questions):
- Render of the root `App.tsx` and the layouts for auth routes beyond the router-level tests (TODO-007 TDR-007-OQ10 stays open).
- The routes-meta key `account.sessions` is not asserted by name (TDR-008-OQ7).

## Mocking Strategy

- MSW server (`src/test/server.ts`) with the auth handlers in `src/test/handlers/auth.ts` (`API`, `FIXTURE_ME`, `TEST_ACCESS_TOKEN`, `errorResponse`). Each test overrides the endpoints it needs with `server.use`. No real network calls.
- Page tests use `renderRouterAt` (route-level flows) and `renderWithProviders` (single pages) from `src/features/auth/test-helpers.ts`, with a new `QueryClient` per test. The path is set with `window.history.replaceState`.
- Refresh calls are counted through an MSW handler (`refreshCalls` in `change-password-page.test.tsx`) to assert "never refreshes".
- Timing: the first heading wait in `openChangePage` uses an explicit `{ timeout: 5000 }` (RCA-TODO-008, section 7). The other waits in the file keep the default budget; the RCA found no failure in them.
- `console.error` and `console.warn` are silenced with `vi.spyOn` in the change-password test; `vi.restoreAllMocks`, `setAccessToken(null)`, `clearPendingAuthNotice()` and `vi.unstubAllEnvs()` run in `afterEach`.
- Environment: `vitest.config.ts` uses projects. The page tests run under jsdom (prefix `|dom|` in the verbose output); the schema and `auth-messages` tests run under `node`. `use-client-paged-list.test.ts` opts into jsdom through a per-file comment.
- No fake timers in the TODO-008 test files.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| TDR-008-OQ1 | Login validates "required and not blank" only; there is no client-side e-mail format check. | Decision 2026-10-11 (FE doc 3.3 and D9) and D4.5 differ on this point. | A non-e-mail login ID reaches the server, which decides. | architect_frontend; product | No | Answered | Implemented per the 2026-10-11 decision (FE doc 3.3 and D9). The D4.5 difference is recorded for the architect. |
| TDR-008-OQ2 | The invalid reset token hides the form and shows the alert with the link to forgot password. | Confirms the D4.7 invalid-token behavior in the screen. | Display behavior only. | architect_frontend | No | Answered | Decision 2026-10-11, implemented as stated. |
| TDR-008-OQ3 | Copy: quoted strings are used as written; other copy is proposed in Indonesian. | Copy must match the approved text set. | Display only. | product (FE-OQ-22) | No | Deferred | Documented default: the quoted strings as written. Other copy stays as proposed until FE-OQ-22 is decided. |
| TDR-008-OQ4 | The password-changed and reset-done notices reach `/login` through the in-memory one-shot store `src/features/auth/auth-notice.ts`. No source mechanism is named. | The notice is the user's only confirmation after those flows. | An in-memory store does not survive a full page reload, so a reload between the flow and `/login` loses the notice. | architect_frontend | No | Deferred | Documented default: the in-memory one-shot store. Tested in "shows a pending notice once and then clears it" and "names the one-time notices as the architecture quotes them". |
| TDR-008-OQ5 | Revoke-all uses an inline second step, not the dialogs provider. | The dialogs provider was changed in TODO-007 (`confirm(request)`). | Two confirmation patterns exist in the app. | architect_frontend | No | Deferred | Documented default: the inline second step as implemented. Tested in "asks for a second step before revoking all other sessions, and then sends one call". |
| TDR-008-OQ6 | `use-client-paged-list.test.ts` opts into jsdom through a per-file comment. | The environment rule is set in `vitest.config.ts` (OQ-P-01). | A second environment route exists for one file. | developer_frontend | No | Deferred | Documented default: accepted. Other test files stay on the configured environments. |
| TDR-008-OQ7 | The `/account/sessions` route was added through a routes-meta key `account.sessions` (scope amendment 2026-10-11). No test names the key. | The routes-meta key is the access source for the route. | The key is covered only indirectly by the TODO-007 drift test. | developer_frontend | No | Answered | User decision 2026-10-11 (amendment). Documented default: the indirect coverage stands; a direct test may be added in a later TODO. |
| TDR-008-OQ8 | The Node version for the team is open. This run used Node v26.4.0. | Results may differ on other Node versions. | Machine-dependent results. | user (decision); project_manager (record) | No | Open | Not decided. No default set here. Carried from TDR-007-OQ6. |
| TDR-008-OQ9 | Intermittent failure: the D4.4 test in `change-password-page.test.tsx` timed out once in run 1 of the first attempt (default 1000 ms `findByRole` budget; RCA-TODO-008). | Gate G-6 and the PASS result depend on it. | Blocked PASS before the fix. | developer_frontend; debugger (RCA) | Yes | Answered | Closed by the re-run. Fix applied: `{ timeout: 5000 }` on the heading wait in `openChangePage` (lines 60-64), per RCA-TODO-008 section 7. Full suite passed 3 of 3 (248 of 248 each); isolated file passed 10 of 10. Reference: this report. |
| TDR-008-OQ10 | RCA-TODO-008 section 8, check 3 (parallel-load stress: three full suites in parallel, five rounds) was not in this re-run's brief. | The RCA says check 3 is required before TODO-008 is Completed. | Load-only flakiness is not re-measured in this run. The RCA evidence (R6: 15 of 15 with the same budget under load) stands. | unit_test_writer; project_manager (before Completed) | No | Open | Documented default: not run here; RCA evidence accepted for this PASS. Run the stress check before TODO-008 is marked Completed if fresh load evidence is wanted. |
| TDR-008-OQ11 | `rca-report-TODO-008.md` still reads `Status: Pending Approval`. The proposed fix has been applied to the test file. | Gate clearance for the RCA is recorded by the orchestrator on user approval. | None for this run's result. | user; orchestrator | No | Open | Not treated as approval by this run. The orchestrator records the RCA clearance in `output/plans/orchestration-state.md` on user approval. |

Carried from TODO-007 (non-blocking, unchanged): TDR-007-OQ5 (landing page render), TDR-007-OQ8 (`notify.ts` has no test), TDR-007-OQ10 (shell render not unit-tested), and TDR-004-OQ4 (coverage not measured).

Blocking open questions: 0.
