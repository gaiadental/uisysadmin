---
id: UNIT-TEST-REPORT-TODO-011
title: Unit Test Report — TODO-011 Tenant Permissions tab
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 08:42
related_todo: TODO-011
execution_overall: PASS
source_requirements: [REQ-FE-018, REQ-FE-026, REQ-FE-036, REQ-FE-040, REQ-FE-048]
related_artifacts: [TODO-011, TODO-009, TODO-010, UNIT-TEST-REPORT-TODO-010, ARCH-FE-001, ADR-003, ADR-002, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-011 Tenant Permissions tab
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 08:42
Source Requirements: REQ-FE-018, REQ-FE-026, REQ-FE-036, REQ-FE-040, REQ-FE-048
Related Artifacts:
- output/plans/master-todo.md (TODO-011)
- output/reports/unit-test-report-TODO-009.md
- output/reports/unit-test-report-TODO-010.md
- ARCH-FE-001 v1.0 (D6.4, D7, D9, D12.1, D13)
- ADR-003, ADR-002, ADR-005

## At a Glance

- Verifies the tenant Permissions tab: list, one PUT on save, one PATCH on toggle, gates and states.
- Full suite PASS (432/432, 40 files). No production code modified. One test file added to close edge-case gaps.
- TODO-009 and TODO-010 regressions pass (included in the full run).

## Purpose

Record scope, cases, execution, coverage, edge cases and mocking for TODO-011.

## Scope

Under test (TODO-011 File scope):
- `src/lib/api/modules/tenant-permissions.ts`, `master-permissions.ts`
- `src/features/tenants/permissions/` (access gates, checklist helpers, path helper, schema, tab)
- Permissions tab on the detail page and route `/tenants/:id/permissions`
- MSW handlers `src/test/handlers/tenant-permissions.ts`

Out of scope: master permission writes (TODO-013), E2E (qa).

## Test Cases

Authored by the implementer (reviewed, quality acceptable: behavior-driven, MSW-backed, request shape asserted):
- `tenant-permissions.test.ts`: GET unwrap, id encoding, CONTRACT error on missing `enabled`; PUT sends only `masterPermissionIds` (also empty list), 400 mapped; PATCH sends only `enabled` to the id path.
- `master-permissions.test.ts`: array unwrap, GET path, unknown keys ignored, CONTRACT error, 403 as HTTP error.
- `access.test.ts`: SYS_PRINCIPAL + both view keys allow; either key missing denies; other role denies; `toggleKeyFor` on -> `:activate`, off -> `:deactivate`.
- `checklist.test.ts`, `permissions-path.test.ts`: grouping, sorting, selection helpers, path build/parse.
- `tenant-permissions-tab.test.tsx`: loading, read error + retry, empty catalogue, pre-checked groups, Simpan disabled until dirty, exactly one PUT, refetch after save (D12.1), save failure keeps selection, Batalkan, exactly one PATCH (off and on), toggle failure, actions hidden without `:update`, switches hidden without `:activate`/`:deactivate`, only the permitted switch shown.
- `tenant-detail-permissions-route.test.tsx`: tab opens on the route, address moves with tab, tab absent without both view keys.

Added by unit-test-writer (`tenant-permissions-tab.edge.test.tsx`, 8 tests):
- Tenant-side read failure alone shows alert + retry.
- Retry recovers after a first failed read.
- Tenant with no assigned permissions: no switches, none checked, Simpan disabled.
- Unchecking everything sends PUT with empty `masterPermissionIds` (full replacement).
- Switch hidden for an assigned permission unchecked in the draft.
- Refetch after toggle (D12.1) plus success toast.
- Only `:activate` held: only the activate switch shown, enabled item shows status badge.
- No write keys: checklist cannot be changed, zero PUT/PATCH sent.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx vitest run |
| Run at | 2026-10-12 08:41 |
| Total | 432 |
| Passed | 432 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Test files: 40 passed (39 before; +1 added). TODO-011 scope: 39 tests in 6 files plus 2 API module files.

Other gates:
- `npx tsc --noEmit -p tsconfig.app.json`: 21 errors, all in legacy `src/pages/*` (katalog-*, sistem-sesi, tenant-create, tenant-detail, tenant-list, tim-akun, tim-peran). None in TODO-011 scope. Pre-existing, outside scope.
- `npx eslint` on `src/features/tenants`, `src/lib/api/modules`, `src/types`, `src/test`, `src/app/router.tsx`: clean (0 problems).

## Execution Results

432 tests passed.

## Handoff (FAIL only)

Not applicable (PASS).

## Coverage

Not measured: no coverage provider (`@vitest/coverage-*`) is installed (only `mocker`, `spy` present). Not installing it (dependency change out of scope). Qualitative: every exported function and every branch of the tab (loading, error, empty, read-only, per-key switch, save ok/fail, toggle ok/fail, cancel) has at least one test. Guideline of 80% is believed met but is unverified.

## Edge Cases

Null/undefined: tenant with no assignments, missing `enabled`/`key` (CONTRACT). Empty: empty catalogue, empty PUT list. Boundary: single-id toggle, draft vs saved set. Invalid: 400 on PUT, 403 on PATCH. Failure: 502 on either read, retry. Access: SYS_PRINCIPAL and both view keys, update/activate/deactivate keys.
Idempotency: PUT is a full replacement and PATCH sets an absolute `enabled` value (idempotent by HTTP semantics, not in scope of key-based dedup). The component blocks concurrent toggles (`togglingId`); the in-flight guard is exercised only indirectly (one PATCH per click).

## Mocking Strategy

- HTTP: MSW (`src/test/server`, handlers in `src/test/handlers/tenant-permissions.ts`); per-test `server.use` overrides record request bodies.
- `useAuth` mocked via `vi.mock` to control permission keys.
- `sonner` toast mocked; real QueryClient per test, cleared in `afterEach`.
- No real network, no time or randomness dependence.

## Open Questions

None
