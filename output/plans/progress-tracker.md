---
id: PROGRESS-TRACKER
title: Progress Tracker — System Principal Web (Frontend)
owner: project_manager
status: Approved
version: 1.7
last_updated: 2026-10-12
source_requirements: [RAG-FE-SP-001, ARCH-FE-001]
related_artifacts: [IMPLEMENTATION-PLAN, MASTER-TODO, ARCH-FE-001, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007]
blocking_open_questions: 0
---

Title: Progress Tracker — System Principal Web (Frontend)

Owner: project_manager

Status: Approved

Version: 1.7

Last Updated: 2026-10-12

Approved: 2026-10-10 (user, Checkpoint B gate)

Change: 2026-10-10 — amendment: @testing-library/dom (ADR-007 v1.2)

Change: 2026-10-12 — plan amendments recorded (implementation-plan v1.9, master-todo v1.3); no status change. Status unchanged (Approved).

Change: 2026-10-12 — TODO-010 Completed (execution_overall PASS); progress 10 of 18; report OQ1 and OQ2 recorded as non-blocking. Status unchanged (Approved).

Change: 2026-10-12 — TODO-011 Completed (execution_overall PASS, 432/432; TODO-009 and TODO-010 regressions PASS); progress 11 of 18; In Progress none; report notes recorded as non-blocking (OQ-P-17). Status unchanged (Approved).

Change: 2026-10-12 — TODO-012 Completed (execution_overall PASS, 481/481; TODO-009, TODO-010 and TODO-011 regressions PASS); progress 12 of 18; In Progress none. Status unchanged (Approved).

Change: 2026-10-12 — TODO-013 Completed (execution_overall PASS, 537/537; TODO-009 to TODO-012 regressions PASS); progress 13 of 18; In Progress none. Status unchanged (Approved).

Change: 2026-10-12 — TODO-014 Completed (execution_overall PASS, 709/709; TODO-009 to TODO-013 regressions PASS); progress 14 of 18; In Progress none; UT-014-1 recorded as non-blocking. Status unchanged (Approved).

Change: 2026-10-12 — TODO-015 Completed (execution_overall PASS, 806/806; TODO-009 to TODO-014 regressions PASS); progress 15 of 18; In Progress none; OQ-P-48 recorded as non-blocking. Status unchanged (Approved).

Change: 2026-10-12 — TODO-016 Completed (execution_overall PASS, 862/862; TODO-009 to TODO-015 regressions PASS); progress 16 of 18; In Progress none; OQ-P-59 recorded as non-blocking. Status unchanged (Approved).

Change: 2026-10-12 — TODO-019 added after QA (QA D-1, High; user decision 2026-10-12, option 1: the frontend accepts null for `updated_by` in the countries and tenant-categories contracts). TODO-019 is Not Started; total becomes 19 TODOs; progress 17 of 19 (the Overall Progress percentage is corrected from the stale 16 of 18; 17 TODOs were already Completed). TODO-012 status unchanged (Completed). Status unchanged (Approved).

Change: 2026-10-12 — TODO-019 Completed (Unit Test Report `execution_overall: PASS`, 886/886, 70 files; tsc and build PASS). QA D-1 is remediated pending the QA C-10 re-run (no `[contract]` line on `/countries` and `/tenant-categories`). Progress 18 of 19; In Progress none; OQ-UT-19-01 to OQ-UT-19-03 recorded as non-blocking. TODO-018 remains Not Started (deferred). Status unchanged (Approved).

Change: 2026-10-12 — TODO-020 added (user decision 2026-10-12, frontend fix: the frontend accepts the live tenant detail shape without top-level `tenant_category_id` and `country_code`; QA finding on `tenants.get`). TODO-020 is Not Started; total becomes 20 TODOs; progress 18 of 20 (90.0%). No TODO status changed (TODO-010 remains Completed; TODO-018 remains Not Started). Status unchanged (Approved).

Change: 2026-10-12 — TODO-020 Completed (Unit Test Report `execution_overall: PASS`, 890/890, 70 files; user confirmed the live `social_links` key on 2026-10-12). Progress 19 of 20 (95.0%). TODO-018 remains Not Started (deferred). The QA finding on `tenants.get` (OQ-P-63) stays open until the QA re-check is recorded. Status unchanged (Approved).

Change: 2026-10-12 — TODO-021 Completed (Unit Test Report `execution_overall: PASS`, 909 passed in 75 files (was 917)). Progress 20 of 21 (95.2%). TODO-018 remains Not Started (deferred). Status unchanged (Approved).

Change: 2026-10-12 — TODO-021 added (user decision 2026-10-12: Katalog > Permission read-only; ARCH-FE-001 v1.0.4). TODO-021 is Not Started, gated by Pending Approval of ARCH-FE-001 v1.0.4; total becomes 21 TODOs; progress 19 of 21 (90.5%). No TODO status changed (TODO-013 remains Completed). Status unchanged (Approved).

Source Requirements:
- REQ-FE-001 to REQ-FE-051 (ARCH-FE-001 v1.0)

Related Artifacts:
- `output/plans/implementation-plan.md`
- `output/plans/master-todo.md`
- `output/architecture/ARCH-FE-001.md` v1.0

## At a Glance

- 20 of 21 TODOs Completed (95.2%). TODO-018 is `Not Started` (deferred). TODO-021 is `Completed` (2026-10-12; Katalog > Permission read-only). TODO-019 is `Completed` (added after QA, 2026-10-12; QA D-1 remediated pending the QA C-10 re-run). TODO-020 is `Completed` (2026-10-12, Critical; live tenant detail contract; QA re-check of `tenants.get` pending). Phase 3 is complete.
- Active phase: Phase 0 — Foundation. OQ-P-01 and OQ-P-02 are answered (2026-10-10). It starts when Checkpoint B clears and the orchestrator records the gate.
- Blocking open questions: 0. OQ-P-01 and OQ-P-02 were answered on 2026-10-10 (see `implementation-plan.md` -> Open Questions).

## Purpose

Track overall progress, the active phase and the status of every TODO in `master-todo.md`. Allowed task statuses: Not Started, In Progress, Blocked, Completed, Cancelled.

## Scope

Frontend TODOs in this repository (TODO-001 to TODO-021; TODO-019, TODO-020 and TODO-021 added after QA, 2026-10-12). Platform work is external and is not tracked here.

## References

- `output/plans/implementation-plan.md` (phases, dependencies, milestones)
- `output/plans/master-todo.md` (TODO entries)
- `output/plans/file-provenance-register.md` (rows are added when each TODO completes at `/build`)

## Overall Progress

Percentage: 95.2% (20 of 21 TODOs Completed)

| Phase | TODOs | Completed | Status |
|-------|-------|-----------|--------|
| Phase 0 — Foundation | TODO-001 to TODO-003 | 3 of 3 | Completed |
| Phase 1 — Core | TODO-004 to TODO-008 | 5 of 5 | Completed |
| Phase 2 — Modules | TODO-009 to TODO-016 | 8 of 8 | Completed |
| Phase 3 — Retirement and acceptance | TODO-017 | 1 of 1 | Completed |
| Phase 4 — Deferred E2E | TODO-018 | 0 of 1 | Not Started (deferred) |
| Post-QA remediation (added 2026-10-12) | TODO-019, TODO-020 | 2 of 2 | Completed (QA re-checks for D-1 and `tenants.get` pending) |
| User decision change (added 2026-10-12) | TODO-021 | 1 of 1 | Completed |

## Active Phase

Current Phase: Phase 3 — Retirement and acceptance (complete); Phase 4 (TODO-018) deferred

Entry conditions: OQ-P-01 and OQ-P-02 answered (done); Checkpoint B gate cleared and recorded by the orchestrator (ADR-001 to ADR-007, this plan).

## Completed Tasks

- TODO-001 Apply the dependency set and test packages (Critical)
- TODO-002 TypeScript conformance and HTML shell (Critical)
- TODO-003 Dev server, `/api` proxy, environment files and build guard (Critical)
- TODO-004 fetch client, refresh and error model, with unit tests (Critical)
- TODO-005 Auth and session data layer and query foundation (Critical)
- TODO-006 Routing foundation, access gates and status screens (Critical)
- TODO-007 App shell, providers, navigation and gating (Critical)
- TODO-008 Auth screens and shared form pieces (Critical)
- TODO-009 Tenants: API module and list (High)
- TODO-010 Tenants: create wizard and detail (High) — Unit Test Report `execution_overall: PASS` (381/381; TODO-009 regression PASS; tsc PASS)
- TODO-011 Tenants: Permissions tab (High) — Unit Test Report `execution_overall: PASS` (432/432; TODO-009 and TODO-010 regressions PASS)
- TODO-012 Catalog: tenant categories and countries write side (High) — Unit Test Report `execution_overall: PASS` (481/481; TODO-009 to TODO-011 regressions PASS)
- TODO-013 Catalog: master permissions (High) — Unit Test Report `execution_overall: PASS` (537/537; TODO-009 to TODO-012 regressions PASS)
- TODO-014 Team: system users and detail (High) — Unit Test Report `execution_overall: PASS` (709/709; TODO-009 to TODO-013 regressions PASS)
- TODO-015 Team: system roles and permission checklist (High) — Unit Test Report `execution_overall: PASS` (806/806; TODO-009 to TODO-014 regressions PASS)
- TODO-016 Dashboard and sidebar badges (Medium) — Unit Test Report `execution_overall: PASS` (862/862; TODO-009 to TODO-015 regressions PASS)
- TODO-017 Mock removal, static checks and acceptance mapping (High) — Unit Test Report `execution_overall: PASS` (884/884, 70 files; lint, typecheck, build PASS)
- TODO-019 Nullable `updated_by` in countries and tenant-categories contracts (Critical; post-QA, closes QA D-1 pending the QA C-10 re-run) — Unit Test Report `execution_overall: PASS` (886/886, 70 files; tsc, build PASS)
- TODO-020 Tenant detail accepts the live shape (Critical; QA finding on `tenants.get`) — Unit Test Report `execution_overall: PASS` (890/890, 70 files; TODO-009 and TODO-010 regressions PASS)
- TODO-021 Katalog > Permission read-only (High; user decision 2026-10-12) — Unit Test Report `execution_overall: PASS` (909 passed in 75 files (was 917); tsc, eslint PASS)

## In Progress

(none)

## Not Started

- TODO-018 Playwright E2E (Low, deferred)

## Blocked

None.

Gate notes (not a status change):
- TODO-001 starts after Checkpoint B clears. Its blocking questions (OQ-P-01, OQ-P-02) are answered.
- TODO-018 must not start before TODO-010 is Completed (TODO-010 is now Completed; the gate is met).

If a TODO is blocked after it starts, its status changes to `Blocked`, with the reason recorded here.

## Risks

Full register in `implementation-plan.md` -> Risks (PM-RK-01 to PM-RK-14). Highest current risks:
- PM-RK-01 — legacy mock files stop compiling from TODO-002 and their routing breaks from TODO-006. The app is not releasable until TODO-017 is Completed.
- PM-RK-15 — answered 2026-10-10: `@testing-library/dom` added as a devDependency (ADR-007 v1.2). Closed.
- PM-RK-07 — platform gaps SP-BG-01 to SP-BG-11 run on fallbacks.
- Lint debt outside TODO-010 scope (report OQ1): 11 pre-existing errors; may affect the TODO-017 gate `npm run lint`. Non-blocking, not decided here.
- No coverage tool configured (report OQ2): coverage not measurable. Non-blocking, not decided here.
- tsc discrepancy (OQ-P-17): unit-test-writer saw 21 tsc errors in legacy `src/pages/*` outside TODO-011 scope; flagged for follow-up, non-blocking, no decision.
- PM-RK-10 — operator prerequisites gate the smoke test and release.
- QA D-1 (High, remediated pending QA re-run) — live countries and tenant-categories lists failed contract validation on `updated_by: null`. TODO-019 is Completed (2026-10-12) and its unit gate passes. D-1 closes only when the QA C-10 re-run shows no `[contract]` line on `/countries` and `/tenant-categories`.
- TODO-020 (Critical, Completed 2026-10-12) — the live `GET /api/v1/tenants/{id}` response fails the front-end contract because the top-level `tenant_category_id` and `country_code` are absent (nested `tenant_category` and `country` are present). The unit gate passes and TODO-020 is Completed. The QA re-check on the live stack is pending. The QA report does not record this finding yet (OQ-P-63); the finding stays open until the QA re-check is recorded.

## Open Questions

| ID | Question | Blocking | Status |
|----|----------|----------|--------|
| OQ-P-01 | DOM environment and matcher packages for Vitest component tests | No | Answered (jsdom with `@testing-library/jest-dom`; ADR-007 v1.1) |
| OQ-P-02 | Routing library or custom History API routing (FE-OQ-37) | No | Answered (History API path routes; no library) |
| OQ1 (unit-test-report-TODO-010) | 11 pre-existing lint errors outside TODO-010 scope: `src/components/ui/{badge,button,select,sidebar,tabs,toggle}.tsx`, `src/hooks/use-mobile.ts`, `src/hooks/use-pagination.ts`, `src/router/index.tsx`. Recorded only; no decision taken | No | Open (non-blocking; owner decision needed before TODO-017 lint gate) |
| OQ2 (unit-test-report-TODO-010) | No coverage tool is configured, so the 80% guideline cannot be measured. Recorded only; no decision taken | No | Open (non-blocking) |
| OQ-P-12 (TODO-011) | Scope extension pending user confirmation: `src/lib/routes-meta.ts` (tenant.permissions key, required by Record<RouteKey,...> typing) and `src/features/tenants/detail/tenant-detail-page.test.tsx` (useAuth vi.mock) are outside TODO-011 File scope; extended for TODO-012: `src/lib/routes-meta.ts` (keys catalog.tenant-categories, catalog.countries, same typing reason) is also outside TODO-012 File scope; extended for TODO-013: `src/lib/routes-meta.ts` (key catalog.permission, same typing reason) is also outside TODO-013 File scope; extended for TODO-014: `src/lib/routes-meta.ts` (keys team.users, team.user-detail, same typing reason) is also outside TODO-014 File scope; extended for TODO-015: `src/lib/routes-meta.ts` (keys team.roles, team.role-detail, same typing reason) is also outside TODO-015 File scope; extended for TODO-016: `src/lib/routes-meta.ts` (key dashboard) and `src/App.tsx` (root branch rendering LandingPage removed so '/' goes through AppRouter) are also outside TODO-016 File scope; extended for TODO-017: `src/lib/routes-meta.ts` (removed dead legacyRouteMeta block, RouteKey simplified) and `src/components/tenant-bits.tsx` (removed unused BranchCount export), `eslint.config.js` (override for `src/components/ui/**`, OQ-P-60) and `src/hooks/use-mobile.ts` (useSyncExternalStore fix, OQ-P-60) and its new test `src/hooks/use-mobile.test.ts` are also outside TODO-017 File scope; extended for TODO-008 (user decision 2026-10-12, option 1): `src/assets/login/` (untracked brand assets `background.webp` and `logo.png`, loaded by `login-shell.tsx` via `import.meta.glob`) is also outside TODO-008 File scope and is added to the TODO-008 File scope by amendment 2026-10-12 in `master-todo.md` (FP-228, FP-229) | No | Open (non-blocking) |
| OQ-P-13 (TODO-011) | `enabled` field is missing from FE doc 5.4 but present in auth-service Postman; made required in the FE type. Confirm with auth-service | No | Open (non-blocking) |
| OQ-P-14 (TODO-011) | master-permissions list is not client-paginated in the checklist | No | Open (non-blocking) |
| OQ-P-15 (TODO-011) | `active`/`customerPermitted` are optional; inactive permissions are selectable | No | Open (non-blocking) |
| OQ-P-16 (TODO-011) | Empty PUT (no permissions selected) is allowed | No | Open (non-blocking) |
| OQ-P-17 (unit-test-report-TODO-011) | `tsc --noEmit -p tsconfig.app.json` reported 21 errors in legacy `src/pages/*` (outside TODO-011 scope), whereas the TODO-010 report recorded tsc PASS. Discrepancy flagged for follow-up (possibly a different tsconfig or a project reference). Recorded only; no decision taken | No | Answered (resolved by deleting legacy src/pages in TODO-017) |
| OQ-P-18 (TODO-012) | Category description has no max length (implementer default) | No | Open (non-blocking) |
| OQ-P-19 (TODO-012) | Clearing a description on PUT is impossible (empty is omitted; D5.3 has no null) | No | Open (non-blocking) |
| OQ-P-20 (TODO-012) | No write permission keys exist for categories/countries; create/edit/delete are not gated per action (only MASTER_DATA_ACCESS on nav) | No | Open (non-blocking) |
| OQ-P-21 (TODO-012) | Category 409 'code exists' vs 'name exists' is not distinguishable; shown as a form alert | No | Open (non-blocking) |
| OQ-P-22 (TODO-012) | Write-failure helpers are imported from features/tenants/* instead of a shared location (possible cleanup) | No | Open (non-blocking) |
| OQ-P-23 (TODO-013) | TODO text says PUT for edit, but FE doc 5.3, ARCH-FE-001 and Postman use PATCH /master-permissions/{id}; implementer used PATCH with full body (Postman example is partial). Confirm | No | Open (non-blocking) |
| OQ-P-24 (TODO-013) | Edit form falls back to active=true, customerPermitted=false when the server omits them; risk of silent state change (relates to OQ-P-15) | No | Open (non-blocking) |
| OQ-P-25 (TODO-013) | Edit sends "" to clear description; contract unclear on "" vs null | No | Open (non-blocking) |
| OQ-P-26 (TODO-013) | Delete 409 has no contract code; any 409 is shown via describeWriteFailure; mock 'id 1 bound' is an assumption | No | Open (non-blocking) |
| OQ-P-27 (TODO-013) | Key format validated only as non-empty and max 100; no resource:action pattern | No | Open (non-blocking) |
| OQ-P-28 (TODO-013) | Delete confirm wording and 'Boleh dipakai'/'Internal' badge for customerPermitted are implementer display choices | No | Open (non-blocking) |
| OQ-P-29 (TODO-014) | Create button also requires `system_roles:view` in addition to the users create permission (implementer default) | No | Open (non-blocking) |
| OQ-P-30 (TODO-014) | Status transitions offered per current status: suspend from ACTIVE; deactivate from ACTIVE/SUSPENDED; reactivate from SUSPENDED/DEACTIVATED; server decides the final outcome (implementer default) | No | Open (non-blocking) |
| OQ-P-31 (TODO-014) | Reset password remains offered on the user's own account (implementer default) | No | Open (non-blocking) |
| OQ-P-32 (TODO-014) | Reactivate is not hidden on own account; it only appears when own status is not ACTIVE (implementer default) | No | Open (non-blocking) |
| OQ-P-33 (TODO-014) | loginId validated by e-mail pattern only, no length limit (implementer default) | No | Open (non-blocking) |
| OQ-P-34 (TODO-014) | Inactive roles (`active:false`) are still offered in the role dropdown (implementer default) | No | Open (non-blocking) |
| OQ-P-35 (TODO-014) | Role change is available only on the user detail page (implementer default) | No | Open (non-blocking) |
| OQ-P-36 (TODO-014) | Temporary-password toast text is implementer copy; confirm wording | No | Open (non-blocking) |
| OQ-P-37 (TODO-014) | Create user and reset-password e-mail are not idempotent (SP-BG-11); duplicate submission risk accepted pending platform support | No | Open (non-blocking) |
| OQ-P-38 (TODO-014) | Own-account guard is UI only (SP-BG-13); server enforcement is not confirmed | No | Open (non-blocking) |
| OQ-P-39 (TODO-015) | role permission GET/PUT use permission keys (FE doc 5.2); the checklist selects keys and reuses groupPermissions from features/tenants/permissions/checklist.ts (implementer default) | No | Open (non-blocking) |
| OQ-P-40 (TODO-015) | keys held by a role but missing from the master catalogue stay in the selection so save does not drop them (implementer default) | No | Open (non-blocking) |
| OQ-P-41 (TODO-015) | a refusal on the permission PUT also marks the role refused (checklist read-only); D6.6 names only edit and delete (implementer default) | No | Open (non-blocking) |
| OQ-P-42 (TODO-015) | SystemRole `active` is optional in the read schema, the badge is omitted if absent, and the edit form defaults active to true (implementer default) | No | Open (non-blocking) |
| OQ-P-43 (TODO-015) | description is omitted on create and sent as "" on edit (implementer default) | No | Open (non-blocking) |
| OQ-P-44 (TODO-015) | delete of a role with members has no documented error code; generic 409 path is used (implementer default) | No | Open (non-blocking) |
| OQ-P-45 (TODO-015) | the SYS_PRINCIPAL row still links to its read-only detail page (implementer default) | No | Open (non-blocking) |
| OQ-P-46 (TODO-015) | refused-role state is held in the TanStack Query cache under key ['system','roleRefusals'] and cleared by queryClient.clear() on logout (implementer default) | No | Open (non-blocking) |
| OQ-P-47 (TODO-015) | member count shows '-' without system_users:view; legacy `src/pages/tim-peran.tsx` and `tim.peran` meta are left for TODO-017 (implementer default) | No | Answered (legacy src/pages/tim-peran.tsx deleted and tim.peran meta removed by routes-meta cleanup in TODO-017) |
| OQ-P-49 (TODO-016) | staleTime for counts is 30 s; D12.1 asks for a per-resource value (implementer default) | No | Open (non-blocking) |
| OQ-P-50 (TODO-016) | tenant widget title 'Tenant (5 pertama, urutan dari server)' is implementer copy; FE-OQ-22 still open (implementer default) | No | Open (non-blocking) |
| OQ-P-51 (TODO-016) | tenant widget shows name, code, and active status only (implementer default) | No | Open (non-blocking) |
| OQ-P-52 (TODO-016) | 'Tenant aktif' uses is_active=true and assumes server pagination.total honours the filter; unverified against the real service (implementer default) | No | Open (non-blocking) |
| OQ-P-53 (TODO-016) | master-data widgets are gated by me.role === SYS_PRINCIPAL, not by permission keys (implementer default) | No | Open (non-blocking) |
| OQ-P-54 (TODO-016) | no dashboard entry in src/test/handlers/index.ts (it would shadow list handlers); tests install dashboardCountHandlers via server.use (implementer default) | No | Open (non-blocking) |
| OQ-P-55 (TODO-016) | sidebar badge is a plain number without extra accessible name or live region (implementer default) | No | Open (non-blocking) |
| OQ-P-56 (TODO-016) | counts are not polled (implementer default) | No | Open (non-blocking) |
| OQ-P-57 (TODO-016) | tenants key shape is duplicated in dashboard-queries.ts because keyFiltersOf is private to the list page (implementer default) | No | Open (non-blocking) |
| OQ-P-58 (TODO-016) | non-SYS_PRINCIPAL users see LandingPage inside the dashboard page (implementer default) | No | Open (non-blocking) |
| OQ-P-59 (TODO-016) | TODO-016 File scope lists 'src/test/handlers/index.ts (add entry)' but no entry was added on purpose (OQ-P-54: it would shadow list handlers). The plan owner may amend the TODO text; File scope was not edited by project_manager. User to decide | No | Open (non-blocking) |
| OQ-P-60 (TODO-017) | `npm run lint` fails with 7 pre-existing errors in files outside TODO-017 scope: react-refresh/only-export-components in `src/components/ui/{badge,button,select,sidebar,tabs,toggle}.tsx`; react-hooks/set-state-in-effect at `src/hooks/use-mobile.ts:14`. TODO-017 gate requires lint PASS. User decision needed: fix the 7 files, or add an `eslint.config.js` override for `src/components/ui/**` and `use-mobile.ts` | No | Answered (2026-10-12): user chose an ESLint override for `src/components/ui/**` in `eslint.config.js` plus a `useSyncExternalStore` fix in `src/hooks/use-mobile.ts`. Both files are recorded as scope extensions (see OQ-P-12) |
| OQ-P-61 (TODO-017) | `npm run typecheck` runs `tsc --noEmit` on a root tsconfig with no files, so it checks nothing; `tsc -b` (inside `npm run build`) is the real type check | No | Open (non-blocking) |
| OQ-P-62 (TODO-017, FE-OQ-28) | Bundle measurement: JS 54 files 819,822 B raw / 273,186 B gzip; initial load 561,047 B raw (~174,900 B gzip); CSS 119,960 B raw / 21,555 B gzip; fonts 10 woff2 275,940 B (two-family question open). No budget set | No | Open (non-blocking) |
| OQ-UT-19-01 (unit-test-report-TODO-019) | `catalog.test.ts` is in TODO-019 File scope, but no `updated_by: null` test was added there; the two list tests are in `reference.test.ts` (TODO-009 file). Is a test required in `catalog.test.ts`? Documented default: not required; `catalog.test.ts` is unchanged and passes | No | Open (non-blocking) |
| OQ-UT-19-02 (unit-test-report-TODO-019) | No coverage provider is installed (`@vitest/coverage-v8` missing), so coverage is not measured for TODO-019. Documented default: recorded as not measured; no package change in this TODO | No | Deferred (non-blocking) |
| OQ-UT-19-03 (unit-test-report-TODO-019) | Tenant-category create and update responses also parse through `TenantCategoryWireSchema`, so they now accept `updated_by: null`; no write-response test covers null. Documented default: outside the TODO-019 test requirement; add with a future write-path test if wanted | No | Open (non-blocking) |
| UT-014-1 (unit-test-report-TODO-014) | Line coverage was not measured (no coverage tool configured; relates to OQ2). Recorded only; no decision taken | No | Open (non-blocking) |
| OQ-P-48 (unit-test-report-TODO-015) | A mounted `useRefusedRoles` consumer keeps a stale value if `queryClient.clear()` runs without unmounting. Not a defect today: logout leaves the protected screens. Line coverage was also not measured (relates to UT-014-1 and OQ2). Recorded only; no decision taken | No | Open (non-blocking) |
| OQ-P-63 (TODO-020) | The QA report `output/reports/qa-report-validate.md` does not record the new CONTRACT finding on `tenants.get` reported 2026-10-12. Its C-8 row records `GET /api/v1/tenants/{id}` 200 and its summary records tenant detail reads as working. QA owner to record the finding or confirm it was resolved. The `social_links` presence question is answered (user confirmed on 2026-10-12 that the live body contains the key). The row stays open until the QA re-check is recorded. Recorded only; no decision taken | No | Open (non-blocking; QA owner to record) |
| OQ-P-03 to OQ-P-11 | See `implementation-plan.md` -> Open Questions | No | Open |

Blocking open questions: 0.
