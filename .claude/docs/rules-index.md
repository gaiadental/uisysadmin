---
version: 2.4
last_updated: 2026-07-02
---

# Rules Index

Master table of contents for all governance rules in `.claude/rules/`. When adding, renaming, or removing a section in any rule file, update this index and the file's version in the same change (see `the original .claude/CHANGELOG.md (Cursor-era history; not ported to Claude Code)`).

---

## Quick reference

| File | Ver | Always on | Scope / globs | Primary audience |
|------|-----|-----------|-----------------|------------------|
| [`agent-governance.md`](rules/agent-governance.md) | 1.3 | Yes | All agents | Every agent, every stage |
| [`agent-orchestration.md`](rules/agent-orchestration.md) | 4.1 | Yes | Orchestrator | Pipeline sequencing, gates, resume |
| [`architecture-principles.md`](rules/architecture-principles.md) | 1.0 | Yes | All architects | `/design`, ADRs |
| [`artifact-standards.md`](rules/artifact-standards.md) | 3.0 | Yes | All agents | Core index, general rules, Master TODO, validation |
| [`artifact-templates/artifact-templates-onboard.md`](rules/artifact-templates/artifact-templates-onboard.md) | 1.0 | No | Checkpoint O, greenfield `/design` bootstrap | Project profile, registers, requirements baseline |
| [`artifact-templates/artifact-templates-design.md`](rules/artifact-templates/artifact-templates-design.md) | 1.1 | No | Checkpoint A | Architecture documents; ARCH-SOLUTION binding sections |
| [`artifact-templates/artifact-templates-decision.md`](rules/artifact-templates/artifact-templates-decision.md) | 1.0 | No | Checkpoint B | ADRs, plans, progress, clarifications |
| [`artifact-templates/artifact-templates-build.md`](rules/artifact-templates/artifact-templates-build.md) | 1.0 | No | Checkpoint C | Unit test report, RCA report |
| [`artifact-templates/artifact-templates-validate.md`](rules/artifact-templates/artifact-templates-validate.md) | 1.0 | No | Checkpoint D | Code review, QA reports |
| [`artifact-templates/artifact-templates-document.md`](rules/artifact-templates/artifact-templates-document.md) | 1.0 | No | Checkpoint E | Technical documentation, release notes |
| [`coding-standards.md`](rules/coding-standards.md) | 2.0 | Yes | All implementation + assessor roles | Universal quality · review · traceability |
| [`standards-backend.md`](rules/standards-backend.md) | 1.0 | No | `**/*.{go,java}` | Backend code quality |
| [`standards-frontend.md`](rules/standards-frontend.md) | 1.0 Active | No | `**/*.{ts,tsx,js,jsx,vue}` | Frontend code quality |
| [`document-encoding.md`](rules/document-encoding.md) | 1.1 | No | `**/*.{md,mdc,txt}` | All agents writing text |
| [`governance-editing.md`](rules/governance-editing.md) | 1.1 | No | `**/.claude/**/*.{md,mdc,txt}` | Anyone tuning `.claude/` |
| [`tech-stack-backend.md`](rules/tech-stack-backend.md) | 1.5 | No | `**/*.{go,java}` | Backend technology and patterns |
| [`tech-stack-frontend.md`](rules/tech-stack-frontend.md) | 1.4 | No | `**/*.{ts,tsx,js,jsx,vue}` | Frontend design and code |
| [`tech-stack-integration.md`](rules/tech-stack-integration.md) | 1.1 | Yes | Integration points | APIs, events, messaging |
| [`tech-stack-security.md`](rules/tech-stack-security.md) | 1.0 | Yes | Security-related work | Auth, encryption, compliance |

---

## Contents by file

### `agent-governance.md` — Agent Governance Standard

| Section | Topic |
|---------|--------|
| Core Principles | Source of truth, single ownership, separation of responsibilities |
| No Assumptions Policy | Forbidden inference; unknown stays unknown |
| Clarification Policy | When to stop; required clarification format |
| Conflict Resolution Policy | Detect, explain, ask, stop |
| Escalation Policy | When to escalate before proceeding |
| Decision Policy | Recommendations vs decisions; user approval required |
| Artifact Policy | Artifact-first; required output folders |
| Progress Tracking Policy | `master-todo.md`, `progress-tracker.md`, TODO format |
| Open Questions Policy | Blocking vs non-blocking open questions |
| Architecture Freeze Policy | Approved ADRs are immutable |
| Approval Policy | Draft is not approval; `Status: Approved` |
| Traceability Policy | REQ / ARCH / ADR / TODO links |
| Completion Policy | When work may be marked complete |
| Mandatory Final Check | Pre-completion verification checklist |

---

### `document-encoding.md` — Document Encoding Standard

| Section | Topic |
|---------|--------|
| Scope | Self-exemption when editing this file |
| File Encoding | UTF-8; no legacy encodings |
| Typography | Em dash, en dash, ASCII `->`, straight quotes |
| Forbidden in committed text | `�`, mojibake, C1 control chars |
| Pre-save checklist | Scan before finishing markdown edits |
| Examples | Bad vs good punctuation |

---

### `governance-editing.md` — Governance Editing Standard

| Section | Topic |
|---------|--------|
| Protected fields | Agent, rule, and command frontmatter; orchestration slugs |
| Protected sections | Mandatory References, Inputs, Non-Responsibilities, etc. |
| Safe edit rules | Minimize scope, replace don't hollow, rename in lockstep |
| Pre-complete checklist | Grep slugs, update registry and index |

---

### `agent-orchestration.md` — Agent Orchestration

| Section | Topic |
|---------|--------|
| Provenance first | Read order: profile, registers, orchestration state |
| Delegation map | Domain to subagent table |
| Default execution order | Brownfield onboard + stages 1–13; `/design` tiered (Solution → Security → domain parallel) |
| Approval gates | Gate conditions between stages; draft-complete intra-checkpoint transitions |
| Checkpoints and commands | `/onboard` through `/document` |
| Brownfield enforcement | Advisory mode; scoped review and QA |
| Clarifications and blocking | `clarifications.md` roll-up |
| Approval recording (ownership) | State file + artifact status; fail closed |
| Resume protocol | Pause and resume across sessions |
| Artifact locations | `output/` tree |
| Orchestration rules | Single ownership; no self-approve |

---

### `architecture-principles.md` — Architecture Principles

| Section | Topic |
|---------|--------|
| Architecture Goals | Simplicity, scalability, security, observability, testability, … |
| Principles 1–20 | Requirements first through clarification over guessing |
| Architecture Review Checklist | Pre-approval architecture checklist |
| Escalation Triggers | When to use `Pending Clarification` |
| Final Rule | Requirement-driven, traceable, documented decisions |

---

### `artifact-standards.md` — Artifact Standards (core)

| Section | Topic |
|---------|--------|
| Agent Artifact Index | Who produces what; template bundle links |
| General Rules | Metadata, YAML front-matter, status values, Open Questions table |
| Master TODO | TODO template; **File scope** field |
| Traceability Requirements | Cross-artifact links |
| Artifact Validation Checklist | Pre-approval checks; provenance and gate checks |

---

### `artifact-templates-onboard.md` — Onboard templates (Checkpoint O)

| Section | Topic |
|---------|--------|
| Project Profile | `output/project-profile.md` template; `service_roots` (`path`, `stack`, `readme`) |
| File Provenance Register | Path-level enforcement scope |
| Tech Debt Register | Brownfield pre-existing gaps |
| Requirements Baseline | Brownfield as-built requirements |

---

### `artifact-templates-design.md` — Design templates (Checkpoint A)

| Section | Topic |
|---------|--------|
| Architecture Documents | `ARCH-*` templates; section applicability by doc type |
| Template — ARCH-SOLUTION | Binding Decisions, Delegated Decisions, Domain Scope (required at `/design`) |
| Template — Domain | ARCH-BE / ARCH-FE / ARCH-SEC; conformance to bindings and ARCH-SEC |
| Architecture Identifier Format | `ARCH-SOLUTION-*`, `ARCH-BE-*`, `ARCH-FE-*`, `ARCH-SEC-*` |

---

### `artifact-templates-decision.md` — Decision templates (Checkpoint B)

| Section | Topic |
|---------|--------|
| Architecture Decision Records (ADR) | `ADR-*` template |
| Implementation Plan | Phases, objectives, deliverables |
| Roadmap | Milestones |
| Progress Tracker | Overall progress |
| Clarifications Register | Roll-up of all open questions |

---

### `artifact-templates-build.md` — Build templates (Checkpoint C)

| Section | Topic |
|---------|--------|
| Root Cause Analysis Report | Debugger output |
| Unit Test Report | Test scope, execution summary, handoff |

---

### `artifact-templates-validate.md` — Validate templates (Checkpoint D)

| Section | Topic |
|---------|--------|
| Code Review Report | Findings by severity |
| QA Report | Go / No-Go recommendation |

---

### `artifact-templates-document.md` — Document templates (Checkpoint E)

| Section | Topic |
|---------|--------|
| Technical Documentation | User and developer docs |
| Release Notes | Deployment and rollback notes |

---

### `coding-standards.md` — Coding Standards (universal core)

| Section | Topic |
|---------|--------|
| Core Principles | Correct, readable, testable, secure, traceable |
| Standards Map | Stack quality vs technology documents; precedence chain |
| Code Review Standards | Finding categories (Critical–Low) |
| Refactoring Standards | Preserve behavior |
| Technical Debt Standards | Explicit debt documentation |
| Debugging Standards | Evidence-driven root cause |
| Traceability Requirements | REQ / ARCH / ADR / TODO in artifacts |
| Completion Checklist | Pre-done verification; stack standards per TODO scope |
| Escalation Triggers | When to stop and clarify |
| Final Rule | Correct, readable, traceable code |

---

### `standards-backend.md` — Backend Coding Standards

| Section | Topic |
|---------|--------|
| Precedence | Governance → core → this file → `tech-stack-backend` |
| Pointers | Quality vs technology split; defer tool rules to stack doc |
| Core Principles | Backend-facing quality intro |
| General Rules | Readability, consistency, simplicity |
| Naming Standards | Classes, methods, variables, constants (Java/Go) |
| Function Design | SRP, size, parameters, side effects |
| Class Design | SRP, cohesion, coupling |
| Package Structure | Domain packages (`payment/`, not `utils/`) |
| SOLID Principles | Guidance, not dogma |
| Dependency Management | Approved dependencies only |
| Error Handling Standards | Explicit handling; no silent failures |
| Logging Standards | Levels; no secrets in logs |
| Configuration Standards | Externalized config |
| Security Standards | Implementation checklist; pointer to `tech-stack-security.md` |
| Database Standards | Queries, transactions, integrity |
| API Standards | Quality rules; pointer to `tech-stack-integration.md` |
| Testability Standards | Isolated, deterministic business logic |
| Unit Testing Standards | Naming, ~80% coverage, edge cases |
| Performance Standards | Evidence before optimization |
| Documentation Standards | Comments explain why, not what |
| Escalation Triggers | When to stop and clarify |
| Final Rule | Correct, readable, maintainable backend code |

---

### `standards-frontend.md` — Frontend Coding Standards

| Section | Topic |
|---------|--------|
| Precedence | Governance → core → this file → `tech-stack-frontend` |
| Pointers | Quality vs technology split; defers tools to `tech-stack-frontend` |
| Core Principles | Configuration, composition, type safety, accessibility |
| Naming Conventions | File, variable, function, and constant naming |
| Component Structure | File order, named exports, component template |
| Custom Hooks Standards | Hook rules, template, useEffect dependencies |
| Import Order | React → third-party → aliases → relative → styles |
| Styling Standards | Tailwind + `cn()`, class order, responsive patterns |
| TypeScript Standards | Types, signatures, prohibited patterns |
| State Management Standards | Local, reducer, context patterns (policy in tech-stack) |
| Testing Standards | Co-location, component/hook tests, requirements |
| Performance Guidelines | Memoization, lazy loading, next/image |
| Accessibility Standards | Accessible component patterns (policy in tech-stack) |
| Comments and Documentation | Why-not-what, JSDoc for public APIs |
| Security Standards | Zod validation, sanitization, safe logging |
| Code Review Checklist | Functionality, quality, performance, testing, security, a11y |
| Escalation Triggers | When to stop and clarify |
| Final Rule | Correct, type-safe, accessible frontend code |
| Open Questions | OQ1 answered — adopted from temp-reference |

---

### `tech-stack-backend.md` — Backend Technology Standards

| Section | Topic |
|---------|--------|
| Technology Selection Policy | Preferred vs ADR-required alternatives |
| Enterprise Capability Baseline | Mandatory and conditional capabilities matrix |
| Go Services | Go 1.26 + Fiber equivalent capabilities |
| Java Standard | Java 21 LTS; allowed alternatives |
| Framework Standard | Spring Boot 3.4.x |
| Build Standard | Maven |
| API Standard | REST, idempotency, naming |
| Database Standard | PostgreSQL |
| Database Migration Standard | Flyway rules |
| ORM Standard | Spring Data JPA |
| Caching Standard | Redis (conditional) |
| Messaging Standard | Kafka (conditional) |
| Input Validation Standard | Jakarta Bean Validation |
| API Documentation Standard | OpenAPI (springdoc) |
| Security Standard | OAuth2/OIDC, RBAC |
| Logging Standard | SLF4J + Log4j2, MDC, structured; levels → `standards-backend` |
| Observability Standard | Actuator, Micrometer, correlation ID |
| Resilience Standard | Resilience4j (conditional) |
| Monitoring Standard | Health, metrics, platform integration |
| Testing Standard | JUnit 5, Mockito, Testcontainers; coverage → `standards-backend` |
| Code Structure Standard | Controller -> Service -> Repository |
| Project Structure Standard | Microservice vs modular monolith; Java folder layout |
| Error Handling Standard | `@ControllerAdvice` |
| Configuration Standard | Externalized values |
| Dependency Management | Justification for new deps |
| Performance Standard | Profile before optimize; principle → `standards-backend` |
| Documentation Requirements | Purpose, APIs, config, ops |
| Architecture Compliance Checklist | Pre-approval backend checklist |
| Escalation Triggers | When to use `Pending Clarification` |
| Final Rule | Compliant, documented backend |

---

### `tech-stack-frontend.md` — Frontend Technology Standards

| Section | Topic |
|---------|--------|
| Technology Selection Policy | Preferred vs ADR-required alternatives |
| Enterprise Capability Baseline | Version-pinned capability matrix (React 19, Next 15, Bun, …) |
| Frontend Architecture Standard | Next.js App Router + feature-based folder tree |
| Framework Standard | React |
| Application Framework Standard | Next.js / Vite (ADR) |
| Language Standard | TypeScript (strict mode) |
| UI Component Standard | Component library selection |
| Design System Standard | Tokens, shared components |
| Styling Standard | Tailwind CSS, CSS Modules, … |
| State Management Standard | Zustand, Redux Toolkit, Context |
| Server State Standard | TanStack Query v5 |
| Routing Standard | Next.js App Router patterns |
| API Integration Standard | REST client, error handling |
| Authentication Standard | NextAuth / OIDC / OAuth2 flows |
| Authorization Standard | UI guards (backend enforces) |
| Performance Standard | Code splitting, lazy loading, next/image |
| Accessibility Standard | WCAG 2.1 Level AA |
| Security Standard (Frontend) | XSS, CSRF, CSP |
| Internationalization Standard | i18n (conditional) |
| Logging Standard | Client error logging; no secrets |
| API Client Standard | Axios with interceptors |
| Form Validation Standard | React Hook Form + Zod |
| Package Manager Standard | Bun (ADR for npm/pnpm/yarn) |
| Next.js Configuration Standard | Security headers, standalone output |
| TypeScript Configuration Standard | Strict mode, path aliases |
| Architectural Patterns Standard | Plugin/Registry, Strategy, Config-Driven, Composition |
| Testing Standard | Jest 29.x / Vitest, RTL, Playwright |
| Documentation Requirements | Purpose, setup, deployment |
| Architecture Compliance Checklist | Pre-approval frontend checklist |
| Escalation Triggers | When to use `Pending Clarification` |
| Final Rule | Compliant, accessible frontend |

---

### `tech-stack-integration.md` — Integration Technology Standards

| Section | Topic |
|---------|--------|
| Integration Principles | Contract-first, loose coupling, backward compatibility |
| Integration Ownership | Provider, consumer, owner |
| Integration Classification | Sync, async, batch |
| Frontend to Backend Integration | REST preferred |
| Backend to Backend Integration | REST, Kafka, gRPC (ADR) |
| API Standards | Versioning, request/response/error shape |
| Error Handling Standards | Consistent error structures |
| Event-Driven Standards | Event contract, naming, metadata |
| Messaging Standards | Kafka preferred; retry, DLQ |
| Idempotency Standards | Keys, dedup storage, retention |
| Timeout Standards | Timeout and retry policy |
| Circuit Breaker Considerations | High-risk external deps |
| File-Based Integration Standards | Format, encoding, validation |
| Security Requirements | Auth, encryption, audit |
| External System Integration Standards | Provider, protocol, failure handling |
| ISO 8583 Integration Principles | MTI, data elements, specs |
| HSM Integration Principles | Commands, key management |
| Monitoring Requirements | Success/failure metrics, alerts |
| Integration Documentation Requirements | Contract, auth, failure handling |
| Architecture Compliance Checklist | Pre-approval integration checklist |
| Escalation Triggers | When to use `Pending Clarification` |
| Final Rule | Contract-driven, documented integrations |

---

### `tech-stack-security.md` — Security Technology Standards

| Section | Topic |
|---------|--------|
| Security Governance | Security-by-design, shared responsibility |
| Security Classification | Public, Internal, Confidential, Restricted |
| Authentication Standards | OIDC / OAuth2 |
| Authorization Standards | RBAC; ABAC (ADR) |
| Session Management | Expiration, revocation |
| Password Standards | Argon2 / BCrypt |
| Secrets Management | Vault, no hardcoded secrets |
| Encryption Standards | TLS 1.2+, AES-256 at rest |
| API Security Standards | Auth, validation, audit logging |
| Input Validation Standards | Server-side mandatory |
| Output Encoding Standards | XSS, injection prevention |
| Database Security Standards | Least privilege |
| Logging Standards | No secrets in logs |
| Audit Standards | Traceability, accountability |
| Dependency Security Standards | Vulnerability monitoring |
| Infrastructure Security Standards | Least privilege, segmentation |
| Frontend Security Standards | XSS, CSRF, clickjacking |
| Backend Security Standards | Never trust frontend controls |
| Security Testing Standards | Auth, authz, input validation |
| Compliance Standards | PCI, GDPR, ISO 27001 |
| Incident Response Considerations | Reporting and escalation |
| Architecture Compliance Checklist | Pre-approval security checklist |
| Escalation Triggers | When to use `Pending Clarification` |
| Security Review Requirements | Seven review questions |
| Final Rule | Requirement-driven, documented security |

---

## Topic lookup

Find a topic across all rules. Section names match headings in the source file.

| Topic | File | Section |
|-------|------|---------|
| Approval gates | `agent-orchestration.md` | Approval gates |
| Approval policy (draft ≠ approved) | `agent-governance.md` | Approval Policy |
| Architect tiers (`/design` sequencing) | `agent-orchestration.md` | Default execution order |
| Binding Decisions (ARCH-SOLUTION) | `artifact-templates-design.md` | Template — ARCH-SOLUTION |
| Delegated Decisions (ARCH-SOLUTION) | `artifact-templates-design.md` | Template — ARCH-SOLUTION |
| Domain Scope (`/design`) | `artifact-templates-design.md` | Template — ARCH-SOLUTION |
| Draft-complete gates (intra-checkpoint) | `agent-orchestration.md` | Approval gates |
| Architecture principles (1–20) | `architecture-principles.md` | Principles 1–20 |
| Architecture review checklist | `architecture-principles.md` | Architecture Review Checklist |
| ADR template | `artifact-templates-decision.md` | Architecture Decision Records (ADR) |
| Architecture documents template | `artifact-templates-design.md` | Architecture Documents |
| Artifact formats and templates | `artifact-standards.md` | Agent Artifact Index (+ bundles per Template column) |
| Artifact validation | `artifact-standards.md` | Artifact Validation Checklist |
| Blocking open questions | `agent-governance.md` | Open Questions Policy |
| Brownfield enforcement | `agent-orchestration.md` | Brownfield enforcement |
| Checkpoints and commands | `agent-orchestration.md` | Checkpoints and commands |
| Clarifications register | `artifact-templates-decision.md` | Clarifications Register |
| Code review report template | `artifact-templates-validate.md` | Code Review Report |
| Backend code quality (naming, tests, packages) | `standards-backend.md` | General Rules through Documentation Standards |
| Code review findings | `coding-standards.md` | Code Review Standards |
| FE component naming | `standards-frontend.md` | Naming Conventions |
| FE component structure | `standards-frontend.md` | Component Structure |
| FE custom hooks | `standards-frontend.md` | Custom Hooks Standards |
| FE code review checklist | `standards-frontend.md` | Code Review Checklist |
| Frontend code quality | `standards-frontend.md` | All sections |
| Frontend unit test style | `standards-frontend.md` | Testing Standards |
| Code structure (layers) | `tech-stack-backend.md` | Code Structure Standard |
| Controller -> Service -> Repository | `tech-stack-backend.md` | Code Structure Standard |
| Correlation ID | `tech-stack-backend.md` | Observability Standard |
| Delegation map (agents) | `agent-orchestration.md` | Delegation map |
| Governance file editing | `governance-editing.md` | Protected fields |
| Document encoding / typography | `document-encoding.md` | Typography |
| File provenance register | `artifact-templates-onboard.md` | File Provenance Register |
| File scope (TODO) | `artifact-standards.md` | Master TODO |
| Flyway migrations | `tech-stack-backend.md` | Database Migration Standard |
| Frontend folder layout | `tech-stack-frontend.md` | Frontend Architecture Standard |
| Frontend API client (Axios) | `tech-stack-frontend.md` | API Client Standard |
| Frontend form validation | `tech-stack-frontend.md` | Form Validation Standard |
| Frontend architectural patterns | `tech-stack-frontend.md` | Architectural Patterns Standard |
| Frontend package manager (Bun) | `tech-stack-frontend.md` | Package Manager Standard |
| Frontend TypeScript strict config | `tech-stack-frontend.md` | TypeScript Configuration Standard |
| Approved FE tech stack versions | `tech-stack-frontend.md` | Enterprise Capability Baseline → Capability Matrix |
| Go backend stack | `tech-stack-backend.md` | Go Services |
| Health endpoint | `tech-stack-backend.md` | Observability Standard |
| Idempotency | `tech-stack-integration.md` | Idempotency Standards |
| ISO 8583 | `tech-stack-integration.md` | ISO 8583 Integration Principles |
| Java 21 / Spring Boot | `tech-stack-backend.md` | Java Standard / Framework Standard |
| Master TODO format | `artifact-standards.md` | Master TODO |
| No assumptions policy | `agent-governance.md` | No Assumptions Policy |
| OpenAPI / API docs | `tech-stack-backend.md` | API Documentation Standard |
| Open Questions table format | `artifact-standards.md` | General Rules |
| Orchestration state / resume | `agent-orchestration.md` | Resume protocol |
| Package structure (domain) | `standards-backend.md` | Package Structure |
| Standards map / precedence | `coding-standards.md` | Standards Map |
| Backend project structure | `tech-stack-backend.md` | Project Structure Standard |
| Microservice vs modular monolith | `tech-stack-backend.md` | Project Structure Standard |
| PostgreSQL | `tech-stack-backend.md` | Database Standard |
| Implementation plan template | `artifact-templates-decision.md` | Implementation Plan |
| Progress tracker template | `artifact-templates-decision.md` | Progress Tracker |
| Project profile | `artifact-templates-onboard.md` | Project Profile |
| QA report template | `artifact-templates-validate.md` | QA Report |
| RCA report template | `artifact-templates-build.md` | Root Cause Analysis Report |
| Release notes template | `artifact-templates-document.md` | Release Notes |
| Requirements baseline | `artifact-templates-onboard.md` | Requirements Baseline |
| Roadmap template | `artifact-templates-decision.md` | Roadmap |
| REST API standards | `tech-stack-integration.md` | API Standards |
| Secrets management | `tech-stack-security.md` | Secrets Management |
| `service_roots` (generators) | `artifact-templates-onboard.md` | Project Profile |
| Technical documentation template | `artifact-templates-document.md` | Technical Documentation |
| Tech debt register | `artifact-templates-onboard.md` | Tech Debt Register |
| Unit test report template | `artifact-templates-build.md` | Unit Test Report |
| Single ownership | `agent-governance.md` | Core Principles |
| Traceability (REQ/ARCH/ADR/TODO) | `agent-governance.md` | Traceability Policy |
| UTF-8 / mojibake prevention | `document-encoding.md` | File Encoding |
| Unit test coverage (~80%) | `standards-backend.md` | Unit Testing Standards |
| WCAG accessibility | `tech-stack-frontend.md` | Accessibility Standard |

---

## Related documents

| Document | Purpose |
|----------|---------|
| `.claude/docs/workflow.md` | Human-facing SDLC command reference |
| `the original .claude/CHANGELOG.md (Cursor-era history; not ported to Claude Code)` | Version registry and change history |
| `.claude/docs/sdlc-pipeline-visual.md` | Pipeline presentation diagrams |
| `.claude/agents/*.md` | Per-agent contracts and checklists |
