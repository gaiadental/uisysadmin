---
id: RELEASE-NOTES-TODO-021
title: Release Notes TODO-021 Katalog Permission (read-only)
owner: technical_writer
status: Approved
version: 1.2
last_updated: 2026-10-12
source_requirements: [REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048]
related_artifacts: [TODO-021, ARCH-FE-001 v1.0.4, ADR-002, ADR-003, ADR-005, QA-TODO-021, DOC-TODO-021]
blocking_open_questions: 0
---

Title: Release Notes TODO-021 Katalog Permission (read-only)

Owner: technical_writer

Status: Approved

Release Version: TODO-021 increment (no version tag assigned; see Open Questions)

Version: 1.2

Last Updated: 2026-10-12

Source Requirements:
- REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048

Related Artifacts:
- TODO-021, ARCH-FE-001 v1.0.4, ADR-002, ADR-003, ADR-005
- `output/docs/tech-doc-TODO-021.md`, `output/reports/qa-report-TODO-021.md` (v1.1, Go)

## At a Glance

- Katalog > Permission (`/master-permissions`) is now read-only: list and search, plus edit of name and description only.
- Revision 1.2: the V4 migration pattern is stated as verified by the user. Revision 1.1: route guard verified against code; catalogue changes through Flyway migrations stated.
- Approved by the user on 2026-10-12. QA recommendation Go (v1.1). Live-stack behavior is not verified.
- Key references: REQ-FE-035, ARCH-FE-001 v1.0.4, TODO-021, FP-230 to FP-237.

## Purpose

Record what shipped in TODO-021 for Katalog > Permission, with deployment and rollback guidance.

## Scope

Frontend only (`sysadmin` repository, files FP-230 to FP-237). No backend, platform or other-page change. Tenant permission activate/deactivate is unchanged. TODO-018 is deferred and not part of this release.

## Summary

By user product decision of 2026-10-12, the permission catalogue can no longer be created, activated, deactivated or deleted from the SP web. Users with `master_permissions:update` can still change a permission's name and description. The other fields are shown as read-only text and are re-read from the server before each save.

## Features

- Read-only catalogue page with client-side search and paging (20 rows per page).
- Edit dialog limited to `name` and `description`.
- `key`, `category`, `module`, Status (`active`) and "Role pelanggan" (`customerPermitted`) are read-only; they are re-fetched from GET `/api/v1/master-permissions/{id}` just before the PATCH and sent unchanged.
- The save is refused, with no PATCH, when the re-fetch fails or when the re-fetched permission lacks `active` or `customerPermitted`. No default values are invented.
- New API function `getMasterPermission(id)`.

## Improvements

- Removed: create button and dialog path, `active` switch, delete action and its confirmation, and the unused code behind them (create mode, delete handler, create-only schema parts).
- Removed from the API module: `createMasterPermission`, `deleteMasterPermission`, their tests and route names.
- `toRequestBody` always sends `description` (empty string when absent); the update PATCH is otherwise unchanged.
- After an edit, caches are invalidated per D12.1: master permissions, tenant permissions and role permissions.
- "Ubah" and the Aksi column appear only with `master_permissions:update`.

## Bug Fixes

- None as a user-reported bug. During validation, QA finding M1 (invented `active`/`customerPermitted` defaults in the PATCH body when the re-fetch omitted them) was fixed before release, and review finding M2 (redundant permission checks) was cleaned up. Both are resolved in QA v1.1.

## Known Issues

- Not verified on the live stack (QA could not reach it): real GET and PATCH bodies. OQ1: whether GET by id always includes `active` and `customerPermitted`. OQ2: whether the full-body PATCH is accepted (FE-OQ-38).
- Server-side enforcement of `master_permissions:update` on PATCH was not verified (backend, outside this repository). UI gating is UX only.
- BG-12 / SP-BG-13: auth-service does not yet block deactivate/delete of core master permissions through the API. The UI no longer offers these actions, but direct API calls can still do it. External to this repository, not blocking.
- Low findings accepted by QA: no maximum length on `description` in the UI (server rejects over-long values and the alert shows it); the dialog may briefly show stale Status or role flag from the list while the saved data is correct.
- Not exercised in a browser by QA: visual rendering, keyboard focus order and screen reader behavior (WCAG 2.1 AA), and tenant permission tab and role checklist regressions (covered by unit tests only). The user checked the page in a browser on 2026-10-12.
- TODO-018 (deferred) is out of scope and not delivered.

## Deployment Notes

- Frontend-only change: build and deploy the SP web as usual. No migration, configuration or environment variable change, and no new dependency.
- Before relying on edit in an environment, confirm that GET `/api/v1/master-permissions/{id}` and PATCH `/api/v1/master-permissions/{id}` are available there and that the GET body includes `active` and `customerPermitted` (OQ1, OQ2).
- Verification done before release: `tsc` exit 0, `eslint src` exit 0, `vitest run` 75 files and 912 tests passed.
- Creating, activating, deactivating and deleting permissions is now done through Flyway migrations in auth-service. A new permission is granted to `SYS_PRINCIPAL` directly in the same migration (the V4 pattern; `V4__seed_system_roles_and_bootstrap_admin.sql` grants all master permissions to `SYS_PRINCIPAL`, verified by the user on 2026-10-12), and catalogue changes ship with the feature that uses them. Users who did these actions in the UI use a migration instead.
- Access to the page requires `master_permissions:view` in the session (permission gate only, no `SYS_PRINCIPAL` role gate on this route); `:update` is needed for edit.
- Note for `qa`: the 909 versus 912 passed-test wording in the QA report is handed to `qa`; these notes quote 912 and do not edit the QA report.

## Rollback Notes

- Frontend-only: redeploy the previous SP web build. No data migration to reverse.
- Edits already saved (name, description) remain; they are normal server data. The release writes no data other than via PATCH, and sends `active`, `customerPermitted`, `key`, `category` and `module` unchanged from the server.
- A source rollback would restore create and delete controls, which conflicts with REQ-FE-035 and ARCH-FE-001 v1.0.4; it needs a user decision.

## References

- Technical documentation: `output/docs/tech-doc-TODO-021.md`
- QA report v1.1 (Go), Code Review Report (Approved), Unit Test Report v1.1 (PASS)
- ARCH-FE-001 v1.0.4; ADR-002, ADR-003, ADR-005; TODO-021; FP-230 to FP-237

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Live GET by id always returns `active` and `customerPermitted`? | Refusal path may occur | Edit flow | user / platform | No | Open | Not verified live |
| OQ2 | Live API accepts full-body PATCH (FE-OQ-38)? | Edit success | Edit flow | user / platform | No | Open | Default: full body |
| OQ3 | Server-side `:update` enforcement on PATCH | Security boundary | Security | platform | No | Open | Not verified |
| OQ4 | BG-12 / SP-BG-13 server guard for core permissions | Lock-out risk via API | Platform | platform (auth-service architect_backend) | No | Open | External |
| OQ5 | Which release version tag applies to this increment? | Release Version field | Metadata | user / project_manager | No | Open | Not defined in the artifacts; identified by TODO-021 |
