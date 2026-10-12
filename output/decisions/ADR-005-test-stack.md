---
id: ADR-005
title: Test stack with Vitest, React Testing Library and MSW
owner: decision_manager
status: Approved
version: 1.0
decision_date: 2026-10-10
last_updated: 2026-10-10
artifact_kind: target
candidate_label: ADR-FE-05
decision_owner: user
source_requirements: [RAG-FE-SP-001, REQ-FE-042, REQ-FE-050]
related_artifacts: [ARCH-FE-001, ADR-001, ADR-002, ADR-007]
blocking_open_questions: 0
---

ADR ID: ADR-005

Title: Test stack with Vitest, React Testing Library and MSW

Owner: decision_manager (recorder); decision owner: user

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate)

Version: 1.0

Decision Date: 2026-10-10

Last Updated: 2026-10-10

Candidate Label: ADR-FE-05 (ARCH-FE-001 v1.0, Table 4 row SD-11; D19; A-23 to A-25)

Source Requirements: RAG-FE-SP-001; REQ-FE-042; REQ-FE-050

Related Artifacts: ARCH-FE-001 v1.0 (D19, A-23, A-24, A-25, Table 4 SD-11, Table 5); ADR-001; ADR-002; ADR-007

## At a Glance

- Adopts Vitest for unit and component tests, React Testing Library 16.x, and MSW 2.x for API integration tests. Playwright is planned after the Tenants integration works, not in the initial phase.
- Status: Approved by the user at the Checkpoint B gate (2026-10-10). Blocking open questions: 0. Open non-blocking items: FE-OQ-31, FE-OQ-34. DM-09 (MSW) is confirmed by this approval. The DOM environment (jsdom with `@testing-library/jest-dom`) is an amendment of candidate ADR-FE-05, recorded at the same gate.
- Key references: ARCH-FE-001 D19 and Table 4 SD-11; `.claude/rules/tech-stack-frontend.md` Testing Standard.

## Purpose

Fix the test runner and API-mocking tools, and the test layers and their timing, so that the mandatory tests of REQ-FE-050 and the acceptance mapping of REQ-FE-042 have a defined tool set.

## Scope

In scope: unit and component runner, component test library, API mocking library, test layers and E2E timing.

Out of scope: the coverage gate (the 80% target is a guideline in the standard), CI wiring, the exact package versions (pinned in the TODO that installs them).

## References

- ARCH-FE-001 v1.0: D19 (testing strategy and layer table), A-23, A-24, A-25, Table 4 SD-11, Table 5 (test packages not installed).
- `output/clarifications.md`: FE-OQ-12 (answered by the user, 2026-10-10; MSW was not addressed by the user and is adopted by default).
- `.claude/rules/tech-stack-frontend.md`: Testing Standard; Capability Matrix (MSW 2.x mandatory for API tests; Playwright conditional for critical journeys).

## Context

The standard allows Vitest or Jest 29 with React Testing Library and MSW. It mandates MSW for API integration tests and makes Playwright conditional. The repository has no test tooling installed. The project already builds with Vite.

## Problem Statement

Choose the test tools and the order in which test layers are added. The choice determines how the client pipeline and the screens are tested before a running backend is available.

## Options Considered

### Option 1 - Vitest, React Testing Library 16.x, MSW 2.x; Playwright after Tenants integration (accepted)

Pros (as recorded in ARCH-FE-001):
- Vitest shares the Vite configuration (A-23, D19).
- MSW keeps integration tests on the wire format of the FE document (A-24).
- Playwright follows the first working integration, so the initial phase is unit, component and MSW tests (A-25).

Cons (as recorded in ARCH-FE-001):
- No E2E coverage in the initial phase (FE-OQ-34).
- The MSW adoption is a default that the user did not address (DM-09).

### Option 2 - Jest 29 with React Testing Library and MSW

Cons (as recorded in ARCH-FE-001 A-23): would need a separate transform setup next to the Vite configuration.

### Option 3 - Playwright from the initial phase

Cons (as recorded in ARCH-FE-001 A-25): the initial phase would depend on a working integration that does not yet exist.

Hand-written `fetch` mocks were also considered for API mocking and rejected (A-24).

## Decision

- Unit and component runner: Vitest.
- Component tests: React Testing Library 16.x.
- API integration tests: MSW 2.x, adopted by default (D19; to be confirmed through DM-09).
- Mandatory unit tests: `lib/api/client.ts` (single-flight refresh, 401 then refresh then retry once, 204, error mapping, forbidden-header rule) (REQ-FE-050).
- Static source checks in CI (D19 table): no `localStorage` or `sessionStorage` for auth; no `X-User-ID`, `X-Role`, `X-Tenant-ID` or `X-Service-Token` string in `src`; no `dangerouslySetInnerHTML`; no `VITE_*` secret name.
- Test data: MSW handlers and fixtures are written from the FE document examples and the contract. They never import from `src/data`, which is removed from runtime.
- E2E: Playwright, planned after the Tenants module integration works. Not in the initial phase.
- Exact versions are pinned in the TODO that installs them.
- DOM environment for component tests: `jsdom`, with `@testing-library/jest-dom` for DOM matchers. `happy-dom` is not used. Purpose, justification and the package record are in ADR-007 v1.1.

Amendment note (OQ-P-01): the DOM environment above amends candidate ADR-FE-05 (ARCH-FE-001 v1.0, Table 4 SD-11). The user chose it at the Checkpoint B gate on 2026-10-10. It is an amendment of the candidate, not a new decision. ARCH-FE-001 v1.0 Table 5 does not list these packages.

## Justification

Justification as recorded in ARCH-FE-001 Table 4 SD-11 and D19: the standard permits Vitest; the coordinator direction (FE-OQ-12) adopts it; MSW is adopted by default because the standard mandates it for API integration tests. A-23, A-24 and A-25 record the alternatives.

## Consequences

### Positive

- One test configuration shared with the build.
- Integration tests run against the FE document's wire format without a running backend.
- The mandatory client tests (REQ-FE-050) have a defined runner.

### Negative

- No E2E tests in the initial phase. Critical journeys are covered only after the Tenants integration.
- The MSW choice is a default until the user confirms it (DM-09).
- The coverage target is a guideline (80%). No CI gate is defined in ARCH-FE-001.
- Packages must be installed and pinned in a TODO (Table 5).

## Related Artifacts

- ARCH-FE-001 v1.0: D19, A-23, A-24, A-25, Table 4 SD-11, Table 5, ADR candidate ADR-FE-05.
- Requirements: REQ-FE-042, REQ-FE-050.
- Related ADRs: ADR-001 (Vitest shares the Vite configuration); ADR-002 (client unit tests); ADR-007 (installation of the test packages).
- Impacted plans: none exists yet. Impacted work: the TODO that installs and configures the test stack and writes the `lib/api/client.ts` tests.

## Change History

| Version | Date | Change | Recorded by |
|---------|------|--------|-------------|
| 0.1 | 2026-10-10 | Recorded at `/decision` from ARCH-FE-001 v1.0 (Pending Approval) | decision_manager |
| 1.0 | 2026-10-10 | Approved by the user at the Checkpoint B gate. DM-09 (MSW 2.x) confirmed. DOM environment recorded: jsdom with `@testing-library/jest-dom`, not happy-dom (amendment of candidate ADR-FE-05, OQ-P-01). Packages in ADR-007 v1.1 | decision_manager, on user approval |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| ADR-005:OQ1 | DM-09: confirm MSW 2.x as the API mocking tool (adopted by default; D19 says to confirm it in ADR-FE-05) | The standard mandates MSW for API integration tests; the user did not address it | Integration test tooling | user | No | Answered | Answered 2026-10-10 by user approval of this ADR at the Checkpoint B gate: MSW 2.x confirmed (D19, A-24). DM-09 answered |
| ADR-005:OQ2 | FE-OQ-34: when and where are automated accessibility checks and E2E tests added? | Conditional standard items (D16, D19) | Test automation | architect_frontend, qa | No | Open | Documented default: Playwright after the Tenants integration works; accessibility checked manually in QA until automated checks are decided |
| ADR-005:OQ3 | FE-OQ-31: verify the master-data and auth-service E-01 and E-02 paths end to end | Tenant create outcomes (RK-FE-06); integration test planning | Integration tests for tenant create | architect_frontend, master-data and auth-service architects | No | Open | Documented default: the FE handles every `admin_account` outcome (D8.2); verify before the integration test |

Blocking open questions: 0.
