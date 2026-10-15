---
id: CODE-REVIEW-TODO-024
title: Code Review Report — TODO-024 Account states end the session and fixed login copy
owner: code_reviewer
status: Approved
version: 1.4
last_updated: 2026-10-15 14:35
source_requirements: [REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011]
related_artifacts: [TODO-024, ARCH-FE-001, ADR-004, UNIT-TEST-REPORT-TODO-024, QA-REPORT-TODO-024, FILE-PROVENANCE-REGISTER]
blocking_open_questions: 0
---

Title: Code Review Report — TODO-024 Account states end the session and fixed login copy
Owner: code_reviewer
Status: Approved
Version: 1.4
Last Updated: 2026-10-15 14:35
Source Requirements: REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011
Related Artifacts:
- TODO-024 (output/plans/master-todo.md)
- ARCH-FE-001 v1.0.11 (REQ-FE-010, REQ-FE-011, REQ-FE-055; D4.2 steps 3 and `me` 401 rule, D4.3, D4.4, D4.5, D4.6, D6.5, D13 ACCOUNT row)
- ADR-004
- output/reports/unit-test-report-TODO-024.md (v1.5, execution_overall: PASS)
- output/reports/qa-report-TODO-024.md
- output/plans/orchestration-state.md (2026-10-15 user decisions)
- output/plans/file-provenance-register.md (FP-013, FP-014, FP-026, FP-027, FP-079, FP-080, FP-081, FP-089)

## At a Glance

- Re-review (v1.4) of the M3 fix (end counter in `refresh.ts`) and the L9 fix (boot `me` 401 any code ends the session). Supersedes v1.3 (2026-10-15 14:13).
- Resolved since v1.3: M3 (`refresh.ts:55`, `:63` to `:66`, `:83` to `:87`, `:131` to `:153`) and L9 (`auth-provider.tsx:152` to `:156`). Carried resolved: M1, M2, UT024-OQ5.
- Open findings: Critical 0, High 0, Medium 0, Low 9 (L1 to L8 carried, L10 new). All non-blocking.
- Approval: Approved: Yes. The user still decides UT024-OQ6 (L8) and UT024-OQ7 (L7).

## Purpose

Records the v1.4 re-review of TODO-024 (M3 and L9 only) against REQ-FE-010, REQ-FE-011, REQ-FE-055, ARCH-FE-001 v1.0.11 (D4.2, D4.3, D4.4, D6.5, D13) and the 2026-10-15 user decisions in `orchestration-state.md`. The reviewer edited no code and no other artifact. This version replaces v1.3. Sections not named below are carried from v1.3 unchanged; line numbers in carried text may have moved by a few lines.

## Scope

Scope is the TODO-024 File scope, resolved against `file-provenance-register.md` (greenfield, `enforcement_mode: enforced`, enforcement `full`).

| Path | FP row | v1.3 result |
|------|--------|-------------|
| src/lib/api/refresh.ts | FP-013 | Reviewed. `endForError` matches D4.3 and the 2026-10-15 decisions. M3 found in `runRefresh`. |
| src/lib/api/refresh.test.ts | FP-014 | Reviewed. Any-code 401, non-JSON 401, account 403 and boundary tests present and passing. |
| src/app/providers/auth-provider.tsx | FP-026 | Reviewed. Boot flag, reset and notice rule correct. L7 (cross-tab logout during boot), L9 (boot `me` 401 keeps the token) found. L5 still applies. |
| src/app/providers/auth-provider.test.tsx | FP-027 | Reviewed. UT024-OQ5 cases (lines 896 to 921) pin the boot end. No test for a cross-tab logout during boot. |
| src/features/auth/auth-notice.ts | FP-081 | Reviewed. Four-value union, in memory. No change in this rework. |
| src/features/auth/auth-messages.ts | FP-080 | Reviewed. L1 and L6 still apply. |
| src/features/auth/auth-messages.test.ts | FP-079 | Reviewed. No regression. |
| src/features/auth/login-page.test.tsx | FP-089 | Reviewed. L2 still applies. |

Integration touchpoints (read only, not in File scope): `src/lib/api/client.ts` (unchanged; `isRefreshTrigger` at lines 154 to 162), `src/lib/api/errors.ts` (`nonJsonError` at lines 78 to 88, `isUnauthorized` at lines 104 to 106), `src/lib/query/invalidation.ts` (`clearAll` at lines 124 to 126), `src/features/auth/change-password-page.tsx` (unchanged; L6). None of these is in the git diff.

Not assessed: other 403 callers (D6.5 is unchanged for them); the data-call trigger codes (FE-OQ-18 is still open).

Evidence basis (v1.4): read-only run of `npx vitest run` on refresh.test.ts, auth-provider.test.tsx and src/features/auth at 14:29: 9 files, 126 tests, all passed. Source of the four scope files and `client.ts:131` to `:162` was read. Earlier basis: the current source of the eight files, the call path through `client.ts`, and `src/lib/query/invalidation.ts`. A read-only run of the four TODO-024 test files (`npx vitest run` on refresh, auth-provider, auth-messages and login-page) at 14:12: 4 files, 92 tests, all passed. This matches the unit test report v1.5 (92 of 92 in the four files). Type check and lint were not re-run by the reviewer; the unit test report records them. M3 and L7 come from reading the code. No test reproduces them, and they are marked as inferred where the effect depends on behaviour outside the code.

## Re-review of the boot rework

### UT024-OQ5 — resolved

`endAndAnnounce` sets `bootEndedRef` for every end (`src/app/providers/auth-provider.tsx:99` to `:109`; the flag is set at line 101). The boot resets it at the start of `bootSession` (line 139) and reads it in the outer catch (line 156). A refresh 401 with any code ends the session in `refresh.ts` (lines 145 to 152), and the boot then returns `anonymous`. The notice is stored only when a reason is passed (lines 102 to 104). The two UT024-OQ5 cases (`auth-provider.test.tsx:896` to `:921`) and the boot refresh 401 test (`:833` to `:852`) pass. The result matches the 2026-10-15 direction: any end during boot gives `anonymous`, and the notice is only for the two account reasons.

### StrictMode and retryBoot resets — checked

- StrictMode: the second run of the boot effect (`auth-provider.tsx:161` to `:169`) resets the flag at line 139 before the shared refresh settles, so both runs read the same end. The test at `auth-provider.test.tsx:583` to `:601` (one handler call, one announcement) passes.
- `retryBoot` (lines 171 to 174) calls `bootSession`, which resets the flag. The test at `:295` to `:318` passes.

### Notice only for the two account reasons — checked

The reasons come only from `accountEndReason` (`refresh.ts:88` to `:97`, which maps 403 `ACCOUNT_NOT_ACTIVE` and 403 `ACCOUNT_NOT_READY` through the map at lines 42 to 48). `endSession()` without a reason runs for any 401. `AuthNotice` (`auth-notice.ts:9` to `:10`) has the four values only.

### Non-boot paths — unchanged

Compared with HEAD, `login` (lines 178 to 193), `logout` (lines 197 to 200) and `completePasswordChange` (lines 222 to 236) are identical. `refreshMe` changed only by the M2 guard (line 213), accepted in v1.2.

### CancelledError paths — decision (a) accepted

Boot, `me` 401 then refresh 403 account code: `auth-provider.test.tsx:630` to `:655` ends the session once, shows `anonymous` with the notice, and records one announcement. Kept session, same chain: `:736` to `:769`. The user accepted the `CancelledError` residual as decision (a) on 2026-10-15. It is recorded as accepted behaviour, not as a finding.

## Findings

### Critical

None.

### High

None.

### Medium

None open.

**M3 (resolved in v1.4). `src/lib/api/refresh.ts:55`, `:63` to `:66`, `:83` to `:87`, `:131` to `:153`.**

- Fix: `endCount` is incremented by `endSession` and by `setAccessToken(null)`. `runRefresh` records the count at start (`:134`) and stores the token only when it is unchanged (`:139` to `:141`); otherwise it resolves `null`. A rejection after an end skips `endForError` (`:145`). Tests `refresh.test.ts:385` to `:437` cover endSession, local clear, no double end, and a refresh started after the end.
- Legitimate `setAccessToken(null)` during a refresh: callers are `endLocalSession` (logout, cross-tab signal, forced end), the login failure clear (`auth-provider.tsx:194`) and `endSession`. All are real ends, so discarding is correct. The login failure clear runs after `loadMe` has settled, so no refresh of that login is in flight. Logout then immediate login: the refresh started before the logout is discarded; login stores with `setAccessToken(token)`, which does not increment (`:64`); a refresh started after the login records the new count and stores. No legitimate store is lost.
- Discarded refresh returns `null`: `client.ts:141` to `:142` throws the original 401. Boot (`auth-provider.tsx:141` to `:142`) returns `anonymous`. A cross-tab logout during the boot refresh now gives `anonymous` (narrows L7 to the `me` stage).
- Single-flight and StrictMode: the second boot joins `inflight` (`refresh.ts:125`); one `runRefresh`, one `endForError`. The flag reset (`auth-provider.tsx:139`) runs before the shared promise settles. Test `auth-provider.test.tsx:583` to `:601` passes.
- `finally` guard: `inflight === run` (`:150`) clears only its own promise; the callback runs after `run` is assigned. `run` always settles, so `inflight` cannot stay stuck. Residual: L10.
- Status: Resolved.

### Low

**L1 to L6 (carried from v1.2).** See the status table below.

**L7 (UT024-OQ7). `src/app/providers/auth-provider.tsx:115`, `:288` to `:290`, `:89` to `:93`, `:153` to `:157`, `:164`: a cross-tab logout that arrives while the boot is in flight gives the error screen, not the login page.**

- Trace (inferred from the code; no test): the listener calls `endLocalSession` (lines 89 to 93), which sets `anonymous` at line 92 and clears the cache with `applyInvalidation(logout)`, which calls `queryClient.clear()` (`invalidation.ts:124` to `:126`). The in-flight boot `me` is then cancelled, so `loadMe` rejects with a `CancelledError`. This relies on TanStack Query cancelling a query when it is removed; the test at `auth-provider.test.tsx:656` to `:691` simulates the same rejection with `cancelQueries`. The boot catch (lines 153 to 157) reads `bootEndedRef` (line 156), which the listener never sets, so `bootFailureView` (lines 276 to 280) returns `error`. Line 164 then replaces the `anonymous` view with `error`.
- Note against the 2026-10-15 direction: the direction says "any `endSession` during boot gives `anonymous`". The cross-tab path does not call `endSession` (it calls `endLocalSession`), so the direction may not cover it. The user decides.
- If the refresh is still in flight when the signal arrives, M3 applies instead.
- Impact: UI only. The tab shows the error screen with retry, not the login page. The token stays `null` in this sub-case.
- Not fixed, per the instruction. No test exists. Options: set `bootEndedRef` on the listener path, or treat a `CancelledError` during boot as `anonymous`. Either needs a boot test.
- Status: Open. User decision needed (`anonymous` or keep the error view).

**L8 (UT024-OQ6). `src/lib/api/refresh.ts:145` to `:152` (`isUnauthorized` at line 149, `endSession()` at line 150); `src/lib/api/errors.ts:78` to `:88` and `:104` to `:106`: a refresh 401 with an empty or non-JSON body ends the session with no reason. The user must confirm this.**

- Verified: `nonJsonError` keeps `status` 401 (`errors.ts:82` to `:87`), and `isUnauthorized` checks the status only (`:104` to `:106`). So a NON_JSON 401 from the refresh call ends the session with no reason. `refresh.test.ts:168` to `:181` pins it.
- On a data call, `isRefreshTrigger` (`client.ts:154` to `:162`) requires kind HTTP, so a non-JSON 401 on a data call does not refresh and does not change the session.
- Reading: the 2026-10-15 decision says "any error code". A response with no code is covered by the broad reading, and the implementation follows it. An intermediate proxy that returns 401 on the refresh endpoint would log the user out. That is the conservative outcome.
- Status: Open. The user confirms, or asks for a change. If the user narrows the rule to HTTP 401 only, change `endForError` and `refresh.test.ts:168` to `:181` together.

**L9 (resolved in v1.4). `src/app/providers/auth-provider.tsx:152` to `:156`.**

- Fix: a boot `me` error that is a 401 (any code) calls `endSession()` while a token is held; the account 403 codes pass their reason. Tests `auth-provider.test.tsx:923` to `:947` pin the token cleared, `anonymous`, no notice. ARCH-FE-001 v1.0.11 D4.2 states the rule.
- Guard `getAccessToken() !== null`: the token is null only after a prior end (refresh 401/403 inside the transport, cross-tab signal, StrictMode first run). In each case the session already ended and was announced, so skipping is correct. No case found where the session should end and is skipped. One related case, a cross-tab logout cancelling `me`, is L7 (the view), not a skipped end.
- Status: Resolved.

**L10 (new). `src/lib/api/refresh.ts:125`, `:149` to `:151`: after an end, `inflight` still points at the discarded refresh until it settles, so a caller in that window joins it and gets `null`.**

- Trace (inferred; no test): logout (or a cross-tab signal) during a refresh, then a login, then a 401 on a data call before the old request settles. `refreshAccessToken` returns the stale `inflight` (`:125`) before the `accessToken !== sentToken` check, the promise resolves `null`, and `client.ts:142` throws the original 401 instead of refreshing.
- Impact: low. The window is the length of one refresh request. The user retries and the next call refreshes normally. No token is wrongly stored.
- Recommendation (developer_frontend, optional): clear `inflight` when the counter changes (in `endSession` and `setAccessToken(null)`), or compare the counter at join time. Add a `refresh.test.ts` case.
- Status: Open, non-blocking.

## Checks Passed (no finding)

- REQ-FE-010 and D4.3, refresh 401 with any code: `refresh.ts:145` to `:152` ends the session once, with no reason. Tests at `refresh.test.ts:106` to `:144`, `:146` to `:166`, `:289` to `:307`.
- REQ-FE-055, refresh 403 account codes: `refresh.ts:42` to `:48` and `:88` to `:97`, with the reason passed at `:147`. Tests at `refresh.test.ts:208` to `:253` and `:361` to `:380`.
- Other failures keep state: other 403 codes (`refresh.test.ts:255` to `:287`, `:333` to `:348`), network failure (`:183` to `:194`). The same branch leaves 5xx and timeout failures untouched. No test covers a refresh 5xx or timeout; this is optional.
- Single-flight and the lock: `refresh.ts:114` to `:122` and `:154` to `:158` are unchanged. Tests at `refresh.test.ts:46` to `:103`.
- `AUTH_EXPIRY_CODES` (`refresh.ts:25` to `:29`) only triggers a data-call refresh, and `client.ts` is unchanged (not in the git diff).
- Boot ends once: M1 guard at `auth-provider.tsx:153`. Test at `:583` to `:601` passes.
- Notice text: `noticeText` (`auth-messages.ts:103` to `:115`) is an exhaustive switch. Account copy is fixed and never the server `message` (`auth-messages.ts:118` to `:122`, `:136` to `:142`).
- Security: no token or server text in the changed code. `logApiError` (`client.ts:300` to `:309`) is unchanged. The notice stays in memory (`auth-notice.ts`).
- Standards: named exports; explicit return types on exported functions (`accountEndReason`, `endForError`, `refreshAccessToken`); no `any` in the eight files as read; comments explain why.

## Finding Status (v1.2 baseline, updated in v1.4)

| ID | Finding | Status | Evidence |
|-----------|---------|----------------|----------|
| M1 | `me` account end runs twice under StrictMode | Resolved | `auth-provider.tsx:149` to `:150`; test `:583` to `:601` passes |
| M2 | Kept-session `me` account failure does not end the session; the `me` 401 then refresh 403 path ends twice | Resolved on both paths. Path (a) accepted as decision (a), 2026-10-15 | `auth-provider.tsx:213`; tests `:630` to `:655`, `:736` to `:769`, `:770` to `:804` pass |
| UT024-OQ5 (raised after v1.2) | Boot refresh 401 with a reason-less code should give `anonymous` | Resolved by the boot flag (`auth-provider.tsx:101`, `:139`, `:156`); tests `:896` to `:921` pass | Section "UT024-OQ5 — resolved" above |
| L1 | Two account-code maps; silent default in `accountMessage` | Open, unchanged | `auth-messages.ts:46` to `:49`, `:118` to `:122`; `refresh.ts:42` to `:48` |
| L2 | Auth test imports tenants copy | Open, unchanged | `login-page.test.tsx:13` to `:15`, `:296` to `:297`, `:332` |
| L3 | Status records disagree on the version under review | Open, changed. The gate in `orchestration-state.md` is recorded against Unit Test Report v1.3 (1043 tests). Report v1.5 is Pending Approval (1051 tests, 92 in the four files) and records the UT024-OQ5 closure. `progress-tracker.md` still cites v1.3 and 1043 | `orchestration-state.md` (2026-10-15 entries); `progress-tracker.md`; `unit-test-report-TODO-024.md` v1.5 |
| L4 | Tech-debt note with no register entry | Open, unchanged. `output/plans/` lists no `tech-debt-register.md` | `master-todo.md` TODO-024 note; `output/plans/` listing |
| L5 | Login `me` 401 then refresh 403 leaves a pending notice | Open, unchanged | `auth-provider.tsx:187` to `:190` (`setAccessToken(null)` at `:188`); `login-page.tsx:49` to `:54` |
| L6 | Change-password classifier has no account branch; no page test | Open, unchanged. The `CancelledError` residual of path (a) is accepted; the page-level check remains open | `change-password-page.tsx:76` to `:90` (unchanged); `auth-messages.ts:192` to `:209` |
| L7 (new) | UT024-OQ7: cross-tab logout during boot gives the error view | Open. User decision needed | Section L7 above |
| L8 (new) | UT024-OQ6: non-JSON 401 on refresh ends the session with no reason | Open. User confirms | Section L8 above |
| L9 | Boot `me` 401 with a non-trigger code keeps the token | Resolved in v1.4 | `auth-provider.tsx:152` to `:156`; tests `:923` to `:947` |
| M3 | End during an in-flight refresh is overwritten by the refresh result | Resolved in v1.4 | `refresh.ts:55`, `:134` to `:147`; tests `refresh.test.ts:385` to `:437` |
| L10 (new) | A caller after an end can join the discarded in-flight refresh | Open, non-blocking | Section L10 above |

## Recommendations

1. L7 and L8 (user): decide the direction. L8 needs the user's explicit confirmation before it can close.
2. L10 (developer_frontend, optional): drop the stale `inflight` on an end, with a test.
3. FE-OQ-46 (security_architect): confirm whether auth-service rejects an access token after logout. The FE clears the token on every end.
4. L5 and L6 (developer_frontend): clear the pending notice on the login path, and return early in the change-password catch when the session has ended. Add the page tests. Non-blocking.
5. L1, L2, L4 (developer_frontend, unit_test_writer, project_manager): at their discretion. Non-blocking.
6. L3 (orchestrator, project_manager): record the gate and the progress tracker against Unit Test Report v1.5, and record the UT024-OQ5 closure, so the state file and the source artifacts agree.
7. The reviewer did not edit code. The vitest run was read-only.

## Approval Status

Approved: Yes

- Critical open: 0. High open: 0. Medium open: 0. Low open: 9 (L1 to L8, L10). All are non-blocking.
- M1, M2, M3, L9 and UT024-OQ5 are resolved. M2 path (a) is accepted as decision (a), 2026-10-15.
- This is the reviewer's decision on the code. It is not approval of ARCH-FE-001 v1.0.11 (approved by the user 2026-10-15) or of the TODO.
- Report status is Approved (user approval 2026-10-15).

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Is `GET /api/v1/auth/me` answered with 401 (not 403) for a suspended account in the window before the refresh? ARCH-FE-001 states this only for data requests (FE-OQ-45). | Was the question behind the M2 path (a) reachability | Both paths are guarded, so the answer does not change the outcome of this review | architect_backend, architect_frontend | No | Deferred | Documented default: both paths are guarded; the answer is needed only for the architecture record |
| OQ2 | Must M2 path (a) be fixed before Checkpoint C sign-off? | Sets the sign-off condition | None for approval | user | No | Answered | Answered by the user 2026-10-15, decision (a): accepted as is. The `CancelledError` residual is noted under L6. |
| OQ3 | UT024-OQ6: does "any error code" include an empty or non-JSON 401 on the refresh call? | Decides whether a proxy 401 logs the user out | L8 outcome; the non-JSON test and `endForError` change together if the answer is no | user | No | Open | Documented default: the session ends with no reason, as implemented and tested |
| OQ4 | UT024-OQ7: should a cross-tab logout during boot give `anonymous` or keep the boot outcome? | Decides L7 | Possible error view instead of login for a tab open during another tab's logout | user (decision), developer_frontend (change) | No | Open | Documented default: keep current behaviour; no change in this review |
| OQ5 | M3: should the end-during-refresh race be fixed in the next `/build`? | Was the timing of the fix | None | user | No | Answered | Fixed in this build; resolved in v1.4 |
| OQ6 | L9: what is the outcome of a boot `me` 401 with a non-trigger code? | D4.2 did not state it | None | architect_frontend | No | Answered | ARCH-FE-001 v1.0.11 D4.2: token removed, `anonymous`, no notice; implemented |
| OQ7 | FE-OQ-18: which 401 code does an expired access token return to a data call? | Codes outside `AUTH_EXPIRY_CODES` give no refresh (`client.ts:154` to `:162`) | If the gateway uses another code, a data call does not refresh and the session stays | architect_frontend, auth-service architect_backend | No | Deferred | Documented default: `UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED` per ARCH-FE-001 D4.4 |

Blocking open questions: 0
