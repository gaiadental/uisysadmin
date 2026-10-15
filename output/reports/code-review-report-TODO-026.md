---
id: CODE-REVIEW-REPORT-TODO-026
title: Code Review Report — TODO-026 Sessions of another system account
owner: code_reviewer
status: Approved
version: 1.0
last_updated: 2026-10-15 16:10
related_todo: TODO-026
source_requirements: [REQ-FE-032, REQ-FE-052, REQ-FE-053, REQ-FE-017]
related_artifacts: [TODO-026, ARCH-FE-001, ADR-003, ADR-005, unit-test-report-TODO-026]
blocking_open_questions: 0
---

Title: Code Review Report — TODO-026 Sessions of another system account
Owner: code_reviewer
Status: Approved
Version: 1.0
Last Updated: 2026-10-15 16:10
Source Requirements: REQ-FE-032, REQ-FE-052, REQ-FE-053, REQ-FE-017
Related Artifacts:
- output/plans/master-todo.md (TODO-026)
- output/architecture/ARCH-FE-001.md v1.0.13 (D4.10, D7, D13.1)
- output/reports/unit-test-report-TODO-026.md (execution_overall: PASS, 1077 of 1077)
- ADR-003, ADR-005

## At a Glance

- Implementation matches TODO-026 and ARCH-FE-001 v1.0.13. No Critical, no High. 0 Medium, 3 Low.
- Decision: Approved (Yes). Standards: standards-frontend.md, tech-stack-frontend.md, tech-stack-security.md, tech-stack-integration.md.
- Scope resolved from TODO File scope plus file-provenance-register rows (enforcement full).

## Scope Reviewed

- `src/lib/api/modules/sessions.ts`, `sessions.test.ts`
- `src/features/team/users/access.ts`, `access.test.ts`
- `src/features/team/users/user-detail-page.tsx`, `user-detail-page.test.tsx`, `user-detail-page.gaps.test.tsx`
- `src/features/team/users/user-sessions-tab.tsx` (unchanged; integration checked) and new `user-sessions-tab.test.tsx`
- `src/test/handlers/auth.ts`, `src/types/session.ts`: outside the TODO File scope. Confirmed from `git diff`: only two MSW handler paths (`admin/users` -> `system-users`) and one doc-comment path changed. Register rows FP-017 and FP-030 already note this and say the master TODO File scope is to be amended by the orchestrator (see L-3).

## Findings

### Critical

None.

### High

None.

### Medium

None.

### Low

L-1. `src/features/tenants/shared/failure.ts:28` (used by `user-sessions-tab.tsx:70`, `describeReadFailure`): a GET 503 on the sessions list shows the server `message`. REQ-FE-053 and D13.1 say the server message is never shown on Tim IT pages, but the wording is about guard/mutation failures; D13 keeps the 503 read rule for reads, and TODO-026 item (4) lists errors for force logout only. Not a defect against the written contract, but it is the one remaining path on this tab that can show server text. Recommend the architect confirm the intent; no code change required for approval.

L-2. `src/features/tenants/shared/failure.ts:9,26` (GET 403 on the list): the user sees `FORBIDDEN_MESSAGE` "Anda tidak punya akses untuk aksi ini." with the reference id and a "Coba lagi" button. This is consistent with "GET has no principal protection" (a 403 can only mean missing `sessions:view`, not `PLATFORM_ROLE_PROTECTED`; no special case, generic copy, as TODO-026 and D4.10 state). Minor: "aksi" reads oddly for a read, and "Coba lagi" is useless for a 403. Cosmetic; the copy is shared with all read screens. No action needed.

L-3. Process: `src/test/handlers/auth.ts` and `src/types/session.ts` are not in the TODO-026 File scope in `master-todo.md`. The register notes the amendment is pending with the orchestrator. Recommend the orchestrator amend the TODO File scope so scope and register agree.

## Focus Checks

1. Endpoint paths: `sessions.ts:20` `SYSTEM_USERS_PATH = "/api/v1/system-users"`; GET at `sessions.ts:55-60` and DELETE at `:66-72`, both `/{encodeURIComponent(userId)}/sessions`; route labels `admin.sessions.*` kept as specified. Grep for `admin/users` in `src`: only `src/lib/api/client.test.ts:109` (a path-traversal string unrelated to sessions). No code calls `/api/v1/admin/users/{id}/sessions` for a system user. Tenant admin sessions code does not exist elsewhere. Pass.
2. Own account: `access.ts:45-52` `canViewUserSessions(permissions, isSelf)` and `:56-63` `canForceLogout` both include `!isSelf`; the page passes `access.isSelf` (`user-detail-page.tsx:120`), the tab is not rendered and `Tabs value` falls back to "detail" (`:154`). `OwnSessionsLink` shows whenever `access.isSelf` (`:194`), including without `sessions:view`. That is a behaviour change from a literal reading of before (`isSelf && !showSessions`), which was already true for the own account because `!showSessions` held; now it is unconditional on the permission. It is not a problem: the target `/account/sessions` uses `OWN_SESSIONS_ACCESS` (navigation.ts:152), not `sessions:view`, so the link is reachable for any signed-in user. Pass. Note `isSelf` prop on `UserSessionsTab` is now always false at the only call site; harmless defence in depth, keeps the component safe if reused.
3. Errors: force logout failure goes through `describeUserWriteFailure` (TODO-022 copy) and `FormAlert` with `referenceId` (`user-sessions-tab.tsx:90-92,106-109`). `it.each` in `user-sessions-tab.test.tsx:114-140` covers 409 SELF_ACTION_NOT_ALLOWED, 403 PLATFORM_ROLE_PROTECTED, unrecognised 409, 503, 404, each asserting fixed copy, reference id, server text absent and no success toast. Button for a SYS_PRINCIPAL target has no UI gate (`:99-107` uses `showForceLogout` from permission and `isSelf` only; test at `:142`). Pass.
4. GET 403: see L-2. Consistent with the decision (no principal protection on GET, generic read handling). Pass.
5. Invalidation: `forceLogoutUser` then `applyInvalidation(queryClient, { kind: "forceLogout", userId })` (`user-sessions-tab.tsx:84`), which invalidates `queryKeys.adminSessions.ofUser(userId)` (`invalidation.ts:88-89`), the same key the list query uses (`:62`). Matches D12.1; test asserts a refetch (`lists` = 2). Invalidation runs before the success toast, and only on success. Pass.
6. Stale state: a deactivated or suspended account has its sessions ended; the GET returns an empty list and the table shows "Tidak ada sesi aktif." (`:139-146`) with pagination total 0. The "Paksa keluar" button stays enabled; a click ends zero sessions and the server answers `SESSIONS_REVOKED` count 0 (schema accepts 0), so a success toast shows. Acceptable and consistent with "server decides". Optional UX improvement, not required: none. Pass.
7. Standards: named exports, no `any`, small functions, comments explain why; tab has a hidden status for loading, `aria-label` on the table, `aria-busy`, destructive confirm dialog, text buttons with accessible names, error in `FormAlert` (alert role). Loading, error and empty states all present (tech-stack-frontend). In-flight ref guard prevents double submit. Simple: the flag constant is kept as the architecture requires ("one constant that cites SP-BG-14"). Security: no secrets or sensitive logging; server enforces authorization; UI gating is UX only. Pass.

## Recommendations

1. Orchestrator: amend the TODO-026 File scope to include `src/test/handlers/auth.ts` and `src/types/session.ts` (L-3).
2. Architect (optional): confirm whether a GET 503 on the sessions list may show the server message (L-1).
3. No code change required before QA.

## Approval Status

Approved:
Yes

No unresolved Critical or High findings. Counts: Critical 0, High 0, Medium 0, Low 3.

## Open Questions

None
