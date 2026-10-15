---
id: UNIT-TEST-REPORT-TODO-022
title: Unit Test Report — TODO-022 Sesi aktif ditangguhkan dan teks tetap untuk penolakan guard
owner: unit_test_writer
status: Pending Approval
version: 1.2
last_updated: 2026-10-14 10:10
related_todo: TODO-022
execution_overall: PASS
source_requirements: [REQ-FE-052, REQ-FE-053, REQ-FE-032, REQ-FE-008, REQ-FE-018]
related_artifacts: [TODO-022, TODO-014, TODO-015, TODO-021, ARCH-FE-001, ADR-002, ADR-003, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-022 Sesi aktif ditangguhkan dan teks tetap untuk penolakan guard
Owner: unit_test_writer
Status: Pending Approval
Version: 1.2
Last Updated: 2026-10-14 10:10
Source Requirements: REQ-FE-052, REQ-FE-053, REQ-FE-032, REQ-FE-008, REQ-FE-018
Related Artifacts:
- output/plans/master-todo.md (TODO-022)
- ARCH-FE-001 v1.0.7 (D4.10, D13.1, FE-OQ-39, FE-OQ-40)
- ADR-002, ADR-003, ADR-005

## At a Glance

- Every TODO-022 test item (1, 2, 3, 3a, 3b) plus rework items 3c and 3d has tests.
- Gate PASS (v1.2 rework): `tsc -b` exit 0, `eslint .` exit 0, `vitest run --passWithNoTests` 78 files, 1001 tests, 0 failed, three full runs, no flake seen. Overall PASS.
- One test added in this run (role detail delete with ROLE_GUARD_VIOLATION, role marked refused). No production code changed. No blocking open questions.

## Purpose

Record scope, test cases, execution, coverage, edge cases and mocking for TODO-022.

## Scope

Under test: `src/features/team/shared/guard-failure.ts`, `user-failure.ts`, `role-failure.ts`, `users/access.ts` (`OTHER_ACCOUNT_SESSIONS_ENABLED`, `canViewUserSessions`, `canForceLogout`), `users/user-detail-page.tsx`. Verified unchanged: `src/features/tenants/create/write-failure.ts` (no diff in `git status` for `src/features/tenants`). Out of scope: server guards (SP-BG-13), end-to-end (QA).

## Test Cases

| TODO-022 item | Test (file) | Result |
|---------------|-------------|--------|
| 1. Each code returns its copy, never the server message | `guard-failure.test.ts` "returns its fixed copy" (4 cases x 2 contexts) | PASS |
| 1. Branching ignores message text | `guard-failure.test.ts` "ignores the message text" | PASS |
| 1. Wrong status falls through | `guard-failure.test.ts` "falls through for a known code with the wrong status" | PASS |
| 1. Correlation id passed through (incl. null) | `guard-failure.test.ts` "passes the correlation id through" | PASS |
| 1. PLATFORM_ROLE_PROTECTED differs by context | `guard-failure.test.ts` | PASS |
| 3a. Unknown 409 and 503 in the mapper | `guard-failure.test.ts` (2 tests) | PASS |
| Own-handling codes left alone | `guard-failure.test.ts` "leaves the codes with their own handling alone" | PASS |
| 2. Account pages: status change, delete, reset password, role dialog; 7 cases each (6 rows + unknown 409 + unknown 503), fixed copy, reference id, no server text | `user-detail-page.gaps.test.tsx` "system account pages: fixed guard copy" | PASS |
| 2. Account copy for PLATFORM_ROLE_PROTECTED, differs from role copy | `user-detail-page.gaps.test.tsx` | PASS |
| 2. Role pages: detail delete, list delete, edit form, create form, permission replace; 7 cases each | `role-screens-gaps.test.tsx` "system role pages: fixed guard copy" | PASS |
| 2. Role copy for PLATFORM_ROLE_PROTECTED, differs from account copy | `role-screens-gaps.test.tsx` | PASS |
| 2. SYSTEM_ROLE_KEY_EXISTS keeps own field error | `role-screens-gaps.test.tsx` | PASS |
| 2. SYSTEM_USER_LOGIN_EXISTS on the account create dialog keeps own field error, dialog stays open | `user-list-page.test.tsx` "shows the 409 on the login field and keeps the dialog open" (existing, unchanged) | PASS |
| 2. Old server-text expectations adjusted | `role-list-page.test.tsx`, `role-detail-page.test.tsx`, `user-list-page.gaps.test.tsx` (conflict copy, protected role copy) | PASS |
| 3. Other account: no tab, no force logout, no sessions request | `user-detail-page.test.tsx` "Sesi aktif suspended" | PASS |
| 3. Own account shows link to `/account/sessions` | `user-detail-page.test.tsx` "links the own account to /account/sessions" | PASS |
| 3. Flag is `false`; `canViewUserSessions`, `canForceLogout` need the flag | `access.test.ts` | PASS |
| 3. Kept tab code still covered (flag mocked on) | `user-detail-page.test.tsx`, `user-detail-page.gaps.test.tsx` "flag mocked on" (tab gates, paging, force logout, invalidation) | PASS |
| 1/3a. HTTP error with `status: null` returns generic copy and keeps reference id | `guard-failure.test.ts` "uses the generic copy for an HTTP error without a status" | PASS |
| 3b. Tenant create page: 409 with unrecognised code still shows server message | `tenant-create-page.test.tsx` "keeps the server message for a 409 with an unrecognised code (not the team guard copy)" | PASS |
| D13.1 tenant-path guard: only `user-failure.ts` and `role-failure.ts` import `guard-failure.ts`; none under tenants or catalog | `guard-failure-callers.test.ts` (new, 3 tests; scans `src` with `import.meta.glob ?raw`) | PASS |
| Tenants write-failure unchanged and passing | No diff under `src/features/tenants`; `tenant-create-page.test.tsx` (503 and 409 show server message) passes | PASS |
| 3c. Own account shows an AppLink (role "link", name "Lihat sesi saya", href `/account/sessions`, no target; click navigates) | `user-detail-page.test.tsx` "links the own account to /account/sessions" (existing, already queries role link); other account has no such link | PASS |
| 3d. Mapper: 403 ROLE_GUARD_VIOLATION on role context gives the role `PLATFORM_ROLE_PROTECTED` copy and passes the correlation id; account context returns null (falls through, pinned); 409 with that code gives the conflict copy | `guard-failure.test.ts` "uses the role copy for 403 ROLE_GUARD_VIOLATION on role pages only" | PASS |
| 3d. Role edit path: fixed copy, server text absent, reference id shown, edit and delete disabled | `role-detail-page.test.tsx` "disables edit and delete after a refused edit (ROLE_GUARD_VIOLATION)" | PASS |
| 3d. Role delete path (detail): fixed copy, reference id, server text absent, role marked refused (edit and delete disabled) | `role-screens-gaps.test.tsx` "ROLE_GUARD_VIOLATION on the role detail delete (v1.0.7)" (new in v1.2) | PASS |
| 3d. Role delete path (detail and list): fixed copy, no server text, reference id (detail) | `role-screens-gaps.test.tsx` GUARD_CASES row `[403, ROLE_GUARD_VIOLATION]` (existing) | PASS |
| 3d. List refusal marks only that role refused; refusal cleared on logout | `role-screens-gaps.test.tsx` "a refusal for one role leaves the other..."; `role-detail-page.test.tsx` "clears the refused state on logout" | PASS |
| 4. Regressions TODO-014, TODO-015, TODO-021 | Full suite, all files | PASS |

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `tsc -b`; `eslint .`; `vitest run --passWithNoTests` (x3) |
| Run at | 2026-10-14 10:10 |
| Total | 1001 |
| Passed | 1001 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

`tsc -b`: exit 0. `eslint .`: exit 0. Vitest: 78 files, 1001 tests, PASS in all three full runs (first run as part of the gate, then two more). No flake observed, including `app-sidebar-badges.test.tsx`. The file count includes the TODO-023 test file now in the tree.

## Execution Results

1001 tests passed

## Coverage

Coverage percentage was not measured in this run (no coverage command in the TODO gate). Every branch of `describeGuardFailure` (six known rows, wrong status, unknown 409, unknown 503, own-handling codes, other status, non-HTTP, non-ApiError) has a direct test; both contexts are exercised at component level on all write paths of the account and role pages.

## Edge Cases

Null correlation id; same code with different message text; message text that names another code; known code with wrong status (400, 500, 409 for a 403-only code, 404); non-HTTP and non-ApiError inputs; unknown 409 and 503 on every account and role write path; own-account versus other-account detail page.

## Mocking Strategy

MSW handlers for the system-users and system-roles endpoints (`errorResponse(status, code, SERVER_TEXT)`), and a mocked `OTHER_ACCOUNT_SESSIONS_ENABLED` flag (on) for tests of the kept sessions tab code. The caller guard reads source text with `import.meta.glob ?raw`; no runtime mocking.

## Open Questions

None
