---
id: QA-TODO-021
title: QA Report TODO-021
owner: qa
status: Approved
version: 1.0
last_updated: 2026-10-12 14:30
source_requirements: [REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048]
related_artifacts: [TODO-021, ARCH-FE-001 v1.0.4, ADR-002, ADR-003, ADR-005, CODE-REVIEW-TODO-021, unit-test-report-TODO-021]
blocking_open_questions: 0
---

Title: QA Report TODO-021 (Katalog > Permission read-only)

Owner: qa

Status: Approved

Version: 1.0

Last Updated: 2026-10-12 14:30

Source Requirements:
- REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048

Related Artifacts:
- TODO-021 (`output/plans/master-todo.md`), ARCH-FE-001 v1.0.4, ADR-002, ADR-003, ADR-005
- `output/reports/code-review-report-TODO-021.md` (Approved, 0 Critical/High)
- `output/reports/unit-test-report-TODO-021.md` (PASS)

## At a Glance

- Verifies TODO-021: Permission catalog is read-only; edit of name and description only, with a server re-fetch before PATCH.
- Recommendation: Go. No Critical or High defect. One Medium (M1) is recommended for a fix before release.
- Not verified live: the stack was not reachable to QA (see Scope Tested).

## Purpose

Verify the delivered behavior of TODO-021 against the requirements, ARCH-FE-001 v1.0.4 and the user-added acceptance of 2026-10-12.

## Scope

TODO-021 only: FP-230 to FP-237 (`permission-list-page`, `permission-form-dialog`, `schema`, `master-permissions` API module, their tests, `src/test/handlers/catalog.ts`). Greenfield, enforcement `enforced`. Stack standards: standards-frontend and tech-stack-frontend.

## References

- Gate runs executed by QA on 2026-10-12: `npx tsc -p tsconfig.app.json --noEmit` exit 0; `npx eslint src` exit 0; `npx vitest run` 75 files, 909 tests passed, 0 failed.
- Code and tests read: `permission-form-dialog.tsx`, `permission-list-page.test.tsx`.

## Scope Tested

Static and automated verification plus code and test reading. QA could not browse the live stack. The user checked the page in a browser (user message 2026-10-12); QA relies on that statement and did not re-observe it.

Not verified live:
- The real `GET /api/v1/master-permissions/{id}` body (whether it always includes `active` and `customerPermitted`).
- The real PATCH response and its behavior with the full body (FE-OQ-38).
- Server-side rejection of a PATCH by a user without `master_permissions:update` (backend, outside this repository).
- BG-12 / SP-BG-13 (server guard on core permissions; external, not blocking).
- Visual rendering, keyboard focus order and screen reader behavior of the dialog (WCAG 2.1 AA not exercised in a browser).
- Tenant permission tab and role checklist regression in a real browser (covered by unit tests only).

## Test Results

Passed:
- Gate commands: tsc, eslint, vitest (909/909).
- AC1 No create control, no active switch, no delete control, even with `:view`, `:create`, `:update`, `:delete`, `:activate` and `:deactivate` keys (test "renders no create, active or delete control even with every master_permissions key"). Create/delete API functions and route names are removed.
- AC2 Edit sends exactly one PATCH with the full body, `key` unchanged (test "sends exactly one PATCH ...").
- AC3 Edit action hidden without `master_permissions:update`; no Aksi column with only `:view` (gates tests).
- AC4 Invalidation after edit matches D12.1 (`masterPermissions`, `tenantPermissions`, `rolePermissions`); a failed write invalidates nothing (invalidation tests).
- AC5 User-added acceptance: (1) PATCH carries freshly fetched read-only values, not stale list values; (2) those fields render as text, not controls; (3) a failed re-fetch blocks the PATCH, shows the error and keeps the dialog open (corresponding tests present and passing; code confirms `getMasterPermission` precedes `updateMasterPermission` in one try block).
- AC6 `toRequestBody` sends `description` (empty string when absent) per amendment v1.9.
- AC7 Regressions TODO-011, TODO-013, TODO-015 (tenant permissions tab, role checklist, refused roles) pass within the full suite.
- Security: no tokens or secrets in the code; errors go through `describeWriteFailure` (no internals exposed); server-side enforcement is the boundary, UI gating is UX only (D6.4).
- Integration: idempotency does not apply (PATCH by stable ID). Required `/health` is a backend concern, out of scope.

Failed: none.

Blocked: live verification items listed under Scope Tested (environment access), not blocking the recommendation.

## Defects

### Critical

None.

### High

None.

### Medium

- M1 (review M1) `permission-form-dialog.tsx` lines 108-109: `fresh.active ?? true` and `fresh.customerPermitted ?? false` invent a value when the re-fetched body omits the field, and the fallback branch is untested. The PATCH is a full body, so a missing field would be written back as a default. A deactivated permission could be silently reactivated, or a customer-permitted flag silently cleared. Reproduce: serve a GET without `active` for a permission stored as inactive, edit the name, save, and inspect the PATCH body (`active: true`). Likelihood is unknown: the live GET shape was not verified. Recommendation: fix before release (fail the save with an error, or omit the field, per the FE-OQ-38 decision) and add a test. This is a small change; it is the Developer's to implement and the user's to decide.
- M2 (review M2) Redundant `canUpdate` checks. Quality only, no behavioral risk.

### Low

- L1 No maximum length on `description`. The server rejects an over-long value and the alert shows it. Low risk.
- L2 The dialog shows list-row values for the read-only fields while the PATCH uses fresh ones. A user may see a stale Status or role flag for a moment; the saved data is correct. Low risk.

## Risk Assessment

Residual risk is Low to Medium. All acceptance criteria are met in automated tests and the gates pass. The only data-integrity exposure is M1, and it needs a server response that omits a field the contract is expected to include. It is untested live, so the likelihood is unknown. Delete and create paths are removed from the UI and the API module, which reduces risk. The server-side guard for core permissions (BG-12) remains external.

## Release Recommendation

Go

No Critical or High defect is open. M1 is recommended for a fix before release; if the user accepts it, record it as a known limitation. QA's recommendation is not the final release decision; that stays with the user.

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Does the live GET `/api/v1/master-permissions/{id}` always return `active` and `customerPermitted`? | Decides whether M1 can occur | M1 likelihood | user / platform | No | Open | Default: treat as possible; fix M1 |
| OQ2 | Is a PATCH with the full body accepted by the live API (FE-OQ-38)? | Edit success on the live stack | Edit flow | user / platform | No | Open | Documented default: full body |
