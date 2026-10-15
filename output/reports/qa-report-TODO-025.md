---
id: QA-REPORT-TODO-025
title: QA Report — TODO-025 Guest-only public routes
owner: qa
status: Approved
version: 1.0
last_updated: 2026-10-15 14:55
related_todo: TODO-025
source_requirements: [REQ-FE-056, REQ-FE-012]
related_artifacts: [TODO-025, ARCH-FE-001, ADR-004, code-review-report-TODO-025, unit-test-report-TODO-025]
blocking_open_questions: 0
---

Title: QA Report — TODO-025 Guest-only public routes
Owner: qa
Status: Approved
Version: 1.0
Last Updated: 2026-10-15 14:55
Source Requirements: REQ-FE-056, REQ-FE-012
Related Artifacts:
- output/plans/master-todo.md (TODO-025)
- output/architecture/ARCH-FE-001.md v1.0.12 (REQ-FE-056, D6.1, D10)
- output/reports/code-review-report-TODO-025.md (Approved: Yes, 0 Critical, 0 High, 1 Medium, 2 Low)
- output/reports/unit-test-report-TODO-025.md (PASS, 1066 of 1066)
- ADR-004

## At a Glance

- Recommendation: Go. No Critical, High or Medium defect found.
- Review risk M1 (logout detour through `/`) is NOT confirmed by a full-App probe. One Low item remains from review (L1, provenance register).
- Gate: `tsc -b` clean, `eslint .` clean, `vitest run` 78 files / 1066 tests pass (first run).

## Purpose

Verify TODO-025 against REQ-FE-056 and REQ-FE-012, and test the code review's M1 risk.

## Scope

Stack: frontend (`src/app/guards/route-guard.tsx`, `src/app/router.tsx`, their tests, `src/features/dashboard/root-route.test.tsx`). Standards: `standards-frontend.md`, `tech-stack-frontend.md`. Other modified files in the working tree belong to TODO-024 and are out of scope.

## References

ARCH-FE-001 v1.0.12, code review report TODO-025, unit test report TODO-025, `tech-stack-security.md` (frontend authorization is UX only, backend enforces).

## Scope Tested

Static verification by reading code and tests, a throwaway full-App probe, and the full gate.

| Requirement behavior | Evidence | Result |
|---|---|---|
| Authenticated on `/login` and `/forgot-password` redirects (replace) to `/` | `route-guard.tsx:96-99` returns `redirect` to `HOME_PATH` when `guestOnly === true && status === "authenticated"`. `router.tsx` sets `guestOnly: true` on both routes. Navigation is the router's replace redirect. Test: table case plus guard test (`onRedirect` once with `/`), and `root-route.test.tsx` renders the full App at `/login` and asserts path `/` and no password input. | Passed |
| `/reset-password` stays reachable when authenticated | Route access is still `{ kind: "public" }` (no flag); test asserts `routeAccessFor("/reset-password")` equals that and a non-guest-only public route renders for `authenticated`. | Passed |
| `passwordChangeRequired` still goes to `/account/password` | The REQ-FE-012 branch (`:91-93`) runs before the public branch, so it wins. Table test case covers it on a guest-only route. | Passed |
| `unknown`, `error`, `anonymous` unchanged | Early returns for `unknown` (booting) and `error` (unavailable) precede the new branch. `anonymous` falls to `render`. Table test covers all three. | Passed |
| Navigation unaffected | All nav items are `session` routes. The new field exists on the `public` kind only, so `navigation.ts` is untouched and the union stays compatible. `resolveRouteAccess` stays pure. | Passed |
| No redirect loop | `/` -> `/login` only for `anonymous`; `/login` -> `/` only for `authenticated`. The statuses are exclusive. Probe runs (below) ended on `/login` with no repeated hops. | Passed |

Edge and negative: unknown path with `access === null` still yields notFound (branch order unchanged). Integration and security: no API, contract or idempotency change; no secret, token or storage use added; backend remains the security boundary.

## M1 Probe (review finding, throwaway)

A temporary test `src/zz-probe-m1.test.tsx` mounted the real `AuthProvider` + `App` + `NavUser` with MSW (login, refresh, me, logout, dashboard handlers). It wrapped `history.replaceState` and `pushState` to log every navigation. The file was deleted after the runs; `git status` shows no new file under `src/`.

| Scenario | Navigation log after the trigger | History length | Final path | Login form |
|---|---|---|---|---|
| Logout click via `NavUser` (RTL `fireEvent`, act environment), starting at `/` authenticated | `["replace:/login"]` | 1 -> 1 | `/login` | Rendered (password input present) |
| Same, native `button.click()` with `IS_REACT_ACT_ENVIRONMENT=false` (real scheduling), 3 repeated runs | `["replace:/login"]` each run | 1 -> 1 | `/login` | Rendered |
| `endSession()` mid-session (the end the refresh 401 triggers) | `["replace:/login"]` | 1 -> 1 | `/login` | Rendered |

Result: the location never passed through `/` after the click. There was no `replace:/` hop in any run. The final path was `/login`, the form rendered, and history did not grow. **M1 is not confirmed.** Limits: the probe sees navigations through the History API. A purely transient render where the guard saw `/login` with a stale `authenticated` status would show as a `replace:/` call (the guard redirect), and none occurred. jsdom is not a real browser, so a rare timing difference in a real browser cannot be fully excluded, but the end state is correct either way and the review confirmed no loop. The `endSession` run was driven by calling `endSession()` directly, not by a real 401 on refresh; both reach the same provider handler. The pending-notice value after `endSession` printed empty in the probe because the login page consumed it on mount (page rendered), which is consistent with the review's reading (the notice is cleared only by the login page).

## Gate

| Command | Result |
|---|---|
| `npx tsc -b` | No output (pass) |
| `npx eslint .` | No output (pass) |
| `npx vitest run --passWithNoTests` | 78 files passed, 1066 tests passed (first run). `app-sidebar-badges` did not fail; no rerun needed. |

## Test Results

Passed: 6 of 6 behaviors in scope; gate 1066 of 1066 tests; probe 2 scenarios (3 extra repeats).

Failed: None.

Blocked: None.

## Defects

### Critical

None.

### High

None.

### Medium

None. (Review M1 not confirmed, see above.)

### Low

L1. `output/plans/file-provenance-register.md` has no TODO-025 trace on `FP-036` (`route-guard.tsx`) and `FP-039` (`router.tsx`), nor on the touched test files. Owner: project-manager. Carried over from review L1. Not a behavior defect, but the register must be updated before the checkpoint is signed off.

L2. Optional: no behavior-level test renders `/reset-password` under `authenticated`; only the route flag is asserted. Behavior follows from the unchanged public branch. Not blocking.

## Risk Assessment

Low. The change is one optional flag and one branch in a pure function, covered by table tests and a full-App test. The only residual risk is a browser-only scheduling difference on logout; the probe shows no detour in jsdom and the end state is correct regardless. No security, contract or data impact.

## Release Recommendation

Go

No Critical or High defect is open. Condition for tidy sign-off: project-manager adds the TODO-025 trace rows (L1). This recommendation is QA's own assessment and is not the final release approval.

## Open Questions

None
