---
id: UNIT-TEST-REPORT-TODO-026
title: Unit Test Report — TODO-026 Sessions of another system account
owner: unit_test_writer
status: Approved
version: 1.0
last_updated: 2026-10-15 15:40
related_todo: TODO-026
execution_overall: PASS
source_requirements: [REQ-FE-032, REQ-FE-052, REQ-FE-053, REQ-FE-017]
related_artifacts: [TODO-026, ARCH-FE-001, ADR-003, ADR-005]
blocking_open_questions: 0
---

Title: Unit Test Report — TODO-026 Sessions of another system account
Owner: unit_test_writer
Status: Approved
Version: 1.0
Last Updated: 2026-10-15 15:40
Source Requirements: REQ-FE-032, REQ-FE-052, REQ-FE-053, REQ-FE-017
Related Artifacts:
- output/plans/master-todo.md (TODO-026)
- ARCH-FE-001 v1.0.13 (D4.10, D7, D8, D13.1, BG-13)
- ADR-003, ADR-005

## At a Glance

- The "Sesi aktif" tab and force logout are enabled for another system account (`/api/v1/system-users/{id}/sessions`, GET and DELETE). The own account has no tab and no force logout; it keeps the link to `/account/sessions`.
- Gate PASS: `npx tsc -b` exit 0, `npx eslint .` exit 0, `npx vitest run --passWithNoTests` exit 0. 79 files, 1077 of 1077 passed (matches the expected figure).
- Tests (a) to (g) of the TODO are present and assert behaviour. No gap found. No test file and no production code was changed by this run.
- Key references: ARCH-FE-001 v1.0.13, REQ-FE-032, REQ-FE-052, TODO-022 error copy.

## Purpose

Record the unit test evidence for TODO-026 and confirm tests (a) to (g) of the TODO verify behaviour.

## Scope

Frontend TODO (Owner `developer_frontend`). File scope tested:

- `src/lib/api/modules/sessions.ts`
- `src/features/team/users/access.ts`
- `src/features/team/users/user-detail-page.tsx` (and the existing `user-sessions-tab.tsx`, unchanged)
- Support files outside the TODO test list that changed only the path and a comment: `src/test/handlers/auth.ts` (two MSW handlers `admin/users/:userId/sessions` -> `system-users/:userId/sessions`) and `src/types/session.ts` (a doc comment path). Confirmed from `git diff`: no other change in either file.

Stack standards applied: `standards-frontend.md`, `tech-stack-frontend.md` (Vitest, React Testing Library, MSW 2.x).

## Test Cases

| TODO test | Result | Test file and test |
|-----------|--------|--------------------|
| (a) GET and DELETE use `/api/v1/system-users/{id}/sessions` | Covered | `sessions.test.ts`: list asserts the requested pathname; force logout asserts the DELETE method on the handler at the new path. `user-detail-page.test.tsx`: GET and DELETE pathname asserted through the page. |
| (b) flag true; `canViewUserSessions` and `canForceLogout` per account | Covered | `access.test.ts`: flag `true`; tab with `sessions:view` for another account, not without it, never for the own account (`isSelf = true`); force logout with `sessions:revoke` for another account only, false for `sessions:view` only and for the own account. |
| (c) other account: tab only with `sessions:view`; force logout only with `sessions:revoke` | Covered | `user-detail-page.test.tsx`: "is hidden without sessions:view" and "hides force logout without sessions:revoke"; tab and list tests run with the real flag (the module mock of `./access` was removed). |
| (d) own account: no tab; link to `/account/sessions` | Covered | `user-detail-page.test.tsx`: link test (no session request made), new test "shows no tab and no force logout for the own account even with every permission", new test "shows no link to /account/sessions for another account". `user-sessions-tab.test.tsx`: "own account has no tab". |
| (e) force logout success and errors | Covered | `user-sessions-tab.test.tsx`: success toast "Semua sesi akun diakhiri." and list refetch (`lists` = 2); `it.each` for 409 SELF_ACTION_NOT_ALLOWED, 403 PLATFORM_ROLE_PROTECTED (account copy), unrecognised 409, 503, 404 SYSTEM_USER_NOT_FOUND: each asserts the fixed copy, `Kode referensi: corr-xyz-1`, the server text absent, no success toast. Also `user-detail-page.gaps.test.tsx` (404, 409, 500 copy, no refetch, in-flight guard). |
| (f) button visible for a SYS_PRINCIPAL target | Covered | `user-sessions-tab.test.tsx`: target with `systemRoleKey: "SYS_PRINCIPAL"`, the "Paksa keluar" button is present and enabled. |
| (g) GET read error keeps the generic read message | Covered | `user-sessions-tab.test.tsx`: GET 500 shows `GENERIC_READ_MESSAGE`, server text absent, no principal handling. |

Checked specifically:

- The removed test "hides force logout for the own account even with sessions:revoke" is replaced. The own account now has two tests that are stricter: no "Sesi aktif" tab and no "Paksa keluar" button with every permission (`user-detail-page.test.tsx`), and no tab (`user-sessions-tab.test.tsx`). The `access.test.ts` unit also covers `canForceLogout(..., true) === false`.
- The old "Sesi aktif suspended" test (no tab, no button, zero session requests for another account) was removed because that behaviour is reversed by the amendment. The remaining own-account test keeps the zero-request assertion.
- The `./access` flag mock in `user-detail-page.test.tsx` and `user-detail-page.gaps.test.tsx` was removed, so the page tests now exercise the real flag and gates. `flagMock` setup lines were removed with it.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | `npx tsc -b`; `npx eslint .`; `npx vitest run --passWithNoTests` |
| Run at | 2026-10-15 15:33 |
| Total | 1077 (79 files) |
| Passed | 1077 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

Exit codes (no pipe hiding them): `tsc -b` 0, `eslint .` 0, `vitest run --passWithNoTests` 0. The only console noise is the Node `localStorage` ExperimentalWarning, which is unrelated to the change.

## Execution Results

1077 tests passed.

Red evidence (reported by the implementer, not re-run by this agent because production code is final): 32 tests failed before the implementation. The implementer did not supply a per-file breakdown, so none is invented here. The tests that exercise the change, by file, are `src/lib/api/modules/sessions.test.ts` (test a), `src/features/team/users/access.test.ts` (test b), `src/features/team/users/user-detail-page.test.tsx` and `user-detail-page.gaps.test.tsx` (tests c, d, e), and the new `src/features/team/users/user-sessions-tab.test.tsx` (tests d to g). The red state is plausible: the flag was `false`, the paths were `admin/users`, and `canViewUserSessions` took one argument.

## Handoff (FAIL only)

Not applicable. `execution_overall: PASS`.

## Coverage

No coverage run was requested for this gate. Every changed production branch is exercised by a behaviour test: the two path constants, the flag, `canViewUserSessions` (flag, permission, own-account), `canForceLogout`, `showSessions`, and the unconditional own-account link. Coverage percentage is not recorded (80% guideline; not measured in this run).

## Edge Cases

- Own account with every permission: no tab, no button.
- No `sessions:view` and no `sessions:revoke` for another account.
- Principal target: button visible, the server decides (403 shown with the account copy).
- Unrecognised 409 code and the 503 and 404 paths: fixed copy, reference id, no server text.
- GET failure: generic read message.
- Double-send guard while the DELETE is in flight (existing gaps test).
- Idempotency: not applicable (force logout is idempotent by stable resource ID, DELETE).

## Mocking Strategy

- MSW 2.x handlers per test for `/api/v1/system-users/:userId/sessions` (GET, DELETE) and `GET /system-users/:id`; default handlers in `src/test/handlers/auth.ts` updated to the new path.
- `sonner` toast and `useAuth` permissions mocked (`authMock.permissions`); `./access` is no longer mocked.
- Each test builds a fresh `QueryClient` and clears it in `afterEach`; no shared state, no timers.

## Open Questions

None
