---
version: 2.4
last_updated: 2026-07-02
---

# Rules Index

Master table of contents for all governance rules in `.cursor/rules/`. When adding, renaming, or removing a section in any rule file, update this index and the file's version in the same change (see `.cursor/CHANGELOG.md`).

---

## Quick reference

| File | Ver | Always on | Scope / globs | Primary audience |
|------|-----|-----------|-----------------|------------------|
| [`agent-governance.mdc`](rules/agent-governance.mdc) | 1.3 | Yes | All agents | Every agent, every stage |
| [`agent-orchestration.mdc`](rules/agent-orchestration.mdc) | 4.1 | Yes | Orchestrator | Pipeline sequencing, gates, resume |
| [`architecture-principles.mdc`](rules/architecture-principles.mdc) | 1.0 | Yes | All architects | `/design`, ADRs |
| [`artifact-standards.mdc`](rules/artifact-standards.mdc) | 3.0 | Yes | All agents | Core index, general rules, Master TODO, validation |
| [`artifact-templates/artifact-templates-onboard.mdc`](rules/artifact-templates/artifact-templates-onboard.mdc) | 1.0 | No | Checkpoint O, greenfield `/design` bootstrap | Project profile, registers, requirements baseline |
| [`artifact-templates/artifact-templates-design.mdc`](rules/artifact-templates/artifact-templates-design.mdc) | 1.1 | No | Checkpoint A | Architecture documents; ARCH-SOLUTION binding sections |
| [`artifact-templates/artifact-templates-decision.mdc`](rules/artifact-templates/artifact-templates-decision.mdc) | 1.0 | No | Checkpoint B | ADRs, plans, progress, clarifications |
| [`artifact-templates/artifact-templates-build.mdc`](rules/artifact-templates/artifact-templates-build.mdc) | 1.0 | No | Checkpoint C | Unit test report, RCA report |
| [`artifact-templates/artifact-templates-validate.mdc`](rules/artifact-templates/artifact-templates-validate.mdc) | 1.0 | No | Checkpoint D | Code review, QA reports |
| [`artifact-templates/artifact-templates-document.mdc`](rules/artifact-templates/artifact-templates-document.mdc) | 1.0 | No | Checkpoint E | Technical documentation, release notes |
| [`coding-standards.mdc`](rules/coding-standards.mdc) | 2.0 | Yes | All implementation + assessor roles | Universal quality · review · traceability |
| [`standards-backend.mdc`](rules/standards-backend.mdc) | 1.0 | No | `**/*.{go,java}` | Backend code quality |
| [`standards-frontend.mdc`](rules/standards-frontend.mdc) | 1.0 Active | No | `**/*.{ts,tsx,js,jsx,vue}` | Frontend code quality |
| [`document-encoding.mdc`](rules/document-encoding.mdc) | 1.1 | No | `**/*.{md,mdc,txt}` | All agents writing text |
| [`governance-editing.mdc`](rules/governance-editing.mdc) | 1.1 | No | `**/.cursor/**/*.{md,mdc,txt}` | Anyone tuning `.cursor/` |
| [`tech-stack-backend.mdc`](rules/tech-stack-backend.mdc) | 1.5 | No | `**/*.{go,java}` | Backend technology and patterns |
| [`tech-stack-frontend.mdc`](rules/tech-stack-frontend.mdc) | 1.4 | No | `**/*.{ts,tsx,js,jsx,vue}` | Frontend design and code |
| [`tech-stack-integration.mdc`](rules/tech-stack-integration.mdc) | 1.1 | Yes | Integration points | APIs, events, messaging |
| [`tech-stack-security.mdc`](rules/tech-stack-security.mdc) | 1.0 | Yes | Security-related work | Auth, encryption, compliance |

---

## Contents by file

### `agent-governance.mdc` — Agent Governance Standard

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

### `document-encoding.mdc` — Document Encoding Standard

| Section | Topic |
|---------|--------|
| Scope | Self-exemption when editing this file |
| File Encoding | UTF-8; no legacy encodings |
| Typography | Em dash, en dash, ASCII `->`, straight quotes |
| Forbidden in committed text | `�`, mojibake, C1 control chars |
| Pre-save checklist | Scan before finishing markdown edits |
| Examples | Bad vs good punctuation |

---

### `governance-editing.mdc` — Governance Editing Standard

| Section | Topic |
|---------|--------|
| Protected fields | Agent, rule, and command frontmatter; orchestration slugs |
| Protected sections | Mandatory References, Inputs, Non-Responsibilities, etc. |
| Safe edit rules | Minimize scope, replace don't hollow, rename in lockstep |
| Pre-complete checklist | Grep slugs, update registry and index |

---

### `agent-orchestration.mdc` — Agent Orchestration

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

### `architecture-principles.mdc` — Architecture Principles

| Section | Topic |
|---------|--------|
| Architecture Goals | Simplicity, scalability, security, observability, testability, … |
| Principles 1–20 | Requirements first through clarification over guessing |
| Architecture Review Checklist | Pre-approval architecture checklist |
| Escalation Triggers | When to use `Pending Clarification` |
| Final Rule | Requirement-driven, traceable, documented decisions |

---

### `artifact-standards.mdc` — Artifact Standards (core)

| Section | Topic |
|---------|--------|
| Agent Artifact Index | Who produces what; template bundle links |
| General Rules | Metadata, YAML front-matter, status values, Open Questions table |
| Master TODO | TODO template; **File scope** field |
| Traceability Requirements | Cross-artifact links |
| Artifact Validation Checklist | Pre-approval checks; provenance and gate checks |

---

### `artifact-templates-onboard.mdc` — Onboard templates (Checkpoint O)

| Section | Topic |
|---------|--------|
| Project Profile | `output/project-profile.md` template; `service_roots` (`path`, `stack`, `readme`) |
| File Provenance Register | Path-level enforcement scope |
| Tech Debt Register | Brownfield pre-existing gaps |
| Requirements Baseline | Brownfield as-built requirements |

---

### `artifact-templates-design.mdc` — Design templates (Checkpoint A)

| Section | Topic |
|---------|--------|
| Architecture Documents | `ARCH-*` templates; section applicability by doc type |
| Template — ARCH-SOLUTION | Binding Decisions, Delegated Decisions, Domain Scope (required at `/design`) |
| Template — Domain | ARCH-BE / ARCH-FE / ARCH-SEC; conformance to bindings and ARCH-SEC |
| Architecture Identifier Format | `ARCH-SOLUTION-*`, `ARCH-BE-*`, `ARCH-FE-*`, `ARCH-SEC-*` |

---

### `artifact-templates-decision.mdc` — Decision templates (Checkpoint B)

| Section | Topic |
|---------|--------|
| Architecture Decision Records (ADR) | `ADR-*` template |
| Implementation Plan | Phases, objectives, deliverables |
| Roadmap | Milestones |
| Progress Tracker | Overall progress |
| Clarifications Register | Roll-up of all open questions |

---

### `artifact-templates-build.mdc` — Build templates (Checkpoint C)

| Section | Topic |
|---------|--------|
| Root Cause Analysis Report | Debugger output |
| Unit Test Report | Test scope, execution summary, handoff |

---

### `artifact-templates-validate.mdc` — Validate templates (Checkpoint D)

| Section | Topic |
|---------|--------|
| Code Review Report | Findings by severity |
| QA Report | Go / No-Go recommendation |

---

### `artifact-templates-document.mdc` — Document templates (Checkpoint E)

| Section | Topic |
|---------|--------|
| Technical Documentation | User and developer docs |
| Release Notes | Deployment and rollback notes |

---

### `coding-standards.mdc` — Coding Standards (universal core)

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

### `standards-backend.mdc` — Backend Coding Standards

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
| Security Standards | Implementation checklist; pointer to `tech-stack-security.mdc` |
| Database Standards | Queries, transactions, integrity |
| API Standards | Quality rules; pointer to `tech-stack-integration.mdc` |
| Testability Standards | Isolated, deterministic business logic |
| Unit Testing Standards | Naming, ~80% coverage, edge cases |
| Performance Standards | Evidence before optimization |
| Documentation Standards | Comments explain why, not what |
| Escalation Triggers | When to stop and clarify |
| Final Rule | Correct, readable, maintainable backend code |

---

### `standards-frontend.mdc` — Frontend Coding Standards

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

### `tech-stack-backend.mdc` — Backend Technology Standards

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

### `tech-stack-frontend.mdc` — Frontend Technology Standards

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

### `tech-stack-integration.mdc` — Integration Technology Standards

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

### `tech-stack-security.mdc` — Security Technology Standards

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
| Approval gates | `agent-orchestration.mdc` | Approval gates |
| Approval policy (draft ≠ approved) | `agent-governance.mdc` | Approval Policy |
| Architect tiers (`/design` sequencing) | `agent-orchestration.mdc` | Default execution order |
| Binding Decisions (ARCH-SOLUTION) | `artifact-templates-design.mdc` | Template — ARCH-SOLUTION |
| Delegated Decisions (ARCH-SOLUTION) | `artifact-templates-design.mdc` | Template — ARCH-SOLUTION |
| Domain Scope (`/design`) | `artifact-templates-design.mdc` | Template — ARCH-SOLUTION |
| Draft-complete gates (intra-checkpoint) | `agent-orchestration.mdc` | Approval gates |
| Architecture principles (1–20) | `architecture-principles.mdc` | Principles 1–20 |
| Architecture review checklist | `architecture-principles.mdc` | Architecture Review Checklist |
| ADR template | `artifact-templates-decision.mdc` | Architecture Decision Records (ADR) |
| Architecture documents template | `artifact-templates-design.mdc` | Architecture Documents |
| Artifact formats and templates | `artifact-standards.mdc` | Agent Artifact Index (+ bundles per Template column) |
| Artifact validation | `artifact-standards.mdc` | Artifact Validation Checklist |
| Blocking open questions | `agent-governance.mdc` | Open Questions Policy |
| Brownfield enforcement | `agent-orchestration.mdc` | Brownfield enforcement |
| Checkpoints and commands | `agent-orchestration.mdc` | Checkpoints and commands |
| Clarifications register | `artifact-templates-decision.mdc` | Clarifications Register |
| Code review report template | `artifact-templates-validate.mdc` | Code Review Report |
| Backend code quality (naming, tests, packages) | `standards-backend.mdc` | General Rules through Documentation Standards |
| Code review findings | `coding-standards.mdc` | Code Review Standards |
| FE component naming | `standards-frontend.mdc` | Naming Conventions |
| FE component structure | `standards-frontend.mdc` | Component Structure |
| FE custom hooks | `standards-frontend.mdc` | Custom Hooks Standards |
| FE code review checklist | `standards-frontend.mdc` | Code Review Checklist |
| Frontend code quality | `standards-frontend.mdc` | All sections |
| Frontend unit test style | `standards-frontend.mdc` | Testing Standards |
| Code structure (layers) | `tech-stack-backend.mdc` | Code Structure Standard |
| Controller -> Service -> Repository | `tech-stack-backend.mdc` | Code Structure Standard |
| Correlation ID | `tech-stack-backend.mdc` | Observability Standard |
| Delegation map (agents) | `agent-orchestration.mdc` | Delegation map |
| Governance file editing | `governance-editing.mdc` | Protected fields |
| Document encoding / typography | `document-encoding.mdc` | Typography |
| File provenance register | `artifact-templates-onboard.mdc` | File Provenance Register |
| File scope (TODO) | `artifact-standards.mdc` | Master TODO |
| Flyway migrations | `tech-stack-backend.mdc` | Database Migration Standard |
| Frontend folder layout | `tech-stack-frontend.mdc` | Frontend Architecture Standard |
| Frontend API client (Axios) | `tech-stack-frontend.mdc` | API Client Standard |
| Frontend form validation | `tech-stack-frontend.mdc` | Form Validation Standard |
| Frontend architectural patterns | `tech-stack-frontend.mdc` | Architectural Patterns Standard |
| Frontend package manager (Bun) | `tech-stack-frontend.mdc` | Package Manager Standard |
| Frontend TypeScript strict config | `tech-stack-frontend.mdc` | TypeScript Configuration Standard |
| Approved FE tech stack versions | `tech-stack-frontend.mdc` | Enterprise Capability Baseline → Capability Matrix |
| Go backend stack | `tech-stack-backend.mdc` | Go Services |
| Health endpoint | `tech-stack-backend.mdc` | Observability Standard |
| Idempotency | `tech-stack-integration.mdc` | Idempotency Standards |
| ISO 8583 | `tech-stack-integration.mdc` | ISO 8583 Integration Principles |
| Java 21 / Spring Boot | `tech-stack-backend.mdc` | Java Standard / Framework Standard |
| Master TODO format | `artifact-standards.mdc` | Master TODO |
| No assumptions policy | `agent-governance.mdc` | No Assumptions Policy |
| OpenAPI / API docs | `tech-stack-backend.mdc` | API Documentation Standard |
| Open Questions table format | `artifact-standards.mdc` | General Rules |
| Orchestration state / resume | `agent-orchestration.mdc` | Resume protocol |
| Package structure (domain) | `standards-backend.mdc` | Package Structure |
| Standards map / precedence | `coding-standards.mdc` | Standards Map |
| Backend project structure | `tech-stack-backend.mdc` | Project Structure Standard |
| Microservice vs modular monolith | `tech-stack-backend.mdc` | Project Structure Standard |
| PostgreSQL | `tech-stack-backend.mdc` | Database Standard |
| Implementation plan template | `artifact-templates-decision.mdc` | Implementation Plan |
| Progress tracker template | `artifact-templates-decision.mdc` | Progress Tracker |
| Project profile | `artifact-templates-onboard.mdc` | Project Profile |
| QA report template | `artifact-templates-validate.mdc` | QA Report |
| RCA report template | `artifact-templates-build.mdc` | Root Cause Analysis Report |
| Release notes template | `artifact-templates-document.mdc` | Release Notes |
| Requirements baseline | `artifact-templates-onboard.mdc` | Requirements Baseline |
| Roadmap template | `artifact-templates-decision.mdc` | Roadmap |
| REST API standards | `tech-stack-integration.mdc` | API Standards |
| Secrets management | `tech-stack-security.mdc` | Secrets Management |
| `service_roots` (generators) | `artifact-templates-onboard.mdc` | Project Profile |
| Technical documentation template | `artifact-templates-document.mdc` | Technical Documentation |
| Tech debt register | `artifact-templates-onboard.mdc` | Tech Debt Register |
| Unit test report template | `artifact-templates-build.mdc` | Unit Test Report |
| Single ownership | `agent-governance.mdc` | Core Principles |
| Traceability (REQ/ARCH/ADR/TODO) | `agent-governance.mdc` | Traceability Policy |
| UTF-8 / mojibake prevention | `document-encoding.mdc` | File Encoding |
| Unit test coverage (~80%) | `standards-backend.mdc` | Unit Testing Standards |
| WCAG accessibility | `tech-stack-frontend.mdc` | Accessibility Standard |

---

## Related documents

| Document | Purpose |
|----------|---------|
| `.cursor/workflow.md` | Human-facing SDLC command reference |
| `.cursor/CHANGELOG.md` | Version registry and change history |
| `.cursor/sdlc-pipeline-visual.md` | Pipeline presentation diagrams |
| `.cursor/agents/*.md` | Per-agent contracts and checklists |
