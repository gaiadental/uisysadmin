# version: 4.1
# last_updated: 2026-07-02

User input (prompt)
v
orchestrator: read project-profile.md, then orchestration-state.md
v
========== GREENFIELD (profile bootstraps at first /design) ==========
v
==================== Checkpoint A: /design ====================
[orchestrator: bootstrap project-profile.md if missing]
solution-architect (Tier 0: ARCH-SOLUTION + Binding + Domain Scope)
v
security-architect (Tier 1; only if Domain Scope security = Active)
v
architect-backend | architect-frontend (Tier 2; Active domains only; parallel)
v
orchestrator: consistency pass (cross-doc conflicts -> clarifications.md)
v
[GATE A] user approves architecture docs (single gate; intra-checkpoint = draft-complete)
v
==================== Checkpoint B: /decision ==================
decision-manager: net-new ADRs
v
project-manager: plan + registers
v
[GATE B] user approves ADRs + plan
v
==================== Checkpoint C: /build ======================
developer-backend | developer-frontend: implement TODO(s) — routed per Owner / File scope
v
project-manager: update file-provenance-register.md
v
unit-test-writer: unit tests (TODO scope)
v
debugger: conditional
v
[GATE C] TODO(s) Completed + register updated
v
==================== Checkpoint D: /validate ===================
reviewer: scoped review (TODO paths + register)
v
qa: scoped QA (registered brownfield debt = non-blocking)
v
[GATE D] user sign-off  (No-Go -> /build)
v
==================== Checkpoint E: /document ==================
technical-writer: docs + release notes
v
[GATE E] user approves docs
v
Delivery

========== BROWNFIELD (run /onboard once first) ==========

==================== Checkpoint O: /onboard ===================
orchestrator: project-profile.md (brownfield, advisory)
v
architects: as-built ARCH-* (artifact_kind: as-built)
v
solution-architect: requirements-baseline.md
v
decision-manager: retrospective ADR-*
v
project-manager: file-provenance-register + tech-debt-register
v
[GATE O] user approves onboard artifacts
v
(then same A -> E flow per change request; /design produces delta ARCH-* only)

Provenance: NOT in source file headers.
Authoritative: project-profile.md + file-provenance-register.md + tech-debt-register.md

Notes:
- Commands start checkpoints; they never grant approval.
- Full contract: CLAUDE.md (Orchestrator Contract section) and .claude/rules/agent-orchestration.md
- Human guide: .claude/docs/workflow.md
- Rules index: .claude/docs/rules-index.md
- Visual diagrams: .claude/docs/sdlc-pipeline-visual.md
- Changelog: the original .claude/CHANGELOG.md (Cursor-era history; not ported to Claude Code)
