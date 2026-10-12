---
version: 1.1
last_updated: 2026-06-30
checkpoint: B
---

# /decision — Checkpoint B: Decisions + Plan

Run **Checkpoint B** of the SDLC pipeline. Any text following the command is supplementary instruction (e.g., `/decision proceed`).

You are the Orchestrator. Comply with `agent-governance.mdc`, `agent-orchestration.mdc`, and `artifact-standards.mdc`. This command is a **start button, not an approve button** — you must never self-approve.

## Template bundles

Load before writing or delegating artifacts (in addition to `artifact-standards.mdc` core):

- `artifact-templates-decision.mdc` — **Architecture Decision Records**, **Implementation Plan**, **Progress Tracker**; **Master TODO** entry format remains in `artifact-standards.mdc` core

Ensure `decision-manager` and `project-manager` load `artifact-templates-decision.mdc`.

## Precondition

Read `output/project-profile.md` first.

The gate must be **consistent across both the state file and the source artifacts** — if they disagree, treat the gate as NOT cleared (fail closed) and escalate the mismatch.

- Checkpoint A (architecture) is `Approved` in `orchestration-state.md`, **and**
- architecture docs read `Status: Approved`, **and**
- `blocking_open_questions: 0`, **and**
- no `Blocking = Yes, Open` clarifications.

If any of these fails — including a state-file vs. artifact `Status` mismatch — stop, escalate, and set the appropriate `Pending Approval` / `Pending Clarification` gate. Do not proceed on the state file alone.

**Brownfield:** reference retrospective ADRs from `/onboard`; record **net-new** ADRs for this change only — do not duplicate retrospective ADRs.

## Scope of this checkpoint

Stages 3–4: record decisions, then plan.

| Stage | Owner | Output |
|-------|-------|--------|
| Decision records | `decision-manager` | Net-new `ADR-*.md` (brownfield: reference retrospective ADRs) |
| Execution plan | `project-manager` | Plan artifacts; TODOs must list **file/module scope** for enforcement |

## Steps

1. **Provenance first.** Read `project-profile.md` and `file-provenance-register.md`.
2. **Resume.** Read `orchestration-state.md`.
3. **Record ADRs** via `decision-manager` — net-new decisions for this change only on brownfield.
4. **Plan** via `project-manager`. Every TODO traces to requirement + architecture + ADR and lists file scope.
5. **Gate once.** Stop for user approval.

## Do not

- Do not write code — that is `/build`.
- Do not self-approve. Record the user's approval in `orchestration-state.md`; `decision-manager` and `project-manager` flip their own artifact `Status` to `Approved` on next touch.
- Do not proceed to `/build` until the user approves Checkpoint B.
