---
id: IMPLEMENTATION-PLAN
title: Implementation Plan — System Principal Web (Frontend)
owner: project_manager
status: Approved
version: 1.9
last_updated: 2026-10-12
source_requirements: [RAG-FE-SP-001, REQ-FE-001, REQ-FE-002, REQ-FE-003, REQ-FE-004, REQ-FE-005, REQ-FE-006, REQ-FE-007, REQ-FE-008, REQ-FE-009, REQ-FE-010, REQ-FE-011, REQ-FE-012, REQ-FE-013, REQ-FE-014, REQ-FE-015, REQ-FE-016, REQ-FE-017, REQ-FE-018, REQ-FE-019, REQ-FE-020, REQ-FE-021, REQ-FE-022, REQ-FE-023, REQ-FE-024, REQ-FE-025, REQ-FE-026, REQ-FE-027, REQ-FE-028, REQ-FE-029, REQ-FE-030, REQ-FE-031, REQ-FE-032, REQ-FE-033, REQ-FE-034, REQ-FE-035, REQ-FE-036, REQ-FE-037, REQ-FE-038, REQ-FE-039, REQ-FE-040, REQ-FE-041, REQ-FE-042, REQ-FE-043, REQ-FE-044, REQ-FE-045, REQ-FE-046, REQ-FE-047, REQ-FE-048, REQ-FE-049, REQ-FE-050, REQ-FE-051]
related_artifacts: [ARCH-FE-001, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, MASTER-TODO, PROGRESS-TRACKER, PROJECT-PROFILE, CLARIFICATIONS, ORCHESTRATION-STATE]
blocking_open_questions: 0
---

Title: Implementation Plan — System Principal Web (Frontend)

Owner: project_manager

Status: Approved

Version: 1.9

Last Updated: 2026-10-12

Approved: 2026-10-10 (user, Checkpoint B gate)

Change: 2026-10-10 — amendment: @testing-library/dom (ADR-007 v1.2)

Change: 2026-10-10 — amendment (v1.2): TODO-002 File scope adds `src/components/ui/sonner.tsx` for a one-line cast fix (TS2375 under exactOptionalPropertyTypes); user decision. Status unchanged (Approved).

Change: 2026-10-11 — amendment (v1.3): TODO-006 File scope adds `src/app/providers/auth-provider.test.tsx` (test-only addition for GATE-11, logout reachable while passwordChangeRequired; user decision). Status unchanged (Approved).

Change: 2026-10-11 — amendment (v1.4): TODO-007 File scope adds `src/app/guards/route-guard.tsx`, `src/app/guards/route-guard.test.tsx` and `src/app/router.tsx` (route guard and router read access from navigation.ts, D6.3; user decision). Status unchanged (Approved).

Change: 2026-10-11 — amendment (v1.5): TODO-008 File scope adds `src/lib/routes-meta.ts` for one new routes-meta key, `account.sessions`, for the `/account/sessions` route (user decision; legacy keys stay until TODO-017). Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.6): TODO-005 reopened as a fix round (MeSchema `branches` accepts null or absent; SP-CF-01, user decision 2026-10-12; auth-service unchanged). TODO-005 File scope unchanged. Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.7, user approved): Notes and acceptance only; File scope and TODO statuses unchanged. TODO-009 (VALIDATION_ERROR and VALIDATION_FAILED test), TODO-010 (second DEDICATED tenant message), TODO-012 (permanent country delete dialog), TODO-014 (own-account actions hidden test; SP-BG-13), TODO-015 (design change: SYS_PRINCIPAL role locked statically in the UI because auth-service does not guard it, SP-BG-13; other roles keep the refusal-driven disable as a fallback, see v1.8), TODO-018 (E2E setup: Mailpit API for the temporary password; wrong SERVICE_TOKEN_VALUE for the FAILED admin account). Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.8, user decision): TODO-015 Description, SP-BG-06 dependency and Notes rewritten. The role with key SYS_PRINCIPAL is locked statically in the UI (no deactivate, delete or permission change); other roles keep the refusal-driven disable as a fallback; the BE refuses nothing today (SP-BG-13). File scope and Status (Not Started) unchanged. Status unchanged (Approved).

Change: 2026-10-12 — amendment (v1.9, user approved): TODO-010 File scope adds `src/lib/routes-meta.ts` (keys tenant.new and tenant.detail; tenant.list moved out of the legacy keys) and `src/features/tenants/list/` ("Tambah tenant" button and code link, deferred from TODO-009); the TODO-009 tenant-list tests must still PASS in the TODO-010 Unit Test Report; classifier component tests cover all five combinations. TODO-015 Gate is two tests (SYS_PRINCIPAL static lock; disable after a BE refusal for other roles). TODO-017 notes `tenant.list` is not to be redone. TODO statuses unchanged. Status unchanged (Approved).

Source Requirements:
- REQ-FE-001 to REQ-FE-051 (ARCH-FE-001 v1.0, Requirements Addressed), derived from `[FE Requirement] system-principal-web v1.0` (RAG-FE-SP-001)

Related Artifacts:
- `output/architecture/ARCH-FE-001.md` v1.0 (Approved)
- `output/decisions/ADR-001` to `ADR-007` (Pending Approval at Checkpoint B)
- `output/plans/master-todo.md`, `output/plans/progress-tracker.md`
- `output/project-profile.md` (greenfield, enforced)
- `output/clarifications.md` (SP-SCOPE-01, SP-PROV-01, SP-DEC-01, FE-OQ-xx)
- `../Microservices/gaia-platform-architecture/output/clarifications.md` (SP-BG-01 to SP-BG-11, read-only)

## At a Glance

- 18 TODOs in five phases (Phase 0 to Phase 4). All TODOs are `Not Started`. Owner is `developer_frontend` for every TODO.
- Plan against ARCH-FE-001 v1.0 and ADR-001 to ADR-007. Both blocking planning questions are answered (2026-10-10): OQ-P-01 (jsdom with `@testing-library/jest-dom`, recorded in ADR-007 v1.1) and OQ-P-02 (History API path routes, no routing library). No Blocking open question remains.
- Priority counts: Critical 8, High 8, Medium 1, Low 1. The build is serial from TODO-004 to TODO-017 by design (see Dependencies).
- The app is not releasable until TODO-017 is Completed. Intermediate TODOs leave legacy mock files that stop compiling (PM-RK-01).

## Purpose

Sequence the implementation of the SP web frontend against ARCH-FE-001 v1.0. The plan turns the approved design into executable, traceable TODOs with concrete file scope, dependencies and gates. It does not design, decide or approve.

## Objectives

1. Replace the mock-data prototype with a frontend that calls only the GAIA API gateway, using the contracts in the FE requirement document as referenced by ARCH-FE-001.
2. Keep the trust rules of ARCH-FE-001: access token in memory only; refresh single-flight in a tab and serialised across tabs; gates are UX only and the backend enforces every rule.
3. Cover every REQ-FE ID in the design, except the two that are deferred or excluded (REQ-FE-027, REQ-FE-041) and the one owned outside this repository (REQ-FE-044). See Requirement Coverage.
4. Put the foundation first: dependency set (ADR-007), TypeScript and dev-server settings (ADR-001, ADR-006), then the HTTP client and the auth flow, then the shell, then the modules one at a time with the Tenants module first.

## Scope

In scope:
- Repository files under `src/`, `vite.config.ts`, `index.html`, `tsconfig.app.json`, `package.json` and `package-lock.json`, and the environment files for development and production (ARCH-FE-001 Scope).
- Every screen in ARCH-FE-001 D7, including the login and account screens.
- Replacement or removal of every mock file and page (ARCH-FE-001 Table 2).
- Unit, component and MSW integration tests for each module (ARCH-FE-001 D19).

Out of scope:
- Platform services (gateway, auth-service, master-data-service). Referenced only; no platform TODO is planned here (ARCH-FE-001 C-07).
- REQ-FE-027 (registration settings, phase 2, not routed in v1). Deferred.
- REQ-FE-041 (branch types, branches, facilities, social links, patient and employee flows). Excluded from v1; verified by absence in TODO-017.
- Theme-source consolidation (ADR-007 DM-12, deferred). No TODO.
- Playwright E2E before the Tenants integration (ARCH-FE-001 A-25). Deferred to TODO-018.
- CSP, frame and referrer headers and static-host hosting (REQ-FE-044, FE-OQ-20). Owned by security_architect and operations. No FE TODO.
- Domain names and reverse-proxy configuration (FE-OQ-36, DM-08). Operator responsibility (C-10).

## Assumptions

Not Allowed: assumptions. Use Clarifications Required.

Clarifications answered (no assumption is made for any of these; each is owned in the Open Questions table below):
- OQ-P-01 — answered: jsdom with `@testing-library/jest-dom` (ADR-007 v1.1).
- OQ-P-02 — answered: History API path routes; no routing library.
- OQ-P-03 — Dev dependencies not covered by ARCH-FE-001 Table 5 or ADR-007.
- OQ-P-04 — Document title text for `index.html`.
- OQ-P-05 — Strict compiler options applied to a shared `tsconfig.app.json` while legacy files remain.
- OQ-P-06 — Whether the registration-settings API module file is written in v1.
- OQ-P-07 — Location of reusable custom components (D2 `components/custom/` versus existing root components).
- OQ-P-08 — `components.json` icon library setting versus the icon package in use.
- OQ-P-09 — CI wiring for static checks, dependency audit and the coverage target.
- OQ-P-10 — Location of the E2E configuration and specs.
- OQ-P-11 — The `/decision` command lists "4 plan" artifacts; this plan covers the three named in the brief.

## Dependencies

### Internal sequence

| TODO | Depends on | Notes |
|------|------------|-------|
| TODO-001 | OQ-P-01 and OQ-P-02 answered (done); ADR-003, ADR-005, ADR-007 v1.1 | Single owner of `package.json` until TODO-018 |
| TODO-002 | none | Can run in parallel with TODO-001 and TODO-003 |
| TODO-003 | none | Can run in parallel with TODO-001 and TODO-002 |
| TODO-004 | TODO-001, TODO-002, TODO-003 | Vitest, strict options, dev-server config |
| TODO-005 | TODO-004 | Auth and session data layer; query foundation |
| TODO-006 | TODO-005 | Routing and gates (History API path routes; no library) |
| TODO-007 | TODO-006 | App shell |
| TODO-008 | TODO-007 | Auth screens; first forms; DOM test environment |
| TODO-009 | TODO-008 | Tenants module (API and list) |
| TODO-010 | TODO-009 | Tenant create and detail |
| TODO-011 | TODO-010 | Tenant permissions tab |
| TODO-012 | TODO-011 | Catalog: tenant categories and countries (serial by design) |
| TODO-013 | TODO-012 | Catalog: master permissions (serial by design) |
| TODO-014 | TODO-013 | Team: system users (serial by design) |
| TODO-015 | TODO-014 | Team: system roles and checklist (serial by design) |
| TODO-016 | TODO-015; TODO-007, TODO-009, TODO-012 for reads and navigation | Dashboard and badges |
| TODO-017 | TODO-009 to TODO-016 | Mock removal, static checks, acceptance mapping |
| TODO-018 | TODO-010, TODO-008, TODO-001 | Deferred E2E; not in the initial phase |

Critical path (serial): TODO-001 (with TODO-002 and TODO-003 as parallel predecessors of TODO-004), TODO-004, TODO-005, TODO-006, TODO-007, TODO-008, TODO-009, TODO-010, TODO-011, TODO-012, TODO-013, TODO-014, TODO-015, TODO-016, TODO-017.

Why serial from TODO-009 onward: the modules share files (router, MSW handlers, API modules, sidebar). One module at a time avoids merge conflicts and follows the user's planning rule. The serial links are sequencing choices, not design dependencies.

### Shared-file rule

Each shared file has one owner TODO. Later TODOs touch it only after the owner is Completed, and each later touch depends on the previous one.

| File | Touches (in order) |
|------|--------------------|
| `package.json`, `package-lock.json` | TODO-001 (owner); TODO-018 (Playwright, deferred) |
| `vitest.config.ts` | TODO-004 (create); TODO-005 (setup file); TODO-008 (DOM environment) |
| `src/app/router.tsx` | TODO-006 (create); TODO-008, 009, 010, 011, 012, 013, 014, 015, 016 (one route group each) |
| `src/app/navigation.ts` | TODO-007 (create); TODO-016 (badge keys) |
| `src/components/app-sidebar.tsx` | TODO-007; TODO-016 (badges) |
| `src/lib/api/modules/tenant-categories.ts`, `countries.ts` | TODO-009 (read); TODO-012 (write) |
| `src/lib/api/modules/master-permissions.ts` | TODO-011 (read); TODO-013 (write) |
| `src/lib/api/modules/system-roles.ts` | TODO-014 (read); TODO-015 (write and permissions) |
| `src/features/tenants/detail/tenant-detail-page.tsx` | TODO-010 (create); TODO-011 (Permissions tab) |
| `src/test/handlers/index.ts` | TODO-005 (create); each module adds its handler file and entry |
| `src/lib/query/keys.ts`, `invalidation.ts` | TODO-005 only (all key families and the full D12.1 map) |
| `src/components/dialogs/dialogs.tsx` | TODO-007 only |
| `src/components/table-card.tsx`, `table-pagination.tsx` | TODO-009 only |
| `src/components/metric-card.tsx` | TODO-016 only |

### External dependencies

| ID | Source | Affects | Gate type | Status as recorded |
|----|--------|---------|-----------|--------------------|
| SP-BG-01 | Platform clarifications | TODO-010 (admin-account state on detail; fallback: always offer retry) | Screen fallback; no start block | Open |
| SP-BG-02 | Platform clarifications | TODO-009 (branch, user and session counts; fallback: columns removed) | Screen fallback | Open |
| SP-BG-03 | Platform clarifications | TODO-017 (tenant-wide sessions; fallback: removed) | Screen fallback | Open |
| SP-BG-04 | Platform clarifications | TODO-014 (display name and last-active; fallback: loginId only) | Screen fallback | Open |
| SP-BG-05 | Platform clarifications | TODO-014 (statuses; product decision on INACTIVE mapping first) | Product decision | Open |
| SP-BG-06 | Platform clarifications | TODO-015 (protected-role flag; not available: SYS_PRINCIPAL locked statically in the UI, other roles use the refusal-driven disable fallback; the BE refuses nothing today, SP-BG-13) | Screen fallback | Open |
| SP-BG-07 | Platform clarifications | TODO-013 (locked flag and bound-tenant count; fallback: removed) | Screen fallback | Open |
| SP-BG-08 | Platform clarifications | TODO-016, TODO-017 (operations and dashboard feeds; fallback: removed) | Screen fallback | Open |
| SP-BG-09 | Platform clarifications | TODO-009 (name search; fallback: exact code only) | Screen fallback | Open |
| SP-BG-10 | Platform clarifications | TODO-004 (readable correlation id; fallback: request id; fallback topology only) | Not needed in the recommended topology | Open |
| SP-BG-11 | Platform clarifications | TODO-008, 009, 010, 012, 013, 014, 015 (no automatic retry; in-flight disable) | Conformance question; no start block | Open |
| SP-DEC-01 | Platform clarifications | TODO-006, 007, 009, 012, 016 (SYS_PRINCIPAL only for master data) | Answered (interim) | Answered |
| SEC-OQ-02 | Platform ARCH-SEC-001 | TODO-006 (role constant may change) | Release risk (RK-FE-03) | Open (platform security_architect) |
| FE-OQ-18 | ARCH-FE-001 | TODO-004, TODO-005 (refresh trigger codes; verify with a live expired token before integration tests) | Verification before integration | Open, non-blocking |
| FE-OQ-19 | ARCH-FE-001 | TODO-008 (reset link URL) | Default used | Open, non-blocking |
| FE-OQ-16 | ARCH-FE-001 | TODO-016 (server order; label without "latest") | Default used | Open, non-blocking |
| FE-OQ-17 | ARCH-FE-001 | TODO-013, TODO-015 (`key` read-only on edit) | Default used | Open, non-blocking |
| FE-OQ-20 | ARCH-FE-001 | TODO-010 (logo image policy); release (CSP, frame, referrer) | Release gate | Open, non-blocking |
| FE-OQ-22 | ARCH-FE-001 | All screen TODOs (copy keyed by code); release (copy approval) | Release gate | Open, non-blocking |
| FE-OQ-23 | ARCH-FE-001 | TODO-017 (removed surfaces) | Default used | Open, non-blocking |
| FE-OQ-24 | ARCH-FE-001 | TODO-011 (Permissions tab replaces "Fitur aktif") | Default used | Open, non-blocking |
| FE-OQ-25 | ARCH-FE-001 | TODO-014 (own role change hidden) | Default used | Open, non-blocking |
| FE-OQ-27 | ARCH-FE-001 | Release (client error sink; no TODO builds it) | Release gate | Open, non-blocking |
| FE-OQ-28 | ARCH-FE-001 | TODO-001 (second font family kept); TODO-017 (bundle measurement; no budget set) | Measurement | Open, non-blocking |
| FE-OQ-29 | ARCH-FE-001 | TODO-007 (desktop first) | Default used | Open, non-blocking |
| FE-OQ-30 | ARCH-FE-001 | TODO-005 (React context for auth view state) | Default used | Open, non-blocking |
| FE-OQ-31 | ARCH-FE-001 | TODO-009 (E-01 and E-02 paths verified before integration tests) | Verification before integration | Open, non-blocking |
| FE-OQ-34 | ARCH-FE-001 | TODO-018 (E2E timing) | Deferred | Open, non-blocking |
| FE-OQ-35 | ARCH-FE-001 | TODO-012 (per-category and per-country counts removed) | Default used | Open, non-blocking |
| FE-OQ-36 | ARCH-FE-001 | Operator: domain names and edge file; release | Release gate | Open, non-blocking |
| FE-OQ-37 | ARCH-FE-001 | Answered (OQ-P-02): History API path routes; no routing library | None | Answered |
| DM-08 | ARCH-FE-001 | Release (apigateway owner confirms Host passthrough for the production proxy) | Release gate | Open, no default recorded |
| Gateway development host table | ARCH-FE-001 D1.1 (operator file, outside this repository) | TODO-003 (dev origin `http://localhost:3000` for `system.gaia.localhost`); TODO-017 smoke test | Verified before smoke test; not assumed | Not verified in this plan |
| ADR-004 OQ2 (DM-02) | ADR-004 | All auth TODOs (TODO-004 onward) if the user wants security_architect sign-off before approval | Checkpoint B decision (user) | Open, non-blocking as recorded |
| Platform and service contracts | ARCH-BE-003 (auth-service), master-data `api-reference.md` v1.3 | TODO-005, TODO-009 to TODO-015 (mappers and endpoints); contract drift RK-FE-06 | Verified by MSW fixtures from FE doc examples; live verification at TODO-017 | Not assumed; drift is a known risk |
| DM-05 | ARCH-FE-001 ADR-007 | Dependency audit in CI; no CI pipeline in this repository (OQ-P-09) | Not planned | Open, no default |

## Phases

### Phase 0 — Foundation (TODO-001, TODO-002, TODO-003)

Objectives: apply the approved dependency set, the TypeScript conformance options and the dev-server settings before any feature code.

Deliverables:
- `package.json` and `package-lock.json` match ADR-007 v1.1 and Table 5: removals, `shadcn` in devDependencies, TanStack Query, React Hook Form, the resolver (Zod 4 compatible), Vitest, React Testing Library 16.x, MSW 2.x, and `jsdom`, `@testing-library/jest-dom` and `@testing-library/dom` as devDependencies (TODO-001).
- `tsconfig.app.json` and `index.html` meet REQ-FE-051 and C-09 (TODO-002), plus the one-line cast fix in `src/components/ui/sonner.tsx` (amendment 2026-10-10; user decision).
- `vite.config.ts` serves on port 3000 with `strictPort`, proxies `/api` with the Host rewrite, and fails the build for a non-https `VITE_API_BASE_URL`; `.env.development` and `.env.production` exist (TODO-003).

Dependencies: OQ-P-01 and OQ-P-02 answered (2026-10-10); ADR-001 to ADR-007 as recorded at Checkpoint B (ADR-007 at v1.1). Gate clearance is recorded by the orchestrator.

Exit: TODO-001 to TODO-003 Completed. TypeScript errors that remain are listed by path (legacy files, OQ-P-05).

### Phase 1 — Core: HTTP client, auth data, routing, shell and auth screens (TODO-004 to TODO-008)

Objectives: a working request pipeline with single-flight refresh; the auth and session data layer; route guards on `me.permissions`; the shell; and the auth screens.

Deliverables:
- `lib/api/client.ts`, `refresh.ts`, `errors.ts` with Vitest unit tests for every REQ-FE-050 case (TODO-004).
- Auth and sessions API modules, query foundation (keys, defaults, full invalidation map), auth view state and boot (TODO-005).
- Route table, access gates (Strategy pattern), route guard, status screens (403, 404, service unavailable) (TODO-006).
- Providers, navigation config, sidebar and palette gating, logout, dialogs with confirm variants, notification with reference id (TODO-007).
- Login, forgot password, reset password, change password (forced and voluntary) and my sessions, with React Hook Form and Zod (TODO-008).

Dependencies: Phase 0 Completed. ADR-002, ADR-004 approved.

Exit: login, forced password change and logout work against MSW fixtures; unit, component and MSW tests PASS for the phase.

### Phase 2 — Modules in ARCH-FE-001 order, Tenants first (TODO-009 to TODO-016)

Objectives: each module is complete (API, screens, tests) before the next starts. Tenants comes first because the Playwright TODO depends on its integration.

Deliverables:
- Tenants: API module, list, create wizard with the admin-account classifier, detail with the PATCH whitelist, Permissions tab (TODO-009 to TODO-011).
- Catalog: tenant categories and countries write side, master permissions CRUD (TODO-012, TODO-013).
- Team: system users with detail and admin sessions tab; system roles with the permission checklist and the static SYS_PRINCIPAL role lock and the refusal-driven fallback for other roles (TODO-014, TODO-015).
- Dashboard with counts from `pagination.total` and sidebar badges from contract totals (TODO-016).

Dependencies: Phase 1 Completed; SP-BG fallbacks as listed in External dependencies.

Exit: each module's unit, component and MSW tests PASS. The module's FE doc 12 acceptance lines are mapped to tests in its Unit Test Report.

### Phase 3 — Retirement, static checks and acceptance (TODO-017)

Objectives: remove mock data, legacy pages, the hash router and retired surfaces; add the D19 static checks; confirm the build, typecheck and lint pass.

Deliverables: deletion of `src/data/` (15 files), legacy `src/pages/` (15 files) and `src/router/index.tsx`; `src/test/static-rules.test.ts`; the REQ-FE-041 exclusion check; the bundle measurement (FE-OQ-28); the FE doc 12 acceptance mapping in the Unit Test Report.

Dependencies: TODO-009 to TODO-016 Completed.

Exit: `npm run build`, `npm run typecheck` and `npm run lint` pass; static checks PASS; no import of `src/data` remains. The smoke test (FE doc 13) runs at `/validate` (QA), not in this TODO.

### Phase 4 — Deferred end-to-end tests (TODO-018)

Objectives: Playwright coverage for the four D19 flows, once the Tenants integration works.

Dependencies: TODO-010 Completed; a running platform test stack (external).

Exit: specs PASS against the test stack. The FAILED admin-account path needs a way to produce that state, which no artifact records (see Unplanned items).

## Requirement Coverage

Each REQ-FE in ARCH-FE-001 maps to at least one TODO, or is listed as deferred, excluded or external with the reason.

| REQ-FE | TODO(s) | Note |
|--------|---------|------|
| REQ-FE-001 | 003, 004 | Gateway-only base URL |
| REQ-FE-002 | 003 | Port 3000, strictPort, proxy |
| REQ-FE-003 | 003 | Environment variable; https guard |
| REQ-FE-004 | 004 | Header allow-list |
| REQ-FE-005 | 004, 005, 017 | Memory token; static check |
| REQ-FE-006 | 004 | `credentials: 'include'`; no cookie access |
| REQ-FE-007 | 005, 009, 012, 013, 014, 015 | Two JSON conventions in the API layer |
| REQ-FE-008 | 004, 007, 008 | Branch on status and code; reference id |
| REQ-FE-009 | 005, 008 | Login and error mapping |
| REQ-FE-010 | 004 | Single-flight refresh; one retry |
| REQ-FE-011 | 005 | Boot: refresh then `me` |
| REQ-FE-012 | 005, 006, 008 | Forced password change routing |
| REQ-FE-013 | 005, 008 | Both keepCurrentSession outcomes |
| REQ-FE-014 | 008 | Neutral forgot-password message |
| REQ-FE-015 | 008 | Reset token handling |
| REQ-FE-016 | 005, 007 | Logout clears memory and cache |
| REQ-FE-017 | 005, 008 | Own sessions |
| REQ-FE-018 | 006, 007, 011, 013, 014, 015, 016 | Gates for auth-service screens and actions |
| REQ-FE-019 | 006, 007, 009, 016 | Master data for SYS_PRINCIPAL |
| REQ-FE-020 | 009 | Server pagination; documented filters |
| REQ-FE-021 | 010 | Create; three admin_account outcomes; retry |
| REQ-FE-022 | 010 | Read-only immutable fields; PATCH whitelist |
| REQ-FE-023 | 010 | Toggle reverts on 503 |
| REQ-FE-024 | 010, 018 | Admin-account retry (SP-BG-01 fallback) |
| REQ-FE-025 | 010, 018 | No delete; deactivate by PATCH |
| REQ-FE-026 | 011 | Tenant permissions |
| REQ-FE-027 | none | Deferred (phase 2, not routed in v1); OQ-P-06 |
| REQ-FE-028 | 012 | Tenant categories; code immutable |
| REQ-FE-029 | 012 | Countries; uppercase code |
| REQ-FE-030 | 014 | System users |
| REQ-FE-031 | 014 | Role options; own-account rules |
| REQ-FE-032 | 005, 014 | Admin sessions on user detail |
| REQ-FE-033 | 015 | System roles; SYS_PRINCIPAL static lock; refusal fallback |
| REQ-FE-034 | 015 | Checklist; one PUT |
| REQ-FE-035 | 013 | Master permissions CRUD |
| REQ-FE-036 | 008, 009 | Server pagination (master data); client pagination (auth-service) |
| REQ-FE-037 | 016 | Counts from `pagination.total` |
| REQ-FE-038 | 004, 009 to 016 | No automatic retry; loading, empty and error states per screen |
| REQ-FE-039 | 007, 010, 012, 013, 014, 015 | Confirm dialogs |
| REQ-FE-040 | 009, 010, 012, 013, 015 | Immutable fields never sent |
| REQ-FE-041 | 017 | Excluded from v1; verified by search |
| REQ-FE-042 | 017, 018 | Acceptance mapping and static checks; E2E deferred |
| REQ-FE-043 | 005 | No cache layer; in-memory only; cleared on logout |
| REQ-FE-044 | external | CSP, frame and referrer headers coordinated with security_architect (FE-OQ-20); no FE TODO |
| REQ-FE-045 | 007, 008, 009 to 016 | WCAG 2.1 AA considerations per screen (ARCH-FE-001 D16); manual QA at `/validate` |
| REQ-FE-046 | 004, 017 | Client logs without tokens, bodies or e-mail addresses |
| REQ-FE-047 | 003, external | Build guard in TODO-003; edge file and Host passthrough are operator work (DM-08, C-10) |
| REQ-FE-048 | 005, 009 to 015 | Invalidation map in TODO-005; each module applies its rows |
| REQ-FE-049 | 001, 008, 010, 011, 012, 014, 015 | React Hook Form with Zod resolver for every form |
| REQ-FE-050 | 004, 005, 009 to 015 | Client unit tests; MSW integration tests |
| REQ-FE-051 | 001, 002 | Compiler options and package conformance |

## Milestones

No calendar dates are given in the brief or in any artifact, so none are set here.

| Milestone | Exit criteria |
|-----------|---------------|
| M0 Foundation | TODO-001 to TODO-003 Completed |
| M1 Core | TODO-004 to TODO-008 Completed; login, forced password change and logout pass MSW tests |
| M2 Tenants integrated | TODO-009 to TODO-011 Completed; TODO-018 may start |
| M3 Catalog and Team | TODO-012 to TODO-015 Completed |
| M4 Dashboard and release candidate | TODO-016 and TODO-017 Completed; build, typecheck, lint and static checks pass |
| M5 E2E | TODO-018 Completed (deferred) |

## Risks

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| PM-RK-01 | Legacy mock files stop compiling from TODO-002 and their routing breaks from TODO-006. The app is not releasable until TODO-017 | High | Medium | Per-TODO gate on the TODO's own files; error list by path in the progress tracker; no release before M4 | project_manager |
| PM-RK-02 | Strict compiler options (TODO-002) produce many errors in legacy files | High | Low | Legacy files removed in TODO-017; OQ-P-05 | developer_frontend |
| PM-RK-03 | DOM environment was undecided and blocked TODO-001 and every component test | Closed | High | OQ-P-01 answered: jsdom with jest-dom (ADR-007 v1.1) | user |
| PM-RK-04 | Routing library was undecided and blocked the single package.json change and TODO-006 | Closed | High | OQ-P-02 answered: History API path routes, no library | user, architect_frontend |
| PM-RK-05 | Refresh trigger codes differ from the default (FE-OQ-18) | Medium | High | Live verification before TODO-005 integration tests; tests carry the default | developer_frontend |
| PM-RK-06 | Cross-tab refresh reuse revokes sessions (RK-FE-01), more likely where Web Locks is missing | Medium | High | Web Lock across tabs; in-tab single-flight; tests (TODO-004) | developer_frontend |
| PM-RK-07 | Platform gaps (SP-BG-01 to 11) not closed; screens run on fallbacks and features disappear | High | Medium | Fallbacks in the TODOs; platform owners route the gaps | project_manager |
| PM-RK-08 | Non-idempotent writes duplicated by resubmission (SP-BG-11, RK-FE-07) | Medium | Medium | In-flight disable; no automatic retry; 409 handling | developer_frontend |
| PM-RK-09 | Dev dependencies outside Table 5 drift or are changed without a decision (OQ-P-03) | Medium | Low | devDependencies unchanged by this plan | architect_frontend |
| PM-RK-10 | Operator prerequisites (dev host entry, Host passthrough, edge file, domain names) gate the smoke test and release, not the code TODOs | High | High | Verified before TODO-017 smoke test and before release | ops |
| PM-RK-11 | Copy (FE-OQ-22) and CSP (FE-OQ-20) unapproved at release | Medium | High | Release gate at M4 | user, security_architect |
| PM-RK-12 | SYS_PRINCIPAL mapping changes (SEC-OQ-02) and the role constant drifts (RK-FE-03) | Low | Medium | One constant (TODO-006); change listed in the platform change set | architect_frontend |
| PM-RK-13 | Removed surfaces reappear in v1 (BG-08) | Low | Medium | Route table and navigation config contain no removed entries; checked in TODO-017 | developer_frontend |
| PM-RK-14 | Shared files touched by several TODOs cause conflicts if modules run in parallel | Medium | Medium | Serial module order; shared-file rule above | project_manager |
| PM-RK-15 | `@testing-library/dom` (required peer of React Testing Library 16) was not in ADR-007 v1.1 or Table 5 | Closed | Medium | Answered 2026-10-10: added as a devDependency under ADR-007 v1.2 (decision-manager amendment) | architect_frontend |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ-P-01 | Which DOM environment does Vitest use for component tests (for example jsdom or happy-dom), and which peer and matcher packages are approved (for example `@testing-library/dom`, jest-dom or none)? | ARCH-FE-001 D19 requires component tests with Vitest and React Testing Library. No artifact records a DOM environment or its packages. Package additions need an ADR-007 amendment | Was blocking TODO-001 (single owner of `package.json`) and all component tests; closed | user, architect_frontend | No | Answered | jsdom with `@testing-library/jest-dom` (user, 2026-10-10). Both are devDependencies in ADR-007 v1.1. `@testing-library/dom` peer added under ADR-007 v1.2 (PM-RK-15 answered) |
| OQ-P-02 | Routing: a routing library for path routes, or custom History API routing (FE-OQ-37)? | A library is a package. `package.json` has one owner (TODO-001), so the choice must be known before TODO-001. ARCH-FE-001 records FE-OQ-37 as non-blocking; this plan raises it for sequencing only | Was blocking TODO-001 (package set) and TODO-006 (route table); closed. ARCH-FE-001 status is unchanged | architect_frontend, user | No | Answered | History API path routes; no routing library (user, 2026-10-10). ADR-001 OQ2 closed. TODO-006 no longer depends on this question |
| OQ-P-03 | Dev dependencies (ESLint 10, its plugins, typescript-eslint, prettier, prettier-plugin-tailwindcss, globals, `@types/*`, `@eslint/js`) are not covered by Table 5 or ADR-007 | Standard requires dependencies to be justified (SD-12). Unjustified dev packages stay unreviewed | Scope of TODO-001 | architect_frontend | No | Open | Documented default: unchanged by this plan |
| OQ-P-04 | Document title text for `index.html` (D1.3 requires replacing `vite-app`; no text is given) | Visible copy (FE-OQ-22) | TODO-002 | user, product | No | Open | Documented default: "System Principal" (project name in the FE requirement title) |
| OQ-P-05 | Strict compiler options are set in one shared `tsconfig.app.json`, so legacy files fail type checks until TODO-017. D1.3 says "in the first TODO that touches each file", which does not fit a shared file | Sequencing of TypeScript errors (PM-RK-02) | Build and typecheck between TODO-002 and TODO-017 | architect_frontend | No | Open | Documented default: options applied in TODO-002; errors recorded by path; legacy files removed in TODO-017 |
| OQ-P-06 | Is the `registration-settings.ts` API module written in v1? D2 says "defined, not routed in v1" | REQ-FE-027 is deferred; D2 wording is ambiguous | Scope of the module TODOs | architect_frontend | No | Open | Documented default: not written in v1 |
| OQ-P-07 | D2 places reusable custom components under `components/custom/` and layout under `components/layout/`. The components kept from the mock sit at the `components/` root | File locations in module TODOs | TODO-006 to TODO-016 file scope | architect_frontend | No | Open | Documented default: kept in place; no moves in this plan |
| OQ-P-08 | `components.json` sets `"iconLibrary": "lucide"`, but the app imports `@tabler/icons-react` in 34 files | Configuration consistency for the shadcn CLI | None on runtime; config only | architect_frontend | No | Open | Documented default: no change in this plan |
| OQ-P-09 | No CI pipeline is visible in the repository. ARCH-FE-001 D19 names CI static checks, DM-05 names a dependency audit, and the 80% coverage target is a guideline without a gate | Where the static checks and audit run | TODO-017 (static checks run as Vitest tests); dependency audit not planned | architect_frontend, ops | No | Open | Documented default: static checks run as Vitest tests; no CI gate |
| OQ-P-10 | Location of the E2E configuration and specs (ARCH-FE-001 does not name one) | TODO-018 file scope | TODO-018 | architect_frontend | No | Open | Documented default: `playwright.config.ts` and `tests/e2e/`, from the tech-stack-frontend example |
| OQ-P-11 | The `/decision` command lists "4 plan" artifacts. This plan covers the three named in the brief (implementation plan, master TODO, progress tracker). Dependencies are in this plan; no separate dependency register or roadmap is produced | Checkpoint B completeness | Orchestrator gate | orchestrator | No | Open | Documented default: three artifacts; dependencies recorded in this plan |

Blocking open questions: 0. OQ-P-01 and OQ-P-02 were answered on 2026-10-10 (see rows above). Checkpoint B approved by the user on 2026-10-10.

## Unplanned items (could not plan from ARCH-FE-001)

- The FAILED admin-account state for the E2E retry scenario (D19) is produced by running master-data with a wrong SERVICE_TOKEN_VALUE (user, 2026-10-12; TODO-018 Notes). No longer unplanned.
- The client error sink for production (FE-OQ-27) has no owner or tool. Not planned; release gate.
- Automated accessibility checks (FE-OQ-34) are not planned; manual QA only.
- The bundle budget (FE-OQ-28) is measured in TODO-017 but no number is set.

## References

- `output/architecture/ARCH-FE-001.md` v1.0 (D0 to D20, Alternatives A-01 to A-26, Risks RK-FE-01 to RK-FE-17, Tables 1 to 5, ADR candidates)
- `output/decisions/ADR-001-base-frontend-stack.md` to `ADR-007-runtime-dependency-set.md` (Pending Approval)
- `output/decisions/decision-index.md`, `output/decisions/open-decisions.md`
- `output/plans/master-todo.md`, `output/plans/progress-tracker.md`
- `output/plans/file-provenance-register.md` (empty bootstrap; rows are added at `/build` when a TODO completes)
- `output/project-profile.md` (greenfield, enforced)
- `../Microservices/gaia-platform-architecture/output/clarifications.md` (SP-BG-01 to SP-BG-11, SP-DEC-01; read-only)
- `.claude/rules/tech-stack-frontend.md`, `standards-frontend.md`, `artifact-standards.md`, `artifact-templates/artifact-templates-decision.md`
