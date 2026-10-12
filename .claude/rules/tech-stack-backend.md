
# Backend Technology Standards

> Loading: on demand only. Not imported by `CLAUDE.md`. Read this file explicitly when an agent's or command's *Mandatory References* section names it (Claude Code has no automatic glob-based rule injection, unlike Cursor's `alwaysApply: false` + `globs`). Scope in the original Cursor rule: `**/*.{go,java}`. Ported from Cursor's `.cursor/rules/tech-stack-backend.mdc`.

Version: 1.5

Last Updated: 2026-06-24

Status: Active

---

# Purpose

This document defines approved backend technologies, architectural patterns, and implementation guidelines.

It covers **technology selection and implementation patterns**, not general code quality. For naming, testing practices, logging levels, performance discipline, and related quality rules, see `standards-backend.md`.

This document governs:

* architect_backend
* developer_backend
* code_reviewer
* debugger
* unit_test_writer

All backend recommendations must comply with this standard unless an approved ADR explicitly overrides it.

Full section index: `.claude/docs/rules-index.md` -> `tech-stack-backend.md`.

---

# Technology Selection Policy

## Preferred Technology Rule

Preferred technologies should be used whenever possible.

Alternative technologies may be proposed only when:

* Required by business requirements
* Required by client constraints
* Required by integration constraints
* Justified through ADR

---

## Escalation Rule

If a project requires technologies outside this standard:

Status:
Pending Approval

Approval required from:

* architect_backend
* solution_architect

---

# Enterprise Capability Baseline

Every enterprise backend service must satisfy capabilities by tier. **Preferred** implementations are the default; alternatives require ADR per Technology Selection Policy.

## Capability Matrix

| Capability | Tier | Preferred (Java) | When required |
|------------|------|------------------|---------------|
| Runtime | Mandatory | Java 21 (LTS) | All services |
| Framework | Mandatory | Spring Boot 3.4.x | All Java services |
| Build | Mandatory | Maven | All Java services |
| API style | Mandatory | REST | All synchronous APIs |
| Database | Mandatory | PostgreSQL | All persistent services |
| ORM / data access | Mandatory | Spring Data JPA | Default persistence |
| Schema migrations | Mandatory | Flyway | All services with a database |
| Input validation | Mandatory | Jakarta Bean Validation | All write endpoints |
| API contract docs | Mandatory | OpenAPI (springdoc-openapi) | All public APIs |
| Error handling | Mandatory | `@ControllerAdvice` | All services |
| Configuration | Mandatory | Externalized (env / config server) | All services |
| Authentication | Mandatory | OAuth2 / OIDC | All protected APIs |
| Authorization | Mandatory | RBAC | All protected APIs |
| Idempotency | Mandatory | Per `tech-stack-integration.md` | Retryable or redeliverable writes |
| Health endpoint | Mandatory | Spring Boot Actuator `/actuator/health` | All services |
| Metrics | Mandatory | Spring Boot Actuator + Micrometer | All services |
| Logging | Mandatory | SLF4J + Log4j2, structured | All services |
| Correlation ID | Mandatory | MDC / request tracing header | All services |
| Unit testing | Mandatory | JUnit 5 + Mockito | All business logic |
| Application monitoring | Mandatory | Actuator endpoints + platform integration | All production services |
| Caching | Conditional | Redis | Session, reference data, or high-frequency reads |
| Messaging | Conditional | Kafka | Async or event-driven integration |
| Resilience | Conditional | Resilience4j | External integrations, high-risk dependencies |
| Distributed tracing | Conditional | OpenTelemetry + Micrometer tracing | Multi-service or cross-boundary requests |
| Integration tests (DB) | Conditional | Testcontainers | When persistence behavior must be verified |
| Alternative runtime | Optional / ADR | Java 17, Go 1.26 + Fiber | Platform or team constraints |
| Alternative framework | Optional / ADR | Micronaut, Quarkus | Justified through ADR |
| Alternative database | Optional / ADR | Oracle, SQL Server, MySQL | Client or compliance constraints |
| Alternative build | Optional / ADR | Gradle | Justified through ADR |

## Go Services

Go backends (`**/*.go`) must provide equivalent capabilities using the organization Standard tech stack:

* Go 1.26, Fiber, Logrus
* `/health` via Go Actuator pattern
* PostgreSQL with versioned migrations (e.g. golang-migrate)
* Input validation on all write endpoints
* OpenAPI or equivalent contract documentation
* Idempotency per `tech-stack-integration.md`

Deviations require ADR.

---

# Java Standard

## Preferred

Java 21 (LTS)

Reason:

* Long-term support
* Virtual Threads
* Modern language features
* Strong ecosystem support

---

## Allowed Alternatives

Java 17 (LTS)

Only when:

* Existing platform constraints exist
* Migration risk exists

---

## Prohibited

* Java versions below 17
* Non-LTS versions

Unless explicitly approved.

---

# Framework Standard

## Preferred

Spring Boot 3.4.x

Reason:

* Organization standard
* Mature ecosystem
* Strong integration support

---

## Allowed Alternatives

Must be justified through ADR.

Examples:

* Micronaut
* Quarkus

---

# Build Standard

## Preferred

Maven

Reason:

* Organization standard
* Predictable dependency management

---

## Allowed Alternative

Gradle

Requires justification.

---

# API Standard

## Preferred Style

REST API

---

## API Requirements

Must define:

* Request model
* Response model
* Error model
* Versioning strategy

---

## Idempotency

Applies to state-changing operations that may be retried or redelivered. See `tech-stack-integration.md` — Idempotency Standards.

Must implement:

* `Idempotency-Key` header (or equivalent) on non-idempotent write endpoints
* Duplicate key returns the original result without re-execution
* Deduplication storage with a defined retention window

---

## Naming Standard

Examples:

```text
GET    /customers
GET    /customers/{id}
POST   /customers
PUT    /customers/{id}
DELETE /customers/{id}
```

---

## Response Standard

Success:

```json
{
  "data": {}
}
```

Error:

```json
{
  "code": "CUSTOMER_NOT_FOUND",
  "message": "Customer not found"
}
```

---

# Database Standard

## Preferred

PostgreSQL

Reason:

* Open source
* Mature ecosystem
* Strong reliability

---

## Allowed Alternatives

* Oracle
* SQL Server
* MySQL

Must be justified.

---

## Prohibited

Database selection based solely on personal preference.

---

# Database Migration Standard

## Mandatory

Flyway

---

## Requirements

Must define:

* Versioned migration scripts under source control
* Naming convention for migration files
* Rollback or forward-fix strategy for failed migrations
* Separate migration scope per service (no shared migration ownership across services)

---

## Prohibited

* Manual schema changes in production without a migration script
* Hibernate `ddl-auto` set to `create` or `create-drop` in production

---

# ORM Standard

## Preferred

Spring Data JPA

---

## Allowed Alternatives

* MyBatis
* jOOQ

Requires justification.

---

# Caching Standard

## Preferred

Redis

---

## Usage

Allowed for:

* Session caching
* Reference data caching
* High-frequency reads

---

## Prohibited

Caching without expiration strategy.

---

# Messaging Standard

## Preferred

Kafka

---

## Allowed Alternatives

* RabbitMQ
* ActiveMQ

Requires justification.

---

# Input Validation Standard

## Mandatory

Jakarta Bean Validation (`jakarta.validation`)

---

## Requirements

Must validate on the server for all write endpoints:

* Request body and path parameters
* Business rule constraints in the service layer where Bean Validation is insufficient
* Consistent validation error responses per API error model

---

## Prohibited

Relying on client-side validation alone.

---

# API Documentation Standard

## Mandatory

OpenAPI 3

---

## Preferred

springdoc-openapi

---

## Requirements

Must expose:

* Machine-readable OpenAPI spec (e.g. `/v3/api-docs`)
* Documented request, response, and error models
* Authentication requirements per endpoint

---

# Security Standard

## Authentication

Preferred:

OAuth2 / OIDC

---

## Authorization

Preferred:

Role-Based Access Control (RBAC)

---

## Secrets

Secrets must not be stored in source code.

---

## Password Storage

Must use:

* BCrypt
* Argon2

Never:

* Plain text
* MD5
* SHA1

---

# Logging Standard

## Framework

SLF4J

Preferred implementation:

Log4j2

---

## Structured Logging

Must include:

* Correlation ID (or trace ID) in MDC for request-scoped logs
* Consistent log format (JSON preferred in production)
* Log level appropriate to environment

---

## Requirements

Must log:

* Startup
* Shutdown
* Errors
* Security events
* Integration failures

---

## Log Levels and Prohibited Content

See `standards-backend.md` -> Logging Standards for log level definitions and prohibited content.

---

# Observability Standard

## Mandatory

Every service must support:

* Health checks — Spring Boot Actuator `/actuator/health` (or `/health` per Standard tech stack for Go)
* Metrics — Actuator + Micrometer (Prometheus-compatible export when deployed)
* Application monitoring — platform integration for uptime, error rate, and latency alerts

---

## Conditional

Distributed tracing (OpenTelemetry + Micrometer tracing) when:

* Requests cross service boundaries
* Async message flows require end-to-end traceability

---

## Prohibited

* Production services without a health endpoint
* Metrics or alerts absent for production deployments without documented acceptance

---

# Resilience Standard

## Conditional

Resilience4j (or equivalent) when the service has external integrations or high-risk dependencies.

Must define:

* Timeout per integration
* Retry policy (aligned with idempotency requirements)
* Circuit breaker thresholds where failure cascades are a risk

See `tech-stack-integration.md` for timeout, retry, and circuit breaker standards.

---

# Monitoring Standard

Must support:

* Health checks
* Metrics
* Application monitoring

Preferred:

Spring Boot Actuator

(See Observability Standard for full requirements.)

---

# Testing Standard

## Unit Testing

Preferred:

JUnit 5

---

## Mocking

Preferred:

Mockito

---

## Integration Testing

Conditional:

Testcontainers (PostgreSQL) when repository or migration behavior must be verified against a real database.

---

## Coverage Goal

See `standards-backend.md` -> Unit Testing Standards for coverage target, test naming conventions, and edge-case expectations.

---

# Code Structure Standard

## Layering

Preferred:

```text
Controller
Service
Repository
```

---

## Separation

Business logic must reside in:

Service Layer

Not:

* Controller
* Repository

---

# Project Structure Standard

Preferred layout for Java / Spring Boot 3.4 + Maven services. Domain-first packages with layers inside each domain (see `standards-backend.md` -> Package Structure). Pipeline artifacts under `output/` are separate from source code and must not be mixed into service repos unless explicitly committed.

## Microservice vs modular monolith

Choose one shape per deployable. Document the choice in `ARCH-BE-*` at `/design`.

| Shape | When to use | Domains per deployable | Database / Flyway |
|-------|-------------|------------------------|-------------------|
| **Microservice** | Independent deployable; one bounded context; separate scaling or team ownership | **One primary domain** (e.g. `payment/`) | One schema per service; migrations in that service only |
| **Modular monolith** | Single deployable; multiple bounded contexts; shared runtime acceptable | **Multiple domain folders** (e.g. `customer/`, `payment/`, `authentication/`) | One schema; migrations at service root; clear module boundaries |

Rules:

* Microservices: do **not** put multiple primary domains in one deployable unless an approved ADR documents an exception.
* Modular monolith: domains share one `*Application.java` and one Flyway scope; dependencies between domains must follow approved architecture (no circular domain imports).
* Brownfield: match as-built layout at `/onboard`; new work follows the target shape in delta `ARCH-BE-*`.

---

## Microservice layout (preferred default)

One repo (or Maven module) = one deployable = one primary domain.

```text
payment-service/
├── pom.xml
├── README.md
├── Dockerfile
│
├── src/
│   ├── main/
│   │   ├── java/com/{org}/{service}/
│   │   │   ├── PaymentServiceApplication.java
│   │   │   │
│   │   │   ├── config/                 # beans, security, openapi, datasource
│   │   │   │
│   │   │   ├── shared/                 # cross-cutting infra only (not domain logic)
│   │   │   │   ├── exception/          # @ControllerAdvice, error models
│   │   │   │   ├── security/
│   │   │   │   └── web/                # correlation ID, common headers
│   │   │   │
│   │   │   └── payment/                # primary domain (name matches service)
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── repository/
│   │   │       ├── model/
│   │   │       │   ├── entity/
│   │   │       │   └── dto/
│   │   │       └── mapper/
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/
│   │           └── migration/          # Flyway: V1__init.sql, V2__...
│   │
│   └── test/
│       ├── java/com/{org}/{service}/
│       │   ├── payment/
│       │   │   ├── controller/
│       │   │   ├── service/
│       │   │   └── repository/
│       │   └── integration/
│       └── resources/
│           └── application-test.yml
│
└── .env.example                        # never commit secrets
```

System-level example (many microservices):

```text
payment-service/      -> payment/
customer-service/     -> customer/
auth-service/         -> authentication/
```

---

## Modular monolith layout

One deployable; multiple domain modules under the same application class.

```text
platform-service/
├── pom.xml
└── src/main/java/com/{org}/platform/
    ├── PlatformApplication.java
    ├── config/
    ├── shared/
    │   └── exception/
    ├── customer/           # controller | service | repository | model
    ├── payment/
    └── authentication/
└── src/main/resources/
    └── db/migration/       # single Flyway scope for the monolith
```

---

## Domain module internal layout

Every domain folder (`payment/`, `customer/`, etc.) uses the same internal shape:

```text
{domain}/
├── controller/
├── service/
├── repository/
└── model/
    ├── entity/
    └── dto/
```

Business logic stays in `service/`. Controllers stay thin. Repositories handle persistence only.

---

## Avoid

```text
utils/                  # domain logic in generic folders
misc/
common2/
controller/             # flat layer at root — does not scale
service/
repository/
payment/
customer/
```

Use `shared/` only for cross-cutting infrastructure (exception handling, security filters, web middleware), not for business rules.

---

# Error Handling Standard

Must use:

Centralized Exception Handling

Preferred:

@ControllerAdvice

---

# Configuration Standard

All environment-specific values must be externalized.

Examples:

```text
Database URL
Credentials
API Keys
Endpoints
```

Must not be hardcoded.

---

# Dependency Management

Only approved dependencies should be added.

New dependencies require:

* Purpose
* Justification
* Risk assessment

---

# Performance Standard

For optimization discipline (evidence before optimize, profiling, measurement), see `standards-backend.md` -> Performance Standards.

Technology-specific performance tooling and service-level targets are defined per project in approved architecture or ADRs.

---

# Documentation Requirements

Every backend service must document:

* Purpose
* APIs
* Dependencies
* Configuration
* Operational requirements

---

# Architecture Compliance Checklist

Before approval:

* Enterprise capability baseline satisfied (mandatory tier)
* Java version compliant
* Framework compliant
* API standard followed
* Idempotency implemented for retryable or redeliverable writes
* Database justified
* Flyway migrations defined
* Input validation on write endpoints
* OpenAPI documentation exposed
* Security requirements addressed
* Logging and correlation ID addressed
* Observability requirements addressed (health, metrics, monitoring)
* Resilience defined for external integrations (when applicable)
* Testing requirements addressed
* Project structure matches microservice or modular monolith template per approved `ARCH-BE-*`
* Documentation requirements addressed

If any item fails:

Status:
Pending Approval

---

# Escalation Triggers

Escalate when:

* New technology proposed
* Non-standard framework proposed
* Non-standard database proposed
* Security exception required
* Performance exception required

---

# Final Rule

Technology choices must be:

* Requirement-driven
* Justified
* Traceable
* Documented

Technology choices must never be based solely on:

* Personal preference
* Familiarity
* Popularity
* Trends
