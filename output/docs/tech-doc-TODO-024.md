---
id: DOC-TODO-024
title: Technical Documentation TODO-024 — Account states end the session and fixed login copy
owner: technical_writer
status: Approved
version: 1.2
last_updated: 2026-10-15
source_requirements: [REQ-FE-055, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011]
related_artifacts: [TODO-024, ARCH-FE-001 v1.0.11, ADR-004, CODE-REVIEW-TODO-024 v1.3, QA-REPORT-TODO-024 v1.3, UNIT-TEST-REPORT-TODO-024 v1.5, RELEASE-NOTES-TODO-024]
blocking_open_questions: 0
---

Title: Technical Documentation TODO-024 — Account states end the session and fixed login copy

Owner: technical_writer

Status: Approved

Version: 1.2

Last Updated: 2026-10-15

Source Requirements:
- REQ-FE-055 (account states), REQ-FE-008 (error copy), REQ-FE-009 (login error mapping), REQ-FE-010 (refresh and logout), REQ-FE-011 (boot)

Related Artifacts:
- TODO-024 (`output/plans/master-todo.md`)
- ARCH-FE-001 v1.0.11 (D4.2, D4.3, D4.5, D4.6, D4.11, D6.5, D13 ACCOUNT row; FE-OQ-43 to FE-OQ-46)
- ADR-004 (first-party login exception)
- `output/reports/code-review-report-TODO-024.md` (v1.3, Approved: Yes, 0 Critical, 0 High; written before the M3 fix, see OQ7)
- `output/reports/qa-report-TODO-024.md` (v1.3, Go, Pending Approval; written before the M3 fix, see OQ7)
- `output/reports/unit-test-report-TODO-024.md` (v1.5, `execution_overall: PASS`)
- `output/docs/release-notes-TODO-024.md`

## At a Glance

- Describes the delivered behaviour of session end and the account states. A refresh that answers 401 with any code ends the session. A refresh or `me` that answers `403 ACCOUNT_NOT_ACTIVE` or `403 ACCOUNT_NOT_READY` ends it with an account notice on `/login`. A boot `me` 401 with any code ends the session as anonymous. The login page shows fixed copy for the two account codes.
- Important: a suspend in the middle of a session shows no account notice. The data call gets 401, the refresh gets 401 `SESSION_TERMINATED`, and the user returns to `/login` as after any session end. The text "Akun Anda tidak aktif. Hubungi administrator." appears when the user signs in again (login 403 `ACCOUNT_NOT_ACTIVE`).
- Status: Approved (user approval 2026-10-15, v1.2). QA recommends Go (v1.3). Code review v1.3 is Approved: Yes. Unit test report v1.5 is PASS. No blocking open question. The live platform was not exercised in this cycle.
- Known limits: other tabs get no account notice, L5, L6, L7 (cross-tab logout during boot), two flaky tests outside TODO-024, FE-OQ-46. See Known Behaviour and Open Questions.
- Key references: REQ-FE-055, ARCH-FE-001 v1.0.11 (D4.2, D4.3, D4.5, D4.6, D6.5, D13), TODO-024, the three reports above.

## Purpose

This document describes, for frontend developers, QA and support staff of the SP web, what ends the session, what happens when a user's account is suspended or not ready, what the login page shows, and which cases are known not to be covered. It documents delivered behaviour only.

## Scope

In scope: the eight files of TODO-024, all in the frontend repository.

| Path | FP row | Role in this change |
|------|--------|---------------------|
| `src/lib/api/refresh.ts` | FP-013 | Maps a refresh 403 account code to a session end with a reason |
| `src/lib/api/refresh.test.ts` | FP-014 | Tests for the refresh path and the 401 and 403 boundaries |
| `src/app/providers/auth-provider.tsx` | FP-026 | Boot `me`, kept-session `me` (`refreshMe`) and the one-time session end |
| `src/app/providers/auth-provider.test.tsx` | FP-027 | Boot, StrictMode, kept-session and chain tests |
| `src/features/auth/auth-notice.ts` | FP-081 | Two new notice values, held in memory only |
| `src/features/auth/auth-messages.ts` | FP-080 | Fixed login copy for the two codes; notice text |
| `src/features/auth/auth-messages.test.ts` | FP-079 | Login classifier tests |
| `src/features/auth/login-page.test.tsx` | FP-089 | Login page notice and error tests, including the boot chain test and the data chain test (k) |

`login-page.tsx` was not changed. It already renders the notice text through `noticeText`.

Out of scope:
- Other 403 codes (`FORBIDDEN`, `PASSWORD_CHANGE_REQUIRED`, a 403 with no code). They keep the session (D6.5, unchanged).
- The data-call trigger for a refresh (`AUTH_EXPIRY_CODES`: `UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED`). Unchanged; it only starts a refresh and does not decide its outcome.
- Server-side enforcement of the account codes. That belongs to the platform (SP-BG-13, Closed 2026-10-14).
- The Low items listed under Known Behaviour and Open Questions.

## Audience

- Frontend developers who maintain the auth flows (`refresh.ts`, `auth-provider.tsx`, the login page).
- QA engineers who verify a suspended account or the chains described below.
- Support staff who need to explain what a suspended user sees.

## Prerequisites

- Platform contract SP-BG-13 (Closed 2026-10-14): the server returns `403` with the error code `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` on login, on refresh and on `GET /api/v1/auth/me`. The frontend matches the HTTP status 403 and the `code` value, never the message text.
- The auth flows built by TODO-005 (logout handler and cache clear) and TODO-006 (route guard). This change calls both.
- The repository toolchain. Gate commands, run exactly: `tsc -b`, `eslint .`, `vitest run --passWithNoTests`. All three must exit 0.

## Procedure

### 1. Which responses end the session

| Call | Response | Effect |
|------|----------|--------|
| Refresh (boot, or the refresh after a data request answered 401 with an expiry code) | 403 `ACCOUNT_NOT_ACTIVE` | Token cleared, query cache cleared, logout handler called once with reason `accountNotActive`, notice stored |
| Refresh, same paths | 403 `ACCOUNT_NOT_READY` | Same, with reason `accountNotReady` |
| Boot `me` (after a successful refresh) | 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` | Session ends once if a token is still held. Status `anonymous` with the notice, not `error` |
| Boot `me` answered 401 with any code (after the transport refresh, if any, did not recover it) | Token removed, session ends with no account notice, status `anonymous` (D4.2, v1.0.11) |
| Boot `me` answered 401, then the refresh it triggers answered 403 with an account code | Session ends once, with the reason recorded by that end. Status `anonymous` with the notice, not `error`. The pending `me` rejects with a `CancelledError`, which does not change the view (section 4) |
| Boot `me` answered 401, then the refresh it triggers answered 401 with any code | Session ends with no notice. Status `anonymous` |
| Boot, any session end during the boot | Status `anonymous`. A `CancelledError` with no session end keeps the error view |
| Kept-session `me` (after change password with `keepCurrentSession`) | 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` | Session ends once, with the notice. The change-password flow rejects and the user goes to `/login` |
| Login (`POST /api/v1/auth/login`, or the `me` call right after it) | 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` | No session exists to end. The login form shows the fixed copy with the reference id. The login error path does not store a notice |
| Refresh or `me` | Any other 403 code, or a 403 with no usable code | Session kept as before. No notice (D6.5, unchanged) |
| Refresh | 401 with any code: `SESSION_TERMINATED`, `TOKEN_EXPIRED`, `SESSION_ENDED`, `INVALID_TOKEN`, `UNAUTHORIZED`, an unknown code, or a non-JSON or empty body (the last accepted by the user) | Session ends: token and cache cleared, status `anonymous`, redirect to `/login` with no account notice (D4.3, v1.0.10) |
| Refresh | 401 carrying an account code | Not an account end. Only a 403 maps to an account reason. It ends the session as any 401 does, with no account notice |
| Refresh in flight when the session ends (logout, cross-tab signal, `endSession`) | Token returned later | The token is not stored. The refresh resolves `null` (M3 fixed) |

`AUTH_EXPIRY_CODES` (`UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED`) now only decides whether a data call that answered 401 starts a refresh. It does not decide the refresh outcome.

Each session end also tells the other tabs (see section 6).

### 2. Notice and login copy per code

| Code | Text on `/login` after a session end (exact) | Inline text on the login form (exact), with the reference id |
|------|----------------------------------------------|---------------------------------------------------------------|
| `ACCOUNT_NOT_ACTIVE` | Akun Anda tidak aktif. Hubungi administrator. | Akun Anda tidak aktif. Hubungi administrator. |
| `ACCOUNT_NOT_READY` | Akun Anda belum siap digunakan. Hubungi administrator. | Akun Anda belum siap digunakan. Hubungi administrator. |

Rules that apply to both codes:
- The server `message` is never shown for these codes, on the login form or as a notice.
- The notice after a session end carries the fixed text only. It has no reference id. The login form shows the reference id.
- `400 VALIDATION_FAILED` on login still shows the server message (D4.5, unchanged).

### 3. What the user sees

- After any session end, the app opens `/login`. The route guard sends a user with status `anonymous` to the login page. The account notice appears only when the end was caused by a refresh or `me` answered 403 with `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY` (for example at boot, or after a kept-session password change).
- Suspend in the middle of a session: the data call gets 401, the refresh gets 401 `SESSION_TERMINATED`, and the user returns to `/login` with the ordinary session-ended behaviour and no account notice. The text "Akun Anda tidak aktif. Hubungi administrator." appears when the user signs in again and login answers 403 `ACCOUNT_NOT_ACTIVE`.
- The login page shows one notice above the form (`role="status"`) with the text from the table above. The notice is read once when the login page mounts and is then cleared.
- The notice is held in memory for this tab only (`auth-notice.ts`). It is not written to `localStorage`, `sessionStorage`, a cookie or the URL (D4.11). A page reload clears it.
- Boot: a refresh or `me` refused with an account code at app start gives the login page with the notice, not the error screen. This includes a `me` 401 followed by a refresh 403 with an account code. The `CancelledError` of the cancelled `me` does not decide the view; the session end reason recorded during the boot does (`bootAccountEndRef` in `auth-provider.tsx`). Tests: `auth-provider.test.tsx` ("account states at boot", including "a boot me 401 then a refresh 403") and `login-page.test.tsx` ("LoginPage after a boot account refusal"). Any session end during boot gives `anonymous`. A boot `me` 401 with any code removes the token and gives `anonymous`. A `CancelledError` with no session end keeps the error view.
- Data chain (FE-OQ-45): the gateway checks the session on each request with a 30-second cache. After a suspend, a data request is answered 401 with an expiry code, which starts a refresh. In the delivered platform behaviour that refresh is answered 401 `SESSION_TERMINATED`, so the session ends with no account notice and the user lands on `/login`; no page shows "Data tidak dapat dimuat". If the refresh were answered 403 with an account code instead, the session would end with the account notice.

### 4. Kept-session chain: `me` 401 then refresh 403 (known behaviour)

After a password change with `keepCurrentSession`, the app calls `me` with the rotated token. If that `me` call is answered 401, a refresh runs, and the refresh is answered 403 `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY`:

- The final outcome matches the direct path. The session ends once, the logout handler is called once with the reason, one announcement goes to the other tabs, the status is `anonymous`, and the notice for the code is stored. The user reaches `/login` with the notice.
- The page's pending `me` call rejects with a `CancelledError`, not with the account code. The unit test report records the cause as the logout cache clear cancelling the in-flight `me` fetch.
- No error text is shown on this path (test asserts that the page error text is not the account code and that the only logged error is the transport label).
- The user accepted this behaviour on 2026-10-15 (decision (a)). It is recorded as accepted behaviour, not a defect.
- Consequence for developers: on this chain the page cannot identify the account end from the error code. Logic that must react to the session end should key on the session status.
- The change-password page has no account-code branch (L6, open). Its page-level behaviour on this chain is not covered by a page test. No login-page render test covers this chain either. The boot chain with the same codes has one (section 3). See Open Questions.

The direct kept-session path (the `me` call answers 403 with no 401 first) is guarded in `refreshMe`. It rejects with the account code, as the notice path requires.

### 5. Refresh 401 and the data-call trigger

A refresh answered 401 with any code (including `SESSION_TERMINATED`, `TOKEN_EXPIRED`, an unknown code, or a non-JSON or empty body) clears the token and cache with no reason and no notice. A data request answered 401 with a code in `AUTH_EXPIRY_CODES` still triggers one refresh and one retry. A second 401 ends the session. Account codes are not expiry codes, so a data request answered 401 with an account code does not start a refresh.

### 6. Other tabs and cross-tab logout (Low gaps, known)

When a tab ends the session, it posts a `logout` message on the `sp-session` BroadcastChannel. Other tabs end their own session locally (token and cache) and go to `/login`. The account notice is held in memory of the tab where the account end happened. No other tab shows it. This is recorded as Low tech debt, Gating No (user decision 2026-10-15). Read the notice in the tab where the account end happened.

L7 (UT024-OQ7, Low, Gating No): a cross-tab logout signal that arrives during boot ends the local session without marking the boot as ended, so the boot can show the error view instead of the login page.

## Examples

Error body the frontend matches (placeholder values only; the `message` is never shown for these codes):

```json
{
  "code": "ACCOUNT_NOT_ACTIVE",
  "message": "<server text, not shown to the user>"
}
```

Manual check for QA on a test environment, with a test account only, after SP-BG-13 is deployed:

1. Sign in with an active test account and open a data page.
2. Suspend the test account in the platform.
3. Open or refresh a data page after the gateway cache has expired (30 seconds). Expected: the user returns to `/login` with the ordinary session-ended behaviour and no account notice, and no "Data tidak dapat dimuat" on any page.
4. Try to sign in with the suspended account. Expected: the fixed text "Akun Anda tidak aktif. Hubungi administrator." with the reference id, and no English server text on the form.
5. To see the account notice after a session end, use a case where refresh or `me` answers 403 with the account code (for example app start with a suspended account, or the kept-session password change). Reload `/login`. Expected: the notice is gone. This is by design.
6. Repeat with `ACCOUNT_NOT_READY` if the platform can produce that state.

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| Pages show "Data tidak dapat dimuat" for a suspended user | The refresh or `me` response does not carry HTTP 403 with `code` `ACCOUNT_NOT_ACTIVE` or `ACCOUNT_NOT_READY`. Other 403 codes keep the session by design | Check the status and the `code` of the refresh or `me` response. Check that SP-BG-13 is deployed in the environment |
| Login shows an English server message for a suspended user | The login response carries neither account code | Check the login response code. The fixed copy applies only to the two account codes. `400 VALIDATION_FAILED` still shows the server message by design |
| Login page has no notice after a session end | The notice is held in memory and read once on mount. A reload, a new tab or a session end in another tab leaves no notice | Expected after a reload. Repeat the session end in the tab that ended it to see the notice |
| Login page opened in a second tab shows no notice | Other-tab gap (Low tech debt, Gating No) | Known. Read the notice in the tab where the account end happened |
| A generic message "Permintaan gagal. Coba lagi." on login after a suspend | A suspend landed between the login response and the `me` call (L5) | Known and Low. The stale notice may appear on the next `/login` mount in the same tab |
| An alert flashes on the change-password page after a suspend in the kept-session flow | No account branch in the change-password classifier, and the rejection is a `CancelledError` on this chain (L6) | Known and Low. Not verified in a browser. Record the steps and the time for the L6 owner |
| Session ends after a 401 with no notice, including a suspend in the middle of a session | A refresh answered 401 with any code (for example `SESSION_TERMINATED`) ends the session with no account notice by design | Expected. The user signs in again and sees the account text from the login 403 |
| Error screen at app start after a logout in another tab | Cross-tab logout during boot (L7, UT024-OQ7, Low, Gating No) | Known. Retry or reload; the user signs in again |

## References

- Requirements: REQ-FE-055 (account states, v1.0.8, extended to boot and kept-session `me` in v1.0.9), REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011.
- Architecture: ARCH-FE-001 v1.0.11 (v1.0.10: refresh 401 with any code ends the session; v1.0.11: boot `me` 401 with any code ends the session). D4.2 (boot), D4.3 (refresh), D4.5 (login), D4.6 (password change), D4.11 (memory-only notice), D6.5 (403 handling), D13 ACCOUNT row. FE-OQ-43 (copy, answered 2026-10-15), FE-OQ-44 (`ACCOUNT_NOT_READY` ends the session, answered 2026-10-15), FE-OQ-45 (gateway session check, answered 2026-10-15), FE-OQ-46 (open, non-blocking).
- ADR: ADR-004 (first-party login exception).
- Plan: TODO-024 in `output/plans/master-todo.md`.
- Reports: `output/reports/code-review-report-TODO-024.md` v1.3 (Approved: Yes), `output/reports/qa-report-TODO-024.md` v1.3 (Go), `output/reports/unit-test-report-TODO-024.md` v1.5 (PASS; last recorded 92 of 92 in the four TODO-024 test files and 1051 of 1051 in the full gate). These versions predate the M3 fix (see OQ7).
- Platform: SP-BG-13 (Closed 2026-10-14), the server contract for the two codes.
- Code: `src/lib/api/refresh.ts`, `src/app/providers/auth-provider.tsx`, `src/features/auth/auth-messages.ts`, `src/features/auth/auth-notice.ts`, and the four test files in the Scope table.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | UT024-OQ5 (boot with `me` 401 then refresh 401) and UT024-OQ6 (non-JSON or empty 401 body) | Both are closed or accepted by the user (2026-10-15): any boot session end gives `anonymous`, and a refresh 401 with any code, including a non-JSON or empty body, ends the session | None | user | No | Answered | Closed. Recorded in section 1 |
| OQ7 | Do the reports cover the M3 fix and ARCH-FE-001 v1.0.11? Code review v1.3 and QA v1.3 record M3 as open, and the unit test report v1.5 was written before the fix | The M3 fix and the v1.0.11 boot rule were confirmed here from `refresh.ts` and `auth-provider.tsx`, not from a report | Report and documentation versions may disagree until the reports are refreshed | reviewer, qa, unit_test_writer | No | Open | Documented default: this document cites report versions as read and describes the delivered code |
| OQ8 | FE-OQ-46: does auth-service accept an access token after logout or session end? | The frontend clears the token on every session end and does not rely on server rejection | None for this release | security_architect | No | Open | Documented default: the frontend clears the token and does not rely on server rejection. Non-blocking |
| OQ9 | Are the flaky tests `app-sidebar-badges.test.tsx` and `tenant-create-page.test.tsx` ("focus moves to the heading") tracked outside TODO-024? | They fail intermittently in the full gate and are outside TODO-024 scope | Gate reliability | user, unit_test_writer | No | Open | Documented default: Low, Gating No, outside TODO-024 |
| OQ2 | What release version is assigned to this change? | The release notes template asks for one. The project records do not assign one | Release record only | user (release owner) | No | Open | Documented default: "Not assigned" in the release notes |
| OQ3 | The records disagree on TODO-024 status and on the version under review. master-todo reads `Completed (2026-10-15, rework M1 and M2)`. The orchestration-state gate record cites unit test v1.0 (code review L3). Unit test report v1.2 has `status: Approved` in front matter and "Pending Approval" in its Purpose section | Checkpoint records must agree before the gate is read as cleared | Record consistency only | orchestrator, project_manager, unit_test_writer | No | Open | Documented default: this document cites reports by version and changes no tracker |
| OQ4 | Is the platform behaviour for the two codes verified live? | QA did not run against SP-BG-13 and did not run a browser check. The contract is taken as written in the TODO | Live behaviour unknown until the manual check in Examples is run | user, qa | No | Open | Documented default: contract as written in TODO-024 and SP-BG-13 |
| OQ5 | Are L5 (login path) and L6 (change-password page) fixed in a later `/build`, or tracked as Low? | QA OQ1 and OQ2, unit test UT024-OQ2 and UT024-OQ3 | Scope of a possible rework | user, developer_frontend | No | Open | Documented default: Low, non-blocking, tracked as recorded |
| OQ6 | Should the intermittent timeout runs be rechecked on the next gate run? See OQ9 for the two named flaky tests | A recurring flake can hide a real failure | Gate reliability | unit_test_writer, user | No | Deferred | Documented default: non-blocking; recheck on the next gate run |

Blocking open questions: 0
