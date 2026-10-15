---
id: REL-TODO-024
title: Release Notes TODO-024 — Account states end the session and fixed login copy
owner: technical_writer
status: Approved
version: 1.2
last_updated: 2026-10-15
release_version: Not assigned
source_requirements: [REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011]
related_artifacts: [TODO-024, ARCH-FE-001 v1.0.11, ADR-004, DOC-TODO-024, CODE-REVIEW-TODO-024 v1.3, QA-REPORT-TODO-024 v1.3, UNIT-TEST-REPORT-TODO-024 v1.5]
blocking_open_questions: 0
---

Title: Release Notes TODO-024 — Account states end the session and fixed login copy

Owner: technical_writer

Status: Approved

Version: 1.2

Release Version: Not assigned (see Open Questions)

Last Updated: 2026-10-15

## At a Glance

- A refresh that answers 401 with any code ends the session. A refresh or `me` refused with `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` also ends it, with an account notice on the login page. The login page shows fixed copy for the two codes. Frontend change only.
- A suspend in the middle of a session shows no account notice: the user returns to `/login` as after any session end, and sees "Akun Anda tidak aktif. Hubungi administrator." when signing in again.
- Status: Approved (user approval 2026-10-15, v1.2). QA recommends Go (v1.3). Code review v1.3 is Approved: Yes. Unit test report v1.5 is PASS.
- Known issues: other tabs get no account notice, L5, L6, L7, two flaky tests outside TODO-024, the accepted kept-session `CancelledError`, and open question FE-OQ-46. Listed under Known Issues.
- Technical details: `output/docs/tech-doc-TODO-024.md`.

## Purpose

Tell users of the SP web, support staff and release owners what changed for suspended and not-ready accounts, what was fixed, what is still known to be open, and how to deploy or roll back the change.

## Scope

Covers TODO-024 only: the frontend behaviour on login, refresh, boot and the `me` call after a kept-session password change, for session end by a refresh 401 and for the account codes `ACCOUNT_NOT_ACTIVE` and `ACCOUNT_NOT_READY`. It does not cover other 403 codes or server-side changes.

## Summary

Before this change, a signed-in user whose refresh failed kept a broken session: every page showed "Data tidak dapat dimuat", and at boot the same refusal showed the error screen. The login page also showed the server's English message for the two account codes.

After this change, a refresh that answers 401 with any code (including `SESSION_TERMINATED`, `TOKEN_EXPIRED`, an unknown code, or a non-JSON or empty body) ends the session: token and cache cleared, status anonymous, redirect to `/login` with no account notice. A refresh or `me` call refused with 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` also ends the session, and the login page shows a fixed notice for that code (for example at boot, or after a kept-session password change). A suspend in the middle of a session goes through the 401 path, so it shows no account notice; the account text appears when the user signs in again (login 403 `ACCOUNT_NOT_ACTIVE`). The login page shows fixed copy for both codes and never the server message. The change depends on the platform contract SP-BG-13 (Closed 2026-10-14). It has no API, configuration or storage change.

## Features

- A session ends when a refresh answers 401 with any code (D4.3). `AUTH_EXPIRY_CODES` now only starts a refresh after a data-call 401.
- A session ends when a refresh or the `me` call is refused with 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY`, at app start and after a password change that keeps the session (REQ-FE-055).
- A boot `me` 401 with any code removes the token and gives anonymous, with no notice (D4.2).
- A refresh that is still running when the session ends (logout, cross-tab signal) does not store its token afterwards (M3 fixed).
- The login page shows a one-time notice when the session ended by a 403 account code:
  - `ACCOUNT_NOT_ACTIVE`: "Akun Anda tidak aktif. Hubungi administrator."
  - `ACCOUNT_NOT_READY`: "Akun Anda belum siap digunakan. Hubungi administrator."

## Improvements

- The login form shows fixed copy for the two account codes, with the reference id. The server message is never shown for these codes (REQ-FE-008, D4.5).
- The session-end notice is held in memory for the tab only. It is not written to browser storage or the URL (D4.11).
- At app start, any session end gives anonymous. A refresh or `me` refused with an account code gives the login page with the notice, including a `me` 401 followed by a refresh 403 with an account code (D4.2). A `CancelledError` with no session end keeps the error view.
- Other 403 codes behave as before.

## Bug Fixes

- Fixed: a suspended user stayed inside the app, and every page showed "Data tidak dapat dimuat" after a refresh refused. The session now ends and the user returns to `/login`.
- Fixed (M3): a refresh in flight when the session ended could store its token afterwards and bring the session back. It now resolves null.
- Fixed: at app start, a refresh or `me` refused with an account code showed the error screen, including a `me` 401 followed by a refresh 403 with an account code.
- Fixed: the login page showed the server's English message for the two account codes.
- Fixed during QA rework, before release: under React StrictMode a boot `me` account end ran twice (QA-M1). A `me` account end after a kept-session password change did not end the session (QA-M2). Both are closed in this change and covered by tests.

## Known Issues

These are listed as recorded in the TODO-024 notes, the code review v1.3, the QA report v1.3 and the unit test report v1.5. None blocks the release under the project policy.

1. **L5. Login path after a suspend between login and `me` (Low, open, non-blocking).** If a suspend lands between the login response and the `me` call, the login form shows the generic message "Permintaan gagal. Coba lagi." without the account copy. The stored notice stays pending, so it may appear on the next visit to `/login` in the same tab. Only the narrow window is affected. QA did not reproduce it with a probe; the finding comes from code reading. Coverage note: the boot chain (a `me` 401 then a refresh 403 with an account code) lands on the login page with the notice, and a login-page test covers it. The kept-session chain has no login-page render test. Owner: developer_frontend.
2. **L6. Change-password page has no account-code branch (Low, open, non-blocking).** The change-password classifier has no account branch, and no page test covers an account rejection. On the kept-session chain described in item 5, the page receives a `CancelledError`. The route guard is expected to remove the page before an alert shows, but no test or browser run verifies this. Owner: developer_frontend.
3. **Other tabs go to the login page without the account notice (Low tech debt, Gating No; user decision 2026-10-15).** When one tab ends the session, the other tabs end their own session and go to `/login`. The account notice is shown only in the tab where the account end happened. Read it there.
4. **Flaky tests outside TODO-024 (Low, Gating No).** `app-sidebar-badges.test.tsx` and `tenant-create-page.test.tsx` ("focus moves to the heading") fail intermittently in the full gate. They are outside TODO-024 and the cause is not proven. Recheck on the next gate run.
5. **Accepted behaviour (user decision (a), 2026-10-15).** After a password change that keeps the session, if the `me` call is answered 401 and the refresh that follows is answered 403 with an account code, the session still ends once and the notice is shown. The page's pending request, however, rejects with a `CancelledError` instead of the account code, and no error text is shown to the user.
6. **L7 / UT024-OQ7. Cross-tab logout during boot (Low, Gating No).** A logout signal from another tab that arrives while this tab is booting ends the local session without marking the boot as ended, so the boot can show the error view instead of the login page.
7. **Open question FE-OQ-46 (non-blocking).** Whether auth-service accepts an access token after logout or session end. The frontend clears the token on every session end and does not rely on server rejection. Owner: security_architect.
8. Open Low code-review items (duplicate code-to-copy maps, a test import from another feature, and record items) have no effect on behaviour. They are recorded in `output/reports/code-review-report-TODO-024.md` v1.3.

UT024-OQ5 and UT024-OQ6 are closed or accepted: any boot session end gives anonymous, and a refresh 401 with a non-JSON or empty body ends the session (accepted by the user, 2026-10-15). The earlier boot error-screen known issue for the expiry-only chain no longer applies.

## Deployment Notes

- Frontend change only. No API change, no configuration or environment variable, no browser storage, no database and no new dependency.
- The platform must return `403` with `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` on login, refresh and `GET /api/v1/auth/me` (SP-BG-13, Closed 2026-10-14). If the platform does not return these codes, the frontend keeps the previous behaviour for those calls.
- Gate commands for the change: `tsc -b`, `eslint .`, `vitest run --passWithNoTests`. Last recorded result: all exit 0; 1051 tests passed in 78 files (unit test report v1.5 and QA report v1.3). Those reports predate the M3 fix; rerun the gate before release. QA did not run a production build or a browser check; run the usual production build before release.
- The eight files of this change are modified in the working tree and are not committed at the time of writing. The commit and merge are for the release owner.
- After deployment, run the manual check in `output/docs/tech-doc-TODO-024.md` (section Examples) with a test account.

## Rollback Notes

- Roll back by reverting the TODO-024 change in the eight files listed in `output/docs/tech-doc-TODO-024.md` (Scope). The change stores no data, so there is no data to undo. The notice is held in memory only.
- No server-side rollback is needed.
- After a rollback, the previous behaviour returns: a refresh 401 outside the expiry-code list and a refresh or `me` refused with an account code keep the session, pages show "Data tidak dapat dimuat", and the login page shows the server's English message for the two codes. The platform contract is not affected.

## References

- Requirements: REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011.
- Architecture: ARCH-FE-001 v1.0.11 (D4.2, D4.3, D4.5, D4.6, D4.11, D6.5, D13 ACCOUNT row; FE-OQ-43 to FE-OQ-46).
- ADR: ADR-004.
- Plan: TODO-024 in `output/plans/master-todo.md`.
- Technical documentation: `output/docs/tech-doc-TODO-024.md`.
- Reports: `output/reports/code-review-report-TODO-024.md` v1.3, `output/reports/qa-report-TODO-024.md` v1.3, `output/reports/unit-test-report-TODO-024.md` v1.5.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Which release version is assigned to this change? | The release record needs a version | Release record only | user (release owner) | No | Open | Documented default: "Not assigned" |
| OQ2 | Should L5 and L6 be fixed in a later `/build`, or stay tracked as Low? | Sets the scope of a possible rework | Login and change-password copy on the narrow paths in items 1 and 2 | user, developer_frontend | No | Open | Documented default: Low, non-blocking, tracked |
| OQ3 | Do the reports cover the M3 fix and ARCH-FE-001 v1.0.11? Code review v1.3 and QA v1.3 record M3 as open | The M3 fix and the v1.0.11 boot rule were confirmed from the code, not from a report | Report and release-note versions may disagree until the reports are refreshed | reviewer, qa, unit_test_writer | No | Open | Documented default: reports cited by version as read; rerun the gate before release |
| OQ6 | FE-OQ-46: does auth-service accept an access token after logout or session end? | The frontend does not rely on server rejection | None for this release | security_architect | No | Open | Documented default: the frontend clears the token on every session end. Non-blocking |
| OQ4 | Which record is current for the TODO-024 status? master-todo reads Completed; the orchestration-state gate record cites unit test v1.0; the unit test report v1.2 has conflicting status lines | Checkpoint records must agree before the gate is read as cleared | Record consistency only | orchestrator, project_manager | No | Open | Documented default: this document changes no tracker |
| OQ5 | Is the release run against the live platform (SP-BG-13) before deployment? | QA did not run against the platform or in a browser | Live behaviour is not verified by the reports | user, qa | No | Open | Documented default: contract as written; manual check after deployment |

Blocking open questions: 0
