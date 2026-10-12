---
id: QA-REPORT-VALIDATE-TODO-001-017
title: QA Report — SP Web Frontend TODO-001 to TODO-017
owner: qa
status: Draft
version: 1.2
last_updated: 2026-10-12 10:39
source_requirements: [REQ-FE-001 to REQ-FE-051 per TODO trace (REQ-FE-027 deferred, REQ-FE-044 external: CSP at deployment)]
related_artifacts: [TODO-001..TODO-017, TODO-019, ARCH-FE-001, ADR-001..ADR-007, CODE-REVIEW-VALIDATE-TODO-001-017, UNIT-TEST-REPORT-TODO-001..017, UNIT-TEST-REPORT-TODO-019, FILE-PROVENANCE-REGISTER, FE-REQUIREMENT-SYSTEM-PRINCIPAL-WEB-V1.0]
blocking_open_questions: 1
---

Title: QA Report — SP Web Frontend TODO-001 to TODO-017
Owner: qa
Status: Draft
Version: 1.2
Last Updated: 2026-10-12 10:39
Source Requirements: REQ-FE-001 to REQ-FE-051 per TODO trace (REQ-FE-027 deferred, REQ-FE-044 external: CSP at deployment)
Related Artifacts:
- output/plans/master-todo.md (TODO-001 to TODO-017, Completed; TODO-018 out of scope; TODO-019 Completed)
- output/plans/progress-tracker.md (v1.3)
- output/plans/file-provenance-register.md (229 rows)
- output/reports/code-review-report-validate.md (Draft; Approved: No)
- output/reports/unit-test-report-TODO-001.md to unit-test-report-TODO-017.md
- output/reports/unit-test-report-TODO-019.md (TODO-019 fix: nullable `updated_by`)
- output/architecture/ARCH-FE-001.md (v1.0)
- output/decisions/ADR-001 to ADR-007
- [FE Requirement] system-principal-web v1.0.md (repository root; sections 12 and 13)

## At a Glance

- QA verification of the delivered frontend delta, TODO-001 to TODO-017. TODO-018 is out of scope. TODO-019 is included as the D-1 fix.
- Status: Draft. QA does not self-approve.
- Live evidence: one login with the QA principal account succeeded. The FE doc 13 smoke test passed. Session, refresh, cookie, logout, and cross-tab checks passed. The catalog re-check (C-10) now passes.
- D-1 (countries and tenant-categories list responses failed the front-end contract on the live stack) is **CLOSED**. Re-check at 10:39: no `[contract]` console line on `/tenant-categories`, `/countries`, or the tenant create wizard. Both lists rendered; every list and reference call returned 200.
- Results: Passed 22, Failed 0, Partial 12, Blocked 3.
- Defects: Critical 0. High 0 open (D-1 closed). Medium 3 open (carried from review). Low 13 open (carried from review).
- Release recommendation: **Conditional Go for dev and staging**. The issue of this Go is held until the reviewer records `Approved: Yes` (QA-OQ-3). **Production: No-Go** until M-2 (headers), M-4 and SP-BG-13 (backend guards), and SP-BG-11 (tenant create idempotency) are closed or formally accepted.

## Purpose

Verify that the delivered behaviour of TODO-001 to TODO-017 satisfies the FE requirement document, ARCH-FE-001, ADR-001 to ADR-007, and the applicable standards (`standards-frontend.md`, `tech-stack-frontend.md`, `tech-stack-integration.md`, `tech-stack-security.md`, `coding-standards.md`, `architecture-principles.md`). Execute the FE doc 13 smoke test in the running app. Record results, defects, risk, and a release recommendation.

## Scope

### Scope Tested

- Paths of TODO-001 to TODO-017 resolved against `file-provenance-register.md` (229 rows, all `Enforcement: full`; most specific row wins). Greenfield, enforced (`project-profile.md`). TODO-019 changes (`src/types/country.ts`, `src/types/tenant-category.ts`) are verified by the live re-check; TODO-019 register rows are not re-audited here.
- Register check: FP-227 (`src/features/auth/components/login-shell.tsx`), FP-228 and FP-229 (`src/assets/login/`) are present. FP-134 points to `src/features/tenants/permissions/tenant-detail-permissions-route.test.tsx` (path corrected at /validate). Code review H-1 and M-3 are closed in the register.
- Live environment: Vite dev server on `http://localhost:3000`. Gateway on `127.0.0.1:8080`, reached through the dev proxy (browser) and directly with `Host: system.gaia.localhost` (smoke test).
- Out of scope: TODO-018 (Playwright E2E, deferred), platform repositories, backend correctness, production hosting.

### Preconditions Check

| Precondition | Result |
|--------------|--------|
| Implementation Completed in `progress-tracker.md` | Met (TODO-001 to TODO-017 Completed; TODO-019 Completed per coordinator) |
| Code Review Report `Approved: Yes`, no unresolved Critical | **Not met on the record.** The review is `Status: Draft`, `Approved: No`. H-1 and M-3 are closed in the register (verified), but the reviewer has not re-issued the approval. See QA-OQ-3. |
| TODO traceable to requirement, architecture, ADR | Met for all 18 TODOs (Related Requirement, Related ADR, Related Architecture present) |
| Architecture and ADRs approved | Met per `progress-tracker.md` and `project-profile.md` (user approvals 2026-10-10) |
| No blocking Pending Clarification | Met (`progress-tracker.md`: blocking open questions 0) |

The reviewer approval is still an open precondition. This report stays Draft until the reviewer records `Approved: Yes`.

### Method and Environment

Commands run by QA in this cycle (read-only against the repository; no production file, register, or orchestration state was changed):

- `npx vitest run` (full suite), `npx eslint src`, `npx tsc --noEmit -p tsconfig.app.json`, `npx vite build --outDir <scratchpad>/dist-qa` (all exit 0; build output in the session scratchpad, not the repository `dist/`).
- Browser checks with `playwright-core` 1.64 in the session scratchpad (outside the repository), driving the installed Google Chrome headless against `http://localhost:3000`.
- Smoke test calls to `127.0.0.1:8080` with `Host: system.gaia.localhost` and the bearer token held in memory only.

Credential use (disclosed):

- Attempt 1 (dev account documented in `auth-service.postman_collection.json`, repository root, one form login): `INVALID_CREDENTIALS`, HTTP 401. Not repeated.
- Attempt 2 (mistaken, non-existent address `nobody@example.invalid`, while checking request headers): `INVALID_CREDENTIALS`, HTTP 401.
- Attempt 3 (the QA principal account from the git-ignored `.env.qa.local`, read in code, one form login, as instructed by the coordinator): HTTP 200. This was the single login for the first live session. The credential values are not recorded in this report.
- Attempt 4 (re-check at 10:39, same QA principal account from `.env.qa.local`, one form login, as instructed by the coordinator): HTTP 200. This was the single login for the re-check session. The session was not logged out (the browser closed); the server-side session remains until its normal expiry.
- Logout in the first session ended that session. C-12 own account, C-17 confirm dialog and C-18 correlation id therefore remain Blocked; they need one more login, which was not authorised (QA-OQ-7).

## Test Results

Summary: **Passed 22, Failed 0, Partial 12, Blocked 3.** The 884 unit and component tests are counted as one check (A-1).

### A. Automated gates (executed by QA)

| ID | Check | Result |
|----|-------|--------|
| A-1 | Unit, component, and static-rule tests (`npx vitest run`) | Passed: 884 of 884, 70 files, 0 failed (before TODO-019; the TODO-019 report records 886 tests / 70 files, which QA did not re-run) |
| A-2 | Lint (`npx eslint src`) | Passed: exit 0, no output |
| A-3 | Typecheck (`npx tsc --noEmit -p tsconfig.app.json`) | Passed: exit 0, no output |
| A-4 | Production build (`vite build`, to scratchpad) | Passed: exit 0; main chunk 252.45 kB raw / 79.09 kB gzip |

### B. Browser checks before login (executed by QA)

| ID | Check | Observed | Result |
|----|-------|----------|--------|
| B-1 | Unauthenticated guard, 14 protected routes | All 14 redirect to `/login` | Passed |
| B-2 | Removed and unknown paths (`/beranda`, `/registry`, `/sistem-audit`, `/sistem-sesi`, `/tim-akun`, `/katalog-permission`, `/no-such-page`) | 404 screen on all 7 (REQ-FE-041, D10) | Passed |
| B-3 | Login page labels and copy | As expected | Passed |
| B-4 | Empty login submit | "Login ID wajib diisi." and "Password wajib diisi."; no login POST | Passed |
| B-5 | Invalid credentials (error path) | `INVALID_CREDENTIALS`; "Login ID atau password salah" | Passed |
| B-6 | Forgot-password page render | Rendered; not submitted (would send e-mail) | Passed (render only) |
| B-7 | Reset-password without token | "Link tidak valid atau kedaluwarsa"; 0 API calls | Passed |
| B-8 | Phone width 390 px, login | Horizontal overflow 0 px | Passed |
| B-9 | Network routing (acceptance item 1) | Browser contacted only `localhost:3000`; API calls relative through the proxy, which rewrites Host to `system.gaia.localhost` | Passed |
| B-10 | Forbidden identity headers (acceptance item 2) | None on unauthenticated calls | Passed (authenticated requests were not header-inspected) |
| B-11 | Storage and cookies, unauthenticated | No tokens in local or session storage; no cookies | Passed |
| B-12 | Logged-out bootstrap | One refresh, 401 handled, login shown | Passed |

### C. Live authenticated checks (QA principal account)

| ID | Item (FE doc 12 acceptance / TODO / ARCH reference) | Observed evidence | Result |
|----|-----------------------------------------------------|-------------------|--------|
| C-1 | FE doc 13 smoke test: `GET /api/v1/auth/me` returns `permissions`; `GET /api/v1/tenants?page=1&limit=5` returns `pagination` (HTTP 200) | `me` 200, `data.permissions` present; tenants 200, pagination keys `page, limit, total, total_pages`. Direct gateway call with Host header | Passed |
| C-2 | Login success; token in memory; reload keeps session via refresh (acceptance 3; D4) | Login 200. Reload: `POST /api/v1/auth/refresh` 200, stays on `/`. Refresh cookie `gaia_rt_sys`: HttpOnly, Secure, SameSite=Strict, Path=/api/v1/auth/refresh. Local and session storage empty | Passed |
| C-3 | `pwdChangeRequired = true` blocks the app (acceptance 4; REQ-FE-012) | App reached the dashboard with no redirect to the password page, so the flag is false for this account. The blocking behaviour itself was not exercised | Partial |
| C-4 | Dashboard and sidebar badges (TODO-016) | Dashboard and sidebar render; tenant count 15 shown in the first session. Counts for "Kategori tenant" and "Negara" were not visible in the first session and were not re-checked on the dashboard (D-1 closed; the sidebar badge fetches now return 200) | Partial |
| C-5 | Menu gating by `me.permissions`; 403 for a user without permission (acceptance 5; D6) | SYS_PRINCIPAL sees all master-data items. No restricted account was available, so gating for a lesser role is unproven | Partial |
| C-6 | Tenant list, server pagination (TODO-009; acceptance 7) | `GET /api/v1/tenants?page=1&limit=20` 200 | Passed |
| C-7 | Tenant create wizard (TODO-010; acceptance 9) | `/tenants/new` opened. The wizard's reference loads (`countries` and `tenant-categories`, `page=1&limit=100`) returned 200 with no `[contract]` line (re-check 10:39). No submit (a write). Form content and the dropdown population were not confirmed | Partial |
| C-8 | Tenant detail (TODO-010; acceptance 8, 10) | `GET /api/v1/tenants/{id}` 200. PATCH and immutable-field behaviour not exercised (writes) | Partial |
| C-9 | Tenant Permissions tab (TODO-011) | Route loaded. No permissions request seen (the tab may load on click). Not verified | Partial |
| C-10 | Catalog: tenant categories and countries (TODO-012; acceptance 6, 7) | Re-check at 10:39 after TODO-019. `/tenant-categories`: list `GET /api/v1/tenant-categories?page=1&limit=20` 200, 6 table rows, no `[contract]` line. `/countries`: list `GET /api/v1/countries?page=1&limit=20` 200, 2 table rows, no `[contract]` line. No role=alert shown on either page. Details in D-1 (closed) | **Passed** |
| C-11 | Catalog: master permissions (TODO-013) | `GET /api/v1/master-permissions` 200 (first session). Screen content not confirmed | Partial |
| C-12 | Team: system users list (TODO-014) | `GET /api/v1/system-users` 200 (first session). Own-account detail and button visibility not run (session ended; QA-OQ-7) | Partial |
| C-13 | Team: system roles and checklist (TODO-015; SP-BG-13 backend check) | Page loaded. Roles API call not captured. Not verified | Partial |
| C-14 | Own sessions (`/account/sessions`) (TODO-014) | `GET /api/v1/sessions` 200 (first session). Force logout not clicked (a write) | Partial |
| C-15 | Logout clears memory and cached queries (acceptance 13) | `POST /api/v1/auth/logout` 200; redirect to `/login`; refresh cookie removed; storage empty | Passed |
| C-16 | Session expiry (acceptance 3; D4) | Revoked-token check: re-injected the pre-logout refresh cookie, reload gave `POST /api/v1/auth/refresh` 401 `SESSION_TERMINATED`, then `/login`. Natural access-token expiry not testable here | Partial |
| C-17 | Confirm dialogs (acceptance 12) | Not run: session ended before the own-account page was reached (QA-OQ-7) | Blocked |
| C-18 | Error display with `X-Correlation-ID` in the UI (acceptance 11) | Not confirmed (QA-OQ-7) | Blocked |
| C-19 | Cross-tab logout (TODO-005) | Logout in tab 1; tab 2 went to `/login` | Passed |
| C-20 | Change-password flow (TODO-008) | Not run by design: it would change the QA account password (needs approval, QA-OQ-6) | Blocked |
| C-21 | Keyboard focus order (acceptance: WCAG 2.1 AA considerations) | Tab order follows the sidebar and nav items. Focus shown by a box-shadow ring (`outline: none`). Full keyboard pass not done | Partial |

Totals for section C: Passed 6 (C-1, C-2, C-6, C-10, C-15, C-19); Partial 12 (C-3, C-4, C-5, C-7, C-8, C-9, C-11, C-12, C-13, C-14, C-16, C-21); Failed 0; Blocked 3 (C-17, C-18, C-20).

Items that still need the platform or a backend fault: C-8 (503 revert on PATCH), C-12 and C-13 (backend self-protection and SYS_PRINCIPAL guards, SP-BG-13), C-7 and the tenant-create path (tenant-create idempotency, SP-BG-11, and writes), C-16 (natural expiry, gateway). The CSP and frame headers (M-2) are a deployment item.

### C-10 re-check detail (10:39, after TODO-019)

Single login (HTTP 200). Each page was loaded fresh; console `[contract]` lines and API calls were recorded per page. Values were not recorded.

| Page | Page result | `[contract]` console lines | API calls on the page | Reference and list calls (status) | Table rows | role=alert |
|------|-------------|---------------------------|-----------------------|-----------------------------------|------------|-----------|
| `/tenant-categories` | Loaded at `/tenant-categories` | 0 | 6 | `tenant-categories?limit=1` 200; `countries?limit=1` 200; `tenant-categories?page=1&limit=20` 200 | 6 | 0 |
| `/countries` | Loaded at `/countries` | 0 | 6 | `countries?limit=1` 200; `tenant-categories?limit=1` 200; `countries?page=1&limit=20` 200 | 2 | 0 |
| `/tenants/new` (wizard reference loads) | Loaded at `/tenants/new`; no submit | 0 | 7 | `tenant-categories?limit=1` 200; `countries?limit=1` 200; `tenant-categories?page=1&limit=100` 200; `countries?page=1&limit=100` 200 | n/a (form) | 0 |

Other checks on this run:

- Console errors other than `[contract]` on any of the three pages: 0.
- Request count: 6, 6 and 7 calls per page; 27 `/api/` calls in the session in total. Each page load repeats the same bootstrap pattern (refresh, `me`, the sidebar `limit=1` counts for tenants, countries and tenant categories), then the page's own list call. No unexpected increase and no repeated list calls were seen.
- Not checked on this run: the wizard's country dropdown content, the detail pages, and the dashboard count badges for these two modules.

## Defects

### Critical

None.

### High

- **D-1 — CLOSED (verified 2026-10-12 10:39): countries and tenant-categories list responses failed the front-end contract on the live stack.**
  - Original observation (first session, 10:2x): the browser console logged `[contract] {module: countries.list, keys: Array(1)}` and `[contract] {module: tenantCategories.list, keys: Array(1)}`. Each line means the response body failed the Zod schema (`parseMasterBody` in `src/lib/api/modules/tenants.ts`, lines 51 to 62), and the front end threw a CONTRACT error. HTTP status was 200 on the same calls. The failing key path was not recorded (the log showed only a count), and the body was not read (values are not logged, D13).
  - Fix recorded: TODO-019, which makes `updated_by` nullable in `src/types/country.ts` (`CountryWireSchema`, line 18) and `src/types/tenant-category.ts` (`TenantCategoryWireSchema`, line 18). The coordinator reports TODO-019 Completed with Unit Test Report PASS (70 files, 886 tests). QA confirmed the change is present in the tree.
  - Closure evidence (live, 10:39): zero `[contract]` lines on `/tenant-categories`, `/countries` and the `/tenants/new` wizard; both lists render (6 and 2 rows); every list and reference call returned 200; no role=alert. See the C-10 re-check detail above.
  - Limits of the closure: QA did not confirm which field failed before the fix (the nullable `updated_by` is the coordinator's stated cause). Closure rests on the symptom being gone with live data present on 2026-10-12. Re-test if the local data changes, and keep the `[contract]` check on the regression list.
  - Effect on the recommendation: no longer blocks a Go.

### Medium

- M-1 (open, carried; not reproduced live): tenant create resubmit after NETWORK or TIMEOUT shows a misleading 409 ("code taken") while the tenant exists. Location: `src/features/tenants/create/tenant-create-page.tsx` (catch branch) and `src/lib/api/modules/tenants.ts` (`createTenant`). Not reproduced (a write is needed; QA-OQ-6). Effect: not a security boundary; code uniqueness guards against a duplicate. Non-blocking for a dev or staging verdict; fix before production with SP-BG-11.
- M-2 (open, release gate): production security headers (CSP, frame policy, referrer policy) are not defined. The dev server response for `/` has none of them. `index.html` and `vite.config.ts` define none. FE-OQ-20 is open. Effect: blocks production release; does not block a dev or staging verdict.
- M-4 (open, external): self-protection and the SYS_PRINCIPAL lock are UI-only (SP-BG-13). Not reproduced live (C-12, C-13 need the own-account and backend checks). QA agrees with the reviewer's Medium rating for the frontend delta. It is a production gate owned by the platform and security_architect. Effect: privilege and lockout risk if the backend stays unguarded.

### Low (open, carried from the Code Review Report; not re-verified by QA)

| ID | Summary | Location |
|----|---------|----------|
| L-1 | Forgot-password shows the neutral message on NETWORK and TIMEOUT (CR-OQ-1) | `forgot-password-page.tsx`, `auth-messages.ts` |
| L-2 | English copy "Current password is incorrect." in an Indonesian UI (CR-OQ-2, FE-OQ-22) | `auth-messages.ts:21` |
| L-3 | Error logging gated differently in `notify.ts` and `client.ts` | `src/lib/notify.ts:34`, `src/lib/api/client.ts:301` |
| L-4 | Retry guard uses state, not a ref (double activation possible) | `tenant-create-page.tsx` (`CreatedPanel.retry`) |
| L-5 | Test gaps: exempt-path spelling variants, `//` paths, cross-tab lock re-check | `client.test.ts`, `refresh.test.ts` |
| L-6 | Waiting tab refreshes again after the lock is released (safe, one extra rotation) | `src/lib/api/refresh.ts` |
| L-7 | `use-mobile.ts` reads two signals (matchMedia and innerWidth) | `src/hooks/use-mobile.ts` |
| L-8 | Static scan can miss a forbidden name after `//` inside a string literal | `src/test/static-rules.test.ts:34` |
| L-9 | Test helpers sit in production feature folders | `src/features/auth/test-helpers.ts`, `src/features/team/*/test-support.tsx` |
| L-10 | Cross-feature type import (`WriteFailure`) | `src/features/team/users/use-user-actions.ts:15` |
| L-11 | `.vitest/` not in `.gitignore` | repository root |
| L-12 | Register rows for deleted paths (FP-220 to FP-225) not annotated | register |
| L-13 | No idle timeout policy (FE-OQ-21) | security decision |

### QA observations (not defects)

- O-1: on every logged-out page load the dev console logs a browser 401 and `[api] ... INVALID_TOKEN, route: auth.refresh`. This is the expected bootstrap refresh with no cookie. Development logging only (relates to L-3).
- O-2: the revoked-session refresh returns `SESSION_TERMINATED` (401). The front end handles it by returning to `/login`. Behaviour correct.
- O-3: the dev server sends no CSP or frame headers (see M-2). Expected for the dev server.
- O-4: the dashboard count for "Kategori tenant" and "Negara" was not visible in the first session and was not re-checked on the dashboard; the list endpoints now return 200 with no contract error.

## Risk Assessment

- Well verified live: login with the principal account; the FE doc 13 smoke test (`me` with permissions, tenants with pagination); token refresh on reload; the refresh cookie attributes (HttpOnly, Secure, SameSite=Strict, scoped path); logout and cross-tab logout; revoked-session handling; no tokens in browser storage; the catalog lists and wizard reference loads (C-10, after TODO-019).
- Well verified before login: static and unit gates (884 tests, lint, typecheck, build); route guards; removed surfaces; login validation and error path; forbidden identity headers absent; traffic through the proxy; phone-width layout.
- Highest residual risk now: permission gating for lesser roles (C-5, one account only) and the write paths (tenant create and PATCH, catalog writes, user create, force logout, change password), none run live. Unit tests run against MSW handlers, so server filtering and real payload shapes are not fully proven (OQ-P-52). The `[contract]` check should stay on the regression list, because the D-1 failure was a payload shape mismatch that only the live stack showed.
- Production gates open: M-2 (headers at the static host), M-4 and SP-BG-13 (backend guards), SP-BG-11 (tenant create idempotency; mitigates M-1).
- Accepted limitations (documented): no coverage tool, so the 80 percent guideline is not measured (OQ2, UT-014-1); no bundle budget (OQ-P-62); `npm run typecheck` checks nothing, and `tsc -b` inside build is the real check (OQ-P-61); TODO-018 E2E deferred.
- Overall residual risk: **Medium** for a dev or staging verdict; **High** for production until M-2, M-4 and SP-BG-11 are closed or formally accepted.

## Release Recommendation

**Conditional Go for dev and staging. Production: No-Go.**

Basis:

1. No Critical or High defect is open. D-1 is closed with live evidence (C-10 re-check, 10:39).
2. The core session lifecycle (login, refresh, cookie scope, logout, cross-tab, revoked session), the smoke test, the tenant list and detail reads, and the catalog lists and wizard reference loads all work on the live stack.
3. The issue of this Go is held by the unmet precondition: the reviewer approval is not on record (`Approved: No`; QA-OQ-3). Until the reviewer records `Approved: Yes`, this report remains a Draft recommendation.
4. Production gates are open: M-2 (headers) and M-4 (SP-BG-13). M-1 depends on SP-BG-11.

Conditions for the dev and staging Go:

- (a) The reviewer records `Approved: Yes` (QA-OQ-3).
- (b) The user accepts the residual risk of the Partial and Blocked items, or authorises the runs that close them: C-5 with a lesser-privilege account (QA-OQ-8), the writes (QA-OQ-6), and C-12 own account, C-17 confirm dialog, and C-18 correlation id (QA-OQ-7).

Conditions for production (in addition to the above):

- M-2 closed at the static host (CSP, frame policy, referrer policy).
- M-4 and SP-BG-11 closed by the platform, or formally accepted by security_architect.

This is QA's assessment. It is not approval of the architecture, ADRs, or the final release decision, which belong to their owners and the user.

## Traceability

- TODO: TODO-001 to TODO-017 (all `Completed`); TODO-019 (Completed, the D-1 fix). TODO-018 out of scope.
- Requirement: REQ-FE-001 to REQ-FE-051 per TODO trace (REQ-FE-027 deferred, REQ-FE-044 external).
- Architecture: ARCH-FE-001 v1.0 (D1 to D19, Table 2, Table 4, Table 5).
- ADR: ADR-001 to ADR-007.
- Code Review Report: `code-review-report-validate.md` (Draft, Approved: No).
- Unit Test Reports: `unit-test-report-TODO-001.md` to `unit-test-report-TODO-017.md`; `unit-test-report-TODO-019.md`.
- Register: `file-provenance-register.md` (229 rows; FP-227 to FP-229 verified present).

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| QA-OQ-1 | Valid principal account for the live smoke test | Required for C-1 to C-21 | Live checks run | user | No | Answered 2026-10-12 | QA principal account from `.env.qa.local`; logins succeeded (first session and re-check); no value recorded in this report |
| QA-OQ-2 | Did the earlier failed attempts lock the dev account? | Operational | None observed | user | No | Answered | The QA account logged in with 200 after the earlier attempts; no lock signal seen |
| QA-OQ-3 | The reviewer to re-issue the Code Review approval (`Approved: Yes`) now that H-1 and M-3 are closed | QA precondition for issuing the Go | Go issue held; this report stays Draft | reviewer (code_reviewer) | Yes | Open | Default: this report stays Draft |
| QA-OQ-4 | Is a conditional Go for dev or staging acceptable now that D-1 is closed, before M-2 and M-4? | Sets the release scope | Release decision | user | No | Open | Default: conditional Go for dev and staging (see Release Recommendation); production No-Go |
| QA-OQ-5 | Severity of M-4 for production (reviewer: Medium; QA concurs for the frontend delta) | Production gate ownership | Production risk | security_architect | No | Open | Default: production gate, owned by platform |
| QA-OQ-6 | Approve writes on the local stack (tenant create and PATCH, catalog writes, user create, force logout, change password)? | C-7, C-8, C-10 writes, C-12 to C-14, C-17, C-20 | Test data on the local stack | user | No | Open | Default: no writes performed |
| QA-OQ-7 | Authorise one more login with the same QA account, to complete C-12 (own account), C-17 (confirm dialog) and C-18 (correlation id), which the first session's logout ended | Completes three Blocked items | Three checks remain Blocked | user | No | Open | Default: no further login |
| QA-OQ-8 | Provide a second, lesser-privilege account (not SYS_PRINCIPAL) | C-5 gating and the 403 route check need it | Gating unproven for other roles | user | No | Open | Default: C-5 stays Partial |
