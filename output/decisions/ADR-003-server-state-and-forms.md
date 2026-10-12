---
id: ADR-003
title: Server state with TanStack Query and forms with React Hook Form and Zod
owner: decision_manager
status: Approved
version: 1.0
decision_date: 2026-10-10
last_updated: 2026-10-10
artifact_kind: target
candidate_label: ADR-FE-03
decision_owner: user
source_requirements: [RAG-FE-SP-001, REQ-FE-016, REQ-FE-029, REQ-FE-038, REQ-FE-043, REQ-FE-048, REQ-FE-049]
related_artifacts: [ARCH-FE-001, ADR-001, ADR-002, ADR-004, ADR-007]
blocking_open_questions: 0
---

ADR ID: ADR-003

Title: Server state with TanStack Query and forms with React Hook Form and Zod

Owner: decision_manager (recorder); decision owner: user

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate)

Version: 1.0

Decision Date: 2026-10-10

Last Updated: 2026-10-10

Candidate Label: ADR-FE-03 (ARCH-FE-001 v1.0, Table 4 rows SD-07 and SD-09; D9; D12; D12.1; D12.2)

Source Requirements: RAG-FE-SP-001; REQ-FE-016; REQ-FE-029; REQ-FE-038; REQ-FE-043; REQ-FE-048; REQ-FE-049

Related Artifacts: ARCH-FE-001 v1.0 (D9, D12, D12.1, D12.2, D12.3, A-08, A-12); ADR-001; ADR-002; ADR-004; ADR-007

## At a Glance

- Adopts the two mandatory standard tools for the data layer: TanStack Query 5 for server state and React Hook Form with the Zod resolver for every form. Both are in the standard's Capability Matrix.
- Status: Approved by the user at the Checkpoint B gate (2026-10-10). Blocking open questions: 0. Open or deferred non-blocking items: FE-OQ-30, DM-13.
- Key references: ARCH-FE-001 D9, D12, D12.1 (invalidation map), Table 4 SD-07 and SD-09.

## Purpose

Fix how server data is cached, invalidated and how forms are validated, so that every screen follows one rule set for freshness and input checks.

## Scope

In scope: server-state library and rules, the mutation-to-query invalidation map, cache cleanup on logout, the form library and resolver, and the form schema location.

Out of scope: the HTTP pipeline (ADR-002), the global auth view state (React context, FE-OQ-30 default), the installation and pinning of packages (ADR-007 and the TODO that adds them).

## References

- ARCH-FE-001 v1.0: D9 (forms and validation), D12 (state), D12.1 (query keys and invalidation table), D12.2 (logout and client defaults), D12.3 (optimistic updates), A-08, A-12, Table 4 SD-07 and SD-09.
- `output/clarifications.md`: FE-OQ-08 and FE-OQ-10 (answered by the user, 2026-10-10).
- `.claude/rules/tech-stack-frontend.md`: Server State Standard; Form Validation Standard; Capability Matrix (both mandatory).

## Context

Both tools are mandatory in the standard. Neither is installed in the repository yet (Table 5 lists them as "Not installed"). The repository's mock code manages data without a server-state library.

## Problem Statement

Choose the server-state and form mechanisms for every API-backed screen. The choice sets how freshness after writes is guaranteed and how validation is written.

## Options Considered

### Option 1 - TanStack Query 5 and React Hook Form with `@hookform/resolvers` (zod adapter) (accepted)

Pros (as recorded in ARCH-FE-001 and the standard):
- Mandatory standard. The standard names caching, synchronization, error handling and retry as the reasons (Server State Standard).
- One invalidation map (D12.1) defines what each mutation refreshes.
- Form schemas are Zod 4 and stay library-independent (D9).

Cons (as recorded in ARCH-FE-001):
- Three runtime packages to install and pin (Table 5).
- The resolver version must support Zod 4 (D9).
- The library's default retry must be switched off so that D3.1 holds for cached reads (D12.2).

### Option 2 - Custom cache and native form state

Pros: no added dependency.

Cons (as recorded in ARCH-FE-001 A-08): a custom cache would have to meet the same invalidation and retry rules by hand.

## Decision

- Server state: TanStack Query 5. Keys per resource come from `lib/query/keys.ts` (D12.1). Every mutation invalidates the affected key families through the table in D12.1. Logout clears the whole cache (`queryClient.clear()`, D12.2).
- Query client defaults (D12.2): automatic retry off, so no automatic retry of reads (D3.1); window-focus refetch off in v1; no persister, so cache contents are never written to storage.
- No optimistic updates for writes that touch auth-replicated state, such as tenant `is_active` (D12.3). Other writes are not optimistic in v1 either.
- `staleTime` is set per resource in the TODO that adds the query, not in this ADR (DM-13).
- Global auth view state uses React context (FE-OQ-30 default). The access token is not held in the query cache (D4.1).
- Forms: React Hook Form with `@hookform/resolvers` (zod adapter) for every form in scope (D9 lists the forms). Each feature keeps its Zod 4 schema in `features/<name>/schema.ts`. A `400 VALIDATION_ERROR` or `VALIDATION_FAILED` message is shown as one form-level alert. Field errors come only from the client schema (D9).

## Justification

Justification as recorded in ARCH-FE-001 Table 4: SD-07 is adopted as the mandatory standard (FE-OQ-08); SD-09 is adopted as the mandatory standard for every form (FE-OQ-10). A-08 rejects a custom cache because it would meet the same rules by hand. A-12 adopts the resolver for every form and keeps the schemas independent of the library (D9).

## Consequences

### Positive

- One invalidation rule set for freshness (D12.3 names the table as the single rule).
- The no-retry rule (D3.1) is enforced for cached reads by the query client defaults (D12.2).
- Form schemas are reusable and testable without the form library (D9).

### Negative

- Each new mutation must add its row to the D12.1 table. ARCH-FE-001 defines no automated check for this.
- Three packages must be installed and pinned in a TODO. The resolver version must be verified against Zod 4.
- Query-key discipline is required (`lib/query/keys.ts`). A key outside its family breaks the prefix invalidation of D12.1.

## Related Artifacts

- ARCH-FE-001 v1.0: D9, D12, D12.1, D12.2, D12.3, A-08, A-12, Table 4 SD-07 and SD-09, ADR candidate ADR-FE-03.
- Requirements: REQ-FE-016, REQ-FE-029, REQ-FE-038, REQ-FE-043, REQ-FE-048, REQ-FE-049.
- Related ADRs: ADR-001 (Zod 4); ADR-002 (no automatic retry); ADR-004 (logout and cache clearing); ADR-007 (dependency set for the installed packages).
- Impacted plans: none exists yet. Impacted work: the TODO that installs the query and form libraries (Table 5); the TODO that creates `lib/query/keys.ts` and the invalidation map.

## Change History

| Version | Date | Change | Recorded by |
|---------|------|--------|-------------|
| 0.1 | 2026-10-10 | Recorded at `/decision` from ARCH-FE-001 v1.0 (Pending Approval) | decision_manager |
| 1.0 | 2026-10-10 | Approved by the user at the Checkpoint B gate. No other change. FE-OQ-30 remains Open and DM-13 Deferred (non-blocking) | decision_manager, on user approval |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| ADR-003:OQ1 | FE-OQ-30: global state library (React context, Zustand or Redux Toolkit) | The standard requires a documented project decision for global state (D12, A-09) | Global state code | architect_frontend, user | No | Open | Documented default: React context for auth view state only. Zustand and Redux Toolkit are presented for the project decision, not self-selected |
| ADR-003:OQ2 | DM-13: `staleTime` per resource | Freshness of cached lists and detail views | Query code | architect_frontend | No | Deferred | Documented default: set per resource in the TODO that adds the query (D12) |

Blocking open questions: 0.
