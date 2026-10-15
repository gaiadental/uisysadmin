---
id: CODE-REVIEW-TODO-022
title: Code Review Report TODO-022
owner: code_reviewer
status: Approved
version: 1.1
last_updated: 2026-10-14 10:20
related_todo: TODO-022
source_requirements: [REQ-FE-052, REQ-FE-053, REQ-FE-032, REQ-FE-008, REQ-FE-018]
related_artifacts: [ARCH-FE-001 v1.0.5, ADR-002, ADR-003, ADR-005, unit-test-report-TODO-022]
blocking_open_questions: 0
---

Title: Code Review Report TODO-022
Owner: code_reviewer
Status: Approved
Version: 1.1
Last Updated: 2026-10-14 10:20
Source Requirements: REQ-FE-052, REQ-FE-053, REQ-FE-032, REQ-FE-008, REQ-FE-018
Related Artifacts: TODO-022, ARCH-FE-001 v1.0.5 (D4.10, D13.1), ADR-002, ADR-003, ADR-005, output/reports/unit-test-report-TODO-022.md

## At a Glance

- Sessions suspended for other accounts and fixed guard-failure copy on Tim IT pages: review of the working tree for FP-238 to FP-252.
- Approved: Yes (recommendation). 0 Critical, 0 High, 0 Medium open (M1 closed in v1.1), 5 Low (L2 closed in v1.1).
- v1.1 re-check of the rework only (M1, OQ1/L2): both closed, see Rework Re-check.
- Independent runs (whole working tree, includes TODO-023): tsc -b exit 0, eslint . clean, vitest 994 passed in 78 files.

## Purpose

Review TODO-022 against REQ-FE-052, REQ-FE-053, ARCH-FE-001 v1.0.5 (D4.10, D13.1, FE-OQ-39, FE-OQ-40), standards-frontend, tech-stack-frontend and tech-stack-security.

## Scope Reviewed

Greenfield, enforcement enforced. Files: `src/features/team/shared/guard-failure.ts` and `.test.ts`, `guard-failure-callers.test.ts`, `users/user-failure.ts`, `roles/role-failure.ts`, `users/access.ts` and `.test.ts`, `users/user-detail-page.tsx` and its two tests, role and list tests (FP-238 to FP-252), `tenants/create/tenant-create-page.test.tsx` (test only). Integration touchpoints: `describeWriteFailure` (`tenants/create/write-failure.ts`, verified unchanged: no diff), callers of the two Tim IT mappers, `user-sessions-tab.tsx` and `lib/api/modules/sessions.ts` (kept, unchanged). Out of scope: `src/components/ui/sidebar.tsx`, TODO-021 leftovers, TODO-023 changes (reviewed separately).

## References

TODO-022 (master-todo.md), ARCH-FE-001 v1.0.5, unit-test-report-TODO-022 v1.1, file-provenance-register FP-238 to FP-252.

## Findings

### Critical

None.

### High

None.

### Medium

- M1 `users/user-detail-page.tsx` `OwnSessionsLink`: REQ-FE-052 and D4.10 say the own account "shows a link to /account/sessions". The code renders a `Button` that calls `navigateTo(...)`. A button is not a link for assistive technology (role is "button", no href, no open-in-new-tab, no right-click copy). The codebase already has `AppLink` (`features/auth/components/app-link.tsx`, used in `roles/role-list-page.tsx` and tested with role "link"). Recommend rendering `AppLink to="/account/sessions"` (styled as the outline button if wanted) and updating the test to query role "link". Not blocking: keyboard operation works and the destination is correct.

### Low

- L1 `users/user-detail-page.tsx`: the card copy "Sesi aktif akun Anda ada di halaman sesi akun." and the label "Lihat sesi saya" are not in ARCH-FE-001 (FE-OQ-22 copy deck still open). Acceptable as a documented default; note only.
- L2 `roles/role-failure.ts`: `ROLE_GUARD_VIOLATION` with status 403 still shows the raw server `message` (and `describeRoleWriteFailure` for a 409 or 503 with this code now gets the fixed conflict or outage copy). This matches D13.1 ("any other status or code falls through"), but it differs from the sibling code `PLATFORM_ROLE_PROTECTED`, which is now fixed copy, and it keeps server text on a Tim IT page. No test covers `ROLE_GUARD_VIOLATION` with 409 or 503. Recommend the architect confirm whether this code should also get fixed copy; clarification, not decided here. `isRoleRefusal` still marks the role refused for any status (behavior unchanged, `refused-roles.ts` intact).
- L3 `shared/guard-failure.ts` `messageFor`: `SYSTEM_ROLE_IN_USE` returns the role copy for the `account` context as well (D13.1 lists it for role pages). Harmless and the account-page tests pin it; note only.
- L4 `users/user-sessions-tab.tsx` header comment still says the tab "is shown only with `sessions:view`" (now also needs the flag). File is "kept"; update the comment in a later touch.
- L5 `users/user-detail-page.test.tsx`: the flag is simulated by mocking `./access` with re-implemented `canViewUserSessions` and `canForceLogout`, so the "flag on" tests do not exercise the real gate functions (those are covered in `access.test.ts`). The "no sessions request" assertions run right after the page is ready; they would not catch a request fired later. Acceptable, strengthen when convenient.
- L6 `users/user-failure.ts` header comment is re-wrapped unevenly (long line); cosmetic.

## Checks

| Check | Result |
|-------|--------|
| Mapping by status + code, never message text | Pass (`messageFor`, `describeGuardFailure`; test with look-alike message text) |
| No raw server text for the six guard codes or an unrecognised 409/503; correlation id kept (incl. null) | Pass (code and unit tests; component tests on account detail/dialogs and role list/detail/forms/permission tab) |
| Strings match D13.1 exactly | Pass (verified character by character against ARCH-FE-001 D13.1 and TODO-022) |
| `PLATFORM_ROLE_PROTECTED` context copy (role vs account differ) | Pass |
| `SYSTEM_USER_LOGIN_EXISTS`, `SYSTEM_ROLE_KEY_EXISTS` keep own handling | Pass (`OWN_HANDLING_CODES`; tests) |
| `describeWriteFailure` unchanged; tenant path not reached by team mapper | Pass (no diff in `tenants/create/write-failure.ts`; callers test; tenant test 3b added) |
| Only `user-failure.ts` and `role-failure.ts` import `guard-failure.ts` | Pass (static callers test, non-vacuous check) |
| `OTHER_ACCOUNT_SESSIONS_ENABLED` one exported constant, `false`, comment cites SP-BG-14 | Pass |
| `canViewUserSessions` and `canForceLogout` require the flag | Pass |
| No "Sesi aktif" tab, no force logout, no sessions request for another account | Pass |
| Own account shows link to `/account/sessions` | Pass, see M1 (not a real link) |
| `user-sessions-tab.tsx`, `sessions.ts` kept | Pass |
| Security: no secrets, no sensitive logging, no frontend-only authorization reliance | Pass |
| Accessibility of new card | Pass except M1; the card is plain text plus one focusable control |
| Encoding (UTF-8, no U+FFFD, no smart quotes, no unicode arrows) | Pass (scanned `src/features/team` and both unit test reports) |
| Test quality: meaningful, not tautological, covers every code on every page group | Pass |
| Provenance FP-238 to FP-252 | Present, `full`; note FP-242/FP-244 paths also appear in FP-256/FP-258 (TODO-023), expected for repeat edits |

## Rework Re-check (v1.1, 2026-10-14 10:20)

Short re-check of the rework only; v1.0 findings above are unchanged except as marked.

| Item | Result | Evidence |
|------|--------|----------|
| M1 closed | Pass | `OwnSessionsLink` in `user-detail-page.tsx` renders `AppLink to="/account/sessions"`. `user-detail-page.test.tsx` queries `getByRole("link", { name: "Lihat sesi saya" })`, checks `href="/account/sessions"`, no `target`, and the negative case with `queryByRole("link")`. |
| OQ1 / L2 closed | Pass | `guard-failure.ts` `messageFor`: 403 + `ROLE_GUARD_VIOLATION` + context `role` returns `PROTECTED_ROLE_MESSAGE`, the same string as `PLATFORM_ROLE_PROTECTED` in the role context. Branches on status and code only; reference id = `error.correlationId`. Account context returns null (not specified, falls to the caller); 409 with this code gets the fixed conflict copy. `role-failure.ts` still lists the code in `REFUSAL_CODES`, so `isRoleRefusal` marks the role refused. |
| Tests for the above | Pass | `guard-failure.test.ts` (role copy, account null, 409 conflict copy); `role-screens-gaps.test.tsx` (table row 403 ROLE_GUARD_VIOLATION and a delete test that asserts the fixed copy, "Kode referensi", server text absent, edit and delete buttons disabled); `role-detail-page.test.tsx` (refused edit/delete). |
| ARCH-FE-001 v1.0.7 D13.1 | Pass | GUARD row in D13, D13.1 table row for 403 ROLE_GUARD_VIOLATION (role pages, same string, role still marked refused), REQ-FE-053 and the v1.0.7 test requirement all match the code. |
| Scope | Pass with notes | Files changed in `src/` outside the TODO-022 File scope list: `user-action-buttons.tsx`, `user-list-page.tsx`, `user-list-page.test.tsx`, `user-list-page.gaps.test.tsx`, `no-delete-system-user.test.ts` (TODO-023, Hapus removal, REQ-FE-054); `tenants/create/tenant-create-page.test.tsx` (test only, the tenant-path guard test required by D13.1). `src/components/ui/sidebar.tsx` (one-line variant change, `default: ""`) is unrelated to TODO-022 and TODO-023 and out of scope; it should not ship with this TODO (L7 below). No production file outside TODO-022/TODO-023 scope changed except `sidebar.tsx`. |
| Independent runs | Pass | `tsc -b` exit 0, `eslint .` clean, `vitest run` 1001 passed in 78 files (matches Unit Test Report v1.2). |

New finding:

- L7 `src/components/ui/sidebar.tsx`: unrelated uncommitted change (`default` variant hover classes removed). Not part of TODO-022 or TODO-023. Commit it separately or revert it; ask the owner of that change. Not blocking.

## Recommendations

M1 and L2 are closed in v1.1. Keep `sidebar.tsx` (L7) out of the TODO-022 commit. Nothing blocks QA.

## Approval Status

Approved:
Yes

No unresolved Critical or High findings. Pipeline may advance to QA for TODO-022.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Should `ROLE_GUARD_VIOLATION` (403) also use fixed copy instead of the server message? | D13.1 lists six codes; this one is a role-refusal code that shows server text | Consistency of Tim IT role pages | architect_frontend | No | Answered | Yes: fixed role-context copy, ARCH-FE-001 v1.0.7 D13.1; implemented and tested (v1.1) |
