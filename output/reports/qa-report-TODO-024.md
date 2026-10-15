---
id: QA-REPORT-TODO-024
title: QA Report — TODO-024 Account states end the session and fixed login copy
owner: qa
status: Approved
version: 1.4
last_updated: 2026-10-15 14:33
source_requirements: [REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011]
related_artifacts: [TODO-024, ARCH-FE-001, ADR-004, CODE-REVIEW-TODO-024, UNIT-TEST-REPORT-TODO-024, FILE-PROVENANCE-REGISTER]
blocking_open_questions: 0
---

Title: QA Report — TODO-024 Account states end the session and fixed login copy
Owner: qa
Status: Approved
Version: 1.4
Last Updated: 2026-10-15 14:33
Source Requirements: REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011
Related Artifacts:
- TODO-024 (output/plans/master-todo.md)
- ARCH-FE-001 v1.0.11 (REQ-FE-010, REQ-FE-011, REQ-FE-055; D4.2 me 401 rule, D4.3, D4.4, D6.5, D13 ACCOUNT row)
- ADR-004 (ADR-FE-04)
- output/reports/code-review-report-TODO-024.md (v1.4, Approved: Yes, 0 Critical, 0 High, 0 Medium, 9 Low)
- output/reports/unit-test-report-TODO-024.md (v1.6, execution_overall: PASS)
- output/plans/file-provenance-register.md (FP-013, FP-014, FP-026, FP-027, FP-079, FP-080, FP-081, FP-089)

## At a Glance

- Re-check of the M3 fix (end counter in `refresh.ts`) and the L9 fix (boot `me` 401 with any code ends the session), against REQ-FE-010, REQ-FE-055 and ARCH-FE-001 v1.0.11 (D4.2, D4.3). Verified by reading the code, running the named tests, running the gate and a scratch probe.
- Gate green: `npx tsc -b` exit 0, `npx eslint .` exit 0, `npx vitest run --passWithNoTests` 78 files, 1057 tests passed, 0 failed (expected 78 and 1057).
- M3: Resolved. L9: Resolved. The reported failure still passes. M1, M2, fixed login copy, other 403 codes and the data-call 401 expiry path hold.
- Open: Critical 0, High 0, Medium 0, Low 8 tracked by QA (L5, L6, L7, L8, L10, QA-L1, plus carried L1 to L4 per the code review).
- Recommendation: **Go**.

## Purpose

Re-verify TODO-024 after the rework for M3 and L9. This version supersedes QA v1.3 for sign-off. Sections not named below are carried from v1.3 unchanged.

## Scope

Scope is the TODO-024 File scope resolved against `file-provenance-register.md` (greenfield, `enforcement_mode: enforced`, enforcement `full`).

| Path | FP row | Verified in this re-check |
|------|--------|---------------------------|
| src/lib/api/refresh.ts | FP-013 | End counter, discard of a late token, no double end |
| src/lib/api/refresh.test.ts | FP-014 | Four M3 cases (lines 385 to 437) |
| src/app/providers/auth-provider.tsx | FP-026 | Boot `me` 401 any code (lines 149 to 156), boot flag, StrictMode |
| src/app/providers/auth-provider.test.tsx | FP-027 | Two L9 cases (lines 923 to 947), reported-failure case (line 853) |
| src/features/auth/auth-messages.ts, auth-messages.test.ts, auth-notice.ts, login-page.test.tsx | FP-080, FP-079, FP-081, FP-089 | Regression only (no change in this round) |

Read only: `src/lib/api/client.ts` (`isRefreshTrigger`), `src/lib/api/errors.ts`, `src/lib/query/invalidation.ts`. Not assessed: FE-OQ-18 (data-call trigger codes, open in ARCH-FE-001).

## Test Results

| Check | Command or source | Result |
|-------|-------------------|--------|
| Type check | `npx tsc -b` | Exit 0 |
| Lint | `npx eslint .` | Exit 0 |
| Full suite | `npx vitest run --passWithNoTests` | 78 files, 1057 passed, 0 failed |
| M3 scratch probe (copy of `refresh.ts` and `errors.ts` in the scratchpad, outside the repository) | Start refresh with T1, `endSession()`, `setAccessToken("T3")` (a login), resolve the late refresh with T2 | Passed: caller gets null, token stays T3 |

- Passed: 1057 of 1057 in the repository suite; 2 of 2 scratch probes.
- Failed: 0.
- Blocked: 0.
- Flaky: none in this run.

## Behaviour Verification

| Check | Evidence | Result |
|-------|----------|--------|
| M3: `endSession` during a pending refresh; late token not stored, caller gets null | `refresh.ts`: `endCount` is incremented by `endSession` and by `setAccessToken(null)`; `runRefresh` records `startedAt` and returns null without storing when `endCount !== startedAt`. Test `refresh.test.ts` line 386 | Pass |
| M3: local end (`setAccessToken(null)`, as logout does) during a pending refresh | `refresh.test.ts` line 399 | Pass |
| M3: a late 401 rejection after an end does not end the session a second time | `refresh.test.ts` line 412 (one handler call, token null) | Pass |
| M3: a refresh started after the end still stores its token | `refresh.test.ts` line 428 | Pass |
| M3: logout, then immediate login while the old refresh is pending | Login calls `setAccessToken(token)` with a non-null value, so it does not move the counter; the late T2 is discarded by the counter and cannot overwrite T3. Scratch probe: caller null, token T3. No repository test (see QA-L1) | Pass (probe) |
| L9: boot `me` 401 with a code outside `AUTH_EXPIRY_CODES` removes the token, gives `anonymous`, no notice | `auth-provider.tsx` lines 149 to 156 (`isUnauthorized(error)` calls `endSession()` when a token is held); test line 924 | Pass |
| L9: boot `me` 401 with an expiry code that stays 401 after the transport refresh | Test line 936 (token null, `anonymous`, no notice) | Pass |
| L9: StrictMode ends once | The first boot run clears the token; the second skips the end because `getAccessToken() === null`. Existing StrictMode case (line 583) still passes; no StrictMode case for the `me` 401 specifically (see QA-L1) | Pass (code and existing case) |
| Reported failure: data call 401, refresh 401 `SESSION_TERMINATED`: session ends once, cache cleared, `/login` redirect, no generic read error | `auth-provider.test.tsx` line 853 | Pass |
| Boot refresh 401 `SESSION_TERMINATED`: anonymous, no notice, one end | Line 833 | Pass |
| M1: one end under StrictMode for a boot `me` 403 account code | Line 583 | Pass |
| M2: kept-session `me` 403 account codes end the session and reject; path (a) accepted | Lines 694, 716, 736, 770 | Pass |
| Fixed login copy for both account codes, server message not shown, `VALIDATION_FAILED` still shows the server message | `auth-messages.test.ts`, `login-page.test.tsx` | Pass |
| Other 403 codes keep the session (refresh and `me`) | `refresh.test.ts`, `auth-provider.test.tsx` lines 805, 612, 621 | Pass |
| Data-call 401 expiry path unchanged | `client.ts` not in the working-tree diff; trigger codes still start a refresh | Pass |

## Defects

### Critical

None.

### High

None.

### Medium

None. M3 is resolved (see Behaviour Verification).

### Low

- **L10 (new, from the code review v1.4; confirmed by trace)**: `refresh.ts` `refreshAccessToken` returns the existing `inflight` promise before the token comparison. After an end, `inflight` still points at the discarded refresh until it settles. A caller in that window (logout or cross-tab end, then login, then a data call 401 before the old request settles) joins it, gets null, and `client.ts` throws the original 401 instead of refreshing. Window is one refresh request; no token is wrongly stored; the next call refreshes normally. Open, non-blocking. Not fixed by QA.
- **L7 (UT024-OQ7)**: a cross-tab logout that arrives during boot shows the error view, not the login page (`endLocalSession` does not set `bootEndedRef`). Recorded. User decision: Low tech debt, not fixed.
- **L5**: login path, `me` 401 then refresh 403 leaves a stale account notice shown on the next login-page mount. Open, non-blocking.
- **L6**: the change-password classifier has no account-code branch and no test. Open, non-blocking.
- **L8 (UT024-OQ6)**: a refresh 401 with an empty or non-JSON body ends the session with no reason. Open, user confirmation.
- **QA-L1**: test gaps. No repository test for logout then immediate login with a pending refresh (verified by the scratch probe only), none for a StrictMode boot `me` 401 end, none for L7, none for L10. Non-blocking.
- L1 to L4 are carried from the code review and are not re-assessed here. L3 is a record issue (state and tracker cite older unit test report versions; see OQ6).
- L9 is resolved and removed from the open list.

Open questions to note without action: FE-OQ-46 (does auth-service accept an access token after logout; ARCH-FE-001 v1.0.11, security_architect, non-blocking, default: the FE clears the token on every end and does not rely on server rejection). With M3 fixed, the FE no longer restores a token after an end, so FE-OQ-46 no longer drives a defect severity.

## Risk Assessment

- Reported failure: closed. A refresh 401 with any code ends the session; tests use the exact response.
- M3: closed. The window that left a live token after an end is gone for both end paths (`endSession`, `setAccessToken(null)`). A refresh started after an end is unaffected.
- L9: closed. A boot `me` 401 with any code leaves no token in memory and shows no notice.
- Residual: L10 (one-request window, user retries), L7 (UI only, user decision), L8 (conservative logout on a proxy 401), L5, L6, QA-L1. All Low.
- Overall residual risk: Low.

## Release Recommendation

**Go.**

Basis: no unresolved Critical, High or Medium defect; gate green (tsc, eslint, 1057 tests in 78 files); M3 and L9 fixed with named tests; the reported failure and the earlier behaviour (M1, M2, login copy, other 403 codes, data-call 401 expiry) still pass.

Optional follow-ups, none blocking: L10 (drop the stale `inflight` on an end, with a test, developer_frontend); close QA-L1 with a logout-then-login test. L7 stays as Low tech debt by user decision.

This is QA's assessment. It is not approval of the TODO, of ARCH-FE-001, or of the release. Those belong to the user.

## Traceability

- TODO-024 (`output/plans/master-todo.md`): REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011.
- ARCH-FE-001 v1.0.11: D4.2 (boot `me` 401 rule), D4.3, D4.4, D6.5, D13 ACCOUNT row; FE-OQ-46 open, non-blocking.
- ADR-004 (ADR-FE-04).
- Code review: `output/reports/code-review-report-TODO-024.md` v1.4.
- Unit test report: `output/reports/unit-test-report-TODO-024.md` v1.6 (PASS).
- File provenance: FP-013, FP-014, FP-026, FP-027, FP-079, FP-080, FP-081, FP-089.

## Changes from v1.3

- Gate re-run: `tsc -b`, `eslint .`, `vitest run` (78 files, 1057 tests).
- M3 and L9: Resolved and verified.
- Added L10; L7 recorded as user-decided Low tech debt; FE-OQ-46 recorded.
- Release recommendation stays Go; the sign-off condition on M3 is cleared.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | M3: fix before sign-off or record as debt? | Sign-off condition | None | user | No | Answered | Fixed and verified in v1.4 |
| OQ2 | UT024-OQ6 (L8): does "any error code" include an empty or non-JSON 401 on refresh? | Decides whether a proxy 401 logs the user out | Refresh 401 behaviour | user | No | Open | Documented default: session ends with no reason, as implemented and tested |
| OQ3 | UT024-OQ7 (L7): cross-tab logout during boot | UI only | Error view instead of login page | user | No | Answered | User decision: Low tech debt, not fixed |
| OQ4 | L9: outcome of a boot `me` 401 with a non-trigger code | D4.2 gap | None | architect_frontend | No | Answered | ARCH-FE-001 v1.0.11: token removed, anonymous, no notice; implemented and tested |
| OQ5 | FE-OQ-46: does auth-service accept an access token after logout or session end? | Whether the FE may rely on server rejection | None for severity now | security_architect | No | Open | Documented default: the FE clears the token on every end and does not rely on server rejection |
| OQ6 | Records out of step: orchestration state and progress tracker may cite older unit test report versions; the report on disk is v1.6 (1057 tests) | Gate records must agree before sign-off (fail closed) | Record consistency only | orchestrator, project_manager | No | Open | Documented default: update the records to v1.6 |

Blocking open questions: 0
