---
version: 4.0
last_updated: 2026-07-02
---

# SDLC Workflow & Command Reference

A human-facing guide to the checkpoint-driven SDLC pipeline. The authoritative contracts are `.claude/rules/agent-governance.md`, `.claude/rules/agent-orchestration.md`, and `CLAUDE.md` (Orchestrator Contract section); this document summarizes them for everyday use. For a full index of all rules and sections, see `.claude/docs/rules-index.md`. For presentation diagrams (Mermaid), see `.claude/docs/sdlc-pipeline-visual.md`. For version history and how to tune agents/rules, see `the original .claude/CHANGELOG.md (Cursor-era history; not ported to Claude Code)`.

## How it works

The main chat agent is the **Orchestrator**. It sequences specialist subagents through stages grouped into **six checkpoints** (O optional for brownfield; A–E for all). Each checkpoint ends with **one** explicit user approval.

Commands are a **start button, not an approve button**: running a command does the work, then stops and asks you to approve before the next checkpoint.

**Provenance** is tracked in committed artifacts — not in source-code file headers:

- `output/project-profile.md` — project-level posture (all projects)
- `output/plans/file-provenance-register.md` — path-level scope (authoritative)
- `output/plans/tech-debt-register.md` — brownfield pre-existing gaps (non-blocking)

```
GREENFIELD:
/design ─► [approve] ─► /decision ─► [approve] ─► /build ─► /validate ─► [sign-off] ─► /document ─► [approve]

BROWNFIELD (one-time onboard, then same as greenfield for each change):
/onboard ─► [approve] ─► /design <change> ─► /decision ─► /build ─► /validate ─► /document
Checkpoint O              Checkpoint A … E
```

## Command reference

| Command | Checkpoint | What it runs | Owners | Produces | Ends with |
|---------|------------|--------------|--------|----------|-----------|
| `/onboard` | O — Onboarding (brownfield only) | As-built architecture, retrospective ADRs, registers, project profile | orchestrator, architects, decision-manager, project-manager | `project-profile.md`, as-built `ARCH-*`, `ADR-*` (retrospective), `file-provenance-register.md`, `tech-debt-register.md`, `requirements-baseline.md` | Single approval of onboard artifacts |
| `/design <prompt>` | A — Architecture | Bootstrap profile (greenfield first run); tiered design: solution → security → domain (parallel) → consistency pass | orchestrator, architects | `project-profile.md` (bootstrap), target/delta `ARCH-*` (ARCH-SOLUTION includes Binding, Delegated, Domain Scope) | Single approval of architecture docs |
| `/decision` | B — Decisions + Plan | Net-new ADRs + execution plan | decision-manager, project-manager | `ADR-*`, plan artifacts | Single approval of ADRs + plan |
| `/build [TODO-ID \| next \| all]` | C — Implementation | Implement TODO(s); update provenance register; unit tests | developer-backend / developer-frontend, project-manager, unit-test-writer | Source code; register rows; unit tests + report | TODO(s) `Completed` with register updated |
| `/validate` | D — Review + QA | Scoped code review + QA | reviewer, qa | Review + QA reports | Sign-off (No-Go -> `/build`) |
| `/document` | E — Documentation | Technical documentation + release notes | technical-writer | Docs + release notes | Single approval |
| `/generate <type>` | — (utility) | On-demand generators with narrow read scope | orchestrator + type owner | Per type from `project-profile.service_roots` | No gate |

### `/generate <type>`

On-demand utility — **not** a checkpoint. Loads only `.claude/docs/generate/<type>.md` for token-efficient, focused generation.

- `/generate readme-backend` — backend local runbook at `service_roots[].readme` (prerequisites, setup, run, smoke test). Paths come from `output/project-profile.md`, not hardcoded in commands.
- `/generate readme-frontend` — frontend local runbook at `service_roots[].readme` (same resolution rules).
- `/generate readme-backend <service-path>` or `/generate readme-frontend <service-path>` — pick one entry when multiple `service_roots` share the same `stack`.
- `/generate` (no argument) — list registered types from `generate.md` and ask which to run.

**Upgrading from `/generate readme`:** each `service_roots` row needs `stack: backend` or `stack: frontend` in addition to `path` and `readme` — pre-split profiles with only `path` + `readme` must be updated before `/generate` will resolve.

Does not replace `/document` (API/behavior spec lives in `output/docs/`). Does not block `/validate`.

Registered types are declared in `.claude/commands/generate.md` front-matter `types`.

### `/onboard` (brownfield only)

Run once for legacy projects. Documents **current reality** — no redesign, no feature delivery. Produces as-built architecture, retrospective ADRs, tech-debt register (all pre-existing gaps, non-blocking), and file-provenance register (legacy modules). Sets `project-profile.md` to `provenance: brownfield`, `enforcement_mode: advisory`.

Greenfield projects skip this — profile bootstraps at first `/design`.

### `/design <prompt>`

- **Greenfield:** full target architecture; creates `project-profile.md` on first run if missing.
- **Brownfield:** requires approved `/onboard` first; produces **delta** architecture for the stated change only. Example: `/design add partial refund endpoint to payment-service`.

**Tiered execution** (intra-checkpoint stages use **draft-complete** gates; user approval is collected once at the end):

| Tier | Stage | Owner | When |
|------|-------|-------|------|
| 0 | Solution architecture | `solution-architect` | Always first; output must include Binding Decisions, Delegated Decisions, Domain Scope |
| 1 | Security design | `security-architect` | Only when Domain Scope security = `Active` |
| 2 | Backend + frontend design | `architect-backend`, `architect-frontend` | In parallel; only Active domains; each reads ARCH-SOLUTION + ARCH-SEC (when present) |
| — | Consistency pass | `orchestrator` | Cross-doc conflict check before the Checkpoint A gate |

**Responsibility split** (precedence during draft: Approved ADRs > ARCH-SOLUTION bindings > ARCH-SEC trust topics > `tech-stack-*` defaults > domain elaboration):

| Agent | Owns | Must not own (unless Binding exception) |
|-------|------|----------------------------------------|
| `solution-architect` | Service boundaries, integration topology, data ownership, NFR/deployment class, capability class, Domain Scope | Framework versions, auth details, API paths, schemas, UI patterns |
| `security-architect` | AuthN/AuthZ model, IAM, data protection, threat model, compliance controls | Stack versions; reads ARCH-SOLUTION only at `/design` |
| `architect-backend` / `architect-frontend` | Layering, contracts, persistence/UI architecture within `tech-stack-*` | Re-deciding bound topics; skip when domain is `Cancelled` |

Domains marked `Cancelled` in Domain Scope produce no ARCH doc for that checkpoint. Unresolved cross-doc conflicts become `Blocking = Yes` rows in `output/clarifications.md`.

### `/build [TODO-ID | next | all]`

Implements the TODO with **full standards on new/modified code**. Orchestrator routes each TODO to `developer-backend` or `developer-frontend` by Owner (`developer_backend` / `developer_frontend`) or File scope. Mixed backend + frontend scope in one TODO is not allowed. Updates `file-provenance-register.md` for all touched paths before `/validate`. Brownfield pre-existing debt in untouched legacy does not block.

**Test failure (two paths):** On unit test FAIL, orchestrator **stops before implementer fix**. Path A (obvious): report -> stop. Path B (unclear): report -> debugger -> RCA -> stop. User reviews artifacts, then runs `/build TODO-{id}` again -> routed implementer -> unit-test-writer. Reports win over chat. TODO not `Completed` until tests pass.

### `/validate`

Review and QA scoped to **TODO paths** resolved against the file-provenance register. Registered brownfield tech debt is informational only.

## Project profile (all projects)

Every project has `output/project-profile.md`:

| Type | `provenance` | `enforcement_mode` | Created by |
|------|--------------|--------------------|------------|
| Greenfield | `greenfield` | `enforced` | First `/design` |
| Brownfield | `brownfield` | `advisory` | `/onboard` |

`service_roots` on the profile maps **one row per app** to generator outputs (`path`, `stack`, `readme`). Use `/generate readme-backend` for `stack: backend` and `/generate readme-frontend` for `stack: frontend`. See `artifact-templates-onboard.md` -> Project Profile (`service_roots` field).

All agents read the profile before work. Keeps enforcement consistent across people and agent sessions when `.claude/` and `output/` are committed.

## Brownfield enforcement summary

| Code | Standards | Blocking? |
|------|-----------|-----------|
| Untouched legacy | Pre-existing gaps in tech-debt register | No |
| New files | Full current standards | Yes if violated |
| Modified files (changed hunks) | Full current standards | Yes if violated |
| Modified files (unchanged hunks) | Registered debt only | No |

## Clarifications, approvals, pause & resume

### Clarifications: blocking vs non-blocking

- Every artifact records open questions in a table with a **`Blocking`** column.
- Only `Blocking = Yes, Status = Open` questions halt the next checkpoint.
- Non-blocking questions get a **documented default** and flow through, tracked for later resolution.
- All questions are rolled up into one register: `output/clarifications.md`.
- On resume, you are re-prompted **only** for blocking, still-open questions.

### Answering clarifications — one file

Open **`output/clarifications.md`** — it lists every open question with a `Source Artifact` column and a **Blocking Summary** count.

1. For each row, answer in chat (or note in the `Answer / Default` column).
2. Focus on **`Blocking = Yes`** rows — those hold up the next checkpoint.
3. When **Blocking Summary** reads **0**, the checkpoint can be approved.

The owning agent syncs answers back into each source doc; you only answer from the register.

### Approvals & ownership

- You approve at each checkpoint; agents **never self-approve**.
- On approval, the Orchestrator records clearance in `output/plans/orchestration-state.md`; the **owning agent** flips its artifact `Status` to `Approved` (YAML front-matter and body).
- **Both must agree (fail closed).** If state file and artifacts disagree, the next command stops. Update **both** when approving manually.
- Each artifact has exactly one owner. Non-owners may read but not modify it.

### Pause & resume

The pipeline is resumable across sessions. On any run the Orchestrator:

1. Reads `output/project-profile.md` first
2. Reads `output/plans/orchestration-state.md`
3. Jumps to the first non-completed checkpoint
4. Re-checks any blocking gate before continuing

You can stop after any checkpoint (or any `/build` increment) and pick up later with the same command or "continue." Brownfield projects blocked on `/design` until `/onboard` is approved.

## Artifact map

```
output/
├── project-profile.md              (orchestrator — all projects)
├── requirements/
│   └── requirements-baseline.md    (brownfield onboard)
├── architecture/   ARCH-*          (architects — as-built or target)
├── decisions/        ADR-*           (decision-manager)
├── plans/
│   ├── orchestration-state.md        (orchestrator)
│   ├── file-provenance-register.md   (project-manager)
│   ├── tech-debt-register.md         (project-manager — brownfield)
│   ├── implementation-plan.md
│   ├── master-todo.md
│   └── progress-tracker.md
├── reports/
├── docs/
└── clarifications.md

Service runbooks are produced by `/generate readme-backend` or `/generate readme-frontend` at paths declared in `project-profile.md` `service_roots`, not `/document`.
```

See `.claude/rules/artifact-standards.md` -> **Agent Artifact Index** (who produces what). Per-artifact template bodies live in `artifact-templates/*.md` per the Template column — load the named bundle before writing an artifact.
