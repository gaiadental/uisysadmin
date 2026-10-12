
# Architecture Principles

> Loading: always active. Imported into every session via the root `CLAUDE.md` (`@.claude/rules/architecture-principles.md`). Ported from Cursor's `.cursor/rules/architecture-principles.mdc` (`alwaysApply: true`) — content is unchanged except path references.

Version: 1.0

Status: Active

---

# Purpose

This document defines mandatory architectural principles that govern all architecture decisions.

All architect agents must comply with these principles.

These principles are technology-independent and apply to all projects unless explicitly overridden by approved requirements.

When conflicts exist between a proposed solution and these principles, the conflict must be documented and escalated for review.

Full section index: `.claude/docs/rules-index.md` -> `architecture-principles.md`.

---

# Architecture Goals

Every architecture must strive to achieve:

* Simplicity
* Maintainability
* Scalability
* Reliability
* Security
* Observability
* Testability
* Extensibility

Architects must balance these goals based on project requirements.

No goal should be optimized without justification.

---

# Principle 1: Requirements First

Architecture must be driven by requirements.

Architecture must not be driven by:

* Personal preferences
* Technology trends
* Familiarity with tools
* Assumptions

Every architectural decision must trace back to at least one requirement.

If no requirement justifies a decision, the decision must not be made.

---

# Principle 2: Simplicity First

The simplest solution that satisfies requirements should be preferred.

Architects must avoid:

* Premature optimization
* Unnecessary abstractions
* Unnecessary services
* Unnecessary frameworks

Complexity must be justified.

---

## Preferred Order

1. Simple
2. Understandable
3. Maintainable
4. Flexible
5. Complex

Never reverse this order without justification.

---

# Principle 3: Explicit Boundaries

All system boundaries must be explicitly defined.

Examples:

* Service boundaries
* Domain boundaries
* Team ownership boundaries
* Integration boundaries

No component may have ambiguous ownership.

Every responsibility must belong to exactly one owner.

---

# Principle 4: Separation of Concerns

Each component should have one primary responsibility.

Architectures must avoid:

* Shared responsibilities
* Circular dependencies
* Multi-purpose services

Responsibilities must be clearly separated.

---

# Principle 5: Loose Coupling

Components should minimize dependencies on one another.

Architectures should favor:

* Stable interfaces
* Contract-based communication
* Clear ownership

Architectures should avoid:

* Tight runtime dependencies
* Hidden dependencies
* Shared databases without justification

---

# Principle 6: High Cohesion

Responsibilities that belong together should remain together.

Architectures should avoid:

* Artificial service separation
* Excessive fragmentation
* Splitting domains without business justification

Service boundaries should follow business boundaries whenever possible.

---

# Principle 7: Evolutionary Architecture

Architecture should support future change.

Architects must consider:

* Extensibility
* Upgradeability
* Maintainability

However:

Future possibilities must not justify unnecessary complexity today.

---

# Principle 8: Scalability by Requirement

Scalability solutions must be requirement-driven.

Architects must not introduce:

* Distributed systems
* Event-driven architectures
* Microservices

without clear justification.

Scalability requirements must be explicit.

If scalability requirements are unknown:

Status: Pending Clarification

---

# Principle 9: Reliability by Design

Failure must be considered during design.

Architectures must identify:

* Failure points
* Recovery strategies
* Operational risks

Architectures should avoid:

* Single points of failure

unless explicitly accepted.

---

# Principle 10: Security by Design

Security must be considered during architecture design.

Security must not be added later.

Architects must identify:

* Authentication requirements
* Authorization requirements
* Data protection requirements
* Compliance requirements

If security requirements are unclear:

Escalate for clarification.

---

# Principle 11: Observability by Design

Systems must be observable.

Architectures should consider:

* Logging
* Monitoring
* Tracing
* Alerting

Operational visibility must be planned before implementation.

---

# Principle 12: Testability

Architecture should support testing.

Architectures should promote:

* Isolated components
* Deterministic behavior
* Clear interfaces

Architectures should avoid designs that are difficult to validate.

---

# Principle 13: Traceability

Every architecture decision must be traceable.

Architecture documents must reference:

* Requirements
* ADRs
* Related architecture documents

No architecture decision should exist without traceability.

---

# Principle 14: Technology Neutrality

Architecture decisions should not depend on a specific technology unless required.

Architects should first define:

* Problem
* Constraints
* Requirements

Technology selection comes later.

---

# Principle 15: Explicit Trade-Offs

Every significant architecture decision must document trade-offs.

Architects must identify:

* Benefits
* Risks
* Costs
* Limitations

Trade-offs must be visible.

Hidden trade-offs are not allowed.

---

# Principle 16: No Assumptions

Architects must never make assumptions.

Unknown information remains unknown.

When information is missing:

* Stop analysis
* Document the gap
* Request clarification

Architecture must not proceed based on assumptions.

---

# Principle 17: Business Alignment

Business requirements take precedence over technical preferences.

A technically superior solution is not automatically the correct solution.

Architects must optimize for business outcomes.

---

# Principle 18: Operational Ownership

Every system component must have an identified owner.

Ownership must be clear for:

* Services
* APIs
* Databases
* Infrastructure
* Security controls

Unowned components are not allowed.

---

# Principle 19: Documentation as Deliverable

Architecture is not complete until documented.

Required outputs include:

* Architecture documents
* Decision records
* Dependency documentation
* Open questions

Verbal architecture is not architecture.

Artifacts are the source of truth.

---

# Principle 20: Clarification Over Guessing

When uncertainty exists:

Ask.

Do not guess.

A delayed decision is preferable to an incorrect decision.

If multiple valid interpretations exist:

Status: Pending Clarification

must be used.

---

# Architecture Review Checklist

Before approving any architecture:

* Requirements are understood
* No assumptions were made
* Boundaries are defined
* Ownership is defined
* Risks are documented
* Trade-offs are documented
* Security considered
* Scalability considered
* Reliability considered
* Observability considered
* Testability considered
* Traceability exists
* Open questions resolved

If any item fails:

Architecture cannot be approved.

---

# Escalation Triggers

Architects must escalate when:

* Requirements are incomplete
* Requirements conflict
* Business goals conflict
* Constraints are unclear
* Ownership is unclear
* Security requirements are unknown
* Scalability requirements are unknown
* Compliance requirements are unknown

Status:

Pending Clarification

must be assigned until resolution.

---

# Final Rule

Architectural decisions must be:

* Requirement-driven
* Traceable
* Justified
* Reviewable
* Documented

Architectural decisions must never be:

* Assumed
* Implicit
* Personal preference driven
* Trend driven
* Undocumented
