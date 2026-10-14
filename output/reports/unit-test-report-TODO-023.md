---
id: UNIT-TEST-REPORT-TODO-023
title: Unit Test Report — TODO-023 Hapus akun sistem dihapus, teks konfirmasi
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-14 09:12
related_todo: TODO-023
execution_overall: PASS
source_requirements: [REQ-FE-054, REQ-FE-030, REQ-FE-031, REQ-FE-039, REQ-FE-053]
related_artifacts: [TODO-023, TODO-022, TODO-014, TODO-015, TODO-021, ARCH-FE-001, ADR-002, ADR-003, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-023 Hapus akun sistem dihapus, teks konfirmasi
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-14 09:12
Source Requirements: REQ-FE-054, REQ-FE-030, REQ-FE-031, REQ-FE-039, REQ-FE-053
Related Artifacts:
- output/plans/master-todo.md (TODO-023)
- ARCH-FE-001 v1.0.6 (D6.4, D12.1, D13.1a, D19)
- ADR-002, ADR-003, ADR-005

## At a Glance

- Every TODO-023 test item (a)-(i) has tests; no gap needed filling, so no test or production file was changed by this run.
- Gate PASS: `tsc -b` exit 0, `eslint .` exit 0, `vitest run --passWithNoTests` 78 files, 994 tests, 0 failed; two more full runs identical, no flake.
- No blocking open questions.

## Purpose

Record scope, test cases, execution, coverage and mocking for TODO-023.

## Scope

Under test: `src/features/team/users/` (`use-user-actions.ts`, `user-action-buttons.tsx`, `user-list-page.tsx`, `user-detail-page.tsx`, `access.ts`). Kept and verified: `lib/api/modules/system-users.ts` (`deleteSystemUser`). Out of scope: server behavior, end-to-end (QA), `team/roles` and `delete-button.tsx` (unchanged).

## Test Cases

| TODO-023 item | Test (file) | Result |
|---------------|-------------|--------|
| (a)/(f) No Hapus on detail for ACTIVE, SUSPENDED, DEACTIVATED and own account, with every system_users permission | `user-detail-page.gaps.test.tsx` "no Hapus action (REQ-FE-054)" (4 cases); `user-detail-page.test.tsx` own account and "every action except Hapus" on another account | PASS |
| (a)/(f) No Hapus in list for any row (own, active, suspended, deactivated) with every permission | `user-list-page.gaps.test.tsx` "renders no Hapus control for any row..."; `user-list-page.test.tsx` own-account vs other-account row | PASS |
| (a)/(f) No delete capability even with `system_users:delete` | `access.test.ts` "has no delete capability, even with system_users:delete (REQ-FE-054)"; fixture `test-support.tsx` still grants `system_users:delete` | PASS |
| (b)/(g) Tangguhkan text exact, Nonaktifkan text exact (list) | `user-list-page.gaps.test.tsx` "%s dialog shows its exact text" (2 cases, title heading plus exact string) | PASS |
| (b)/(g) Same two texts exact (detail) | `user-detail-page.gaps.test.tsx` "explanatory confirm texts" (2 cases) | PASS |
| (c) Suspend, deactivate, reactivate, reset password, role change unchanged | existing flows in `user-list-page.test.tsx`, `user-list-page.gaps.test.tsx` (confirm cancel/confirm, reactivate sends ACTIVE once), `user-detail-page.gaps.test.tsx` (confirm dialogs, status visibility, role change in-flight) | PASS |
| (d) `deleteSystemUser` module test | `src/lib/api/modules/system-users.test.ts` (20 tests) | PASS |
| (e) Static: no reference to `deleteSystemUser` under `features/team/users` | `no-delete-system-user.test.ts` "references deleteSystemUser in no file..." (plus a sanity test that sources were read) | PASS |
| (h) No delete invalidation wired | `no-delete-system-user.test.ts` "wires no delete action or delete invalidation" (no `case "delete"`, `onDeleted`, `removeQueries`, "Akun dihapus"); `user-detail-page.gaps.test.tsx` "D12.1 invalidation" (status change refetches, failed change does not); `user-list-page.gaps.test.tsx` "a failed write does not refetch the list" | PASS |
| (i) Role, tenant, catalog delete controls unaffected | full suite, `team/roles`, tenants, catalog tests unchanged and passing | PASS |

### TODO-022 guard codes on account pages (via the remaining actions)

`GUARD_CASES` in `user-detail-page.gaps.test.tsx` (7 cases each, fixed copy, no server text): the delete block is removed; the three other blocks stay.

| Code (status) | Status change (Tangguhkan) | Reset password | Role change dialog |
|---------------|:---:|:---:|:---:|
| SELF_ACTION_NOT_ALLOWED (409) | covered | covered | covered |
| LAST_SYSTEM_PRINCIPAL (409) | covered | covered | covered |
| SYSTEM_ROLE_IN_USE (409) | covered | covered | covered |
| SERVICE_UNAVAILABLE (503) | covered | covered | covered |
| PLATFORM_ROLE_PROTECTED (403) | covered | covered | covered |
| unknown 409 (SOME_NEW_CONFLICT) | covered | covered | covered |
| unknown 503 (SOME_NEW_OUTAGE) | covered | covered | covered |

Plus the dedicated "PLATFORM_ROLE_PROTECTED shows the account copy here, not the role copy" test (via status change). Not covered on the list page for guard codes beyond what existed (`user-list-page.gaps.test.tsx` 409 conflict copy; 404, 500).

### Four tests re-targeted from delete to Tangguhkan (`user-list-page.gaps.test.tsx`)

| Test | Intent kept |
|------|-------------|
| 404 SYSTEM_USER_NOT_FOUND on a status change shows the frontend not-found copy | PATCH `/status` returns 404; asserts the frontend not-found copy, same as before |
| 500 shows the generic line and re-enables the buttons | PATCH 500; asserts generic copy, no stack trace, `Tangguhkan ops@gaia.com` button enabled again |
| a failed write does not refetch the list and the row stays | 409 on PATCH; list GET count stays 1; row still shown |
| clears the previous failure when the next action starts | first PATCH 409, second succeeds; alert gone and success toast "Akun ditangguhkan." |

All four assert the same behavior as before, only the action and endpoint changed.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `tsc -b`; `eslint .`; `vitest run --passWithNoTests` (x3) |
| Run at | 2026-10-14 09:12 |
| Total | 994 |
| Passed | 994 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

`tsc -b` exit 0; `eslint .` exit 0 (unused export `deleteSystemUser` not flagged). Test files: 78. Three full vitest runs, all 994 passed; no flake observed.

## Execution Results

994 tests passed.

## Coverage

All TODO-023 acceptance items (e)-(h) and tests (a)-(i) mapped above. Coverage percentage not measured in this run (not part of the gate); behavioral coverage of the changed files is complete per the matrix.

## Edge Cases

Every user status (ACTIVE, SUSPENDED, DEACTIVATED), own versus other account, all permissions including `system_users:delete`, cancel in confirm dialogs, failed write without refetch, repeated action after failure, unknown 409 and 503 codes.

## Mocking Strategy

MSW handlers for `/system-users` endpoints (`src/test/handlers/system-users.ts`), mocked auth permissions and toast, fresh `QueryClient` per test. The static test reads sources with `import.meta.glob ?raw` (no mocks).

## Open Questions

None
