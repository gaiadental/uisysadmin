---
id: ADR-004
title: First-party platform login as the standard exception to NextAuth
owner: decision_manager
status: Approved
version: 1.0.1
decision_date: 2026-10-10
last_updated: 2026-10-10
artifact_kind: target
candidate_label: ADR-FE-04
decision_owner: user
source_requirements: [RAG-FE-SP-001, REQ-FE-005, REQ-FE-006, REQ-FE-009, REQ-FE-010, REQ-FE-011, REQ-FE-012, REQ-FE-013, REQ-FE-014, REQ-FE-015, REQ-FE-016, REQ-FE-017]
related_artifacts: [ARCH-FE-001, ADR-002, ADR-003, ADR-006, PLATFORM-ARCH-SEC-001, AUTH-ARCH-SEC-001, AUTH-ARCH-SEC-003]
blocking_open_questions: 0
---

ADR ID: ADR-004

Title: First-party platform login as the standard exception to NextAuth

Owner: decision_manager (recorder); decision owner: user

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate)

Version: 1.0.1

Decision Date: 2026-10-10

Last Updated: 2026-10-10

Candidate Label: ADR-FE-04 (ARCH-FE-001 v1.0, Table 4 row SD-10; D4; D15; A-22)

Source Requirements: RAG-FE-SP-001; REQ-FE-005, REQ-FE-006, REQ-FE-009 to REQ-FE-017

Related Artifacts: ARCH-FE-001 v1.0 (D4.1 to D4.12, D15, C-02, C-03, A-02, A-03, A-22, Table 4 SD-10); ADR-002; ADR-003; ADR-006; PLATFORM ARCH-SEC-001 (section 9.2 c); AUTH ARCH-SEC-001 (sections 3, 8); AUTH ARCH-SEC-003 (section 10)

## At a Glance

- The SP web uses the platform's own login: an access token from `POST /api/v1/auth/login` held in memory, and the platform refresh cookie. NextAuth is not used. This is a standard exception on authentication.
- Status: Approved by the user at the Checkpoint B gate (2026-10-10). Blocking open questions: 0. The security review is a non-blocking follow-up, recorded as DM-02 (Open, Blocking No) in `open-decisions.md`.
- Key references: ARCH-FE-001 D4 and D15; Table 4 SD-10; `.claude/rules/tech-stack-frontend.md` Authentication Standard; `.claude/rules/tech-stack-security.md` Authentication Standards.

## Purpose

Fix the authentication mechanism for the SP web, including the token holder, refresh behaviour across tabs, and logout, so that the session is governed by one authority.

## Scope

In scope: login, token holding, refresh, logout, password flows and session screens as they depend on the mechanism (REQ-FE-005, REQ-FE-006, REQ-FE-009 to REQ-FE-017).

Out of scope: the platform's refresh rotation, reuse detection and revocation (owned by auth-service and cited here); the security headers and CSP (ADR-006, FE-OQ-20); the 401 handling in the HTTP pipeline (ADR-002).

## References

- ARCH-FE-001 v1.0: D4.1 (token holder), D4.2 (boot), D4.3 (refresh across tabs), D4.4 (401 policy), D4.5 to D4.10 (flows), D4.11 (storage), D4.12 (CSRF), D15 (controls), C-02 and C-03 (trust is consumed, reuse detection is mandatory), A-02, A-03, A-22, Table 4 SD-10.
- Platform, cited by ARCH-FE-001 (read-only, not re-read by decision-manager for this ADR): PLATFORM ARCH-SEC-001 section 9.2 c (`SYS_PRINCIPAL` maps to the edge role `SYSTEM_PRINCIPAL`); AUTH ARCH-SEC-001 sections 3 and 8 (refresh rotation, reuse detection, revocation); AUTH ARCH-SEC-003 section 10 (cookie attributes and name `gaia_rt_sys`); AUTH ADR-001 (RS256), as cited in SD-10.
- `.claude/rules/tech-stack-frontend.md`: Authentication Standard; Capability Matrix (NextAuth 5 beta, mandatory for protected applications).
- `.claude/rules/tech-stack-security.md`: Authentication Standards (OIDC or OAuth 2.0 preferred).

## Context

The standard's Capability Matrix names NextAuth (Auth.js) 5 beta for protected applications, with OIDC or OAuth 2 flows preferred. The platform already issues the access token and the refresh cookie. Its auth-service owns refresh rotation, reuse detection and revocation (cited in ARCH-FE-001). No OIDC or OAuth provider is in scope for the SP web (A-22).

## Problem Statement

Choose the authentication mechanism for the SP web. The standard default would add a second session layer in front of a platform that already has one, and that layer would need its own reuse detection and revocation.

## Options Considered

### Option 1 - First-party platform login (accepted)

Pros (as recorded in ARCH-FE-001 SD-10 and A-22):
- Platform login is the decided mechanism (AUTH ADR-001 RS256, PLATFORM ARCH-SEC-001, ARCH-BE-003, as cited).
- The platform keeps one owner for reuse detection and revocation.
- The standard's storage, CSRF and cookie rules are met by D4 and D15.

Cons (as recorded in ARCH-FE-001):
- An exception to a mandatory authentication standard item. A security review input is recorded as DM-02.
- The FE carries cross-tab refresh serialisation (D4.3) and the residual risk in RK-FE-01.

### Option 2 - NextAuth (Auth.js) 5 beta with an OIDC or OAuth provider (standard)

Pros: the standard default. OIDC is preferred by the standard.

Cons (as recorded in ARCH-FE-001 SD-10 and A-22): needs an OIDC or OAuth provider in scope, and none exists. A second session layer would duplicate reuse detection and revocation, which the platform owns.

## Decision

The SP web uses the platform's first-party login:

- The access token comes from `POST /api/v1/auth/login` and is held in a module-level memory holder only (D4.1). It is not in storage, not in React state and not in a cookie.
- The refresh token is the platform cookie `gaia_rt_sys` (HttpOnly, Secure, SameSite=Strict, host-only, path `/api/v1/auth/refresh`). The FE never reads or sets it (REQ-FE-006).
- Refresh is single-flight in a tab and serialised across tabs with `navigator.locks` (lock `sp-session-refresh`). The lock is held until the response, including `Set-Cookie`, has arrived (D4.3).
- Logout clears the token and cache, calls the logout endpoint best effort, and broadcasts a logout signal on the BroadcastChannel `sp-session`. Tokens are never sent to another tab (D4.8).
- NextAuth is not used.

## Justification

Justification as recorded in ARCH-FE-001 Table 4 SD-10: platform login is the decided mechanism; no OIDC or OAuth provider is in scope; a second session layer would duplicate reuse detection and revocation; the standard's storage, CSRF and cookie rules are met by D4 and D15. C-03 records that reuse detection is mandatory on the platform and cannot be turned off, which is why the FE serialises refresh calls (D4.3) rather than relying on a grace window (A-03).

## Consequences

### Positive

- One session authority (the platform) for issue, rotation, reuse detection and revocation.
- No client-side session library to keep in step with the platform.
- Refresh behaviour is fully specified in D4.2 to D4.4 and testable (D19).

### Negative

- Exception to the mandatory authentication standard. Security review input is recorded as DM-02.
- Where `navigator.locks` is unavailable, only in-tab single-flight applies. Residual risk RK-FE-01 is Medium on those browsers.
- Access token is lost on reload and refreshed at boot (RK-FE-12, accepted).
- Logout in one tab leaves other tabs' access tokens usable for up to 30 seconds at the edge (RK-FE-13; AUTH ARCH-SEC-001 section 2.5 as cited).
- Depends on the same-origin cookie (ADR-006). Under the fallback topology the SameSite limit applies to sibling hosts (D4.12).

## Related Artifacts

- ARCH-FE-001 v1.0: D4, D15, C-02, C-03, A-02, A-03, A-22, Table 4 SD-10, ADR candidate ADR-FE-04.
- Requirements: REQ-FE-005, REQ-FE-006, REQ-FE-009 to REQ-FE-017.
- Related ADRs: ADR-002 (401 policy and client pipeline); ADR-003 (cache clearing on logout); ADR-006 (same-origin cookie).
- Platform, cited only: PLATFORM ARCH-SEC-001 (section 9.2 c); AUTH ARCH-SEC-001 (sections 3, 8); AUTH ARCH-SEC-003 (section 10); AUTH ADR-001. These are not duplicated here.
- Impacted plans: none exists yet. Impacted work: the TODO that builds the token holder and refresh module (`lib/api/refresh.ts`) and the login, change-password and reset flows.

## Change History

| Version | Date | Change | Recorded by |
|---------|------|--------|-------------|
| 0.1 | 2026-10-10 | Recorded at `/decision` from ARCH-FE-001 v1.0 (Pending Approval) | decision_manager |
| 1.0 | 2026-10-10 | Approved by the user at the Checkpoint B gate. FE-OQ-11 and DM-11 answered. DM-02 remains Open as a non-blocking follow-up (security review later). No other change | decision_manager, on user approval |
| 1.0.1 | 2026-10-10 | Status correction: ADR-004:OQ6 (DM-01) changed from Open to Answered on the user's gate answer (user approval as the sole approver; solution_architect is Cancelled for this repository). DM-02 remains Open. No decision changed | decision_manager |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| ADR-004:OQ1 | FE-OQ-11: accept first-party login as the standard exception to NextAuth. Recorded as an orchestrator reading in `clarifications.md`. Confirm | Mandatory standard item; trust-related | Authentication module (D4) | user, security_architect | No | Answered | Answered 2026-10-10 by user approval of this ADR at the Checkpoint B gate: accepted as the standard exception (SD-10). DM-11 answered |
| ADR-004:OQ2 | DM-02: security review input for a non-standard authentication approach. Stage 2 (security-architect) is Cancelled for this repository, and PLATFORM ARCH-SEC-001 governs the mechanism | Tech-stack-frontend and tech-stack-security escalation triggers list non-standard authentication and security exceptions | Approval record for this ADR | user, security_architect | No | Open | Approved 2026-10-10 by the user at the Checkpoint B gate. Security review follows later as a non-blocking follow-up. Stays Open until the security review is recorded (follow-up item DM-02 in `open-decisions.md`) |
| ADR-004:OQ3 | FE-OQ-18: which 401 code does an expired access token return? | Refresh trigger set (D4.4) | Refresh behaviour | architect_frontend, auth-service architect_backend | No | Open | Documented default: `UNAUTHORIZED`, `INVALID_TOKEN`, `SESSION_ENDED` trigger refresh. Verify with a live expired token before the first integration test |
| ADR-004:OQ4 | FE-OQ-19: which URL does the reset e-mail contain? | Reset page route (D4.7) | Reset flow end to end | auth-service architect_backend, ops | No | Open | Documented default: `/reset-password?token=` on the SP origin |
| ADR-004:OQ5 | FE-OQ-21: browser storage and idle timeout policy | Session UX (D4.11, D15) | Inactivity logout | security_architect | No | Open | Documented default: theme preference only in storage; no idle logout in v1 |
| ADR-004:OQ6 | DM-01: approval set for a non-standard authentication approach (tech-stack-frontend Escalation Rule) | Approval record | Approval of this ADR | user | No | Answered | Answered 2026-10-10: user approval recorded at Checkpoint B, 2026-10-10; solution_architect is Cancelled for this repository. The user accepts their own approval as the sole approver. DM-01 answered |

Blocking open questions: 0.
