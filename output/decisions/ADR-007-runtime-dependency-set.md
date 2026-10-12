---
id: ADR-007
title: Runtime dependency set and removals
owner: decision_manager
status: Approved
version: 1.2
decision_date: 2026-10-10
last_updated: 2026-10-10
artifact_kind: target
candidate_label: ADR-FE-07
decision_owner: user
source_requirements: [RAG-FE-SP-001, REQ-FE-044, REQ-FE-051]
related_artifacts: [ARCH-FE-001, ADR-001, ADR-003, ADR-005]
blocking_open_questions: 0
---

ADR ID: ADR-007

Title: Runtime dependency set and removals

Owner: decision_manager (recorder); decision owner: user

Status: Approved

Approved: 2026-10-10 (user, Checkpoint B gate). Approved as amended in version 1.2.

Version: 1.2

Decision Date: 2026-10-10

Last Updated: 2026-10-10

Candidate Label: ADR-FE-07 (ARCH-FE-001 v1.0, Table 4 row SD-12; Table 5; D1.3; D15; A-26)

Source Requirements: RAG-FE-SP-001; REQ-FE-044 (dependency control, D15); REQ-FE-051 (package conformance, D1.3)

Related Artifacts: ARCH-FE-001 v1.0 (D1.3, D15, D17, RK-FE-10, Table 4 SD-12, Table 5, A-26); ADR-001; ADR-003; ADR-005

## At a Glance

- Keeps only the packages with a recorded use and justification (Table 5). Removes the unused packages in the TODO that touches them. Adds the adopted tools when the first TODO needs them. Adds three dev dependencies for the component test layer: `jsdom` and `@testing-library/jest-dom` (v1.1), and `@testing-library/dom` (v1.2).
- Status: Approved as amended in version 1.2 (2026-10-10). Blocking open questions: 0. Open or deferred non-blocking items: DM-05, DM-06, FE-OQ-28, and DM-12 (deferred). DM-10 is confirmed by this approval.
- Key references: ARCH-FE-001 Table 5 (verified usage, read 2026-10-10); D1.3; D15 (Dependencies control).

## Purpose

Fix which runtime and development dependencies the SP web keeps, which it removes, and which it adds, so that each package has a recorded purpose and the supply-chain surface matches actual use.

## Scope

In scope: `package.json` dependency decisions in Table 5 and the conformance items in D1.3 (moving the `shadcn` CLI to devDependencies; removing unused packages), and the dev dependencies added in v1.1 and v1.2 (`jsdom`, `@testing-library/jest-dom`, `@testing-library/dom`).

Out of scope: the stack choices (ADR-001), the data and form libraries (ADR-003), the test libraries as a choice (ADR-005; this ADR only records their installation).

## References

- ARCH-FE-001 v1.0: Table 5 (per-package use, justification and decision), Table 4 SD-12, D1.3, D15 (Dependencies row), D17 (fonts), RK-FE-10, A-26.
- `output/clarifications.md`: FE-OQ-13 (answered by the user, 2026-10-10; proposed removals need explicit confirmation at the gate).
- `output/plans/orchestration-state.md`: Checkpoint A gate log (removals to be applied in the first TODO that touches `package.json`).
- `.claude/rules/tech-stack-frontend.md`: dependency rules are cited through SD-12 in ARCH-FE-001.

## Context

Table 5 was built on 2026-10-10 by searching `src/` and the Vite and HTML entry points. Four packages are not imported anywhere: `recharts`, the `@dnd-kit` set, `@tanstack/react-table` and `@fontsource-variable/geist`. The `shadcn` CLI is not used at runtime. Three adopted tools are not installed yet.

## Problem Statement

Decide which packages stay, which go, and which are added, so that the dependency set matches the design.

## Options Considered

### Option 1 - Keep only packages with a recorded use and justification (accepted)

Pros (as recorded in ARCH-FE-001 A-26 and D15):
- Fewer packages to audit and maintain (RK-FE-10).
- Each keep decision is traceable to Table 5.

Cons (as recorded in ARCH-FE-001):
- Removals happen in later TODOs, so unused packages stay installed until those TODOs run.
- Adopted tools must be added and pinned in their TODOs.

### Option 2 - Keep every installed package

Pros: no change required.

Cons (as recorded in ARCH-FE-001 A-26 and RK-FE-10): unused packages stay in the supply chain with no recorded use.

## Decision

Per Table 5 (ARCH-FE-001 v1.0):

- Keep: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `@tabler/icons-react`, `sonner`, `zod`.
- Keep pending FE-OQ-28: `@fontsource-variable/inter` and `@fontsource-variable/plus-jakarta-sans`.
- Keep for now, consolidate later: `next-themes` (DM-12).
- Keep, move to devDependencies: `shadcn` (only `shadcn/tailwind.css` is imported at runtime, D1.3).
- Remove: `@fontsource-variable/geist`, `recharts`, `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities`. Remove `@tanstack/react-table` unless a table TODO justifies it (Table 5). Each removal happens in the TODO that touches `package.json`.
- Add when the first TODO needs them, with exact pinned versions: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `vitest`, `@testing-library/react` 16.x, `msw` 2.x. Add `@playwright/test` later, not in the initial phase.
- Add the test scripts to `package.json` in the TODO that installs the test stack (D19).
- Add as devDependencies in the same TODO, with exact pinned versions: `jsdom` and `@testing-library/jest-dom` (v1.1), and `@testing-library/dom` (v1.2). See the Dev Dependency Amendments section. None of these packages is in ARCH-FE-001 Table 5 v1.0.

## Justification

Justification as recorded in ARCH-FE-001 Table 5: each keep row names the verified use and the reason (for example, `@tabler/icons-react` is imported by name so only used icons are bundled; `sonner` supplies feedback for success and error states). Each removal row names the verified absence of use. This matches SD-12, which records the standard's requirement for dependencies to be justified.

## Dev Dependency Amendments (versions 1.1 and 1.2)

Source: the user's answer to OQ-P-01 at the Checkpoint B gate (2026-10-10) for `jsdom` and `@testing-library/jest-dom`; the user's gate answer (2026-10-10) for `@testing-library/dom` (v1.2). The DOM environment for component tests is jsdom, with `@testing-library/jest-dom` for matchers. happy-dom is not used. All three packages are devDependencies. They are recorded here, not in ARCH-FE-001 Table 5 v1.0, which is Approved and is not edited by decision-manager.

| Package | Scope | Purpose | Justification | Risk (SD-12) |
|---------|-------|---------|---------------|--------------|
| `jsdom` | devDependencies | DOM environment for Vitest component tests with React Testing Library 16.x (ADR-005) | The component test layer needs a DOM. The user chose jsdom over happy-dom (OQ-P-01, 2026-10-10) | Not assessed in ARCH-FE-001 v1.0. Open under DM-06 |
| `@testing-library/jest-dom` | devDependencies | DOM matchers for component tests, such as `toBeInTheDocument()` and `toBeDisabled()` | The component test examples in `.claude/rules/standards-frontend.md` use these matchers. The user chose jest-dom with jsdom (OQ-P-01) | Not assessed in ARCH-FE-001 v1.0. Open under DM-06 |
| `@testing-library/dom` | devDependencies | Required peer of `@testing-library/react` 16.x, which ADR-005 uses for component tests. It supplies the DOM query and event helpers that React Testing Library builds on | Required for React Testing Library 16.x to run, so the component test layer in ADR-005 depends on it. Added on the user's gate answer (2026-10-10) as an amendment of the approved dependency set. The peer version is pinned in the TODO that installs it, checked against the installed `@testing-library/react` 16.x | Not assessed in ARCH-FE-001 v1.0. Open under DM-06 |

Versions are not set in this ADR. They are pinned in the TODO that installs the packages (see Decision).

## Consequences

### Positive

- Unused packages leave the set: `recharts`, the four `@dnd-kit` packages and `@fontsource-variable/geist`. `@tanstack/react-table` leaves unless a table TODO justifies it.
- Every kept package has a recorded use.

### Negative

- Removals depend on TODO sequencing. Unused packages stay installed until their TODO runs (RK-FE-10 is Low only after Table 5 is applied).
- Two theme sources exist until consolidated (`next-themes` and the app's `theme-provider`).
- Two font families stay loaded until FE-OQ-28 is decided.
- Table 5 does not record a risk assessment per package, which SD-12 names as a requirement (DM-06). This includes the three v1.1 and v1.2 dev packages.
- The dependency audit mechanism is not defined (DM-05).

## Related Artifacts

- ARCH-FE-001 v1.0: Table 5, Table 4 SD-12, D1.3, D15, D17, RK-FE-10, A-26, ADR candidate ADR-FE-07.
- Requirements: REQ-FE-044 (D15 dependency control), REQ-FE-051 (D1.3 package conformance).
- Related ADRs: ADR-001 (the base stack packages); ADR-003 (query and form packages to add); ADR-005 (test packages to add).
- Impacted plans: none exists yet. Impacted work: the TODO that applies D1.3 to `package.json`; the TODOs that add each adopted tool; the theme-consolidation TODO (DM-12).

## Change History

| Version | Date | Change | Recorded by |
|---------|------|--------|-------------|
| 0.1 | 2026-10-10 | Recorded at `/decision` from ARCH-FE-001 v1.0 Table 5 (Pending Approval) | decision_manager |
| 1.1 | 2026-10-10 | Amended at the Checkpoint B gate (OQ-P-01): added devDependencies `jsdom` and `@testing-library/jest-dom`, with purpose, justification and risk status (Dev Dependency Amendment section). Approved as amended by the user. DM-10 answered | decision_manager, on user approval |
| 1.2 | 2026-10-10 | Amended on the user's gate answer (Checkpoint B, 2026-10-10): added devDependency `@testing-library/dom`, the required peer of React Testing Library 16.x used by ADR-005 (Dev Dependency Amendments section). Approved as amended by the user. No other change | decision_manager, on user approval |

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| ADR-007:OQ1 | DM-10: explicit confirmation of the proposed removals (FE-OQ-13 says they need confirmation at the gate; the gate log records them as to be applied in the first TODO) | Approval record for removals | Scope of the `package.json` TODO | user | No | Answered | Answered 2026-10-10 by user approval of ADR-007 v1.2 at the Checkpoint B gate (removals unchanged from v1.1): removals as in Table 5. `@tanstack/react-table` stays conditional. DM-10 answered |
| ADR-007:OQ2 | DM-06: risk assessment per dependency (SD-12 names purpose, justification and risk; Table 5 has no risk column) | Standard compliance for dependencies | Dependency records | architect_frontend | No | Open | No default recorded in ARCH-FE-001. Also covers `jsdom` and `@testing-library/jest-dom` (v1.1) and `@testing-library/dom` (v1.2) |
| ADR-007:OQ3 | DM-05: dependency audit in CI. D15 and RK-FE-10 cite FE-OQ-34, which covers accessibility and E2E, not dependency audit | Supply-chain control | CI pipeline | architect_frontend | No | Open | No default recorded in ARCH-FE-001 |
| ADR-007:OQ4 | FE-OQ-28: bundle budget and the second font family | Performance (D17); font packages | Build measurement; `index.css` | architect_frontend | No | Open | Documented default: budget set after the first measured production build; keep one font family after the design owner decides |
| ADR-007:OQ5 | DM-12: consolidate the two theme sources (`next-themes` and `theme-provider`) | Two sources of theme state | Theme code | architect_frontend | No | Deferred | Documented default: keep both until the theme TODO; remove `next-themes` if it becomes unused |

Blocking open questions: 0.
