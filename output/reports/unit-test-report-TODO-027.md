---
id: UNIT-TEST-REPORT-TODO-027
title: Unit Test Report — TODO-027 Filter permissions by scope
owner: unit_test_writer
status: Approved
version: 1.2
last_updated: 2026-10-16 09:12
change: 'v1.2: Approved by the user on 2026-10-16 ("Approve: code-review-report-TODO-027 v2 dan unit-test-report-TODO-027 v1.1"). Metadata only; content, counts, and execution_overall PASS unchanged from v1.1. v1.1: Re-run after the review fixes (L1, L2, L2r, L4, L5); catalog.ts restored to main with an alias in tenant-permissions.ts; per-tab empty-state tests (D13.2) added; fixtures renamed to contract keys.'
related_todo: TODO-027
execution_overall: PASS
source_requirements: [REQ-FE-057, REQ-FE-034, REQ-FE-026, REQ-FE-035, REQ-FE-038]
related_artifacts: [TODO-027, ARCH-FE-001, ADR-003, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-027 Filter permissions by scope
Owner: unit_test_writer
Status: Approved
Version: 1.2
Last Updated: 2026-10-16 09:12
Change (v1.2): Approved by the user on 2026-10-16: "Approve: code-review-report-TODO-027 v2 dan unit-test-report-TODO-027 v1.1". Metadata only; content, counts, and execution_overall PASS unchanged from v1.1.
Change (v1.1): Re-run after the review fixes (L1, L2, L2r, L4, L5). catalog.ts restored to main with an alias in tenant-permissions.ts. Per-tab empty-state tests (D13.2) added. Fixtures renamed to contract keys (appointment, patient_profile).
Source Requirements: REQ-FE-057, REQ-FE-034, REQ-FE-026, REQ-FE-035, REQ-FE-038
Related Artifacts:
- output/plans/master-todo.md (TODO-027)
- ARCH-FE-001 v1.0.15 (D5.1, D6.4, D7, D13.1, D13.2; REQ-FE-057, REQ-FE-038)
- ADR-003, ADR-005

## At a Glance

- Permissions carry a required, immutable `scope` (PLATFORM or TENANT). The role Permissions tab shows PLATFORM only, the tenant Permissions tab shows TENANT only, and the catalogue shows a Scope badge with search by scope and no filter.
- Gate PASS: `npx tsc -b` exit 0, `npx eslint .` exit 0, `npx vitest run --passWithNoTests` exit 0. 83 files, 1104 of 1104 passed, two full runs with identical results.
- Tests (a) to (g) of the TODO are covered. One gap was found and closed: the role-failure copy helper had no unit test. Four tests were added in `src/features/team/roles/role-failure.test.ts`. No production code was changed by this run.
- Key references: ARCH-FE-001 v1.0.15, REQ-FE-057, REQ-FE-038 (D13.2), TODO-021, TODO-022, TODO-026.

## Purpose

Record the unit test evidence for TODO-027 and confirm tests (a) to (g) of the TODO verify the implemented behavior, including the 400 PERMISSION_SCOPE_NOT_ALLOWED copy.

## Scope

Frontend TODO (Owner `developer_frontend`). File scope tested:

- `src/types/master-permission.ts` and `src/types/master-permission.test.ts` (new)
- `src/features/tenants/permissions/checklist.ts` and `checklist.test.ts`
- `src/features/team/roles/role-permissions-tab.tsx` and `src/features/team/roles/role-permissions-scope.test.tsx` (new)
- `src/features/team/roles/role-failure.ts` and `src/features/team/roles/role-failure.test.ts` (new, gap test)
- `src/features/tenants/permissions/tenant-permissions-tab.tsx` and `tenant-permissions-scope.test.tsx` (new)
- `src/features/catalog/master-permissions/permission-list-page.tsx` and `permission-list-page.test.tsx`
- `src/lib/api/modules/master-permissions.ts` and `master-permissions.test.ts`
- Fixtures and existing tests changed only to add `scope` or to answer the scope the tab needs: `src/test/handlers/tenant-permissions.ts` (adds `catalogueWithScope`, contract-key fixtures `appointment:view` and `patient_profile:view`, and the alias `FIXTURE_MASTER_PERMISSION_BRANCHES`), `role-detail-page.test.tsx`, `role-screens-gaps.test.tsx`, `tenant-permissions-tab.test.tsx`, `tenant-permissions-tab.edge.test.tsx`.
- `src/test/handlers/catalog.ts` is unchanged from main. It imports `FIXTURE_MASTER_PERMISSION_BRANCHES`, which is kept as an alias in `tenant-permissions.ts` so the import still compiles.

Stack standards applied: `standards-frontend.md`, `tech-stack-frontend.md` (Vitest, React Testing Library 16.x, MSW 2.x).

## Test Cases

| TODO item | Result | Test file and test |
|-----------|--------|--------------------|
| Schema: `scope` required and enum | Covered | `src/types/master-permission.test.ts`: accepts `PLATFORM` and `TENANT`; rejects a response without `scope`; rejects `"platform"`, `"SYSTEM"`, `""`, `null`, `1`. |
| (b) `filterByScope(catalogue, scope)` | Covered | `checklist.test.ts`: keeps only the given scope in catalogue order; empty result when no match or empty input; the input array is not changed. |
| (c) Role Permissions tab shows PLATFORM only | Covered | `role-permissions-scope.test.tsx`: PLATFORM rows shown, TENANT row (`appointment:view`) absent. |
| (c) Held key outside the shown catalogue is kept in the PUT | Covered | `role-permissions-scope.test.tsx`: role holds `appointment:view` (TENANT, not shown); after a PLATFORM toggle the PUT body still contains `appointment:view`. |
| (d) Tenant Permissions tab shows TENANT only | Covered | `tenant-permissions-scope.test.tsx`: TENANT row shown, PLATFORM row (`system_roles:view`) absent. |
| (d) Saved PLATFORM id kept in the PUT | Covered | `tenant-permissions-scope.test.tsx`: tenant saved with a PLATFORM id and a TENANT id; unchecking the TENANT id sends `[PLATFORM_ID]` in the PUT. |
| (e) Catalogue Scope badge | Covered | `permission-list-page.test.tsx` "scope column": Scope header; PLATFORM and TENANT badge text per row. |
| (e) No scope filter | Covered | Same describe: no combobox, radio, or control labelled scope. |
| (e) Search matches scope | Covered | Same describe: searching `platform` shows the PLATFORM row and hides TENANT rows. |
| (e) `COLUMN_COUNT` 8 | Covered | Same describe: empty-state `td` has `colspan="8"`. |
| (f) PATCH without `scope` (service) | Covered | `master-permissions.test.ts`: a `scope` passed by the caller is not in the PATCH body. |
| (f) PATCH without `scope` (dialog) | Covered | `permission-list-page.test.tsx` "PATCH never sends scope": the re-fetched permission carries `scope: "TENANT"`; the PATCH body has no `scope` key. |
| (g) 400 PERMISSION_SCOPE_NOT_ALLOWED: fixed copy and reference id, no server text (role tab) | Covered | `role-permissions-scope.test.tsx`: alert shows the fixed copy and `Kode referensi`; the server text is absent; no success toast. |
| (g) Only that code gets the scope copy | Covered | `role-permissions-scope.test.tsx`: a 400 with `SOMETHING_ELSE` does not show the scope copy. `role-failure.test.ts`: 409 with the same code and a non-API error fall back to `describeRoleWriteFailure`. |
| (g) Unit-level copy helper | Covered (gap added) | `role-failure.test.ts` (new): `describeRolePermissionsFailure` returns the fixed copy and `correlationId` for 400 scope; the message does not contain the server text; another 400 code falls through. |
| D13.2 empty state, role tab (one test) | Covered | `role-permissions-scope.test.tsx` "role Permissions tab empty state": catalogue has no PLATFORM permission; shows `Belum ada permission untuk peran sistem di katalog.`; no checkbox rendered. |
| D13.2 empty state, tenant tab (one test) | Covered | `tenant-permissions-scope.test.tsx` "tenant Permissions tab empty state": catalogue has no TENANT permission; shows `Belum ada permission untuk tenant di katalog.`; no checkbox rendered. |
| Fixtures use contract keys | Covered | `src/test/handlers/tenant-permissions.ts`: `appointment:view` (TENANT) and `patient_profile:view` (TENANT) used by the catalogue, role, tenant, and dialog tests. |
| Alias `FIXTURE_MASTER_PERMISSION_BRANCHES` | Covered | Alias of the appointment fixture, kept so the unchanged `src/test/handlers/catalog.ts` compiles. Not a test; no assertion of its own. |

Checked specifically:

- The role tab test uses `catalogueWithScope("PLATFORM")` and the tenant tab test uses `catalogueWithScope("TENANT")` in their `beforeEach`. The shared fixture mixes both scopes, so each existing tab test still shows the rows it asserts on.
- The tenant tab does not use the scope copy. The TODO says the copy applies to the role tab only. No test asserts the tenant tab's copy for this code, because the TODO does not define it.
- The empty-state copy is per tab. The role tab uses `Belum ada permission untuk peran sistem di katalog.` and the tenant tab uses `Belum ada permission untuk tenant di katalog.`. Each tab has one D13.2 test, and the tests assert the copy for that tab only.
- The red evidence (`red-run.txt` in the scratchpad, implementer run before the change): 17 tests failed out of 153 across 8 test files (5 files failed). It is reported by the implementer and was not re-run by this agent.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npx tsc -b`; `npx eslint .`; `npx vitest run --passWithNoTests` |
| Run at | 2026-10-16 08:51 (vitest run 1 and run 2; output file times) |
| Total | 1104 (83 files) |
| Passed | 1104 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Exit codes (captured without a pipe): `npx tsc -b` 0, `npx eslint .` 0, `npx vitest run --passWithNoTests` 0 (run 1) and 0 (run 2). The only console noise is the Node `localStorage` ExperimentalWarning, which is unrelated to the change.

Count: 1104 tests in 83 files in both runs, the same as the 08:33 run. The per-area breakdown in the 08:34 version (+27 over TODO-026) was not re-derived in this re-run. Per-file test-declaration counts now include the two new D13.2 empty-state tests (role tab 5 declarations, tenant tab 3).

## Execution Results

1104 tests passed (83 files), run 1 and run 2. No test failed in either run, so there is no flaky test to report.

## Handoff (FAIL only)

Not applicable. `execution_overall: PASS`.

TODO-027 stays `In Progress` in `master-todo.md` and `progress-tracker.md`. The orchestrator decides `Completed` after this report.

## Coverage

Coverage percentage is not recorded. No coverage provider (`@vitest/coverage-v8`) is installed in this workspace, and adding one is a dependency change that needs ADR approval, so it was not added. The 80% guideline is not verified by this run. Every changed production branch is exercised by a behavior test: the schema enum, `filterByScope`, the role tab filter and its PUT, the tenant tab filter and its PUT, the scope column, the search match, the 400 branch in `describeRolePermissionsFailure`, and the PATCH body in `updateMasterPermission`.

## Edge Cases

- Missing `scope`, and values outside the enum (lower case, unknown word, empty, `null`, number).
- Empty catalogue and no-match input for `filterByScope`; input array not mutated.
- A held key outside the shown catalogue is kept in the PUT (role tab). A saved PLATFORM id is kept in the PUT (tenant tab).
- 400 with the scope code: fixed copy, reference id, server text absent. 409 with the same code: no scope copy. 400 with another code: no scope copy.
- Empty catalogue row spans 8 columns.
- Empty state per tab: the role tab shows its copy when the catalogue has no PLATFORM permission; the tenant tab shows its copy when the catalogue has no TENANT permission. Neither renders a checkbox.
- Idempotency: not applicable (PUT is full replacement by stable resource ID; PATCH by stable ID).

## Mocking Strategy

- MSW 2.x handlers per test (`/api/v1/master-permissions`, `/system-roles/:id/permissions`, `/tenants/:tenantId/permissions`, PUT and PATCH echo handlers). Shared fixture `catalogueWithScope` in `src/test/handlers/tenant-permissions.ts`.
- `useAuth` and `sonner` are mocked with `vi.hoisted` (permissions list and toast spies), as in the existing tab tests.
- Each test builds a fresh `QueryClient` and clears it in `afterEach`; `vi.unstubAllEnvs` and `vi.restoreAllMocks` run after each test. No shared mutable state and no timers.
- `console.error` is silenced per test, as in the existing suites.

## Open Questions

None blocking.

Observation (not a question): the TODO does not define the copy for a 400 `PERMISSION_SCOPE_NOT_ALLOWED` on the tenant tab. The tenant tab keeps its own write-failure copy, and no test asserts it for this code.
