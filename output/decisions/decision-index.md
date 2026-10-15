---
id: DECISION-INDEX
title: Decision Index
owner: decision_manager
status: Approved
version: 1.3
last_updated: 2026-10-14
source_requirements: [RAG-FE-SP-001]
related_artifacts: [ARCH-FE-001, TODO-022, TODO-023, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, OPEN-DECISIONS, DECISION-TRACEABILITY-MATRIX]
blocking_open_questions: 0
---

Title: Decision Index

Owner: decision_manager

Status: Approved

Approved: v1.3, 2026-10-14 (user, Checkpoint B gate for TODO-023). Previously approved: v1.2, 2026-10-14 (user, Checkpoint B gate for TODO-022). Earlier: v1.1, 2026-10-10 (user, Checkpoint B gate).

Version: 1.3

Last Updated: 2026-10-14

Change: 2026-10-14 v1.3 — Approved by the user at the Checkpoint B gate for TODO-023 (2026-10-14); DM-15 confirmed (ARCH-FE-001 v1.0.6 needs no ADR). Version stays 1.3; no content change.

Change: 2026-10-14 v1.3 — TODO-023 / ARCH-FE-001 v1.0.6 assessed at /decision: no net-new ADR (see decision-index.md, section ADR Assessment for ARCH-FE-001 v1.0.6). Content changed, so status is Pending Approval until the user approves the Checkpoint B gate for TODO-023. Next ADR number stays ADR-008.

Change: 2026-10-14 v1.2 — TODO-022 / ARCH-FE-001 v1.0.5 assessed at /decision: no net-new ADR (see decision-index.md, section ADR Assessment for ARCH-FE-001 v1.0.5). Next ADR number stays ADR-008.

Change: 2026-10-14 v1.2 — Approved by the user at the Checkpoint B gate for TODO-022 (2026-10-14); DM-14 confirmed (ARCH-FE-001 v1.0.5 needs no ADR). Version stays 1.2; no content change.

Source Requirements: RAG-FE-SP-001 ("[FE Requirement] system-principal-web v1.0")

Related Artifacts: ARCH-FE-001 v1.0, v1.0.5 and v1.0.6 (Approved 2026-10-14); TODO-022; TODO-023; ADR-001 to ADR-007; `open-decisions.md`; `decision-traceability-matrix.md`

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
- ARCH-FE-001 v1.0.5 / TODO-022 (2026-10-14): no ADR (see ADR Assessment).
- ARCH-FE-001 v1.0.6 / TODO-023 (2026-10-14): no ADR (see ADR Assessment for v1.0.6).
- Conflicts: none among ADR-001 to ADR-007. Deviations from the tech-stack-frontend standard are recorded as deviations in ADR-001, ADR-002 and ADR-004 (see the traceability matrix, section 3).
- Approval: 2026-10-10 by the user at the Checkpoint B gate. ADR-001 is version 1.0.2 (wording and status corrections after approval). ADR-002 and ADR-004 are version 1.0.1 (status corrections). ADR-003, ADR-005 and ADR-006 are version 1.0. ADR-007 is version 1.2 (v1.1 amended before approval, OQ-P-01; v1.2 added `@testing-library/dom` on the user's gate answer).

## Document Notes

- ARCH-FE-001 front-matter reads `Approved`, version 1.0. Its Version History and Change Log end at v0.2. Recorded as DM-03 in `open-decisions.md`. decision-manager does not edit ARCH-FE-001.

## ADR Assessment for ARCH-FE-001 v1.0.5 (TODO-022)

Assessed 2026-10-14 at /decision for TODO-022 (REQ-FE-052, REQ-FE-053; ARCH-FE-001 D4.10, D13.1; user approval "Setuju v1.0.5", 2026-10-14). Result: **no ADR needed. No ADR created. Next ADR number remains ADR-008.**

| Candidate | Why it is not an ADR | Where it is already decided |
|-----------|----------------------|-----------------------------|
| Flag `OTHER_ACCOUNT_SESSIONS_ENABLED = false` | A feature suspension, not a technology or pattern choice. One exported boolean constant, no new dependency, no deviation from `tech-stack-frontend.md`, no feature-flag library or runtime config mechanism. Flip condition (SP-BG-14 Closed) and the flip route (a new ARCH-FE-001 amendment) are fixed by the user in FE-OQ-39 (Answered) | ARCH-FE-001 D4.10, REQ-FE-032, REQ-FE-052, FE-OQ-39, BG-13 |
| Shared module `features/team/shared/guard-failure.ts` | Code organisation inside the existing feature structure. It applies ADR-002 rule 8 and the REQ-FE-008 rule (branch on `status` and `code`, never on message text); it adds no new rule. No dependency, no standard deviation | ARCH-FE-001 D13.1, REQ-FE-053, FE-OQ-40 (Answered) |
| Fixed Indonesian copy and the 409/503 fallthrough rule on Tim IT pages | A product and UX decision recorded by the user, scoped to system account and system role pages. It supersedes SP-BG-13 "No FE code change" and the v1.0.3 D6.6 line, inside ARCH-FE-001. The copy deck stays under FE-OQ-22 (Open, non-blocking) | ARCH-FE-001 D13, D13.1, FE-OQ-22 |

Existing ADRs are unaffected: ADR-002 (client and error shape), ADR-003 (server state) and ADR-004 (login) are not changed, superseded or conflicted. No conflict, duplicate or superseded ADR found. The conclusion is recorded as DM-14 in `open-decisions.md`; the user confirmed it on 2026-10-14 (Answered/Closed).

## ADR Assessment for ARCH-FE-001 v1.0.6 (TODO-023)

Assessed 2026-10-14 at /decision for TODO-023 (REQ-FE-054; changed REQ-FE-030, REQ-FE-031, REQ-FE-039; ARCH-FE-001 D6.4, D6.6, D7, D13.1a; FE-OQ-41, FE-OQ-42; gate cleared by the user 2026-10-14). Result: **no ADR needed. No ADR created. Next ADR number remains ADR-008.**

| Candidate | Why it is not an ADR | Where it is already decided |
|-----------|----------------------|-----------------------------|
| Remove the "Hapus" action from system account pages (list row and detail) | Removes a UI action. No new dependency, no new technology or pattern, no deviation from `tech-stack-frontend.md`. It is a product decision by the user (reason: auth-service `DELETE /system-users/{id}` only sets `DEACTIVATED`, same as deactivate). Role, tenant category and country delete are unchanged | ARCH-FE-001 REQ-FE-054, D6.4, D7 |
| Explanatory text in the Tangguhkan and Nonaktifkan confirm dialogs; old text and toast removed | Copy and UX inside existing confirm dialogs (D11). No rule added | ARCH-FE-001 REQ-FE-054, REQ-FE-039 |
| `deleteSystemUser` stays in the API module; `system_users:delete` stays in the catalogue and role checklist; no `canDelete` gate | Code retention and a documented default, answered by the user. Re-adding the action needs a later ARCH-FE-001 amendment, not an ADR | FE-OQ-41 (Answered), REQ-FE-054, D6.4 |
| D13.1a: guard codes reachable per remaining account action; tests do not assert `PLATFORM_ROLE_PROTECTED` on suspend or deactivate | Test scope clarification. Applies ADR-002 rule 8 and REQ-FE-008 (branch on `status` and `code`) without changing them | FE-OQ-42 (Answered), D13.1a |

Existing ADRs are unaffected: ADR-002 (client and error shape), ADR-003 (server state; the D12.1 invalidation row for system user delete is removed inside ARCH-FE-001) and ADR-004 (login) are not changed, superseded or conflicted. No conflict, duplicate or superseded ADR found. The conclusion is recorded as DM-15 in `open-decisions.md` (Answered/Closed 2026-10-14, confirmed by the user).

## Open Questions

None. Blocking open questions: 0. Open items are listed in `open-decisions.md`.
