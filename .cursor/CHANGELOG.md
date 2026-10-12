# Agent & Rules Changelog

Version: 4.1  
Last Updated: 2026-07-02

---

## Purpose

Track versions and changes to agents, rules, commands, and workflow artifacts in `.cursor/`. Use this file when tuning the SDLC pipeline so changes are deliberate, traceable, and reviewable.

---

## Versioning Scheme

Semantic-style **MAJOR.MINOR**:

| Bump | When to use | Examples |
|------|-------------|----------|
| **MAJOR** | Breaking pipeline change, new/removed stage, ownership change, gate reorder | New agent in pipeline; checkpoint split/merge; role reassignment |
| **MINOR** | Additive or clarifying change; new checklist item; expanded standard | Idempotency checklist; new mandatory section; typo/clarity fix |

Rules with a `Version:` header in their body must stay in sync with this registry.

### File format by type

| Type | Version location | Required fields |
|------|------------------|-----------------|
| **Agents** (`agents/*.md`) | YAML frontmatter | `name`, `description`, `version`, `last_updated` |
| **Commands** (`commands/*.md`) | YAML frontmatter | `version`, `last_updated`, `checkpoint` (plus command body contract) |
| **Guides** (`workflow.md`, `sdlc-pipeline-visual.md`, `rules-index.md`) | YAML frontmatter | `version`, `last_updated` |
| **Guides** (`sdlc-flow.txt`) | Comment header | `# version:`, `# last_updated:` |
| **Rules** (`rules/*.mdc`) | YAML frontmatter + body | `description`, `alwaysApply` and/or `globs`; body `Version:`, `Last Updated:` |

Do not remove or rename protected fields without following `governance-editing.mdc`.

When bumping a version, update **both** the file and this registry in the same change.

New agents and commands start at **1.0**.

---

## How to Tune Agents & Rules

When changing the pipeline or governance:

0. **Read** `rules/governance-editing.mdc` — preserve routing keywords, frontmatter, and contract sections.
1. **Identify scope** — agent only, rule only, or cross-cutting (orchestration + commands + workflow).
2. **Pick the bump** — MAJOR vs MINOR per the table above.
3. **Edit in dependency order:**
   - Rules (`rules/*.mdc`) — source of truth for standards
   - Agents (`agents/*.md`) — role contracts and checklists
   - Orchestration (`rules/agent-orchestration.mdc`, `agents/orchestrator.md`) — pipeline and gates
   - Commands (`commands/*.md`) — checkpoint behavior
   - Human guide (`workflow.md`, `sdlc-pipeline-visual.md`, `rules-index.md`, `sdlc-flow.txt`) — keep in sync last
4. **Update this file** — registry version + changelog entry with date, files, and rationale.
5. **Consistency check** — delegation map, stage count, gate table, artifact owners, and `rules-index.md` section lists must agree across orchestration, orchestrator, workflow, and commands.

**Fail closed:** If orchestration-state and artifact `Status` disagree, the gate is not cleared. Do not advance the pipeline on the state file alone.

---

## Version Registry

### Agents (`agents/`)

| File | Version | Owner role |
|------|---------|------------|
| `orchestrator.md` | 4.1 | orchestrator |
| `solution-architect.md` | 1.2 | solution_architect |
| `architect-backend.md` | 1.5 | architect_backend |
| `architect-frontend.md` | 1.7 | architect_frontend |
| `security-architect.md` | 1.2 | security_architect |
| `decision-manager.md` | 1.1 | decision_manager |
| `project-manager.md` | 1.3 | project_manager |
| `developer-backend.md` | 1.1 | developer_backend |
| `developer-frontend.md` | 1.4 | developer_frontend |
| `unit-test-writer.md` | 1.6 | unit_test_writer |
| `debugger.md` | 1.4 | debugger |
| `reviewer.md` | 1.6 | code_reviewer |
| `qa.md` | 1.6 | qa |
| `technical-writer.md` | 1.2 | technical_writer |

### Rules (`rules/`)

| File | Version | alwaysApply |
|------|---------|-------------|
| `agent-governance.mdc` | 1.3 | yes |
| `agent-orchestration.mdc` | 4.1 | yes |
| `architecture-principles.mdc` | 1.0 | yes |
| `artifact-standards.mdc` | 3.0 | yes |
| `artifact-templates/artifact-templates-onboard.mdc` | 1.0 | no (Checkpoint O; greenfield `/design` bootstrap) |
| `artifact-templates/artifact-templates-design.mdc` | 1.1 | no (Checkpoint A) |
| `artifact-templates/artifact-templates-decision.mdc` | 1.0 | no (Checkpoint B) |
| `artifact-templates/artifact-templates-build.mdc` | 1.0 | no (Checkpoint C) |
| `artifact-templates/artifact-templates-validate.mdc` | 1.0 | no (Checkpoint D) |
| `artifact-templates/artifact-templates-document.mdc` | 1.0 | no (Checkpoint E) |
| `coding-standards.mdc` | 2.0 | yes |
| `standards-backend.mdc` | 1.0 | no (globs: `**/*.{go,java}`) |
| `standards-frontend.mdc` | 1.0 Active | no (globs: `**/*.{ts,tsx,js,jsx,vue}`) |
| `document-encoding.mdc` | 1.1 | no (globs: `**/*.{md,mdc,txt}`) |
| `governance-editing.mdc` | 1.1 | no (globs: `**/.cursor/**/*.{md,mdc,txt}`) |
| `tech-stack-security.mdc` | 1.0 | yes |
| `tech-stack-integration.mdc` | 1.1 | yes |
| `tech-stack-backend.mdc` | 1.5 | no (globs: `**/*.{go,java}`) |
| `tech-stack-frontend.mdc` | 1.4 | no |

### Commands (`commands/`)

| File | Version | Checkpoint |
|------|---------|------------|
| `design.md` | 2.5 | A |
| `decision.md` | 1.0 | B |
| `build.md` | 4.0 | C |
| `validate.md` | 2.1 | D |
| `document.md` | 1.2 | E |
| `generate.md` | 2.0 | none |
| `onboard.md` | 1.4 | O |

### Guides

| File | Version | Notes |
|------|---------|-------|
| `workflow.md` | 4.0 | Human-facing command reference |
| `sdlc-pipeline-visual.md` | 4.4 | Mermaid presentation diagrams |
| `rules-index.md` | 2.4 | Master index of all rules and sections |
| `sdlc-flow.txt` | 4.1 | ASCII pipeline diagram |
| `CHANGELOG.md` | 4.1 | This file |

---

## Changelog

### 2026-07-02 — Architect responsibility revamp (tiered `/design`)

**Type:** MINOR (agents, rules, commands, guides)

| File | Change |
|------|--------|
| `rules/artifact-templates/artifact-templates-design.mdc` | **v1.1** — ARCH-SOLUTION-only Binding Decisions, Delegated Decisions, Domain Scope; domain conformance line under Constraints |
| `agents/solution-architect.md` | **v1.2** — Tier-0 ownership; bindings and Domain Scope deliverables; narrowed Technology Direction; trimmed Mandatory References |
| `agents/security-architect.md` | **v1.2** — Tier-1 rules; `/design` inputs = ARCH-SOLUTION only; trust-model constraints for BE/FE |
| `agents/architect-backend.md` | **v1.5** — Tier-2 rules; read-order; must-not-re-decide; escalation when binding insufficient |
| `agents/architect-frontend.md` | **v1.7** — Same tier-2 alignment as backend |
| `commands/design.md` | **v2.5** — Tiered steps: Solution → Security (when Active) → parallel BE/FE → consistency pass; draft-complete intra-checkpoint gates |
| `agents/orchestrator.md` | **v4.1** — Tiered `/design` delegation; draft-complete gate table; consistency pass step |
| `rules/agent-orchestration.mdc` | **v4.1** — Synced gate table and default execution order for tiered `/design` |
| `workflow.md` | **v4.0** — `/design` tiered flow and architect responsibility summary |
| `rules-index.md` | **v2.4** — Topic lookup: architect tiers, binding decisions, Domain Scope, draft-complete gates |
| `sdlc-flow.txt` | **v4.1** — Checkpoint A tiered ASCII flow (solution → security → BE/FE parallel → consistency pass) |
| `sdlc-pipeline-visual.md` | **v4.4** — End-to-end and Checkpoint A diagrams aligned with tiered `/design`; solution-architect rules table trimmed |
| `commands/onboard.md` | **v1.4** — As-built ARCH-SOLUTION: Binding, Delegated, Domain Scope optional; binding/conflict rules at `/design` only |
| `CHANGELOG.md` | **v4.1** — Registry and this entry |

**Rationale:** Eliminate overlapping technology decisions across solution, security, and domain architects. Solution binds shape and exceptions only; stack defaults stay in `tech-stack-*`; security runs before domain design; single user gate at Checkpoint A end unchanged.

---

### 2026-06-30 — Split artifact-standards into core + template bundles

**Type:** MAJOR (`artifact-standards`); MINOR (guides, governance-editing)

| File | Change |
|------|--------|
| `rules/artifact-standards.mdc` | **v3.0** — Slim core: Agent Artifact Index, General Rules, Master TODO, Traceability, Validation Checklist; Template column points to bundle files |
| `rules/artifact-templates/artifact-templates-onboard.mdc` | **v1.0** — Project Profile, File Provenance Register, Tech Debt Register, Requirements Baseline |
| `rules/artifact-templates/artifact-templates-design.mdc` | **v1.0** — Architecture Documents |
| `rules/artifact-templates/artifact-templates-decision.mdc` | **v1.0** — ADR, Implementation Plan, Roadmap, Progress Tracker, Clarifications Register |
| `rules/artifact-templates/artifact-templates-build.mdc` | **v1.0** — Root Cause Analysis Report, Unit Test Report |
| `rules/artifact-templates/artifact-templates-validate.mdc` | **v1.0** — Code Review Report, QA Report |
| `rules/artifact-templates/artifact-templates-document.mdc` | **v1.0** — Technical Documentation, Release Notes |
| `agents/*.md` (14 files) | Mandatory References + Formats pointers wired to bundles; inline template duplicates removed |
| `commands/onboard.md`, `design.md`, `decision.md`, `build.md`, `validate.md`, `document.md` | Checkpoint bundle hints per command |
| `rules/governance-editing.mdc` | **v1.1** — Protected paths include `artifact-templates/`; core + bundles wording |
| `rules-index.md` | **v2.3** — Quick reference, Contents by file, topic lookup migrated to core + bundles |
| `workflow.md` | **v3.9** — Project Profile and artifact map point to core index + bundle files |
| `sdlc-pipeline-visual.md` | **v4.3** — Rules diagram: core + template bundles subgraph; agent rules table updated |
| `CHANGELOG.md` | **v4.0** — Registry and this entry |

**Rationale:** Reduce always-on token load by moving per-artifact templates out of `alwaysApply: true` core. Artifact paths, filenames, ownership, and gate semantics unchanged. Agents load bundle files on demand per checkpoint or Mandatory References.

---

### 2026-06-26 — FE tune adoption Phase 6: standards-frontend gate activation

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/standards-frontend.mdc` | **v1.0 Active** — `Status: Draft` → `Status: Active`; compliance statement aligned with `standards-backend.mdc`; OQ1 impact updated |
| `agents/architect-frontend.md` | **v1.6** — Removed Draft caveat |
| `agents/developer-frontend.md` | **v1.4** — Removed Draft caveat |
| `agents/reviewer.md` | **v1.6** — Removed Draft caveat; `standards-frontend` sections now blocking for FE TODO scope |
| `agents/qa.md` | **v1.6** — Removed Draft caveat |
| `agents/debugger.md` | **v1.4** — Removed Draft caveat |
| `agents/unit-test-writer.md` | **v1.6** — Removed Draft caveat |
| `sdlc-pipeline-visual.md` | **v4.2** — SF node and rules-per-agent table: removed Draft labels |
| `rules-index.md` | **v2.2** — Registry `1.0 Active`; section header and topic lookup updated |
| `CHANGELOG.md` | **v3.9** — Registry and this entry |

**Source:** FE Tune Adoption plan Phase 6 (user-approved gate flip). Frontend code quality standards are now enforceable in `/validate` for frontend TODO scope, mirroring `standards-backend.mdc`.

---

### 2026-06-26 — FE tune adoption Phase 5: downstream Draft wording sync

**Type:** MINOR

| File | Change |
|------|--------|
| `agents/reviewer.md` | **v1.5** — `standards-frontend` Draft caveat: populated content; not blocking until approved |
| `agents/qa.md` | **v1.5** — Same Draft caveat sync |
| `agents/debugger.md` | **v1.3** — Same Draft caveat sync |
| `agents/unit-test-writer.md` | **v1.5** — Same Draft caveat sync |
| `agents/architect-frontend.md` | Draft caveat wording synced (no version bump) |
| `agents/developer-frontend.md` | Draft caveat wording synced (no version bump) |
| `sdlc-pipeline-visual.md` | **v4.1** — SF node and rules-per-agent table: Draft — content ready, pending approval |
| `rules-index.md` | **v2.1** — Registry and topic lookup: content ready, pending approval |
| `CHANGELOG.md` | **v3.8** — Registry and this entry |

**Source:** FE Tune Adoption plan Phase 5. `standards-frontend.mdc` remains Draft; gate flip deferred to Phase 6 (user approval). Removed stale "placeholder sections" language across FE agents.

---

### 2026-06-26 — FE tune adoption Phase 4: developer-frontend light touch

**Type:** MINOR

| File | Change |
|------|--------|
| `agents/developer-frontend.md` | **v1.3** — Explicit `standards-frontend.mdc` compliance line (mirrors backend); architectural patterns bullet for `frontend-patterns.md`; expanded Completion Checklist with section pointers to standards and tech-stack; Draft caveat preserved |
| `CHANGELOG.md` | **v3.7** — Registry and this entry |

**Source:** FE Tune Adoption plan Phase 4. Lean structure preserved (`## Scope`, `failure_handoff` table, `name: developer-frontend` unchanged). Gate flip deferred to Phase 6.

---

### 2026-06-26 — FE tune adoption Phase 3: architect-frontend pattern design

**Type:** MINOR

| File | Change |
|------|--------|
| `agents/architect-frontend.md` | **v1.5** — Architectural Pattern Design subsection (Plugin/Registry, Strategy, Configuration-Driven, Composition); Pattern Decision Matrix; `frontend-patterns.md` deliverable; success criteria and repository structure updated; description expanded for architectural patterns |
| `CHANGELOG.md` | **v3.6** — Registry and this entry |

**Source:** `temp-reference/architect-frontend.md` (FE Tune Adoption plan Phase 3). Aligns with `tech-stack-frontend.mdc` Architectural Patterns Standard. `standards-frontend.mdc` Draft caveat preserved.

---

### 2026-06-26 — Consolidate FE capability matrix (backend parity)

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/tech-stack-frontend.mdc` | **v1.4** — Removed separate `Approved Tech Stack Versions` table; folded version pins into `Enterprise Capability Baseline` → `Capability Matrix` (mirrors `tech-stack-backend.mdc`); added rows for package manager (Bun), build dev server (Turbopack), API mocking (MSW), and alternative package manager ADR escape |
| `rules-index.md` | **v1.9** — Section table and topic lookup retargeted to unified capability matrix |
| `CHANGELOG.md` | Registry and this entry |

---

### 2026-06-26 — FE tune adoption Phase 2: standards-frontend populated (still Draft)

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/standards-frontend.mdc` | **v1.0 Draft (populated)** — Adopted naming, component structure, hooks, styling, TypeScript, state, testing, performance, accessibility, security patterns, and code review checklist from `temp-reference/frontend-standards.mdc`; Precedence and Pointers table; deduplicated policy content to `tech-stack-frontend.mdc`; OQ1 answered; Status remains Draft |
| `rules-index.md` | **v2.0** — Replaced placeholder section table; updated topic lookup rows |
| `CHANGELOG.md` | **v3.5** — Registry and this entry |

**Source:** `temp-reference/frontend-standards.mdc` (FE Tune Adoption plan Phase 2). Gate flip to Active deferred to Phase 6 (user approval).

---

### 2026-06-26 — FE tune adoption Phase 1: tech-stack-frontend v1.3

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/tech-stack-frontend.mdc` | **v1.3** — Approved Tech Stack Versions (React 19, Next 15, TS 5.7, Bun, shadcn/ui, …); expanded Next.js App Router folder tree; API Client, Form Validation, Package Manager, Next.js Configuration, TypeScript Configuration, and Architectural Patterns standards; updated capability matrix and compliance checklist |
| `rules-index.md` | **v1.8** — Section table and topic lookup rows for new tech-stack sections |
| `CHANGELOG.md` | **v3.4** — Registry and this entry |

**Source:** `temp-reference/tech-stack-frontend.mdc` (FE Tune Adoption plan Phase 1). `standards-frontend.mdc` unchanged (still Draft).

---

### 2026-06-24 — Split coding standards (backend-first)

**Type:** MAJOR (`coding-standards`); MINOR (bundle)

| File | Change |
|------|--------|
| `rules/standards-backend.mdc` | **v1.0** — New backend code quality standard (`**/*.{go,java}`; `alwaysApply: false`) |
| `rules/standards-frontend.mdc` | **v1.0 Draft** — Placeholder shell; FE content awaits external tune reference |
| `rules/coding-standards.mdc` | **v2.0** — Slim universal core: review, refactoring, traceability, standards map |
| `rules/tech-stack-backend.mdc` | **v1.5** — Dedup pointers to `standards-backend` for logging levels, coverage, performance |
| `agents/architect-backend.md` | **v1.4** — Mandatory ref `standards-backend`; updated precedence chain |
| `agents/developer-backend.md` | **v1.1** — Mandatory ref `standards-backend`; compliance line updated |
| `agents/architect-frontend.md` | **v1.4** — Stub ref `standards-frontend` (Draft — not blocking) |
| `agents/developer-frontend.md` | **v1.2** — Stub ref `standards-frontend` (Draft) |
| `agents/reviewer.md` | **v1.4** — Scoped `standards-*` by file type / TODO stack |
| `agents/unit-test-writer.md` | **v1.4** — Load `standards-backend` or `standards-frontend` by TODO scope |
| `agents/debugger.md` | **v1.2** — Same scoped stack standards rule |
| `agents/qa.md` | **v1.4** — Stack standards resolved from TODO file scope |
| `rules-index.md` | **v1.7** — New files; slim `coding-standards`; topic lookup retargeted |
| `sdlc-pipeline-visual.md` | Rules diagram: `SB` / `SF` under scoped subgraph; slim `CS` label; rules-per-agent table |
| `CHANGELOG.md` | **v3.3** — Registry and this entry |

**Precedence:** `agent-governance.mdc` → `coding-standards.mdc` → `standards-*` → `tech-stack-*`

**Rationale:** Separate stack-agnostic code quality from technology implementation patterns; backend standards fully populated; frontend standards await FE colleague tune (Phase 5). Backend `/build` does not depend on FE standards completion.

---

### 2026-06-24 — Split `/generate readme` into backend and frontend

**Type:** MINOR (bundle); breaking generator type rename

| File | Change |
|------|--------|
| `commands/generate.md` | **v2.0** — `readme-backend` and `readme-frontend` types; stack filtering on `service_roots` |
| `commands/generate/readme-backend.md` | **v1.2** — Renamed from `readme.md`; `stack: backend` resolution wording; owner `developer_backend` |
| `commands/generate/readme-frontend.md` | **v1.0** — New frontend runbook generator; owner `developer_frontend` |
| `commands/generate/readme.md` | **Removed** — Replaced by stack-specific generators |
| `rules/artifact-standards.mdc` | **v2.6** — `stack` on `service_roots`; `readme` field for `readme-backend` / `readme-frontend` |
| `commands/design.md` | **v2.3** — Bootstrap hint: one `service_roots` row per app with `path`, `stack`, `readme` |
| `commands/onboard.md` | **v1.2** — Profile step: `service_roots` with `path`, `stack`, `readme` per app (aligned with `/design`) |
| `workflow.md` | **v3.8** — `/generate` migration note: add `stack` to existing `service_roots` rows |
| `rules-index.md` | **v1.6** — `artifact-standards` 2.6; `service_roots` topic lookup |
| `CHANGELOG.md` | **v3.2** — Registry and this entry |

**Breaking:** `/generate readme` removed. Use `/generate readme-backend` or `/generate readme-frontend`. Projects with both stacks need two `service_roots` rows and two generator runs. **Migration:** existing `service_roots` rows that only have `path` and `readme` must add `stack: backend` or `stack: frontend` before `/generate` will resolve.

**Rationale:** Frontend apps need their own runbook generator and `developer-frontend` owner; backend and frontend paths resolve independently by `stack`.

---

### 2026-06-23 — Developer contract parity and backend audience cleanup

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/tech-stack-backend.mdc` | **v1.4** — Remove `developer_frontend` from governs list (backend stack applies to backend implementer and assessors only) |
| `agents/developer-frontend.md` | **v1.1** — Align structure with `developer-backend.md` (Inputs, Preconditions, Implementation bullets, Traceability, Non-Responsibilities) |
| `rules-index.md` | **v1.5** — `tech-stack-backend` 1.4 |
| `CHANGELOG.md` | **v3.1** — Registry and this entry |

**Rationale:** Stack-specific rules govern stack implementers plus shared assessors (`code_reviewer`, `debugger`, `unit_test_writer`). Cross-cutting rules (`coding-standards`, `integration`, `security`) still list both implementers. Frontend agent contract now mirrors backend for predictable agent behavior.

---

### 2026-06-23 — Developer split (backend / frontend)

**Type:** MAJOR

| File | Change |
|------|--------|
| `agents/developer-backend.md` | **v1.0** — New backend implementer (`developer_backend` Owner; Go/Java scope) |
| `agents/developer-frontend.md` | **v1.0** — New frontend implementer (`developer_frontend` Owner; TS/JS/Vue scope) |
| `agents/developer.md` | **Removed** — Replaced by `developer-backend` + `developer-frontend` |
| `agents/orchestrator.md` | **v4.0** — Implementation routing table; delegation map; `failure_handoff.resume_agent` per TODO |
| `rules/agent-orchestration.mdc` | **v4.0** — Same routing; checkpoint C owners; mixed-scope escalation |
| `commands/build.md` | **v4.0** — Owner preconditions; routing table; routed failure retry |
| `rules/artifact-standards.mdc` | **v2.5** — Agent Artifact Index rows; TODO Owner `developer_backend` \| `developer_frontend`; mixed scope forbidden |
| `agents/project-manager.md` | **v1.3** — TODO Owner required; no mixed backend + frontend File scope |
| `agents/unit-test-writer.md` | Handoff to routed implementer |
| `agents/debugger.md` | `resume_agent` per TODO routing |
| `agents/reviewer.md` | Ownership handoff to routed implementers |
| `agents/qa.md` | **v1.3** — Ownership handoff to routed implementers |
| `agents/technical-writer.md` | **v1.2** — Ownership list includes both implementers |
| `rules/coding-standards.mdc` | Audience: `developer_backend`, `developer_frontend` |
| `rules/tech-stack-backend.mdc` | Audience: `developer_backend`, `developer_frontend` |
| `rules/tech-stack-frontend.mdc` | Audience: `developer_frontend` |
| `rules/tech-stack-integration.mdc` | Audience: both implementers |
| `rules/tech-stack-security.mdc` | Audience: both implementers |
| `commands/generate.md` | **v1.2** — `readme` owner `developer_backend` |
| `commands/generate/readme.md` | Owner `developer_backend` |
| `workflow.md` | **v3.6** — `/build` owners; routing; test-failure flow |
| `sdlc-flow.txt` | **v4.0** — Checkpoint C implementer line |
| `sdlc-pipeline-visual.md` | **v4.0** — Diagrams and agent rules table |
| `rules-index.md` | **v1.4** — `agent-orchestration` 4.0; `artifact-standards` 2.5 |
| `CHANGELOG.md` | **v3.0** — Registry and this entry |

**Routing:** Owner `developer_backend` → `developer-backend`; Owner `developer_frontend` → `developer-frontend`; unset Owner + single-stack File scope → infer stack; mixed scope → stop and escalate to `project-manager`. `failure_handoff.resume_agent` always matches the TODO implementer slug.

**Rationale:** Separate backend and frontend implementation ownership; one implementer per TODO; orchestrator routes deterministically at `/build`.

---

### 2026-06-23 — Governance editing standard

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/governance-editing.mdc` | **v1.0** — Protected frontmatter, orchestration slugs, agent contract sections; pre-complete checklist |
| `CHANGELOG.md` | **v2.2** — File format table lists `name`/`description`; tune step 0; registry entry |
| `rules-index.md` | **v1.3** — Index entry for `governance-editing.mdc` |

**Rationale:** Prevent accidental removal of agent routing and contract keywords when tuning governance files (e.g. before developer split).

---

### 2026-06-23 — Document encoding scope exemption

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/document-encoding.mdc` | **v1.1** — **Scope** section: self-exemption when editing this file; checklist cross-reference |

**Rationale:** Prevent agents from applying the pre-save checklist to this file's own illustrative bad-pattern examples.

---

### 2026-06-23 — Document encoding standard and governance fix

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/document-encoding.mdc` | **v1.0** — New rule: UTF-8, typography (`—`, `–`, ASCII `->`), forbidden mojibake, pre-save checklist |
| `rules/agent-governance.mdc` | **v1.3** — Fix corrupted punctuation; link `document-encoding.mdc`; encoding check in Mandatory Final Check |
| `rules-index.md` | **v1.2** — Index entry for `document-encoding.mdc`; topic lookup rows |
| `CHANGELOG.md` | **v2.1** — Registry bump |

**Rationale:** Remove U+FFFD mojibake from `agent-governance.mdc`; enforce consistent readable text for all markdown and governance output going forward.

---

### 2026-06-18 — Two-path test failure alignment (v3.3)

**Type:** PATCH (governance alignment)

| File | Change |
|------|--------|
| `commands/build.md` | **v3.3** — Path A (obvious) vs Path B (debugger same-run); `failure_class`; `resume_agent: developer` always at stop; failure retry flow |
| `agents/orchestrator.md` | **v3.3** — Two-path handoff; routing table; debugger Path B only in same run |
| `agents/unit-test-writer.md` | **v1.3** — Handoff `failure_class`; Path A/B escalation (no same-run developer) |
| `agents/debugger.md` | Path B same-run RCA; developer on **next** `/build` only |
| `rules/artifact-standards.mdc` | **v2.5** — Handoff template Path A/B; explicit report filenames in index |
| `rules/agent-orchestration.mdc` | **v3.2** — Two-path summary; routing rows; PASS gate for TODO completion |
| `workflow.md` | **v3.5** — `/build` test failure note |

**Rationale:** Encode agreed flow — stop before developer fix; debugger in same run only on Path B; next `/build` always developer -> unit-test-writer; reports win over chat.

---

### 2026-06-18 — Artifact-driven test failure handoff

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/artifact-standards.mdc` | **v2.4** — Unit test / RCA report templates, filenames, `YYYY-MM-DD HH:MM` timestamps, Execution Summary/Results |
| `commands/build.md` | **v3.2** — Failure retry reads reports; stop-for-user on FAIL; no same-run fix loop |
| `agents/developer.md` | **v1.4** — Failure retry inputs; report wins over chat |
| `agents/unit-test-writer.md` | **v1.2** — Run tests, Surefire summary, failed-only results |
| `agents/orchestrator.md` | **v3.2** — `failure_handoff` in orchestration state |
| `agents/debugger.md` | **v1.1** — `rca-report-TODO-{id}.md` naming |
| `rules/agent-orchestration.mdc` | **v3.1** — Test failure handoff summary |

**Rationale:** Developer retry from unit test / RCA reports; user reviews FAIL before next `/build`.

---

### 2026-06-17 — `service_roots` for `/generate` path resolution

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/artifact-standards.mdc` | **v2.3** — `service_roots` on Project Profile |
| `commands/generate.md` | **v1.1** — resolve outputs from `project-profile.service_roots`; no hardcoded paths |
| `commands/generate/readme.md` | **v1.1** — `service_reads` relative to resolved service root |
| `commands/design.md` | Bootstrap note: set `service_roots` when module known |
| `workflow.md` | **v3.4** — `/generate` references profile paths |

**Rationale:** Reusable `.customs/` across projects; per-project paths live in `output/project-profile.md`.

---

### 2026-06-17 — `/generate` utility command

**Type:** MINOR

| File | Change |
|------|--------|
| `commands/generate.md` | **v1.0** — Router for on-demand generators (no checkpoint gate) |
| `commands/generate/readme.md` | **v1.0** — Narrow-scope runbook generator for `auth-service/README.md` |
| `workflow.md` | **v3.3** — `/generate <type>` row and artifact map note |
| `agents/orchestrator.md` | Command table entry for `/generate` |
| `auth-service/README.md` | Local dev runbook (prerequisites, setup, run, smoke test, troubleshooting) |

**Rationale:** Split operational runbooks from `/build` and API docs from `/document`; token-efficient subcommand loading. `pending-task` type deferred.

---

### 2026-06-15 — Backend project structure standard

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/tech-stack-backend.mdc` | **v1.3** — Project Structure Standard: microservice vs modular monolith, Java/Maven folder layout, domain module shape |
| `rules-index.md` | Section and topic lookup entries for project structure; **v1.1** |
| `CHANGELOG.md` | Registry bump |

**Rationale:** Canonical backend folder layout for microservices (Option A); explicit contrast with modular monolith.

---

### 2026-06-15 — Rules master index

**Type:** MINOR

| File | Change |
|------|--------|
| `rules-index.md` | **v1.0** — Master index: quick reference, per-file section tables, topic lookup |
| `rules/*.mdc` (9 files) | One-line pointer to `rules-index.md` after Purpose |
| `workflow.md` | Cross-link to rules index |
| `CHANGELOG.md` | Registry entry and maintenance note |

**Rationale:** Single book-style index for all governance rules; no per-file TOC to reduce drift.

---

### 2026-06-15 — SDLC pipeline visual reference

**Type:** MINOR

| File | Change |
|------|--------|
| `sdlc-pipeline-visual.md` | **v3.2** — New Mermaid presentation diagrams (pipeline, rules, agents, artifacts) |
| `workflow.md` | Cross-link to visual reference |
| `sdlc-flow.txt` | Notes link to visual reference |
| `CHANGELOG.md` | Registry entry for new guide |

**Rationale:** Human-facing visual companion aligned with `workflow.md` v3.2 for stakeholder presentations; no pipeline behavior change.

---

### 2026-06-14 — Encoding cleanup in agent contracts

**Type:** MINOR

| File | Change |
|------|--------|
| `agents/architect-backend.md` | Fix corrupted `?` in description, tech-stack section refs, repository tree; standardize Formats pointer |
| `agents/architect-frontend.md` | Fix corrupted `?` in description, tech-stack section ref, repository tree; standardize Formats pointer |
| `agents/security-architect.md` | Fix Architecture Mode `known gaps` ref; standardize Formats pointer |
| `agents/*.md` (13 files) | Formats line uses ASCII `->` consistently (matches `agent-governance.mdc`) |
| `rules/artifact-standards.mdc` | Requirements Baseline index row owner: `solution-architect` (was `project-manager`) |

**Rationale:** Remove Windows encoding corruption (`?`, `???`); align cross-reference style; correct index ownership.

---

### 2026-06-14 — Centralized Agent Artifact Index

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/artifact-standards.mdc` | **v2.2** — **Agent Artifact Index** table: agent → artifact → location → template section; single source of truth for output formats |
| `rules/agent-governance.mdc` | **v1.2** — TODO Format points to Master TODO template (includes **File scope**); removed stale inline example |
| `workflow.md` | **v3.2** — Artifact map links to Agent Artifact Index |
| `agents/*.md` (13 files) | Deliverables section: one-line pointer to index; no duplicated templates |

**Rationale:** Prevent template drift across agent contracts; governance and agents reference centralized formats only. No pipeline, gate, or ownership changes.

---

### 2026-06-14 — Recover solution-architect agent contract

**Type:** MINOR

| File | Change |
|------|--------|
| `agents/solution-architect.md` | **v1.1** — Restored from user reference; Architecture Mode (as-built / delta); Requirements Baseline deliverable; Agent Artifact Index pointer; encoding fixes |

**Rationale:** File was corrupt (`-NoNewline` only). Recovery preserves original contract and aligns with brownfield pipeline and centralized artifact index.

---

### 2026-06-14 — Fail-closed preconditions on design and onboard

**Type:** MINOR

| File | Change |
|------|--------|
| `commands/design.md` | **v2.2** — Fail-closed gate paragraph + closing line (state-file vs. artifact mismatch) |
| `commands/onboard.md` | **v1.1** — Precondition section with fail-closed checks for brownfield-only and onboard artifacts |

**Rationale:** All six checkpoint commands now use the same fail-closed pattern; do not advance on orchestration-state alone.

---

### 2026-06-14 — Provenance gate checks in artifact validation checklist

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/artifact-standards.mdc` | **v2.1** — Provenance and Gate Checks table: profile, brownfield onboard, TODO file scope, register rows, tech-debt gating, state consistency |

**Rationale:** Fail closed on provenance readiness at approval time; aligns checklist with commands and orchestration.

---

### 2026-06-14 — Traceability location in coding standards

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/coding-standards.mdc` | **v1.1** — Traceability lives in TODO + file-provenance register + artifacts; not in source file headers |

**Rationale:** Align with register-based provenance model; prevent agents reintroducing code headers.

---

### 2026-06-14 — Orchestrator mermaid diagram v3.1

**Type:** MINOR

| File | Change |
|------|--------|
| `agents/orchestrator.md` | **v3.1** — Mermaid flowchart updated: `/onboard`, `project-profile` first, file-provenance register step, scoped validate, resume note |

**Rationale:** Diagram aligned with `sdlc-flow.txt` v3.0 and brownfield/greenfield pipeline; human-facing only, no behavior change.

---

### 2026-06-14 — TODO file scope, workflow guide, fail-closed on build/validate

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/artifact-standards.mdc` | `File scope` field added to TODO template |
| `agents/project-manager.md` | **v1.2** — Every TODO must list file scope before `/build` |
| `workflow.md` | **v3.1** — Restored clarifications, approvals, pause & resume sections |
| `commands/build.md` | **v3.1** — Fail-closed closing after preconditions |
| `commands/validate.md` | **v2.1** — Fail-closed closing after preconditions |

**Rationale:** Close streamlining gaps without changing pipeline shape or brownfield rules.

---

### 2026-06-14 — Restore fail-closed closing in document command

**Type:** MINOR

| File | Change |
|------|--------|
| `commands/document.md` | **v1.2** — Restore stop/escalate line; state-file vs. report mismatch |
| `commands/decision.md` | Restore same fail-closed closing after precondition list |

---

### 2026-06-14 — Technical writer brownfield documentation mode

**Type:** MINOR

| File | Change |
|------|--------|
| `agents/technical-writer.md` | **v1.1** — Brownfield mode: read as-built for context; document delivered delta only; reference unchanged behavior |
| `commands/document.md` | **v1.1** — Provenance-first; greenfield vs brownfield documentation scope |

**Rationale:** Brownfield docs need existing-system context without rewriting full legacy documentation.

---

### 2026-06-14 — Project profile read order in governance

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/agent-governance.mdc` | **v1.1** — Artifact Read Order: read `project-profile.md` first; then provenance registers; separate from conflict-resolution priority |

**Rationale:** All agents must load enforcement posture before other artifacts; aligns governance with `agent-orchestration.mdc`.

---

### 2026-06-14 — Greenfield REQ assignment at /design

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/artifact-standards.mdc` | Clarify greenfield `REQ-*` IDs assigned in architecture **Requirements Addressed** at `/design` |
| `commands/design.md` | **v2.1** — Same clarification in checkpoint scope |

**Rationale:** Remove ambiguity that greenfield needs a separate requirements-baseline file; `/design` architecture docs are the requirement source.

---

### 2026-06-14 — Brownfield onboarding and project provenance (MAJOR)

**Type:** MAJOR

| File | Change |
|------|--------|
| `rules/artifact-standards.mdc` | **v2.0** — `PROJECT-PROFILE`, `FILE-PROVENANCE-REGISTER`, `TECH-DEBT-REGISTER`, `REQUIREMENTS-BASELINE` templates; `artifact_kind` / `confidence` front-matter |
| `rules/agent-orchestration.mdc` | **v3.0** — Checkpoint O `/onboard`; provenance-first reads; brownfield enforcement; six checkpoints |
| `commands/onboard.md` | **New** — Checkpoint O for brownfield inventory |
| `commands/design.md` | **v2.0** — Greenfield profile bootstrap; brownfield delta architecture; onboard gate |
| `commands/build.md` | **v3.0** — File-provenance register update per TODO |
| `commands/validate.md` | **v2.0** — Scoped review/QA with advisory enforcement |
| `agents/orchestrator.md` | **v3.0** — Stage 0 onboard; owns `project-profile.md` |
| `agents/solution-architect.md` | As-built vs delta modes; requirements baseline |
| `agents/architect-*.md`, `security-architect.md` | Architecture mode selection per checkpoint |
| `agents/decision-manager.md` | Retrospective ADR rules at `/onboard` |
| `agents/project-manager.md` | Owns file-provenance and tech-debt registers |
| `agents/developer.md` | Provenance compliance; no source file headers |
| `agents/reviewer.md`, `qa.md`, `unit-test-writer.md` | Scoped enforcement via registers |
| `workflow.md`, `sdlc-flow.txt` | **v3.0** — Brownfield flow documented |

**Rationale:** Support legacy (brownfield) systems without blocking delivery on untouched code. Universal `project-profile.md` for cross-agent sync. Path-level provenance in `file-provenance-register.md` replaces per-file headers. Greenfield flow unchanged except profile bootstrap at first `/design`.

---

### 2026-06-13 — Enterprise baseline enforcement in agents

**Type:** MINOR

| File | Change |
|------|--------|
| `agents/developer.md` | Enterprise Baseline Compliance section; mandatory-tier checklist; tech-stack rules in Mandatory References |
| `agents/reviewer.md` | Enterprise Baseline Review section; mandatory-tier checklist; tech-stack rules in Mandatory References |

**Rationale:** Fail closed at `/build` and `/validate` — mandatory capabilities from Phase 5 are explicitly gated, not only implied by rules.

---

### 2026-06-13 — Phase 5: Enterprise capability baseline

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/tech-stack-backend.mdc` | Enterprise Capability Baseline matrix (Mandatory / Conditional / Optional); Flyway, Bean Validation, OpenAPI, Observability, Resilience4j, correlation ID, Go equivalents; expanded compliance checklist |
| `rules/tech-stack-frontend.mdc` | Enterprise Capability Baseline matrix; WCAG 2.1 AA, CSP, browser storage, bundle budgets; expanded performance, accessibility, security sections |
| `agents/architect-backend.md` | Observability design aligned to enterprise baseline |
| `agents/architect-frontend.md` | Accessibility architecture aligned to enterprise baseline |

**Rationale:** Preferred stack with clear enterprise tiers — mandatory for production grade, conditional when context requires, optional via ADR.

---

### 2026-06-13 — Version metadata sync (Option A)

**Type:** MINOR

| File | Change |
|------|--------|
| All `agents/*.md` | Added `version` and `last_updated` to YAML frontmatter |
| All `commands/*.md` | Added YAML frontmatter with `version`, `last_updated`, `checkpoint` |
| `workflow.md` | Added YAML frontmatter |
| `sdlc-flow.txt` | Added version comment header |
| `rules/agent-orchestration.mdc` | Added `Version: 2.0` and `Last Updated` in body |
| `CHANGELOG.md` | Documented file-format-by-type convention |

**Rationale:** Registry versions must match in-file metadata so agents and humans can verify drift without opening `CHANGELOG.md` alone.

---

### 2026-06-13 — Phase 3: Idempotency enforcement in agents

**Type:** MINOR (agents), MINOR (rules body already at 1.1)

| File | Change |
|------|--------|
| `agents/architect-backend.md` | API Architecture Design must define idempotency strategy; success criteria updated |
| `agents/reviewer.md` | Integration Review checks idempotency key, duplicate handling, retention window |
| `agents/qa.md` | Integration Verification checks idempotency behavior (duplicate POST, async redelivery) |
| `rules/tech-stack-integration.mdc` | Version header → 1.1 (idempotency mandatory for retryable/redeliverable writes) |
| `rules/tech-stack-backend.mdc` | Version header → 1.1; Idempotency section under API Standard |

**Rationale:** Rules alone are insufficient; architects must design idempotency, reviewers must verify it in code, QA must verify behavior.

---

### 2026-06-13 — Dedicated `unit_test_writer` and `technical_writer`

**Type:** MAJOR (pipeline, orchestration, commands)

| File | Change |
|------|--------|
| `agents/unit-test-writer.md` | **New** — unit tests + Unit Test Report |
| `agents/technical-writer.md` | **New** — technical documentation + release notes |
| `agents/developer.md` | Resolved `Tests added` vs `Never: Test`; unit tests owned by `unit-test-writer` |
| `agents/orchestrator.md` | 10 stages, 5 checkpoints; gates for unit testing and documentation |
| `agents/reviewer.md` | Testing Review references Unit Test Report and idempotency tests |
| `rules/agent-orchestration.mdc` | Delegation map, execution order (12 steps), gates, checkpoint E `/document` |
| `commands/build.md` | Stage 6 unit testing; TODO `Completed` only after tests pass |
| `commands/validate.md` | Go unlocks `/document` |
| `commands/document.md` | **New** — Checkpoint E |
| `workflow.md` | 5-checkpoint flow, `/document` section, artifact map |
| `sdlc-flow.txt` | Updated ASCII flow |

**Rationale:** Close dangling roles (`unit_test_writer`, `technical_writer`) with single ownership and pipeline placement.

---

### 2026-06-13 — Idempotency standards (rules)

**Type:** MINOR

| File | Change |
|------|--------|
| `rules/tech-stack-integration.mdc` | Idempotency mandatory for retryable/redeliverable writes; Out of Scope for reads and naturally idempotent verbs; compliance checklist |
| `rules/tech-stack-backend.mdc` | Idempotency implementation under API Standard; compliance checklist |

**Rationale:** Enterprise-grade duplicate protection without contradicting HTTP semantics on GET/PUT/DELETE.

---
