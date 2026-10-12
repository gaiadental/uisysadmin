---
id: CODE-REVIEW-TODO-021
title: Code Review Report TODO-021
owner: code_reviewer
status: Approved
version: 1.0
last_updated: 2026-10-12 14:40
related_todo: TODO-021
source_requirements: [REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048]
related_artifacts: [ARCH-FE-001 v1.0.4, ADR-003, ADR-002, ADR-005, unit-test-report-TODO-021]
blocking_open_questions: 0
---

Title: Code Review Report TODO-021
Owner: code_reviewer
Status: Approved
Version: 1.0
Last Updated: 2026-10-12 14:40
Source Requirements: REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048
Related Artifacts: TODO-021, ARCH-FE-001 v1.0.4, ADR-003, ADR-002, ADR-005, output/reports/unit-test-report-TODO-021.md

## At a Glance

- Katalog > Permission read-only: review of commit 34ab93c (FP-230 to FP-237).
- Approved: no Critical or High findings. 0 Critical, 0 High, 2 Medium, 2 Low.
- Independent runs: tsc PASS, eslint PASS (0 problems), vitest 909 passed in 75 files.

## Purpose

Review TODO-021 implementation against REQ-FE-035, ARCH-FE-001 v1.0.4 (D5.3, D6.4, D7, D9, D12.1, BG-12, FE-OQ-38), the user-added acceptance, standards-frontend, tech-stack-frontend and tech-stack-security.

## Scope Reviewed

Greenfield, enforced. Files: permission-list-page(.test).tsx, permission-form-dialog.tsx, schema(.test).ts, lib/api/modules/master-permissions(.test).ts, test/handlers/catalog.ts. Touchpoints: invalidation event `masterPermissionWrite` (unchanged, D12.1 set verified by tests), route gate and nav (unchanged, `master_permissions:view`).

## References

TODO-021 (amendments v1.8, v1.9), ARCH-FE-001 v1.0.4, unit-test-report-TODO-021.

## Findings

### Critical

None.

### High

None.

### Medium

- M1 `permission-form-dialog.tsx` (submit): `active: fresh.active ?? true` and `customerPermitted: fresh.customerPermitted ?? false` invent a value when the server omits the field. This contradicts "sent unchanged" and could silently flip a stored value (the dialog even shows "Tidak diketahui" for undefined `active`). Recommend: treat an undefined value from the re-fetch as a failed re-fetch (block PATCH, show error), or ask the architect/user whether the schema should make these fields required (clarification, not decided here). Not blocking because the server contract currently returns both fields; no test covers the omitted case.
- M2 `permission-list-page.tsx`: `showActions = canUpdate` is a redundant alias and the actions cell keeps a wrapper `div` and nested `canUpdate` check that can never differ. Dead indirection left from the old multi-action layout; simplify to one condition.

### Low

- L1 `permission-form-dialog.tsx`: the description input has no max length or schema limit. Contract gives no limit (server validates), so acceptable; note only.
- L2 `permission-form-dialog.tsx`: read-only values come from the list row (`permission.*`) while the PATCH uses the fresh values. If the server changed them, the user sees stale values while saving different ones. Acceptable per acceptance; consider showing the fresh values after re-fetch or a note.

## Checks

| Check | Result |
|-------|--------|
| No create / active switch / delete UI; no dead code (schema parts, constants, handlers, route names, create/delete API) | Pass (grep clean; only M2 residue) |
| Read-only fields re-fetched via GET and sent unchanged; failed re-fetch blocks PATCH, dialog stays open | Pass (code and tests) |
| One PATCH, full body, `key` unchanged | Pass |
| Gating UX only: view for route, update for "Ubah"; backend enforces | Pass |
| Invalidation matches D12.1; failed write invalidates nothing | Pass |
| Dialog a11y: labels bound, aria-invalid/describedby, role alert via FormAlert, focus via Radix Dialog, closing blocked while busy | Pass |
| Error handling: describeWriteFailure, no raw server detail beyond message and reference id | Pass |
| Secrets/PII logging | None found |
| Tests meaningful (stale vs fresh values, re-fetch order, controls absent, failure paths); not tautological | Pass |
| Provenance register FP-230 to FP-237 | Present, `full` |

## Recommendations

Address M1 (decide behavior for omitted `active`/`customerPermitted`) and M2 in a follow-up; neither blocks QA.

## Approval Status

Approved:
Yes

No unresolved Critical findings. Pipeline may advance to QA.

## Open Questions

None
