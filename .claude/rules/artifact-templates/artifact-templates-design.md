
# Artifact Templates — Design

> Loading: on demand only, per checkpoint. Read this file when the active command's or agent's *Mandatory References* / *Template bundles* section names it. Artifact templates for Checkpoint A — Architecture Documents Ported from Cursor's `.cursor/rules/artifact-templates/artifact-templates-design.mdc`.

Version: 1.1

Last Updated: 2026-07-02

Status: Active

---

# Purpose

Artifact templates for Checkpoint **A** (`/design`). General rules, metadata, and the Agent Artifact Index live in `artifact-standards.md` (core).

Before writing any artifact in this file, also load `artifact-standards.md` (core) for general metadata rules, mandatory sections, and the Agent Artifact Index.

**Section applicability:**

| Section | ARCH-SOLUTION | ARCH-BE / ARCH-FE / ARCH-SEC |
|---------|---------------|------------------------------|
| Binding Decisions | Required | Omit |
| Delegated Decisions | Required | Omit |
| Domain Scope | Required | Omit |
| Constraints (conformance line) | Optional | Required — see domain template |

On brownfield `/onboard` as-built `ARCH-SOLUTION-*`, Binding Decisions, Delegated Decisions, and Domain Scope are **optional** (inventory, not target constraints). Conflict and binding rules apply at `/design` only.

---
# Architecture Documents

Location:

output/architecture/

Owner:

Architects

---

## Template — ARCH-SOLUTION

Use for `ARCH-SOLUTION-*`. Binding Decisions record project-specific shape and exceptions only; stack defaults live in `tech-stack-*` and are delegated to domain architects.

```md
Title:
Owner:
Status:
Version:
Last Updated:

## Purpose

## Scope

## Requirements Addressed

Assign `REQ-*` IDs here at `/design`. Greenfield projects do not use `requirements-baseline.md`; this section is the authoritative requirement source for greenfield. Brownfield change requirements are also assigned here; reference as-built requirements from `requirements-baseline.md` where unchanged.

## Binding Decisions

| ID | Topic | Decision | Rationale |

Record project-specific shape and exceptions only (service boundaries, integration topology class, data ownership, deployment topology class, multi-runtime deviations). Do not record framework versions or auth mechanism details unless an approved exception.

## Delegated Decisions

| Topic | Owner | Constraint |
| Backend stack | architect-backend | Per tech-stack-backend.md; ADR if deviating |
| Frontend stack | architect-frontend | Per tech-stack-frontend.md |
| AuthN/AuthZ | security-architect | Per tech-stack-security.md |

## Domain Scope

| Domain | Agent | Status | Notes |
| backend | architect-backend | Active / Cancelled | |
| frontend | architect-frontend | Active / Cancelled | |
| security | security-architect | Active / Cancelled | |

## Constraints

## Design

## Alternatives Considered

## Risks

## Dependencies

## Open Questions
```

---

## Template — Domain (ARCH-BE, ARCH-FE, ARCH-SEC)

Use for `ARCH-BE-*`, `ARCH-FE-*`, and `ARCH-SEC-*`. Omit Binding Decisions, Delegated Decisions, and Domain Scope.

```md
Title:
Owner:
Status:
Version:
Last Updated:

## Purpose

## Scope

## Requirements Addressed

Assign `REQ-*` IDs here at `/design`. Greenfield projects do not use `requirements-baseline.md`; this section is the authoritative requirement source for greenfield. Brownfield change requirements are also assigned here; reference as-built requirements from `requirements-baseline.md` where unchanged.

## Constraints

Must conform to ARCH-SOLUTION Binding Decisions and ARCH-SEC for trust topics.

## Design

## Alternatives Considered

## Risks

## Dependencies

## Open Questions
```

---

## Architecture Identifier Format

```text
ARCH-SOLUTION-001
ARCH-BE-001
ARCH-FE-001
ARCH-SEC-001
```

Examples:

```text
ARCH-SOLUTION-001
ARCH-BE-003
ARCH-FE-002
ARCH-SEC-001
```

---
