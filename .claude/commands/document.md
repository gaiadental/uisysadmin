<!-- Ported from Cursor's `.cursor/commands/document.md` (v1.3, 2026-06-30). -->

Checkpoint: **E**


# /document — Checkpoint E: Documentation

Run **Checkpoint E** of the SDLC pipeline. Any text following the command is supplementary scope (e.g., `/document TODO-004` to document a specific increment; default is all delivered, QA-approved work).

You are the Orchestrator. Comply with `agent-governance.md`, `agent-orchestration.md`, and `artifact-standards.md`. This command is a **start button, not an approve button**.

## Template bundles

Load before writing or delegating artifacts (in addition to `artifact-standards.md` core):

- `artifact-templates-document.md` — **Technical Documentation**, **Release Notes**

Ensure `technical-writer` loads `artifact-templates-document.md`.

## Precondition

Read `output/project-profile.md` first.

The gate must be **consistent across both the state file and the source artifacts** — if they disagree, treat the gate as NOT cleared (fail closed) and escalate the mismatch.

- Checkpoint D (review + QA) is signed off in `output/plans/orchestration-state.md`, **and**
- a QA Report exists in `output/reports/` with a `Go` release recommendation, **and**
- the documented work is traceable to a requirement, architecture document, and ADR, **and**
- no `Blocking = Yes, Open` clarification affects the work being documented.

If any of these fails — including a state-file vs. report mismatch — stop and escalate. Do not proceed on the state file alone.

## Scope of this checkpoint

Stage 10: documentation. A read-only-of-code role that produces docs and never edits code.

| Stage | Owner | Output |
|-------|-------|--------|
| Documentation | `technical-writer` | Technical Documentation + Release Notes → `output/docs/` |

### Greenfield vs brownfield

| Project type | Documentation focus |
|--------------|---------------------|
| Greenfield | Document the delivered system behavior from target architecture |
| Brownfield | **Read** as-built artifacts for context; **write** only the QA-approved delta; **reference** unchanged behavior via links to as-built docs and retrospective ADRs — do not re-document the whole legacy system |

## Steps

1. **Provenance first.** Read `project-profile.md` and `file-provenance-register.md`.
2. **Resume.** Read `orchestration-state.md`; do not redo completed documentation.
3. **Document.** Delegate to `technical-writer`. It documents only delivered, QA-approved behavior. On brownfield, it uses as-built artifacts for context but writes docs for the change increment only.
4. **Gate once.** Mark Checkpoint E `Blocked` / `Pending Approval` and stop. Present a single approval request.

## Do not

- Do not edit code, fix defects, or change any other artifact.
- Do not document behavior that was not delivered or not QA-approved.
- On brownfield, do not rewrite full legacy system documentation.
- Do not self-approve. Record the user's approval in `orchestration-state.md`; `technical-writer` flips its own artifact `Status` to `Approved` on next touch.
