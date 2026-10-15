---
id: QA-TODO-022
title: QA Report TODO-022
owner: qa
status: Approved
version: 1.1
last_updated: 2026-10-14 10:25
source_requirements: [REQ-FE-052, REQ-FE-053, REQ-FE-032, REQ-FE-008, REQ-FE-018]
related_artifacts: [TODO-022, ARCH-FE-001 v1.0.7, ADR-002, ADR-003, ADR-005, CODE-REVIEW-TODO-022 v1.1, unit-test-report-TODO-022 v1.2]
blocking_open_questions: 0
---

Title: QA Report TODO-022 (Sesi aktif ditangguhkan dan teks tetap untuk penolakan guard)

Owner: qa

Status: Approved

Version: 1.1

Last Updated: 2026-10-14 10:25

Source Requirements:
- REQ-FE-052, REQ-FE-053, REQ-FE-032, REQ-FE-008, REQ-FE-018

Related Artifacts:
- TODO-022 (`output/plans/master-todo.md`), ARCH-FE-001 v1.0.5 (D4.10, D13.1; still in force at v1.0.6), ADR-002, ADR-003, ADR-005
- `output/reports/code-review-report-TODO-022.md` (Approved, 0 Critical/High, 1 Medium, 5 Low)
- `output/reports/unit-test-report-TODO-022.md` (PASS)

## At a Glance

- Verifies TODO-022: other-account sessions suspended behind `OTHER_ACCOUNT_SESSIONS_ENABLED = false`; fixed Indonesian copy for guard refusals and unrecognised 409/503 on Tim IT pages.
- Recommendation: Go (v1.1 re-check). No Critical, High or Medium defect open; M1 and L2 closed; low cosmetic items remain.
- Not verified live: real error bodies, SP-BG-14 contract, server-side guards (see Scope Tested).

## Re-check v1.1 (rework, 2026-10-14 10:25)

Scope: rework only (review M1, L2/OQ2, ARCH-FE-001 v1.0.7). `src/components/ui/sidebar.tsx` is unrelated and out of scope.

- M1 closed: `OwnSessionsLink` in `user-detail-page.tsx` renders `AppLink to="/account/sessions"`. `user-detail-page.test.tsx` queries role "link" (name "Lihat sesi saya") and asserts no button of that name.
- L2/OQ2 closed: `guard-failure.ts` maps 403 `ROLE_GUARD_VIOLATION` on role context to the fixed role copy; account context falls through. Tests: `guard-failure.test.ts` (role only, 409 does not match), `role-screens-gaps.test.tsx` (403 table row; role detail delete: fixed copy, reference id shown, server text hidden, edit and delete disabled), `role-detail-page.test.tsx` (edit refusal).
- ARCH-FE-001 v1.0.7 consistent with code: REQ-FE-053, D13.1 row and test requirement match; own-account entry confirmed as a link.
- Unit Test Report v1.2: `execution_overall: PASS`. QA re-ran once: `tsc -b` exit 0; `eslint .` exit 0; `vitest run --passWithNoTests` 78 files, 1001 tests passed, 0 failed (whole tree, includes TODO-023).
- Live-backend items under Scope Tested remain unverified (OQ1, OQ3).

## Purpose

Verify the delivered behavior of TODO-022 against the requirements and ARCH-FE-001 v1.0.5.

## Scope

TODO-022 only: FP-238 to FP-252. Greenfield, enforcement `enforced`. Stack standards: standards-frontend and tech-stack-frontend, plus tech-stack-security and tech-stack-integration. The working tree also holds TODO-023 changes; they are reported in `qa-report-TODO-023.md`.

## References

- Gate runs executed by QA on 2026-10-14 (whole working tree): `tsc -b` exit 0; `eslint .` exit 0; `vitest run --passWithNoTests` 78 files, 994 tests passed, 0 failed.
- Code read by QA: `shared/guard-failure.ts`, `users/access.ts`, `users/user-detail-page.tsx`; grep of `src` for sessions module users and for the nine ARCH strings.

## Scope Tested

Static and automated verification plus code reading. QA had no access to the live backend.

Not verified live (cannot be verified from this repository):
- Real error bodies: that the server returns exactly these `status` and `code` pairs (`SELF_ACTION_NOT_ALLOWED`, `LAST_SYSTEM_PRINCIPAL`, `SYSTEM_ROLE_IN_USE`, `SERVICE_UNAVAILABLE`, `PLATFORM_ROLE_PROTECTED`), and that `correlationId` is present. Tests use MSW fixtures built from the architecture.
- SP-BG-14: the contract of `/api/v1/system-users/{id}/sessions` (Open). The flag stays `false`, so the endpoint is never called; the future contract is untested.
- Server-side guards (self action, last system principal, role in use, protected role): backend, outside this repository (SP-BG-13).
- Visual rendering, keyboard order and screen reader behaviour of the new own-account card in a browser.

## Test Results

Passed:
- Gates: tsc -b, eslint ., vitest (994/994).
- AC1 `OTHER_ACCOUNT_SESSIONS_ENABLED` is one exported constant, `false`, comment cites SP-BG-14 (code `access.ts`).
- AC2 `canViewUserSessions` and `canForceLogout` require the flag (code; `access.test.ts`).
- AC3 No "Sesi aktif" tab and no force logout for another account; no request to either sessions endpoint: only `user-detail-page.tsx` imports `UserSessionsTab`, rendered only when `showSessions` (flag-gated); test "Sesi aktif suspended" asserts no request. `user-sessions-tab.tsx` and `lib/api/modules/sessions.ts` kept.
- AC4 Own account shows a control to `/account/sessions` (test passes; see M1 on semantics). `features/auth/sessions-page.tsx` not changed.
- AC5 REQ-FE-053 strings: all nine strings (six D13.1 rows, conflict copy, plus 503 reuse) found verbatim in ARCH-FE-001 and in `guard-failure.ts`.
- AC6 Mapping by status plus code only; look-alike message text does not change the result; wrong status falls through; correlation id kept, including null; HTTP error with null status gives the generic message with reference id.
- AC7 Guard-code coverage matrix (6 rows + unknown 409 + unknown 503 = 8 cases per page; 7 listed in the unit report as rows plus unknowns):

| Page group | Covered by | Result |
|------------|-----------|--------|
| Account: status change, reset password, role dialog | `user-detail-page.gaps.test.tsx` | Pass |
| Account: delete block | present in the unit report for TODO-022; removed later by TODO-023 (see that report) | Pass (superseded) |
| Account list: create dialog, row actions | `user-list-page.test.tsx`, `user-list-page.gaps.test.tsx` | Pass |
| Role: list delete, detail delete, edit form, create form, permission replace | `role-screens-gaps.test.tsx`, `role-list-page.test.tsx`, `role-detail-page.test.tsx` | Pass |
| Mapper units | `guard-failure.test.ts` | Pass |

- AC8 `PLATFORM_ROLE_PROTECTED` gives role copy on role pages and account copy on account pages.
- AC9 `SYSTEM_USER_LOGIN_EXISTS` and `SYSTEM_ROLE_KEY_EXISTS` keep their own field handling (`OWN_HANDLING_CODES`; tests).
- AC10 Tenant behaviour unchanged: `git status` shows no change in `src/features/tenants/create/write-failure.ts` or tenant production code; only `tenant-create-page.test.tsx` (test 3b) is modified. `guard-failure.ts` is imported only by `user-failure.ts` and `role-failure.ts` (static callers test).
- AC11 `isRoleRefusal` still marks the role refused; only the text changed.
- AC12 Security: no tokens or secrets; no server message echoed for guard codes; backend remains the authorization boundary. Integration: idempotency not applicable to this change (no new write path); `/health` is a backend concern.
- AC13 Regressions TODO-014, TODO-015, TODO-021 pass within the full suite.

Failed: none.

Blocked: the live items under Scope Tested (no backend access). They do not block the recommendation.

## Defects

### Critical

None.

### High

None.

### Medium

None open. M1 closed in v1.1 (see Re-check).

### Low

- L1 (review L1) Card copy and label "Lihat sesi saya" are not in the copy deck (FE-OQ-22 open). Documented default.
- L2 (review L2) Closed in v1.1: `ROLE_GUARD_VIOLATION` (403) on role pages now shows the fixed role copy (ARCH-FE-001 v1.0.7).
- L3 (review L3) `SYSTEM_ROLE_IN_USE` returns the role copy in account context too. Harmless.
- L4 (review L4) Header comment of `user-sessions-tab.tsx` is stale about the flag. Cosmetic.
- L5 (review L5) The "flag on" tests mock `./access`, and "no sessions request" assertions run once right after ready. The real gates are covered in `access.test.ts`. Strengthen when convenient.
- L6 (review L6) Uneven comment wrap in `user-failure.ts`. Cosmetic.

## Risk Assessment

Residual risk is Low. All acceptance criteria are met in automated tests and by code reading, and the gates pass. The sessions endpoint is never called, which removes the SP-BG-14 exposure. The main unknown is whether live servers send the exact `status` and `code` pairs; if not, the user sees the generic or conflict copy instead of the specific one, never raw server text. Server guards remain external.

## Release Recommendation

Go

No Critical, High or Medium defect is open after the rework. QA's recommendation is not the final release decision; that stays with the user.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Does the live auth-service return exactly the status and code pairs of D13.1, with a correlation id? | Fixed copy depends on exact matching | Which copy users see | user / platform | No | Open | Default: unmatched 409/503 show the generic fixed copy |
| OQ2 | Should `ROLE_GUARD_VIOLATION` (403) get fixed copy? | Raw server text on a Tim IT page | Consistency | architect_frontend | No | Answered | Fixed role copy per user order, ARCH-FE-001 v1.0.7 |
| OQ3 | When is SP-BG-14 closed, so the flag can be flipped by amendment? | Other-account sessions stay hidden | Feature availability | user / platform | No | Open | Default: flag stays `false` |
