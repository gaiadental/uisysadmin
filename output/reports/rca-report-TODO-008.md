---
id: RCA-TODO-008
title: Root Cause Analysis — TODO-008 change-password D4.4 intermittent timeout
owner: debugger
status: Pending Approval
version: 1.0
last_updated: 2026-10-11 23:14
related_todo: TODO-008
related_unit_test_report: output/reports/unit-test-report-TODO-008.md
source_requirements: [REQ-FE-008, REQ-FE-009, REQ-FE-012, REQ-FE-013, REQ-FE-014, REQ-FE-015, REQ-FE-017, REQ-FE-036, REQ-FE-045, REQ-FE-049]
related_artifacts: [TODO-008, UNIT-TEST-REPORT-TODO-008, ARCH-FE-001, ADR-001, ADR-004, ADR-005]
blocking_open_questions: 0
---

Title: Root Cause Analysis — TODO-008 change-password D4.4 intermittent timeout
Owner: debugger
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-11 23:14
Source Requirements: REQ-FE-008, REQ-FE-009, REQ-FE-012, REQ-FE-013, REQ-FE-014, REQ-FE-015, REQ-FE-017, REQ-FE-036, REQ-FE-045, REQ-FE-049
Related Artifacts:
- output/plans/master-todo.md (TODO-008, Gate item G-6)
- output/reports/unit-test-report-TODO-008.md (FAIL report, Handoff, TDR-008-OQ9)
- ARCH-FE-001 v1.0 (D4.4, D4.6, D10, D19)
- ADR-001, ADR-004, ADR-005 (as cited in the source comments of the router, the refresh module and the MSW handlers)

## At a Glance

- The failing wait is the first render of a lazy route in `change-password-page.test.tsx`. That first test is the only one in the file that pays a cold boot and React's Suspense reveal throttle (300 ms) inside the default 1000 ms `findByRole` budget. Under parallel CPU load that path runs past 1000 ms.
- Not a product defect. No assertion mismatched in any run. The heading arrives in every run once the wait is allowed to finish (slowest observed 1963 ms under load).
- Proposed fix (test file only, TODO-008 File scope): pass `{ timeout: 5000 }` to the first `findByRole` in `openChangePage` (line 58). Validated on scratchpad copies of the test; the repo was not changed.
- Status: Pending Approval. After approval, `developer-frontend` applies the change on the next `/build`, then `unit-test-writer` re-runs the tests.

## Purpose

Explain the intermittent failure of "ChangePasswordPage errors (D4.6) > shows a wrong current password under its field and never refreshes (D4.4)" and propose a fix inside TODO-008 scope. This report changes no code, test, configuration or artifact other than itself.

## Scope

In scope: the failing test and its helper `openChangePage`; the boot and route path the test waits on (`router.tsx`, `route-guard.tsx`, `auth-provider.tsx`, `refresh.ts`); the MSW test setup; the React and react-dom version in use.

Out of scope: product changes (none are needed for this defect); the other failing-looking results (only the knock-on in the second test); a suite-wide timeout in `src/test/setup.ts` (outside TODO-008 file scope); coverage.

## References

- `output/reports/unit-test-report-TODO-008.md` (Handoff; TDR-008-OQ9)
- `src/features/auth/change-password-page.test.tsx:58` (`openChangePage`, the default-budget wait); `:80-96` (the failing test)
- `src/app/router.tsx:80-84` (lazy page); `:176-182` (route guard, Suspense boundary, fallback `RouteLoadingScreen`)
- `src/app/guards/route-guard.tsx:81` (status `unknown` renders the booting screen); `:132-133`
- `src/app/providers/auth-provider.tsx:117-135` (boot: refresh, then `/auth/me`)
- `src/lib/api/refresh.ts:29-31` (module-level token and in-flight promise); `:75-79` (single-flight)
- `src/test/setup.ts` (`server.listen({ onUnhandledRequest: "error" })`; `resetHandlers` after each test)
- `vitest.config.ts` (two projects; no `pool`, `isolate` or `asyncUtilTimeout` override; grep found none)
- `node_modules/react-dom/cjs/react-dom-client.development.js` (react-dom 19.2.8): `:14937` (`globalMostRecentFallbackTime` is set when a Suspense boundary's fallback state changes at commit); `:16683-16700` (a retry commit within `FALLBACK_THROTTLE_MS` of that time is delayed); `:27346` (`FALLBACK_THROTTLE_MS = 300`)
- Scratchpad (outside the repo): `/private/tmp/claude-501/-Users-irfanwahendra-Document-GAIA-IT-dashboard-sysadmin/28151330-396e-47b0-b339-05167061fee5/scratchpad` (probe setup, probe and variant configs, test-file copies, run scripts, logs)

## Problem Description

`npx vitest run` intermittently fails the test "shows a wrong current password under its field and never refreshes (D4.4)" in `src/features/auth/change-password-page.test.tsx`. The failing step is `openChangePage()` at line 58, `await screen.findByRole("heading", { name: "Ubah password" })`, which uses the default 1000 ms budget. The failure is a wait timeout. No assertion failed. Gate G-6 of TODO-008 depends on this test, so `execution_overall` stays FAIL and TODO-008 cannot be Completed.

## Symptoms

- Error text: `TestingLibraryElementError: Unable to find role="heading" and name "Ubah password"`, raised at `change-password-page.test.tsx:58`.
- DOM at the time of failure: one `div role="status"` containing "Memuat halaman..." and no heading. That node is `RouteLoadingScreen`.
- Duration of the failing test: 1336 ms in a failing full-suite run in this session; 1112–1163 ms in the earlier failing runs.
- Frequency: 3 failures in 23 sequential full-suite runs (counting the FAIL report's runs, this session's full runs and the probe runs). 13 failures in 15 runs under three-way parallel full-suite load. 0 failures in 13 single-file runs (10 in this session, 3 in the FAIL report).
- No other file failed in any run that showed this failure. In the 3 runs of round 5 of the parallel-load batch, the second test of the same file ("a 401 with another code still never refreshes") also failed.

## Investigation

### 1. What the test waits for

Every wait in the test file uses the default `findBy` or `waitFor` budget of 1000 ms, and none sets an explicit timeout. The file has no fake timers, and the MSW handlers have no `delay()`. The waits are: `openChangePage` line 58 (heading); `findByText` at lines 91, 127, 146, 165 and 186; `findByRole("alert")` at line 109; and `waitFor` pathname at lines 162 and 194.

The page itself has no timers and no waits. It renders through the route guard. The path from `renderRouterAt` to the heading is:

1. Auth status is `unknown`, so `RouteGuard` renders `RouteLoadingScreen` (`route-guard.tsx:81`, `:132-133`).
2. Boot runs: `POST /auth/refresh`, then `GET /auth/me` through MSW (`auth-provider.tsx:117-135`).
3. Status becomes `authenticated`. The router renders the lazy page inside a Suspense boundary whose fallback is also `RouteLoadingScreen` (`router.tsx:80-84`, `:176-182`).

Because boot and the lazy render both show the same "Memuat halaman..." node, the DOM at timeout cannot say which step was still pending. That is why the timings below came from a probe.

### 2. Reproduction (commands and counts)

| Run | Command (run from the repo root) | Runs | Result |
|-----|----------------------------------|------|--------|
| R1 | `npx vitest run src/features/auth/change-password-page.test.tsx` in a loop of 10 (the brief's command) | 10 | 10 exit 0; each shows "6 passed" |
| R2 | `npx vitest run` three times | 3 | Exit 0, 1, 0. Run 2 shows the same error at line 58 |
| R3 | Probe config, `npx vitest run`, sequential | 15 | 14 exit 0; run 5 exit 1 with the same error |
| R4 | Probe config, three full suites in parallel, five rounds | 15 | 13 exit 1 with the D4.4 failure; the 401 test also failed in round 5 |
| R5 | In-file variants of the test (scratchpad copies; repo untouched), three runs in parallel, five rounds plus eight rounds | 15 + 24 | Unchanged copy: 5 of 39 first tests failed. Page module preloaded in `beforeAll`: 0 of 39. Full warm render in `beforeAll`: 0 of 39. Timeout 5000 ms on the first wait: 0 of 24 |
| R6 | Full suite, three in parallel, five rounds, with the unchanged file excluded and the 5000 ms variant included | 15 | 0 failures; 248 of 248 pass in every run |
| R7 | 5000 ms variant, single-file loop of 10 | 10 | 10 exit 0 |
| R8 | Full suite, quiet, with the 5000 ms variant swapped in | 3 | Exit 0 each; 248 of 248 pass |

Environment: Node v26.4.0, vitest 5.0.3, React and react-dom 19.2.8, 8 cores. Load average was 12 before the first run and 36–153 during the parallel batches (other processes were also running on the machine).

Probe method: a scratchpad config (not in the repo) reuses the repo's projects, setup file and `@` alias. It omits only the Tailwind plugin and the build-only API URL guard, which these tests do not use. The probe attaches to MSW server events and a MutationObserver on `document.body`, and logs wall-clock milliseconds for each test. It does not change any assertion or budget. The probed sequential runs (R3, 1 failure in 15) fall within the failure rate of the unprobed sequential runs (1 in 5 in the FAIL report, 1 in 3 in R2), so the probe does not appear to change the behavior, although 15 runs do not establish that precisely.

Variant method: the scratchpad copies differ from the repo test only in three places: the relative imports are rewritten to `@/` aliases; the `beforeAll` block shown in the table is added or not; and the 5000 ms variant adds `{ timeout: 5000 }` on line 58. One scratchpad attempt preloaded the page from the setup file instead of the test file. That broke other test files with "useAuth must be used inside AuthProvider" (a module instance split caused by the probe). It was discarded and is not used as evidence.

### 3. Timing evidence

First test in the file vs. later tests (ms from the start of each test):

| Condition | First test: boot done | First test: heading | First test: gap, boot to heading | Second test: gap |
|-----------|----------------------|---------------------|----------------------------------|------------------|
| Quiet sequential full suite, 14 passing runs (R3) | 49–303 | 376–665 | 319–605 | 3–29 |
| Quiet sequential, failing run 5 (R3) | 204 | none before the test ended at 1112 | none | 329 (heading at 409) |
| Parallel load, passing runs (R4) | 127–137 | 828–840 | 701–703 | n/a |
| Parallel load, failing runs (R4) | 113–1193 | no heading within the 1000 ms window | n/a | n/a |

Variant results under the parallel load of R5 (first test):

| Variant | Failures | Boot done, median (range) | Heading, median (max) | Gap after boot, median (range) |
|---------|----------|---------------------------|-----------------------|--------------------------------|
| Unchanged copy | 5 of 39 | 109 (40–421) | 635 (1011) | 541 (337–938) |
| Page module preloaded in `beforeAll` | 0 of 39 | 87 (37–628) | 430 (1231) | 324 (309–603) |
| Full warm render in `beforeAll` | 0 of 39 | 10 (6–66) | 23 (100) | 6 (4–92) |
| Timeout 5000 ms on the first wait | 0 of 24 | 86 (41–764) | 694 (1963) | 602 (435–1918) |

Notes on the table: the boot-done and heading columns are wall-clock observations taken from DOM and MSW events. Under heavy load the event loop is delayed, and the test's own 1000 ms timer is delayed with it, so a reading above 1000 ms can still pass. The "Heading" column excludes runs where no heading was seen within the window.

The 5000 ms variant has the same cold path as the unchanged copy. Its heading arrived after 1 s in 3 of 24 runs (max 1963 ms) and the test still passed. The path is slow, not stuck.

The full-suite check R6 with the 5000 ms variant swapped in gave, for the first test: boot median 119 ms (max 302), heading median 613 ms (max 988), gap median 494 ms (max 733), over 15 runs.

### 4. Hypotheses

**(a) The lazy page is still loading when the default 1000 ms budget ends (under load).** Partly supported, but the module import is not the main cost.

- For: the failure happens only in the first test of the file, which is the first render of the lazy route. In quiet runs the first heading arrives 376–665 ms after the test starts, which leaves margin under 1000 ms; under load that margin is lost.
- Against the module-import explanation: preloading the page module in `beforeAll` leaves a floor of about 310 ms (309–603 ms) before the heading. A warm render of the whole route removes that floor (4–92 ms). Module evaluation is therefore not the cost that matters.
- Explanation that fits all of the above: react-dom 19.2.8 holds a retry of a Suspense boundary for `FALLBACK_THROTTLE_MS = 300` after a fallback has been committed (`react-dom-client.development.js:27346`, `:16683-16700`, `:14937`). The route's first render shows `RouteLoadingScreen` as the fallback, so the reveal of the page is held for about 300 ms. Boot, the throttle and the first render together fit within 1000 ms when the machine is quiet and can exceed it under contention. Later tests see a resolved lazy component, show no fallback, and skip the throttle (gap 3–29 ms).
- Caveat: this is inferred from the source and the 300 ms floor. The probe measures DOM and MSW events, not React's commit. The split between the throttle and the render under load was not measured directly.

**(b) The auth boot is still `unknown` when the test starts, and the page waits for it.** Supported as a contributor; the wait is by design.

- The guard shows the loading screen while status is `unknown` (`route-guard.tsx:81`). Boot is cold in the first test: median 109 ms, against 10 ms with a warm render. Under load, boot took up to 1193 ms in one failing run (R4, round 5, run 3), which on its own exceeded the budget.
- In quiet runs boot is a minor part (49–303 ms, and 204 ms in the failing quiet run). Hypothesis (b) therefore adds to (a) under load but is not the main cause on its own.

**(c) A shared MSW handler or timer leaks between tests in the same worker.** Not supported.

- The failing test is the first test of its file. Vitest runs each file in its own module graph (no `pool` or `isolate` override in `vitest.config.ts`).
- The MSW server is reset after each test (`src/test/setup.ts`). In the failing run the requests were answered at once: refresh in 61 ms, `/auth/me` in 1 ms.
- No "unhandled request" or MSW warning appears in any output (0 matches across the failing outputs).
- `navigator.locks` is `undefined` in the jsdom environment, so the Web Locks path in `refresh.ts` is not used. The module-level `inflight` promise is `null` at the start of a file's first test.
- The second-test failure in round 5 of R4 fits the same mechanism rather than a leak: the first test ended before the lazy render, so the second test paid the reveal again (gap 329 ms in the R3 failing run).

### 5. Root Cause

The test helper `openChangePage` waits with the default 1000 ms `findByRole` budget for the first render of a lazy route in the file. Only the first test of the file pays the cold path. That path has three parts: a cold boot through MSW (median about 110 ms), React 19.2.8's 300 ms reveal throttle after the route's fallback is shown, and the first render. In quiet runs the first heading arrives 376–665 ms after the test starts. Under the CPU contention of the parallel batches (load average 36–153 on 8 cores) the same path exceeds 1000 ms, and the wait fails. The page itself is correct and completes; the defect is a fixed wait that is too short for a first-render path in the test.

Confidence: established for the failure mechanism. The too-short budget explains every failure, and a 5000 ms budget removed all failures in the loaded batches (0 of 24 variant runs, 0 of 15 full-suite runs) while the headings still arrived in 0.5–2 s. Partly established for the split between boot, the React throttle and the render under load. Settling that split would need a React commit trace (a temporary scratchpad hook that timestamps the fallback commit and the retry commit). The fix does not depend on that split.

### 6. Impact

- TODO-008: Gate G-6 is intermittently red. `execution_overall` is FAIL. TODO-008 cannot be Completed until the fix is applied and re-verified. TDR-008-OQ9 (Blocking) can be closed once the validation below passes.
- Product: no defect observed. The heading rendered in every run that was allowed to finish, no assertion mismatched, and the route behavior under test is unchanged.
- Scope: only the first test of `change-password-page.test.tsx` is exposed. The second test fails only as a knock-on when the first test ends before the lazy render. `login-page.test.tsx` also renders through the router and did not fail in any run.
- Severity: Medium. It blocks a Gate item and makes CI intermittent under load. It is test-only.

### 7. Proposed Fix

Scope: TODO-008 File scope (test file). No product change. Owner of the change: `developer-frontend` (routed by TODO-008 Owner `developer_frontend`).

Change in `src/features/auth/change-password-page.test.tsx`, function `openChangePage`, line 58 (only this call):

```ts
// The first render of the lazy route in this file includes a cold boot and React's
// 300 ms Suspense reveal throttle, which can pass the default 1000 ms under load.
await screen.findByRole("heading", { name: "Ubah password" }, { timeout: 5000 })
```

Keep every assertion, every other wait and every other test unchanged.

Why 5000 ms: the slowest first-test heading observed under load was 1963 ms, which leaves about 2.5 times the observed maximum. A genuinely stuck render would still fail within 5 seconds.

Alternative, not recommended as the first choice: a `beforeAll` that renders the route once, awaits the heading and cleans up. Its evidence is good (0 of 39 failures, gap 4–92 ms), but it adds a hidden dependency on test order and a render in setup, so the explicit budget is the smaller and clearer change.

Not proposed: a suite-wide `configure({ asyncUtilTimeout })` in `src/test/setup.ts`. That file is outside TODO-008 file scope. The architect or project manager can decide on it (RCA-008-OQ4).

### 8. Validation Plan

1. `npx vitest run src/features/auth/change-password-page.test.tsx`, looped 10 times. Expect 10 exit 0, each with "6 passed". (The 5000 ms variant passed 10 of 10 in R7.)
2. `npx vitest run`, three times. Expect exit 0 each and "248 passed". (The variant passed 3 of 3 in R8.)
3. Stress check before Completed: three full suites in parallel, five rounds (15 runs). Expect no D4.4 or 401 failure. The unchanged file failed in 13 of 15 under the same load (R4); the 5000 ms variant passed 15 of 15 (R6).
4. Static: `npx eslint src/features/auth/change-password-page.test.tsx` exit 0; `npx tsc -p tsconfig.app.json --noEmit` shows no error in that file.
5. Gate G-6: the same two tests still cover it. `unit-test-writer` repeats the determinism check (two runs with identical outcomes) and closes TDR-008-OQ9 with a reference to this report.

Pass: all five checks. Any failure in check 3 reopens this RCA.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| RCA-008-OQ1 | Is 5000 ms the right budget for this one wait? | Sets the margin against load. | Test duration only. | developer_frontend | No | Deferred | Documented default: 5000 ms. The slowest observed first-test heading was 1963 ms under load. |
| RCA-008-OQ2 | The split of the cold cost between boot, the React throttle and the first render comes from wall-clock probes, not a React commit trace. | Only needed if the team wants the exact split. | None for the fix. | debugger | No | Deferred | Documented default: accept the mechanism as stated in section 5. A commit trace in a scratchpad variant would settle it. |
| RCA-008-OQ3 | Could other first tests that render a lazy route with the default budget be exposed under heavier load? `login-page.test.tsx` also renders through the router. | Other Gate items could flake under load. | Outside TODO-008 scope. | project_manager; developer_frontend | No | Deferred | Documented default: not assessed here. No change made. |
| RCA-008-OQ4 | Should a suite-wide `asyncUtilTimeout` be set in `src/test/setup.ts`? | A global budget would also change every other test's wait. | Outside TODO-008 file scope. | architect_frontend; project_manager | No | Open | Not decided. Not proposed in this RCA. |
| RCA-008-OQ5 | `src/components/ui/sonner.tsx` has a newer modification time (about 23:00) than this run started. This RCA did not write to it. | Traceability of the working tree during this run. | None for this defect. | user | No | Open | Not investigated. Noted only. |

Blocking open questions: 0.
