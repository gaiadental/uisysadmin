<!-- Ported from Cursor's `.cursor/commands/design.md` (v2.5, 2026-07-02). -->

Checkpoint: **A**


# /design — Checkpoint A: Architecture

Run **Checkpoint A** of the SDLC pipeline. The text following the command is the feature/scope request (e.g., `/design add partial refund endpoint to payment-service`). Treat it as the originating prompt.

You are the Orchestrator. Comply with `agent-governance.md`, `agent-orchestration.md`, and `artifact-standards.md`. This command is a **start button, not an approve button** — you must never self-approve.

## Template bundles

Load before writing or delegating artifacts (in addition to `artifact-standards.md` core):

- `artifact-templates-onboard.md` — **Project Profile**, **File Provenance Register** (empty bootstrap at greenfield first run)
- `artifact-templates-design.md` — **Architecture Documents** (target/delta `ARCH-*`)

Ensure delegated architects load `artifact-templates-design.md`.

## Precondition

Read `output/project-profile.md` first.

The gate must be **consistent across both the state file and the source artifacts** — if they disagree, treat the gate as NOT cleared (fail closed) and escalate the mismatch.

1. **Project profile.** Read `output/project-profile.md`.
   - If **absent** (greenfield): bootstrap a greenfield profile before delegating to architects (`provenance: greenfield`, `enforcement_mode: enforced`, `onboarded_by: /design`, baseline commit/date, pipeline and governance versions, pointer to `file-provenance-register.md`). Mark profile `Approved` after bootstrap (user confirms at gate).
   - If **`provenance: brownfield`**: Checkpoint O (`/onboard`) must be approved — profile, as-built docs, retrospective ADRs, and registers all `Status: Approved`. If not, stop and direct user to `/onboard`.
2. **Orchestration state.** Read `output/plans/orchestration-state.md`; never redo completed stages.

If any of these fails — including a state-file vs. artifact `Status` mismatch — stop and escalate. Do not proceed on the state file alone.

## Scope of this checkpoint

Stages 1–2: system architecture + domain design (tiered — Solution → Security → domain parallel).

| Tier | Stage | Owner | Output |
|------|-------|-------|--------|
| 0 | Project profile (bootstrap only) | `orchestrator` | `output/project-profile.md` (greenfield first run) |
| 0 | Solution architecture | `solution-architect` | `output/architecture/ARCH-SOLUTION-*.md` (must include Binding Decisions, Delegated Decisions, Domain Scope) |
| 1 | Security design | `security-architect` | `output/architecture/ARCH-SEC-*.md` (only when Domain Scope security = `Active`) |
| 2 | Backend design | `architect-backend` | `output/architecture/ARCH-BE-*.md` (only when Domain Scope backend = `Active`) |
| 2 | Frontend design | `architect-frontend` | `output/architecture/ARCH-FE-*.md` (only when Domain Scope frontend = `Active`) |
| — | Consistency pass | `orchestrator` | Cross-doc conflict check; unresolved items → `output/clarifications.md` |

### Greenfield vs brownfield content

| Project type | Architecture content | `artifact_kind` |
|--------------|---------------------|-----------------|
| Greenfield | Full target system design | `target` |
| Brownfield | **Delta only** — what changes/adds; reference as-built docs; declare untouched legacy out of scope | `target` |

Greenfield: `REQ-*` IDs are assigned in architecture docs at `/design` (**Requirements Addressed**).

Brownfield `/design` must **not** redesign the whole system. Preserve existing architecture unless the user explicitly requests otherwise.

## Steps

1. **Provenance first.** Read `project-profile.md` and apply preconditions above.
2. **Bootstrap profile** (greenfield only, if missing). Create `output/project-profile.md` and empty `output/plans/file-provenance-register.md`. Set `included_paths` and `service_roots` when service modules are known — **one row per app** with `path`, `stack` (`backend` \| `frontend`), and `readme` (e.g. `auth-service/` + `backend` + `auth-service/README.md`; add a second row for a frontend app).
3. **Solution architecture (Tier 0).** Delegate to `solution-architect`. Output must include **Binding Decisions**, **Delegated Decisions**, and **Domain Scope** sections. Do not proceed until ARCH-SOLUTION is **draft-complete** (all required sections present; `Status: Draft` or `Pending Clarification` is acceptable — user approval waits until step 7).
4. **Security architecture (Tier 1).** Delegate to `security-architect` **only if** Domain Scope lists security as `Active`. Input: ARCH-SOLUTION only. Do not proceed to domain design until ARCH-SEC is **draft-complete** OR security is `Cancelled` in Domain Scope.
5. **Domain design (Tier 2).** Delegate **Active** backend and frontend architects **in parallel**. Each reads ARCH-SOLUTION plus ARCH-SEC when it exists. Skip domains marked `Cancelled` in Domain Scope. Keep each domain in its own document.
6. **Consistency pass.** Verify no cross-doc conflicts among ARCH-SOLUTION, ARCH-SEC (if present), and Active domain ARCH docs (binding vs. elaboration, integration topology vs. contracts, trust model vs. enforcement points). Unresolved conflicts → add `Blocking = Yes` rows to `output/clarifications.md` (orchestrator may delegate a light review to `solution-architect` but must not design).
7. **Clarify interactively.** Aggregate open questions into `output/clarifications.md`. Ask `Blocking = Yes` questions now.
8. **Gate once.** When required architecture docs exist and intra-checkpoint draft-complete gates are satisfied, mark Checkpoint A `Blocked` / `Pending Approval` and stop. Present a single approval request for all ARCH docs.

## Do not

- Do not run `/onboard` — that is brownfield-only and separate.
- Do not record ADRs, write the plan, or write code — those are later checkpoints.
- Do not add provenance headers to source files.
- Do not self-approve.
- Do not proceed to `/decision` until Checkpoint A is approved and no `Blocking = Yes, Open` question remains.
