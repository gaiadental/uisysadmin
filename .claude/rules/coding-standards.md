
# Coding Standards

> Loading: always active. Imported into every session via the root `CLAUDE.md` (`@.claude/rules/coding-standards.md`). Ported from Cursor's `.cursor/rules/coding-standards.mdc` (`alwaysApply: true`) — content is unchanged except path references.

Version: 2.0

Last Updated: 2026-06-24

Status: Active

---

# Purpose

This document defines universal code quality expectations, review criteria, traceability requirements, and governance rules that apply across all stacks.

This document governs:

* developer_backend
* developer_frontend
* code_reviewer
* debugger
* unit_test_writer
* qa

Stack-specific code quality rules live in `standards-backend.md` and `standards-frontend.md`. Technology and implementation patterns live in `tech-stack-backend.md` and `tech-stack-frontend.md`. Load the applicable stack standards per TODO file scope.

All implementation work must comply with this standard and the applicable stack standards unless explicitly overridden by an approved ADR.

Full section index: `.claude/docs/rules-index.md` -> `coding-standards.md`.

---

# Core Principles

Code must be:

* Correct
* Readable
* Maintainable
* Testable
* Secure
* Observable
* Consistent
* Traceable

Code is written for humans first and computers second.

---

# Standards Map

| Concern | Document |
|---------|----------|
| Backend code quality | `standards-backend.md` |
| Frontend code quality | `standards-frontend.md` |
| Backend technology | `tech-stack-backend.md` |
| Frontend technology | `tech-stack-frontend.md` |
| Security | `tech-stack-security.md` |
| Integration / API contracts | `tech-stack-integration.md` |

**Precedence:** `agent-governance.md` → `coding-standards.md` (this file) → `standards-*` → `tech-stack-*`

---

# Code Review Standards

## Purpose

Reviews improve quality.

Reviews are not personal criticism.

---

## Review Areas

### Correctness

Does the code satisfy requirements?

### Maintainability

Can future developers understand it?

### Security

Does it follow security standards?

### Performance

Are there obvious inefficiencies?

### Testing

Are tests adequate?

---

## Review Output

Findings should be categorized:

* Critical
* High
* Medium
* Low

---

# Refactoring Standards

Refactoring should:

* Preserve behavior
* Improve readability
* Improve maintainability

---

## Requirements

Refactoring must not introduce functional changes unless explicitly requested.

---

# Technical Debt Standards

Technical debt must be explicit.

When debt is accepted:

Document:

* Reason
* Risk
* Future remediation plan

---

# Debugging Standards

Debugging must be evidence-driven.

---

## Requirements

Identify:

* Symptoms
* Root cause
* Impact
* Validation approach

---

## Prohibited

Guessing root causes without evidence.

---

# Traceability Requirements

Implementation must reference:

* Requirement ID
* Architecture ID
* ADR ID
* TODO ID

Example:

```text
Requirement:
REQ-001

Architecture:
ARCH-BE-001

Decision:
ADR-003

Task:
TODO-012
```

Traceability is recorded in `output/plans/master-todo.md`, `output/plans/file-provenance-register.md` (Trace column), and related artifacts — **not** in source-code file headers or provenance comments.

---

# Completion Checklist

Before implementation is considered complete:

* Requirements satisfied
* Architecture followed
* ADRs followed
* Applicable stack standards loaded and satisfied per TODO file scope
* Security requirements satisfied
* Tests added
* Logging added
* Documentation updated
* Code reviewed
* No unresolved critical findings

---

# Escalation Triggers

Escalate when:

* Requirements are unclear
* Architecture is unclear
* ADR is missing
* Security requirements conflict
* Standards conflict
* Multiple interpretations exist

Status:

Pending Clarification

must be assigned.

---

# Final Rule

Code must be:

* Correct
* Readable
* Testable
* Maintainable
* Secure
* Traceable

Code must never rely on:

* Assumptions
* Hidden behavior
* Undocumented decisions

When in doubt:

Stop.

Request clarification.

Status:

Pending Clarification
