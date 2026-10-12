---
id: ADR-001
title: Base frontend stack
owner: decision_manager
status: Approved
version: 1.0.2
decision_date: 2026-10-10
last_updated: 2026-10-10
artifact_kind: target
candidate_label: ADR-FE-01
decision_owner: user
source_requirements: [RAG-FE-SP-001, REQ-FE-049, REQ-FE-051]
related_artifacts: [ARCH-FE-001, ADR-003, ADR-005, ADR-007, PROJECT-PROFILE]
blocking_open_questions: 0
---

ADR ID: ADR-001

Title: Base frontend stack

Owner: decision_manager (recorder); decision owner: user

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate)

Version: 1.0.2

Decision Date: 2026-10-10

Last Updated: 2026-10-10

Candidate Label: ADR-FE-01 (ARCH-FE-001 v1.0, Table 4 rows SD-01 to SD-06)

Source Requirements: RAG-FE-SP-001 ("[FE Requirement] system-principal-web v1.0"); REQ-FE-049; REQ-FE-051

Related Artifacts: ARCH-FE-001 v1.0 (D0, D1.3, D2, D17, Table 4, Table 5, A-11); ADR-003; ADR-005; ADR-007; PROJECT-PROFILE 1.0

## At a Glance

- Records the base frontend stack for the SP web: Vite 8 SPA on React 19, npm, Tailwind 4, shadcn/ui on Base UI, TypeScript 6 with the required compiler options, Zod 4.
- Status: Approved by the user at the Checkpoint B gate (2026-10-10). Blocking open questions: 0. No open non-blocking item remains (ADR-001:OQ3 / DM-01 answered 2026-10-10). ADR-001:OQ1 is confirmed by this approval. ADR-001:OQ2 is answered (History API path routes).
- Key references: ARCH-FE-001 v1.0 Table 4 (SD-01 to SD-06), D1.3, REQ-FE-051; `.claude/rules/tech-stack-frontend.md` Capability Matrix.

## Purpose

Record, for approval, the base frontend stack that ARCH-FE-001 v1.0 decides. This ADR does not choose the stack. It makes the deviation from the organization standard explicit and traceable, as the Technology Selection Policy requires.

## Scope

In scope: application shell and dev server, package manager, styling, UI primitives, TypeScript version and compiler options, validation library version.

Out of scope: routing, which is History API path routes with no routing library (FE-OQ-37, answered 2026-10-10), the HTTP client (ADR-002), server state and forms (ADR-003), the dependency set (ADR-007).

## References

- ARCH-FE-001 v1.0 (`output/architecture/ARCH-FE-001.md`): D0, D1.3, D2, D17; Table 4 SD-01 to SD-06; Table 5; Alternatives A-11; FE-OQ-02 to FE-OQ-07.
- `output/clarifications.md`: FE-OQ-02 to FE-OQ-07 (answered by the user, 2026-10-10).
- `output/plans/orchestration-state.md`: Checkpoint A gate log (2026-10-10).
- `.claude/rules/tech-stack-frontend.md`: Technology Selection Policy; Capability Matrix.

## Context

Checkpoint A cleared ARCH-FE-001 v1.0 and the project profile on 2026-10-10. The repository is greenfield and enforced. The existing `src/` is a mock-data prototype. Its layout, its 20 Base UI component files under `components/ui`, the Tailwind theme import, the Vite configuration and the npm lockfile are reusable. The contract is the FE document, not the mock data (C-06).

## Problem Statement

The tech-stack-frontend standard names a default for six areas: Next.js 15 App Router (with the Turbopack dev server), Bun, Tailwind CSS 3.4.x, shadcn/ui on Radix UI, TypeScript 5.7.x, and Zod 3.x. The user's direction and the existing repository differ on these. A recorded decision is needed so that each deviation is visible, approved and traceable.

## Options Considered

### Option 1 - Accepted base stack (Vite 8 SPA and the listed versions)

Pros (as recorded in ARCH-FE-001):
- Matches the Vite-based dev proxy in FE doc 1.1 and the Vite configuration already in the repository (D1.1).
- An authenticated console needs no server-side rendering (SD-01, A-11).
- Keeps the existing components, theme import, lockfile and TypeScript toolchain (SD-02 to SD-06).

Cons (as recorded in ARCH-FE-001):
- Deviates from six standard defaults and from the Turbopack dev server. The Technology Selection Policy requires an ADR for this.
- Next-specific items (`next/image`, Next config headers) do not apply. Security headers move to the static host (D15, FE-OQ-20).
- TypeScript 6 is above the standard's 5.7.x line (SD-05).

### Option 2 - Standard defaults

Next.js 15.x App Router with Turbopack, Bun (`bun.lock`), Tailwind CSS 3.4.x, shadcn/ui on Radix UI, TypeScript 5.7.x, Zod 3.x.

Pros: conforms to the organization standard (tech-stack-frontend Capability Matrix). Server rendering and SEO support would be available later.

Cons (as recorded in ARCH-FE-001): server rendering is not needed for an authenticated console (SD-01, A-11). The dev proxy in FE doc 1.1 is Vite-based (SD-01). The existing `package-lock.json` and tooling would not be reused (SD-02).

## Decision

The base frontend stack for the SP web is (ARCH-FE-001 v1.0, Table 4):

| Area | Accepted | Standard default | Row |
|------|----------|------------------|-----|
| Application shell and dev server | Vite 8 SPA, path-based routes, React 19 | Next.js 15.x App Router with Turbopack | SD-01 |
| Package manager | npm (`package-lock.json`) | Bun (`bun.lock`) | SD-02 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) | Tailwind CSS 3.4.x | SD-03 |
| UI primitives | shadcn/ui components on Base UI (`@base-ui/react`) | shadcn/ui on Radix UI | SD-04 |
| Language | TypeScript 6, strict, with `exactOptionalPropertyTypes`, `noImplicitReturns`, `forceConsistentCasingInFileNames` and `resolveJsonModule` | TypeScript 5.7.x, strict | SD-05, D1.3 |
| Validation | Zod 4. The form resolver must support Zod 4 | Zod 3.x | SD-06, D9 |

React 19 is the same major version as the standard (React 19.0.0). Table 5 pins the installed ranges, for example `react` ^19.2.6.

Routing is History API path routes with no routing library. The user answered FE-OQ-37 on 2026-10-10 (OQ-P-02). No routing library is adopted, so this ADR does not change for routing.

## Justification

Justifications as recorded in ARCH-FE-001 Table 4:

- SD-01: coordinator direction; the dev proxy in FE doc 1.1 is Vite-based; the authenticated console needs no server rendering.
- SD-02: existing lockfile; the team's tooling.
- SD-03: existing configuration and `index.css`; the shadcn theme import is in place.
- SD-04: existing components (20 files use Base UI); Base UI is part of the accepted base stack.
- SD-05: existing toolchain; strictness kept by the listed options.
- SD-06: existing dependency; schemas are written for Zod 4.

The approval is the user's. ARCH-FE-001 names the user as decision owner of its ADR candidates.

## Consequences

### Positive

- Keeps the reusable prototype components, theme import, Vite configuration and lockfile (C-06, D1.1).
- One build tool serves both the dev server and the production build (D1.1).

### Negative

- Six standard defaults are deviated from. Each deviation stays visible through this ADR and the traceability matrix.
- Next-specific hosting items do not apply. Security headers must be set at the static host (D15, FE-OQ-20).
- TypeScript 6 and Tailwind 4 are above the standard's named lines. The compiler conformance fixes in D1.3 must be applied in the first TODO that touches `tsconfig.app.json`.

Impacted work (for project-manager; no plan exists yet): the TODO that applies the D1.3 conformance fixes (`tsconfig.app.json`, `index.html`, `package.json`); the TODO that removes `src/app/dashboard/data.json`; the TODO that builds the History API path routes with no routing library (FE-OQ-37, answered 2026-10-10).

## Related Artifacts

- ARCH-FE-001 v1.0: D0, D1.3, D2, D17; Table 4 SD-01 to SD-06; Table 5; A-11; ADR candidate ADR-FE-01.
- Requirements: REQ-FE-049 (Zod 4 schemas), REQ-FE-051 (compiler options and package conformance).
- Related ADRs: ADR-003 (the form resolver must support Zod 4, D9); ADR-005 (Vitest shares the Vite configuration, A-23); ADR-007 (installed packages and removals, Table 5).
- Platform: none. Platform ARCH-SOLUTION-001 Domain Scope frontend is Cancelled, so no platform artifact changes (C-07).
- Standard: `.claude/rules/tech-stack-frontend.md` Technology Selection Policy and Capability Matrix.
- Impacted plans: none exists yet. `implementation-plan.md` and `master-todo.md` are project-manager outputs at Checkpoint B.

## Change History

| Version | Date | Change | Recorded by |
|---------|------|--------|-------------|
| 0.1 | 2026-10-10 | Recorded at `/decision` from ARCH-FE-001 v1.0 (Pending Approval) | decision_manager |
| 1.0 | 2026-10-10 | Approved by the user at the Checkpoint B gate. OQ2 closed: History API path routes, no routing library. No other change | decision_manager, on user approval |
| 1.0.1 | 2026-10-10 | Wording correction: wording aligned to OQ2 answer 2026-10-10. Scope (out of scope line), Decision (routing paragraph), Impacted work and the OQ2 answer text now state History API path routes with no routing library, and no routing library is pending. No decision changed | decision_manager |
| 1.0.2 | 2026-10-10 | Status correction: ADR-001:OQ3 (DM-01) changed from Open to Answered on the user's gate answer: user approval recorded at Checkpoint B, 2026-10-10, as the sole approver; solution_architect is Cancelled for this repository. No decision changed | decision_manager |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| ADR-001:OQ1 | FE-OQ-05: Base UI under shadcn. Recorded as an orchestrator reading in `clarifications.md`, not as a named user answer. Confirm | Focus and dialog behaviour (ARCH-FE-001 D16) | Components in `components/ui` | user | No | Answered | Answered 2026-10-10 by user approval of this ADR at the Checkpoint B gate: Base UI accepted with the base stack (SD-04). DM-11 answered |
| ADR-001:OQ2 | FE-OQ-37: routing library for path routes, or custom History API routing | Route table (D10) | Routing code | architect_frontend, user | No | Answered | Answered 2026-10-10 (user, OQ-P-02): History API path routes. No routing library. This closes the question. Wording of Scope, Decision and Impacted work aligned in version 1.0.1 (wording correction; no decision change) |
| ADR-001:OQ3 | DM-01: approval set for a non-standard stack. The tech-stack-frontend Escalation Rule names architect_frontend and solution_architect; solution_architect (stage 1) is Cancelled for this repository | Approval record | Approval of this ADR | user | No | Answered | Answered 2026-10-10: user approval recorded at Checkpoint B, 2026-10-10; solution_architect is Cancelled for this repository. The user accepts their own approval as the sole approver. DM-01 answered |

Blocking open questions: 0.
