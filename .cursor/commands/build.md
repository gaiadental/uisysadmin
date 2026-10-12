---
version: 4.1
last_updated: 2026-06-30
checkpoint: C
---

# /build — Checkpoint C: Implementation

Run **Checkpoint C** of the SDLC pipeline. The text following the command selects scope:

- `/build TODO-001` — implement one specific TODO.
- `/build next` — implement the next `Not Started` TODO in dependency order.
- `/build all` — implement every remaining TODO in dependency order.
- `/build` (no argument) — ask which of the above the user wants.

You are the Orchestrator. Comply with `agent-governance.mdc`, `coding-standards.mdc`, the Standard tech stack rules, `agent-orchestration.mdc`, and `artifact-standards.mdc`.

## Template bundles

Load before writing or delegating artifacts (in addition to `artifact-standards.mdc` core):

- `artifact-templates-build.mdc` — **Unit Test Report**, **Root Cause Analysis Report** (ensure `unit-test-writer` and `debugger` load this)
- `artifact-templates-onboard.mdc` — **File Provenance Register** (when delegating `project-manager` to append `FP-*` rows)

Implementers (`developer-backend`, `developer-frontend`) load core only (**Master TODO** entry format).

## Precondition

Read `output/project-profile.md` first, then `file-provenance-register.md` (and `tech-debt-register.md` when `enforcement_mode: advisory`).

The gate must be **consistent across both the state file and the source artifacts** — if they disagree, treat the gate as NOT cleared (fail closed) and escalate the mismatch.

- Checkpoint B (decisions + plan) is `Approved` in `output/plans/orchestration-state.md`, **and**
- the referenced ADRs and plan artifacts also read `Status: Approved`, **and**
- the targeted TODO(s) exist in `master-todo.md` and trace to a requirement, architecture, and ADR, **and**
- each targeted TODO lists **file/module scope** for enforcement, **and**
- each targeted TODO has Owner `developer_backend` or `developer_frontend`, or routable single-stack File scope, **and**
- no `Blocking = Yes, Open` clarification affects the targeted TODO(s).

If any of these fails — including a state-file vs. artifact `Status` mismatch — stop and escalate. Do not proceed on the state file alone.

## Implementation routing

For each targeted TODO, delegate to **exactly one** implementer:

| Condition | Delegate to |
|-----------|-------------|
| Owner is `developer_backend` | `developer-backend` |
| Owner is `developer_frontend` | `developer-frontend` |
| Owner unset; File scope is backend-only | `developer-backend` |
| Owner unset; File scope is frontend-only | `developer-frontend` |
| File scope mixes backend and frontend | **Stop** — escalate to `project-manager` to split TODO |

Set `failure_handoff.resume_agent` to the same slug (`developer-backend` or `developer-frontend`).

## Scope of this checkpoint

Stages 5–7: implement, update provenance register, author unit tests, debugger conditional.

| Stage | Owner | Behavior |
|-------|-------|----------|
| Implementation | `developer-backend` or `developer-frontend` | Implement targeted TODO(s); apply **full standards** to new/modified code; read `project-profile.md`; update TODO status only |
| File provenance | `project-manager` | Append/update `file-provenance-register.md` rows for all paths created or modified (`agent-created` or `agent-modified`, `enforcement: full`) |
| Unit testing | `unit-test-writer` | Unit tests for **new/modified behavior in TODO scope**; run tests; Unit Test Report -> `output/reports/unit-test-report-TODO-{id}.md` |
| Debugging | `debugger` | Conditional — unclear/systemic test failure in the same `/build` run (before stop); produces `rca-report-TODO-{id}.md` |

## Test failure — two paths (always stop before implementer fix)

When unit tests **fail** after step 5, the unit-test-writer finalizes the report (`execution_overall: FAIL`, failed-only **Execution Results**, **Handoff** section). TODO stays **not** `Completed`. **Do not** delegate the implementer until the user runs `/build TODO-{id}` again.

### Path A — obvious bug

```text
unit-test-writer -> write report -> update failure_handoff -> STOP
```

1. Set `failure_handoff` (`failure_class: obvious`, `resume_agent: developer-backend` or `developer-frontend` per routing, unit test report path).
2. **Stop.** User reviews `unit-test-report-TODO-{id}.md`.

### Path B — unclear / systemic

```text
unit-test-writer -> write report -> debugger -> RCA -> update failure_handoff -> STOP
```

1. Delegate **debugger** in the **same** `/build` run -> `output/reports/rca-report-TODO-{id}.md`.
2. Set `failure_handoff` (`failure_class: unclear`, `resume_agent` per routing, unit test report + RCA paths).
3. **Stop.** User reviews unit test report and RCA.

Orchestrator chooses Path A vs B from the unit test report **Handoff** section and failure evidence. **Never** delegate the implementer in the same run as the initial failing test.

### On PASS

Clear `failure_handoff`, mark TODO `Completed`, then pause for checkpoint approval.

## Failure retry (next `/build` after stop)

When the user runs `/build TODO-{id}` again while `failure_handoff` is active (or the latest unit test report reads `execution_overall: FAIL`):

1. **Do not** ask the user to describe the failure in chat — **report wins** (and RCA when present).
2. Delegate **developer-backend** or **developer-frontend** (per routing / `failure_handoff.resume_agent`) with explicit paths:
   - `output/reports/unit-test-report-TODO-{id}.md` (required)
   - `output/reports/rca-report-TODO-{id}.md` (when present — always after Path B)
3. Implementer fixes within TODO file scope; does **not** mark TODO `Completed`.
4. **Update register** via `project-manager` when fix touches new/modified paths.
5. Delegate **unit-test-writer** in the **same** `/build` run (re-run tests, update report).
6. If tests **fail** again, apply **Test failure — two paths** above and **stop** again.
7. If tests **pass**, clear `failure_handoff`, mark TODO `Completed`, pause.

On **first implementation** (no active `failure_handoff`), run implementer -> register -> unit-test-writer as normal.

## Steps

1. **Provenance first.** Read `project-profile.md`, `file-provenance-register.md`, and `tech-debt-register.md` (brownfield).
2. **Resume.** Read `orchestration-state.md` and `progress-tracker.md`; do not redo completed TODOs. If `failure_handoff` is active, follow **Failure retry**; otherwise implement per **Implementation routing**.
3. **Implement or fix** via routed implementer. On failure retry, implementer **must** read failure artifacts. Honor approved architecture and ADRs. Apply full standards. Escalate legacy gaps to `project-manager`.
4. **Update register** via `project-manager`. For each created/modified path: add `FP-*` row with trace links.
5. **Unit tests** via `unit-test-writer`: run tests, write report with **Execution Summary**.
6. **On FAIL:** apply **Test failure — two paths**. Do not delegate implementer in that run.
7. **On PASS: Mark Completed and pause.**

## Do not

- Do not use chat paraphrase of failures when unit test report exists — **report wins**.
- Do not delegate the implementer in the same run as the **initial** failing test.
- Do not skip **debugger** on Path B when failure is unclear/systemic.
- Do not add provenance headers to source files.
- Do not implement TODOs outside selected scope or wrong stack (backend agent on frontend TODO).
- Do not change TODO structure — that is `project-manager`.
- Do not review or QA — that is `/validate`.
