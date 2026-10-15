---
id: CODE-REVIEW-TODO-023
title: Code Review Report TODO-023
owner: code_reviewer
status: Approved
version: 1.0
last_updated: 2026-10-14 10:10
related_todo: TODO-023
source_requirements: [REQ-FE-054, REQ-FE-030, REQ-FE-031, REQ-FE-039, REQ-FE-053]
related_artifacts: [ARCH-FE-001 v1.0.6, ADR-002, ADR-003, ADR-005, unit-test-report-TODO-023]
blocking_open_questions: 0
---

Title: Code Review Report TODO-023
Owner: code_reviewer
Status: Approved
Version: 1.0
Last Updated: 2026-10-14 10:10
Source Requirements: REQ-FE-054, REQ-FE-030, REQ-FE-031, REQ-FE-039, REQ-FE-053
Related Artifacts: TODO-023, ARCH-FE-001 v1.0.6 (D6.4, D12.1, D13.1a), ADR-002, ADR-003, ADR-005, output/reports/unit-test-report-TODO-023.md

## At a Glance

- "Hapus" removed from system account pages (list and detail), explanatory confirm texts added: review of the working tree for FP-253 to FP-263.
- Approved: Yes. 0 Critical, 0 High, 0 Medium, 4 Low.
- Independent runs (whole working tree): tsc -b exit 0, eslint . clean, vitest 994 passed in 78 files.

## Purpose

Review TODO-023 against REQ-FE-054, REQ-FE-030, REQ-FE-031, REQ-FE-039, ARCH-FE-001 v1.0.6 (D6.4, D12.1, D13.1a), standards-frontend, tech-stack-frontend and tech-stack-security.

## Scope Reviewed

Greenfield, enforcement enforced. Files: `src/features/team/users/` use-user-actions.ts, user-action-buttons.tsx, access.ts and access.test.ts, user-detail-page.tsx, user-list-page.tsx (comment only), the four page tests, and new `no-delete-system-user.test.ts` (FP-253 to FP-263). Integration touchpoints: `lib/api/modules/system-users.ts` (`deleteSystemUser` kept, unchanged), `components/delete-button.tsx` and `features/team/roles/*` (unchanged), `lib/query/invalidation.ts` (unchanged). Out of scope: `src/components/ui/sidebar.tsx`, TODO-021 leftovers, TODO-022 changes (reviewed separately).

## References

TODO-023 (master-todo.md), ARCH-FE-001 v1.0.6, unit-test-report-TODO-023, file-provenance-register FP-253 to FP-263.

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

- L1 `users/no-delete-system-user.test.ts`: the static test checks only the text `deleteSystemUser` and a few hook patterns. REQ-FE-054 also says "no UI gate uses `system_users:delete`"; nothing guards against a later `system_users:delete` constant or `RowDeleteButton` import in `features/team/users`. Today a grep is clean. Recommend adding those two patterns to the static test.
- L2 `users/user-detail-page.gaps.test.tsx`: the dedicated test "PLATFORM_ROLE_PROTECTED shows the account copy" and the status-change `GUARD_CASES` block use Tangguhkan with `PLATFORM_ROLE_PROTECTED`. D13.1a and FE-OQ-42 say tests must not assert that code on suspend or deactivate (the platform documents it for role change and reset password only). This was left in place by the explicit user scope decision of 2026-10-14 (recorded in TODO-023 Notes), and the same code is covered on role change and reset password, so every guard code still has an account-page test. Informational; revisit if the platform contract is tightened.
- L3 `users/user-list-page.tsx`: the header comment line "account carries a 'self' badge and no suspend or deactivate. There is no 'Hapus' action (REQ-FE-054)." exceeds the file's line width; cosmetic.
- L4 `users/use-user-actions.ts`: the module header still says "(create-like sends are not idempotent, SP-BG-11)" in a sentence about suspend and reset; unrelated to this TODO and unchanged, note only. No functional issue.

## Checks

| Check | Result |
|-------|--------|
| No "Hapus" on `/system-users` rows or `/system-users/:id` for any status, own or other account, with `system_users:delete` held | Pass (code; tests in list, list gaps, detail gaps for ACTIVE, SUSPENDED, DEACTIVATED, own) |
| Delete kind removed from buttons, hook, `onDeleted`, navigate-after-delete, `canDelete`, `USERS_DELETE`; `RowDeleteButton` import gone | Pass (grep of non-test sources clean) |
| `deleteSystemUser` kept in `lib/api/modules/system-users.ts`, module test unchanged, not referenced by the UI | Pass |
| No UI gate on `system_users:delete` | Pass (only the test-support fixture lists it, as the TODO says) |
| D12.1: no delete invalidation or `removeQueries`; create, role change, status change, reset password invalidations stay (`systemUserWrite`) | Pass |
| Explanatory texts exact (Tangguhkan and Nonaktifkan) and old "Akun akan dihapus dari platform." / "Akun dihapus." removed | Pass (strings compared character by character with ARCH REQ-FE-054; tests on list and detail) |
| Suspend, deactivate, reactivate, reset password, role change flows unchanged | Pass |
| The four list-page tests re-targeted from delete to Tangguhkan keep their intent | Pass (in-flight disables all buttons; "not self when ids differ" still proves the non-self row has actions; 500 re-enables buttons; failed write keeps list and row; clear previous failure on next action) |
| Every guard code still has an account-page test | Pass (status change, reset password and role change blocks keep all seven `GUARD_CASES`; delete block removed only) |
| Roles feature, tenant, catalog delete controls untouched | Pass (no diff in `features/team/roles` production files for this TODO, `delete-button.tsx` unchanged) |
| Accessibility of the confirm dialogs | Pass (heading and description present in Radix dialog via shared `DialogsProvider`; tests query role "heading") |
| Security: no secrets, no sensitive logging, backend remains the authorization boundary | Pass |
| Encoding | Pass (no U+FFFD, no smart quotes, no unicode arrows in scoped files or report) |
| Test quality: static test is non-vacuous (asserts source count and file presence) | Pass |
| Provenance FP-253 to FP-263 | Present, `full` |

## Recommendations

Optionally extend the static test (L1) in a later touch. No action required before QA.

## Approval Status

Approved:
Yes

No unresolved Critical or High findings. Pipeline may advance to QA for TODO-023.

## Open Questions

None
