---
id: OPEN-DECISIONS
title: Open Decisions Register
owner: decision_manager
status: Approved
version: 1.3
last_updated: 2026-10-14
related_artifacts: [ARCH-FE-001, TODO-022, TODO-023, ADR-001, ADR-002, ADR-003, ADR-004, ADR-005, ADR-006, ADR-007, CLARIFICATIONS, DECISION-INDEX]
blocking_open_questions: 0
---

Title: Open Decisions Register

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

Related Artifacts: ARCH-FE-001 v1.0, v1.0.5 and v1.0.6; TODO-022; TODO-023; ADR-001 to ADR-007; `output/clarifications.md`; `output/decisions/decision-index.md`

## At a Glance

- Tracks every unresolved item for the SP web decisions: 24 ARCH-FE-001 rows (FE-OQ-14 to FE-OQ-37), of which FE-OQ-37 is answered on 2026-10-10 and 23 remain Open; and 15 items found at `/decision` (DM-01 to DM-15), of which 7 are answered at approval, 2 are Deferred and 6 are Open. Since v1.0.5 (2026-10-14) FE-OQ-39 and FE-OQ-40 are Answered in ARCH-FE-001, and since v1.0.6 (2026-10-14) FE-OQ-41 and FE-OQ-42 are Answered (see the added sections below).
- Blocking = Yes: 0. Every item is non-blocking. Item for the user: DM-02 (security review follow-up for ADR-004, Open, Blocking No). DM-15 (no ADR for ARCH-FE-001 v1.0.6) is Answered/Closed, confirmed by the user on 2026-10-14. DM-14 (no ADR for ARCH-FE-001 v1.0.5) is Answered/Closed, confirmed by the user on 2026-10-14. DM-01 is answered (user approval as the sole approver).
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

## Items Found at /decision (DM-01 to DM-15)

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
| DM-14 | ADR assessment of ARCH-FE-001 v1.0.5 (TODO-022): the flag `OTHER_ACCOUNT_SESSIONS_ENABLED`, the shared module `guard-failure.ts`, the fixed copy and the 409/503 fallthrough rule | ARCH-FE-001 v1.0.5 (REQ-FE-052, REQ-FE-053, D4.10, D13.1); `decision-index.md` ADR Assessment | user | No | Answered | Answered/Closed 2026-10-14: the user confirmed at the /decision gate that v1.0.5 needs no ADR. decision-manager conclusion: no net-new ADR; all three items are decided inside ARCH-FE-001 by the user's approval of 2026-10-14. No ADR created; next number stays ADR-008 | none |
| DM-15 | ADR assessment of ARCH-FE-001 v1.0.6 (TODO-023): removal of the "Hapus" action on system account pages, explanatory text in the Tangguhkan and Nonaktifkan dialogs, `deleteSystemUser` kept unused in the API module, D13.1a guard-code reachability | ARCH-FE-001 v1.0.6 (REQ-FE-054, D6.4, D13.1a, FE-OQ-41, FE-OQ-42); `decision-index.md` ADR Assessment for v1.0.6 | user | No | Answered | Confirmed by the user on 2026-10-14: v1.0.6 needs no ADR (Closed). Original assessment: confirm that v1.0.6 needs no ADR. decision-manager conclusion: no net-new ADR; it removes a UI action and adds no dependency, standard deviation or new technology rule. All items are decided inside ARCH-FE-001 by the user's approval of 2026-10-14. No ADR created; next number stays ADR-008. Closed 2026-10-14 by the user at the Checkpoint B gate for TODO-023 | none |

## ARCH-FE-001 v1.0.5 rows (added 2026-10-14)

Rows below are in ARCH-FE-001 v1.0.5 and are mirrored here for visibility. Their answers live in ARCH-FE-001; this register does not resolve them.

| ID | Question | Owner | Blocking | Status | Answer or default (ARCH-FE-001) | Linked ADR |
|----|----------|-------|----------|--------|--------------------------------|------------|
| FE-OQ-22 | UI language and error copy (existing row, updated in v1.0.5) | user, product | No | Open | The six guard-failure strings in D13.1 are fixed by the user (2026-10-14); the rest of the copy deck stays open | none (D13, D13.1) |
| FE-OQ-39 | Final contract for `/api/v1/system-users/{id}/sessions` once SP-BG-14 is Closed, and who flips `OTHER_ACCOUNT_SESSIONS_ENABLED` | auth-service architect_backend, architect_frontend | No | Answered | User 2026-10-14: the flag stays `false` until SP-BG-14 is Closed in the platform `clarifications.md`, then a new ARCH-FE-001 amendment flips it. Not TODO-022. Follow-up watch item: SP-BG-14 (platform, Open) | none (D4.10) |
| FE-OQ-40 | Do the guard-failure messages apply to tenant role paths; which pages are account and role pages | auth-service architect_backend, user | No | Answered | User 2026-10-14: system account pages and system role pages only; tenant role paths keep current handling | none (D13.1) |

## ARCH-FE-001 v1.0.6 rows (added 2026-10-14)

Rows below are in ARCH-FE-001 v1.0.6 and are mirrored here for visibility. Their answers live in ARCH-FE-001; this register does not resolve them.

| ID | Question | Owner | Blocking | Status | Answer or default (ARCH-FE-001) | Linked ADR |
|----|----------|-------|----------|--------|--------------------------------|------------|
| FE-OQ-41 | Does `system_users:delete` stay in the role permission matrices and auth-service seed data now that the UI never uses it; does auth-service plan to change `DELETE /system-users/{id}` | auth-service architect_backend, user | No | Answered | User 2026-10-14: default adopted. The permission stays in the catalogue and the role checklist unchanged (no FE filtering); `deleteSystemUser` stays in the API module; re-add the UI action only through a later amendment if the server gains a real delete | none (D6.4, REQ-FE-054) |
| FE-OQ-42 | Does the platform document `PLATFORM_ROLE_PROTECTED` for suspend or deactivate of a SYS_PRINCIPAL holder by a non-principal actor | auth-service architect_backend | No | Answered | User 2026-10-14: default adopted. Tests use role change or reset password for this code; suspend and deactivate tests do not assert it | none (D13.1a) |

## Summary

| Measure | Value |
|---------|-------|
| Rows from ARCH-FE-001 (FE-OQ-14 to FE-OQ-37) | 24: 23 Open; FE-OQ-37 Answered (2026-10-10) |
| Rows added by v1.0.5 (FE-OQ-39, FE-OQ-40) | 2: both Answered (2026-10-14). FE-OQ-22 stays Open |
| Rows added by v1.0.6 (FE-OQ-41, FE-OQ-42) | 2: both Answered (2026-10-14) |
| Items found at /decision (DM-01 to DM-15) | 15: 7 Answered (DM-01, DM-07, DM-09, DM-10, DM-11, DM-14, DM-15); 2 Deferred (DM-12, DM-13); 6 Open (DM-02 to DM-06 and DM-08) |
| Blocking = Yes | 0 |
| Items for the user | DM-02 (non-blocking security review follow-up). DM-14 and DM-15 closed 2026-10-14 |

## Open Questions

None. Blocking open questions: 0. Rows with Status Open remain open items; Answered rows record the 2026-10-10 answers.
