
# Artifact Templates — Build

> Loading: on demand only, per checkpoint. Read this file when the active command's or agent's *Mandatory References* / *Template bundles* section names it. Artifact templates for Checkpoint C — Root Cause Analysis Report, Unit Test Report Ported from Cursor's `.cursor/rules/artifact-templates/artifact-templates-build.mdc`.

Version: 1.0

Last Updated: 2026-06-30

Status: Active

---

# Purpose

Artifact templates for Checkpoint **C** (`/build`). General rules, metadata, and the Agent Artifact Index live in `artifact-standards.md` (core).

Before writing any artifact in this file, also load `artifact-standards.md` (core) for general metadata rules, mandatory sections, and the Agent Artifact Index.

---
# Root Cause Analysis Report

Location:

```text
output/reports/rca-report-TODO-{id}.md
```

Owner:

debugger

---

## Template

YAML front-matter must include `related_todo`, `related_unit_test_report` (path when known), and `last_updated: YYYY-MM-DD HH:MM`.

```md
Title:
Owner:
Status:

## Problem Description

## Symptoms

## Investigation

## Root Cause

## Impact

## Proposed Fix

## Validation Plan

## Open Questions
```

---

# Unit Test Report

Location:

```text
output/reports/unit-test-report-TODO-{id}.md
```

Owner:

unit_test_writer

---

## Template

YAML front-matter must include `related_todo`, `execution_overall: PASS | FAIL`, and `last_updated: YYYY-MM-DD HH:MM`.

```md
Title:
Owner:
Status:

## Scope

## Test Cases

## Execution Summary

| Metric | Value |
|--------|-------|
| Command | mvn test |
| Run at | YYYY-MM-DD HH:MM |
| Total | |
| Passed | |
| Failed | |
| Errors | |
| Skipped | |
| Overall | PASS / FAIL |

## Execution Results

On **PASS**: one line — `{N} tests passed` (no per-test table).

On **FAIL**: table of **failed tests only**:

| Test | Class | Result | Notes |
|------|-------|--------|-------|
| | | Failed | First assertion or error line |

## Handoff (FAIL only)

- Failing tests: …
- Failure class: `obvious` | `unclear` (orchestrator uses this for Path A vs Path B)
- Path A (obvious): orchestrator sets `failure_handoff` -> **STOP** — user reviews, then `/build {TODO-ID}` -> routed implementer
- Path B (unclear): orchestrator delegates debugger in same `/build` -> RCA -> `failure_handoff` -> **STOP** — user reviews report + RCA, then `/build {TODO-ID}` -> routed implementer
- `resume_agent` at stop is **`developer-backend`** or **`developer-frontend`** (same as the TODO implementer — next `/build` after user review)
- Reports win over chat

## Coverage

## Edge Cases

## Mocking Strategy

## Open Questions
```

---
