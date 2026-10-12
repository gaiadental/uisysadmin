---
version: 1.4
last_updated: 2026-07-02
checkpoint: O
---

# /onboard — Checkpoint O: Brownfield Onboarding

Run **Checkpoint O** for **brownfield (legacy) projects only**. Documents the current system, establishes provenance registers, and prepares the repo for normal SDLC change work via `/design`.

You are the Orchestrator. Comply with `agent-governance.mdc`, `agent-orchestration.mdc`, and `artifact-standards.mdc`. This command is a **start button, not an approve button** — you must never self-approve.

Greenfield projects do **not** use `/onboard`. They bootstrap `output/project-profile.md` at the first `/design` instead.

## Template bundles

Load before writing or delegating artifacts (in addition to `artifact-standards.mdc` core):

- `artifact-templates-onboard.mdc` — **Project Profile**, **File Provenance Register**, **Tech Debt Register**, **Requirements Baseline**
- `artifact-templates-design.mdc` — **Architecture Documents** (as-built `ARCH-*`)
- `artifact-templates-decision.mdc` — **Architecture Decision Records** (retrospective `ADR-*`)

Ensure each delegated subagent loads the bundle that owns its artifact template (`solution-architect` and domain architects → design; `decision-manager` → decision; `project-manager` → onboard).

## Precondition

Read `output/plans/orchestration-state.md` if it exists.

The gate must be **consistent across both the state file and the source artifacts** — if they disagree, treat the gate as NOT cleared (fail closed) and escalate the mismatch.

- This checkpoint is for **brownfield (legacy) systems only**. If the user intended greenfield, stop and direct them to `/design`.
- On completion, all onboard artifacts must exist and read `Status: Approved` in **both** YAML front-matter and body before `/design` may start: `project-profile.md`, as-built `ARCH-*`, `requirements-baseline.md`, retrospective `ADR-*`, `file-provenance-register.md`, `tech-debt-register.md`.
- No `Blocking = Yes, Open` clarification may remain at gate time.

If any of these fails — including a state-file vs. onboard artifact `Status` mismatch — stop and escalate. Do not proceed on the state file alone.

## Scope of this checkpoint

Inventory and traceability only — no feature delivery.

| Stage | Owner | Output |
|-------|-------|--------|
| Project profile | `orchestrator` | `output/project-profile.md` (`provenance: brownfield`, `enforcement_mode: advisory`) |
| As-built solution architecture | `solution-architect` | `output/architecture/ARCH-SOLUTION-*.md` (`artifact_kind: as-built`) |
| As-built domain architecture | `architect-backend`, `architect-frontend`, `security-architect` | `output/architecture/ARCH-*.md` (`artifact_kind: as-built`) |
| Requirements baseline | `solution-architect` | `output/requirements/requirements-baseline.md` |
| Retrospective ADRs | `decision-manager` | `output/decisions/ADR-*.md` (`artifact_kind: retrospective`) |
| File provenance register | `project-manager` | `output/plans/file-provenance-register.md` (legacy modules at directory/module granularity) |
| Tech debt register | `project-manager` | `output/plans/tech-debt-register.md` (all pre-existing gaps, `Gating: No`) |

On as-built `ARCH-SOLUTION-*`, **Binding Decisions**, **Delegated Decisions**, and **Domain Scope** are **optional** (inventory of current reality, not target constraints). Conflict and binding rules apply at `/design` only — see `artifact-templates-design.mdc`.

## Steps

1. **Resume first.** Read `output/project-profile.md` if it exists. Read `output/plans/orchestration-state.md`. If absent, create orchestration state with stage 0 (Onboarding) as resume pointer.
2. **Confirm brownfield.** This checkpoint is for existing legacy systems. If the user intended greenfield, stop and direct them to `/design` instead.
3. **Project profile.** Create or update `output/project-profile.md` with `provenance: brownfield`, `enforcement_mode: advisory`, `onboarded_by: /onboard`, `onboard_checkpoint: O`, baseline commit/date, pipeline and governance versions, pointers to all registers, `included_paths` for in-scope modules, and `service_roots` — **one row per app** with `path`, `stack` (`backend` \| `frontend`), and `readme` (e.g. `auth-service/` + `backend` + `auth-service/README.md`; add a second row for a frontend app).
4. **As-built architecture.** Delegate to `solution-architect`, then in-scope domain architects in parallel. Documents describe **current reality**, not target design. Mark `artifact_kind: as-built` in front-matter. Do not require Binding Decisions, Delegated Decisions, or Domain Scope on as-built `ARCH-SOLUTION-*` — those sections are mandatory at `/design` only.
5. **Requirements baseline.** Delegate to `solution-architect` to document as-built requirements with confidence levels.
6. **Retrospective ADRs.** Delegate to `decision-manager` to record significant embedded decisions (framework, database, auth, messaging). Use `artifact_kind: retrospective` and `confidence: confirmed | inferred`. Do not invent decisions — document what is observed. `inferred` ADRs stay `Pending Approval` until user approves Checkpoint O.
7. **Registers.** Delegate to `project-manager`:
   - Seed `file-provenance-register.md` with legacy paths at `directory`/`module` granularity (`legacy`, `deferred`).
   - Populate `tech-debt-register.md` with all discovered standards gaps (`Gating: No`).
8. **Clarify interactively.** Aggregate open questions into `output/clarifications.md`. Ask `Blocking = Yes` questions now.
9. **Gate once.** When all artifacts exist, mark Checkpoint O `Blocked` / `Pending Approval` and stop. Present a single approval request covering profile, as-built docs, retrospective ADRs, and both registers.

## Do not

- Do not redesign the system — document as-built only.
- Do not implement features or write production code.
- Do not run `/design`, `/decision`, or `/build` — those follow after Checkpoint O is approved.
- Do not add provenance headers to source files — use `file-provenance-register.md` only.
- Do not self-approve. On user approval, record clearance in `orchestration-state.md` and ensure each owning agent flips its artifact `Status` to `Approved`.

## After approval

Brownfield change work uses the normal SDLC:

```text
/design <what to change> → /decision → /build → /validate → /document
```

`/design` produces **delta** (`artifact_kind: target`) architecture only. Pre-existing registered debt does not block untouched legacy.
