---
id: UNIT-TEST-REPORT-TODO-020
title: Unit Test Report — TODO-020 Tenant detail live contract (category and country keys)
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 10:50
related_todo: TODO-020
execution_overall: PASS
source_requirements: [REQ-FE-007, REQ-FE-021, REQ-FE-022, REQ-FE-023, REQ-FE-024, REQ-FE-025]
related_artifacts: [TODO-020, TODO-009, TODO-010, UNIT-TEST-REPORT-TODO-010, ARCH-FE-001, ADR-001, ADR-002, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-020 Tenant detail live contract (category and country keys)
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 10:50
Source Requirements: REQ-FE-007, REQ-FE-021, REQ-FE-022, REQ-FE-023, REQ-FE-024, REQ-FE-025
Related Artifacts:
- output/plans/master-todo.md (TODO-020, master-todo v1.7)
- output/reports/unit-test-report-TODO-009.md (list regression, via TODO-010)
- output/reports/unit-test-report-TODO-010.md (create and detail regression)
- ARCH-FE-001 v1.0 (D5.2, D5.5)
- ADR-001, ADR-002, ADR-005

## At a Glance

- Verifies that the tenant detail parse accepts the live `GET /api/v1/tenants/{id}` shape (nested `tenant_category` and `country`, no flat `tenant_category_id` or `country_code`), as TODO-020 requires.
- Full suite PASS: 70 files, 890 tests, 0 failed. The tenants API module file has 33 tests, 4 of them new for TODO-020. No production code was modified.
- Fail-without check (scratch copy only): reverting the detail schema to the flat-key shape makes the two TODO-020 detail tests fail with CONTRACT. The two create and list tests pass both ways.
- No Blocking open questions. Open question OQ1 (live `social_links` key not verified) must be resolved before TODO-020 is set to `Completed`.

## Purpose

Record the scope, test cases, execution results, fail-without evidence, regression checks, edge cases and mocking strategy for TODO-020, and gate the TODO on `execution_overall`.

## Scope

Under test (TODO-020 File scope, as implemented by developer_frontend):
- `src/types/tenant.ts`: `TenantCommonWireSchema` (shared keys), `TenantWireSchema` (list, create and PATCH keep the flat `tenant_category_id` and `country_code`), `TenantDetailWireSchema` (nested `tenant_category` and `country`, no flat keys), `mapTenantDetail` (derives `tenantCategoryId` from `tenant_category.id` and `countryCode` from `country.code`, or `null` when `country` is `null`).
- `src/lib/api/modules/tenants.ts`: `getTenant`, `listTenants`, `createTenant` (the module entry points for the mapped results).
- `src/lib/api/modules/tenants.test.ts`: the file-level suite, including the new describe `tenant category and country keys (TODO-020)`.
- `src/test/handlers/tenants.ts`: `FIXTURE_TENANT_DETAIL` is now nested-only and is served by the `GET /tenants/:id` handler.

Regression scope (TODO-020 Gate): TODO-009 tenant list (`src/features/tenants/list/`), TODO-010 create (`src/features/tenants/create/`) and TODO-010 detail (`src/features/tenants/detail/`). The whole suite is also run.

Out of scope: end-to-end checks against the live stack (QA), the platform repository (not changed by TODO-020), and the QA report record of the finding (QA-owned, see OQ3).

## Test Cases

### TODO-020 acceptance tests (`src/lib/api/modules/tenants.test.ts`)

| TODO-020 unit requirement | Test | Repo result | Fail-without (scratch) |
|---------------------------|------|-------------|------------------------|
| (1) Detail with nested `tenant_category` and `country: null` maps and passes validation | `accepts a nested-only detail with a null country and maps the category id` | PASS | FAIL, CONTRACT |
| (2) Detail with `country` present maps `countryCode` from `country.code` | `maps countryCode from country.code when the detail has a country` | PASS | FAIL, CONTRACT |
| (3) Create and list still map the flat `tenant_category_id` and `country_code` | `still maps the flat tenant_category_id and country_code on create and list` | PASS | PASS |
| (3) Create keeps the flat keys required | `keeps the flat keys required on create: a body without tenant_category_id is CONTRACT` | PASS | PASS |

The fixture guard inside test (1) asserts that `FIXTURE_TENANT_DETAIL` has no `tenant_category_id` and no `country_code`, so the test cannot pass on a fixture that still carries the flat keys.

### TODO-009 and TODO-010 regression (existing tests, unchanged)

| Scope | Files | Tests | Repo result |
|-------|-------|-------|-------------|
| TODO-009 list (`src/features/tenants/list/`) | 3 | 23 | PASS |
| TODO-010 create (`src/features/tenants/create/`) | 2 | 18 | PASS |
| TODO-010 detail (`src/features/tenants/detail/`) | 4 | 29 | PASS |
| Schema and shared (`schema.test.ts`, `shared/`) | 2 | 19 | PASS |
| Combined run of the four rows above | 11 | 89 | PASS |

Existing `getTenant` tests in `tenants.test.ts` ("maps the detail, with the joined category and country", "accepts a null country", "reports a detail without its category as CONTRACT") also pass in the repo.

## Fail-Without Check

Method: a scratch copy of the repository was created outside the project (`scratchpad/todo020-failcheck`, `node_modules` symlinked). In the copy only, `TenantDetailWireSchema` was reverted to the pre-TODO-020 shape by adding the required flat keys `tenant_category_id: z.string().min(1)` and `country_code: z.string().nullable()`. No file in the repository was changed. Production `src/types/tenant.ts` is unchanged (verified with `git diff` on `src/types`, `src/lib/api`, `src/test`).

Result in the scratch copy, `src/lib/api/modules/tenants.test.ts`: 4 failed, 29 passed (33).

| Test | Scratch result | Error |
|------|----------------|-------|
| TODO-020 (1) nested-only detail, null country | FAIL | ApiError, kind CONTRACT ("Respons server tidak sesuai kontrak. Coba lagi.") |
| TODO-020 (2) country present, `countryCode` from `country.code` | FAIL | ApiError, kind CONTRACT |
| TODO-010 `maps the detail, with the joined category and country` | FAIL | ApiError, kind CONTRACT (fixture is nested-only) |
| TODO-010 `accepts a null country` | FAIL | ApiError, kind CONTRACT (fixture is nested-only) |

The message maps to kind `CONTRACT` at `src/lib/api/errors.ts` (line 96).

Tests that pass both ways (29 of 33): all list tests (8), the `getTenant` 404 and no-category tests (2), the create tests (5), the PATCH whitelist tests (7), the retry tests (2), the validation-code tests (3), and TODO-020 (3) and (4) (2). These guard list, create and the whitelist, and they do not discriminate the detail contract.

Blast radius of the reverted schema, full scratch suite: 24 failed, 866 passed (890). The failures are in 3 files:
- `src/lib/api/modules/tenants.test.ts`: 4 (above).
- `src/features/tenants/detail/tenant-detail-page.test.tsx`: 17 (TODO-010 detail page). These fail because the shared fixture is nested-only, so the old detail schema cannot parse it. This is a fixture-driven effect, not a new defect in TODO-010 behavior.
- `src/features/tenants/permissions/tenant-detail-permissions-route.test.tsx`: 3 (TODO-011 Permissions tab, same cause).

The scratch copy is a discardable artifact in the session scratchpad. It is not part of the project.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx vitest run |
| Run at | 2026-10-12 10:47 |
| Total | 890 |
| Passed | 890 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Test files: 70 passed (70).

Targeted run: `npx vitest run src/lib/api/modules/tenants.test.ts` (2026-10-12 10:48): 33 passed (33), 0 failed.

Additional checks (run against the repository, not the scratch copy):

| Check | Command | Result |
|-------|---------|--------|
| Typecheck | `npx tsc -b` | Exit 0, no errors |
| Production build | `npm run build` | Built successfully (`tsc -b` and Vite build) |
| Lint, changed files | `npx eslint src/types/tenant.ts src/test/handlers/tenants.ts src/lib/api/modules/tenants.test.ts src/lib/api/modules/tenants.ts` | Exit 0, no findings |
| TODO-009 and TODO-010 regression | `npx vitest run src/features/tenants/list`, `.../create`, `.../detail`, plus schema and shared | 23, 18, 29 and 89 tests passed (see table above) |

Repository-wide lint was not run (outside TODO-020 scope).

## Execution Results

890 tests passed in 70 files. TODO-020 scope: 33 tests in `tenants.test.ts` passed, 4 of them new. Regression TODO-009 and TODO-010: PASS.

## Handoff

Not applicable (PASS). No `failure_handoff` is set for TODO-020.

## Coverage

No coverage run was configured or requested in the `test` script. Coverage is recorded by behavior mapping: each TODO-020 unit requirement (1), (2) and (3) has a passing test, and the fail-without check proves the detail tests discriminate the contract. Numeric line coverage is not measured (80% guideline in `standards-frontend.md`).

## Edge Cases

- Null: `country: null` on the detail maps `countryCode` to `null` and `country` to `null` (test 1).
- Empty and missing: a detail without `tenant_category` is CONTRACT (existing test, passes both ways). A create body without `tenant_category_id` is CONTRACT (passes both ways).
- Boundary: `country` present maps `countryCode` from `country.code` (test 2).
- Invalid: the flat keys are absent from the detail fixture, and the detail parse still succeeds (test 1 guard).
- Failure: the reverted schema produces CONTRACT on the detail (fail-without check).

Edge cases not covered by a test (see OQ2): a detail that carries both the nested and the flat keys (flat keys should be ignored per TODO-020 Notes); a detail that carries only flat keys (no `tenant_category`), which should be CONTRACT; `country` with an empty `code` (schema `min(1)`); `country` present with `phone_code: null`.

## Mocking Strategy

MSW 2.x handlers (`src/test/handlers/tenants.ts`) mock the `GET /tenants/:id`, list and create endpoints through the shared `server` (`src/test/server`). `FIXTURE_TENANT_DETAIL` is the live nested-only body. Per-test `server.use` overrides supply the country-present and country-null variants. No real network. `console.error` is spied and suppressed, and the test asserts that the CONTRACT log names the endpoint and the missing key and not the body. Each test resets the access token and env stubs in `beforeEach` and `afterEach`. Tests are independent and deterministic.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Is `social_links` present in the live `GET /tenants/{id}` body? The detail schema requires it, and the fixture includes it. TODO-020 Notes say the implementer must confirm the top-level key set (names only) before Completed. | If absent live, the detail still fails CONTRACT after this fix. | Blocks the TODO Completed gate, not the unit gate. | developer_frontend | No | Open | If absent: amend TODO-020 to make it optional. No silent change. |
| OQ2 | Add unit tests for the edge cases listed under Edge Cases (both key sets, flat-only detail, empty `country.code`, `phone_code` null). | Current tests cover the contract's main path; these are negative and boundary checks. | Low. The contract is covered by tests (1) to (3). | unit_test_writer | No | Open | Documented default: not added in this run (file scope fixed by the implementer). Add in a follow-up if the owner asks. |
| OQ3 | `output/reports/qa-report-validate.md` does not record the `tenants.get` CONTRACT finding (TODO-020 Notes). | Traceability of the QA finding. | None on the unit gate. | qa | No | Open | QA owner to record. Not edited here. |
| OQ4 | Numeric coverage is not measured. | 80% guideline. | Low. | project_manager | No | Deferred | Behavior-mapped coverage documented above. |
