---
id: UNIT-TEST-REPORT-TODO-025
title: Unit Test Report — TODO-025 Guest-only public routes
owner: unit_test_writer
status: Approved
version: 1.0
last_updated: 2026-10-15 14:50
related_todo: TODO-025
execution_overall: PASS
source_requirements: [REQ-FE-056, REQ-FE-012]
related_artifacts: [TODO-025, ARCH-FE-001, ADR-004]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-025 Guest-only public routes
Owner: unit_test_writer
Status: Approved
Version: 1.0
Last Updated: 2026-10-15 14:50
Source Requirements: REQ-FE-056, REQ-FE-012
Related Artifacts:
- output/plans/master-todo.md (TODO-025)
- ARCH-FE-001 v1.0.12 (D6.1 route guard, D10 routes, REQ-FE-056)
- ADR-004

## At a Glance

- An authenticated user opening `/login` or `/forgot-password` is redirected (replace) to `/`. `/reset-password` is unchanged. `passwordChangeRequired` still goes to `/account/password`.
- Gate PASS: `npx tsc -b` exit 0, `npx eslint .` exit 0, `npx vitest run --passWithNoTests` exit 0. 78 files, 1066 of 1066 passed. The brief expected 1065. The one extra test is the router-level test added by this run (see Changes).
- Tests (a) to (d) of the TODO are present and assert behaviour. The router-level gap was closed with one test. No production code changed.
- Status is Approved (user approval 2026-10-15). No open questions.

## Purpose

Record scope, test cases, execution result, red evidence, edge cases and mocking for TODO-025, traced to REQ-FE-056 and ARCH-FE-001 v1.0.12.

## Scope

Production (final, not touched by this run): `src/app/guards/route-guard.tsx` (optional `guestOnly` flag on the `public` kind of `RouteAccess`, `HOME_PATH`, one branch in `resolveRouteAccess`) and `src/app/router.tsx` (`auth.login` and `auth.forgot-password` marked `guestOnly: true`; `auth.reset-password` unchanged).

Test files: `src/app/guards/route-guard.test.tsx` (describe "guest-only public routes", by the implementer) and `src/features/dashboard/root-route.test.tsx` (one test added by this run).

## Test Cases

| Req | Test (file) | Asserts |
|-----|-------------|---------|
| (a) | `resolveRouteAccess with status authenticated` (route-guard.test.tsx) | guest-only + authenticated -> `{ redirect, to: "/" }` |
| (a) | `... anonymous` | -> `{ render }` |
| (a) | `... passwordChangeRequired` | -> `{ redirect, to: "/account/password" }` (REQ-FE-012 kept) |
| (a) | `... unknown` | -> `{ booting }` |
| (a) | `... error` | -> `{ unavailable }` |
| (b) | `a public route that is not guest-only still renders for a session` | plain `public` + authenticated -> `{ render }` |
| (c) | `/login and /forgot-password are guest-only, /reset-password is not` | `routeAccessFor` returns `{ public, guestOnly: true }` for the first two and `{ public }` for `/reset-password` |
| (d) | `an authenticated session on a guest-only route redirects to / and hides the page` | `RouteGuard` calls `onRedirect("/")` once; the child page text is not in the DOM |
| router (added) | `sends a signed-in user at /login to / without rendering the login form (REQ-FE-056)` (root-route.test.tsx) | full `App` with authenticated mock at `/login`: pathname becomes `/`, the shell `#main` renders, no password input form is in the DOM |

Confirmed: the tests (a) to (d) assert outcomes (decision values, `onRedirect` calls, DOM presence), not implementation details.

Note on (d): the guard test uses a stub child, so it proves the page is hidden but not that the real login form is absent. The added router-level test covers that.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npx tsc -b`; `npx eslint .`; `npx vitest run --passWithNoTests` |
| Run at | 2026-10-15 14:50 |
| Total | 1066 |
| Passed | 1066 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Exit codes (captured without pipes): tsc 0, eslint 0, vitest 0. Files: 78 passed of 78.

## Execution Results

1066 tests passed.

Run note: one earlier full run (taken right after a temporary mutation was reverted) showed one failure in `src/features/dashboard/app-sidebar-badges.test.tsx` ("shows the contract totals beside the master-data items", text `12` not found). The file is unrelated to TODO-025. The next full run passed 1066 of 1066, and three isolated runs of that file passed. Treated as a timing flake under load; not part of the final result. See UT025-OQ1.

## Red Evidence

Reported by the implementer (3 tests failed before the change):

| Test | Message |
|------|---------|
| resolveRouteAccess, guest-only + authenticated | `expected { kind: 'render' } to deeply equal { kind: 'redirect', to: '/' }` |
| route table: `/login` and `/forgot-password` guest-only | `expected { kind: 'public' } to deeply equal { kind: 'public', guestOnly: true }` |
| RouteGuard hides the page | `expected true to be false` (page was rendered) |

Red proof for the router-level test added by this run: `guestOnly: true` was temporarily removed from `auth.login` in `router.tsx` (backup restored afterwards; `git diff` shows only the implementer's change). The new test then failed (1 failed, 5 passed in the file); with the file restored it passes.

## Changes Made By This Run

- `src/features/dashboard/root-route.test.tsx`: added one test (router-level, `/login` for an authenticated session). No other test or production file edited.
- No edits to `master-todo.md`, `progress-tracker.md`, `orchestration-state.md`, `ARCH-FE-001.md`, `output/docs/` or the provenance register.

## Coverage

Not measured with a coverage tool in this run. The new branch in `resolveRouteAccess` (guestOnly true with authenticated, guestOnly true with other statuses, guestOnly absent) is exercised by five table cases plus the non-guest-only case. The route table flags and the guard redirect path are exercised by (c), (d) and the router test.

## Edge Cases

- Each auth status on a guest-only route: authenticated, anonymous, passwordChangeRequired, unknown, error.
- Public route without the flag with a session: renders.
- Redirect fires once (`toHaveBeenCalledTimes(1)`), no loop.
- Unchanged: unknown paths and session routes (existing guard tests all pass).

## Mocking Strategy

- `route-guard.test.tsx`: `useAuth` mocked per test (`authValue`), `onRedirect` is `vi.fn()`, child is a stub paragraph.
- `root-route.test.tsx`: `useAuth` mocked via `vi.hoisted` state, real `App` and router, MSW `server`, `window.history.replaceState` to set the path. No real network.

## References

- output/plans/master-todo.md (TODO-025)
- ARCH-FE-001 v1.0.12
- ADR-004

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| UT025-OQ1 | Is `app-sidebar-badges.test.tsx` "shows the contract totals" flaky under full-suite load? | One transient failure seen once, not reproduced in 3 isolated runs and 1 full rerun | Possible intermittent CI red unrelated to TODO-025 | project_manager | No | Open | Documented default: not related to TODO-025; register as tech debt if it recurs |
