---
id: ADR-006
title: Same-origin path routing for staging and production
owner: decision_manager
status: Approved
version: 1.0
decision_date: 2026-10-10
last_updated: 2026-10-10
artifact_kind: target
candidate_label: ADR-FE-06
decision_owner: user
source_requirements: [RAG-FE-SP-001, REQ-FE-001, REQ-FE-002, REQ-FE-003, REQ-FE-006, REQ-FE-044, REQ-FE-047]
related_artifacts: [ARCH-FE-001, ADR-002, ADR-004, "PLATFORM-ADR-009"]
blocking_open_questions: 0
---

ADR ID: ADR-006

Title: Same-origin path routing for staging and production

Owner: decision_manager (recorder); decision owner: user

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate)

Version: 1.0

Decision Date: 2026-10-10

Last Updated: 2026-10-10

Candidate Label: ADR-FE-06 (ARCH-FE-001 v1.0, D1.1, D1.2, A-01, A-20; FE-OQ-01)

Source Requirements: RAG-FE-SP-001; REQ-FE-001; REQ-FE-002; REQ-FE-003; REQ-FE-006; REQ-FE-044; REQ-FE-047

Related Artifacts: ARCH-FE-001 v1.0 (D1.1, D1.2, D15, C-05, C-10, A-01, A-20, RK-FE-02, RK-FE-16); ADR-002; ADR-004; PLATFORM ADR-009 (cited in ARCH-FE-001 Dependencies; read-only)

## At a Glance

- Recommended topology: one SP host per environment serves the static app at `/` and sends `/api/*` to the gateway through the reverse proxy. The API is same-origin, so the refresh cookie is sent and the SP needs no CORS grant.
- Status: Approved by the user at the Checkpoint B gate (2026-10-10). Blocking open questions: 0. The recorded variant is same-origin path routing (DM-07 answered).
- Key references: ARCH-FE-001 D1.2 and A-20; REQ-FE-047; FE-OQ-01 (answered "Same-site", recommended variant same-origin).

## Purpose

Fix how the SP origin and the gateway are reached in staging and production, so that the refresh cookie is sent and the browser's calls are same-origin.

## Scope

In scope: the production and staging topology, the reverse-proxy routing rule, the operator edge file requirement, the build guard on `VITE_API_BASE_URL`, and the fallback topology.

Out of scope: domain names (FE-OQ-36), CSP and header values (FE-OQ-20, security_architect), the gateway's CORS rules (gateway-owned). Local development uses the same reasoning through the Vite proxy (D1.1).

## References

- ARCH-FE-001 v1.0: D1.1 (local development), D1.2 (staging and production), D15 (CSP inputs), C-05 (the gateway is the only CORS authority), C-10 (topology is an operator responsibility), A-01, A-20, RK-FE-02, RK-FE-16, RK-FE-17, Dependencies.
- `output/clarifications.md`: FE-OQ-01 (answered "Same-site"; recommended variant same-origin path routing).
- Cited by ARCH-FE-001, read-only: auth-service ARCH-SEC-003 section 10 (refresh cookie: HttpOnly, Secure, SameSite=Strict, host-only, path `/api/v1/auth/refresh`; SC-CK-09 same-site is not same-origin); gateway ARCH-SEC-002 (SC2-CORS-05, SC2-HDR-13) and ARCH-BE-002 section 6 (host table); PLATFORM ADR-009.

## Context

The refresh cookie is `SameSite=Strict`, so it is not sent on cross-site requests whatever CORS says (D1.2). The gateway picks the SYSTEM context from the Host header through its host table. The gateway is the only CORS authority (C-05).

## Problem Statement

Choose the SP origin and gateway routing for each environment, so that the refresh cookie is always sent and no CORS grant is needed for the SP.

## Options Considered

### Option 1 - Same-origin path routing (recommended)

Pros (as recorded in ARCH-FE-001 D1.2 and A-20):
- The refresh cookie is always sent, because the requests are same-origin.
- The SP needs no CORS grant (C-05).
- The CSP `connect-src` can be `'self'` (D15).

Cons (as recorded in ARCH-FE-001):
- The operator must configure the reverse proxy and the edge file, with the Host header passed unchanged (RK-FE-16).
- Domain names are not decided (FE-OQ-36).

### Option 2 - Same-site sibling hosts with CORS credentials (second option, accepted)

Pros: keeps the API on its own host.

Cons (as recorded in ARCH-FE-001 D1.2): origin-list maintenance in the system host's `cors-allowed-origins`; the readable `X-Correlation-ID` needs BG-10; the CSP `connect-src` must list the API origin; the sibling-host analysis (AUTH SC-CK-09, GT-19) needs security_architect acceptance (FE-OQ-20).

### Option 3 - Cross-site (not supported)

Not supported. The refresh cookie is not sent cross-site, whatever CORS says (D1.2, A-20).

Direct cross-origin calls from the SP to the gateway were rejected (A-01 for development; ADR candidate list).

## Decision

Option 1 is the decision for staging and production:

- One SP host per environment, for example `https://system.<env-domain>` (domain names: FE-OQ-36). The static app is served at `/`.
- The reverse proxy sends only the `/api/` prefix to the gateway. `/internal/` and `/.well-known/` are not routed.
- The proxy passes the Host header unchanged, so the gateway host table maps the SP host to context SYSTEM.
- `VITE_API_BASE_URL` is empty. The FE calls relative `/api/v1/...` paths.
- The operator edge file for each environment contains the SP host with context SYSTEM (REQ-FE-047). No other entry is needed for the SP in this topology.
- Build guard: a production build fails when `VITE_API_BASE_URL` is set and is not `https://`. No secret is stored in a `VITE_*` variable (D1.2).
- Option 2 is accepted as the second option, under the costs listed in D1.2.
- ARCH-FE-001 D1.2 corrects the last sentence of FE doc 1.1. The FE document is not edited.

## Justification

Justification as recorded in ARCH-FE-001 D1.2 and A-20: same-origin deployment means the refresh cookie is always sent and no CORS grant is needed. Cross-site cannot work with the `SameSite=Strict` cookie. The same reasoning drives the local proxy (D1.1). ADR-FE-06 is recorded as a topology decision that changes operator configuration and the CSP.

## Consequences

### Positive

- No CORS for the SP. The gateway remains the only CORS authority (C-05).
- The refresh cookie is always sent in the recommended topology (ADR-004).
- The CSP can be narrow (`connect-src 'self'` in the proposal, D15).

### Negative

- Infrastructure work is needed before the first staging deployment: domain names, reverse-proxy routing and the edge file. The apigateway owner confirms the Host passthrough (DM-08).
- The fallback topology needs origin lists, BG-10 for a readable correlation id, and security_architect acceptance (FE-OQ-20).
- FE doc 1.1 and this design differ on one sentence until the FE document owner corrects it.

## Related Artifacts

- ARCH-FE-001 v1.0: D1.1, D1.2, D15, C-05, C-10, A-01, A-20, RK-FE-02, RK-FE-16, RK-FE-17, Dependencies, ADR candidate ADR-FE-06.
- Requirements: REQ-FE-001, REQ-FE-002, REQ-FE-003, REQ-FE-006, REQ-FE-044, REQ-FE-047.
- Related ADRs: ADR-002 (credentials on every call); ADR-004 (the same-origin refresh cookie).
- Platform, cited: PLATFORM ADR-009 (Approved; edge context contract) is listed in ARCH-FE-001 Dependencies. No platform artifact is changed by this ADR.
- Impacted plans: none exists yet. Impacted work: the TODO that configures `vite.config.ts` and the build guard; the operator edge-file change for each environment; the CSP and header decision (FE-OQ-20).

## Change History

| Version | Date | Change | Recorded by |
|---------|------|--------|-------------|
| 0.1 | 2026-10-10 | Recorded at `/decision` from ARCH-FE-001 v1.0 (Pending Approval) | decision_manager |
| 1.0 | 2026-10-10 | Approved by the user at the Checkpoint B gate. DM-07 answered: same-origin path routing is the recorded variant. No other change | decision_manager, on user approval |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| ADR-006:OQ1 | FE-OQ-36: domain names for the staging and production SP hosts and the gateway host | Same-origin host (D1.2, REQ-FE-047) | Operator edge file and certificates | ops | No | Open | Documented default: `system.<env-domain>` per environment. Infrastructure decision, not a design blocker |
| ADR-006:OQ2 | FE-OQ-20: CSP, frame, referrer and image policy for the static host; sibling-host analysis for the fallback | Security controls (D15, D4.12) | Build headers; logo rendering | security_architect, ops | No | Open | Documented default: the proposal in D15. Blocking only if the security decision changes the design |
| ADR-006:OQ3 | FE-OQ-33: expose `X-Correlation-ID` to cross-origin SP pages (BG-10) | Only if the fallback topology is chosen | Reference ids (D3.2) | apigateway architect_backend | No | Open | Documented default: not needed in the recommended topology |
| ADR-006:OQ4 | DM-07: record the chosen variant explicitly. FE-OQ-01 reads "Same-site" and names same-origin as the recommended variant | Approval record for the topology | Approval wording | user | No | Answered | Answered 2026-10-10 by user approval of this ADR at the Checkpoint B gate: same-origin path routing (D1.2) is the recorded variant. DM-07 answered |
| ADR-006:OQ5 | DM-08: apigateway owner confirms that the production reverse proxy passes the Host header as the host-table key | Gateway context selection (ARCH-BE-002 section 6, as cited); RK-FE-16 | Production routing | apigateway architect_backend | No | Open | No default recorded in ARCH-FE-001. ARCH-FE-001 names this as a dependency and records no blocking status |

Blocking open questions: 0.
