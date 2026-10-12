
# Backend Coding Standards

> Loading: on demand only. Not imported by `CLAUDE.md`. Read this file explicitly when an agent's or command's *Mandatory References* section names it (Claude Code has no automatic glob-based rule injection, unlike Cursor's `alwaysApply: false` + `globs`). Scope in the original Cursor rule: `**/*.{go,java}`. Ported from Cursor's `.cursor/rules/standards-backend.mdc`.

Version: 1.0

Last Updated: 2026-06-24

Status: Active

---

# Purpose

This document defines backend code quality expectations, naming conventions, design practices, testing requirements, and maintainability standards for Go and Java services.

This document governs:

* developer_backend
* architect_backend
* code_reviewer
* debugger
* unit_test_writer

(when scope is backend — `**/*.{go,java}` or backend TODO file scope)

All backend implementation work must comply with this standard unless explicitly overridden by an approved ADR.

Universal quality rules (code review, refactoring, traceability, debugging) remain in `coding-standards.md`.

Full section index: `.claude/docs/rules-index.md` -> `standards-backend.md`.

---

# Precedence

When rules conflict, higher-priority sources win:

```text
agent-governance.md → coding-standards.md → standards-backend.md → tech-stack-backend.md
```

`coding-standards.md` owns universal review, refactoring, and traceability rules. This document owns backend-specific code quality. `tech-stack-backend.md` owns approved technologies and tool-specific implementation patterns.

---

# Pointers

Tool-specific rules defer to stack documents:

| Topic | Quality rules (this file) | Technology / tools |
|-------|---------------------------|--------------------|
| Logging levels and prohibited content | Logging Standards | `tech-stack-backend.md` -> Logging Standard (SLF4J, Log4j2, MDC, structured logging) |
| Performance optimization evidence | Performance Standards | `tech-stack-backend.md` -> Performance Standard |
| Unit test coverage target | Unit Testing Standards | `tech-stack-backend.md` -> Testing Standard (frameworks, commands) |
| Package / module layout | Package Structure | `tech-stack-backend.md` -> Project Structure Standard |
| Security controls | Security Standards | `tech-stack-security.md` |
| API contracts and error shapes | API Standards | `tech-stack-integration.md` |

---

# Core Principles

Backend code must be:

* Correct
* Readable
* Maintainable
* Testable
* Secure
* Observable
* Consistent

Code is written for humans first and computers second.

---

# General Rules

## Readability First

Code should be easy to understand without excessive explanation.

Prefer:

* Clear names
* Small functions
* Explicit logic

Avoid:

* Clever code
* Hidden behavior
* Unnecessary abstractions

---

## Consistency

Follow established project conventions.

Within the same project:

* Naming conventions must be consistent
* Error handling must be consistent
* Logging must be consistent
* Testing style must be consistent

---

## Simplicity

The simplest implementation that satisfies requirements should be preferred.

Avoid:

* Premature optimization
* Over-engineering
* Unnecessary design patterns

---

# Naming Standards

## Classes and Types

Use descriptive nouns.

Examples:

```text
CustomerService
PaymentProcessor
IsoMessageParser
TransactionRepository
```

Avoid:

```text
Helper
Manager
Util
ProcessorImpl2
```

unless clearly justified.

---

## Methods and Functions

Use descriptive verbs.

Examples:

```text
createCustomer()
calculateFee()
validateRequest()
ProcessPayment()
```

Avoid:

```text
doStuff()
process()
execute()
```

without meaningful context.

---

## Variables

Names must reveal intent.

Prefer:

```text
customerId
transactionAmount
responseCode
```

Avoid:

```text
x
tmp
data
obj
```

except for very limited scopes.

---

## Constants

Use uppercase snake case.

Examples:

```text
MAX_RETRY_COUNT
DEFAULT_TIMEOUT_SECONDS
```

---

# Function Design

## Single Responsibility

A function should have one reason to change.

---

## Function Size

Prefer small functions.

Large functions should be decomposed into meaningful units.

---

## Parameters

Minimize parameter count.

When parameter lists become large:

Consider:

* Request objects
* Domain objects
* Parameter structs (Go)

---

## Side Effects

Functions should minimize hidden side effects.

Side effects must be explicit.

---

# Class Design

## Single Responsibility

Each class or struct should have one primary responsibility.

---

## High Cohesion

Related behavior should remain together.

---

## Low Coupling

Dependencies should be minimized.

---

# Package Structure

Packages and modules should reflect business capabilities.

Preferred:

```text
customer/
payment/
authentication/
```

Avoid:

```text
utils/
misc/
common2/
```

for domain logic.

For project layout conventions (Maven modules, Go module paths), see `tech-stack-backend.md` -> Project Structure Standard.

---

# SOLID Principles

Developers should follow:

* Single Responsibility Principle
* Open/Closed Principle
* Liskov Substitution Principle
* Interface Segregation Principle
* Dependency Inversion Principle

---

## Rule

SOLID principles are guidance.

Do not introduce unnecessary complexity solely to satisfy them.

---

# Dependency Management

## Allowed Dependencies

Dependencies must have:

* Clear purpose
* Active maintenance
* Security review

---

## Avoid

Adding dependencies for trivial functionality.

---

# Error Handling Standards

## Explicit Handling

Errors must be handled intentionally.

---

## Requirements

Errors should:

* Provide meaningful context
* Be actionable
* Support troubleshooting

---

## Avoid

Silent failures.

Examples:

```java
catch (Exception e) {
}
```

```go
if err != nil {
    return nil
}
```

---

## Prohibited

Suppressing exceptions or errors without justification.

---

# Logging Standards

## Purpose

Logs must support:

* Monitoring
* Troubleshooting
* Auditing

For framework choice, MDC/correlation IDs, and structured logging format, see `tech-stack-backend.md` -> Logging Standard.

---

## Log Levels

### ERROR

Unexpected failures.

### WARN

Recoverable issues.

### INFO

Business-relevant events.

### DEBUG

Diagnostic information.

---

## Prohibited

Logging:

* Passwords
* Secrets
* Tokens
* Sensitive personal data

---

# Configuration Standards

## Rule

Configuration must be externalized.

Examples:

* URLs
* Credentials
* Timeouts
* Retry values

---

## Prohibited

Hardcoded environment-specific values.

---

# Security Standards

Developers must comply with:

* `tech-stack-security.md`

---

## Requirements

Validate:

* Inputs
* Authorization
* Authentication
* Sensitive data handling

For security architecture, encryption, and audit requirements, see `tech-stack-security.md`.

---

# Database Standards

## Query Design

Queries should be:

* Readable
* Maintainable
* Efficient

---

## Avoid

Unnecessary database calls.

---

## Transactions

Transaction boundaries must be explicit.

---

## Data Integrity

Must be protected through:

* Validation
* Constraints
* Transaction management

---

# API Standards

Must comply with:

* `tech-stack-integration.md`

---

## Requirements

APIs should provide:

* Consistent responses
* Consistent errors
* Proper status codes

For versioning, contract documentation, and error response structure, see `tech-stack-integration.md`.

---

# Testability Standards

Code should be designed for testing.

---

## Requirements

Business logic should be testable in isolation.

---

## Avoid

Tightly coupling business logic to frameworks.

---

# Unit Testing Standards

## Purpose

Unit tests verify behavior.

For test frameworks, commands, and CI integration, see `tech-stack-backend.md` -> Testing Standard.

---

## Requirements

Tests should be:

* Independent
* Repeatable
* Deterministic

---

## Naming

Preferred:

```text
shouldCreateCustomerWhenRequestIsValid
shouldRejectDuplicateCustomer
TestProcessPayment_ValidRequest_ReturnsSuccess
```

---

## Coverage

Coverage target:

80% or higher

Coverage is a guideline, not a quality guarantee.

---

## Edge Cases

Tests should evaluate:

* Null inputs
* Empty inputs
* Boundary values
* Invalid values
* Failure scenarios

---

# Performance Standards

Optimization requires evidence.

Required:

* Profiling
* Measurement
* Benchmarking

Avoid:

* Premature optimization

For backend-specific performance tooling and targets, see `tech-stack-backend.md` -> Performance Standard.

---

# Documentation Standards

Complex logic should be documented.

---

## Comments

Comments should explain:

Why

not

What

---

Prefer:

```java
// Required by network specification to preserve field order
```

```go
// ISO 8583 field order is network-mandated; do not reorder.
```

Avoid:

```java
// Increment i
i++;
```

---

# Escalation Triggers

Escalate when:

* Backend quality requirements conflict with stack standards
* Security requirements conflict with implementation approach
* Test coverage or testability requirements cannot be met within TODO scope
* Multiple valid interpretations of naming or package structure exist

Status:

Pending Clarification

must be assigned.

---

# Final Rule

Backend code must be:

* Correct
* Readable
* Testable
* Maintainable
* Secure
* Traceable

Backend code must never rely on:

* Assumptions
* Hidden behavior
* Undocumented decisions

When in doubt:

Stop.

Request clarification.

Status:

Pending Clarification
