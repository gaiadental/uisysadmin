---
id: UNIT-TEST-REPORT-TODO-021
title: Unit Test Report — TODO-021 Katalog Permission read-only
owner: unit_test_writer
status: Pending Approval
version: 1.1
last_updated: 2026-10-12 14:33
related_todo: TODO-021
execution_overall: PASS
source_requirements: [REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048]
related_artifacts: [TODO-021, TODO-013, ARCH-FE-001, ADR-002, ADR-003, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-021 Katalog Permission read-only
Owner: unit_test_writer
Status: Pending Approval
Version: 1.1
Last Updated: 2026-10-12 14:33
Source Requirements: REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048
Related Artifacts:
- output/plans/master-todo.md (TODO-021)
- ARCH-FE-001 v1.0.4 (D5.3, D6.4, D12.1, FE-OQ-38)
- ADR-002, ADR-003, ADR-005

## At a Glance

- Verifies Katalog > Permission is read-only with an edit of `name` and `description` only. Every acceptance criterion has a test; no gap found, so no test file was added by this run.
- Full suite PASS: 75 files, 912 tests, 0 failed. tsc and eslint clean. No production code modified. Reworked for QA M1 (see Rework section); 3 tests added by the implementer, reviewed here, no further gap requiring a new test.
- No blocking open questions.

## Purpose

Record scope, test cases, execution, coverage, edge cases and mocking for TODO-021.

## Scope

Under test: `permission-list-page.tsx`, `permission-form-dialog.tsx`, `schema.ts` (`permissionEditSchema`), `src/lib/api/modules/master-permissions.ts` (`getMasterPermission`, `updateMasterPermission`; create and delete removed by amendment), and the MSW handlers in `src/test/handlers/catalog.ts` (GET `/:id` added; POST and DELETE removed). Regression: TODO-011 and TODO-015 suites run in the full suite. Out of scope: server-side guard BG-12, end-to-end checks (QA).

## Test Cases

| TODO-021 criterion | Test (file) | Result |
|--------------------|-------------|--------|
| PATCH carries fresh values, not stale list values | `sends the freshly fetched read-only values, not the stale list values` (page test) | PASS |
| Re-fetch precedes the PATCH | `re-fetches before the PATCH` (GET then PATCH order) | PASS |
| Read-only fields are not editable controls | `shows key, category, module, active and customerPermitted as read-only text, not controls` (only name and description textboxes, no switch or combobox) | PASS |
| Failed re-fetch blocks the PATCH, shows error | `blocks the PATCH when the re-fetch fails, ...` (0 PATCH, alert, dialog open) | PASS |
| No create, active or delete control with all keys | `renders no create, active or delete control even with every master_permissions key` | PASS |
| `:create`, `:delete`, `:activate`, `:deactivate` alone offer no action | `%s alone shows no action at all` (4 cases) | PASS |
| Edit hidden without `:update`; shown with it | `offers no Ubah ... with only :view`, `shows Ubah with :update` | PASS |
| Exactly one PATCH with full body, key unchanged | `sends exactly one PATCH with the edited name and description` | PASS |
| Invalidation per D12.1; none on failure | `edit invalidates master, tenant and role permission queries`, `a failed write invalidates nothing` | PASS |
| Schema: name 1-100 trimmed, description optional, other fields dropped | `permissionEditSchema` describe (7 tests, schema.test.ts) | PASS |
| Incomplete re-fetch (M1): no PATCH, error alert, dialog stays open, no toast | `refuses to save and sends no PATCH when the re-fetch lacks %s` (active, customerPermitted: 2 cases) | PASS |
| Present flags sent unchanged (M1) | `sends active=false and customerPermitted=true unchanged when both are present` | PASS |
| API `getMasterPermission` GET, 404, CONTRACT | `getMasterPermission (TODO-021)` describe (3 tests) | PASS |

## Amendment (2026-10-12)

User-approved amendment to TODO-021: `createMasterPermission` and `deleteMasterPermission` were removed from `master-permissions.ts` together with their module tests (create and delete describe blocks and the create/delete cases in the additional-cases block; the update-only "drops keys outside the contract" case was kept). Total moved from 917 to 909 tests and TODO-021 files from 53 to 45. Re-run: tsc exit 0, eslint exit 0, vitest PASS. Test files and source were not edited by this run.

## Rework (M1, 2026-10-12)

QA finding M1: `permission-form-dialog.tsx` no longer defaults `active ?? true` / `customerPermitted ?? false`. When the re-fetched permission lacks either flag (non-boolean), the dialog shows 'Data permission dari server tidak lengkap. Perubahan tidak disimpan.' and sends no PATCH. Review M2: redundant `canUpdate` checks removed from `permission-list-page.tsx` (covered by existing :update/:view tests, still PASS). Tests added in `permission-list-page.test.tsx`: missing `active`, missing `customerPermitted`, and values sent unchanged (active=false, customerPermitted=true); the default GET handler in `beforeEach` and the order test now return both flags. Residual note: the guard uses `typeof !== "boolean"`, but tests exercise only absent keys, not explicit `null`; the same branch handles both, so no test was added. Re-run: tsc exit 0, eslint exit 0, vitest 912 passed (75 files); TODO-021 files 48 tests in 3 files. Total moved from 909 to 912 (+3).

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx tsc -p tsconfig.app.json --noEmit; npx eslint src; npx vitest run |
| Run at | 2026-10-12 14:32 |
| Total | 912 |
| Passed | 912 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

## Execution Results

912 tests passed (75 files). TODO-021 files: 48 tests in 3 files (page, schema, API module), all passed. tsc exit 0, eslint exit 0.

## Coverage

API module tests now cover list, get and update only. Every TODO-021 acceptance criterion maps to at least one test (table above). No line-coverage run was requested; the 80% guideline was not measured.

## Edge Cases

Re-fetched permission missing `active` or `customerPermitted` (no PATCH, nothing guessed), flags false/true passed through unchanged, blank and whitespace name, 100-character boundary, empty description, re-fetch 500, PATCH 500 and 409, 404 and malformed GET body, list loading, empty, error and no-match states, pagination.

## Mocking Strategy

MSW handlers per test via `server.use`; `useAuth` mocked for permission sets; `sonner` toast mocked. No real network. Tests are independent (query client cleared after each).

## Open Questions

None
