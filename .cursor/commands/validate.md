---
version: 2.2
last_updated: 2026-06-30
checkpoint: D
---

# /validate — Checkpoint D: Review + QA

Run **Checkpoint D** of the SDLC pipeline. Any text following the command is supplementary scope (e.g., `/validate TODO-004` to validate a specific increment; default is all completed work).

You are the Orchestrator. Comply with `agent-governance.mdc`, `agent-orchestration.mdc`, and `artifact-standards.mdc`. This command is a **start button, not an approve button**.

## Template bundles

Load before writing or delegating artifacts (in addition to `artifact-standards.mdc` core):

- `artifact-templates-validate.mdc` — **Code Review Report**, **QA Report**

Ensure `reviewer` and `qa` load `artifact-templates-validate.mdc`.

## Precondition

Read `output/project-profile.md` first, then `file-provenance-register.md` (and `tech-debt-register.md` when `enforcement_mode: advisory`).

The gate must be **consistent across both the state file and the source artifacts** — if they disagree, treat the gate as NOT cleared (fail closed) and escalate the mismatch.

- The implementation for the targeted scope is complete: relevant TODOs read `Completed` in **both** `master-todo.md` and `progress-tracker.md`, **and**
- `file-provenance-register.md` is updated for all paths in those TODOs, **and**
- Checkpoint C is recorded consistently in `orchestration-state.md`.

If any of these fails — including a state-file vs. tracker mismatch — stop and escalate. Do not proceed on the state file alone.

## Scope of this checkpoint

Stages 8–9: read-only assessment; scope = **TODO paths resolved against file-provenance register**.

| Stage | Owner | Output |
|-------|-------|--------|
| Code review | `reviewer` | Code Review Report → `output/reports/` |
| Quality assurance | `qa` | QA Report → `output/reports/` with Go/No-Go |

### Enforcement scope (brownfield advisory)

When `enforcement_mode: advisory`:

- Pre-existing registered tech debt (`Gating: No`) in untouched legacy → **informational, non-blocking**
- Violations in TODO scope paths with `enforcement: full` → **blocking**
- Do not fail validation based solely on unmodified legacy outside TODO scope

## Steps

1. **Provenance first.** Read profile, file-provenance register, and tech-debt register (brownfield).
2. **Resume.** Read `orchestration-state.md`.
3. **Code review** via `reviewer` — scoped to TODO paths + integration touchpoints.
4. **Gate review → QA.** QA runs only when review has no unresolved Critical findings.
5. **QA** via `qa` — functional verification of delivered delta behavior in TODO scope.
6. **Sign-off once.** Present review + QA Go/No-Go. No-Go → `/build`; Go → `/document`.

## Do not

- Do not assess untouched legacy outside TODO scope (brownfield).
- Do not edit code — route fixes to `/build`.
- Do not write documentation — that is `/document`.
