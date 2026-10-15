---
id: QA-REPORT-TODO-026
title: QA Report — TODO-026 Sessions of another system account
owner: qa
status: Approved
version: 1.0
last_updated: 2026-10-15 16:30
related_todo: TODO-026
source_requirements: [REQ-FE-032, REQ-FE-052, REQ-FE-053]
related_artifacts: [TODO-026, ARCH-FE-001, ADR-003, ADR-005, code-review-report-TODO-026, unit-test-report-TODO-026]
blocking_open_questions: 0
---

Title: QA Report — TODO-026 Sessions of another system account
Owner: qa
Status: Approved
Version: 1.0
Last Updated: 2026-10-15 16:30
Source Requirements: REQ-FE-032, REQ-FE-052, REQ-FE-053
Related Artifacts:
- output/plans/master-todo.md (TODO-026)
- output/architecture/ARCH-FE-001.md v1.0.13 (D4.10, D7, D13.1)
- output/reports/code-review-report-TODO-026.md (Approved: Yes, 0 Critical, 0 High, 0 Medium, 3 Low)
- output/reports/unit-test-report-TODO-026.md (execution_overall: PASS)

## At a Glance

- Recommendation: **Go**. No Critical, High or Medium defect. 2 Low observations carried from code review (L-1, L-2); neither is a defect.
- Gate: tsc 0, eslint 0, vitest 79 files / 1077 tests. Run 1 pass; run 2 one flaky failure (tenant-create-page); run 3 pass (exit 0).
- Scope: frontend, Owner developer_frontend; standards-frontend, tech-stack-frontend, tech-stack-security, tech-stack-integration applied.

## Purpose

Verify the delivered behavior of TODO-026 against REQ-FE-032, REQ-FE-052, REQ-FE-053 and issue a release recommendation.

## Scope Tested

`src/lib/api/modules/sessions.ts`, `src/features/team/users/access.ts`, `user-detail-page.tsx`, `user-sessions-tab.tsx` (unchanged, integration), their tests, plus `src/test/handlers/auth.ts` and `src/types/session.ts` (path-only changes, outside TODO File scope; already noted as L-3 in the code review, a process item for the orchestrator, not a behavior defect). Verification by reading code and tests and by running the gate. No code or other artifact was changed.

## Test Results

Passed: 1077 of 1077 (79 files) on run 1 and run 3.

Failed: run 2 only: 1 flaky test, `src/features/tenants/create/tenant-create-page.test.tsx > TenantCreatePage steps (D9) > stays on a step and shows the field errors while the step is invalid` (1076 of 1077). Unrelated to TODO-026 (tenant create page, untouched); passed on the immediate rerun.

Blocked: none.

Gate (exit codes explicit):

| Command | Run | Exit | Result |
|---------|-----|------|--------|
| `npx tsc -b` | 1 | 0 | clean |
| `npx eslint .` | 1 | 0 | clean |
| `npx vitest run --passWithNoTests` | 1 | 0 (no error output; 79 passed, 1077 passed) | PASS |
| `npx vitest run --passWithNoTests` | 2 | 1 | 1 failed (flaky tenant-create-page), 1076 passed |
| `npx vitest run --passWithNoTests` | 3 | 0 | 79 files, 1077 tests PASS |

Note: the exit code of run 1 was not captured by the shell wrapper; the summary showed all 79 files and 1077 tests passing with no failures, and runs 2 and 3 captured exit codes directly.

Regressions: the full suite includes the TODO-014, TODO-015 and TODO-021 to TODO-025 test files; all pass on runs 1 and 3.

Requirement checks:

| Check | Evidence | Result |
|-------|----------|--------|
| GET and DELETE use `/api/v1/system-users/{id}/sessions` | `sessions.ts` `SYSTEM_USERS_PATH` for `listUserSessions` and `forceLogoutUser`, id URL-encoded; `sessions.test.ts` asserts pathname and method | Pass |
| Tab only for another account with `sessions:view`; "Paksa keluar" only with `sessions:revoke` and not own account | `access.ts` `canViewUserSessions` and `canForceLogout` (flag true, permission, `!isSelf`); `user-detail-page.tsx` `showSessions`; page tests | Pass |
| Own account: no tab, no button, link to `/account/sessions` kept | `user-detail-page.tsx` `access.isSelf ? <OwnSessionsLink />`; tabs value falls back to "detail"; test with every permission | Pass |
| Success refreshes list and shows success toast | `user-sessions-tab.tsx`: `applyInvalidation(forceLogout)` then `toast.success("Semua sesi akun diakhiri.")`; test asserts refetch | Pass |
| 409 SELF_ACTION_NOT_ALLOWED, 403 PLATFORM_ROLE_PROTECTED (account copy), unrecognised 409, 503, 404: fixed copy, reference id, no server text | write errors go through `describeUserWriteFailure` into `FormAlert`; `it.each` in `user-sessions-tab.test.tsx` asserts copy, `Kode referensi`, server text absent, no toast | Pass |
| Button visible for a SYS_PRINCIPAL target (no UI gate) | `showForceLogout` depends on permission and `isSelf` only; test present | Pass |
| GET error shows the read message | `describeReadFailure` in the tab; test for GET 500 shows `GENERIC_READ_MESSAGE` | Pass |
| Security and integration | server decides authorization, UI gates are UX only; no secrets or logging; confirm dialog; in-flight double-submit guard; DELETE is idempotent by resource id; consistent error structure | Pass |

## Defects

### Critical

None.

### High

None.

### Medium

None.

### Low

L-1 (observation, not a defect). A GET 503 on the sessions list shows the server `message` through `describeReadFailure` (`src/features/tenants/shared/failure.ts`, 503 branch). Decision: not a defect. REQ-FE-053 is scoped to guard refusals and writes on Tim IT pages ("Guard refusals from auth-service show fixed Indonesian copy"; unrecognised 409 or 503 "on these pages" via the write-failure path), and the D13 UNAVAILABLE row says the fixed copy applies to team mutations while "elsewhere the earlier rule holds" (server message for 503 reads). TODO-026 item (4) lists errors for force logout only, and the TODO says a GET read error keeps the generic read handling. The ARCH-FE-001 v1.0.7 sentence "the server message is never shown" is attached to the guard and role-page context. The only residual risk is that a broad reading of the user's rule "Tim IT pages never show server text" would cover reads. Recommended: the architect confirms the intent in a future amendment (optional); if the broad reading is intended, it is a new TODO (a Tim IT read-failure wrapper), not a TODO-026 blocker. Severity Low, no action required for release.

L-2 (cosmetic). GET 403 on the list shows "Anda tidak punya akses untuk aksi ini." with a "Coba lagi" button. Consistent with the decision that GET has no principal protection, so a 403 means missing `sessions:view`. The wording "aksi" and the retry button are shared by all read screens. No action required.

Process item (from code review L-3, not a QA defect): the TODO-026 File scope omits `src/test/handlers/auth.ts` and `src/types/session.ts`; the orchestrator should amend the File scope.

## Risk Assessment

Low. The change is a path swap, a flag flip and a tighter own-account gate, backed by behavior tests and the unchanged, previously reviewed tab component. Residual risks: (1) the real auth-service behavior is verified only through MSW, not an integration environment; the master TODO already requires a manual test by the user before any commit; (2) the flaky tenant-create-page test is pre-existing and unrelated (also known flaky list item); (3) L-1 wording of the Tim IT rule, see above. For a deactivated or suspended account the list is empty and the button stays enabled; a click returns success with count 0 (accepted behavior, "server decides").

## Release Recommendation

Go

No unresolved Critical or High defect. Conditions outside QA: user manual test before commit, as the TODO specifies; this recommendation is not the final release approval.

## Open Questions

None
