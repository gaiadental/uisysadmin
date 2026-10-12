
# Artifact Standards

> Loading: always active. Imported into every session via the root `CLAUDE.md` (`@.claude/rules/artifact-standards.md`). Ported from Cursor's `.cursor/rules/artifact-standards.mdc` (`alwaysApply: true`) — content is unchanged except path references.

Version: 3.0

Last Updated: 2026-06-30

Status: Active

---

# Purpose

This document defines mandatory formats for all project artifacts.

All agents must follow these templates when creating or updating artifacts.

Custom formats are not allowed unless explicitly approved.

Per-artifact templates live in `artifact-templates/*.md` (see Agent Artifact Index). Full section index: `.claude/docs/rules-index.md` -> `artifact-standards.md`.

---

# Agent Artifact Index

Single map of **who produces what** and where the canonical template lives. Agent contracts (`agents/*.md`) describe behavior and gates; this document owns the index and cross-cutting rules; template bodies live in bundle files per the Template column.

**Rule:** Before writing an artifact, load the template file named in the Template column for that row.

**Rule:** Use the template section linked below. Do not embed full artifact templates in agent contracts.

| Agent | Artifacts (owner) | Location | Template |
|-------|-------------------|----------|----------|
| orchestrator | Project Profile | `output/project-profile.md` | `artifact-templates-onboard.md` -> Project Profile |
| orchestrator | Orchestration State | `output/plans/orchestration-state.md` | *Template in `CLAUDE.md` -> Orchestrator Contract -> Orchestration State Artifact* |
| orchestrator | Clarifications Register | `output/clarifications.md` | `artifact-templates-decision.md` -> Clarifications Register |
| solution-architect | Solution architecture | `output/architecture/ARCH-SOLUTION-*` | `artifact-templates-design.md` -> Architecture Documents |
| architect-backend | Backend architecture | `output/architecture/ARCH-BE-*` | `artifact-templates-design.md` -> Architecture Documents |
| architect-frontend | Frontend architecture | `output/architecture/ARCH-FE-*` | `artifact-templates-design.md` -> Architecture Documents |
| security-architect | Security architecture | `output/architecture/ARCH-SEC-*` | `artifact-templates-design.md` -> Architecture Documents |
| decision-manager | Architecture Decision Records | `output/decisions/ADR-*` | `artifact-templates-decision.md` -> Architecture Decision Records |
| project-manager | Implementation Plan | `output/plans/implementation-plan.md` | `artifact-templates-decision.md` -> Implementation Plan |
| project-manager | Master TODO | `output/plans/master-todo.md` | `artifact-standards.md` -> Master TODO |
| project-manager | Progress Tracker | `output/plans/progress-tracker.md` | `artifact-templates-decision.md` -> Progress Tracker |
| project-manager | File Provenance Register | `output/plans/file-provenance-register.md` | `artifact-templates-onboard.md` -> File Provenance Register |
| project-manager | Tech Debt Register | `output/plans/tech-debt-register.md` | `artifact-templates-onboard.md` -> Tech Debt Register |
| solution-architect | Requirements Baseline | `output/requirements/requirements-baseline.md` | `artifact-templates-onboard.md` -> Requirements Baseline |
| developer_backend | Working code + TODO status updates | Paths in TODO **File scope** | `artifact-standards.md` -> Master TODO (entry format) |
| developer_frontend | Working code + TODO status updates | Paths in TODO **File scope** | `artifact-standards.md` -> Master TODO (entry format) |
| unit-test-writer | Unit Test Report | `output/reports/unit-test-report-TODO-{id}.md` | `artifact-templates-build.md` -> Unit Test Report |
| debugger | Root Cause Analysis Report | `output/reports/rca-report-TODO-{id}.md` | `artifact-templates-build.md` -> Root Cause Analysis Report |
| reviewer | Code Review Report | `output/reports/` | `artifact-templates-validate.md` -> Code Review Report |
| qa | QA Report | `output/reports/` | `artifact-templates-validate.md` -> QA Report |
| technical-writer | Technical Documentation | `output/docs/` | `artifact-templates-document.md` -> Technical Documentation |
| technical-writer | Release Notes | `output/docs/` | `artifact-templates-document.md` -> Release Notes |

Human-facing directory tree: `workflow.md` -> **Artifact map**. Per-artifact bodies: sections in `artifact-templates/*.md` per Template column.

---

# General Rules

## Required Metadata

Every artifact must begin with:

```md
Title:
Owner:
Status:
Version:
Last Updated:
Source Requirements:
Related Artifacts:
```

Example:

```md
Title: User Service Design

Owner: architect_backend

Status: Draft

Version: 1.0

Last Updated: 2026-08-15

Source Requirements:
- REQ-001
- REQ-005

Related Artifacts:
- ADR-003
- ARCH-SOLUTION-001
```

---

## Machine-Readable Front-Matter

To serve both humans and agents, every artifact should additionally carry a YAML front-matter block at the very top, before the human-readable metadata. Agents parse the front-matter deterministically; humans read the body. Keep the two consistent.

```yaml
---
id: ARCH-BE-001
title: User Service Design
owner: architect_backend
status: Draft
version: 1.0
last_updated: 2026-08-15
source_requirements: [REQ-001, REQ-005]
related_artifacts: [ADR-003, ARCH-SOLUTION-001]
blocking_open_questions: 0
---
```

`blocking_open_questions` is the count of `Blocking = Yes, Status = Open` rows in the artifact's Open Questions table. A checkpoint cannot clear while any referenced artifact has `blocking_open_questions > 0`.

### Timestamps in `output/reports/`

Reports under `output/reports/` use **date and time** in YAML front-matter and body metadata:

```text
last_updated: 2026-06-18 14:30
Last Updated: 2026-06-18 14:30
```

Format: `YYYY-MM-DD HH:MM` (24-hour, local time of the test run or report write). Other artifacts may keep date-only timestamps unless updated.

### Report filenames

| Type | Pattern | Owner |
|------|---------|-------|
| Unit Test Report | `unit-test-report-TODO-{id}.md` | unit-test-writer |
| Root Cause Analysis | `rca-report-TODO-{id}.md` | debugger |

One active RCA per TODO; supersede by writing a new version in the same file with incremented `version` and updated `last_updated`.

## At a Glance

Immediately after the metadata, every artifact should include a short human summary:

```md
## At a Glance

- What this artifact decides / delivers (1 line)
- Status and what is blocking it (1 line)
- Key references (requirements / ADRs / architecture)
```

## Allowed Status Values

Only the following values are allowed:

* Draft
* Pending Clarification
* Pending Approval
* Approved
* Superseded
* Deprecated

---

## Optional Front-Matter Extensions

Use when applicable. Do not introduce new `status` values.

```yaml
artifact_kind: as-built | target | retrospective
confidence: confirmed | inferred    # retrospective ADRs only
```

| `artifact_kind` | When |
|-----------------|------|
| `as-built` | Brownfield `/onboard` — documents current system reality |
| `target` | `/design` — documents intended change or greenfield target |
| `retrospective` | `/onboard` — ADRs for decisions already embedded in legacy code |

`confidence: inferred` retrospective ADRs remain `Pending Approval` until the user approves Checkpoint O.

---

## Mandatory Sections

Every artifact must include:

```md
## Purpose

## Scope

## References

## Open Questions
```

The Open Questions section must be a structured table so both humans and agents can read it and so gate logic can act on it:

```md
## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | ... | ... | ... | architect_backend | Yes | Open | — |
| OQ2 | ... | ... | ... | architect_backend | No | Open | Documented default: ... |
```

- `Blocking` is `Yes` or `No`. `Yes` means the artifact (and the checkpoint that depends on it) cannot be approved while the row is `Open`.
- `Status` is `Open`, `Answered`, or `Deferred`. Non-blocking items may be `Deferred` with a documented default and still allow progress.
- Keep the artifact's `blocking_open_questions` front-matter count in sync with the number of `Blocking = Yes, Status = Open` rows.

If no open questions exist:

```md
## Open Questions

None
```

---

# Master TODO

Location:

output/plans/

Owner:

project_manager

---

## File Naming

```text
master-todo.md
```

---

## TODO Template

```md
# TODO-001

Description:

Owner:

```text
developer_backend | developer_frontend
```

Status:

Priority:

Dependencies:

Related Requirement:

Related ADR:

Related Architecture:

File scope:

Notes:
```

`File scope` lists repo-relative paths or modules the TODO will create or modify. Required for enforcement scope in `/build` and `/validate`. **Owner** must be `developer_backend` or `developer_frontend` (one implementer per TODO). Mixed backend + frontend paths in one TODO are not allowed — split into separate TODOs. Reviewer and QA resolve scope from this field plus `file-provenance-register.md`.

---

## TODO Status Values

Only:

```text
Not Started
In Progress
Blocked
Completed
Cancelled
```

---

## TODO Priority Values

Only:

```text
Critical
High
Medium
Low
```

---

# Traceability Requirements

Every artifact must reference related artifacts.

Minimum requirements:

Architecture Document

Must reference:

* Requirements
* ADRs

ADR

Must reference:

* Architecture Documents

TODO

Must reference:

* Requirement
* Architecture
* ADR

Report

Must reference:

* TODO
* Requirement

Documentation

Must reference:

* Architecture
* ADR

---

# Artifact Validation Checklist

Before marking any artifact complete:

* Required metadata exists
* Status is valid
* Owner is valid
* References are present
* Open Questions section exists
* Traceability links exist
* No unresolved clarification requests exist

## Provenance and Gate Checks

Before advancing checkpoints or marking delivery artifacts complete, verify:

| Gate / context | Check |
|----------------|-------|
| Any project — before `/design` or change work | `output/project-profile.md` exists and reads `Status: Approved` (greenfield: bootstrapped at first `/design`) |
| Brownfield — before `/design` | Checkpoint O (`/onboard`) approved: as-built `ARCH-*`, retrospective `ADR-*`, `requirements-baseline.md`, `tech-debt-register.md`, and `file-provenance-register.md` all `Approved` |
| `/decision` — plan artifacts | Every TODO in `master-todo.md` includes a **File scope** field |
| `/build` complete — before `/validate` | `file-provenance-register.md` has `FP-*` rows for all paths in the completed TODO(s) (`agent-created` or `agent-modified`, `enforcement: full`) |
| Brownfield — tech debt at onboard | Pre-existing gaps in `tech-debt-register.md` use `Gating: No` |
| State consistency (all checkpoints) | `orchestration-state.md` and source artifact `Status` agree — fail closed if they do not |

If any check fails:

Status must not be Approved.
