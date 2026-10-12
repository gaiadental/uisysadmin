---
id: ADR-002
title: HTTP client as a fetch-based pipeline without Axios
owner: decision_manager
status: Approved
version: 1.0.1
decision_date: 2026-10-10
last_updated: 2026-10-10
artifact_kind: target
candidate_label: ADR-FE-02
decision_owner: user
source_requirements: [RAG-FE-SP-001, REQ-FE-004, REQ-FE-008, REQ-FE-038, REQ-FE-050]
related_artifacts: [ARCH-FE-001, ADR-001, ADR-003, ADR-004, ADR-005, ADR-006]
blocking_open_questions: 0
---

ADR ID: ADR-002

Title: HTTP client as a fetch-based pipeline without Axios

Owner: decision_manager (recorder); decision owner: user

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate)

Version: 1.0.1

Decision Date: 2026-10-10

Last Updated: 2026-10-10

Candidate Label: ADR-FE-02 (ARCH-FE-001 v1.0, Table 4 row SD-08; D3)

Source Requirements: RAG-FE-SP-001; REQ-FE-004; REQ-FE-008; REQ-FE-038; REQ-FE-050

Related Artifacts: ARCH-FE-001 v1.0 (D3, D3.1, D3.2, D4.4, D13, D19, A-21, Table 4 SD-08); ADR-003; ADR-004; ADR-005; ADR-006

## At a Glance

- Records one `fetch`-based API pipeline in `lib/api/client.ts`. Axios is not used. This is a standard deviation with justification.
- Status: Approved by the user at the Checkpoint B gate (2026-10-10). Blocking open questions: 0. Open non-blocking items: FE-OQ-18, FE-OQ-26, FE-OQ-33.
- Key references: ARCH-FE-001 D3 and Table 4 SD-08; `.claude/rules/tech-stack-frontend.md` API Client Standard.

## Purpose

Fix the HTTP client that every API call uses, so that the request rules, the 401 policy and the error mapping have one owner and one place to test.

## Scope

In scope: the single request pipeline, its header rules, timeout, 401 policy, error object and retry rule.

Out of scope: refresh and token holder (ADR-004, `lib/api/refresh.ts`), server-state caching (ADR-003), the test runner (ADR-005).

## References

- ARCH-FE-001 v1.0: D3 (header), D3.1 (request pipeline), D3.2 (error model), D4.4 (401 policy), D13 (error dispositions), D19 (unit tests), A-21, Table 4 SD-08.
- `output/clarifications.md`: FE-OQ-09 (answered by the user, 2026-10-10).
- `.claude/rules/tech-stack-frontend.md`: API Client Standard (Axios with request and response interceptors through one approved API client).

## Context

The standard prefers Axios with request and response interceptors through one approved API client. The FE document's reference client (section 10) is `fetch`-based. ARCH-FE-001 needs the following behaviour on every call: a header allow-list, a 30-second timeout, 204 handling, a 401 refresh policy that exempts some endpoints, and mapping of every failure to `{code, message}`.

## Problem Statement

Choose the one HTTP client for all data access. The standard default is Axios. The design needs its rules in one module that can be fully tested.

## Options Considered

### Option 1 - `fetch`-based client in `lib/api/client.ts` (accepted)

Pros (as recorded in ARCH-FE-001 SD-08):
- One module with one owner.
- Headers, timeout (with `AbortController`), 401 policy and error mapping are covered by `fetch`.
- Adds no dependency for interceptors that this design does not need.
- The FE document's reference client is `fetch`-based.
- The module is fully unit-tested (D19).

Cons (as recorded in ARCH-FE-001 SD-08):
- No built-in interceptor chain. The pipeline must stay complete and tested.
- Deviates from the standard default.

### Option 2 - Axios with request and response interceptors (standard)

Pros: the standard default. The interceptor chain is built in.

Cons (as recorded in ARCH-FE-001 SD-08): adds a dependency for interceptors that this design does not need.

## Decision

Use one `fetch`-based pipeline in `lib/api/client.ts`. Axios is not used. The pipeline rules (D3.1 and D3.2):

1. The URL must start with `/api/v1/`. The base comes from `VITE_API_BASE_URL`, which is empty in development and in the recommended production topology (ADR-006).
2. Headers are an allow-list: `Accept`; `Content-Type` only with a body; `Authorization` only when a token is held and the call is not a public auth call; `X-Correlation-ID` as a new UUID v4 per attempt. `X-User-ID`, `X-Role`, `X-Tenant-ID` and `X-Service-Token` are never sent.
3. `credentials: 'include'` on every call.
4. A 30-second timeout through an abort signal. An abort produces kind `TIMEOUT`.
5. `204` returns no body. A non-JSON body produces kind `NON_JSON`. A parse failure never throws unhandled.
6. A 401 is handled by the policy in ADR-004 (refresh only for `UNAUTHORIZED`, `INVALID_TOKEN` or `SESSION_ENDED` on non-exempt endpoints).
7. No automatic retry for any call. The refresh call is the only internal retry.
8. Every failure resolves to `{ code, message }`, plus `status`, `kind` and `correlationId` where they exist. Client kinds (`NETWORK`, `TIMEOUT`, `NON_JSON`, `CONTRACT`) are never sent to the server.

## Justification

Justification as recorded in ARCH-FE-001 Table 4 SD-08: the pipeline is one module with one owner. Its needs (headers, timeout, 401 policy, error mapping) are covered by `fetch` with `AbortController`. Axios would add a dependency for interceptors the design does not need. The FE document's reference client is `fetch`-based. The module is fully unit-tested (D19). The trade-off is the absence of an interceptor chain, which the pipeline's tests cover.

## Consequences

### Positive

- One request rule set, one error shape and one place for the 401 policy.
- Mandatory unit tests for `lib/api/client.ts` (REQ-FE-050) cover single-flight refresh, the retry rule, 204, error mapping and the forbidden-header rule (D19).
- Components branch on `code` and `status` only, never on message text (REQ-FE-008).

### Negative

- Deviates from the standard's API Client default. This ADR is the recorded exception.
- The pipeline is the only place where the rules are enforced. Any change to it needs the unit tests updated in the same TODO.
- Correctness of the 401 policy depends on the platform's 401 codes (FE-OQ-18).

## Related Artifacts

- ARCH-FE-001 v1.0: D3, D3.1, D3.2, D4.4, D13, D19, A-21, Table 4 SD-08, ADR candidate ADR-FE-02.
- Requirements: REQ-FE-004, REQ-FE-008, REQ-FE-038, REQ-FE-050.
- Related ADRs: ADR-003 (TanStack Query retry is switched off, D12.2); ADR-004 (refresh and 401 policy); ADR-005 (MSW integration tests on the wire format); ADR-006 (same-origin credentials).
- Platform: gateway error envelope and header rules are cited by ARCH-FE-001 (ARCH-BE-002 section 13; ARCH-SEC-002 SC2-HDR rules). Not read by decision-manager (see `decision-traceability-matrix.md`).
- Impacted plans: none exists yet. Impacted work: the TODO that creates `lib/api/client.ts` and its tests.
- Standard deviation record: see ADR-001 (stack deviations) and ADR-004 (authentication deviation) for the other standard exceptions.

## Change History

| Version | Date | Change | Recorded by |
|---------|------|--------|-------------|
| 0.1 | 2026-10-10 | Recorded at `/decision` from ARCH-FE-001 v1.0 (Pending Approval) | decision_manager |
| 1.0 | 2026-10-10 | Approved by the user at the Checkpoint B gate. No other change. FE-OQ-18, FE-OQ-26 and FE-OQ-33 remain Open (non-blocking); ADR-002:OQ4 (DM-01) remains Open | decision_manager, on user approval |
| 1.0.1 | 2026-10-10 | Status correction: ADR-002:OQ4 (DM-01) changed from Open to Answered on the user's gate answer (user approval as the sole approver; solution_architect is Cancelled for this repository). No decision changed | decision_manager |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| ADR-002:OQ1 | FE-OQ-18: which 401 code does an expired access token return at the gateway and at auth-service? | Refresh trigger set (D3.1 step 6, D4.4) | Refresh behaviour | architect_frontend, auth-service architect_backend | No | Open | Documented default: `UNAUTHORIZED`, `INVALID_TOKEN` and `SESSION_ENDED` trigger refresh. Verify with a live expired token before the first integration test |
| ADR-002:OQ2 | FE-OQ-26: idempotency for non-idempotent public writes (BG-11) | Duplicate creates and e-mails (RK-FE-07) | Retry policy | architect_backend (platform) | No | Open | Documented default: no automatic retry in the FE; in-flight disable; `409` handled |
| ADR-002:OQ3 | FE-OQ-33: expose `X-Correlation-ID` to cross-origin SP pages (BG-10) | Reference ids (D3.2) | Only if the fallback topology is chosen (ADR-006) | apigateway architect_backend | No | Open | Documented default: not needed in the recommended topology; the request id is shown as fallback (D3.2) |
| ADR-002:OQ4 | Approval set for a non-standard client (see DM-01) | Tech-stack Escalation Rule | Approval record | user | No | Answered | Answered 2026-10-10: user approval recorded at Checkpoint B, 2026-10-10; solution_architect is Cancelled for this repository. The user accepts their own approval as the sole approver. DM-01 answered |

Blocking open questions: 0.
