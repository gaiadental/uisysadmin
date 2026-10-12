---
id: PROJECT-PROFILE
title: Project Profile
owner: orchestrator
status: Approved
version: 1.0
last_updated: 2026-10-10
blocking_open_questions: 0

provenance: greenfield
managed_by: GAIA IT
enforcement_mode: enforced
pipeline_version: "3.0"
onboarded_by: /design

baseline_commit: null
baseline_date: 2026-10-10
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
included_paths:
  - src/
excluded_paths:
  - .claude/
  - .cursor/
  - node_modules/
  - dist/
service_roots: []
related_repositories:
  - path: ../Microservices/gaia-platform-architecture
    role: Platform contracts (ARCH-SOLUTION-001, ARCH-BE-001, ARCH-SEC-001, SP-DEC-01)
  - path: ../Microservices/apigateway
    role: API Gateway (ARCH-BE-002)
  - path: ../Microservices/auth-service
    role: Authentication, system users, roles, sessions (ARCH-BE-003)
  - path: ../Microservices/master-data-service
    role: Master data (tenants, tenant categories, countries)
---

Title: Project Profile
Owner: orchestrator
Status: Approved
Version: 1.0
Last Updated: 2026-10-10
Source Requirements: [FE Requirement] system-principal-web v1.0 (RAG-FE-SP-001)
Related Artifacts:
- output/plans/file-provenance-register.md

## At a Glance

- Provenance and enforcement posture for the System Principal (SP) web app in this repository
- Greenfield, enforced. Approved by the user at the Checkpoint A gate, 2026-10-10
- Key references: pipeline v3.0, governance bundle v2.0; contract source `[FE Requirement] system-principal-web v1.0`

## Purpose

Authoritative provenance record for this repository. Every agent reads this before stage work.

## Scope

This repository owns the SP web frontend (`src/`). Backend contracts are owned by the platform repository `../Microservices/gaia-platform-architecture`; this repository does not design backend services. Platform-level architecture is referenced, not duplicated (user decision 2026-10-10: frontend-only design here).

## Provenance

`provenance: greenfield`. The existing `src/` content is a mock-data prototype (`src/data/*`, layout and components). The user decided that prototype layout and components may be reused, but are not the contract. The API contract is the FE requirement document, not the mock data.

## Baseline

| Field | Value |
|-------|-------|
| Baseline commit | `e125b02` (main) |
| Baseline date | 2026-10-10 |
| Baseline ref | `main` |
| Pipeline version | 3.0 |
| Governance version | 2.0 |
| Onboarded by | `/design` (greenfield bootstrap) |

## Governance Anchor

`.claude/` (governance v2.0). No root `CLAUDE.md` in this repository; agents load the rule files by path as their command requires.

## Registers

- File provenance: `output/plans/file-provenance-register.md` (empty bootstrap; no agent-created or agent-modified files yet)
- Tech debt: not applicable (greenfield)

## Enforcement Rules

Full current standards apply to all code delivered in TODO scope. Pre-existing mock code not in TODO scope is not assessed until a TODO touches it.

## Modification History

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-10-10 | Greenfield bootstrap at first `/design` (user decisions 2026-10-10: greenfield; FE-only design) |
| 1.0 | 2026-10-10 | Approved by the user at the Checkpoint A gate (explicit approval of ARCH-FE-001 v0.2 and this profile) |

## References

- `[FE Requirement] system-principal-web v1.0.md` (repository root and `../Microservices/gaia-platform-architecture/RAG-Requirement/`)
- `../Microservices/gaia-platform-architecture/output/clarifications.md` (SP-DEC-01)
- `../Microservices/gaia-platform-architecture/output/plans/orchestration-state.md` (2026-10-10 findings)

## Open Questions

None
