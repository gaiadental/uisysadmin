---
id: CODE-REVIEW-VALIDATE-TODO-001-017
title: Code Review Report — SP Web Frontend TODO-001 to TODO-017
owner: reviewer (code_reviewer)
status: Draft
version: 1.0
last_updated: 2026-10-12 10:05
source_requirements: [REQ-FE-001 to REQ-FE-051 (excluding REQ-FE-027, REQ-FE-041, REQ-FE-044)]
related_artifacts: [TODO-001..TODO-017, ARCH-FE-001, ADR-001..ADR-007, FILE-PROVENANCE-REGISTER, UNIT-TEST-REPORT-TODO-001..017]
blocking_open_questions: 0
---

Title: Code Review Report — SP Web Frontend TODO-001 to TODO-017
Owner: reviewer (code_reviewer)
Status: Draft
Version: 1.0
Last Updated: 2026-10-12 10:05
Source Requirements: REQ-FE-001 to REQ-FE-051 (per TODO trace; REQ-FE-027 deferred, REQ-FE-041 excluded, REQ-FE-044 external)
Related Artifacts:
- output/plans/master-todo.md (TODO-001 to TODO-017, Completed)
- output/plans/file-provenance-register.md
- output/architecture/ARCH-FE-001.md (v1.0)
- output/decisions/ADR-001 to ADR-007
- output/reports/unit-test-report-TODO-001.md to unit-test-report-TODO-017.md

## At a Glance

- Review of the delivered frontend delta for TODO-001 to TODO-017 (TODO-018 not started, out of scope).
- Findings: Critical 0, High 1, Medium 4, Low 13. No Critical finding is open.
- Approval: No, for now. The one High item is a provenance-register gap that blocks the /validate gate. It is fixed by project-manager, not by code changes. Once it is closed, the code findings do not block approval.
- Key references: ARCH-FE-001 D4 (auth and session), D3 (HTTP pipeline), D6 (gates), D12 (query keys); ADR-002, ADR-004, ADR-007.

## Purpose

Record the code review of the implemented SP web frontend against requirements, ARCH-FE-001, ADR-001 to ADR-007, the coding and frontend standards, and the security and integration rules, for the /validate stage 8 gate.

## Scope

### Scope Reviewed

- Paths in `output/plans/file-provenance-register.md`: 226 rows, all `Enforcement: full` (199 agent-created, 27 agent-modified). Greenfield, enforced (`project-profile.md`).
- Six registered paths no longer exist on disk (deleted by TODO-017, see L-12), and one registered row points at a missing path (M-3). None of them was reviewed as code.
- One in-scope file that is untracked and missing from the register: `src/features/auth/components/login-shell.tsx` (finding H-1). It was reviewed as in scope through TODO-008 `src/features/auth/`.
- Integration touchpoints named in TODO scope: `vite.config.ts`, `index.html`, `tsconfig.app.json`, `eslint.config.js`, `package.json`, `.env.development`, `.env.production`.

### Method and Evidence

- Repository-wide static scans of `src/` (production and test code) for: browser storage APIs, forbidden identity headers, `dangerouslySetInnerHTML`, `any`, type and lint suppressions, console output, dynamic `href` and `src`, `eval`, `innerHTML`, `_blank`, legacy imports (`src/data`, `src/pages`, `src/router`), path-parameter encoding, and label association for form controls.
- Deep read of the security-relevant and integration-relevant files: `src/lib/api/client.ts`, `refresh.ts`, `errors.ts`, `modules/auth.ts`, `modules/tenants.ts`, `app/providers/auth-provider.tsx`, `app/guards/route-guard.tsx`, `lib/access/gates.ts`, `lib/access/roles.ts`, `features/auth/login-page.tsx`, `reset-password-page.tsx`, `forgot-password-page.tsx`, `auth-notice.ts`, `components/custom/form-alert.tsx`, `lib/notify.ts`, `features/tenants/create/tenant-create-page.tsx`, `features/tenants/create/write-failure.ts`, `features/tenants/detail/logo-url.ts`, `features/team/users/access.ts`, `features/team/users/use-user-actions.ts`, `features/team/roles/access.ts`, `features/team/roles/refused-roles.ts`, `features/auth/sessions-page.tsx`, `lib/query/invalidation.ts`, `src/test/static-rules.test.ts`, `vite.config.ts`, `package.json`, `tsconfig.app.json`, `eslint.config.js`, `src/hooks/use-mobile.ts`.
- Sampled, not read line by line: the catalog, team, dashboard and tenant-permission page components, and the MSW handlers. Their loading, error and empty states were confirmed by scan.
- Commands run (read-only): `npx tsc --noEmit -p tsconfig.app.json` exit 0; `npx eslint src` exit 0; `npx vitest run` 70 files, 884 tests passed.
- Unit Test Reports TODO-001 to TODO-017 all read `execution_overall: PASS`.

## Findings

### Critical

None.

### High

**H-1. Provenance register is missing an in-scope file (process gate).**
- Location: `src/features/auth/components/login-shell.tsx` (untracked, new, imported by `src/features/auth/login-page.tsx`).
- Scope: inside TODO-008 File scope (`src/features/auth/`). Not in `output/plans/file-provenance-register.md` (no FP row).
- Why it matters: artifact-standards "Provenance and Gate Checks" requires an FP row for every path of a completed TODO before /validate. Without it, enforcement scope for this file cannot be resolved.
- Recommendation (project-manager, not the Reviewer): add an FP row for `src/features/auth/components/login-shell.tsx` (file, agent-created, enforcement full, TODO-008). No code change needed.
- Status: Open. Owner: project_manager.

### Medium

**M-1. Tenant create is not idempotent, and a transport failure invites a resubmit that shows a misleading 409.**
- Location: `src/features/tenants/create/tenant-create-page.tsx` (submit handler, catch branch) and `src/lib/api/modules/tenants.ts` (`createTenant`). Tracked in SP-BG-11.
- Behaviour: a NETWORK or TIMEOUT after the POST may still have created the tenant. The form stays on the last step, so the user resubmits. The second POST returns 409 (duplicate code) and the form shows "code taken" while the tenant exists.
- Good: no automatic retry; submit disabled in flight; no duplicate in one click.
- Recommendation: after NETWORK or TIMEOUT on create, do not offer a plain resubmit. Show a "check the tenant list before retrying" message and link to the list, or look up the code first. Ask the platform for an `Idempotency-Key` (SP-BG-11) so the BE can return the original result.
- Status: Open. Owner: developer_frontend (copy and flow); external dependency SP-BG-11.

**M-2. Production security headers (CSP, frame policy, referrer policy) are not defined in the repository.**
- Location: `index.html` (no CSP meta), `vite.config.ts` (no headers). Requirement REQ-FE-044; standard `standards-frontend.md` -> Security Standard (CSP for all production deployments).
- Status of the decision: FE-OQ-20 is Open and non-blocking; it is a release gate (PM-RK-11). The proposal in ARCH-FE-001 D15 is recorded but not implemented in any artifact.
- Recommendation: keep as a release blocker tracked with security_architect and operations. Confirm the static host sends `frame-ancestors 'none'` (or `X-Frame-Options: DENY`), `Referrer-Policy`, and a CSP that matches D15 (`connect-src 'self'`, `img-src 'self' https:`). No frontend TODO can close this alone.
- Status: Open (release gate). Owner: security_architect, operations.

**M-3. File provenance row points at the wrong path for a test file.**
- Register row FP-134 lists `src/features/tenants/detail/tenant-detail-permissions-route.test.tsx`. The file on disk is `src/features/tenants/permissions/tenant-detail-permissions-route.test.tsx` (untracked). The row resolves to nothing, so the real file has no enforcement row.
- Recommendation: project-manager corrects the path in FP-134 (or adds the correct row). No code change.
- Status: Open. Owner: project_manager.

**M-4. Backend-only enforcement gap for self-protection and SYS_PRINCIPAL lock (SP-BG-13).**
- Location: `src/features/team/users/access.ts` (`userActionAccess`, own account), `src/features/team/roles/access.ts` (`roleActionAccess`, static SYS_PRINCIPAL lock).
- The UI hides deactivate, delete, suspend, role change and force logout for the own account, and locks SYS_PRINCIPAL. These are UX gates only. auth-service does not guard them today (SP-BG-13), so a direct API call can still deactivate the own account or edit SYS_PRINCIPAL. The code comments say so correctly. The risk is a real lockout path until the platform fixes it.
- Recommendation: keep the UI gates. Track SP-BG-13 as a platform blocker for production. The frontend cannot close it.
- Status: Open (external). Owner: platform (auth-service), security_architect.

### Low

**L-1. Forgot-password shows the neutral "link sent" message for client-side failures.**
- Location: `src/features/auth/forgot-password-page.tsx` (catch branch) and `src/features/auth/auth-messages.ts` (`classifyForgotError`).
- Every non-validation outcome shows the neutral message, including NETWORK and TIMEOUT. This matches the literal D4.7 rule (no account enumeration). For a client-side failure, though, nothing was sent, so the message misleads.
- Recommendation: ask architect_frontend whether NETWORK and TIMEOUT should show the error with a retry. Enumeration is not a risk for client-side failures.

**L-2. English copy in an Indonesian UI.**
- Location: `src/features/auth/auth-messages.ts:21` (`CURRENT_PASSWORD_MESSAGE = "Current password is incorrect."`), shown on change-password.
- The file header says this copy is quoted from the FE doc as written, so it is a copy question (FE-OQ-22), not a defect. Confirm under FE-OQ-22.

**L-3. Error logging is not gated by environment in one place.**
- Location: `src/lib/notify.ts:34` logs `[notify] ...` with `console.error` in all builds. `src/lib/api/client.ts:301` gates its log with `isDevelopment()`.
- Content is safe (kind, code, status, reference id; no body or headers). Align both on one rule (development-only, or both always on), as ARCH-FE-001 D18 says.

**L-4. Tenant admin-account Retry guard uses state, not a ref.**
- Location: `src/features/tenants/create/tenant-create-page.tsx` (`CreatedPanel.retry`, `retrying` state, line 468 to 472).
- A double activation before the re-render can start two retries. The other write paths use a ref in-flight guard (`use-user-actions.ts`). Use the same pattern.

**L-5. Test gaps in the refresh and path rules.**
- Location: `src/lib/api/client.test.ts`, `src/lib/api/refresh.test.ts`.
- Missing tests: exemption on variant spellings of exempt paths (upper case, trailing slash, dot segments such as `/api/v1/auth/../auth/login`); a path with `//`; the lock re-check path in a second tab. The code normalises these (`normalisedPath`), so the test is the only evidence.
- Recommendation: add `it.each` cases for variant spellings and for an exempt path reached through a dot segment.

**L-6. Cross-tab refresh runs again after the lock is released.**
- Location: `src/lib/api/refresh.ts` (`runExclusive`, lines 102 to 106).
- The per-tab check runs before the lock, not after it. A waiting tab therefore refreshes again after another tab already rotated the refresh cookie. The cookie is shared, so the call succeeds, and the result is one extra rotation. This is safe but wasteful. Confirm with the auth-service team that rotation reuse detection does not treat this as reuse. Re-check the rotation state inside the lock if the platform allows it.

**L-7. `use-mobile.ts` reads two different signals.**
- Location: `src/hooks/use-mobile.ts`. `subscribe` uses the `matchMedia` change event; `getSnapshot` reads `window.innerWidth`. Both agree in practice. Use `matchMedia(MOBILE_QUERY).matches` in the snapshot, so one signal is used. The file also has no header comment. This file is part of the user-approved OQ-P-60 rewrite; the finding is minor.

**L-8. Static rule scan can miss a forbidden name inside a string literal.**
- Location: `src/test/static-rules.test.ts:34`. `stripComments` removes `//` through end of line, including `//` inside string literals (for example `"a//X-Role"`). A forbidden name placed after such a `//` is not scanned. This weakens the static check (test-only, no runtime effect).
- Recommendation: use a tokenizer (for example the TypeScript scanner) instead of a regex, or add a test that the literal case is caught.

**L-9. Test-support helpers sit in production feature folders.**
- Location: `src/features/auth/test-helpers.ts`, `src/features/team/users/test-support.tsx`, `src/features/team/roles/test-support.tsx`. They import `@testing-library/react` and are not named `*.test.*`. They are not imported by production code, so they are not bundled. They are included by `tsc -b`, and the static scan treats them as production source.
- Recommendation: move them under `src/test/` or rename them to a test-only pattern, and exclude them from the production scan.

**L-10. Cross-feature type import.**
- Location: `src/features/team/users/use-user-actions.ts:15` imports `WriteFailure` from `@/features/tenants/create/write-failure`. Move the shared type to `src/lib/` or `src/features/shared/`.

**L-11. Vitest cache directory not ignored.**
- Location: repository root `.vitest/` (untracked). `.gitignore` exists and has no entry for it. Add `.vitest/` to `.gitignore`.

**L-12. Register rows for deleted paths are not annotated.**
- Register rows FP-220 to FP-225 (`src/data/`, `src/pages/`, `src/router/index.tsx`, `src/hooks/use-pagination.ts`, `src/assets/react.svg`, `src/app/dashboard/data.json`) describe agent-modified paths that no longer exist. Record each deletion in its Notes column (project_manager).

**L-13. Open observation: no idle timeout policy.**
- FE-OQ-21 (security_architect, Open, non-blocking) records "no idle logout in v1". `tech-stack-security.md` requires sessions to support expiration; server-side expiry applies, but an idle policy is not defined. Track in the security decisions.

## Verified Conformance (no finding)

- Tokens: the access token is a module variable only (`refresh.ts`). No `localStorage` or `sessionStorage` use for auth or session data. The only `localStorage` use is the theme key (D4.11), and `sessionStorage` appears nowhere in production source.
- Forbidden identity headers (`X-User-ID`, `X-Role`, `X-Tenant-ID`, `X-Service-Token`) are never sent (`client.ts` allow-list; dev assertion; tests).
- `dangerouslySetInnerHTML`, `eval`, `innerHTML`, `new Function` and `_blank` links: none in production source.
- Logo URL: rendered only when the scheme is https (http in development), with `referrerPolicy="no-referrer"`.
- Reset token: read once, then removed from the URL with `history.replaceState`. Never logged or stored.
- Login sends `loginId` and `password` only (no tenant field, D4.5). Cross-tab logout signal carries no token.
- Authorization is UI-only. Gates are pure, tested, and state that the backend enforces. `SYS_PRINCIPAL` is a single constant.
- TypeScript: `tsconfig.app.json` has `strict`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `forceConsistentCasingInFileNames`, `resolveJsonModule` (REQ-FE-051). `tsc` passes. No `any` in production or test code. `@ts-expect-error` appears only in tests, with a reason.
- Lint suppressions: all `eslint-disable` lines carry a reason. The `src/components/ui/**` override is the user-approved OQ-P-60 scope extension.
- Integration: one HTTP pipeline (D3.1); path must start with `/api/v1/`; 30-second timeout; new correlation id per attempt; 204 handled; JSON parsed only when it parses; one retry after refresh; `INVALID_CREDENTIALS` and exempt paths never refresh; development logs carry only reference id, status, code, route and kind.
- Path parameters are encoded (`encodeURIComponent`) in every API module.
- Write whitelists: tenant patch sends only `is_active`, `logo_url`, `country_code`; create body whitelisted; no delete function exists for tenants.
- Accessibility: form controls have labels (`htmlFor` or `aria-label`), `aria-invalid` and `aria-describedby` on fields, `role="alert"` on form alerts, no positive `tabIndex`, no clickable non-button elements. Command palette search has `aria-label="Perintah"`.
- Loading, error and empty states exist on every list and detail page checked. Route-level Suspense and an error boundary are in place (D10).
- Static stack: Vite 8 SPA, React 19, Tailwind 4, Zod 4, TypeScript 6 are recorded deviations from `tech-stack-frontend.md` in ADR-001 (Approved). NextAuth is replaced by first-party login under ADR-004 (Approved). The DM-02 security review of ADR-004 is a non-blocking follow-up.
- Dependencies added by TODO-001 are pinned exactly (ADR-007 v1.2). Removed packages (recharts, dnd-kit, react-table, geist) are gone from `package.json`.
- Tests: 884 tests pass. Auth, client, refresh, gates, invalidation and static rules are covered. Each TODO has a Unit Test Report with `execution_overall: PASS`.

## Recommendations

1. project-manager: close H-1 (add FP row for `login-shell.tsx`) and M-3 (correct FP-134 path). Annotate L-12 deletions. Re-run the register check before /validate.
2. developer_frontend: fix M-1 flow (no plain resubmit after a transport failure on create). Fix L-4 with a ref guard. Align L-3 logging. Add the L-5 test cases. Move L-9 helpers and fix the L-8 scan. Decide L-1 and L-2 with the copy and architecture owners.
3. security_architect and operations: close M-2 (CSP and frame headers at the static host) before production. Confirm L-13 idle policy.
4. Platform (external): close M-4 (SP-BG-13, backend guards for self-protection and SYS_PRINCIPAL) and SP-BG-11 (idempotency key on tenant create) before production.
5. Re-run /validate after items 1 and 2. No code change is required for approval beyond items 1 and 2.

## Approval Status

Approved: No

Reason: H-1 (provenance gate) is open. The /validate gate cannot pass until the register is complete. No Critical findings are open. Approval is recommended after H-1 and M-3 are closed. Medium and Low items do not block approval on their own; M-2 and M-4 must be closed before production.

This report is Draft. The reviewer does not self-approve.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| CR-OQ-1 | Should forgot-password show an error (not the neutral message) on NETWORK or TIMEOUT? (L-1) | Client-side failures are not account lookups | UX and honesty of the message | architect_frontend | No | Open | Documented default: neutral message for every non-validation outcome (D4.7 as written) |
| CR-OQ-2 | Is the English copy "Current password is incorrect." accepted under FE-OQ-22? (L-2) | UI language is Indonesian (C-09) | Copy consistency | architect_frontend | No | Open | Documented default: copy kept as quoted from the FE doc |
| CR-OQ-3 | Is a refresh re-check inside the lock possible with auth-service rotation rules? (L-6) | Avoids one extra rotation per waiting tab | Efficiency and rotation hygiene | architect_backend (auth-service) | No | Open | Documented default: extra refresh accepted (safe) |
| CR-OQ-4 | CSP and frame policy at the static host (M-2; FE-OQ-20) | Release gate | Production readiness | security_architect, operations | No (release gate) | Open | Default: D15 proposal |
| CR-OQ-5 | Idle timeout policy (L-13; FE-OQ-21) | Session expiry expectations | Security posture | security_architect | No | Open | Default: no idle logout in v1 |
| CR-OQ-6 | Backend guards for self-protection and SYS_PRINCIPAL (M-4; SP-BG-13) | UI-only protections | Lockout risk via direct API call | platform (auth-service), security_architect | No (external, production gate) | Open | None in the repository |
| CR-OQ-7 | Idempotency key for tenant create (M-1; SP-BG-11) | Resubmit after transport failure | Duplicate-create risk and misleading 409 | platform (master-data), developer_frontend | No (external) | Open | Documented default: no automatic retry; code uniqueness is the guard |
