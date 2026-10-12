---
id: DECISION-INDEX
title: Decision Index
owner: decision_manager
status: Approved
version: 1.1
last_updated: 2026-10-10
source_requirements: [RAG-FE-SP-001]
related_artifacts: [ARCH-FE-001, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, OPEN-DECISIONS, DECISION-TRACEABILITY-MATRIX]
blocking_open_questions: 0
---

Title: Decision Index

Owner: decision_manager

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate)

Version: 1.1

Last Updated: 2026-10-10

Source Requirements: RAG-FE-SP-001 ("[FE Requirement] system-principal-web v1.0")

Related Artifacts: ARCH-FE-001 v1.0; ADR-001 to ADR-007; `open-decisions.md`; `decision-traceability-matrix.md`

## At a Glance

- Catalog of the seven ADRs recorded for the SP web at Checkpoint B (candidates ADR-FE-01 to ADR-FE-07 of ARCH-FE-001 v1.0).
- All seven are Approved by the user at the Checkpoint B gate (2026-10-10). ADR-007 is approved as amended in version 1.2. Blocking open questions: 0.
- Next ADR number: ADR-008. Numbers are sequential and are never reused.

## Purpose

Primary discovery mechanism for the project's decisions in this repository. Use it to find an ADR, its candidate label, its status and its open items.

## Scope

This repository (`output/decisions/`). The platform repository (`../Microservices/gaia-platform-architecture/output/decisions/`) has its own ADR numbering (ADR-001 to ADR-009). Cite platform decisions with the platform prefix, for example "Platform ADR-009". The same numbers in the two repositories are different decisions.

## References

- ARCH-FE-001 v1.0 (`output/architecture/ARCH-FE-001.md`), ADR Candidates table.
- `output/plans/orchestration-state.md`, Checkpoint A gate log (2026-10-10) and Checkpoint B gate (user approval, 2026-10-10).
- `output/decisions/open-decisions.md`.
- `output/decisions/decision-traceability-matrix.md`.

## ADR Catalog

| ADR ID | Candidate label | Title | File | Status | Decision date | Decision owner | ARCH-FE-001 basis | Blocking open | Open or deferred (non-blocking) |
|--------|-----------------|-------|------|--------|---------------|----------------|-------------------|---------------|---------------------------------|
| ADR-001 | ADR-FE-01 | Base frontend stack (v1.0.2) | `ADR-001-base-frontend-stack.md` | Approved | 2026-10-10 | user | D0, D1.3, Table 4 SD-01 to SD-06 | 0 | none open |
| ADR-002 | ADR-FE-02 | HTTP client as a fetch-based pipeline without Axios (v1.0.1) | `ADR-002-fetch-http-client.md` | Approved | 2026-10-10 | user | D3, Table 4 SD-08 | 0 | 3 open |
| ADR-003 | ADR-FE-03 | Server state with TanStack Query; forms with React Hook Form and Zod | `ADR-003-server-state-and-forms.md` | Approved | 2026-10-10 | user | D9, D12, Table 4 SD-07, SD-09 | 0 | 1 open, 1 deferred |
| ADR-004 | ADR-FE-04 | First-party platform login as the standard exception to NextAuth (v1.0.1) | `ADR-004-first-party-login-exception.md` | Approved | 2026-10-10 | user | D4, D15, Table 4 SD-10 | 0 | 4 open (DM-02 is a non-blocking follow-up) |
| ADR-005 | ADR-FE-05 | Test stack with Vitest, React Testing Library and MSW | `ADR-005-test-stack.md` | Approved | 2026-10-10 | user | D19, Table 4 SD-11; DOM environment amendment (OQ-P-01) | 0 | 2 open |
| ADR-006 | ADR-FE-06 | Same-origin path routing for staging and production | `ADR-006-same-origin-topology.md` | Approved | 2026-10-10 | user | D1.1, D1.2, FE-OQ-01 | 0 | 4 open |
| ADR-007 | ADR-FE-07 | Runtime dependency set and removals (v1.2) | `ADR-007-runtime-dependency-set.md` | Approved | 2026-10-10 | user | D1.3, D15, Table 4 SD-12, Table 5; v1.1 and v1.2 dev packages (OQ-P-01; gate answer 2026-10-10) | 0 | 3 open, 1 deferred |

Totals: 7 ADRs. Approved: 7. Pending Approval: 0. Blocking open questions: 0.

## Label Mapping

| ARCH-FE-001 candidate | ADR ID | File |
|-----------------------|--------|------|
| ADR-FE-01 | ADR-001 | `ADR-001-base-frontend-stack.md` |
| ADR-FE-02 | ADR-002 | `ADR-002-fetch-http-client.md` |
| ADR-FE-03 | ADR-003 | `ADR-003-server-state-and-forms.md` |
| ADR-FE-04 | ADR-004 | `ADR-004-first-party-login-exception.md` |
| ADR-FE-05 | ADR-005 | `ADR-005-test-stack.md` |
| ADR-FE-06 | ADR-006 | `ADR-006-same-origin-topology.md` |
| ADR-FE-07 | ADR-007 | `ADR-007-runtime-dependency-set.md` |

## Relationships

- ADR-001 (stack) sets the Zod 4 and TypeScript versions used by ADR-003 and ADR-005.
- ADR-002 (client) and ADR-004 (login) share the 401 and refresh rules.
- ADR-003 (server state) disables automatic retry, consistent with ADR-002.
- ADR-004 (login) depends on ADR-006 (same-origin cookie).
- ADR-007 (dependencies) records the packages added by ADR-003 and ADR-005.
- ADR-005 and ADR-007 (v1.1 and v1.2): the DOM environment (jsdom with `@testing-library/jest-dom`) is an amendment of candidate ADR-FE-05 (ADR-005). The packages are recorded as devDependencies in ADR-007 v1.1 and v1.2; `@testing-library/dom`, the peer of React Testing Library 16.x, was added in v1.2.

## Numbering and History

- ADR numbers assigned in this run: ADR-001 to ADR-007, sequential, in candidate order. No number is skipped or reused.
- No `output/decisions/` directory existed before this run. No prior ADR, no duplicate and no superseded or deprecated ADR.
- Conflicts: none among ADR-001 to ADR-007. Deviations from the tech-stack-frontend standard are recorded as deviations in ADR-001, ADR-002 and ADR-004 (see the traceability matrix, section 3).
- Approval: 2026-10-10 by the user at the Checkpoint B gate. ADR-001 is version 1.0.2 (wording and status corrections after approval). ADR-002 and ADR-004 are version 1.0.1 (status corrections). ADR-003, ADR-005 and ADR-006 are version 1.0. ADR-007 is version 1.2 (v1.1 amended before approval, OQ-P-01; v1.2 added `@testing-library/dom` on the user's gate answer).

## Document Notes

- ARCH-FE-001 front-matter reads `Approved`, version 1.0. Its Version History and Change Log end at v0.2. Recorded as DM-03 in `open-decisions.md`. decision-manager does not edit ARCH-FE-001.

## Open Questions

None. Blocking open questions: 0. Open items are listed in `open-decisions.md`.
