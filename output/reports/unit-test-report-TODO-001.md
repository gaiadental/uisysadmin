---
id: UNIT-TEST-REPORT-TODO-001
title: Unit Test Report — TODO-001
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-10 14:44
related_todo: TODO-001
execution_overall: PASS
source_requirements: [REQ-FE-049, REQ-FE-050, REQ-FE-051]
related_artifacts: [TODO-001, ADR-007, ADR-005, ADR-001, ADR-003, ARCH-FE-001, FP-001, FP-002]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-001 Dependency set and test script
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-10 14:44
Source Requirements: REQ-FE-049, REQ-FE-050, REQ-FE-051
Related Artifacts:
- output/plans/master-todo.md (TODO-001)
- output/decisions/ADR-007-runtime-dependency-set.md (v1.2)
- output/decisions/ADR-005-test-stack.md (v1.0)
- output/plans/file-provenance-register.md (FP-001, FP-002)

## At a Glance

- Overall PASS: `npm test` exits 0 and `npm ls` reports no missing or invalid peers. TODO-001 adds no runtime behavior, so 0 unit tests exist and 0 ran. The PASS is a configuration result, not behavioral evidence.
- Status: Pending Approval. Blocking open questions: 0. Non-blocking open items: 3 (Node version, 17 pre-existing lint errors, Vite config notice).
- `npm run lint` exits 1 with 17 errors, all in unchanged `src/` files. These are outside TODO-001 scope and were not fixed.

## Purpose

Record the Checkpoint C test run for TODO-001 (dependency set in `package.json`, `test` script) and the static gate checks listed in `master-todo.md` -> TODO-001 Notes and Gate for every TODO.

## Scope

In scope: TODO-001 File scope, `package.json` and `package-lock.json`.

Checks run: `npm test`, `npm ls`, `npm run lint`, a grep for removed package imports, and a `package.json` diff against HEAD for the TODO-001 package list.

Out of scope:
- `src/` (not changed; no tests written against it).
- REQ-FE-050 client tests for `src/lib/api/client.ts`. These are assigned to TODO-004 (`master-todo.md`, TODO-004 Gate). TODO-001 only installs the test packages those tests will use.
- `vitest.config.ts` (not present; TODO-004 creates it per `master-todo.md`).
- E2E and Playwright (ADR-005; TODO-018).

## References

- `output/plans/master-todo.md` -> TODO-001 (Description, Notes, File scope) and Gate for every TODO
- `output/decisions/ADR-005-test-stack.md` v1.0 (Vitest, React Testing Library 16.x, MSW 2.x; jsdom DOM environment amendment)
- ADR-007 v1.2 (dependency set and dev dependency amendments), as cited by TODO-001
- `.claude/rules/standards-frontend.md` -> Testing Standards
- `output/plans/implementation-plan.md` -> Risks PM-RK-01 (legacy files stop compiling; lint error list by path)

## Test Cases

No unit tests are in TODO-001 scope. TODO-001 changes dependency configuration only: it removes 7 packages, moves `shadcn` to devDependencies, adds the test packages, adds the `test` script, and regenerates `package-lock.json`. No source behavior changed, so there is no behavior to test. No test was written for dependency configuration.

Static gate checks (run 2026-10-10 14:44):

| ID | Check | Command | Result |
|----|-------|---------|--------|
| C1 | Test script | `npm test` (`vitest run --passWithNoTests`) | Exit 0. "No test files found, exiting with code 0". 0 test files, 0 tests. |
| C2 | Required peers | `npm ls --depth=0` | Exit 0. 0 missing, 0 invalid. |
| C3 | Full tree | `npm ls --all` | 0 `UNMET PEER DEPENDENCY`, 0 `invalid`, 0 `ERR!`. 110 `UNMET OPTIONAL DEPENDENCY` lines are optional peers that are not installed (for example platform bindings and optional prettier plugins). They are not required peers and are not a gate failure. |
| C4 | Lint | `npm run lint` (`eslint .`) | Exit 1. 17 errors, 0 warnings. No lint error is reported for `package.json` or `package-lock.json`. All 17 are in unchanged `src/` files (see Execution Results). |
| C5 | Removed packages | grep for `recharts`, `@dnd-kit/*`, `@tanstack/react-table`, `@fontsource-variable/geist` in source, config and HTML, excluding `node_modules`, `output/`, `.claude/`, `.cursor/` and the two package files | No matches. |
| C6 | Package set | `git diff HEAD -- package.json`, compared with TODO-001 | Removed: `recharts`, `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@tanstack/react-table`, `@fontsource-variable/geist`. `shadcn` moved to devDependencies. Added: `@tanstack/react-query` 5.104.1, `react-hook-form` 7.89.0, `@hookform/resolvers` 5.9.1, `vitest` 5.0.3, `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `@testing-library/jest-dom` 7.0.1, `jsdom` 30.1.2, `msw` 2.15.0. `test` script added. All added versions are exact pins. The `@hookform/resolvers` 5.9.1 peer range includes `zod` `^4.0.0`. No other dependency line changed in the diff. |

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npm test` (`vitest run --passWithNoTests`) |
| Run at | 2026-10-10 14:44 |
| Total | 0 |
| Passed | 0 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Notes on the run:
- Total 0 means no file matched `**/*.{test,spec}.?(c|m)[jt]s?(x)`.
- Vitest reported version 5.0.3.
- Vite printed a config notice, not an error: `__dirname` at `vite.config.ts:11:25` is not supported by the native config loader. `vite.config.ts` is not in TODO-001 scope and was not changed.
- `npm ls --depth=0` and the lint run are recorded in Test Cases (C2 to C4).

## Execution Results

0 tests passed. `npm test` exited 0 with no test files found (`--passWithNoTests`). This is a configuration check, not behavioral evidence.

Lint detail (pre-existing, not in TODO-001 scope; `npm run lint` exit 1, 17 errors, 0 warnings). Counts match the implementer's report (13 and 4). `git status` shows no change under `src/`, and `git diff HEAD -- src` is empty.

| File (unchanged `src/`) | react-refresh/only-export-components | react-hooks/set-state-in-effect |
|------|------|------|
| src/components/command-palette.tsx | 1 | 2 |
| src/components/dialogs/dialogs.tsx | 1 | 0 |
| src/components/tenant-bits.tsx | 2 | 0 |
| src/components/ui/badge.tsx | 1 | 0 |
| src/components/ui/button.tsx | 1 | 0 |
| src/components/ui/select.tsx | 1 | 0 |
| src/components/ui/sidebar.tsx | 1 | 0 |
| src/components/ui/tabs.tsx | 1 | 0 |
| src/components/ui/toggle.tsx | 1 | 0 |
| src/hooks/use-mobile.ts | 0 | 1 |
| src/hooks/use-pagination.ts | 0 | 1 |
| src/router/index.tsx | 3 | 0 |
| **Total** | **13** | **4** |

`src/router/index.tsx` is the legacy hash router, which `master-todo.md` (PM-RK-01 note) says is removed in TODO-017.

## Handoff

Not applicable. Overall PASS, so there is no failure class and no routing hint. The orchestrator clears any `failure_handoff` that is set for TODO-001. Per `agent-orchestration.md` (Checkpoint C gate), TODO-001 may be marked Completed when `execution_overall` is PASS and the file-provenance register is current. FP-001 and FP-002 are present. This report does not change TODO-001 status.

## Coverage

Not applicable. There is no source under test in TODO-001 scope. No coverage provider is configured: `package.json` has no coverage script and no coverage package, and `vitest.config.ts` does not exist. The 80% guideline (`standards-frontend.md` -> Testing Standards) is not measured for this TODO.

## Edge Cases

Not applicable. TODO-001 has no functions, components or inputs. The failure checks that apply to dependency configuration are C2 (missing or invalid peers), C3 (full tree) and C5 (removed package imports). Null, empty, boundary and invalid-input cases start with TODO-004.

## Mocking Strategy

None. No test doubles were written. The installed test packages (`msw` 2.15.0, `@testing-library/react` 16.3.3, `@testing-library/dom` 10.4.2, `jsdom` 30.1.2) are unused in TODO-001. Per `master-todo.md` TODO-004 Notes, the client pipeline tests run in the Vitest `node` environment with a stubbed `fetch` and a stubbed `navigator.locks`. ADR-005 uses MSW for API integration tests. Those strategies belong to the reports for TODO-004 and later.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| TDR-001-OQ1 | Which Node.js version does the team run, and what is the minimum? | Installed packages declare engine ranges. jsdom 30.1.2 needs ^22.22.2, ^24.15.0 or >=26.0.0. vitest 5.0.3 needs ^22.12.0, ^24.0.0 or >=26.0.0. @testing-library/jest-dom 7.0.1 needs >=22. vite 8.2.2 needs ^20.19.0 or >=22.12.0. eslint 10.9.1 needs ^20.19.0, ^22.13.0 or >=24. | A machine or CI outside these ranges can fail the test run or the jsdom load from TODO-004 on. The repo has no `engines` field and no `.nvmrc`. The local Node is v26.4.0, which satisfies all ranges. | user (decision); project_manager (record) | No | Open | Not decided. No default set in this report. Correction to the implementer's summary: jsdom 30 needs ^22.22.2 on the 22 line, not 22.12. |
| TDR-001-OQ2 | Who fixes the 17 pre-existing lint errors in 12 unchanged `src/` files, and in which TODO? | `npm run lint` exits 1 on the current tree. The gate for every TODO requires lint to run and no new errors in TODO files. These errors are not in TODO-001 files and were not fixed. PM-RK-01 lists legacy files by path. | A project-wide lint gate cannot pass until these are fixed. TODO-001 PASS is not changed by lint. | project_manager | No | Open | Listed by path in Execution Results. Not fixed in TODO-001 (`src/` out of scope). `src/router/index.tsx` is removed in TODO-017 per PM-RK-01. The owner and TODO for the other files are not identified in this report. |
| TDR-001-OQ3 | Should `__dirname` in `vite.config.ts` line 11 move to `import.meta.dirname`? | Vite 8 prints a notice on every run that the native config loader does not support `__dirname`. | Noise in every test and build run. A future Vite major may change the default loader. | project_manager (route to developer_frontend) | No | Open | No change made. The notice is recorded only, because `vite.config.ts` is not in TODO-001 scope. |

Blocking open questions: 0.
