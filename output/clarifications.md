---
id: CLARIFICATIONS
title: Clarifications Register
owner: orchestrator
status: Draft
version: 0.2
last_updated: 2026-10-10
blocking_open_questions: 0
---

Title: Clarifications Register
Owner: orchestrator
Status: Draft
Version: 0.2
Last Updated: 2026-10-10

## Purpose

Roll-up index of all open questions across artifacts for the SP web frontend. Each source artifact owns its questions. Answers to ARCH-FE-001 questions were given by the user on 2026-10-10 and are reflected in ARCH-FE-001 v0.2.

## Open Questions

| ID | Source Artifact | Question | Owner | Blocking | Status | Answer / Default |
|----|-----------------|----------|-------|----------|--------|------------------|
| SP-SCOPE-01 | orchestration (user 2026-10-10) | Where is the SP web frontend design held? | user | No | Answered | Frontend design in this repository (`output/`). Platform contracts stay in `../Microservices/gaia-platform-architecture`. Backend deltas are recorded there. |
| SP-PROV-01 | orchestration (user 2026-10-10) | Provenance of this repository | user | No | Answered | Greenfield, enforced. Existing `src/` mock UI is prototype: layout and components may be reused, not the contract. |
| SP-DEC-01 | orchestration-state, platform (2026-10-10) | Master-data access for SYS_ADMIN and SYS_SUPPORT. Interim: only SYS_PRINCIPAL reaches master-data (tenants, tenant-categories, countries); both default deny. | user | No | Answered | User 2026-10-10 interim decision. Platform `ARCH-SEC-001:SEC-OQ-02` stays Open; final decision in a separate change set. |
| FE-OQ-01 | ARCH-FE-001 | Staging and prod topology: the SP origin and the gateway host must be same-site (refresh cookie is SameSite=Strict). | user | No | Answered | Same-site. Recommended variant: same-origin path routing (one host per environment; `/` serves the FE, `/api/*` goes to the gateway; no CORS for SP). Fallback: same-site sibling hosts with CORS credentials in the operator edge file. Cross-site unsupported. ARCH-FE-001 D1.2, REQ-FE-047, ADR-FE-06. |
| FE-OQ-02 | ARCH-FE-001 (SD-01) | Vite 8 SPA or Next.js 15 App Router? | user | No | Answered | Vite 8 SPA accepted as base stack. ADR-FE-01. |
| FE-OQ-03 | ARCH-FE-001 (SD-02) | npm or Bun? | user | No | Answered | npm accepted as base stack. ADR-FE-01. |
| FE-OQ-04 | ARCH-FE-001 (SD-03) | Tailwind 4 or 3.4? | user | No | Answered | Tailwind 4 accepted as base stack. ADR-FE-01. |
| FE-OQ-05 | ARCH-FE-001 (SD-04) | Base UI under shadcn or Radix UI? | user | No | Answered | Base UI under shadcn read as accepted with the base stack (orchestrator reading; the user's list did not name it. Confirm at the gate). ADR-FE-01. |
| FE-OQ-06 | ARCH-FE-001 (SD-05) | TypeScript 6 or 5.7? | user | No | Answered | TypeScript 6 accepted as base stack. Missing compiler options are conformance fixes (REQ-FE-051). ADR-FE-01. |
| FE-OQ-07 | ARCH-FE-001 (SD-06) | Zod 4 or Zod 3? | user | No | Answered | Zod 4 accepted as base stack. The resolver version must support Zod 4. ADR-FE-01. |
| FE-OQ-08 | ARCH-FE-001 (SD-07) | TanStack Query: install or approve an alternative? | user | No | Answered | Adopted as the server-state layer. Invalidation after every mutation (D12.1). ADR-FE-03. |
| FE-OQ-09 | ARCH-FE-001 (SD-08) | Axios or `fetch` as the client? | user | No | Answered | `fetch`-based client accepted as a deviation with justification. Axios not used. ADR-FE-02. |
| FE-OQ-10 | ARCH-FE-001 (SD-09) | React Hook Form: install or approve native form state? | user | No | Answered | React Hook Form with `@hookform/resolvers` (zod) for every form (REQ-FE-049). ADR-FE-03. |
| FE-OQ-11 | ARCH-FE-001 (SD-10) | NextAuth: accept the first-party login as the standard exception? | user | No | Answered | First-party platform login accepted as the standard exception (orchestrator reading of the user's base-stack answer; confirm at the gate). ADR-FE-04. |
| FE-OQ-12 | ARCH-FE-001 (SD-11) | Test stack: Vitest or Jest, with RTL and MSW? | user | No | Answered | Vitest, React Testing Library 16.x, MSW 2.x (MSW by default, as the standard mandates; orchestrator decision). Playwright after the Tenants integration works. ADR-FE-05. |
| FE-OQ-13 | ARCH-FE-001 (SD-12) | Justify each runtime dependency, or approve removal? | user | No | Answered | Justification and decision per package in ARCH-FE-001 Table 5 (ADR-FE-07). Proposed removals (`recharts`, `@dnd-kit/*`, `@tanstack/react-table`, `geist`) need explicit confirmation at the gate. |
| FE-OQ-36 | ARCH-FE-001 | Domain names for the staging and production SP hosts and the gateway host. | ops | No | Open | Documented default: `system.<env-domain>`. Infrastructure decision, not a design blocker. |
| FE-OQ-37 | ARCH-FE-001 | Routing library for path routes, or custom History API routing. | architect_frontend / user | No | Open | Documented default: History API path routing (ARCH-FE-001 D10). Confirm at the gate. |
| FE-OQ-32 | ARCH-FE-001 | Routing of backend gaps BG-01 to BG-11 to platform TODOs. | solution_architect | No | Open | Documented default: routed as shown in ARCH-FE-001 Table 3 (SP-BG-01 to SP-BG-11 in the platform clarifications). Not designed here. |
| FE-OQ-33 | ARCH-FE-001 | Expose `X-Correlation-ID` to cross-origin SP pages (BG-10). | apigateway architect_backend | No | Open | Documented default: not needed in the recommended topology. The request id is shown as fallback (D3.2). |
| FE-OQ-34 | ARCH-FE-001 | Automated accessibility checks and E2E tests: when and where? | architect_frontend / qa | No | Open | Documented default: Playwright planned after the Tenants integration works (not initial phase). Accessibility checked manually in QA until automated checks are decided. |
| FE-OQ-35 | ARCH-FE-001 | Show per-category and per-country tenant counts (one call per row, or removed)? | user / product | No | Open | Documented default: removed in v1 (avoids N+1 requests). |
| OQ-P-01 | implementation-plan (Checkpoint B) | DOM environment for Vitest component tests (jsdom or happy-dom) and matcher packages (jest-dom or none). Package additions need an ADR-007 amendment. | user, architect_frontend | No | Answered | jsdom with `@testing-library/jest-dom` (user 2026-10-10). ADR-007 amended to v1.1; ADR-005 updated. |
| OQ-P-02 | implementation-plan (Checkpoint B) | Routing: a path-route library, or custom History API routing (FE-OQ-37)? | architect_frontend, user | No | Answered | History API path routes (user 2026-10-10). No routing library. ADR-001 OQ2 closed. |
| OQ-P-03 | implementation-plan | Dev dependencies (ESLint, its plugins, typescript-eslint, prettier, globals, `@types/*`) are not covered by ARCH-FE-001 Table 5 or ADR-007. | architect_frontend | No | Open | Documented default: unchanged by the plan. |
| OQ-P-04 | implementation-plan | Document title text for `index.html` (replace `vite-app`). | user, product | No | Open | Documented default: "System Principal". |
| OQ-P-05 | implementation-plan | Strict compiler options sit in one shared `tsconfig.app.json`, so legacy files fail type checks until TODO-017. | architect_frontend | No | Open | Documented default: options applied in TODO-002; errors recorded by path; legacy files removed in TODO-017. |
| OQ-P-06 | implementation-plan | Is the `registration-settings` API module written in v1? | architect_frontend | No | Open | Documented default: not written in v1 (REQ-FE-027 deferred). |
| OQ-P-07 | implementation-plan | Location of reusable components (`components/custom/` per D2, or the `components/` root used by the mock). | architect_frontend | No | Open | Documented default: kept in place; no moves in this plan. |
| OQ-P-08 | implementation-plan | `components.json` sets `"iconLibrary": "lucide"`, but the app imports `@tabler/icons-react`. | architect_frontend | No | Open | Documented default: no change in this plan. |
| OQ-P-09 | implementation-plan | No CI pipeline is visible in the repository. Where do static checks and the dependency audit run? | architect_frontend, ops | No | Open | Documented default: static checks run as Vitest tests; no CI gate. |
| OQ-P-10 | implementation-plan | Location of the E2E configuration and specs. | architect_frontend | No | Open | Documented default: `playwright.config.ts` and `tests/e2e/`. |
| OQ-P-11 | implementation-plan | `/decision` lists four plan artifacts; three are produced. | orchestrator | No | Open | Documented default: three artifacts; dependencies recorded in the implementation plan. |
| DM-02 | open-decisions (decision-manager) | ADR-004 (first-party login as the NextAuth exception) is a non-standard authentication approach. The security stage is Cancelled, and `tech-stack-security` lists security exceptions as an escalation trigger. | user, security_architect | No | Open | Approved with ADR-004 (user 2026-10-10). Security review follows later as a non-blocking follow-up. |
| PM-RK-15 | implementation-plan (Checkpoint B) | React Testing Library 16 requires `@testing-library/dom` as a peer. It was not in ADR-007 v1.1. | user | No | Answered | User 2026-10-10: add it. ADR-007 to v1.2 (decision-manager); TODO-001 updated (project-manager). |
| DM-01 | open-decisions (decision-manager) | tech-stack-frontend Escalation Rule names architect_frontend and solution_architect as approvers. solution_architect is Cancelled. | user | No | Answered | User 2026-10-10: the user's approval is the sole approver. solution_architect is Cancelled for this repository. |
| ARCH-WORDING-01 | ARCH-FE-001 (review 2026-10-10) | Wording-only defects in the approved ARCH-FE-001: FE-OQ-37 still Open in two places; D15 and RK-FE-10 cite FE-OQ-34 for the dependency audit; version history stops at v0.2. | user | No | Answered | User 2026-10-10: wording-only correction allowed. ARCH-FE-001 to v1.0.1 (architect-frontend). No decision changes. |
| SP-CF-01 | FE requirement RAG-FE-SP-001 sections 3.2 and 9 vs auth-service ARCH-BE-001 line 332 (found 2026-10-11 at login) | Requirement conflict: the FE requirement says `GET /api/v1/auth/me` returns `branches: []` for a system user (non-null array). The BE contract types it `branches?` (optional), and the live service returns `null` for a SYSTEM_USER. The SP web rejected the response (CONTRACT) and login failed. | owner of the FE requirement RAG-FE-SP-001 | No | Answered | User 2026-10-12: auth-service is not changed. The SP web `Me` type accepts a null or absent `branches`, following the BE contract (`branches?`). Consumers treat a missing value as no branches. The FE requirement text (sections 3.2 and 9) is not edited here; its owner aligns it with the BE contract. A fix round on TODO-005 applies the type change. Basis note: ADR-006 contains no text on graceful degradation, so it is not cited; the BE contract is the basis. |

FE-OQ-14 to FE-OQ-31 are non-blocking, each with a documented default in ARCH-FE-001 v1.0.

## Blocking Summary

Blocking open questions: 0. OQ-P-01 (jsdom with jest-dom) and OQ-P-02 (History API routes) were answered by the user on 2026-10-10 at the Checkpoint B gate. Checkpoint A is cleared (ARCH-FE-001 v1.0 and project profile 1.0 Approved, 2026-10-10).
