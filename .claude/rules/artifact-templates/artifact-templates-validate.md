
# Artifact Templates — Validate

> Loading: on demand only, per checkpoint. Read this file when the active command's or agent's *Mandatory References* / *Template bundles* section names it. Artifact templates for Checkpoint D — Code Review Report, QA Report Ported from Cursor's `.cursor/rules/artifact-templates/artifact-templates-validate.mdc`.

Version: 1.0

Last Updated: 2026-06-30

Status: Active

---

# Purpose

Artifact templates for Checkpoint **D** (`/validate`). General rules, metadata, and the Agent Artifact Index live in `artifact-standards.md` (core).

Before writing any artifact in this file, also load `artifact-standards.md` (core) for general metadata rules, mandatory sections, and the Agent Artifact Index.

---
# Code Review Report

Location:

output/reports/

Owner:

code_reviewer

---

## Template

```md
Title:
Owner:
Status:

## Scope Reviewed

## Findings

### Critical

### High

### Medium

### Low

## Recommendations

## Approval Status

Approved:
Yes / No

## Open Questions
```

---

# QA Report

Location:

output/reports/

Owner:

qa

---

## Template

```md
Title:
Owner:
Status:

## Scope Tested

## Test Results

Passed:

Failed:

Blocked:

## Defects

### Critical

### High

### Medium

### Low

## Risk Assessment

## Release Recommendation

Go / No-Go

## Open Questions
```

---
