---
id: OPEN-DECISIONS
title: Open Decisions Register
owner: decision_manager
status: Approved
version: 1.1
last_updated: 2026-10-10
related_artifacts: [ARCH-FE-001, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, CLARIFICATIONS, DECISION-INDEX]
blocking_open_questions: 0
---

Title: Open Decisions Register

Owner: decision_manager

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate)

Version: 1.1

Last Updated: 2026-10-10

Source Requirements: RAG-FE-SP-001 ("[FE Requirement] system-principal-web v1.0")

Related Artifacts: ARCH-FE-001 v1.0; ADR-001 to ADR-007; `output/clarifications.md`; `output/decisions/decision-index.md`

## At a Glance

- Tracks every unresolved item for the SP web decisions: 24 ARCH-FE-001 rows (FE-OQ-14 to FE-OQ-37), of which FE-OQ-37 is answered on 2026-10-10 and 23 remain Open; and 13 items found at `/decision` (DM-01 to DM-13), of which 5 are answered at approval, 2 are Deferred and 6 are Open.
- Blocking = Yes: 0. Every item is non-blocking. Items for the user: DM-02 (security review follow-up for ADR-004, Open, Blocking No). DM-01 is answered (user approval as the sole approver).
- Documented defaults come from ARCH-FE-001 unless the row says that no default is recorded. This register does not resolve any item.

## Purpose

Single register of open decisions, open questions and deferred items. It is the list that the orchestrator's clarifications roll-up must match (see DM-04).

## Scope

Covers the SP web repository (`output/`). The FE-OQ-01 to FE-OQ-13 rows are answered in ARCH-FE-001 and are not repeated here.

## References

- ARCH-FE-001 v1.0, Open Questions table (status column) and ADR Candidates.
- `output/clarifications.md` (roll-up, v0.2).
- `output/plans/orchestration-state.md` (Open Questions line; gate log).
- ADR-001 to ADR-007 (linked per row).
- `.claude/rules/artifact-standards.md` (Open Questions table format and Status values).

## Open Decisions from ARCH-FE-001 (status Open)

| ID | Question | Owner | Blocking | Status | Documented default (ARCH-FE-001) | Linked ADR |
|----|----------|-------|----------|--------|----------------------------------|------------|
| FE-OQ-14 | `me.role`: FE doc section 4 writes `SYSTEM_PRINCIPAL`; the platform value is `SYS_PRINCIPAL`. Confirm the FE value | architect_frontend, FE doc owner | No | Open | `me.role = SYS_PRINCIPAL` (platform ARCH-SEC-001 section 9.2 c). FE doc wording to be corrected | none (D6.2) |
| FE-OQ-15 | Master-data visibility: FE doc says "show always"; SP-DEC-01 narrows it to SYS_PRINCIPAL. Confirm | user | No | Open | SP-DEC-01 applies. Revisit when platform SEC-OQ-02 is decided | none (D6.2) |
| FE-OQ-16 | Default sort order of `GET /api/v1/tenants` is not in the contract | architect_frontend, master-data architect | No | Open | Server order; labelled without "latest" | none (D8.1) |
| FE-OQ-17 | Is `key` immutable on PATCH of system roles and master permissions? | auth-service architect_backend | No | Open | `key` read-only in edit forms and sent unchanged | none (D6.2) |
| FE-OQ-18 | Which 401 code does an expired access token return at the gateway and at auth-service? | architect_frontend, auth-service architect_backend | No | Open | `UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED` trigger refresh; verify with a live expired token before the first integration test | ADR-002, ADR-004 |
| FE-OQ-19 | Which URL does the reset e-mail contain? | auth-service architect_backend, ops | No | Open | `/reset-password?token=` on the SP origin | ADR-004 |
| FE-OQ-20 | CSP, frame, referrer and image policy for the static host; sibling-host analysis for the fallback | security_architect, ops | No | Open | Proposal in D15. Blocking only if the security decision changes the design | ADR-006 |
| FE-OQ-21 | Browser storage and idle timeout policy | security_architect | No | Open | Theme preference only in storage; no idle logout in v1 | ADR-004 |
| FE-OQ-22 | UI language and error copy (Indonesian, keyed by `code`). Approve the copy deck | user, product | No | Open | Indonesian copy for the codes named in the FE doc; server `message` only where D13 says so | none (D13) |
| FE-OQ-23 | v1 navigation scope: are the removed mock surfaces out of v1? | user, product | No | Open | REMOVE-V1 as in Table 2 | none (Table 2) |
| FE-OQ-24 | Does the mock "Fitur aktif" map to the tenant Permissions tab? | user, product | No | Open | Yes; the Permissions tab replaces it; mock flags removed | none (D7) |
| FE-OQ-25 | Can the own account change its own system role in the UI? | user | No | Open | Hidden in the UI | none (D6.6) |
| FE-OQ-26 | Idempotency for non-idempotent public writes (BG-11) | architect_backend (platform) | No | Open | No automatic retry in the FE; in-flight disable; `409` handled | ADR-002 |
| FE-OQ-27 | Client error reporting sink for production | ops, user | No | Open | Console and reference id in development. A sink must exist before the first production deployment | none (D18) |
| FE-OQ-28 | Bundle budget and the second font family | architect_frontend | No | Open | Budget set after the first measured production build; keep one font family after the design owner decides | ADR-007 |
| FE-OQ-29 | Minimum supported viewport and phone widths | user, product | No | Open | Desktop-first; no phone layout commitment | none (D16) |
| FE-OQ-30 | Global state library: React context, Zustand or Redux Toolkit | architect_frontend, user | No | Open | React context for auth view state only | ADR-003 |
| FE-OQ-31 | Verify master-data and auth-service E-01 and E-02 paths end to end (master-data `api-reference.md` v1.3 still lists B-02 as Open) | architect_frontend, master-data and auth-service architects | No | Open | FE handles every outcome (D8.2); verify before the integration test | ADR-005 |
| FE-OQ-32 | Routing of backend gaps BG-01 to BG-11 to platform TODOs | solution_architect | No | Open | Routed as in Table 3; not designed here. See DM-01 (stage 1 is Cancelled) | none (Table 3) |
| FE-OQ-33 | Expose `X-Correlation-ID` to cross-origin SP pages (BG-10) | apigateway architect_backend | No | Open | Not needed in the recommended topology; request id shown as fallback (D3.2) | ADR-006 |
| FE-OQ-34 | Automated accessibility checks and E2E tests: when and where? | architect_frontend, qa | No | Open | Playwright after the Tenants integration works; accessibility checked manually in QA until decided | ADR-005 |
| FE-OQ-35 | Per-category and per-country tenant counts (N+1 requests) | user, product | No | Open | Removed in v1 | none (Table 2) |
| FE-OQ-36 | Domain names for the staging and production SP hosts and the gateway host | ops | No | Open | `system.<env-domain>` per environment. Infrastructure decision | ADR-006 |
| FE-OQ-37 | Routing library for path routes, or custom History API routing | architect_frontend, user | No | Answered | Answered 2026-10-10 (user, OQ-P-02): History API path routes. No routing library. ADR-001 OQ2 closed; no ADR-001 amendment | ADR-001 |

## Items Found at /decision (DM-01 to DM-13)

These items are not rows in ARCH-FE-001. They were found while recording the ADRs. decision-manager records them and does not resolve them. Status changes below record answers given by the user at the Checkpoint B gate (2026-10-10).

| ID | Item | Source | Owner | Blocking | Status | Documented default or action | Linked ADR |
|----|------|--------|-------|----------|--------|------------------------------|------------|
| DM-01 | Approval set for non-standard decisions. The tech-stack-frontend Escalation Rule names architect_frontend and solution_architect as approvers. solution_architect (stage 1) is Cancelled for this repository | `.claude/rules/tech-stack-frontend.md`; orchestration-state stage 1 | user | No | Answered | Answered 2026-10-10: user approval recorded at Checkpoint B, 2026-10-10; solution_architect is Cancelled for this repository. The user accepts their own approval as the sole approver. Decision owner is the user (ARCH-FE-001 ADR Candidates); architect_frontend owns ARCH-FE-001 | ADR-001, ADR-002, ADR-004 |
| DM-02 | Security review input on ADR-004. tech-stack-frontend and tech-stack-security escalation triggers list non-standard authentication and security exceptions. Stage 2 (security-architect) is Cancelled for this repository; PLATFORM ARCH-SEC-001 governs the mechanism. ARCH-FE-001 records 0 Blocking open questions | `.claude/rules/tech-stack-security.md`; ARCH-FE-001 FE-OQ-11 owners | user, security_architect | No | Open | ADR-004 approved by the user at Checkpoint B (2026-10-10). Follow-up, non-blocking: security review of the first-party login exception. Record the review here when it is done. Stays Open until then | ADR-004 |
| DM-03 | ARCH-FE-001 document history. The front-matter reads `Approved`, version 1.0. The Version History and the Change Log end at v0.2. ARCH-FE-001 FE-OQ-37 (row and D10) still shows the routing library as not chosen; the answer of 2026-10-10 (OQ-P-02) is recorded here and in ADR-001 only | ARCH-FE-001 front-matter, Version History, Change Log, FE-OQ-37 row, D10 | architect_frontend | No | Open | architect_frontend adds the v1.0 entry and records the FE-OQ-37 answer in ARCH-FE-001. decision-manager does not edit ARCH-FE-001 | ADR-001 to ADR-007 (basis) |
| DM-04 | Open-question roll-up is incomplete. ARCH-FE-001 has 24 rows that were Open at v1.0 (FE-OQ-14 to FE-OQ-37). `orchestration-state.md` names only FE-OQ-36 and FE-OQ-37. `clarifications.md` lists FE-OQ-14 to FE-OQ-31 by range and omits FE-OQ-32 to FE-OQ-35 | `output/clarifications.md`; `output/plans/orchestration-state.md` | orchestrator | No | Open | This register lists all 24 rows (FE-OQ-37 now Answered). The orchestrator updates `clarifications.md` and the orchestration-state Open Questions line | none |
| DM-05 | Dependency audit mechanism. D15 and RK-FE-10 cite FE-OQ-34 for the audit in CI. FE-OQ-34 covers accessibility checks and E2E only | ARCH-FE-001 D15 (Dependencies row), RK-FE-10 | architect_frontend | No | Open | No default recorded in ARCH-FE-001 | ADR-007 |
| DM-06 | Risk assessment per dependency. SD-12 names purpose, justification and risk as the standard requirement. Table 5 records use, justification and decision, with no risk column. Also applies to `jsdom`, `@testing-library/jest-dom` (ADR-007 v1.1) and `@testing-library/dom` (ADR-007 v1.2) | ARCH-FE-001 Table 4 SD-12; Table 5; ADR-007 v1.2 | architect_frontend | No | Open | No default recorded in ARCH-FE-001 | ADR-007 |
| DM-07 | Topology variant wording. FE-OQ-01 reads "Same-site" and names same-origin path routing as the recommended variant. The variant the user chose is not stated separately | `output/clarifications.md` FE-OQ-01 | user | No | Answered | Answered 2026-10-10 by the user's approval of ADR-006: same-origin path routing (ARCH-FE-001 D1.2) is the recorded variant | ADR-006 |
| DM-08 | Host header passthrough. The apigateway owner confirms the production reverse proxy passes the Host header as the host-table key. Not a FE-OQ row and no blocking status recorded. RK-FE-16 is Medium likelihood and High impact | ARCH-FE-001 Dependencies; RK-FE-16 | apigateway architect_backend | No | Open | No default recorded in ARCH-FE-001 | ADR-006 |
| DM-09 | MSW 2.x adoption by default. D19 adopts MSW by default and says to confirm it in ADR-FE-05. The user did not address MSW (FE-OQ-12) | ARCH-FE-001 D19; FE-OQ-12 | user | No | Answered | Answered 2026-10-10 by the user's approval of ADR-005: MSW 2.x confirmed (ARCH-FE-001 D19, A-24) | ADR-005 |
| DM-10 | Confirmation of the Table 5 removals. FE-OQ-13 says the proposed removals need explicit confirmation at the gate. The gate log records them as to be applied in the first TODO that touches `package.json` | `output/clarifications.md` FE-OQ-13; orchestration-state gate log | user | No | Answered | Answered 2026-10-10 by the user's approval of ADR-007 v1.2 (removals unchanged from v1.1): removals as in Table 5; `@tanstack/react-table` stays conditional | ADR-007 |
| DM-11 | Orchestrator readings to confirm. FE-OQ-05 (Base UI) and FE-OQ-11 (first-party login) are recorded as orchestrator readings marked "confirm at the gate". The Checkpoint A approval text ("Setujui keduanya") approves ARCH-FE-001 as a whole | `output/clarifications.md`; orchestration-state gate log | user | No | Answered | Answered 2026-10-10 by the user's approval of ADR-001 (Base UI) and ADR-004 (first-party login) | ADR-001, ADR-004 |
| DM-12 | Theme sources. `next-themes` (for Sonner) and the app's `theme-provider` (key `theme`) are two theme sources | ARCH-FE-001 Table 5 | architect_frontend | No | Deferred | Keep both until the theme TODO; remove `next-themes` if it becomes unused | ADR-007 |
| DM-13 | `staleTime` per resource | ARCH-FE-001 D12 | architect_frontend | No | Deferred | Set per resource in the TODO that adds each query | ADR-003 |

## Summary

| Measure | Value |
|---------|-------|
| Rows from ARCH-FE-001 (FE-OQ-14 to FE-OQ-37) | 24: 23 Open; FE-OQ-37 Answered (2026-10-10) |
| Items found at /decision (DM-01 to DM-13) | 13: 5 Answered (DM-01, DM-07, DM-09, DM-10, DM-11); 2 Deferred (DM-12, DM-13); 6 Open (DM-02 to DM-06 and DM-08) |
| Blocking = Yes | 0 |
| Items for the user | DM-02 (non-blocking security review follow-up) |

## Open Questions

None. Blocking open questions: 0. Rows with Status Open remain open items; Answered rows record the 2026-10-10 answers.
