---
id: CODE-REVIEW-REPORT-TODO-025
title: Code Review Report — TODO-025 Guest-only public routes
owner: code_reviewer
status: Approved
version: 1.0
last_updated: 2026-10-15 15:30
related_todo: TODO-025
source_requirements: [REQ-FE-056, REQ-FE-012]
related_artifacts: [TODO-025, ARCH-FE-001, ADR-004, unit-test-report-TODO-025]
blocking_open_questions: 0
---

Title: Code Review Report — TODO-025 Guest-only public routes
Owner: code_reviewer
Status: Approved
Version: 1.0
Last Updated: 2026-10-15 15:30
Source Requirements: REQ-FE-056, REQ-FE-012
Related Artifacts:
- output/plans/master-todo.md (TODO-025)
- output/architecture/ARCH-FE-001.md v1.0.12 (REQ-FE-056, D6.1, D10)
- output/reports/unit-test-report-TODO-025.md (execution_overall: PASS, 1066 of 1066)
- ADR-004

## At a Glance

- The change is one optional flag and one branch. It matches REQ-FE-056 and D6.1. Approved: Yes.
- Findings: Critical 0, High 0, Medium 1, Low 2.
- Static review only. No code was run by the reviewer.

## Purpose

Review TODO-025 for correctness, simplicity, standards and loop safety.

## Scope

## Scope Reviewed

`src/app/guards/route-guard.tsx`, `src/app/router.tsx`, `src/app/guards/route-guard.test.tsx`, and the new test in `src/features/dashboard/root-route.test.tsx`. Read for impact only: `src/app/navigation.ts`, `src/features/auth/login-page.tsx`, `src/app/providers/auth-provider.tsx`, `src/features/auth/auth-notice.ts`, `src/components/nav-user.tsx`, `src/App.tsx`, `src/features/auth/change-password-page.tsx`. Other modified files in the working tree belong to TODO-024 and are out of scope.

## References

ARCH-FE-001 v1.0.12, TODO-025, unit test report TODO-025, `standards-frontend.md`, `tech-stack-frontend.md`.

## Findings

### Critical

None.

### High

None.

### Medium

M1. `src/components/nav-user.tsx:26-28` and `src/app/guards/route-guard.tsx:97` — possible one-frame detour on logout (unverified).
`handleLogout` runs `await logout()` and then `navigateTo(LOGIN_PATH, { replace: true })`. `logout` calls `setView(ANONYMOUS_VIEW)`, a default-priority update from outside an event handler. `navigateTo` fires a location change that `useSyncExternalStore` renders at sync priority. React may render that sync update before the pending auth update, so the guard would see `/login` with a stale `authenticated`. The guard would then redirect to `/`, and `App.tsx:39-41` (`signedOutAtRoot`) would send it back to `/login` once the status is `anonymous`. The end state is correct and there is no infinite loop (the second hop only fires with `anonymous`, the first only with `authenticated`). The cost is a replace-redirect chain and a possible flash of the dashboard. The notice is not lost: it is stored before the end, and only the login page clears it (`login-page.tsx:51-53`). This depends on React scheduling and I could not run it. Recommendation: add a test that logs out through `NavUser` in the full `App` and asserts the final path is `/login`, the login form renders, and the history length did not grow. If the chain shows up, the implementer can fix it in `nav-user.tsx` (for example, rely on the existing `anonymous` handling and drop the explicit navigate). Do not change the guard for this.

### Low

L1. `output/plans/file-provenance-register.md` — no `TODO-025` row. `FP-036` (`route-guard.tsx`) and `FP-039` (`router.tsx`) do not list TODO-025, and the test files are not amended. This is the project-manager's register. It must be updated before `/validate` per the gate check in `artifact-standards.md`. Not a code defect.

L2. `src/app/guards/route-guard.test.tsx` (new describe) — the table test checks the `passwordChangeRequired` case on a guest-only route, but no test covers a guest-only route under `authenticated` through `navigation.ts`. This is acceptable because nav items are all `session` routes (`navigation.ts:182` only maps `render`). Optional only. Also, the TODO and REQ-FE-056 name "`authenticated` on `/reset-password` renders", which is covered only by the `routeAccessFor` flag check, not a behavior test. The flag check plus the plain-public test imply it. Optional.

## Review Answers (requested focus)

1. Branch order (`route-guard.tsx:76-100`): `unknown` and `error` return first, so they never redirect. `passwordChangeRequired` is checked before the `access === null` and public branches, so REQ-FE-012 wins and `/login` goes to `/account/password`. The guest-only branch only fires on `status === "authenticated"`. `anonymous` renders. Correct. The function is still pure.
2. `/reset-password` stays `{ kind: "public" }` (`router.tsx`, unchanged), so an authenticated user still renders it. Reachable: yes.
3. Redirect loops: `/` -> `/login` happens only for `anonymous`; `/login` -> `/` only for `authenticated`. The two statuses are exclusive, so no cycle. Login success: `auth.login` sets the view, the guard replaces to `/` (or `/account/password`), then the page's `navigateTo` targets the same URL and returns early (`router.tsx:290`, same-href no-op). The login page never mounts under `authenticated` (the guard returns `null` for a redirect), so the notice is not consumed early. `endSession` sets the notice before the view goes `anonymous`. The only `authenticated`-at-`/login` window is M1 (logout), where the notice is kept.
4. Double history entry or flash on login: both calls use `replaceState`, and the second is a no-op when the first has landed. If the page's call lands first, the guard effect finds the route changed and its redirect is a same-href no-op. No extra entry. While the redirect is pending the guard renders `null`, so the form does not flash. For `passwordChangeRequired` both target `/account/password`, with the same result.
5. `navigation.ts` is unaffected: all nav items are `session` routes, and the new field is on `public` only. The `RouteAccess` union stays compatible.
6. Simplicity: one optional field, one `HOME_PATH` constant, one `if`. No new component. Matches the TODO text. Good.
7. Standards: named exports, explicit types, readonly fields, a why-comment in the doc block, tests are deterministic and assert outcomes. The existing `eslint-disable` comment is unchanged. The new `root-route.test.tsx` test asserts pathname, no password input and `#main` present, which proves the form is not shown.

## Recommendations

- Add the logout test from M1 (implementer or unit-test-writer).
- Project-manager adds the TODO-025 trace to FP-036, FP-039 and the two test files (L1).

## Approval Status

Approved:
Yes

No unresolved Critical or High finding. M1 is a verification gap, not a confirmed defect.

## Open Questions

None
