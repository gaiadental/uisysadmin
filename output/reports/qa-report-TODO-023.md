---
id: QA-TODO-023
title: QA Report TODO-023
owner: qa
status: Approved
version: 1.0
last_updated: 2026-10-14 10:20
source_requirements: [REQ-FE-054, REQ-FE-030, REQ-FE-031, REQ-FE-039, REQ-FE-053]
related_artifacts: [TODO-023, ARCH-FE-001 v1.0.6, ADR-002, ADR-003, ADR-005, CODE-REVIEW-TODO-023, unit-test-report-TODO-023]
blocking_open_questions: 0
---

Title: QA Report TODO-023 (Hapus akun sistem dihapus, teks penjelasan Tangguhkan dan Nonaktifkan)

Owner: qa

Status: Approved

Version: 1.0

Last Updated: 2026-10-14 10:20

Source Requirements:
- REQ-FE-054, REQ-FE-030, REQ-FE-031, REQ-FE-039, REQ-FE-053

Related Artifacts:
- TODO-023 (`output/plans/master-todo.md`), ARCH-FE-001 v1.0.6 (D6.4, D12.1, D13.1a), ADR-002, ADR-003, ADR-005
- `output/reports/code-review-report-TODO-023.md` (Approved, 0 Critical/High/Medium, 4 Low)
- `output/reports/unit-test-report-TODO-023.md` (PASS)

## At a Glance

- Verifies TODO-023: no "Hapus" on system account pages; explanatory text in the Tangguhkan and Nonaktifkan dialogs.
- Recommendation: Go. No Critical, High or Medium defect; 4 Low.
- Not verified live: real error bodies and server-side guards (see Scope Tested).

## Purpose

Verify the delivered behavior of TODO-023 against REQ-FE-054 and ARCH-FE-001 v1.0.6.

## Scope

TODO-023 only: FP-253 to FP-263 (`src/features/team/users/`: `use-user-actions.ts`, `user-action-buttons.tsx`, `access.ts`, `user-detail-page.tsx`, `user-list-page.tsx` comment, four page tests, `no-delete-system-user.test.ts`). Greenfield, enforcement `enforced`. Stack standards: standards-frontend and tech-stack-frontend.

## References

- Gate runs executed by QA on 2026-10-14 (whole working tree): `tsc -b` exit 0; `eslint .` exit 0; `vitest run --passWithNoTests` 78 files, 994 tests passed, 0 failed.
- QA grep of non-test sources in `src/features/team/users`: no `deleteSystemUser`, `system_users:delete`, `RowDeleteButton` or "Hapus" match. Both explanatory strings found verbatim in `use-user-actions.ts` and in ARCH-FE-001.

## Scope Tested

Static and automated verification plus code reading. QA had no access to the live backend.

Not verified live:
- Real `DELETE /system-users/{id}` behaviour (it only sets DEACTIVATED, per the TODO); the UI no longer calls it, so no live check is needed for the removal, but the claim about the platform is taken from the TODO.
- Real error bodies for suspend, deactivate, role change and reset password (guard codes), and server-side guards (backend, SP-BG-13).
- Visual rendering and screen reader reading of the two confirm dialogs in a browser.

## Test Results

Passed:
- Gates: tsc -b, eslint ., vitest (994/994).
- AC1 No "Hapus" control on `/system-users` rows or `/system-users/:id` for ACTIVE, SUSPENDED, DEACTIVATED and own account, even with `system_users:delete` held (list, list gaps and detail gaps tests; grep clean).
- AC2 Delete kind removed from buttons, hook, `onDeleted`, navigate-after-delete, `canDelete` and `USERS_DELETE`; `RowDeleteButton` import gone from the users feature.
- AC3 REQ-FE-054 static test `no-delete-system-user.test.ts` passes and is non-vacuous; UI makes no call to `deleteSystemUser`. `deleteSystemUser` and its module test are kept in `lib/api/modules/system-users.ts` (unchanged).
- AC4 Tangguhkan and Nonaktifkan dialogs show the exact explanatory texts; old "Akun akan dihapus dari platform." and "Akun dihapus." removed.
- AC5 D12.1: no delete invalidation; create, role change, status change and reset password invalidations stay.
- AC6 Suspend, deactivate, reactivate, reset password and role change flows unchanged (tests).
- AC7 Guard-code coverage matrix (REQ-FE-053 still applies on account pages): status change, reset password and role change blocks keep all seven guard cases; the delete block was removed only. Every guard code has an account-page test. See L2 on the `PLATFORM_ROLE_PROTECTED` on status change.
- AC8 The four list-page tests re-targeted from delete to Tangguhkan keep their intent (in-flight disable, non-self row actions, 500 re-enable, failed write keeps row).
- AC9 Untouched: roles feature (system role delete stays), `components/delete-button.tsx`, tenant and catalog delete controls (no diff in those files).
- AC10 Tenant behaviour unchanged: no tenant production diff.
- AC11 Security: no secrets or sensitive logging; the backend remains the authorization boundary. Integration: removal of a write path; idempotency not applicable.

Failed: none.

Blocked: live items under Scope Tested (no backend access). They do not block the recommendation.

## Defects

### Critical

None.

### High

None.

### Medium

None.

### Low

- L1 (review L1) `no-delete-system-user.test.ts` checks only `deleteSystemUser` and a few hook patterns; it does not guard a future `system_users:delete` constant or `RowDeleteButton` import in `features/team/users`. Today a grep is clean. Optional test hardening.
- L2 (review L2) Tests assert `PLATFORM_ROLE_PROTECTED` on Tangguhkan/Nonaktifkan, which D13.1a and FE-OQ-42 say the platform documents for role change and reset password only. Left by explicit user scope decision; informational.
- L3 (review L3) A header comment line in `user-list-page.tsx` exceeds the line width. Cosmetic.
- L4 (review L4) Stale phrase in the `use-user-actions.ts` header (SP-BG-11). Unrelated, unchanged.

## Risk Assessment

Residual risk is Low. The change removes a control and adds text; behaviour of the remaining actions is unchanged and covered by tests. The only exposure is the unverified live behaviour of guard responses, which is shared with TODO-022 and falls back to fixed copy, not raw server text.

## Release Recommendation

Go

No Critical, High or Medium defect is open. No fix is required before release; L1 is optional hardening. QA's recommendation is not the final release decision; that stays with the user.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Does the platform document `PLATFORM_ROLE_PROTECTED` for suspend and deactivate (FE-OQ-42)? | Tests assert it on those actions | Test accuracy only | architect_frontend / platform | No | Open | Default: keep tests as left by the user decision |
