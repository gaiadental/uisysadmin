---
id: UTR-TODO-016
title: Unit Test Report TODO-016
owner: unit_test_writer
status: Pending Approval
version: 1.0
last_updated: 2026-10-12 09:45
related_todo: TODO-016
execution_overall: PASS
source_requirements: [REQ-FE-018, REQ-FE-019, REQ-FE-037, REQ-FE-038]
related_artifacts: [ARCH-FE-001, ADR-003, TODO-016]
blocking_open_questions: 0
---

Title: Unit Test Report TODO-016 (Dashboard and sidebar badges)
Owner: unit_test_writer
Status: Pending Approval
Version: 1.0
Last Updated: 2026-10-12 09:45
Source Requirements: REQ-FE-018, REQ-FE-019, REQ-FE-037, REQ-FE-038
Related Artifacts: ARCH-FE-001 v1.0 (D7, D8.1, D12.1), ADR-003, TODO-016, FP-207..FP-213

## At a Glance

- Tests for the dashboard counts and tenant widget, the sidebar badges, MetricCard states and the `/` route. The TODO-016 gate (counts from `pagination.total`, sidebar badges, widgets hidden without SYS_PRINCIPAL) passes.
- Overall PASS. 862/862 in the full suite, no regressions (TODO-009..015 included).
- References: ARCH-FE-001 D7/D12.1, OQ-P-49..58 (non-blocking implementer defaults).

## Purpose

Verify TODO-016 behaviour and record scope, coverage, edge cases and mocking.

## Scope

In TODO file scope only: `src/features/dashboard/`, `src/components/metric-card.tsx`, `src/app/navigation.ts`, `src/components/app-sidebar.tsx`, `src/app/router.tsx` (`/`), `src/App.tsx` (root), `src/test/handlers/dashboard.ts`. No production code was changed. Stack: frontend (Vitest, React Testing Library, MSW).

## Test Cases

Implementer-authored (reviewed; none found to pass by construction. The no-request tests wait 50 ms and assert an empty `seen` list while the same handlers would record a request for SYS_PRINCIPAL, and the badge and count tests assert exact values from distinct totals 12/9/4/7):
- `dashboard-page.test.tsx` (11): counts from `pagination.total` of `limit=1`, `is_active=true`, loading, one failed count keeps the others, D12.1 tenant refetch, PageResult cache shape, limit=5 and server-order label, empty, list alert, hidden without SYS_PRINCIPAL, no session, removed surfaces.
- `app-sidebar-badges.test.tsx` (6): badge keys on three items only, totals beside the items, shared requests, none without SYS_PRINCIPAL, failed count, no failed-event or session badge.

Added by unit-test-writer (39 tests, 3 new files):
- `src/features/dashboard/dashboard-gaps.test.tsx` (29):
  - Each of the four counts failing alone (it.each): alert on that card only, other three and the tenant list ready, no number on the failed card.
  - A held count stays in loading (role status) while the others are ready, then resolves; a real 0 shows as 0 (not loading or error).
  - Exact request shape: three `limit=1` counts, one `is_active=true`, one `limit=5` list, nothing else.
  - Tenant widget: rows keep the server order (reversed fixture, no client sort); no "latest", "terbaru" or "terakhir" on the page; list loading message while pending; failed list leaves the four counts ready.
  - Non-SYS_PRINCIPAL (SYS_ADMIN with permissions, TENANT_ADMIN, empty role): neutral Beranda page, no cards, no status, no request; removed surfaces absent.
  - D12.1: every count is cached under the family its write invalidates; `tenantCategoryWrite`, `countryWrite` and `tenantCreate` refetch the counts (and the tenant entries where the map says so); `countryWrite` updates sidebar badge and card together; dashboard plus sidebar share one request per resource.
  - Sidebar: no number while loading then totals; failed tenants, categories, countries each remove only that badge (it.each); 0 shows as a badge; SYS_ADMIN with every master-data permission gets no badge and no request; exactly three numeric badges and no event or housekeeping entry; no request before the session is authenticated.
- `src/components/metric-card.test.tsx` (5): default ready, 0 when ready, loading role=status hides value, error role=alert hides value, label and hint kept in every state.
- `src/features/dashboard/root-route.test.tsx` (5): `/` access is a session route with no gates; `/` renders the dashboard through `App` for SYS_PRINCIPAL; neutral landing for SUPPORT; signed-out visitor goes to `/login`; `App.tsx` source has no `LandingPage` reference.

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | npx vitest run |
| Run at | 2026-10-12 09:44 |
| Total | 862 (68 files) |
| Passed | 862 |
| Failed | 0 |
| Errors | 0 |
| Skipped | 0 |
| Overall | PASS |

TODO-016 scope alone: 5 files, 56 tests, all passed. Baseline before additions: 823 tests in 65 files.

## Execution Results

862 tests passed.

Regressions: none. TODO-009..015 suites (tenants, catalog, categories/countries, permissions, sessions, system users, system roles) pass inside the full run.

Static checks:
- `npx tsc --noEmit -p tsconfig.app.json`: 21 error lines, all in legacy `src/pages/*` (OQ-P-17). Zero in TODO-016 scope or in the new tests (one first draft error in `root-route.test.tsx` for node types and an unused import was fixed in the test).
- `npx eslint` on `src/features/dashboard`, `metric-card.tsx`, `metric-card.test.tsx`, `app-sidebar.tsx`, `navigation.ts`, `router.tsx`, `App.tsx`, `src/test/handlers`: clean.

## Handoff (FAIL only)

Not applicable (PASS).

## Coverage

No coverage run was requested or configured, so no percentage is recorded and the 80 percent guideline is not verified numerically. Behavioural coverage against the TODO gate: counts from `pagination.total` (all four, each with its own loading, error and ready state), limit=5 widget with server-order label, sidebar badges (ready, loading, failed, zero, non-SYS_PRINCIPAL), widgets and requests absent without SYS_PRINCIPAL, removed SP-BG-08 surfaces absent, D12.1 invalidation, MetricCard state roles, `/` route and App root.

## Edge Cases

Zero totals, one failed count among four, held (slow) request, failed list with ready counts, empty list, reversed server order, role with permissions but not SYS_PRINCIPAL, empty role, no session, anonymous status with a populated `me`, signed-out visitor at `/`.
Idempotency: not applicable (read-only queries).

## Mocking Strategy

MSW handlers `dashboardCountHandlers` from `src/test/handlers/dashboard.ts` through `server.use`, with per-test overrides and held requests via a promise gate. `useAuth` mocked per file. Fresh `QueryClient` per test, cleared on teardown. `matchMedia` stubbed for the sidebar.

## Observations (no production change made)

- `master-todo.md` File scope lists `src/test/handlers/index.ts (add entry)`; the implementer did not add one (OQ-P-54, a default entry would shadow the list handlers). Tests install the handlers per test. Left as is.
- `tenantCategoryWrite` and `countryWrite` also invalidate the tenants family (D12.1), so tenant counts refetch after a category or country write. Tests assert this as designed.
- Sidebar badge has no accessible name or live region (OQ-P-55); no test asserts one.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ-P-49..58 | Implementer defaults for TODO-016 (staleTime 30 s, widget title copy, widget fields, active filter honoured by server, role gate, handlers not in index, badge a11y, no polling, tenants key shape duplicated, LandingPage for non-principal) | Behaviour is covered as written | None for tests | project-manager | No | Open | Tested as documented defaults (OQ-P-50, 52, 53, 54, 58 each have a test) |
