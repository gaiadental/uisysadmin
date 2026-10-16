---
id: QA-REPORT-TODO-027
title: QA Report — TODO-027 Filter permissions by scope
owner: qa
status: Approved
version: 2.0
last_updated: 2026-10-16 09:08
related_todo: TODO-027
source_requirements: [REQ-FE-057, REQ-FE-038, REQ-FE-034, REQ-FE-026, REQ-FE-035]
related_artifacts: [TODO-027, ARCH-FE-001, ADR-003, ADR-005, CODE-REVIEW-REPORT-TODO-027, UNIT-TEST-REPORT-TODO-027]
blocking_open_questions: 0
---

Title: QA Report — TODO-027 Filter permissions by scope
Owner: qa
Status: Approved
Version: 2.0
Last Updated: 2026-10-16 09:08
Source Requirements: REQ-FE-057, REQ-FE-038, REQ-FE-034, REQ-FE-026, REQ-FE-035
Related Artifacts:
- output/plans/master-todo.md (TODO-027)
- output/architecture/ARCH-FE-001.md v1.0.15 (D5.1, D6.4, D7, D13.1, D13.2)
- output/reports/code-review-report-TODO-027.md v2.1 (Approved: Yes, 2026-10-16 09:08)
- output/reports/unit-test-report-TODO-027.md v1.1 (execution_overall: PASS, 1104 tests; approved by the user 2026-10-16)
- ADR-003, ADR-005

## At a Glance

- Verifies TODO-027 acceptance (a) to (g), the review findings, and the D13.1 / D13.2 copy. No QA Critical, High, Medium or Low defect was found.
- Release recommendation: **Go**. Preconditions are met: Code Review Report v2.1 is Approved: Yes, and the user approved it with UTR v1.1.
- The user's manual browser test PASSED for the checks listed in "Manual Browser Test". Some checks were not run (see "Not Run").

## Purpose

Verify that the delivered TODO-027 behaviour matches REQ-FE-057 and ARCH-FE-001 v1.0.15, and issue a go/no-go recommendation.

Precondition check (agent-governance, QA Preconditions):

| Precondition | Result |
|--------------|--------|
| Implementation marked Completed in `progress-tracker.md` and `master-todo.md` | Met (TODO-027 Completed, per the TODO change log) |
| Code Review Report with `Approved: Yes` and no unresolved Critical | Met. v2.1 (2026-10-16 09:08) is Approved: Yes. Critical 0 open, High 0 open (H2 closed). |
| TODO traceable to requirement, architecture and ADR | Met (REQ-FE-057, ARCH-FE-001 v1.0.15, ADR-003, ADR-005) |
| Architecture and ADRs approved | Met (ARCH-FE-001 v1.0.15 Approved, 2026-10-16) |
| No unresolved Pending Clarification gate on the work | Met (0 blocking open questions in ARCH-FE-001) |
| Unit Test Report execution_overall PASS on the current code | Met (UTR v1.1, 1104 tests passed; approved by the user) |

## Purpose of This Version

Version 2.0 replaces the v1.0 No-Go. v1.0 was issued while the Code Review Report still read `Approved: No`. That gate is now closed, and the user's manual browser test has been run and passed for the listed checks.

## Scope

Stack: frontend (`standards-frontend.md`, `tech-stack-frontend.md`, Owner `developer_frontend`). The TODO-027 File scope and the code under test:

- `src/types/master-permission.ts` (and `src/types/master-permission.test.ts`)
- `src/features/tenants/permissions/checklist.ts` (and `checklist.test.ts`)
- `src/features/team/roles/role-permissions-tab.tsx` (and `role-permissions-scope.test.tsx`, `role-screens-gaps.test.tsx`)
- `src/features/team/roles/role-failure.ts` (and `role-failure.test.ts`)
- `src/features/tenants/permissions/tenant-permissions-tab.tsx` (and `tenant-permissions-scope.test.tsx`, `tenant-permissions-tab.test.tsx`, `tenant-permissions-tab.edge.test.tsx`)
- `src/features/catalog/master-permissions/permission-list-page.tsx` (and `permission-list-page.test.tsx`)
- `src/features/catalog/master-permissions/permission-form-dialog.tsx` (read only; no change in the diff)
- `src/lib/api/modules/master-permissions.ts` (and `master-permissions.test.ts`)
- Fixtures: `src/test/handlers/tenant-permissions.ts`, `src/test/handlers/system-roles.ts`

Out of scope: TODO-026 and earlier behaviour; the auth-service backend (BG-14 is recorded as Closed in ARCH-FE-001); `src/test/handlers/catalog.ts` (unchanged, outside File scope).

## References

- TODO-027 (`output/plans/master-todo.md`), Description items (1) to (6) and Tests required (a) to (g)
- REQ-FE-057 (scope display filter), REQ-FE-038 (empty, loading and error states)
- ARCH-FE-001 v1.0.15: D5.1, D6.4, D7, D13.1 (400 copy), D13.2 (empty-state copy)
- Code Review Report v2.1 (Approved: Yes; H2, L2r, L5, L6 closed; L3 accepted; M1 accepted as TD-FE-01)
- Unit Test Report v1.1 (1104 passed, 83 files)

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| QA-OQ1 | Has the code reviewer re-issued the Code Review Report with `Approved: Yes`? | QA release gate | Release gate | code_reviewer | No | Answered | Answered: Code Review Report v2.1, Approved: Yes, 2026-10-16 09:08 |
| QA-OQ2 | Result of the user's manual browser test | TODO-027 requires it before any commit | Go condition | user | No | Answered | Answered: the user reported PASS for the checks listed in "Manual Browser Test" (2026-10-16). Checks listed under "Not Run" remain not run. |
| QA-OQ3 | Is the catalogue search placeholder "Cari key, nama, kategori, modul, atau scope" the intended copy? | No source text in TODO or ARCH-FE-001 for this placeholder | Copy only | architect_frontend | No | Deferred | Documented default: kept as implemented |
| QA-OQ4 | Count note: 22 scope files gave 271 tests in the QA run versus 273 in the review run | Test count reporting consistency | Reporting only | qa | No | Deferred | Not investigated. Full suite 1104 PASS in both runs. User decision 2026-10-16: not blocking. |

## Test Results

Passed: 1104 of 1104 (Unit Test Report v1.1, 83 files; `tsc -b`, `eslint .`, `vitest run` exit 0). QA re-run in this pass:
- `npx tsc -b`: exit 0, no errors.
- `npx vitest run` on the 22 scope test files (types, tenants/permissions, team/roles, catalog/master-permissions, and the three API module tests): 22 files, 271 tests passed, 0 failed. The code review reported 273 tests for a similar file set. The difference is recorded as QA-OQ4 and was not investigated; the full suite passes at 1104.

Failed: 0.

Blocked: 0 automated. Live checks that were not run are listed under "Not Run", which is not the same as blocked.

### Acceptance (a) to (g) — code read plus unit evidence

| Item | Result | Evidence |
|------|--------|----------|
| (a) `scope` required, invalid value rejected | Pass | `PermissionScopeSchema = z.enum(["PLATFORM","TENANT"])`, required in `MasterPermissionSchema` (`src/types/master-permission.ts`); `master-permission.test.ts` |
| (b) `filterByScope` returns only the scope, keeps order, no mutation | Pass | `checklist.ts` `filterByScope` (`catalogue.filter`); `checklist.test.ts` |
| (c) Role tab shows PLATFORM only; held keys outside the list stay in the PUT | Pass | `role-permissions-tab.tsx` groups `filterByScope(catalogue, "PLATFORM")`; form value seeded from all `savedKeys`; PUT sends full `permissionKeys`; `role-permissions-scope.test.tsx`. Live: passed (manual test). |
| (d) Tenant tab shows TENANT only; PUT keeps saved PLATFORM ids | Pass | `tenant-permissions-tab.tsx` groups `filterByScope(catalogue, "TENANT")`; form seeded from all `assigned` ids; PUT sends `masterPermissionIds` (full selection); `tenant-permissions-scope.test.tsx`. Live: passed (manual test). |
| (e) Catalogue: Scope badge, no filter, search matches scope, `COLUMN_COUNT` 8 | Pass | `permission-list-page.tsx`: Scope column with Badge, no filter control, `matchesQuery` includes `item.scope`, `COLUMN_COUNT = 8`; `permission-list-page.test.tsx`. Live: passed (manual test). |
| (f) PATCH never sends `scope` | Pass | `toRequestBody` is a whitelist (key, name, description, category, module, active, customerPermitted); dialog builds the input field by field (`permission-form-dialog.tsx` line 114); tests assert no `scope` key. Live: passed (DevTools payload check). |
| (g) 400 `PERMISSION_SCOPE_NOT_ALLOWED` on the role tab: fixed copy, reference id, no server text; generic 400 unchanged | Pass (unit) | `describeRolePermissionsFailure` (`role-failure.ts`) checks status 400 and code first, returns fixed copy and `correlationId`; only `role-permissions-tab.tsx` calls it (tenant tab does not); other codes fall through to `describeRoleWriteFailure`; `role-failure.test.ts`, `role-permissions-scope.test.tsx`. Live 400 not run (see "Not Run"). |

### Copy check against D13.1 and D13.2 (character by character)

| Where | Expected (source) | In code | Result |
|-------|-------------------|---------|--------|
| 400 scope copy (role tab) | "Permission ini tidak dapat diberikan pada peran ini." (ARCH-FE-001 D13.1 row 400; TODO-027 item 6) | `role-failure.ts` line 39, exact match (grep -F count 1) | Match |
| Empty state, role tab | "Belum ada permission untuk peran sistem di katalog." (D13.2) | `role-permissions-tab.tsx` line 191, exact match (grep -F count 1) | Match |
| Empty state, tenant tab | "Belum ada permission untuk tenant di katalog." (D13.2) | `tenant-permissions-tab.tsx` line 228, exact match (grep -F count 1) | Match |
| Catalogue column header and badge | "Scope", "PLATFORM" / "TENANT" | `permission-list-page.tsx` | Match with TODO item (5). No ARCH copy text to compare. |
| Catalogue search placeholder | No source text | "Cari key, nama, kategori, modul, atau scope" | Not checked against a source (QA-OQ3, non-blocking) |

No U+FFFD character in the four production files (checked).

### Edge, negative and error paths

- Missing or invalid `scope` on a list response: schema rejects (contract failure).
- Empty catalogue and no-match input for `filterByScope`: empty result, input unchanged.
- Role save with 409 and the same code, or 400 with another code: no scope copy.
- Empty state uses the catalogue, not the held keys (D13.2). Loading and error states from D12 and D13 are unchanged.
- Idempotency: not applicable. PUT is full replacement by stable role id; PATCH by stable id.

### Integration, security and standards

- Contract: `scope` is read only; PATCH body is whitelisted; PUT is full replacement (keeps held keys) as specified.
- Security: the scope copy never shows server text. No token, secret or body is logged in the changed production code (checked in the code review; re-read here). Frontend authorisation is UX only; no change to that model.
- Standards: no `any` and no default exports added in the changed production files. Named exports kept.
- `/health`: not applicable to a frontend TODO.

## Manual Browser Test

Reported by the user on 2026-10-16. Result: PASS for the following checks.

1. Role tab (system role, Permissions): shows PLATFORM permissions only on the real API; normal save works.
2. Tenant tab (Permission): shows TENANT permissions only on the real API; normal save works, and the PUT keeps the saved PLATFORM ids.
3. Catalogue `/master-permissions`: Scope badge shown on real data; no scope filter present.
4. Edit dialog: the PATCH request body has no `scope` key (checked in DevTools).
5. Phone width: only the catalogue table scrolls, inside its own container; the page does not shift.

## Defects

QA found no defects in TODO-027 scope.

| Severity | QA defects | Carried from code review (status) |
|----------|------------|-----------------------------------|
| Critical | 0 | 0 open |
| High | 0 | 0 open (H2 closed: UTR v1.1 covers the current code) |
| Medium | 0 | 0 open (M1 accepted by the user; residual risk TD-FE-01, Low, Gating No) |
| Low | 0 | L3 accepted for later cleanup; L2r, L5, L6 closed |

## Not Run

1. Keyboard and screen reader check for the Scope badge and the empty-state copy (WCAG 2.1 AA considerations). Not run.
2. Real 400 `PERMISSION_SCOPE_NOT_ALLOWED` on a role save against live data: covered by unit tests only (fixtures). Not run on the real API.
3. Empty-state copy per tab with an empty scope catalogue on live data: covered by unit tests only. Not run on the real API.

## Risk Assessment

- Code risk: low. Acceptance (a) to (g) and the copy match the TODO and ARCH-FE-001 v1.0.15 on code read, unit evidence, and the live checks in "Manual Browser Test".
- Residual risk, not verified live: the real backend 400 code path `PERMISSION_SCOPE_NOT_ALLOWED` and the empty-state copy on live data. Unit tests use fixtures. Accepted by the user for this release.
- Accessibility risk: keyboard and screen reader behaviour of the new Scope badge and empty-state copy is not verified. Open for a later check.
- Accepted risk: TD-FE-01 (a system role holding a TENANT key; the UI has no control for it). Low, Gating No, accepted by the user (ARCH-FE-001 v1.0.15 D6.4).
- Tenant tab 400 copy: the tenant tab keeps the shared write-failure copy. The TODO places the scope copy on the role tab only, so this is by design.
- Test count note (QA-OQ4): 271 in the QA scope run versus 273 in the review run. Not investigated; full suite 1104 PASS; not blocking (user decision 2026-10-16).
- Low, accepted for later cleanup: L3 (Code Review Report v2.1).

## Release Recommendation

**Go**

Basis:
1. Code Review Report v2.1 is Approved: Yes (2026-10-16 09:08). Critical 0 open, High 0 open.
2. Unit Test Report v1.1: execution_overall PASS, 1104 tests passed. The user approved the review and this test report.
3. QA re-run green: `tsc -b` exit 0; 271 of 271 on the 22 scope files; full suite 1104 PASS.
4. The user's manual browser test PASSED for the checks in "Manual Browser Test".
5. No QA defect found. No blocking open question.

Conditions and notes:
- Not run (see "Not Run"): keyboard and screen reader check; real 400 and empty-state on live data. These are recorded as residual risk and do not block Go, per the user's decision.
- This Go is QA's own assessment. It is not approval of the architecture, the ADRs, or the final release decision, which belong to their respective owners and the user.

## Traceability

- TODO: TODO-027 (Completed in the TODO; QA is a separate gate)
- Requirements: REQ-FE-057 (primary), REQ-FE-038, REQ-FE-034, REQ-FE-026, REQ-FE-035
- Architecture: ARCH-FE-001 v1.0.15 (D5.1, D6.4, D7, D13.1, D13.2)
- ADRs: ADR-003, ADR-005
- Code Review Report: `output/reports/code-review-report-TODO-027.md` v2.1 (Approved: Yes)
- Unit Test Report: `output/reports/unit-test-report-TODO-027.md` v1.1 (execution_overall: PASS)
- Prior QA reports: `output/reports/qa-report-TODO-026.md` (context only)

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| QA-OQ3 | Is the catalogue search placeholder "Cari key, nama, kategori, modul, atau scope" the intended copy? | No source text in TODO or ARCH-FE-001 for this placeholder | Copy only | architect_frontend | No | Deferred | Documented default: kept as implemented |
| QA-OQ4 | Count note: 22 scope files gave 271 tests in the QA run versus 273 in the review run | Test count reporting consistency | Reporting only | qa | No | Deferred | Not investigated. Full suite 1104 PASS. User decision 2026-10-16: not blocking. |
| CR27-OQ2 | Does the user accept the test-only alias `FIXTURE_MASTER_PERMISSION_BRANCHES` (review L5)? | Naming only in test code | Test naming | user | No | Answered | Closed per the user's approval of 2026-10-16 (see Code Review Report v2.1) |
