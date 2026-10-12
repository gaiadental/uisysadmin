---
id: UTR-TODO-019
title: Unit Test Report TODO-019
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 10:35
related_todo: TODO-019
execution_overall: PASS
source_requirements: [REQ-FE-007]
related_artifacts: [ARCH-FE-001, ADR-001, ADR-005, TODO-012, TODO-019, QA-D-1]
blocking_open_questions: 0
---

Title: Unit Test Report TODO-019 (Nullable updated_by in countries and tenant-categories)
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 10:35
Source Requirements: REQ-FE-007
Related Artifacts: TODO-019; TODO-012 (Completed); QA D-1 (`output/reports/qa-report-validate.md`); ARCH-FE-001 v1.0 (D5.2, D5.5); ADR-001 (Zod 4 at the mapper boundary); ADR-005 (Vitest unit tests)

## At a Glance

- Two list tests (tenant categories and countries) that send `updated_by: null` pass. The schema change in `src/types/country.ts` and `src/types/tenant-category.ts` is the only production change.
- Overall PASS. Full suite: 70 files, 886 tests, all passing. `npx tsc -b`, `npm run build` and ESLint on the changed files all exit 0.
- Fail-without check: with the schema reverted in a scratch copy, both new tests fail with `CONTRACT`. Status is Pending Approval; this report does not mark TODO-019 Completed.

## Purpose

Verify that `updated_by` accepts `null` in the countries and tenant-categories list contracts and maps to `updatedBy: null`, and that the rest of each contract is unchanged (`created_by` stays required). This is the unit test gate for TODO-019 and closes the test side of QA D-1.

## Scope

In TODO file scope:

- `src/types/country.ts` and `src/types/tenant-category.ts`: wire schema `updated_by` is `z.string().nullable()`; mapped `updatedBy` is `string | null`. Implemented by developer_frontend.
- `src/lib/api/modules/reference.test.ts`: the two new list tests.
- `src/lib/api/modules/countries.ts` and `src/lib/api/modules/tenant-categories.ts`: no logic change; the list functions parse through the changed schemas. Not edited.
- `src/lib/api/modules/catalog.test.ts`: listed in File scope; no `updated_by: null` test was added there (see Open Questions, OQ-UT-19-01).

Production code was not modified by unit-test-writer. No test file was added or changed by unit-test-writer in this run. The fail-without and edge checks ran in a scratch copy outside the repository.

Stack: frontend. Vitest 5.0.3, React Testing Library, MSW 2.x, jsdom. Standards: `standards-frontend.md` -> Testing Standards; `tech-stack-frontend.md` -> Testing Standard.

## Test Cases

New in this TODO (developer-authored, reviewed by unit-test-writer):

| Test | File | Result |
|------|------|--------|
| accepts a null updated_by and maps it to updatedBy null (tenant categories) | `src/lib/api/modules/reference.test.ts` | Passed |
| accepts a null updated_by and maps it to updatedBy null (countries) | `src/lib/api/modules/reference.test.ts` | Passed |

Both assert `updatedBy` is `null` and that `createdBy` still equals the fixture value.

Existing tests in the same file that cover the changed contract (regression):

| Test | Result |
|------|--------|
| tenant categories: maps every field of a category to camelCase | Passed |
| tenant categories: reports a category without is_active as CONTRACT | Passed |
| countries: maps every field of a country to camelCase | Passed |
| countries: accepts null nationality and phone code | Passed |
| tenant categories and countries: filters, pagination, multi-page loaders, no automatic retry | Passed |

File total: 12 of 12 passed.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx vitest run |
| Run at | 2026-10-12 10:33 |
| Total | 886 |
| Passed | 886 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Test files: 70 passed (70). The total is the 884 baseline plus the 2 new tests in this TODO.

Supporting checks:

| Command | Result |
|---------|--------|
| npx vitest run src/lib/api/modules/reference.test.ts | 12 of 12 passed |
| npx tsc -b | exit 0 |
| npm run build (tsc -b and vite build) | exit 0; built in 554 ms |
| npx eslint src/types/country.ts src/types/tenant-category.ts src/lib/api/modules/reference.test.ts | exit 0 |
| Fail-without check (scratch copy, schema reverted to z.string()) | 2 of 12 failed: both new tests, each with CONTRACT |
| Edge checks (scratch copy, real schema) | 7 of 7 passed |

## Execution Results

886 tests passed (70 files). `reference.test.ts`: 12 of 12 passed.

## Coverage

Not measured. The project does not have `@vitest/coverage-v8` installed (`--coverage` reports MISSING DEPENDENCY). Installing it would change `package.json` and was not done in this run.

The changed code is two Zod wire schemas and two pass-through mappers. The new tests exercise the `updatedBy` mapping and the nullable branch of the schema. No percentage is recorded against the 80% guideline for these files.

## Edge Cases

Checked with temporary tests in a scratch copy (not in the repository):

| Case | Tenant categories | Countries | Expected |
|------|-------------------|-----------|----------|
| Null `updated_by` on one row of a two-row page, string on the other; `description` or `nationality_name` also null on the null row | Pass: row 1 `updatedBy` null, other fields intact; row 2 `updatedBy` string | Pass: same pattern | Per-row mapping, no cross-row effect |
| `created_by: null` together with `updated_by: null` | CONTRACT | CONTRACT | Still required |
| `updated_by` key absent | CONTRACT | CONTRACT | Nullable is not optional; still required |
| `updated_by` as a number (`0`) | CONTRACT | not run | Type still enforced |

Null, empty, boundary, invalid and failure inputs: null is covered above. Empty list: the change adds no branch that depends on list length; existing filter tests cover empty pages. Idempotency: not applicable; the change is on read (list) parsing and no write semantics changed.

## Mocking Strategy

- MSW server (`src/test/server`) with per-test `server.use` handlers returning `listBody` envelopes built from `FIXTURE_CATEGORY` and `FIXTURE_COUNTRY` (`src/test/handlers/tenants.ts`).
- No module mocks. Real Zod parsing and mapping run; the schemas are the system under test.
- `console.error` is spied and silenced; `VITE_API_BASE_URL` is stubbed; the access token is reset before each test. `afterEach` restores mocks and env, so tests are independent.

## Traceability

| Type | Reference |
|------|-----------|
| Requirement | REQ-FE-007 (snake_case to camelCase mapping in the API layer). REQ-FE-005 and REQ-FE-046 do not apply to this change (per TODO). |
| Architecture | ARCH-FE-001 v1.0, D5.2 (wire mapping) and D5.5 (response validation; mismatch produces `CONTRACT`) |
| ADR | ADR-001 (Zod 4 at the mapper boundary); ADR-005 (Vitest unit tests) |
| TODO | TODO-019 (Critical); builds on TODO-012 (Completed) |
| QA | D-1 (High), `output/reports/qa-report-validate.md` |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ-UT-19-01 | File scope lists `catalog.test.ts`, but no `updated_by: null` test was added there. Is a test required in that file? | TODO Description asks for a test "in each list response". | Scope of test evidence | developer_frontend | No | Open | Documented default: the two list tests named in the brief are in `reference.test.ts`; `catalog.test.ts` is unchanged and its tests pass. |
| OQ-UT-19-02 | Coverage provider is not installed, so coverage is not measured. | The 80% guideline is recorded per report. | Evidence gap only | developer_frontend | No | Deferred | Documented default: coverage recorded as not measured; no package change in this TODO. |
| OQ-UT-19-03 | Tenant-category create and update responses also parse through `TenantCategoryWireSchema`, so they now accept `updated_by: null`. No write-response test covers null. | The write path is widened without a test for it. | Low | developer_frontend | No | Open | Documented default: outside the TODO-019 test requirement; add with a future write-path test if wanted. |

Notes: `npm run build` regenerated `dist/` (gitignored). No production file outside the TODO-019 schema change was touched.
