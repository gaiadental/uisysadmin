
# Security Technology Standards

> Loading: always active. Imported into every session via the root `CLAUDE.md` (`@.claude/rules/tech-stack-security.md`). Ported from Cursor's `.cursor/rules/tech-stack-security.mdc` (`alwaysApply: true`) — content is unchanged except path references.

Version: 1.0

Status: Active

---

# Purpose

This document defines mandatory security standards, principles, controls, and implementation requirements.

This document governs:

* security_architect
* architect_backend
* architect_frontend
* developer_backend
* developer_frontend
* code_reviewer
* qa

All security-related recommendations and implementations must comply with this standard unless an approved ADR explicitly overrides it.

Full section index: `.claude/docs/rules-index.md` -> `tech-stack-security.md`.

---

# Security Governance

## Security First Principle

Security must be considered during:

* Requirements Analysis
* Architecture Design
* Development
* Testing
* Deployment
* Operations

Security must not be added after implementation.

---

## Shared Responsibility

Security is everyone's responsibility.

The existence of a security_architect does not remove security responsibilities from other roles.

---

# Security Classification

## Mandatory Requirement

Every project must define data classification.

If classification is unknown:

Status:
Pending Clarification

---

## Minimum Classifications

### Public

Information intended for public access.

Examples:

* Public website content
* Marketing content

---

### Internal

Information intended for internal use.

Examples:

* Internal documentation
* Internal reports

---

### Confidential

Information requiring controlled access.

Examples:

* Customer data
* Financial data
* Business-sensitive data

---

### Restricted

Highly sensitive information.

Examples:

* Cryptographic keys
* Authentication secrets
* Regulatory-protected information

---

# Authentication Standards

## Preferred

OIDC (OpenID Connect)

or

OAuth 2.0

---

## Requirements

Authentication must support:

* Identity verification
* Session management
* Access revocation

---

## Multi-Factor Authentication

Must be evaluated for:

* Administrative access
* Sensitive systems
* Production environments

If requirements are unclear:

Status:
Pending Clarification

---

## Prohibited

Custom authentication mechanisms without justification.

---

# Authorization Standards

## Preferred

Role-Based Access Control (RBAC)

---

## Allowed Alternative

Attribute-Based Access Control (ABAC)

Requires justification.

---

## Principle

Users must receive only the minimum permissions required.

Least Privilege is mandatory.

---

# Session Management

## Requirements

Sessions must support:

* Expiration
* Revocation
* Renewal

---

## Prohibited

Unlimited session duration.

---

# Password Standards

## Password Storage

Allowed:

* Argon2
* BCrypt

---

## Prohibited

* Plain Text
* MD5
* SHA1

---

## Password Transmission

Passwords must never be transmitted unencrypted.

---

# Secrets Management

## Requirements

Secrets must be stored outside source code.

Examples:

* API Keys
* Database Passwords
* Certificates
* Tokens
* Encryption Keys

---

## Preferred

Dedicated secrets management solutions.

Examples:

* HashiCorp Vault
* Cloud Secret Manager
* Kubernetes Secrets

Project must select an approved solution.

---

## Prohibited

Hardcoded secrets.

---

# Encryption Standards

## Data In Transit

All sensitive communication must use TLS.

Preferred:

TLS 1.2 or higher

---

## Data At Rest

Sensitive data must be encrypted when required by:

* Business requirements
* Compliance requirements
* Regulatory requirements

---

## Cryptographic Algorithms

Approved:

* AES-256
* RSA
* ECC

---

## Prohibited

Weak or deprecated algorithms.

Examples:

* DES
* RC4

---

# API Security Standards

## Requirements

APIs must support:

* Authentication
* Authorization
* Input validation
* Error handling
* Audit logging

---

## API Exposure

Public APIs must be explicitly approved.

---

## Error Messages

Error messages must not expose:

* Internal implementation details
* Stack traces
* Sensitive system information

---

# Input Validation Standards

## Principle

All input is untrusted.

---

## Requirements

Validation must occur:

* Client Side (User Experience)
* Server Side (Security)

Server-side validation is mandatory.

---

## Prohibited

Trusting frontend validation alone.

---

# Output Encoding Standards

Applications must protect against:

* Cross-Site Scripting (XSS)
* Injection attacks
* Content spoofing

Appropriate output encoding is required.

---

# Database Security Standards

## Requirements

Database access must follow:

* Least Privilege
* Segregation of Duties

---

## Preferred

Dedicated service accounts.

---

## Prohibited

Shared administrative accounts for application access.

---

# Logging Standards

## Required Logging

Must log:

* Authentication events
* Authorization failures
* Security exceptions
* Administrative actions

---

## Prohibited Logging

Must never log:

* Passwords
* Tokens
* Encryption keys
* Secrets
* Sensitive authentication data

---

# Audit Standards

## Requirements

Audit trails must support:

* Traceability
* Investigation
* Accountability

---

## Audit Events

Examples:

* Login
* Logout
* Permission changes
* Administrative actions

---

# Dependency Security Standards

## Requirements

Dependencies must be reviewed.

Projects should monitor:

* Known vulnerabilities
* End-of-life software
* Unsupported libraries

---

## Prohibited

Introducing dependencies without justification.

---

# Infrastructure Security Standards

## Principle

Infrastructure must follow least privilege.

---

## Requirements

Access must be controlled.

Administrative access must be limited.

---

## Network Segmentation

Must be considered when:

* Multiple environments exist
* Sensitive systems exist

---

# Frontend Security Standards

## Requirements

Applications must protect against:

* XSS
* CSRF
* Clickjacking

---

## Browser Storage

Sensitive data must not be stored in:

* Local Storage
* Session Storage

without explicit justification.

---

# Backend Security Standards

## Requirements

Backend systems must:

* Validate inputs
* Enforce authorization
* Protect sensitive data

Backend systems must never trust frontend security controls.

---

# Security Testing Standards

## Required Activities

Security validation should consider:

* Authentication testing
* Authorization testing
* Input validation testing
* Session management testing

---

## Vulnerability Assessment

Must be evaluated for systems handling:

* Confidential data
* Restricted data

---

# Compliance Standards

## Requirements

Projects must identify applicable compliance requirements.

Examples:

* PCI DSS
* GDPR
* ISO 27001
* Local regulations

---

## If Unknown

Status:
Pending Clarification

---

# Incident Response Considerations

Projects should define:

* Incident reporting process
* Escalation process
* Investigation process

If requirements are unclear:

Status:
Pending Clarification

---

# Architecture Compliance Checklist

Before approval:

* Authentication defined
* Authorization defined
* Encryption requirements defined
* Secrets management defined
* Logging requirements defined
* Audit requirements defined
* Input validation requirements defined
* Dependency security addressed
* Compliance requirements identified

If any item fails:

Status:
Pending Approval

---

# Escalation Triggers

Escalate when:

* Authentication requirements are unclear
* Authorization requirements are unclear
* Compliance requirements are unknown
* Data classification is unknown
* Encryption requirements are unclear
* Security exceptions are requested
* Sensitive data handling requirements are unclear

---

# Security Review Requirements

Every architecture review must answer:

* What data is being protected?
* Who can access it?
* How is access controlled?
* How is access audited?
* How are secrets protected?
* How is data encrypted?
* How are incidents investigated?

Unanswered questions require clarification.

---

# Final Rule

Security decisions must be:

* Requirement-driven
* Risk-based
* Traceable
* Documented
* Reviewable

Security decisions must never be based solely on:

* Convenience
* Assumptions
* Personal preference
* Implementation shortcuts

When security requirements are unclear:

Stop.

Request clarification.

Status:
Pending Clarification
