---
id: UNIT-TEST-REPORT-TODO-009
title: Unit Test Report — TODO-009 Tenants API module and tenant list
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 06:36
related_todo: TODO-009
execution_overall: PASS
source_requirements: [REQ-FE-007, REQ-FE-019, REQ-FE-020, REQ-FE-036, REQ-FE-038, REQ-FE-040, REQ-FE-050]
related_artifacts: [TODO-009, UNIT-TEST-REPORT-TODO-008, ARCH-FE-001, ADR-002, ADR-003, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-009 Tenants API module and tenant list
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 06:36
Source Requirements: REQ-FE-007, REQ-FE-019, REQ-FE-020, REQ-FE-036, REQ-FE-038, REQ-FE-040, REQ-FE-050
Related Artifacts:
- output/plans/master-todo.md (TODO-009, File scope, Notes, Gate, amendment 2026-10-12)
- output/reports/unit-test-report-TODO-008.md (format reference)
- ARCH-FE-001 v1.0 (D5.2, D5.3, D5.4, D8.1, D11, D13)

## At a Glance

- Overall PASS. Two plain `npx vitest run` runs exited 0, each with 24 files and 318 tests passed; a third verbose run also exited 0 with no failed test.
- All Gate items and the 2026-10-12 amendment (VALIDATION_ERROR and VALIDATION_FAILED) have named, asserting tests.
- ESLint: exit 0 on the TODO-009 files. Vite build: exit 0. Typecheck: 21 errors, none in TODO-009 files (17 known legacy plus 4 new legacy errors in `src/pages/tenant-list.tsx` and `src/pages/tenant-detail.tsx`).
- Status Pending Approval. This run changed no code, TODO, tracker or ADR.

## Purpose

Record the Checkpoint C test run for TODO-009: run the suite, check Gate coverage and the static checks.

## Scope

In scope: the TODO-009 File scope. `src/lib/api/modules/{tenants,tenant-categories,countries}.ts` and their tests, `src/types/{tenant,tenant-category,country}.ts`, `src/features/tenants/list/`, `src/features/tenants/shared/`, `src/components/{table-card,table-pagination,tenant-bits}.tsx`, `src/app/router.tsx` (`/tenants`), `src/test/handlers/{tenants,index}.ts`.
New test files: `tenants.test.ts` (29), `reference.test.ts` (10), `tenant-list-page.test.tsx` (14), `list-filters.test.ts` (7), `failure.test.ts` (5) = 65 tests. The other 19 files (253 tests) are earlier TODOs, re-run only.
Out of scope: production and test code changes, end-to-end tests (QA), TODO status changes (orchestrator).

## References

- `output/plans/master-todo.md` -> TODO-009
- `.claude/rules/artifact-templates/artifact-templates-build.md` -> Unit Test Report
- Session scratchpad logs (not in the repo): `v1.txt`, `v2.txt`, `vv.txt`, `build.txt`, `tsc.txt`

## Test Cases

### Gate coverage

| # | Gate item | Covering tests (file > describe > test) | Result |
|---|-----------|------------------------------------------|--------|
| G-1 | Mapper: every D5.2 field | `tenants.test.ts` > "listTenants mapper (D5.2)" > "maps every field of the tenant object to camelCase and the pagination block"; `getTenant` > "maps the detail, with the joined category and country"; `createTenant` > "maps the admin account and does not map default_branch_types". `reference.test.ts` > "maps every field of a category to camelCase", "maps every field of a country to camelCase". | Covered |
| G-2 | Unknown keys ignored | `tenants.test.ts` > "listTenants mapper (D5.2)" > "ignores unknown keys". | Covered |
| G-3 | Missing required key gives CONTRACT | `tenants.test.ts` > "rejects a tenant with a missing required key as CONTRACT, and logs the key but not the body"; "rejects a list body without a pagination block as CONTRACT"; "rejects an unknown deployment type as CONTRACT"; `getTenant` > "reports a detail without its category as CONTRACT". `reference.test.ts` > "reports a category without is_active as CONTRACT". `tenant-list-page.test.tsx` > "shows a contract failure as a generic alert". | Covered |
| G-4 | Whitelist type tests (forbidden field does not compile) | `tenants.test.ts` > "patchTenant whitelist (D5.3, REQ-FE-040)" > "does not compile an immutable field in the patch type" (the file holds 6 `@ts-expect-error` directives; `tsc` reports no error in the file, so each directive suppresses a real error). Also "drops an immutable key that reaches the module through a loosely typed caller", "sends only the keys that were given, in snake_case", "has no delete function, because the contract answers 405", "does not send a key that is undefined". Create whitelist: "sends the whitelist keys in snake_case and omits empty optional fields". | Covered |
| G-5 | List state: loading | `tenant-list-page.test.tsx` > "TenantListPage states (D13)" > "shows a loading status first, then the rows". | Covered |
| G-6 | List state: empty | same describe > "shows an empty message when there are no tenants and no filter"; "shows a different empty message when a filter is set". | Covered |
| G-7 | List state: error | same describe > "shows an alert with the reference id and a retry button on an error, and no automatic retry"; "never shows the server text of a 500". Unit: `failure.test.ts` > "describeReadFailure (D13)" (5 tests). | Covered |
| G-8 | MSW integration: list | `tenants.test.ts` > "listTenants request (D5.4, D8.1)"; `tenant-list-page.test.tsx` > "shows the contract columns with the category and country joined from the reference lists". | Covered |
| G-9 | MSW integration: filters | `tenants.test.ts` > "sends page, limit and every documented filter in snake_case", "leaves an empty filter out of the query"; `tenant-list-page.test.tsx` > "sends the filters from the URL as API parameters", "applies the exact code on submit, writes it to the URL and returns to page 1", "resets every filter with one button"; `list-filters.test.ts` (7 tests). | Covered |
| G-10 | MSW integration: pagination | `tenant-list-page.test.tsx` > "pages on the server: next sends page 2 and the footer shows the range", "hides the pagination bar when there is one page". | Covered |
| G-11 | MSW integration: admin-account retry | `tenants.test.ts` > "retryAdminAccount" > "posts with no body and maps the result"; "is not retried automatically on a 503". | Covered |
| G-12 | Reference loaders fetch every page above 100 | `reference.test.ts` > "tenant categories (FE doc 6.1)" > "fetches every page when the total is above 100"; "loads the reference list with limit=100 in one request when the total is 100 or less"; "countries (FE doc 6.2)" > "fetches every page of the reference list when the total is above 100"; "does not retry a failed page automatically". | Covered |
| G-13 | Amendment 2026-10-12: both validation codes | `tenants.test.ts` > "validation error codes (amendment 2026-10-12)" > "treats a 400 VALIDATION_ERROR from master-data as a form validation error"; "treats a 400 VALIDATION_FAILED from auth-service as a form validation error"; "decides by status and code, never by the message text". | Covered |

No Gate item is missing.

### Test count by file (new in TODO-009)

| File | Expected | Run 1 | Run 2 |
|------|----------|-------|-------|
| `src/lib/api/modules/tenants.test.ts` | 29 | 29 | 29 |
| `src/lib/api/modules/reference.test.ts` | 10 | 10 | 10 |
| `src/features/tenants/list/tenant-list-page.test.tsx` | 14 | 14 | 14 |
| `src/features/tenants/list/list-filters.test.ts` | 7 | 7 | 7 |
| `src/features/tenants/shared/failure.test.ts` | 5 | 5 | 5 |
| TODO-009 subtotal | 65 | 65 | 65 |
| Re-run from earlier TODOs (19 files) | 253 | 253 | 253 |
| Total (24 files) | 318 | 318 | 318 |

(New-file counts are from the verbose listing of a third run, 29, 10, 14, 7 and 5 test lines; runs 1 and 2 show the same totals of 24 files and 318 tests.)

## Execution Summary

| Metric | Run 1 | Run 2 |
|--------|-------|-------|
| Command | `npx vitest run` | `npx vitest run` |
| Run at | 2026-10-12 06:3x | 2026-10-12 06:3x |
| Exit code | 0 | 0 |
| Test files | 24 / 24 passed | 24 / 24 passed |
| Total | 318 | 318 |
| Passed | 318 | 318 |
| Failed | 0 | 0 |
| Errors | 0 | 0 |
| Skipped | 0 | 0 |
| Overall | PASS | PASS |

Extra verbose run (`--reporter=verbose`): exit 0, zero failed marks. Counts are identical across the runs. Environment: Node v26.4.0, darwin.

## Checks

| ID | Check | Command | Result |
|----|-------|---------|--------|
| C1 | Vitest runs 1 and 2 | `npx vitest run` | PASS. Exit 0 and 0; 24 files; 318 tests; identical. |
| C2 | Gate coverage | Test names above | PASS. 13 of 13. MSW is used in `tenants.test.ts`, `reference.test.ts` and `tenant-list-page.test.tsx`. |
| C3 | ESLint, TODO-009 files | `npx eslint` on the File scope paths and `src/features/tenants/` | PASS. Exit 0, no output. |
| C4 | Production build | `npx vite build --outDir <scratchpad>/dist-todo009-report` | PASS. Exit 0, "built in 622ms". |
| C5 | Typecheck by path | `npx tsc -p tsconfig.app.json --noEmit --pretty false` | PASS by path. Exit 2, 21 errors, 0 in TODO-009 files. |

Typecheck by path (21 errors, all in `src/pages/`):

| Path | Count | Cause |
|------|-------|-------|
| `src/pages/katalog-kategori.tsx` | 2 | Removed `dialogs.open` (PM-RK-01) |
| `src/pages/katalog-negara.tsx` | 2 | Removed `dialogs.open` (PM-RK-01) |
| `src/pages/katalog-permission.tsx` | 1 | Removed `dialogs.open` (PM-RK-01) |
| `src/pages/sistem-sesi.tsx` | 1 | Removed `dialogs.open` (PM-RK-01) |
| `src/pages/tenant-create.tsx` | 3 | 1 removed `dialogs.open`; 2 TS2375 pre-existing (PM-RK-02) |
| `src/pages/tenant-detail.tsx` | 6 | 4 removed `dialogs.open` (lines 134, 149, 159, 370); NEW: 28 and 29, TS2305, `categoryLabel` and `countryName` no longer exported by `tenant-bits.tsx` |
| `src/pages/tenant-list.tsx` | 3 | 1 removed `dialogs.open` (line 194); NEW: 18 and 19, TS2305, same removed exports |
| `src/pages/tim-akun.tsx` | 1 | Removed `dialogs.open` (PM-RK-01) |
| `src/pages/tim-peran.tsx` | 2 | Removed `dialogs.open` (PM-RK-01) |

17 known legacy errors plus 4 new ones (tenant-list.tsx 18, 19; tenant-detail.tsx 28, 29). The legacy pages are removed in TODO-017.

## Execution Results

318 tests passed in each of two full runs (24 of 24 files). No failures.

## Handoff

Not applicable (PASS). The orchestrator may clear `failure_handoff` for TODO-009. This report does not set the TODO to `Completed`.

## Coverage

Not measured. No coverage provider is installed (carried from TDR-004-OQ4), so the 80% guideline is not evaluated.

## Edge Cases

- Null and absent: a null country is accepted; a missing required key, a list without a pagination block and a detail without a category give CONTRACT; null nationality and phone code accepted.
- Empty: no tenants with and without a filter (two different messages); an empty filter is left out of the query; no query string without params.
- Boundary: reference total of 100 or less loads in one request; above 100 fetches every page; pagination bar hidden for one page; bad page treated as page 1.
- Invalid: unknown deployment type is CONTRACT; hand-edited URL status or deployment type is ignored; an immutable key is dropped from the patch.
- Failure: 404, 409 RESOURCE_CONFLICT, 503 with server message, a 500 never shows server text; no automatic retry on 503 (retry and reference pages).
- Idempotency: no idempotency key is in the TODO-009 contract (SP-BG-11: retry and create are not idempotent). The tests assert no automatic retry; no duplicate-delivery test is claimed.

## Mocking Strategy

MSW server (`src/test/server.ts`) with handlers in `src/test/handlers/tenants.ts` (registered in `index.ts`); per-test overrides with `server.use`. No real network. Page tests render with the shared providers and a new `QueryClient` per test under jsdom (`|dom|`); mapper and module tests run under `node`. No fake timers.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| TDR-009-OQ1 | `isFormValidationError` lives in `src/features/tenants/shared/errors.ts`. Move it into `src/lib/api/errors.ts` in a follow-up? | It is an API-layer concern shared by features | Follow-up refactor | developer_frontend | No | Open | Follow-up; no change now |
| TDR-009-OQ2 | `routes-meta.ts` still lists `tenant.list` as a legacy key; worked around with `SpecKey` and one cast in `router.tsx` | Type safety of the route table | Fix in TODO-010 | developer_frontend | No | Open | Fix in TODO-010 |
| TDR-009-OQ3 | The list has no "Tambah tenant" button and the code is not a link until TODO-010 | Screen is not yet navigable to create or detail | None for this Gate | project_manager | No | Open | TODO-010 |
| TDR-009-OQ4 | Mutation invalidation is not wired | Lists do not refresh after a write | None until writes exist | developer_frontend | No | Open | TODO-010 |
| TDR-009-OQ5 | 4 new legacy tsc errors in `src/pages/tenant-list.tsx` (18, 19) and `src/pages/tenant-detail.tsx` (28, 29), from removed `categoryLabel` and `countryName` | Project typecheck gate | Removed with legacy pages in TODO-017 | project_manager | No | Open | Listed by path; not fixed here (PM-RK-01) |
| TDR-009-OQ6 | FE-OQ-31: E-01 and E-02 paths are unverified | Integration tests rely on documented paths | Mocks follow the documented contract | project_manager | No | Open | Verify before integration |
| TDR-009-OQ7 | SP-BG-02 and SP-BG-09 fallbacks applied: no branch, user or session columns; exact code only | Platform gaps | Screen shows contract columns only | project_manager | No | Open | Fallbacks stay until the gaps close |
| TDR-009-OQ8 | Node version is v26.4.0 | Environment record | None | orchestrator | No | Open | Recorded only |
| TDR-009-OQ9 | No coverage provider installed | 80% guideline not evaluated | Same as TDR-004-OQ4 | project_manager | No | Open | Carried |
