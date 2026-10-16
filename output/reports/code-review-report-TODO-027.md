---
id: CODE-REVIEW-REPORT-TODO-027
title: Code Review Report — TODO-027 Filter permissions by scope
owner: code_reviewer
status: Approved
version: 2.1
last_updated: 2026-10-16 09:08
related_todo: TODO-027
source_requirements: [REQ-FE-057, REQ-FE-034, REQ-FE-026, REQ-FE-035, REQ-FE-038]
related_artifacts: [TODO-027, ARCH-FE-001, ADR-003, ADR-005, unit-test-report-TODO-027]
blocking_open_questions: 0
---

Title: Code Review Report — TODO-027 Filter permissions by scope
Owner: code_reviewer
Status: Approved
Version: 2.1
Last Updated: 2026-10-16 09:08
Source Requirements: REQ-FE-057, REQ-FE-034, REQ-FE-026, REQ-FE-035, REQ-FE-038
Related Artifacts:
- output/plans/master-todo.md (TODO-027; L6 closed at master-todo v1.25)
- output/plans/file-provenance-register.md (FP-119, FP-121, FP-123, FP-129, FP-135, FP-148, FP-193, FP-235, FP-236, FP-241, FP-248, FP-250, FP-266 to FP-269)
- output/architecture/ARCH-FE-001.md v1.0.15 (REQ-FE-057, REQ-FE-038, D5.1, D6.4, D7, D13.1, D13.2, TD-FE-01, BG-14)
- output/reports/unit-test-report-TODO-027.md v1.1 (execution_overall: PASS, 1104 tests passed; covers the current code, closes H2)
- v1 of this report (2026-10-16 08:37) and v2 (2026-10-16 08:48)
- ADR-003, ADR-005

## At a Glance

- Final status: Approved. Critical: 0 open. High: 0 open (H2 closed).
- Open items at approval: none blocking. L3 is accepted for later cleanup. TD-FE-01 (Low, Gating No, ARCH-FE-001 v1.0.15 D6.4) is the accepted residual risk of M1.
- Approval was given by the user on 2026-10-16. The Reviewer records the decision here; it is not a QA verdict.

## Scope Reviewed

- TODO-027 File scope (current, `master-todo.md`), resolved against `file-provenance-register.md` (enforcement full).
- Delta since v1 (files written after 08:38): `src/features/team/roles/role-permissions-tab.tsx` and `src/features/tenants/permissions/tenant-permissions-tab.tsx` (empty-state copy only), `src/test/handlers/tenant-permissions.ts` and `src/test/handlers/system-roles.ts` (fixtures), 8 test files, `ARCH-FE-001.md` v1.0.15, `file-provenance-register.md` (FP-269), `master-todo.md` (TODO-027 File scope).
- Not reviewed: TODO-026 and earlier code, and files outside the TODO-027 File scope. `src/test/handlers/catalog.ts` is outside the File scope and was not changed.
- Evidence used for approval:
  - `unit-test-report-TODO-027.md` v1.1: execution_overall PASS, 1104 tests passed, covers the current code (H2).
  - Reviewer's scoped read-only re-run in v2 (no file changed): `vitest run` on the scoped suites, 22 files, 273 tests passed; `tsc -p tsconfig.app.json --noEmit` with no errors; `eslint` on the TODO-027 source, test and handler folders with no output.
  - User manual browser test on the real API, 2026-10-16 (see Manual Verification).

## Status of v2 Findings

| v2 item | Final status | Evidence |
|---------|--------------|----------|
| H2 Unit Test Report predates the current code | Closed | UTR v1.1 covers the current code: execution_overall PASS, 1104 tests passed (user, 2026-10-16) |
| M1 held TENANT key on a system role | Accepted by the user | ARCH-FE-001 v1.0.15, D6.4 assumption, TD-FE-01 Low, Gating No (CR27-OQ1 Answered) |
| L2r two empty-state tests per tab for the same D13.2 copy | Closed | Closed per the user's approval of 2026-10-16 |
| L3 duplicate provenance rows | Accepted by the user for later cleanup | Still open in the register; no blocking effect |
| L5 fixture alias `FIXTURE_MASTER_PERMISSION_BRANCHES` | Closed | Closed per the user's approval of 2026-10-16 (CR27-OQ2 Answered) |
| L6 TODO-027 description still names `catalog.ts` | Closed | master-todo v1.25 |

Items closed in v1 and not re-opened: H1 (FP-269 row for `role-failure.test.ts`), L1 (fixture scope for `branches` and `reports`), L4 (`catalog.ts` removed from File scope).

## Manual Verification (user, 2026-10-16)

Reported by the user on the real API:

- Role Permissions tab shows PLATFORM permissions only; tenant Permissions tab shows TENANT permissions only.
- Saves work normally on both tabs.
- Catalogue Scope badge is shown with no scope filter applied.
- The PATCH payload sent from the catalogue has no `scope` field (checked in DevTools).
- At phone width, only the catalogue table scrolls, inside its own container; the page does not scroll horizontally.

Not manually tested. Covered by unit tests only:

- The real 400 `PERMISSION_SCOPE_NOT_ALLOWED` response from the API.
- The empty-state copy for each scope.

Not run: keyboard-only navigation and screen reader checks.

## Findings

### Critical

None.

### High

None open. H2 is closed (see Status of v2 Findings).

### Medium

None open. M1 is accepted by the user (ARCH-FE-001 v1.0.15, D6.4). The accepted residual risk is TD-FE-01 (Low, Gating No). The Reviewer does not reopen it.

### Low

- L3 (duplicate provenance rows in `file-provenance-register.md`): accepted by the user for later cleanup. Not blocking.
- TD-FE-01 (Low, Gating No): accepted residual risk of M1. Tracked in ARCH-FE-001 v1.0.15.

## Checks Passed (no finding)

- **Role tab (REQ-FE-057, D6.4):** `groupPermissions(filterByScope(catalogue, "PLATFORM"))` at `role-permissions-tab.tsx:146-149`. The PUT sends the full form value (`:154`), so held keys outside the list stay.
- **Role empty state (D13.2):** `groups` comes from the scope-filtered catalogue (`:146-149`), so the copy shows when the catalogue has no PLATFORM permission. Copy matches D13.2 (`:191`).
- **Tenant tab:** `groupPermissions(filterByScope(catalogue, "TENANT"))` (`tenant-permissions-tab.tsx:155-158`). The PUT sends `masterPermissionIds` (`:167-169`), which keeps saved PLATFORM ids. Empty state copy matches D13.2 (`:228`).
- **Catalogue:** `COLUMN_COUNT = 8` (`permission-list-page.tsx:48`); Scope column and badge (`:118`, `:168-177`) with text content, so meaning is not carried by colour alone; no scope filter; search includes `item.scope` (`:53-60`, placeholder `:104`).
- **PATCH body:** `toRequestBody` (`master-permissions.ts:79-89`) is a whitelist and does not send `scope`. Tests assert the absence.
- **400 copy:** `describeRolePermissionsFailure` (`role-failure.ts:50-60`) checks status 400 and code `PERMISSION_SCOPE_NOT_ALLOWED` first, returns fixed copy and `correlationId`, and never server text. The tenant tab keeps its own copy. `role-failure.test.ts` covers the 400 case, the 409 with the same code, another 400 code, and a non-API error.
- **Schema:** `scope` is a required Zod enum (`src/types/master-permission.ts`, `PermissionScopeSchema`).
- **Helper use:** `catalogueWithScope` (`tenant-permissions.ts:90`) is used by 4 test files; no dead export.
- **Types and style:** no `any` in changed production code; no default exports in changed components; no `console`, storage, or logging of secrets in the diff.
- **Encoding:** no U+FFFD or `???` found in `ARCH-FE-001.md`, `master-todo.md`, `file-provenance-register.md`.
- **Tech debt location (informational):** TD-FE-01 is recorded in `ARCH-FE-001.md` (Tech Debt section). `output/plans/tech-debt-register.md` does not exist, which is consistent with the greenfield, enforced project profile. No register row is required.

## Recommendations

1. No code change is requested by this review.
2. L3: duplicate provenance rows are cleaned up later, at project-manager's discretion.
3. TD-FE-01: keep tracked in ARCH-FE-001; revisit when the held TENANT key on a system role is in scope again.

## Change

- v2.1 (2026-10-16 09:08): status set to Approved after the user's approval, quoted: "Approve: code-review-report-TODO-027 v2 dan unit-test-report-TODO-027 v1.1". Recorded H2 closed (UTR v1.1 covers the current code, 1104 PASS), M1 accepted (ARCH-FE-001 v1.0.15 D6.4, TD-FE-01 Low), L2r closed, L5 closed, L6 closed (master-todo v1.25), L3 accepted for later cleanup. Critical 0 and High 0 open. Manual browser test results recorded as reported by the user.

## Approval Status

Approved:
Yes

Reason: The user approved this report and UTR v1.1 on 2026-10-16. Critical: 0 open. High: 0 open. Medium: none open (M1 accepted by the user). L3 accepted for later cleanup. Approval is recorded only by the Reviewer's decision here. Not a QA verdict.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| CR27-OQ1 | How should a system role's saved TENANT key be shown or removed, given that the PUT must keep held keys and the backend refuses it (M1)? | Without a path, the role Permissions save is refused and the user cannot clear the key. | Role Permissions save for legacy roles | architect-frontend, user | No | Answered | Answered by the user 2026-10-16 (ARCH-FE-001 v1.0.15): D6.4 assumption accepted, no UI control; residual risk TD-FE-01 (Low, Gating No) |
| CR27-OQ2 | Does the user accept the test-only alias `FIXTURE_MASTER_PERMISSION_BRANCHES` (L5) as is, or should it be removed when `catalog.ts` is in scope? | Confirms the judgement that the alias is acceptable for test-only code. | Test naming only | user | No | Answered | Closed per the user's approval of 2026-10-16 (L5 closed) |
