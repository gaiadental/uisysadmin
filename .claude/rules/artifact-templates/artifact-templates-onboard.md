
# Artifact Templates — Onboard

> Loading: on demand only, per checkpoint. Read this file when the active command's or agent's *Mandatory References* / *Template bundles* section names it. Artifact templates for Checkpoint O — Project Profile, File Provenance Register, Tech Debt Register, Requirements Baseline (also loaded at greenfield /design bootstrap) Ported from Cursor's `.cursor/rules/artifact-templates/artifact-templates-onboard.mdc`.

Version: 1.0

Last Updated: 2026-06-30

Status: Active

---

# Purpose

Artifact templates for Checkpoint **O** (brownfield `/onboard`) and greenfield `/design` bootstrap (project profile + empty file-provenance register). General rules, metadata, and the Agent Artifact Index live in `artifact-standards.md` (core).

Before writing any artifact in this file, also load `artifact-standards.md` (core) for general metadata rules, mandatory sections, and the Agent Artifact Index.

---
# Project Profile

Location:

```text
output/project-profile.md
```

Owner:

```text
orchestrator
```

Purpose:

Authoritative project-level provenance and enforcement contract. Every agent reads this before any stage work. Provenance is **not** stored in source-code file headers.

---

## Template

```yaml
---
id: PROJECT-PROFILE
title: Project Profile
owner: orchestrator
status: Approved
version: 1.0
last_updated: 2026-06-14
blocking_open_questions: 0

provenance: greenfield
managed_by: YSA
enforcement_mode: enforced
pipeline_version: "3.0"
onboarded_by: /design

baseline_commit: null
baseline_date: 2026-06-14
baseline_ref: main

governance_source: .claude/
governance_version: "2.0"

onboard_checkpoint: null
file_provenance_register: output/plans/file-provenance-register.md
tech_debt_register: null
requirements_baseline: null
as_built_architecture: []
retrospective_adrs: []

project_root: .
included_paths: []
excluded_paths: []
service_roots: []
# Example (backend + frontend):
# service_roots:
#   - path: auth-service/
#     stack: backend
#     readme: auth-service/README.md
#   - path: web-app/
#     stack: frontend
#     readme: web-app/README.md
---
```

```md
Title: Project Profile
Owner: orchestrator
Status: Approved
Version: 1.0
Last Updated: 2026-06-14
Source Requirements: —
Related Artifacts:
- output/plans/file-provenance-register.md

## At a Glance

- Project provenance and enforcement posture for all agents
- Approved and ready for change work (or blocking item if not)
- Key references: pipeline version, baseline, governance bundle

## Purpose

## Scope

## Provenance

## Baseline

## Governance Anchor

## Registers

## Enforcement Rules

## Modification History

## References

## Open Questions
```

### Allowed values

```text
provenance:           greenfield | brownfield
enforcement_mode:     enforced | advisory
onboarded_by:         /design | /onboard
onboard_checkpoint:   O | null
```

### `service_roots` (generators)

Array on `project-profile.md`. Maps each deployable service module to generator output paths. Used by `/generate` — **not** hardcoded in `.claude/commands/`.

| Field | Required | Purpose |
|-------|----------|---------|
| `path` | yes | Service module root (trailing slash); must align with `included_paths` |
| `stack` | when using `/generate` | `backend` \| `frontend` — filters generator type to the matching entry |
| `readme` | for `/generate readme-backend` or `readme-frontend` | Local runbook path (e.g. `auth-service/README.md`) |

Add fields here when new generator types need per-service outputs. If `service_roots` is missing or empty when `/generate` runs, stop and update the profile first.

### Defaults

| Project type | `provenance` | `enforcement_mode` | `onboarded_by` |
|--------------|--------------|--------------------|----------------|
| Greenfield (bootstrap at first `/design`) | `greenfield` | `enforced` | `/design` |
| Brownfield (after `/onboard`) | `brownfield` | `advisory` | `/onboard` |

### Enforcement rules (project level)

| Context | Rule |
|---------|------|
| Untouched legacy (brownfield) | Registered tech debt -> non-blocking |
| New files | Full current standards -> blocking |
| Modified files (changed hunks) | Full current standards -> blocking |
| Modified files (unchanged hunks) | Pre-existing registered debt -> non-blocking |

---

# File Provenance Register

Location:

```text
output/plans/file-provenance-register.md
```

Owner:

```text
project_manager
```

Purpose:

Authoritative path-level provenance and enforcement scope. Replaces per-file headers in source code. Reviewer and QA resolve scope from this register plus the active TODO.

---

## Template

```yaml
---
id: FILE-PROVENANCE-REGISTER
title: File Provenance Register
owner: project_manager
status: Approved
version: 1.0
last_updated: 2026-06-14
related_artifacts: [PROJECT-PROFILE]
blocking_open_questions: 0
register_granularity: mixed
---
```

```md
## File Provenance Entries

| ID | Path | Granularity | File provenance | Enforcement | Trace | Tech debt | Baseline | Since | Last updated | Updated by | Notes |
|----|------|-------------|-----------------|-------------|-------|-----------|----------|-------|--------------|------------|-------|
| FP-001 | src/payment/ | directory | legacy | deferred | — | TD-001 | abc123 | 2026-06-14 | 2026-06-14 | /onboard | Pre-existing module |
| FP-010 | src/payment/RefundController.java | file | agent-created | full | REQ-012, TODO-003 | — | def456 | 2026-06-15 | 2026-06-15 | TODO-003 | New endpoint |

## Open Questions
```

### Column definitions

| Column | Required | Values |
|--------|----------|--------|
| `ID` | Yes | `FP-001` sequential |
| `Path` | Yes | Repo-relative path or directory |
| `Granularity` | Yes | `file` \| `module` \| `directory` |
| `File provenance` | Yes | `agent-created` \| `agent-modified` \| `legacy` |
| `Enforcement` | Yes | `full` \| `deferred` |
| `Trace` | If agent-touched | REQ, ARCH, ADR, TODO IDs |
| `Tech debt` | If deferred | TD-* IDs |
| `Updated by` | Yes | `TODO-*` or `/onboard` |

### Granularity policy

| When | Granularity | List what |
|------|-------------|-----------|
| `/onboard` (brownfield) | `directory` / `module` | In-scope legacy areas with `deferred` enforcement |
| `/build` TODO complete | `file` | Only files created or modified in that TODO |
| Greenfield `/build` | `file` | Each agent-created file |
| `excluded_paths` in profile | — | Never register |

Most specific matching row wins when resolving a path.

---

# Tech Debt Register

Location:

```text
output/plans/tech-debt-register.md
```

Owner:

```text
project_manager
```

Purpose:

Track pre-existing non-compliance discovered during brownfield `/onboard`. Pre-existing brownfield gaps are non-blocking; newly introduced gaps remain blocking.

---

## Template

```yaml
---
id: TECH-DEBT-REGISTER
title: Tech Debt Register
owner: project_manager
status: Approved
version: 1.0
last_updated: 2026-06-14
related_artifacts: [PROJECT-PROFILE, FILE-PROVENANCE-REGISTER]
blocking_open_questions: 0
---
```

```md
## Tech Debt Entries

| ID | Gap | Area | Severity | Gating | Status | Linked paths | Notes |
|----|-----|------|----------|--------|--------|--------------|-------|
| TD-001 | No Flyway migrations | Database | Medium | No | Open | FP-001 | Pre-existing at onboard |

## Open Questions
```

### Rules

- `Gating` must be `No` for pre-existing brownfield gaps registered at `/onboard`.
- Reviewer and QA must not fail validation based solely on registered pre-existing brownfield debt.
- Newly introduced gaps (agent-caused or unregistered) remain blocking until registered with correct gating per project-manager.

---

# Requirements Baseline

Location:

```text
output/requirements/requirements-baseline.md
```

Owner:

```text
solution_architect
```

Purpose:

Brownfield `/onboard` only. Documents as-built functional and non-functional requirements inferred from the existing system. Change requirements are added at `/design`.

Greenfield: `REQ-*` IDs are assigned in architecture docs at `/design` (in each doc's **Requirements Addressed** section). No separate requirements-baseline file is required.

---

## Template

```yaml
---
id: REQUIREMENTS-BASELINE
title: Requirements Baseline
owner: solution_architect
status: Approved
version: 1.0
last_updated: 2026-06-14
artifact_kind: as-built
related_artifacts: [PROJECT-PROFILE]
blocking_open_questions: 0
---
```

```md
## Baseline Requirements

| ID | Requirement | Type | Confidence | Source |
|----|-------------|------|------------|--------|
| REQ-001 | System processes card payments | Functional | confirmed | Code + docs |

## Open Questions
```

---
