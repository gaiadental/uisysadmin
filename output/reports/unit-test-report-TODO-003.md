---
id: UNIT-TEST-REPORT-TODO-003
title: Unit Test Report — TODO-003
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-11 05:46
related_todo: TODO-003
execution_overall: PASS
source_requirements: [REQ-FE-001, REQ-FE-002, REQ-FE-003, REQ-FE-047]
related_artifacts: [TODO-003, ADR-006, ADR-001, ARCH-FE-001, FP-006, FP-007, FP-008, UNIT-TEST-REPORT-TODO-002]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-003 Dev server port, /api proxy, environment files and build guard
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-11 05:46
Source Requirements: REQ-FE-001, REQ-FE-002, REQ-FE-003, REQ-FE-047
Related Artifacts:
- output/plans/master-todo.md (TODO-003, Gate for every TODO)
- output/architecture/ARCH-FE-001.md v1.0 (D1.1, D1.2)
- output/decisions/ (ADR-006, ADR-001)
- output/plans/file-provenance-register.md (FP-006, FP-007, FP-008)
- output/reports/unit-test-report-TODO-002.md (format reference)

## At a Glance

- Overall PASS. `npm run dev` serves on port 3000 and releases it after stop. The build guard behaves as the gate requires: unset and https values exit 0, a non-https value exits 1 with the guard message and does not print the value. `tsc` for the Node config exits 0 and `npm test` exits 0.
- No unit tests are in scope (configuration only). 0 tests ran. Coverage is not applicable.
- Status: Pending Approval. Blocking open questions: 0. Non-blocking open items: 2.

## Purpose

Record the Checkpoint C run for TODO-003 (`vite.config.ts`, `.env.development`, `.env.production`). The TODO Gate requires the dev-server result and the build-guard result to be recorded in the Unit Test Report.

## Scope

In scope: the TODO-003 File scope, which is `vite.config.ts`, `.env.development` and `.env.production`.

Checks run: dev server port and release, build guard in three environment states, `tsc` for `tsconfig.node.json` (which includes `vite.config.ts`), `npm test`, the unit test count, and the provenance rows for the TODO paths.

Out of scope:
- `src/`, `index.html`, `package.json` and `package-lock.json`: other TODOs. Not changed and not checked here.
- The `/api` proxy to `http://127.0.0.1:8080` with Host `system.gaia.localhost`: not probed. It is not in the TODO-003 Gate (see TDR-003-OQ2).
- No code, configuration, env file, plan or ADR was changed by this run. The repository `dist/` was not written; build output went to the session scratchpad.

## References

- `output/plans/master-todo.md` -> TODO-003 (Description, Notes, File scope, Gate) and Gate for every TODO
- `output/architecture/ARCH-FE-001.md` v1.0 (D1.1, D1.2)
- `output/decisions/` (ADR-006, ADR-001)
- `output/plans/file-provenance-register.md` (FP-006, FP-007, FP-008)

## Test Cases

No unit tests are in TODO-003 scope. The TODO changes configuration only: dev server options, the `/api` proxy, the build guard and two env files. No runtime behavior was unit-tested, and no tests were invented. `vitest.config.ts` is not created (TODO-004). The checks below are gate checks run as commands.

| ID | Check | Command | Expected | Result |
|----|-------|---------|----------|--------|
| C1 | Dev server serves on port 3000 | `npm run dev` in the background, output to a scratchpad log | `Local:` line on port 3000; `GET /` and `GET /apiary` return 200 | PASS. `Local: http://localhost:3000/`. `GET /` 200. `GET /apiary` 200 with the SPA shell (`id="root"` present). Port 3000 was free before start. |
| C2 | Dev port is released after stop | `lsof` LISTEN check on 3000 after stopping the server | Port free; npm process exited | PASS. Port 3000 released; npm process exited. No other process was touched. |
| C3 | Build with `VITE_API_BASE_URL` unset | `env -u VITE_API_BASE_URL npx vite build --outDir <scratchpad>/dist-check-a --emptyOutDir` | Exit 0 (both env files set the value to empty) | PASS. Exit 0. Chunk-size warning only. |
| C4 | Build with non-https value | `VITE_API_BASE_URL=http://example.test npx vite build --outDir <scratchpad>/dist-check-b --emptyOutDir` | Non-zero exit; guard message; value not printed | PASS. Exit 1. Message: `VITE_API_BASE_URL must be empty or start with "https://". Set an https:// value or leave it empty, then run the build again.` The value `example.test` appears 0 times in the output. |
| C5 | Build with https value | `VITE_API_BASE_URL=https://example.test npx vite build --outDir <scratchpad>/dist-check-c --emptyOutDir` | Exit 0 | PASS. Exit 0. Value not printed. |
| C6 | Node config typecheck | `npx tsc -p tsconfig.node.json --noEmit` | Exit 0 | PASS. Exit 0. Covers `vite.config.ts`. |
| C7 | Unit test run | `npm test` (`vitest run --passWithNoTests`) | Exit 0 | PASS. Exit 0. "No test files found". |
| C8 | Unit tests executed | Read from C7 | 0 | 0 tests executed. |
| C9 | Provenance rows | grep of `output/plans/file-provenance-register.md` | Rows for the three TODO paths | PASS. FP-006 `vite.config.ts` (agent-modified), FP-007 `.env.development` and FP-008 `.env.production` (agent-created). All `enforcement: full`, trace TODO-003. |

Notes on the checks:
- C4: Vite prints a stack trace below the guard message. The trace names the config file path only, not the value.
- C3 and C5: Vite prints a chunk-size warning (chunks above 500 kB). It is a warning, the exit code is 0, and it is not part of the TODO-003 Gate.
- The empty value in `.env.production` is exercised by C3 (the variable is unset in the shell, so the env file value applies).

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npm test` (`vitest run --passWithNoTests`) |
| Run at | 2026-10-11 05:46 |
| Total | 0 |
| Passed | 0 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Notes on the run:
- Total 0 means no file matches `**/*.{test,spec}.?(c|m)[jt]s?(x)` in the project.
- Checks C1 to C6 are gate commands, not unit tests. Their results are in the Test Cases table.
- Environment for the run: Node v26.4.0, npm 11.17.0, Vite v8.2.2, Vitest v5.0.3. The Node version question stays open (TDR-003-OQ1).
- This report does not change TODO-003 status. The orchestrator records Completed.

## Execution Results

0 tests passed. `npm test` exited 0 with no test files found. Gate checks passed: dev server on port 3000 and released after stop; build guard (unset and https exit 0, non-https exits 1 without printing the value); `tsc` for the Node config exits 0.

## Handoff

Not applicable. `execution_overall: PASS`, so there is no failure class and no routing hint.

## Coverage

Not applicable. There is no runtime code under test in TODO-003 scope. No coverage provider is configured, and `vitest.config.ts` does not exist yet (TODO-004). The 80% guideline is not measured for this TODO.

## Edge Cases

Covered by the build guard checks:
- Variable unset (C3): passes.
- Empty value from the env file (C3): passes.
- Non-https value `http://example.test` (C4): rejected; the value is not printed.
- https value `https://example.test` (C5): accepted.

Not exercised:
- Port 3000 busy at start. The check was not run because port 3000 was free. With `strictPort: true`, Vite fails to start instead of moving to another port, by design.
- `/api/` proxy forwarding (see TDR-003-OQ2).

## Mocking Strategy

None. No test doubles were written. The dev server was probed with `curl` against the real local process. Build output was written to scratchpad directories, not to the repository `dist/`.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| TDR-003-OQ1 | Which Node.js version does the team run, and what is the minimum? (carried from TDR-002-OQ2) | Installed packages declare engine ranges. The repo has no `engines` field and no `.nvmrc`. This run used Node v26.4.0. | A machine or CI outside the ranges can fail `npm run dev`, the build or `npm test`. | user (decision); project_manager (record) | No | Open | Not decided. No default set in this report. |
| TDR-003-OQ2 | Should the `/api` proxy to `http://127.0.0.1:8080` with Host `system.gaia.localhost` be verified against a live gateway? | The proxy and the Host rewrite are in the TODO-003 File scope but not in its Gate. This run sent no `/api/` request. | A broken proxy would show only at integration time. | developer_frontend | No | Deferred | Documented default: not verified in TODO-003. The external host entry (ARCH-FE-001 D1.1) is verified before the TODO-017 smoke test, per master-todo. |

Blocking open questions: 0.
