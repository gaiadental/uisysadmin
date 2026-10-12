---
id: UTR-TODO-015
title: Unit Test Report TODO-015
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 09:30
related_todo: TODO-015
execution_overall: PASS
source_requirements: [REQ-FE-018, REQ-FE-033, REQ-FE-034, REQ-FE-039, REQ-FE-040, REQ-FE-048, REQ-FE-049]
related_artifacts: [ARCH-FE-001, ADR-003, ADR-002, TODO-015]
blocking_open_questions: 0
---

Title: Unit Test Report TODO-015 (System roles screens and permission checklist)
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 09:30
Source Requirements: REQ-FE-018, REQ-FE-033, REQ-FE-034, REQ-FE-039, REQ-FE-040, REQ-FE-048, REQ-FE-049
Related Artifacts: ARCH-FE-001 v1.0 (D6.4, D6.6, D7, D9, D12.1), ADR-003, ADR-002, TODO-015, FP-186..FP-204

## At a Glance

- Tests for the System roles list, detail, form dialog and permission checklist. Both TODO-015 gate tests plus gaps filled.
- Overall PASS. 806/806 in the full suite, no regressions (TODO-009..014 included).
- References: ARCH-FE-001 D6.4/D6.6/D12.1, OQ-P-39..47 (non-blocking defaults).

## Purpose

Verify TODO-015 behaviour and record scope, coverage, edge cases and mocking.

## Scope

In TODO file scope only: `src/lib/api/modules/system-roles.ts`, `src/features/team/roles/`, `src/test/handlers/system-roles.ts`, router entries. No production code was changed. Stack: frontend (Vitest 5, React Testing Library, MSW).

## Test Cases

Implementer-authored (reviewed; none found to pass by construction, each refusal test first asserts the control is enabled before the refusal):
- `access.test.ts`: gate per key, static lock with all keys, refused flag, member counts, paths, selection helpers.
- `schema.test.ts`: key/name max 100, required, boolean active, keys not ids.
- `role-list-page.test.tsx`: loading, empty, error+retry, search, counts with/without `system_users:view`, SYS_PRINCIPAL row lock, update-only/delete-only, create gate, refusal in list, create validation, one POST + invalidation, 409 on key.
- `role-detail-page.test.tsx`: lock (Gate 1), refusal from delete/edit/PUT (Gate 2), logout clear, other-role isolation, checklist one PUT, grouping, read-only, no tab, retry, loading, key read-only on edit, delete flow, not found.
- `src/lib/api/modules/system-roles.test.ts`: all endpoints, 409, refusal code, CONTRACT errors, one PUT.

Added by unit-test-writer (26 tests, 2 new files):
- `src/features/team/roles/refused-roles.test.tsx` (4): per-role mark and idempotency, shared across consumers, cleared by `queryClient.clear()` after unmount, survives D12.1 invalidations.
- `src/features/team/roles/role-screens-gaps.test.tsx` (22):
  - List: refusal isolates to one role among three; 500 and 409 on delete are not refusals; refusal cleared after clear + remount; member count 0 with `system_users:view`; dash on every row without it; dash (no false 0) when the user list fails.
  - Detail gates independently: update only, delete only, view only, update without `master_permissions:view` (no tab/save), update + catalogue (editable).
  - Checklist: keys outside the catalogue preserved in the PUT (OQ-P-40); uncheck all sends one PUT with `[]`; Batalkan restores, no PUT; GET refetch after save (D12.1 `rolePermissionsReplace`); 500 on PUT keeps it editable; empty catalogue message; catalogue error state.
  - Edit: invalidates `['system','roles']`, `['system','users']`, `['system','role',2]`; 500 on PATCH is not a refusal; refused PUT on role 2 leaves role 3 enabled.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx vitest run |
| Run at | 2026-10-12 09:29 |
| Total | 806 (63 files) |
| Passed | 806 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

TODO-015 scope alone: 7 files, 102 tests, all passed. Baseline before additions: 780 tests in 61 files.

## Execution Results

806 tests passed.

Regressions: none. TODO-009..014 suites (tenants, catalog, categories/countries, master/tenant permissions, sessions, system users) all pass inside the full run.

Static checks:
- `npx tsc --noEmit -p tsconfig.app.json`: 21 error lines, all in legacy `src/pages/*` (OQ-P-17: katalog-*, sistem-sesi, tenant-*, tim-akun, tim-peran). Zero in TODO-015 scope or in the new tests.
- `npx eslint` on `src/features/team/roles`, `system-roles.ts`, `system-roles.test.ts`, `src/test/handlers/system-roles.ts`, `src/app/router.tsx`: clean (no output).

## Handoff (FAIL only)

Not applicable (PASS).

## Coverage

No coverage run was requested or configured in this task, so a percentage is not recorded. Behavioural coverage against the TODO gates: Gate 1 (SYS_PRINCIPAL lock for deactivate/edit, delete, permission change) covered on list and detail, also with every permission held. Gate 2 (refusal disables edit and delete; one PUT; schema tests) covered for refusal from delete, edit and PUT, per-role isolation, and clear on logout. The 80 percent guideline is not verified numerically.

## Edge Cases

Null description, empty description, max-length key/name, empty selection, keys outside the catalogue, non-numeric and unknown role id, 404/409/403/500/503 responses, zero members, missing `system_users:view`, user list failure, double submit, cancelled confirm.
Idempotency: not applicable (no idempotency key in the role APIs; the PUT is a full replacement and the tests assert exactly one request).

## Mocking Strategy

MSW handlers in `src/test/handlers/system-roles.ts` and `system-users.ts`, per-test `server.use` overrides; `useAuth` mocked per file for permissions; `sonner` toast mocked; fresh `QueryClient` per test and `clear()` on teardown.

## Observations (no production change made)

- A mounted `useRefusedRoles` consumer keeps its stale value if `queryClient.clear()` runs without unmounting (observer keeps its last result). The app logs out by leaving protected screens, and the remount tests pass, so this is not a defect for the gate. Recorded for awareness only.
- `hint`-prop type errors are in legacy `src/pages` (OQ-P-17).

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ-P-39..47 | Implementer defaults for TODO-015 (keys in checklist, off-catalogue keys kept, PUT refusal marks role, optional `active`, description handling, 409 on delete, link for SYS_PRINCIPAL, refused state in query cache, count dash) | Behaviour is covered by tests as written | None for tests | project-manager | No | Open | Tested as documented defaults (OQ-P-40, 41, 44, 46, 47 each have a test) |
