---
id: UNIT-TEST-REPORT-TODO-024
title: Unit Test Report — TODO-024 Account states end the session and fixed login copy
owner: unit_test_writer
status: Approved
version: 1.6
last_updated: 2026-10-15 14:28
related_todo: TODO-024
execution_overall: PASS
source_requirements: [REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011, REQ-FE-012, REQ-FE-013]
related_artifacts: [TODO-024, ARCH-FE-001, ADR-004, CODE-REVIEW-TODO-024, QA-REPORT-TODO-024]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-024 Account states end the session and fixed login copy
Owner: unit_test_writer
Status: Approved
Version: 1.6
Last Updated: 2026-10-15 14:28
Source Requirements: REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011, REQ-FE-012, REQ-FE-013
Related Artifacts:
- output/plans/master-todo.md (TODO-024)
- ARCH-FE-001 v1.0.11 (REQ-FE-010, REQ-FE-011, REQ-FE-055, D4.2, D4.3, D4.4, D6.5, D13)
- ADR-004
- output/reports/code-review-report-TODO-024.md (M3, L9)
- output/reports/qa-report-TODO-024.md
- output/reports/unit-test-report-TODO-024.md v1.5 (superseded by this version, same file)

## At a Glance

- Version 1.6 covers two fixes in production: M3 (a refresh in flight when the session ends no longer stores its token) and L9 (a boot `me` 401 with any code ends the session). Five tests pin them. One more test was added by this run for the rejection rule (see Changes).
- Gate PASS: `npx tsc -b` exit 0, `npx eslint .` exit 0, `npx vitest run --passWithNoTests` exit 0. Full suite 78 files, 1057 of 1057 passed. The brief expected 1056; the extra test is the one added in this run.
- The four TODO-024 files: 98 of 98 passed (refresh 33, auth-provider 33, auth-messages 16, login-page 16). With change-password and route-guard: 124 of 124.
- Status is Approved (user approval 2026-10-15). M3 and L9 are closed. UT024-OQ6 accepted by the user. UT024-OQ7 (L7) is Low tech debt, not fixed. FE-OQ-46 is open for security_architect.

## Purpose

Record the scope, test cases, execution result, red evidence, edge cases and mocking for TODO-024, with traceability to REQ-FE-055, REQ-FE-010, REQ-FE-011 and ARCH-FE-001 v1.0.11. Version 1.6 records the M3 and L9 fixes and their tests.

## Scope

Under test (production, read only in this run; no production file changed):

- `src/lib/api/refresh.ts` (`endForError`, `accountEndReason`, `endSession(reason)`, `refreshAccessToken`, `runRefresh` with the end counter)
- `src/app/providers/auth-provider.tsx` (`endAndAnnounce`, `bootSession`, `refreshMe`, `completePasswordChange`)
- `src/features/auth/auth-notice.ts`, `auth-messages.ts`, `login-page.tsx` (through their tests)

Test files in TODO-024 file scope: `refresh.test.ts` (33), `auth-provider.test.tsx` (33), `auth-messages.test.ts` (16), `login-page.test.tsx` (16).

Out of scope: server enforcement of account codes and `SESSION_TERMINATED` (platform), end-to-end checks (QA), TODO-005 and TODO-006 suites (run in the full suite).

## Changes in v1.6 (from v1.5)

Test changes in this run: `src/lib/api/refresh.test.ts` only.

| Change | Where | Reason |
|--------|-------|--------|
| Added test "a refresh that rejects 401 after the session ended does not end it a second time" | `a refresh in flight when the session ends (TODO-024 M3)` | The rule "a refresh that rejects after the session ended skips `endForError`" had no test. It starts a refresh, calls `endSession()`, rejects the refresh with 401 `SESSION_ENDED`, and asserts the logout handler ran once, the promise rejects, and the token is null. |
| Added helper member `reject` on `deferred()` | top of file | Needed by the test above. |

Tests added by the implementer (confirmed present and asserting behaviour, not changed): 3 in `refresh.test.ts` for M3, 2 in `auth-provider.test.tsx` for L9. No test was removed. I did not run the new rejection test against a scratch copy without the rule, so it has no red evidence of its own; it is a regression pin.

## Test Cases

### M3: a refresh in flight when the session ends (`refresh.test.ts`)

Confirmed in the file. Each test asserts behaviour (return value and token state), not call internals.

| Test | Asserts | Result |
|------|---------|--------|
| endSession during a pending refresh: the late token T2 is not stored, the caller gets null | `pending` resolves `null`; `getAccessToken()` is null | Pass |
| a local end (`setAccessToken(null)`, as logout does) during a pending refresh: the late token T2 is not stored | `pending` resolves `null`; token null | Pass |
| a refresh that starts after the end still stores its token | refresh resolves `T2`; token is `T2` | Pass |
| a refresh that rejects 401 after the session ended does not end it a second time (added v1.6) | rejects with 401; logout handler called once; token null | Pass |

Discarded-refresh contract: when the session ends while a refresh runs, the refresh promise resolves `null` and the new token is not stored. The caller treats `null` as no session. Extra rule: a refresh that rejects after the session ended skips `endForError`, because the end was already announced and the token already cleared; the rejection still reaches the caller.

### L9: boot `me` 401 with any code (`auth-provider.test.tsx`)

Confirmed in the file, describe "boot me 401 with any code ends the session (D4.2, TODO-024 L9)":

| Test | Asserts | Result |
|------|---------|--------|
| a boot `me` 401 with a code outside the expiry codes (`SOME_CODE`) clears the token and is anonymous with no notice | status `anonymous` (held after `settle()`), token null, `peekPendingAuthNotice()` null | Pass |
| a boot `me` 401 with an expiry code that stays 401 after the refresh (`UNAUTHORIZED`) clears the token and is anonymous with no notice | same assertions | Pass |

### Carried forward (unchanged, all passing)

| Item | Requirement | Location | Result |
|------|-------------|----------|--------|
| Refresh 403 `ACCOUNT_NOT_ACTIVE` / `ACCOUNT_NOT_READY` clear token, handler once, reason | REQ-FE-055, D4.3 | refresh.test.ts | Pass |
| Refresh 403 other codes keep token | D6.5 | refresh.test.ts | Pass |
| Refresh 401 with any code (`SESSION_ENDED`, `INVALID_TOKEN`, `UNAUTHORIZED`, `SESSION_TERMINATED`, `TOKEN_EXPIRED`, unknown, non-JSON or empty body, account code) ends the session once with no reason | REQ-FE-010, D4.3 | refresh.test.ts | Pass |
| Boot account states (`me` and refresh 403) give `anonymous` with the notice; other 403 codes keep `error` | REQ-FE-055, D4.2 | auth-provider.test.tsx | Pass |
| Boot refresh 401 any code, and boot `me` 401 then refresh 401 reason-less (UT024-OQ5), give `anonymous`, one end, empty cache | REQ-FE-010, REQ-FE-011 | auth-provider.test.tsx | Pass |
| Boot CancelledError with no session end keeps `error`, no notice (test (b)) | REQ-FE-011 | auth-provider.test.tsx | Pass |
| Data 401 then refresh 401 `SESSION_TERMINATED`: cleared, anonymous, `/login`, no read error | REQ-FE-010, D4.4 | auth-provider.test.tsx | Pass |
| StrictMode boot `me` 403 ends once (M1); kept-session `me` 403 and chains (M2) | REQ-FE-055, D4.6 | auth-provider.test.tsx | Pass |
| Login 403 account codes show fixed copy with reference id; 400 `VALIDATION_FAILED` shows server message; one-time notice | REQ-FE-008, REQ-FE-009, D4.5, D4.11 | auth-messages.test.ts; login-page.test.tsx | Pass |

## Red Evidence

Implementer evidence (recorded as reported by the implementer; I did not re-run the pre-fix code in this run, and the pre-fix file is not in git because TODO-024 work is uncommitted): before the fix, 3 tests failed.

| Failed test (M3, `refresh.test.ts`) | Message |
|-------------------------------------|---------|
| endSession during a pending refresh: the late token T2 is not stored, the caller gets null | `expected 'T2' to be null` |
| a local end (`setAccessToken(null)`) during a pending refresh: the late token T2 is not stored | `expected 'T2' to be null` |
| one further M3 case, a token check after the session end | `expected 'test-access-token' to be null` |

Note on names: the implementer gave the messages (`'T2'` to be null twice; `'test-access-token'` to be null once) and the count of 3. The exact test name for the third (`'test-access-token'`) failure was not supplied. By the message, it is a test that holds the default test token, which is not the M3 `T1`/`T2` pair in `refresh.test.ts`. It is most likely an L9 boot test in `auth-provider.test.tsx`, where `TEST_ACCESS_TOKEN` is the kept token, but this is inference. If the user needs the name, the implementer supplies it.

After the fix: all five tests pass (gate run below).

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npx tsc -b`, `npx eslint .`, `npx vitest run --passWithNoTests` |
| Run at | 2026-10-15 14:27 (full gate re-run after the added test; the earlier run at 14:26 gave 1056 of 1056 before the test was added) |
| `tsc -b` | exit 0 |
| `eslint .` | exit 0 |
| Full suite | 78 files; 1057 tests; 1057 passed; 0 failed; 0 errors; 0 skipped; vitest exit 0 |
| Four TODO-024 files | 98 tests; 98 passed |
| Per file | refresh.test.ts 33; auth-provider.test.tsx 33; auth-messages.test.ts 16; login-page.test.tsx 16 |
| Change-password and route-guard | change-password-page.test.tsx 6; route-guard.test.tsx 20; 26 of 26 passed |
| Six files together | 124 of 124 passed |
| Overall | PASS |

Count note: v1.5 recorded 1051 (92 in the four files). The difference of 6 is 3 M3 tests, 2 L9 tests and 1 rejection-rule test added in this run.

## Execution Results

PASS: 124 of 124 tests passed in the six scoped files (four TODO-024 files plus change-password and route-guard). The full suite (78 files, 1057 tests) passed with exit 0. `tsc -b` and `eslint .` exit 0.

## Coverage

Coverage was not measured. The gate commands include no coverage report and no coverage provider is configured. The 80% guideline is not verified for TODO-024 scope. Behaviour coverage is recorded above.

## Edge Cases

- Refresh 401 with any code, including non-JSON or empty body and an account code: ends the session once, no reason.
- Boundary on status: 403 with an expiry code keeps the session; 403 with an account code ends it with its reason.
- Boot `me` 401 with any code (`SOME_CODE`, `UNAUTHORIZED` that stays 401 after refresh): `anonymous`, token cleared, no notice (L9).
- Boot: refresh 401 any code, and `me` 401 then refresh 401 reason-less, give `anonymous`. Boot CancelledError with no end keeps `error`.
- Refresh in flight at session end (M3): token discarded, caller gets `null`; a local end behaves the same; a refresh started after the end stores normally; a rejection after the end does not end the session twice.
- Duplicate delivery: StrictMode boot `me` account end runs once; kept-session end runs once and announces once.
- Not covered (UT024-OQ7 / L7): a cross-tab logout arriving during boot. Inference from code only, no test.
- Idempotency: not applicable; no retryable write in scope. Single-flight and single-end are asserted by call counts.

## Mocking Strategy

- HTTP: MSW server from `src/test/server`, handlers in `src/test/handlers/auth`; errors from `httpError`, `nonJsonError`, `networkError`.
- Refresh module: `deferred()` promise (now with `resolve` and `reject`) as the refresh function to hold a refresh in flight; `vi.fn` logout handler via `setLogoutHandler`; token read with `getAccessToken`; module state reset in `beforeEach`.
- Provider: `meRefusal(status, code)` for boot `me` errors; `endSession` wrapped for call counts; `handlerCalls` array.
- Web Locks stubbed with a single-queue stand-in; real jsdom `BroadcastChannel` with an observer; `console.error` spy asserting only the `"[api]"` transport label; `console.warn` silenced.
- One-time notice: real module state in `auth-notice.ts`, cleared in `beforeEach` and `afterEach`.

## Traceability

- REQ-FE-010 (refresh and logout): M3 tests, any-code refresh cases, boot refresh 401 cases.
- REQ-FE-011 (boot): L9 tests, boot end tests, test (b).
- REQ-FE-055 (account states): carried-forward account tests (unchanged).
- REQ-FE-008, REQ-FE-009: login copy and mapping tests. REQ-FE-012, REQ-FE-013: M2 tests.
- ARCH-FE-001 v1.0.11: D4.2, D4.3, D4.4, D4.11, D6.5.
- ADR-004: no ADR-specific behaviour under test.
- TODO: TODO-024.

## Mutation Testing

Not run. No mutation step in this run; red evidence is the implementer's, recorded above.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| UT024-OQ1 | Does the Approved status of v1.3 carry over to v1.6? | Test set and results changed | v1.6 is Pending Approval; the user approves it separately | user | No | Answered | Not carried over. |
| UT024-OQ2 (L5) | Is the login-page render of the pending notice after the kept-session `me` 401 then refresh 403 chain asserted? | Provider outcome verified; rendered notice not | Non-blocking | unit_test_writer | No | Deferred | Documented default: non-blocking; add a test if the user asks. |
| UT024-OQ3 (L6) | Should `classifyChangePasswordError` handle account codes, with a page test? | No account-code branch or page test | Non-blocking; session end is covered at provider level | user, developer_frontend | No | Deferred | Documented default: no change. |
| UT024-OQ4 | Why did 3 tests time out on the first full run of the v1.2 session? | Possible gate flake | No timeouts in the v1.3 to v1.6 gate runs | unit_test_writer | No | Deferred | Documented default: recheck on the next gate run. |
| UT024-OQ5 | Boot `me` 401 then refresh 401 reason-less: `anonymous` or `error`? | D4.2 step 3 | Closed in v1.5 by the fix and pinned by tests | user, unit_test_writer | No | Answered | Closed. |
| UT024-OQ6 | Does "any code" cover a non-JSON or empty-body 401? | Decision text vs implementation | Accepted by the user: a non-JSON 401 ends the session | user | No | Answered | Accepted by the user; implemented and tested as is. |
| UT024-OQ7 (L7) | Cross-tab logout arriving during boot: `anonymous` or the boot outcome? | The listener does not set the boot flag; the boot may then set `error` (inference, no test) | Low tech debt, not fixed in TODO-024; no test written | user, developer_frontend | No | Deferred | Documented default: current behaviour kept, registered as Low tech debt for project_manager. |
| UT024-OQ8 (L9) | Boot `me` 401 with any code ends the session | Previously a non-expiry code did not end it | Closed by the fix; two tests pin it | developer_frontend | No | Answered | Closed. |
| UT024-OQ9 (M3) | Refresh in flight at session end stored its token | A late token could resurrect an ended session | Closed by the fix; four tests pin it (three by the implementer, one rejection-rule test added here) | developer_frontend | No | Answered | Closed. |
| FE-OQ-46 | Does the server keep the access token valid after logout? | Client discard does not revoke a token | Outside the unit tests; no client test can verify it | security_architect | No | Open | Documented default: no client change. Owned by security_architect. |

Orchestrator note (no action by this agent): `master-todo.md`, `progress-tracker.md` and `orchestration-state.md` carry earlier test counts. They should be reconciled with v1.6 (1057 tests; 98 in the four files) and the M3, L9 closures. The L7 tech debt entry belongs to project_manager. This report does not change them.
