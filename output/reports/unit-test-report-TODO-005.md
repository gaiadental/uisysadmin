---
id: UNIT-TEST-REPORT-TODO-005
title: Unit Test Report — TODO-005
owner: unit_test_writer
status: Pending Approval
version: 1.1
last_updated: 2026-10-12 06:19
related_todo: TODO-005
execution_overall: PASS
source_requirements: [REQ-FE-005, REQ-FE-007, REQ-FE-009, REQ-FE-011, REQ-FE-012, REQ-FE-013, REQ-FE-016, REQ-FE-017, REQ-FE-032, REQ-FE-043, REQ-FE-048, REQ-FE-050]
related_artifacts: [TODO-005, ADR-002, ADR-003, ADR-004, ADR-005, ARCH-FE-001, UNIT-TEST-REPORT-TODO-004, UNIT-TEST-REPORT-TODO-006, UNIT-TEST-REPORT-TODO-007, SP-CF-01]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-005 Auth and session data layer, query foundation and auth provider
Owner: unit_test_writer
Status: Pending Approval
Version: 1.1
Last Updated: 2026-10-12 06:19
Source Requirements: REQ-FE-005, REQ-FE-007, REQ-FE-009, REQ-FE-011, REQ-FE-012, REQ-FE-013, REQ-FE-016, REQ-FE-017, REQ-FE-032, REQ-FE-043, REQ-FE-048, REQ-FE-050
Related Artifacts:
- output/plans/master-todo.md (TODO-005, Gate for every TODO; fix round 2026-10-12)
- output/clarifications.md (SP-CF-01)
- output/architecture/ARCH-FE-001.md v1.0 (D4.2 to D4.10, D5.1, D5.5, D12, D12.1, D12.2, D19)
- output/decisions/ (ADR-002, ADR-003, ADR-004, ADR-005, as cited by TODO-005; not re-read in this run)
- output/reports/unit-test-report-TODO-004.md (format reference; carried open items)
- output/reports/unit-test-report-TODO-007.md (typecheck baseline of the legacy `src/pages/` errors)

## At a Glance

- Overall PASS. `npx vitest run` exited 0 on both runs: 19 files, 253 of 253 tests passed. The implementer's counts are confirmed (19 files, 253 tests; `modules/auth.test.ts` 25, was 20). The two runs have identical totals, per-file counts and test names.
- The five new `getMe branches (SP-CF-01)` tests exist and pass. Every TODO-005 Gate item still maps to named tests. None is missing.
- ESLint on the three changed files: exit 0, 0 problems. `vite build`: exit 0. `tsc -p tsconfig.app.json`: 17 errors, all in `src/pages/`, the same set as the TODO-007 report; none in a changed file.
- Fix under test: `MeSchema.branches` is now `z.array(BranchSummarySchema).nullish()` in `src/types/auth.ts` (SP-CF-01, user decision 2026-10-12).
- Status: Pending Approval. Blocking open questions: 0. Non-blocking: the TODO-005 items carried from v1.0 (TDR-005-OQ1 to OQ8) and two new (TDR-005-OQ9, OQ10).

## Purpose

Record the Checkpoint C re-run for TODO-005 after the fix round of 2026-10-12. The live login failed because `GET /api/v1/auth/me` returns `"branches": null` for a SYSTEM_USER, and `MeSchema` required an array. This report confirms the fix with named tests, re-confirms the TODO-005 Gate, and records the static checks (ESLint, build, typecheck).

## Scope

In scope: the TODO-005 File scope test files and the code they test: `src/lib/api/modules/auth.ts` and `auth.test.ts`; `sessions.ts` and `sessions.test.ts`; `src/types/auth.ts`; `src/lib/query/client.ts`, `keys.ts`, `invalidation.ts` and `invalidation.test.ts`; `src/app/providers/auth-provider.tsx` and `auth-provider.test.tsx`; `src/test/server.ts`, `setup.ts`, `handlers/auth.ts`, `handlers/index.ts`; and `vitest.config.ts`.

Files changed in the fix round (read, not edited, by this run): `src/types/auth.ts` (the schema), `src/lib/api/modules/auth.test.ts` (five new tests) and `src/test/handlers/auth.ts` (new fixture `FIXTURE_ME_NULL_BRANCHES`).

The suite run covers all 19 test files under `src/`. The tests outside the four TODO-005 test files were re-run, not re-reviewed; the reports of their own TODOs cover them.

Out of scope:
- Production code, test code and configuration: not changed by this run.
- Editing the FE requirement text (sections 3.2 and 9): its owner aligns it with the BE contract (see SP-CF-01 and TDR-005-OQ9).
- Live verification against the auth-service (this report is a unit run on MSW fixtures, not a live login).
- Live verification of FE-OQ-18 (TDR-005-OQ4).
- Coverage: not measured (see Coverage).

Checks run:
1. `npx vitest run --reporter=verbose` twice, with exit codes, per-file counts, totals, and a comparison of the sorted test-name lists.
2. Gate mapping: each TODO-005 Gate item matched against current test names; the five new `getMe` tests read in `auth.test.ts`.
3. `npx eslint src/types/auth.ts src/lib/api/modules/auth.test.ts src/test/handlers/auth.ts` (text and JSON output).
4. `npx vite build --outDir <scratchpad>/dist-fix005-report`.
5. `npx tsc -p tsconfig.app.json --noEmit`, errors grouped by path, compared with the TODO-007 report.
6. A search of `src/` for production code that reads `Me.branches`.

Environment: darwin-arm64, Node v26.4.0, npm 11.17.0, Vitest 5.0.3. `vitest.config.ts` has two projects: `.test.ts` runs in `node`, `.test.tsx` runs in `jsdom` (see TDR-005-OQ3).

## References

- `output/plans/master-todo.md` -> TODO-005 (Description, Notes, Gate) and Gate for every TODO
- `output/clarifications.md` -> SP-CF-01
- `output/architecture/ARCH-FE-001.md` v1.0 (D4.2 to D4.10, D5.1, D5.5, D12.1, D12.2)
- `output/reports/unit-test-report-TODO-004.md`, `unit-test-report-TODO-007.md`
- `.claude/rules/standards-frontend.md` -> Testing Standards

## Report History

| Version | Date | Event | Result |
|---------|------|-------|--------|
| 1.0 | 2026-10-11 18:53 | First Checkpoint C run for TODO-005 | PASS. 7 files, 125 tests, both runs. |
| (event) | 2026-10-11 | Live login against the auth-service failed. `GET /api/v1/auth/me` returned `branches: null` for a SYSTEM_USER; `MeSchema` required an array, so the SP web raised CONTRACT and login failed. | The v1.0 fixture used `branches: []` (the FE requirement shape), so no unit test could catch it. |
| (event) | 2026-10-12 | Fix round on TODO-005. User decision recorded as SP-CF-01: auth-service is not changed; the SP web `Me` type accepts a null or absent `branches`, following the BE contract (`branches?`). `MeSchema.branches` became `.nullish()`; five new `getMe` tests and the `FIXTURE_ME_NULL_BRANCHES` fixture were added. | Implemented by developer_frontend. |
| 1.1 | 2026-10-12 06:19 | This re-run | PASS. 19 files, 253 tests, both runs. |

Note on the file count: v1.0 ran 7 files and 125 tests. The suite is now 19 files and 253 tests because TODO-006, TODO-007 and TODO-008 added test files after v1.0. TODO-005 scope itself grew by 6 tests (see Test count by file).

## Test Cases

### Fix-round tests: `getMe branches (SP-CF-01)`

All five are in `src/lib/api/modules/auth.test.ts`. Each overrides `GET /auth/me` through `server.use(...)` with an MSW handler, so the call runs through the real client and the real schema.

| # | Test (full name) | Input | Assertion | Result |
|---|------------------|-------|-----------|--------|
| 1 | `getMe branches (SP-CF-01) > accepts branches null, the live shape for a SYSTEM_USER` | `FIXTURE_ME_NULL_BRANCHES` (`branches: null`) | resolves; `me.branches` is `null`; `me.branches ?? []` equals `[]`; `loginId` kept | Covered, passed |
| 2 | `... > accepts a missing branches field` | `branches` absent from the body | resolves; `me.branches` is `undefined`; `me.branches ?? []` equals `[]` | Covered, passed |
| 3 | `... > accepts an empty branches array` | `branches: []` | resolves; `me.branches` equals `[]` | Covered, passed |
| 4 | `... > accepts a list of branches` | `branches: [{ branchId: "b1", name: "Main branch" }]` | resolves; `me.branches` equals the list | Covered, passed |
| 5 | `... > still throws CONTRACT when branches is not an array` | `branches: "x"` | rejects with an `ApiError` whose `kind` is `CONTRACT` | Covered, passed |

Test 5 keeps the contract check: a wrong type is still rejected, so the schema is relaxed for null and absent only.

The fixture `FIXTURE_ME_NULL_BRANCHES` is exported from `src/test/handlers/auth.ts` (`...FIXTURE_ME, branches: null`). The default `FIXTURE_ME` keeps `branches: []`, so the existing happy-path tests still cover the FE document shape.

### TODO-005 Gate coverage

Names are as printed by the verbose run. The reporter truncates some long names (marked with an ellipsis); the full names are in the test files.

| # | Gate item | Covering test(s) | Result |
|---|-----------|------------------|--------|
| 1 | Auth module, happy path | `auth.test.ts` > login (D4.5) > "sends only loginId and password and returns the access token"; > getMe (D5.1, D5.5) > "unwraps data and returns the typed current user"; > logout (D4.4, D4.8) > "resolves when the server accepts the logout"; > forgotPassword and resetPassword (D4.7) > "forgotPassword sends only the loginId and resolves", "resetPassword sends the token and both passwords"; > refreshSession (D4.2) > "returns the access token from the refresh envelope". `auth-provider.test.tsx` > login (D4.5) > "sends loginId and password only, then reaches authenticated" | Covered |
| 2 | Auth module, CONTRACT on a bad shape | `auth.test.ts` > getMe > "throws CONTRACT when a required field is missing", "throws CONTRACT when the body has no data envelope"; > getMe branches (SP-CF-01) > "still throws CONTRACT when branches is not an array"; > login > "throws CONTRACT when the token envelope is empty"; > refreshSession > "throws CONTRACT when accessToken is an empty string"; > changePassword > "throws CONTRACT when a kept session gets the PASSWORD_CHANGED shape"; > forgotPassword and resetPassword > "throws CONTRACT when the status payload is missing". `sessions.test.ts` > "throws CONTRACT when a session lacks isCurrent", "throws CONTRACT when a revoke answers with a payload instead of null", "throws CONTRACT when the admin list is not an array" | Covered |
| 3 | Auth module, 401 on logout | `auth.test.ts` > logout (D4.4, D4.8) > "treats a 401 as already logged out and never refreshes" | Covered |
| 4 | Auth module, both change-password outcomes | `auth.test.ts` > changePassword (D4.6) > "keepCurrentSession true returns the rotated access token", "keepCurrentSession false returns PASSWORD_CHANGED". Provider level: `auth-provider.test.tsx` > password change outcomes (D4.6) > "a kept session takes the rotated token and reloads me, which opens the app", "an ended session clears the token, the cache and the view, without a logout call" | Covered |
| 5 | Sessions, list | `sessions.test.ts` > own sessions (D4.9) > "lists the signed-in user's sessions with the current one marked" | Covered |
| 6 | Sessions, revoke one | `sessions.test.ts` > own sessions (D4.9) > "revokes one session with the session id encoded in the path" | Covered |
| 7 | Sessions, revoke all others | `sessions.test.ts` > own sessions (D4.9) > "revokes every other session with one DELETE on the collection" | Covered |
| 8 | Sessions, admin list | `sessions.test.ts` > sessions of another user (D4.10, FE doc 5.6) > "lists the sessions of one user from the admin path" | Covered |
| 9 | Sessions, admin force logout | `sessions.test.ts` > sessions of another user > "force logout sends one DELETE for the user and resolves", "maps 403 PERMISSION_DENIED from force logout to an HTTP error" | Covered |
| 10 | Invalidation map: each D12.1 mutation invalidates its keys | `invalidation.test.ts` > invalidation plan (D12.1): 18 tests, one per D12.1 row (table below). > invalidation against a real cache (D12.1): 17 tests, checks `isInvalidated` per query key | Covered |
| 11 | Boot state paths | `auth-provider.test.tsx` > boot (D4.2) > "is authenticated after refresh and me, and caches me under auth.me", "requires a password change when me reports pwdChangeRequired", "sends one refresh under StrictMode, because both effect runs share it (D4.3)", "is anonymous when the session has ended, without an error screen", "is in error on a server failure, and retry recovers the session" | Covered |
| 12 | Logout state paths | `auth-provider.test.tsx` > logout (D4.8) > "calls the server, then clears the token, the cache and the view", "still ends the local session when the server call fails", "ends this session when another tab announces a logout (sp-session)" | Covered |
| 13 | MSW integration tests for auth and sessions, through the handlers | `auth.test.ts` (25), `sessions.test.ts` (9) and `auth-provider.test.tsx` (12) run through the MSW server in `src/test/server.ts`, whose default handlers (`authHandlers`, `sessionHandlers` in `src/test/handlers/auth.ts`) come from `src/test/handlers/index.ts`. Per-test overrides use `server.use(...)`. Unhandled requests fail the test (`src/test/setup.ts`, `onUnhandledRequest: "error"`) | Covered |

No Gate item is missing, so the Gate is met. Gate items 11 and 12 are unchanged from v1.0. The provider file also holds a twelfth test, "GATE-11: logout is reachable while passwordChangeRequired is true" (added under TODO-006 on 2026-10-11 20:08, reported in `unit-test-report-TODO-006.md`; the provider code is unchanged).

### D12.1 invalidation map (Gate item 10)

Unchanged from v1.0. Each row lists the plan test in `invalidation.test.ts` > invalidation plan (D12.1), and the matching real-cache test in > invalidation against a real cache (D12.1). Both groups ran in both runs (18 plan tests and 17 real-cache tests). Names are abbreviated after the mutation text; full names are in the file.

| D12.1 mutation | Invalidated keys (per D12.1) | Test(s) |
|----------------|------------------------------|---------|
| Login | `['auth','me']` | "invalidates the D12.1 keys for login"; "marks only the matching queries stale for login" |
| Logout | Clear whole cache (D12.2) | "clears the whole cache on logout (D12.2)"; "empties the cache on logout" |
| Change password, `keepCurrentSession = true` | `['auth','me']` | "...for change password with keepCurrentSession..." (plan and real cache; truncated) |
| Change password, `keepCurrentSession = false` | Clear whole cache | "clears the whole cache when a password change ends every session (D4.6)" (plan only) |
| Revoke own session (one or all) | `['sessions','own']` | "...for revoke own sessions" (plan and real cache) |
| Tenant create | `['master','tenants']` | "...for tenant create" (plan and real cache) |
| Tenant patch | `['master','tenant', id]`, `['master','tenants']` | "...for tenant patch" (plan and real cache) |
| Admin-account retry | `['master','tenant', id]` | "...for admin-account retry" (plan and real cache) |
| Tenant category create, update, delete | `['master','tenantCategories']`, `['ref','tenantCategories']`, `['master','tenants']` | "...for tenant category create, update or delete" (plan and real cache) |
| Country create, update, delete | `['master','countries']`, `['ref','countries']`, `['master','tenants']` | "...for country create, update or delete" (plan and real cache) |
| System user write (with and without id) | `['system','users']`, `['system','user', id]` | "...for system user write with a known user"; "...for system user create without an id" (plan and real cache) |
| Force logout (admin) | `['admin','sessions', userId]` | "...for force logout (admin)" (plan and real cache) |
| System role write (with and without id) | `['system','roles']`, `['system','role', id]`, `['system','users']` | "...for system role write with a known role"; "...for system role create without an id" (plan and real cache) |
| Role permissions replace | `['system','rolePermissions', id]`, `['system','role', id]` | "...for role permissions replace" (plan and real cache) |
| Master permission create, update, delete | `['system','masterPermissions']`, `['system','tenantPermissions']`, `['system','rolePermissions']` | "...for master permission create, update or delete" (plan and real cache) |
| Tenant permissions replace or toggle | `['system','tenantPermissions', tenantId]` | "...for tenant permissions replace or toggle" (plan and real cache) |

All rows are covered.

### Test count by file

Counts are identical on run 1 and run 2.

| File | Tests | Breakdown | Scope |
|------|-------|-----------|-------|
| `src/lib/api/modules/auth.test.ts` | 25 | login 3; getMe 3; getMe branches (SP-CF-01) 5; refreshSession 2; logout 3; changePassword 5; forgotPassword and resetPassword 4 | TODO-005 (was 20; 5 new) |
| `src/lib/api/modules/sessions.test.ts` | 9 | own sessions 5; sessions of another user 4 | TODO-005 (unchanged) |
| `src/lib/query/invalidation.test.ts` | 35 | invalidation plan 18; invalidation against a real cache 17 | TODO-005 (unchanged) |
| `src/app/providers/auth-provider.test.tsx` | 12 | boot 5; login 1; password change outcomes 2; logout 4 | TODO-005 (was 11; the GATE-11 test came from TODO-006) |
| `src/lib/api/errors.test.ts` | 8 | | TODO-004, re-run |
| `src/lib/api/refresh.test.ts` | 9 | | TODO-004, re-run |
| `src/lib/api/client.test.ts` | 33 | | TODO-004, re-run |
| `src/app/guards/route-guard.test.tsx` | 20 | | Other TODO, re-run |
| `src/lib/access/gates.test.ts` | 28 | | Other TODO, re-run |
| `src/app/navigation.test.ts` | 11 | | Other TODO, re-run |
| `src/components/dialogs/dialogs.test.tsx` | 5 | | Other TODO, re-run |
| `src/hooks/use-client-paged-list.test.ts` | 9 | | Other TODO, re-run |
| `src/features/auth/auth-messages.test.ts` | 13 | | Other TODO, re-run |
| `src/features/auth/schema.test.ts` | 9 | | Other TODO, re-run |
| `src/features/auth/login-page.test.tsx` | 8 | | Other TODO, re-run |
| `src/features/auth/change-password-page.test.tsx` | 6 | | Other TODO, re-run |
| `src/features/auth/reset-password-page.test.tsx` | 5 | | Other TODO, re-run |
| `src/features/auth/forgot-password-page.test.tsx` | 4 | | Other TODO, re-run |
| `src/features/auth/sessions-page.test.tsx` | 4 | | Other TODO, re-run |
| Total | 253 across 19 files | TODO-005 scope: 81 (35 + 9 + 25 + 12) | Matches the implementer's 19 files and 253 tests |

### Gate checks (G1 to G5)

| ID | Check | Command | Expected | Result |
|----|-------|---------|----------|--------|
| G1 | Vitest, first run | `npx vitest run` | Exit 0 | PASS. Exit 0. 19 files passed, 253 tests passed. |
| G2 | Vitest, second run (determinism) | `npx vitest run` | Exit 0, same totals, per-file counts and names | PASS. Exit 0. 19 files, 253 tests. Per-file counts equal. The sorted lists of 253 test names are identical (diff empty). |
| G3 | ESLint, changed files | `npx eslint src/types/auth.ts src/lib/api/modules/auth.test.ts src/test/handlers/auth.ts` | 0 problems | PASS. Exit 0, no text output. JSON run: 3 files, 0 errors, 0 warnings. |
| G4 | Production build | `npx vite build --outDir <scratchpad>/dist-fix005-report` | Exit 0 | PASS. Exit 0, "built in 672ms". The only message is the chunk-size warning for `index-*.js` (528.57 kB, over 500 kB); the build is not failed by it. The output went to the scratchpad. |
| G5 | Typecheck by path | `npx tsc -p tsconfig.app.json --noEmit` | No error in a changed file; the remaining errors are the known legacy set in `src/pages/` | PASS by path. Exit 2 with 17 errors, all in `src/pages/`. 0 in `src/types/auth.ts`, `auth.test.ts` and `src/test/handlers/auth.ts`. Detail below. |

Typecheck detail (G5). The set matches the TODO-007 report (12 TS2339, 3 TS7006, 2 TS2375; same paths and lines). No difference was found.

| Path | Errors | Lines and codes | Cause (per the TODO-007 report) |
|------|--------|-----------------|---------------------------------|
| `src/pages/katalog-kategori.tsx` | 2 | 37 TS2339; 40 TS7006 | Removed `dialogs.open` call |
| `src/pages/katalog-negara.tsx` | 2 | 37 TS2339; 40 TS7006 | Removed `dialogs.open` call |
| `src/pages/katalog-permission.tsx` | 1 | 56 TS2339 | Removed `dialogs.open` call |
| `src/pages/sistem-sesi.tsx` | 1 | 102 TS2339 | Removed `dialogs.open` call |
| `src/pages/tenant-create.tsx` | 3 | 113 TS2339; 514 TS2375; 519 TS2375 | 113: removed `dialogs.open` call. 514 and 519: pre-existing `hint` typing under `exactOptionalPropertyTypes` (PM-RK-02) |
| `src/pages/tenant-detail.tsx` | 4 | 134, 149, 159, 370 TS2339 | Removed `dialogs.open` call (4 sites) |
| `src/pages/tenant-list.tsx` | 1 | 194 TS2339 | Removed `dialogs.open` call |
| `src/pages/tim-akun.tsx` | 1 | 129 TS2339 | Removed `dialogs.open` call |
| `src/pages/tim-peran.tsx` | 2 | 104 TS2339; 107 TS7006 | Removed `dialogs.open` call |
| Total | 17 | 12 TS2339, 3 TS7006, 2 TS2375 | 15 from removed `open` call sites (PM-RK-01, removed in TODO-017); 2 pre-existing |

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npx vitest run` (run twice; same result both times) |
| Run at | 2026-10-12 06:16 (run 1 started 06:16:49; run 2 started 06:16:58, local time) |
| Total | 253 |
| Passed | 253 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Notes on the run:
- Exit codes: run 1 = 0, run 2 = 0. Vitest summary on both runs: 19 files passed, 253 tests passed.
- The sorted verbose test-name lists from the two runs are identical, and the per-file counts are equal.
- Node version for the team stays open (TDR-005-OQ6).

## Execution Results

253 tests passed (19 files). Exit 0 on both runs, identical names and totals.

## Handoff

Not applicable. `execution_overall: PASS`. No failure class and no routing hint.

## Coverage

Not measured. No coverage provider is installed (`node_modules/@vitest` held only `mocker` and `spy` at v1.0; `package.json` is outside this run). The 80% guideline is not evaluated for TODO-005. Carried as TDR-004-OQ4. The fix is a one-line schema change and the five new tests exercise each branch of `.nullish()` (null, absent) and the array check (empty, populated, wrong type).

## Edge Cases

Covered (by the named tests above):
- Null and absent: `branches: null` (the live SYSTEM_USER shape) and a missing `branches` both pass; getMe with no `data` envelope gives CONTRACT; a session entry without `isCurrent` gives CONTRACT; a logout network failure is ignored; boot with an ended session gives anonymous with no error screen.
- Empty: `branches: []` passes; an empty `accessToken` on refresh gives CONTRACT; an empty token envelope on login gives CONTRACT.
- Boundary: a populated `branches` list passes; change-password with `keepCurrentSession` true and false (both outcomes); a StrictMode boot runs one refresh.
- Invalid: `branches: "x"` gives CONTRACT (the relaxed schema still rejects a wrong type); a PASSWORD_CHANGED body on a kept session gives CONTRACT; a revoke answer with a payload instead of null gives CONTRACT; an admin list that is not an array gives CONTRACT; a forgot-password answer without a status gives CONTRACT; reset-password 400 INVALID_TOKEN gives an HTTP error.
- Failure: 401 on logout is treated as logged out with no refresh; 401 on change-password never refreshes; 403 PERMISSION_DENIED on force logout gives an HTTP error; a boot server failure gives the error state and retry recovers; a logout server failure still ends the local session; another tab's `sp-session` logout ends this session.

Not exercised (non-blocking; see Open Questions):
- Boot and login with a SYSTEM_USER whose `me` has `branches: null`, end to end through the auth provider. The new tests stop at `getMe`. The provider tests use `FIXTURE_ME` (`branches: []`). The provider does not read `branches`, so the schema fix is the whole change, but no provider test shows login reaching `authenticated` with the null shape (TDR-005-OQ10).
- A 401 on a non-exempt session call (revoke one, revoke all others, admin force logout) triggers a refresh and a retry of a DELETE. No test asserts this path (TDR-005-OQ7).
- Unknown 401 codes on boot (TDR-005-OQ5). No test name covers an unknown code.
- The `createQueryClient()` defaults (retry off for queries and mutations, `refetchOnWindowFocus` off; D12.2) are not asserted by any test (TDR-005-OQ8).
- Live expired-token behaviour (TDR-005-OQ4) and a live login after the fix.

Idempotency (checklist item): no TODO-005 write is a retryable non-idempotent write that the client re-sends. The auth POSTs (login, change-password, forgot-password, reset-password, logout) are on the refresh-exempt list, so a 401 never re-sends them. The session DELETEs (revoke one, revoke all others, force logout) are idempotent by stable resource id (`tech-stack-integration.md` -> Idempotency Standards: out of scope). A duplicate-delivery test is therefore not required under that standard. The fix round changed a read (`getMe`) and a schema only. The general question of a 401-triggered retry of non-GET requests stays open (TDR-004-OQ1; see TDR-005-OQ7).

## Mocking Strategy

- MSW 2.x `setupServer` from `msw/node` in `src/test/server.ts`, started in `src/test/setup.ts` with `onUnhandledRequest: "error"`. Handlers reset after each test; the server closes after all tests. A request with no handler fails the test.
- Default handlers: `authHandlers` and `sessionHandlers` in `src/test/handlers/auth.ts`, exported through `src/test/handlers/index.ts`. The default `GET /auth/me` handler returns `FIXTURE_ME` (`branches: []`). A case adds an override with `server.use(...)` when it needs a different status or body.
- Fix-round tests: the five `getMe branches (SP-CF-01)` tests use one local helper, `respondWith(data)`, that overrides `GET /auth/me` with `{ data }`. The null shape comes from the shared fixture `FIXTURE_ME_NULL_BRANCHES`. The absent shape is `{ ...FIXTURE_ME, branches: undefined }`; JSON drops undefined, so the field is missing from the body.
- Base URL: each module test stubs `VITE_API_BASE_URL` to `http://sp.test` with `vi.stubEnv`, so calls reach MSW as full URLs.
- `auth.test.ts` and `sessions.test.ts` call the real module functions over the real client, refresh code and Zod schemas. There are no `vi.mock` calls in the four TODO-005 test files.
- `console.error` is spied and silenced in the module and provider tests.
- `auth-provider.test.tsx`: jsdom; React Testing Library `render`, with a StrictMode variant; a real QueryClient from `createQueryClient()` created per test; a second `BroadcastChannel("sp-session")` stands in for another tab.
- `invalidation.test.ts`: pure plan tests, plus checks of `isInvalidated` per query key on a real `createQueryClient()` cache.
- No fake timers in the TODO-005 tests. Unhandled requests fail the test, so no call reaches the network.

Determinism: both runs gave the same result. No timers, no real network, and no shared state between tests (handlers reset and a new QueryClient per test).

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| TDR-005-OQ1 | (a) On module CONTRACT errors, `correlationId` is null. `unwrapData` in `auth.ts` throws `contractError(null, null)` because `apiRequest` returns only the body, so the correlation id does not reach the module (D3.2 gap). | D13 shows a reference id with errors. A CONTRACT error from auth or sessions has none to show. The live login failure of 2026-10-11 was a CONTRACT error from `getMe`, so a reference id would have helped there; the report does not record whether one was shown. | Support cannot match a CONTRACT error to a log line. | architect_frontend (D3.2 decision); developer_frontend (client change) | No | Open | Documented default: null for module CONTRACT errors. The fix needs a TODO-004 client change, which this run does not make. |
| TDR-005-OQ2 | (b) One `eslint-disable-next-line react-refresh/only-export-components` at `src/app/providers/auth-provider.tsx:209`, on the `useAuth` hook. | The context stays private to the provider file. A split needs a file outside TODO-005 scope. | One suppressed line. | developer_frontend | No | Open | Documented default: accepted as one reasoned suppression. Not a failure. Still present at line 209; the file is unchanged since v1.0. |
| TDR-005-OQ3 | (c) The vitest include was widened from `src/**/*.test.ts` to also run `.test.tsx` files (v1.0). `vitest.config.ts` now splits this into two projects: `.test.ts` in `node`, `.test.tsx` in `jsdom`. | `auth-provider.test.tsx` needs a DOM. Closes TDR-004-OQ6. The project split came with a later TODO; this run did not change the file. | Later `.test.tsx` files run in jsdom without a per-file comment. | developer_frontend; reviewer (accept) | No | Open | Documented default: the widened include stays, now as two projects. |
| TDR-005-OQ4 | (d) FE-OQ-18: the expired-token code is not verified against a live stack. The tests assume `UNAUTHORIZED`, `INVALID_TOKEN` and `SESSION_ENDED` trigger a refresh. | The master TODO requires verification before integration tests against the platform. | Unit gate not affected. The trigger set may differ on the live stack. Carries TDR-004-OQ3. | architect_frontend; architect_backend (auth-service owner) | No | Deferred | Documented default: the three codes trigger refresh. Verify with a live expired token before platform integration tests. The live login of 2026-10-11 reached the auth-service, but it did not test an expired token. |
| TDR-005-OQ5 | (e) Unknown 401 codes on boot map to anonymous. D4.2 is silent on unknown codes. | Boot decides between the login screen and the error screen. | An unknown code shows the login screen, not the error screen. No test name covers an unknown code. | architect_frontend (document D4.2) | No | Open | Documented default: anonymous. |
| TDR-005-OQ6 | (f) Node version for the team is still open. Carries TDR-004-OQ7. This run: Node v26.4.0, npm 11.17.0, Vitest 5.0.3. | Results may differ on other Node versions. | Test results could differ between machines. | user (decision); project_manager (record) | No | Open | Not decided. No default set here. |
| TDR-005-OQ7 | The 401-triggered retry of the non-exempt session DELETEs (revoke one, revoke all others, admin force logout) has no test. | Same question as TDR-004-OQ1 for non-GET retries. A DELETE on a stable resource id is idempotent by HTTP semantics, so no Idempotency-Key is required; the gap is test evidence. | A defect in this retry path would not be caught. | developer_frontend (test); orchestrator (decides whether to add it) | No | Open | Documented default: no change to TODO-005 status. |
| TDR-005-OQ8 | The `createQueryClient()` defaults (retry off for queries and mutations; `refetchOnWindowFocus` off; D12.2) are not asserted by any test. | D12.2 relies on these defaults to stop refresh rotation on focus and to stop automatic retries. The Gate does not name them. | A regression in the defaults would not be caught. | developer_frontend (test) | No | Open | Documented default: no change to TODO-005 status. A one-test assertion covers it. |
| TDR-005-OQ9 | SP-CF-01: the FE requirement RAG-FE-SP-001 (sections 3.2 and 9) says `GET /api/v1/auth/me` returns `branches: []` for a system user. The BE contract (auth-service ARCH-BE-001 line 332) types it `branches?`, and the live service returns `null`. The requirement text is not edited by this run. | The two sources disagree. The SP web now follows the BE contract (user decision 2026-10-12: auth-service not changed; `Me.branches` accepts null or absent; a missing value means no branches). The FE requirement still says `[]`, so a reader of the requirement alone would expect an array. The FE fixture `FIXTURE_ME` still holds `branches: []`, the requirement shape, next to the new null fixture. | Until the requirement owner aligns the text, the requirement and the code differ on this field. No test fails. | owner of the FE requirement RAG-FE-SP-001 (aligns sections 3.2 and 9 with the BE contract) | No | Open | The user answered the SP web side in `output/clarifications.md` (SP-CF-01 is `Answered`). Documented default: the BE contract (`branches?`) is the basis; the requirement text change is open. ADR-006 is not cited, as it has no text on graceful degradation. |
| TDR-005-OQ10 | No production code reads `Me.branches` today (searched `src/`; only the type and test fixtures use it). The rule "a missing value means no branches" is asserted only by the test expression `me.branches ?? []`, not by a shared helper. | A later feature that reads `branches` (for example a branch picker or a tenant header) must apply the same default, or it fails on `null` or `undefined`. The schema type is now `Branch[] | null | undefined`, so TypeScript will flag a direct `.map` or `.length`. | A future consumer could hit a type error, or a runtime error if it casts. No effect on this gate. | developer_frontend (first consumer); reviewer | No | Open | Documented default: consumers use `me.branches ?? []`. Also, no provider-level test runs a boot or login with `branches: null` (see Edge Cases); one added provider test would show login reaching `authenticated` for a SYSTEM_USER. Not required by the Gate. |

TODO-004 items carried unchanged into this run: TDR-004-OQ1 (idempotency of a 401-triggered retry of non-GET requests; see TDR-005-OQ7), TDR-004-OQ2 (ARCH-FE-001 line 326 names two session-clearing codes; the code uses three), TDR-004-OQ4 (coverage not measured), TDR-004-OQ5 (D19 static source scan, scheduled in TODO-017), and TDR-004-OQ8 (test gaps in the TODO-004 files). Restated: TDR-004-OQ3 as TDR-005-OQ4, TDR-004-OQ7 as TDR-005-OQ6. Closed by v1.0: TDR-004-OQ6 (TDR-005-OQ3).

Typecheck parity: the 17 `tsc` errors in `src/pages/` match the TODO-007 report in count, paths and lines. No difference to record.

Blocking open questions: 0.
