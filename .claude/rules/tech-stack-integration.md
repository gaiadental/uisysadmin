
# Integration Technology Standards

> Loading: always active. Imported into every session via the root `CLAUDE.md` (`@.claude/rules/tech-stack-integration.md`). Ported from Cursor's `.cursor/rules/tech-stack-integration.mdc` (`alwaysApply: true`) — content is unchanged except path references.

Version: 1.1

Status: Active

---

# Purpose

This document defines standards governing communication and integration between systems.

This document applies to:

* solution_architect
* architect_backend
* architect_frontend
* security_architect
* developer_backend
* developer_frontend
* code_reviewer
* qa

This standard governs:

* Frontend ↔ Backend integration
* Backend ↔ Backend integration
* Backend ↔ External System integration
* Event-driven integration
* Message-based integration
* File-based integration

This document does not replace:

* tech-stack-backend.md
* tech-stack-frontend.md
* tech-stack-security.md

Full section index: `.claude/docs/rules-index.md` -> `tech-stack-integration.md`.

---

# Integration Principles

## Contract First

Integrations must be defined through contracts.

Contracts must be agreed upon before implementation begins.

Examples:

* API Contracts
* Event Contracts
* Message Contracts
* File Specifications

---

## Explicit Interfaces

All integration points must be documented.

Undocumented integration points are prohibited.

---

## Loose Coupling

Integrations should minimize dependencies between systems.

Avoid:

* Shared databases
* Shared internal implementation details
* Direct access to internal components

Prefer:

* APIs
* Events
* Message Contracts

---

## Backward Compatibility

Changes should preserve compatibility whenever possible.

Breaking changes require:

* Versioning strategy
* Migration strategy
* Impact assessment

---

# Integration Ownership

Every integration must identify:

* Provider
* Consumer
* Owner

---

## Required Ownership

Example:

Provider:
Customer Service

Consumer:
Frontend Portal

Owner:
Customer Team

Unowned integrations are not allowed.

---

# Integration Classification

All integrations must be classified.

---

## Synchronous

Examples:

* REST
* GraphQL
* gRPC

Characteristics:

* Immediate response required
* Request/Response pattern

---

## Asynchronous

Examples:

* Kafka
* RabbitMQ

Characteristics:

* Decoupled communication
* Event-driven architecture

---

## Batch

Examples:

* Scheduled Jobs
* File Exchange

Characteristics:

* Periodic execution
* Non-real-time processing

---

# Frontend to Backend Integration

## Preferred

REST APIs

---

## Allowed Alternatives

Requires ADR:

* GraphQL
* gRPC Gateway

---

## Requirements

Must define:

* API Contract
* Error Contract
* Authentication Method
* Authorization Rules

---

## Prohibited

Direct database access.

Frontend systems must never connect directly to databases.

---

# Backend to Backend Integration

## Preferred Order

### Internal Request/Response

REST

---

### Internal Event Communication

Kafka

---

### High-Performance Service Communication

gRPC

Requires justification.

---

# API Standards

## Versioning

Every public API must define versioning strategy.

Preferred:

```text
/api/v1/customers
```

---

## Contract Documentation

Must define:

* Endpoint
* Request
* Response
* Errors
* Authentication

---

## Required Response Structure

Success:

```json
{
  "data": {}
}
```

Error:

```json
{
  "code": "ERROR_CODE",
  "message": "Description"
}
```

---

# Error Handling Standards

Integrations must return:

* Consistent error structures
* Meaningful error codes

---

## Prohibited

Returning:

* Stack traces
* Internal implementation details
* Sensitive information

---

# Event-Driven Standards

## Event Contract

Every event must define:

* Event Name
* Event Version
* Event Schema
* Producer
* Consumer

---

## Event Naming

Preferred:

```text
CustomerCreated
CustomerUpdated
CustomerDeleted
```

---

## Required Metadata

Events should contain:

```text
eventId
eventTimestamp
eventVersion
```

---

# Messaging Standards

## Preferred

Kafka

---

## Allowed Alternatives

Requires ADR:

* RabbitMQ
* ActiveMQ

---

## Requirements

Must define:

* Retry Strategy
* Dead Letter Strategy
* Ordering Requirements

---

# Idempotency Standards

## Mandatory

Idempotency is mandatory for all state-changing operations that may be retried or redelivered.

Examples:

* Synchronous non-idempotent writes (e.g. POST)
* Asynchronous consumers under at-least-once delivery
* Financial transactions
* Payment processing
* Account creation

---

## Out of Scope

Idempotency is not required for:

* Read operations (e.g. GET)
* Operations that are idempotent by HTTP semantics (e.g. PUT, DELETE by stable resource ID)

---

## Requirements

Must define:

* A unique idempotency key per logical operation (e.g. `Idempotency-Key` header for REST)
* Duplicate key handling — return the original result without re-execution
* Deduplication storage and a defined retention window
* Consumer-side deduplication for message-based integrations before side effects

---

## Prohibited

* Relying on client behavior alone to prevent duplicates
* Idempotency keys without a defined retention or expiry strategy
* Re-executing side effects on duplicate delivery

---

# Timeout Standards

Every integration must define:

* Timeout
* Retry Policy

---

## Prohibited

Unlimited waiting periods.

---

# Circuit Breaker Considerations

Must be evaluated for:

* External Integrations
* High-Risk Dependencies

If requirements are unclear:

Status:
Pending Clarification

---

# File-Based Integration Standards

## Requirements

Must define:

* File Format
* Encoding
* Naming Convention
* Delivery Method
* Validation Rules

---

## Examples

Formats:

* CSV
* JSON
* XML

---

# Security Requirements

All integrations must comply with:

* tech-stack-security.md

---

## Requirements

Must define:

* Authentication
* Authorization
* Encryption
* Audit Requirements

---

# External System Integration Standards

## Requirements

Must document:

* Provider
* Consumer
* Protocol
* Contract
* Failure Handling

---

## Operational Requirements

Must define:

* Monitoring
* Alerting
* Support Ownership

---

# ISO 8583 Integration Principles

## Requirement

Projects using ISO 8583 must define:

* Message Specification
* Supported MTIs
* Supported Data Elements
* Validation Rules

---

## Rule

ISO 8583 specifications must be externally maintained and version-controlled.

---

## Prohibited

Hardcoded assumptions about:

* MTI formats
* Data Element lengths
* Network-specific fields

---

# HSM Integration Principles

## Requirement

Projects using HSMs must define:

* Supported Commands
* Key Management Requirements
* Error Handling Rules

---

## Security Rule

Cryptographic keys must never be exposed outside approved security boundaries.

---

# Monitoring Requirements

Every integration must define:

* Success Metrics
* Failure Metrics
* Alert Conditions

---

## Examples

* Response Time
* Error Rate
* Queue Depth
* Processing Latency

---

# Integration Documentation Requirements

Every integration must document:

* Purpose
* Provider
* Consumer
* Contract
* Authentication
* Failure Handling
* Monitoring

---

# Architecture Compliance Checklist

Before approval:

* Contract defined
* Ownership defined
* Versioning defined
* Authentication defined
* Error handling defined
* Retry strategy defined
* Idempotency defined for retryable or redeliverable writes
* Monitoring defined
* Documentation completed

If any item fails:

Status:
Pending Approval

---

# Escalation Triggers

Escalate when:

* Integration ownership is unclear
* Contract is undefined
* External system requirements are unclear
* Retry requirements are unclear
* Idempotency requirements are unclear for retryable or redeliverable writes
* Versioning strategy is unclear
* Security requirements are unclear

---

# Final Rule

Integrations must be:

* Contract-driven
* Versioned
* Documented
* Observable
* Secure
* Traceable

Integrations must never depend on:

* Shared assumptions
* Undocumented behavior
* Internal implementation details

When integration requirements are unclear:

Stop.

Request clarification.

Status:
Pending Clarification
