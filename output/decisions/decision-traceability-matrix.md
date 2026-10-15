---
id: DECISION-TRACEABILITY-MATRIX
title: Decision Traceability Matrix
owner: decision_manager
status: Approved
version: 1.3
last_updated: 2026-10-14
related_artifacts: [ARCH-FE-001, TODO-022, TODO-023, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, OPEN-DECISIONS, DECISION-INDEX]
blocking_open_questions: 0
---

Title: Decision Traceability Matrix

Owner: decision_manager

Status: Approved

Approved: v1.3, 2026-10-14 (user, Checkpoint B gate for TODO-023). Previously approved: v1.2, 2026-10-14 (user, Checkpoint B gate for TODO-022). Earlier: v1.1, 2026-10-10 (user, Checkpoint B gate).

Version: 1.3

Last Updated: 2026-10-14

Change: 2026-10-14 v1.3 — Approved by the user at the Checkpoint B gate for TODO-023 (2026-10-14); DM-15 confirmed (ARCH-FE-001 v1.0.6 needs no ADR). Version stays 1.3; no content change.

Change: 2026-10-14 v1.3 — Text correction by user order 2026-10-14: REQ-FE-035 row text changed to "Master permissions: list, detail, edit name/description (read-only otherwise, ARCH-FE-001 v1.0.4)". ADR column unchanged (no ADR); counts unchanged; no new version.

Change: 2026-10-14 v1.3 — TODO-023 / ARCH-FE-001 v1.0.6 assessed at /decision: no net-new ADR (see decision-index.md, section ADR Assessment for ARCH-FE-001 v1.0.6). Content changed, so status is Pending Approval until the user approves the Checkpoint B gate for TODO-023. Next ADR number stays ADR-008.

Change: 2026-10-14 v1.2 — TODO-022 / ARCH-FE-001 v1.0.5 assessed at /decision: no net-new ADR (see decision-index.md, section ADR Assessment for ARCH-FE-001 v1.0.5). Next ADR number stays ADR-008.

Change: 2026-10-14 v1.2 — Approved by the user at the Checkpoint B gate for TODO-022 (2026-10-14); DM-14 confirmed (ARCH-FE-001 v1.0.5 needs no ADR). Version stays 1.2; no content change.

Source Requirements: RAG-FE-SP-001 ("[FE Requirement] system-principal-web v1.0"); REQ-FE-001 to REQ-FE-054 (assigned in ARCH-FE-001; REQ-FE-052 and REQ-FE-053 added in v1.0.5; REQ-FE-054 added in v1.0.6)

Related Artifacts: ARCH-FE-001 v1.0, v1.0.5 and v1.0.6; TODO-022; TODO-023; ADR-001 to ADR-007; `output/decisions/open-decisions.md`; `output/decisions/decision-index.md`

## At a Glance

- Maps each REQ-FE to the ARCH-FE-001 section that designs it and to the ADR that governs its decision, where one exists.
- All 54 REQ-FE rows are mapped. 27 rows have an ADR. The other 27 have no ADR candidate and are designed in ARCH-FE-001 only, with the reason stated in each row.
- Platform references are listed with what decision-manager read. Gateway and auth-service artifacts were cited, not read.

## Purpose

Show how the requirements, the architecture and the decisions link, so that a reviewer can check any requirement back to its design and its governing decision.

## Scope

This repository only. Platform artifacts are cited and are not changed. Test, plan and TODO links are recorded where they exist; none exists yet, so the impacted work is named by area.

## References

- ARCH-FE-001 v1.0: Requirements Addressed table (REQ-FE-001 to REQ-FE-054) and the D sections named in each row.
- ADR-001 to ADR-007 (`output/decisions/`).
- `output/decisions/open-decisions.md` (open items per ADR).

## Open Questions

None. Blocking open questions: 0. Open items per row are in `open-decisions.md`.

## 1. REQ-FE to ARCH-FE-001 section to ADR

Basis column: the ARCH-FE-001 text that names the ADR for this section or row, or the section header that lists the REQ-FE ID. "—" means no ADR candidate covers the row.

| REQ-FE | Requirement (short) | ARCH-FE-001 section | ADR | Basis |
|--------|---------------------|---------------------|-----|-------|
| REQ-FE-001 | Browser calls only the gateway base URL | D1 | ADR-006 | D1.2 names ADR-FE-06 |
| REQ-FE-002 | Dev server on port 3000; `/api` proxy with Host rewrite | D1.1 | ADR-006 | D1.1 gives the same reasoning as the production topology |
| REQ-FE-003 | Base URL from an environment variable; HTTPS in staging and production | D1.2 | ADR-006 | D1.2 names ADR-FE-06 |
| REQ-FE-004 | Only the documented request headers are sent | D3 | ADR-002 | D3 header lists REQ-FE-004 |
| REQ-FE-005 | Access token held in memory only | D4.1, D4.11 | ADR-004 | D4 header lists REQ-FE-005; SD-10 cites D4 |
| REQ-FE-006 | `credentials: 'include'`; FE never reads the refresh cookie | D4.3 | ADR-004, ADR-006 | D4 header; same-origin cookie (D1.2) |
| REQ-FE-007 | Two JSON conventions mapped in the API layer | D5 | — | Mapper design (A-06); no ADR candidate |
| REQ-FE-008 | Error handling branches on status and `code` | D13 | ADR-002 | D3 header lists REQ-FE-008 |
| REQ-FE-009 | Login with the error mapping of FE doc 3.3 | D4.5 | ADR-004 | D4 header lists REQ-FE-009 |
| REQ-FE-010 | Single-flight refresh; retry once; second 401 logs out | D4.3, D4.4 | ADR-004 | D4 header lists REQ-FE-010 |
| REQ-FE-011 | App start and reload call refresh, then `me` | D4.2 | ADR-004 | D4 header lists REQ-FE-011 |
| REQ-FE-012 | `pwdChangeRequired` blocks every route except change password | D4.6, D10 | ADR-004 | D4 header lists REQ-FE-012 |
| REQ-FE-013 | Change password supports both `keepCurrentSession` outcomes | D4.6 | ADR-004 | D4 header lists REQ-FE-013 |
| REQ-FE-014 | Forgot password shows the same neutral message | D4.7 | ADR-004 | D4 header lists REQ-FE-014 |
| REQ-FE-015 | Reset password reads the token; invalid or expired tokens handled | D4.7 | ADR-004 | D4 header lists REQ-FE-015 |
| REQ-FE-016 | Logout clears token and cached data, then goes to login | D4.8, D12.2 | ADR-004, ADR-003 | D4 header lists REQ-FE-016; D12.2 clears the cache |
| REQ-FE-017 | My sessions: list; revoke one (not current); revoke all others | D4.9 | ADR-004 | D4 header lists REQ-FE-017 |
| REQ-FE-018 | Auth-service menus, routes and actions gated by `me.permissions` | D6 | — | Gate strategies (D18 Strategy pattern); no ADR candidate |
| REQ-FE-019 | Master-data screens visible only to SYS_PRINCIPAL (interim) | D6.2 | — | SP-DEC-01 (clarifications); gate constant; no ADR candidate |
| REQ-FE-020 | Tenant list: server pagination and documented filters | D8.1 | — | Screen design; no ADR candidate |
| REQ-FE-021 | Tenant create: fields, rules and the three `admin_account` outcomes | D8.2 | — | Screen design; no ADR candidate |
| REQ-FE-022 | Tenant detail: immutable fields read-only; PATCH sends allowed fields | D8.2 | — | Screen design; no ADR candidate |
| REQ-FE-023 | `is_active` toggle reverts on 503; no optimistic update | D8.2, D12.3 | ADR-003 | D12.3 excludes auth-replicated writes from optimistic updates |
| REQ-FE-024 | Admin-account retry offered and safe to repeat | D8.2 | — | Screen design; no ADR candidate |
| REQ-FE-025 | No tenant delete control; deactivate with PATCH `is_active=false` | D8.2 | — | Screen design; no ADR candidate |
| REQ-FE-026 | Tenant Permissions tab: list, PUT, PATCH | D7 | — | Screen design; no ADR candidate |
| REQ-FE-027 | Registration settings not routed in v1 | D7 | — | Scope (FE doc 5.5); no ADR candidate |
| REQ-FE-028 | Tenant categories: list, create, edit, delete; `code` immutable | D7 | — | Screen design; no ADR candidate |
| REQ-FE-029 | Countries: list, create, edit, delete; `code` key; input uppercased | D7, D9 | ADR-003 | D9 header lists REQ-FE-029 (forms) |
| REQ-FE-030 | System users: list, detail, create, role change, status change, reset password. No delete (REQ-FE-054; v1.0.6). TODO-023 | D7, D6.4 | — | Screen design; no ADR candidate. v1.0.6 removal assessed 2026-10-14: no ADR (decision-index.md, ADR Assessment for v1.0.6) |
| REQ-FE-031 | Role options from system roles; no own-account suspend or deactivate (delete is not offered to any account, REQ-FE-054; v1.0.6). TODO-023 | D6.6 | — | Gate design; no ADR candidate. v1.0.6 wording assessed 2026-10-14: no ADR |
| REQ-FE-032 | Another user's sessions: view and force logout, behind `OTHER_ACCOUNT_SESSIONS_ENABLED` (false until SP-BG-14 Closed; v1.0.5). TODO-022 | D4.10 | — | Screen design; no ADR candidate. v1.0.5 flag assessed 2026-10-14: no ADR (decision-index.md, ADR Assessment) |
| REQ-FE-033 | System roles: list, create, edit, delete; refused protected role disables actions | D6.6 | — | Gate design; no ADR candidate |
| REQ-FE-034 | Role permission checklist saved with one PUT | D7 | — | Screen design; no ADR candidate |
| REQ-FE-035 | Master permissions: list, detail, edit name/description (read-only otherwise, ARCH-FE-001 v1.0.4) | D6.4 | — | Screen design; no ADR candidate |
| REQ-FE-036 | Pagination model: master-data server-side; auth-service client-side | D5.4 | — | Contract mapping; no ADR candidate |
| REQ-FE-037 | Dashboard counts come from `pagination.total` | D7 | — | Screen design; no ADR candidate |
| REQ-FE-038 | Loading, empty and error states; no automatic retry | D3.1, D13 | ADR-002, ADR-003 | D3 and D12 headers list REQ-FE-038 |
| REQ-FE-039 | Confirm dialogs for delete (tenant categories, countries, system roles; not system accounts, REQ-FE-054), deactivate, suspend, reset password and force logout. v1.0.6. TODO-023 | D7 | — | Dialog design (D11); no ADR candidate. v1.0.6 assessed 2026-10-14: no ADR |
| REQ-FE-040 | Immutable fields never sent | D5.3 | — | Write whitelists; no ADR candidate |
| REQ-FE-041 | Branch, facility, social-link, patient and employee flows not built | D2 | — | Scope (FE doc 6, 11); no ADR candidate |
| REQ-FE-042 | Acceptance checklist and smoke test are test requirements | D19 | ADR-005 | D19 names ADR-FE-05 |
| REQ-FE-043 | No HTTP or browser cache for master-data reads | D12 | ADR-003 | D12 header lists REQ-FE-043 |
| REQ-FE-044 | CSP, frame and referrer policy coordinated with security_architect | D15 | ADR-006, ADR-007 | D15 header lists REQ-FE-044; CSP `connect-src` (ADR-006); dependency control row (ADR-007) |
| REQ-FE-045 | WCAG 2.1 Level AA considerations | D16 | — | Accessibility design; automation open (FE-OQ-34, ADR-005) |
| REQ-FE-046 | Client logs contain no tokens, passwords, bodies or personal data | D15, D18 | — | Logging design; no ADR candidate |
| REQ-FE-047 | Same-origin deployment; operator edge file per environment | D1.2 | ADR-006 | D1.2 names ADR-FE-06 |
| REQ-FE-048 | Invalidate every affected query after every mutation | D12.1 | ADR-003 | D12 header lists REQ-FE-048; D12.1 table |
| REQ-FE-049 | Every form uses React Hook Form with the Zod resolver | D9 | ADR-001, ADR-003 | D9 header lists REQ-FE-049; SD-06 (Zod 4) in ADR-001; SD-09 in ADR-003 |
| REQ-FE-050 | `api/client.ts` Vitest unit tests; MSW 2.x for API integration tests | D3, D19 | ADR-002, ADR-005 | D3 header lists REQ-FE-050; D19 names ADR-FE-05 |
| REQ-FE-051 | TypeScript strict options; package conformance | D1.3 | ADR-001, ADR-007 | SD-05 (ADR-001); package removals and moves in D1.3 (ADR-007) |
| REQ-FE-052 | While the flag is `false`: no "Sesi aktif" tab and no force logout for other accounts; own account links to `/account/sessions`. TODO-022 | D4.10, D7 | — | Feature suspension by one constant; user decision 2026-10-14; FE-OQ-39 (Answered); no ADR (DM-14) |
| REQ-FE-053 | Guard refusals and unrecognised 409/503 on Tim IT pages show fixed Indonesian copy by status and `code`, from `features/team/shared/guard-failure.ts`. TODO-022 | D13, D13.1 | — | Applies ADR-002 rule 8 and REQ-FE-008 without changing them; user decision 2026-10-14; FE-OQ-40 (Answered); FE-OQ-22 (Open, copy deck); no ADR (DM-14) |
| REQ-FE-054 | System account pages (Tim IT > Akun) offer no "Hapus" action (list row or detail); no UI code path calls `deleteSystemUser`; no UI gate uses `system_users:delete`; Tangguhkan and Nonaktifkan dialogs carry explanatory text. TODO-023 | D6.4, D7, D13.1, D13.1a | — | Removal of a UI action by user decision 2026-10-14; no dependency, standard deviation or new technology; FE-OQ-41 and FE-OQ-42 (Answered); no ADR (DM-15, Answered/Closed 2026-10-14) |

Count: 54 rows. With an ADR: 27 rows. With no ADR candidate: 27 rows. Counts were computed from the ADR column of this table (v1.2 added REQ-FE-052 and REQ-FE-053; v1.3 adds REQ-FE-054, no ADR). Rows REQ-FE-030, REQ-FE-031 and REQ-FE-039 changed wording in v1.0.6; their ADR column is unchanged.

## 2. ADR to ARCH-FE-001 sections, rows, requirements and open items

| ADR | Candidate | ARCH-FE-001 sections | Table 4 or 5 rows | REQ-FE (direct) | Open items (register IDs) | Platform or other references (cited) |
|-----|-----------|----------------------|-------------------|-----------------|---------------------------|--------------------------------------|
| ADR-001 | ADR-FE-01 | D0, D1.3, D2, D17, A-11 | SD-01 to SD-06; Table 5 (react, vite, typescript, tailwind, `@base-ui/react`, zod) | REQ-FE-049, REQ-FE-051 | FE-OQ-37 (answered 2026-10-10); DM-01 (answered); DM-11 (answered) | none |
| ADR-002 | ADR-FE-02 | D3, D3.1, D3.2, D4.4, D13, D19, A-21 | SD-08 | REQ-FE-004, REQ-FE-008, REQ-FE-038, REQ-FE-050 | FE-OQ-18; FE-OQ-26; FE-OQ-33; DM-01 (answered) | gateway ARCH-BE-002 section 13; ARCH-SEC-002 header rules (cited) |
| ADR-003 | ADR-FE-03 | D9, D12, D12.1, D12.2, D12.3, A-08, A-12 | SD-07, SD-09; Table 5 (not installed) | REQ-FE-016, REQ-FE-023, REQ-FE-029, REQ-FE-038, REQ-FE-043, REQ-FE-048, REQ-FE-049 | FE-OQ-30; DM-13 | none |
| ADR-004 | ADR-FE-04 | D4, D15, C-02, C-03, A-02, A-03, A-22 | SD-10 | REQ-FE-005, REQ-FE-006, REQ-FE-009 to REQ-FE-017 | FE-OQ-11 (answered); FE-OQ-18; FE-OQ-19; FE-OQ-21; DM-01 (answered); DM-02 (Open, non-blocking follow-up); DM-11 (answered) | PLATFORM ARCH-SEC-001 section 9.2 c; AUTH ARCH-SEC-001 sections 3 and 8; AUTH ARCH-SEC-003 section 10; AUTH ADR-001 (all cited) |
| ADR-005 | ADR-FE-05 | D19, A-23, A-24, A-25 | SD-11; Table 5 (not installed) | REQ-FE-042, REQ-FE-050 | DM-09 (answered); FE-OQ-31; FE-OQ-34; OQ-P-01 (DOM environment amendment) | none |
| ADR-006 | ADR-FE-06 | D1.1, D1.2, D15, C-05, C-10, A-01, A-20 | (FE-OQ-01 answer; no Table 4 row) | REQ-FE-001, REQ-FE-002, REQ-FE-003, REQ-FE-006, REQ-FE-044, REQ-FE-047 | FE-OQ-20; FE-OQ-33; FE-OQ-36; DM-07 (answered); DM-08 (Open) | gateway ARCH-SEC-002 (SC2-CORS-05, SC2-HDR-13); ARCH-BE-002 section 6; AUTH ARCH-SEC-003 section 10; PLATFORM ADR-009 (all cited) |
| ADR-007 | ADR-FE-07 | D1.3, D15, D17, RK-FE-10, A-26 | SD-12; Table 5 (all rows); v1.1 and v1.2 dev packages `jsdom`, `@testing-library/jest-dom`, `@testing-library/dom` (not in Table 5) | REQ-FE-044, REQ-FE-051 | FE-OQ-28; DM-05; DM-06 (also covers v1.1 and v1.2 dev packages); DM-10 (answered); DM-12 (Deferred); OQ-P-01 (v1.1 packages); gate answer 2026-10-10 (v1.2 package) | none |

## 3. Standard deviations and accepted items

| Standard item (tech-stack-frontend.md) | Repository decision | ADR | Status |
|----------------------------------------|---------------------|-----|--------|
| Next.js 15 App Router with Turbopack | Vite 8 SPA | ADR-001 | Approved |
| Bun (`bun.lock`) | npm (`package-lock.json`) | ADR-001 | Approved |
| Tailwind CSS 3.4.x | Tailwind CSS 4 | ADR-001 | Approved |
| shadcn/ui on Radix UI | shadcn/ui on Base UI | ADR-001 | Approved |
| TypeScript 5.7.x | TypeScript 6 (strict, with the listed options) | ADR-001 | Approved |
| Zod 3.x | Zod 4 | ADR-001 | Approved |
| Axios with interceptors | `fetch`-based pipeline | ADR-002 | Approved |
| NextAuth (Auth.js) 5 beta | First-party platform login | ADR-004 | Approved |
| React 19.0.0 | React 19 (same major; ranges in Table 5) | ADR-001 | Conforms (major version) |
| TanStack Query 5.x (mandatory) | Adopted | ADR-003 | Adopted; not yet installed |
| React Hook Form 7.x with Zod resolver (mandatory) | Adopted | ADR-003 | Adopted; not yet installed |
| Vitest or Jest 29, React Testing Library 16, MSW 2 (mandatory) | Vitest, RTL 16.x (with `@testing-library/dom` peer), MSW 2.x, jsdom with jest-dom | ADR-005; ADR-007 v1.1 and v1.2 | Adopted; MSW confirmed at approval (DM-09 answered); DOM environment amended (OQ-P-01); `@testing-library/dom` added (ADR-007 v1.2) |
| Playwright (conditional, critical journeys) | After Tenants integration | ADR-005 | Deferred |

## 4. Platform and other references

| Reference | Cited in | Read by decision-manager | Note |
|-----------|----------|--------------------------|------|
| PLATFORM ARCH-SOLUTION-001 (BD-05, BD-06, BD-16; Domain Scope: frontend Cancelled) | ARCH-FE-001 Related Artifacts; C-07 | Yes (IDs and Domain Scope rows confirmed) | Platform repository, read-only |
| PLATFORM ARCH-SEC-001 (section 2.5 identity cache 30 s; section 9.2 c `SYS_PRINCIPAL` to `SYSTEM_PRINCIPAL`) | ARCH-FE-001 References, C-02, D4.8 (RK-FE-13), FE-OQ-14 | Yes (section headings and values confirmed) | Platform repository, read-only |
| PLATFORM ARCH-BE-001 | ARCH-FE-001 Related Artifacts | No | Cited only |
| PLATFORM ADR-009 (Approved; edge context contract) | ARCH-FE-001 Related Artifacts, Dependencies | Yes (front-matter read) | Platform numbering is separate from this repository's numbering |
| AUTH ARCH-SEC-001 (sections 3, 8); AUTH ARCH-SEC-003 (section 10); AUTH ARCH-BE-003; AUTH ADR-001 | ARCH-FE-001 D4, D1.2, SD-10 | No (outside the read list for this run) | Cited as ARCH-FE-001 cites them |
| GW ARCH-SEC-002 (SC2-CORS-05, SC2-HDR-13); GW ARCH-BE-002 (sections 6, 13) | ARCH-FE-001 D1.2, D3.2, D13 | No (outside the read list for this run) | Cited as ARCH-FE-001 cites them |
| MDS `api-reference.md` v1.3 | ARCH-FE-001 References | No | Cited only |

Numbering note: the platform repository also has ADR-001 to ADR-009. The same numbers in the two repositories are different decisions. Platform decisions are cited with the platform prefix (for example "Platform ADR-009"). This repository's ADR-001 to ADR-007 are local.

## 5. Impacted plans and work (for project-manager)

Impacted work by area. Plans and TODOs exist since Checkpoint B (2026-10-10); this list is the original impact view, and TODO-022 is added below (v1.2).

- Conformance and build: `tsconfig.app.json`, `index.html`, `package.json`, `vite.config.ts`, removal of `src/app/dashboard/data.json` (D1.1, D1.3; ADR-001, ADR-007).
- Packages: install of TanStack Query, React Hook Form, `@hookform/resolvers`, Vitest, React Testing Library 16.x, MSW 2.x; removal of unused packages (ADR-003, ADR-005, ADR-007).
- Client and auth: `lib/api/client.ts` and tests; `lib/api/refresh.ts`; login, change-password, reset and session flows (ADR-002, ADR-004).
- Data layer: `lib/query/keys.ts` and the D12.1 invalidation map (ADR-003).
- Deployment: operator edge file, reverse-proxy routing and the production build guard (ADR-006).
- TODO-022 (v1.2, 2026-10-14; Not Started): suspend other-account sessions on `/system-users/:id` (REQ-FE-052, REQ-FE-032, D4.10; `src/features/team/users/access.ts`) and fixed copy for guard refusals (REQ-FE-053, D13.1; `src/features/team/shared/guard-failure.ts`, `user-failure.ts`, `role-failure.ts`). Governing ADRs: none new. Existing ADR-002 (error shape, branch on `code`) is applied, not changed. `describeWriteFailure` in `tenants/create/write-failure.ts` is unchanged. Source: ARCH-FE-001 v1.0.5 (Approved 2026-10-14). Platform watch item: SP-BG-14 (Open), which flips the flag only through a new ARCH-FE-001 amendment (FE-OQ-39).
- TODO-023 (v1.3, 2026-10-14; Not Started): remove the "Hapus" action and its tests on the Tim IT > Akun list and detail, and add explanatory text to the Tangguhkan and Nonaktifkan dialogs (REQ-FE-054, REQ-FE-030, REQ-FE-031, REQ-FE-039, D6.4, D6.6, D7, D12.1, D13.1a; `src/features/team/users/`: `access.ts`, `user-list-page.tsx`, `user-detail-page.tsx`, `user-failure.ts` and their tests). Governing ADRs: none new. ADR-002 and ADR-003 are applied, not changed. `deleteSystemUser` stays in `lib/api/modules/system-users.ts`; role, tenant category and country delete are unchanged. Source: ARCH-FE-001 v1.0.6 (Approved 2026-10-14). Platform watch item (taken by the user separately): backend gap on `DELETE /system-users/{id}` and `PLATFORM_ROLE_PROTECTED`.
