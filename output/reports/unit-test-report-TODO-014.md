---
id: UNIT-TEST-REPORT-TODO-014
title: Unit Test Report — TODO-014 System users screens and detail
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 09:20
related_todo: TODO-014
execution_overall: PASS
source_requirements: [REQ-FE-018, REQ-FE-030, REQ-FE-031, REQ-FE-032, REQ-FE-036, REQ-FE-039, REQ-FE-040, REQ-FE-048]
related_artifacts: [TODO-014, TODO-009, TODO-010, TODO-011, TODO-012, TODO-013, ARCH-FE-001, ADR-003, ADR-002, ADR-004]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-014 System users screens and detail
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 09:20

## At a Glance

- Verifies the system user and role read modules, the `/system-users` list, the `/system-users/:id` detail with the "Sesi aktif" tab, self-protection, gates, confirm dialogs, error mapping, paging and D12.1 invalidation.
- Full suite PASS (709/709, 57 files). No production code modified. Two test files added (68 tests).
- TODO-009 to TODO-013 regressions pass (part of the full run). OQ-P-29..38 stay open and non-blocking.

## Purpose

Record scope, cases, execution, coverage, edge cases and mocking for TODO-014.

## Scope

Under test (TODO-014 File scope): `src/lib/api/modules/system-users.ts`, `system-roles.ts` (read), `src/types/system-user.ts`, `system-role.ts`, `src/features/team/users/`, routes in `src/app/router.tsx`, MSW handlers `src/test/handlers/system-users.ts`. Out of scope: E2E and go/no-go (qa); backend guard for own account (SP-BG-13); OQ-P-29..38 contract choices.

## Test Cases

Implementer-authored, reviewed (MSW-backed, request path and body asserted, quality acceptable):
- `system-users.test.ts`, `system-roles.test.ts`: list unwrap, GET paths, encoded id, unknown keys dropped, bad status and missing data as CONTRACT, create body, 409/400/403, role PATCH body, status PATCH, delete and reset resolve void, 404.
- `access.test.ts`, `schema.test.ts`, `user-paths.test.ts`: pure gates (including self id null), create schema, path parsing.
- `user-list-page.test.tsx`, `user-detail-page.test.tsx`: states, self badge, self hiding, view-only, update/delete/reset keys, Tambah akun gate, confirm and send for suspend/deactivate/delete/reset, reactivate without dialog, in-flight reset, 403, create dialog (validation, 409 on field, 400 role copy, in-flight, role-list error), role change, sessions tab basics.

Gap review (quality findings):
- The list "only its own actions" test asserts presence of any matching button and absence of others, but never the exact set per status, and the SUSPENDED/DEACTIVATED rows were not checked per key. Replaced by exact-set checks.
- The "does nothing when cancelled" test covered suspend only; deactivate, delete and reset cancel were untested.
- Error mapping covered 403 (list) and create 409/400 only; no 404/409/500 on status, delete, reset or force logout, and no check that a failed write skips invalidation.
- The double-send guard was tested only for reset password on the list; role change, delete on detail and force logout were not.
- Client paging, detail per-key gates, own account with non-ACTIVE status (OQ-P-31/32), sessions tab with `sessions:revoke` alone, 403 on the session list, and the D12.1 scope (no unrelated key touched) had no coverage.
- No test passes by construction in the implementer files; the gate `it.each` rows are loose but not vacuous.

Added by unit-test-writer:
- `user-list-page.gaps.test.tsx` (new, 29 tests): exact button set per gate key (`update`, `delete`, `reset_password`) on ACTIVE, SUSPENDED and DEACTIVATED rows; view-only and create-only render no row action; own row keeps only reset password; own row with SUSPENDED gets reactivate and reset only; self is matched by id, not by loginId; cancel for deactivate, delete and reset sends nothing; confirm title names the account; reactivate from DEACTIVATED and deactivate from SUSPENDED send the right status to the right id; error mapping 404 (frontend copy, server text hidden), 409 (server message), 400 without validation code (generic), 400 VALIDATION_FAILED (server message), 500 (generic, buttons re-enabled); failed write keeps the row and does not refetch; failure cleared on next action; double confirm sends one PATCH; every other row is disabled in flight; paging (25 as 20 then 5, one GET, search back to page 1, no pagination bar for one page); D12.1 (status change invalidates that user's detail and the list only; reset invalidates user keys; failed write invalidates nothing).
- `user-detail-page.gaps.test.tsx` (new, 39 tests): per-key exact buttons on the detail; update plus `system_roles:view` adds Ubah peran; view-only none; own account only reset, with non-ACTIVE only reactivate and reset; SUSPENDED and DEACTIVATED button sets; status change refetches and swaps buttons; cancel for four confirm actions sends nothing and stays on the page; deactivate and reset requests; error mapping for delete 403 and 404, status 409, reset 500, role change 400/403/404/409, failed role change does not invalidate; role change and delete in-flight guards; sessions tab (revoke alone hides tab, view alone lazy-loads on tab open, current-session badge, 403 on list, paging 10 then 2 with one GET); force logout (confirm title, 404/409/500 mapping without toast or refetch, one DELETE in flight, invalidation limited to the admin sessions key of that user); detail refetch after success and none after failure.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx vitest run |
| Run at | 2026-10-12 09:19 |
| Total | 709 |
| Passed | 709 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Baseline before gap tests: 641 passed (55 files). Added 68 tests in 2 files. TODO-014 directory alone: 147 passed (7 files).

Static checks:
- `tsc --noEmit -p tsconfig.app.json`: 21 errors, all in legacy `src/pages/*` (OQ-P-17); zero in TODO-014 scope.
- `eslint` on `src/features/team/users`, system-users and system-roles modules and tests, types, handlers: clean (one unused-parameter finding in a new test was fixed before the final run).

## Execution Results

709 tests passed.

## Regression (TODO-009 to TODO-013)

Passed in the full run: catalog (categories, countries, master permissions), tenants, auth and sessions modules, dialogs, client-paged hook, navigation. No failures.

## Coverage

Vitest coverage was not run (no coverage provider command in the TODO). Behavior coverage by requirement: REQ-FE-030 create (validation, 409, 400, in flight); REQ-FE-031 detail and role change; REQ-FE-032 sessions tab and force logout; REQ-FE-039 confirm dialogs (all five); REQ-FE-036/040/048 gates, errors and states; D12.1 invalidation for write, role change and force logout. Line coverage against the 80% guideline: not measured, to be recorded if the pipeline adds a coverage run.

## Edge Cases

Null/absent: unknown signed-in id (no self), null role description, absent data body. Empty: empty list, empty sessions, no-match search. Boundary: 20/21 and 10/11 page edges, single page hides pagination. Invalid: bad e-mail, missing role, status outside contract. Failure: 400/403/404/409/500, role list error, list error with retry, failure cleared on next action. Idempotency: create and reset are not idempotent (SP-BG-11, OQ-P-37); the UI guards one request in flight (tested on suspend, reset, delete, role change, force logout, create).

## Mocking Strategy

MSW handlers (`src/test/handlers/system-users.ts`, auth handlers) per test via `server.use`; `useAuth` mocked per file with a hoisted permission list; `sonner` toast mocked; real `QueryClient` and `DialogsProvider`; deferred promises gate in-flight cases. No production module is mocked.

## Handoff (FAIL only)

Not applicable (PASS).

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ-P-29..38 | Implementer defaults (create needs `system_roles:view`, status transitions per status, reset on own account, inactive roles offered, loginId pattern only, toast copy, no idempotency, own-account guard UI only) | Tests pin the current defaults; a decision change needs test updates | Low | project-manager | No | Open | Documented defaults kept |
| UT-014-1 | Coverage percentage not measured | 80% guideline cannot be confirmed numerically | Low | project-manager | No | Open | Behavior coverage documented above |

Note: the own-account guard is enforced in the UI only (SP-BG-13); the tests verify the UI behavior, not a server rule.
