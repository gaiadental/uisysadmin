---
id: UNIT-TEST-REPORT-TODO-010
title: Unit Test Report — TODO-010 Tenant create wizard and detail page
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 08:35
related_todo: TODO-010
execution_overall: PASS
source_requirements: [REQ-FE-021, REQ-FE-022, REQ-FE-023, REQ-FE-024, REQ-FE-025, REQ-FE-038, REQ-FE-039, REQ-FE-040, REQ-FE-048, REQ-FE-049]
related_artifacts: [TODO-010, TODO-009, UNIT-TEST-REPORT-TODO-009, ARCH-FE-001, ADR-003, ADR-002]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-010 Tenant create wizard and detail page
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 08:35
Source Requirements: REQ-FE-021, REQ-FE-022, REQ-FE-023, REQ-FE-024, REQ-FE-025, REQ-FE-038, REQ-FE-039, REQ-FE-040, REQ-FE-048, REQ-FE-049
Related Artifacts:
- output/plans/master-todo.md (TODO-010)
- output/reports/unit-test-report-TODO-009.md
- ARCH-FE-001 v1.0 (D8.2, D9, D12.1, D12.3, D14, D15)
- ADR-003, ADR-002

## At a Glance

- Verifies the tenant create wizard and tenant detail page of TODO-010, including the TODO-009 tenant-list regression.
- Full suite PASS (381/381). No production code modified; no new test files were needed (all acceptance items already covered).
- Key references: TODO-010 Notes (acceptance), ARCH-FE-001 D8.2/D9/D15.

## Purpose

Record scope, cases, execution, coverage, edge cases and mocking for TODO-010.

## Scope

Under test (TODO-010 File scope):
- `src/features/tenants/create/` (wizard, `classifyAdminAccount`, write-failure mapping)
- `src/features/tenants/detail/` (detail page, `buildPatch`, `safeLogoSrc`, paths)
- `src/features/tenants/schema.ts`
- `src/features/tenants/list/` ("Tambah tenant" button and code link; TODO-009 regression)
- `src/features/tenants/shared/` (failure mapping)
- router and routes-meta additions are exercised through navigation in the page tests.

Out of scope: end-to-end against a real stack (TODO-016/QA), Permissions tab (TODO-011).

## Test Cases

| Acceptance item (TODO-010 Notes) | Test file | Cases |
|---|---|---|
| Five combinations of `classifyAdminAccount` incl. FAILED | `create/classify-admin-account.test.ts` | CREATED+SYNCED; CREATED+FAILED; CREATED+absent; FAILED+absent; FAILED+present sync |
| FAILED + Retry (component) | `create/tenant-create-page.test.tsx` | sync FAILED warning and Retry calls the endpoint; retry to SYNCED; admin-account FAILED warning and Retry; retry 503 keeps the page |
| Success path toast then detail | `create/tenant-create-page.test.tsx` | CREATED+SYNCED |
| Wizard steps, per-step Zod | `create/tenant-create-page.test.tsx` | blocked on invalid step; Enter does not submit; uppercase code; whitelist keys only |
| 409 on code; 400 form alert | `create/tenant-create-page.test.tsx` | 409 on code field; VALIDATION_FAILED as form error |
| Second DEDICATED 400 message | `create/tenant-create-page.test.tsx` | "shows the DEDICATED refusal as a clear form alert" |
| Submit disabled in flight, no auto retry | `create/tenant-create-page.test.tsx` | single request |
| Immutable fields read-only | `detail/tenant-detail-page.test.tsx` | read-only inputs |
| No delete control | `detail/tenant-detail-page.test.tsx` | no delete control anywhere |
| PATCH only changed/allowed keys | `detail/tenant-detail-page.test.tsx`, `detail/profile-patch.test.ts` | unchanged empty; single key; null on emptied logo; country alone; Save disabled until change; non-http logo rejected |
| `is_active` revert on 503, no optimistic update | `detail/tenant-detail-page.test.tsx` | revert and server message; confirm dialog on deactivate; cancel sends nothing; reactivate without confirm |
| Resend admin account always offered with confirm | `detail/tenant-detail-page.test.tsx` | endpoint call after confirm; sync warning on FAILED |
| https logo render check | `detail/tenant-detail-page.test.tsx`, `detail/logo-url.test.ts` | https renders image; non-https and data: do not; http only in development |
| Detail states (D13) | `detail/tenant-detail-page.test.tsx` | loading, 404, error with retry |
| Schema unit tests | `schema.test.ts` | PASS |
| TODO-009 list regression | `list/tenant-list-page.test.tsx`, `list/list-filters.test.ts`, `list/tenant-list-links.test.tsx` | PASS |

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx vitest run (npm test) |
| Run at | 2026-10-12 08:29 |
| Total | 381 |
| Passed | 381 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Test files: 32 passed (32). TODO-010 scope files: 11 files (create 2, detail 4, list 3, shared 1, schema 1).

Additional checks:
- `npm run typecheck` (tsc --noEmit): PASS (no errors).
- `npm run lint`: 11 errors, all in files outside TODO-010 File scope and untouched by it (`src/components/ui/{badge,button,select,sidebar,tabs,toggle}.tsx`, `src/hooks/use-mobile.ts`, `src/hooks/use-pagination.ts`, legacy `src/router/index.tsx`). No lint findings in TODO-010 files. Reported as pre-existing, not a TODO-010 test failure; see Open Questions.

## Execution Results

381 tests passed.

TODO-009 regression: `src/features/tenants/list/` (3 files, 23 tests) PASS in the full run and in an isolated run.

## Coverage

No coverage tool run was requested or configured in the `test` script; coverage is assessed by behavior mapping (table above): every TODO-010 acceptance item has at least one passing test, and each production file in scope (classifier, write-failure, select-field, logo-url, buildPatch, tenant-paths, create page, detail page, schema) has a direct test or is exercised by a page test. Numeric 80% line coverage is not measured (guideline).

## Edge Cases

Null/empty (emptied logo sends null; null and empty treated equal), boundary (all five classifier combinations, absent sync), invalid (non-http logo, data: and malformed URLs, invalid wizard step), failure (409, 400 DEDICATED, VALIDATION_FAILED, 503 on is_active, 503 on retry, 404, read error), duplicate submission (button disabled in flight, one request, no automatic retry per SP-BG-11).

## Mocking Strategy

MSW 2.x handlers (`src/test/handlers/tenants.ts`) mock the gateway; React Testing Library with a fresh QueryClient per test; sonner toast and router navigation observed via spies/memory router; no real network or timers shared between tests. Tests are independent and deterministic.

## Handoff

Not applicable (PASS).

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | 11 pre-existing lint errors outside TODO-010 scope (ui components, hooks, legacy router) | TODO-001 gate requires lint PASS repo-wide | None on TODO-010 files | project-manager | No | Open | Register as tech debt; not a TODO-010 defect |
| OQ2 | Numeric coverage not measured | 80% guideline | Low | project-manager | No | Open | Behavior-mapped coverage documented |
