---
id: UNIT-TEST-REPORT-TODO-004
title: Unit Test Report — TODO-004
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-11 06:19
related_todo: TODO-004
execution_overall: PASS
source_requirements: [REQ-FE-001, REQ-FE-004, REQ-FE-005, REQ-FE-006, REQ-FE-008, REQ-FE-010, REQ-FE-038, REQ-FE-046, REQ-FE-050]
related_artifacts: [TODO-004, ADR-002, ADR-004, ADR-005, ARCH-FE-001, UNIT-TEST-REPORT-TODO-003]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-004 HTTP pipeline, error model and refresh module
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-11 06:19
Source Requirements: REQ-FE-001, REQ-FE-004, REQ-FE-005, REQ-FE-006, REQ-FE-008, REQ-FE-010, REQ-FE-038, REQ-FE-046, REQ-FE-050
Related Artifacts:
- output/plans/master-todo.md (TODO-004, Gate for every TODO)
- output/architecture/ARCH-FE-001.md v1.0 (D3.1, D3.2, D4.1 to D4.4, D18)
- output/decisions/ (ADR-002, ADR-004, ADR-005)
- output/reports/unit-test-report-TODO-003.md (format reference)

## At a Glance

- Overall PASS. `npx vitest run` exited 0 on both runs, with 50 of 50 tests passing in 3 files.
- All nine REQ-FE-050 gate cases map to named tests. No case is missing.
- ESLint on `src/lib/api` and `vitest.config.ts`: 0 errors, 0 warnings. `tsc`: 2 errors, both in the legacy `src/pages/tenant-create.tsx` (lines 514 and 519). None in `src/lib/api/`.
- Status: Pending Approval. Blocking open questions: 0. Non-blocking open items: 8 (see Open Questions). TDR-004-OQ1 matters most: the 401-triggered retry of write requests has no test, so the idempotency checklist item is not evidenced.

## Purpose

Record the Checkpoint C run for TODO-004: the single HTTP pipeline (`client.ts`), the error model (`errors.ts`), the refresh module (`refresh.ts`) and `vitest.config.ts`. The TODO-004 Gate requires the REQ-FE-050 cases to be covered by tests and the suite to pass. This report records both.

## Scope

In scope: the TODO-004 File scope: `src/lib/api/client.ts`, `client.test.ts`, `errors.ts`, `errors.test.ts`, `refresh.ts`, `refresh.test.ts` and `vitest.config.ts`.

Checks run: `npx vitest run` twice (exit codes and totals), a verbose listing of test names, the REQ-FE-050 mapping against test names and bodies, `npx eslint` on the TODO-004 files, and `npx tsc -p tsconfig.app.json --noEmit` with errors recorded by path.

Out of scope:
- Other `src/` files, `package.json`, `package-lock.json`, the master TODO, the plan and ADRs: not changed and not checked here.
- Live gateway verification of FE-OQ-18: TODO-005.
- No production code, test code or configuration was changed by this run.

## References

- `output/plans/master-todo.md` -> TODO-004 (Description, Notes, Gate) and Gate for every TODO
- `output/architecture/ARCH-FE-001.md` v1.0 (D3.1, D3.2, D4.1 to D4.4, D18; refresh-result rule at line 326; boot rule at line 315; refresh trigger rule at line 331; FE-OQ-18 at line 963)
- `output/decisions/` (ADR-002, ADR-004, ADR-005, as cited by TODO-004)
- `output/reports/unit-test-report-TODO-003.md` (format reference)

## Test Cases

### REQ-FE-050 gate coverage

Test names are as printed by the verbose run. The describe path is shown where it adds meaning.

| # | Gate case | Covering test(s) | Result |
|---|-----------|------------------|--------|
| 1 | Concurrent 401s produce one refresh call | `client.test.ts` > refresh policy (D4.3, D4.4) > "sends one refresh call for concurrent 401s". Also `refresh.test.ts` > refreshAccessToken single-flight > "runs one refresh for concurrent 401s and shares the result" | Covered |
| 2 | 401, refresh, one retry, then logout on a second 401 | `client.test.ts` > refresh policy (D4.3, D4.4) > "refreshes, retries once with a new correlation id, and resolves"; > "logs out when the retry is also 401, without a second refresh" | Covered |
| 3 | Exempt endpoints never refresh | `client.test.ts` > refresh policy (D4.3, D4.4) > "an exempt endpoint never refreshes: /api/v1/auth/login", "... /api/v1/auth/change-password", "... /api/v1/auth/forgot-password", "... /api/v1/auth/reset-password", "... /api/v1/auth/logout" (5 cases) | Covered for 5 of the 6 paths in `NO_REFRESH_PATHS`. `/api/v1/auth/refresh` has no row (TDR-004-OQ8) |
| 4 | `INVALID_CREDENTIALS` never refreshes | `client.test.ts` > refresh policy (D4.3, D4.4) > "INVALID_CREDENTIALS never refreshes, even on a non-exempt endpoint" | Covered |
| 5 | 204 returns no body | `client.test.ts` > response handling (D3.1 steps 5 and 8) > "resolves a 204 with no body" | Covered |
| 6 | NETWORK, TIMEOUT and NON_JSON mapping | `client.test.ts` > response handling > "maps a network failure to kind NETWORK"; "maps an abort after 30 seconds to kind TIMEOUT"; "maps an empty 200 body to kind NON_JSON"; "maps a non-JSON 200 body to kind NON_JSON"; "maps an HTML 502 page to kind NON_JSON". `errors.test.ts` > client-side error kinds > "uses the kind as the code for NETWORK, TIMEOUT and NON_JSON" | Covered |
| 7 | Forbidden headers never sent in development | `client.test.ts` > forbidden headers (D3.1 step 2) > "never sends X-User-ID, X-Role, X-Tenant-ID or X-Service-Token"; > "refuses a forbidden header in development, naming the header only". Production counterpart: "sends nothing outside the allow-list in a production build" | Covered |
| 8 | Lock fallback when `navigator.locks` is missing | `refresh.test.ts` > refreshAccessToken single-flight > "falls back to in-tab single-flight when navigator.locks is missing". Lock path: "serialises the refresh under the sp-session-refresh Web Lock" | Covered |
| 9 | 403 `PASSWORD_CHANGE_REQUIRED` returned to the caller, no refresh | `client.test.ts` > refresh policy (D4.3, D4.4) > "returns 403 PASSWORD_CHANGE_REQUIRED to the caller without refreshing" | Covered |

Case 7 note: the header-name test (`never sends ...`) checks the header set of a normal request. `apiRequest` has no option that passes a header, so the forbidden-header refusal is exercised on `assertOutgoingHeaders` directly. That function runs inside `sendOnce` before every `fetch` (`client.ts` line 184).

Case 3 note: the table covers five of the six entries in `NO_REFRESH_PATHS`. The sixth, `/api/v1/auth/refresh`, has no row. The case is still covered by the five named paths and the same code branch. Recorded as TDR-004-OQ8.

### Other gate checks

| ID | Check | Command | Expected | Result |
|----|-------|---------|----------|--------|
| G1 | Vitest, first run | `npx vitest run` | Exit 0 | PASS. Exit 0. 3 files passed, 50 tests passed. |
| G2 | Vitest, second run (determinism) | `npx vitest run` | Exit 0, same totals | PASS. Exit 0. 3 files passed, 50 tests passed. Identical to G1. |
| G3 | ESLint on TODO-004 files | `npx eslint src/lib/api vitest.config.ts` | 0 errors | PASS. Exit 0, no output. A JSON run of the same command lists 7 files (`client.ts`, `client.test.ts`, `errors.ts`, `errors.test.ts`, `refresh.ts`, `refresh.test.ts`, `vitest.config.ts`), each with 0 errors and 0 warnings. |
| G4 | Typecheck by path | `npx tsc -p tsconfig.app.json --noEmit` | Only the two known legacy errors in `src/pages/tenant-create.tsx`; none in `src/lib/api/` | PASS. Exit 2 with 2 errors, both TS2375 in `src/pages/tenant-create.tsx`: line 514 and line 519 (legacy mock file, PM-RK-02). 0 errors in `src/lib/api/`. |

### Test count by file

| File | Tests | Breakdown |
|------|-------|-----------|
| `src/lib/api/errors.test.ts` | 8 | ApiError 1; httpError 3; client-side error kinds 3; isUnauthorized 1 |
| `src/lib/api/refresh.test.ts` | 9 | refreshAccessToken single-flight 5; refresh outcomes 4 |
| `src/lib/api/client.test.ts` | 33 | request construction 8 (4 named, 4 path cases); refresh policy 13; response handling 6; forbidden headers 5; development logging 1 |
| Total | 50 | Matches the Vitest total. The implementer's split (client 33, errors 8, refresh 9) is confirmed. |

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npx vitest run` (run twice; same result both times) |
| Run at | 2026-10-11 06:18 |
| Total | 50 |
| Passed | 50 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Notes on the run:
- Environment: Node v26.4.0, npm 11.17.0, Vitest v5.0.3. Test environment is `node` (`vitest.config.ts`). No DOM is used.
- Node version for the team stays open (TDR-004-OQ7).

## Execution Results

50 tests passed (3 files). Exit 0 on both runs, identical totals.

## Handoff

Not applicable. `execution_overall: PASS`. No failure class and no routing hint.

## Coverage

Not measured. No coverage provider is installed: `node_modules/@vitest` contains only `mocker` and `spy`. Measuring needs `@vitest/coverage-v8` in devDependencies, which is outside this run because `package.json` is not in scope. The 80% guideline is not evaluated for TODO-004. Recorded as TDR-004-OQ4.

## Edge Cases

Covered:
- Null and absent: a refresh for a session that already ended returns null with no refresh call (refresh.test.ts "returns null without refreshing when the session already ended"). A login call sends no Authorization header (client.test.ts "attaches the bearer token except on public auth calls").
- Empty: an empty 200 body maps to NON_JSON (client.test.ts "maps an empty 200 body to kind NON_JSON").
- Boundary: the 30-second timeout fires at exactly 30,000 ms under fake timers (client.test.ts "maps an abort after 30 seconds to kind TIMEOUT").
- Invalid: a non-JSON 200 body, an HTML 502 page, paths outside `/api/v1/` (including `/api/v1/../admin/users` and an absolute URL), a JSON error body that is not an object (errors.test.ts "ignores bodies that are not JSON objects, so no body text leaks"), and forbidden header names in development.
- Failure: network failure (NETWORK); a refresh 401 with an unrecognised code keeps the session; a network failure during refresh keeps the session; a token that already rotated causes no second refresh; a 401 on the retry logs out and does not loop.

Not exercised (non-blocking; see Open Questions):
- `/api/v1/auth/refresh` as an exempt path through `apiRequest` (no row in the exempt table).
- A refresh call that returns 401 with `UNAUTHORIZED`. The code clears the session on that code, and no test asserts it.
- A 401-triggered retry of a non-GET request (POST, PUT, PATCH, DELETE). The retry re-sends the same body with no `Idempotency-Key`, which is not on the header allow-list (TDR-004-OQ1).
- "No automatic retry" for failures other than 401 (for example 500 or NETWORK). The NETWORK test checks the kind only and does not count fetch calls.
- The forbidden-header refusal through the request path (see Case 7 note).
- Concurrent refresh across tabs. Only the Web Lock call and the no-lock fallback are checked, each with a stub.

## Mocking Strategy

- `fetch`: `vi.stubGlobal("fetch", ...)` with a `vi.fn` responder per test. Responders return `Response` objects. No network I/O.
- `navigator.locks`: a stub in `refresh.test.ts` with one queue that grants requests in order, used for the Web Lock case. `navigator` is replaced by `{}` for the fallback case.
- Time: `vi.useFakeTimers()` with `advanceTimersByTimeAsync(30_000)` for the timeout case only.
- Environment: `vi.stubEnv("DEV", false)` for the production header and logging checks. The default test run has `DEV` true, which the forbidden-header test relies on.
- Console: `console.error` is spied and silenced in `beforeEach`. The logging test asserts the content of its one call.
- Ordering: deferred promises hold the refresh until both concurrent 401s have arrived, so the single-flight case does not depend on timing.
- Cleanup: `afterEach` restores timers, env, globals and mocks. No test depends on state from another test.
- No module mocks. `client.ts` imports the real `refresh.ts` and `errors.ts`.

Determinism: both runs gave the same result. The only time-dependent path uses fake timers.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| TDR-004-OQ1 | Is a 401-triggered retry of a non-GET request (POST, PUT, PATCH, DELETE) intended? D3.1 retries the original request once, and the retry re-sends the same body with no `Idempotency-Key`. | `tech-stack-integration.md` (Idempotency Standards) requires idempotency for retryable writes. No test covers a write retry, so the checklist item is not evidenced by a test in this report. | A duplicate write is possible only if a 401 is returned after the server has processed the write. That is not expected for an auth rejection. | architect_frontend (decision); developer_frontend (test) | No | Open | Documented default: retry kept as TODO-004 specifies. The idempotency checklist item is not met by a test. The user should decide before approving this report. |
| TDR-004-OQ2 | ARCH-FE-001 v1.0 refresh-result rule (line 326) names two codes that clear the session: `SESSION_ENDED` and `INVALID_TOKEN`. `endsSession` in `refresh.ts` uses three (`AUTH_EXPIRY_CODES`, which adds `UNAUTHORIZED`). The boot rule (line 315) and the refresh-trigger rule (line 331) also use three. | Documentation inconsistency for architect_frontend. The code also clears the session on a refresh 401 with `UNAUTHORIZED`, and no test asserts that path. | Under the two-code reading of line 326, a refresh 401 with `UNAUTHORIZED` would keep the session. The code logs the user out. | architect_frontend (document correction) | No | Open | Documented default: the code follows the three-code set. |
| TDR-004-OQ3 | FE-OQ-18 (ARCH-FE-001 line 963): which 401 code does an expired access token return at the gateway and at auth-service? | The refresh trigger set is the documented default and has not been verified against a live stack. | The trigger set may differ on the live stack. This shows up only at integration. | architect_frontend; auth-service owner (architect_backend) | No | Deferred | Documented default: `UNAUTHORIZED`, `INVALID_TOKEN` and `SESSION_ENDED` trigger refresh. Verify with a live expired token before the first TODO-005 integration test. |
| TDR-004-OQ4 | Coverage is not measured: `@vitest/coverage-v8` is not installed. | The 80% guideline cannot be recorded for this TODO. | No coverage figure in the report. | user (decision to add a provider); developer_frontend | No | Open | Documented default: not measured in TODO-004. Adding the provider changes `package.json`, which is outside this run. |
| TDR-004-OQ5 | The D19 static source scan (no `localStorage` for auth data, no forbidden header strings in non-test source, no `dangerouslySetInnerHTML`) is not in the TODO-004 gate. | The scan is planned in TODO-017 (`src/test/static-rules.test.ts`). | None for TODO-004. The item must not be dropped. | developer_frontend | No | Deferred | Documented default: scheduled in TODO-017. |
| TDR-004-OQ6 | `vitest.config.ts` includes `src/**/*.test.ts` only. TODO-005, TODO-006 and TODO-007 add `.test.tsx` files. | Those files are skipped silently unless the include pattern is extended. | Component tests would not run. | developer_frontend | No | Open | Documented default: extend the include pattern in TODO-005, the first TODO that adds a `.test.tsx` file. TODO-008 already sets the DOM environment (OQ-P-01). |
| TDR-004-OQ7 | Which Node.js version does the team run, and what is the minimum? Carried from TDR-003-OQ1. This run used Node v26.4.0 and npm 11.17.0. | A machine outside the installed packages' engine ranges can fail `npm test`. | Test results may differ across machines. | user (decision); project_manager (record) | No | Open | Not decided. No default set here. |
| TDR-004-OQ8 | Test gaps listed under Edge Cases "Not exercised": the `/api/v1/auth/refresh` exempt row, a refresh 401 with `UNAUTHORIZED`, a non-GET retry, no retry on non-401 failures, and the forbidden-header refusal through the request path. | These strengthen the suite. None is a REQ-FE-050 gate case. | A defect in those paths would not be caught by this suite. | orchestrator (decides); developer_frontend (adds tests if decided) | No | Open | Documented default: no change to TODO-004 status. Add the tests in a follow-up build run if the orchestrator decides so. |

Blocking open questions: 0.
