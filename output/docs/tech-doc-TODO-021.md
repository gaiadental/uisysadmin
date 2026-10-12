---
id: DOC-TODO-021
title: Technical Documentation TODO-021 Katalog Permission (read-only)
owner: technical_writer
status: Approved
version: 1.2
last_updated: 2026-10-12
source_requirements: [REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048]
related_artifacts: [TODO-021, ARCH-FE-001 v1.0.4, ADR-002, ADR-003, ADR-005, QA-TODO-021, CODE-REVIEW-TODO-021, UNIT-TEST-REPORT-TODO-021, RELEASE-NOTES-TODO-021]
blocking_open_questions: 0
---

Title: Technical Documentation TODO-021 Katalog Permission (read-only)

Owner: technical_writer

Status: Approved

Version: 1.2

Last Updated: 2026-10-12

Source Requirements:
- REQ-FE-035, REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048

Related Artifacts:
- TODO-021 (`output/plans/master-todo.md`)
- ARCH-FE-001 v1.0.4 (Approved 2026-10-12)
- ADR-002 (fetch HTTP client), ADR-003 (server state and forms), ADR-005 (test stack)
- `output/reports/qa-report-TODO-021.md` (v1.1, Go), `output/reports/code-review-report-TODO-021.md` (Approved), `output/reports/unit-test-report-TODO-021.md` (v1.1, PASS)
- `output/docs/release-notes-TODO-021.md`

## At a Glance

- Documents the delivered behavior of Katalog > Permission (`/master-permissions`) after it became read-only: list and search, plus an edit dialog limited to name and description.
- Status: Approved by the user on 2026-10-12. No blocking open question. Live-stack behavior (real GET and PATCH bodies) is not verified; see Open Questions.
- Revision 1.2: the V4 migration pattern is stated as verified by the user. Revision 1.1: route guard and test list verified against code; catalogue management through Flyway migrations documented.
- Key references: REQ-FE-035, ARCH-FE-001 v1.0.4 (D5.3, D6.4, D9, D12.1, BG-12, FE-OQ-38), TODO-021, QA report v1.1 (Go).

## Purpose

Describe, for developers and QA of the System Principal web, what the Permission catalogue page does after TODO-021, which API calls it makes, how it is tested, and how to diagnose common problems. Only behavior delivered and approved by QA is described. Greenfield project, enforcement `enforced`.

## Scope

In scope: the page `src/features/catalog/master-permissions/` (list page, edit dialog, schema), the API module `src/lib/api/modules/master-permissions.ts`, the MSW handlers `src/test/handlers/catalog.ts` (GET by id, PATCH; the list GET is served by `src/test/handlers/tenant-permissions.ts`), and their tests (file-provenance rows FP-230 to FP-237).

Out of scope: tenant permission activate/deactivate (`tenant_permissions:*`, unchanged), the server-side guard for core permissions (BG-12 / SP-BG-13, platform repository), and TODO-018 (deferred, not delivered).

## Audience

Frontend developers maintaining the SP web, QA engineers, and reviewers who need to know what the catalogue page can and cannot do.

## Prerequisites

- A signed-in session whose `me.permissions` includes `master_permissions:view` to reach the route `/master-permissions`. The route (`catalog.permission` in `src/app/router.tsx`) takes its access from the nav item in `src/app/navigation.ts`, which is `permissionAccess(["master_permissions:view"])`: a session, the password-change rule, and the `hasPermissions` gate (every listed key must be in `me.permissions`; otherwise FORBIDDEN). There is no `SYS_PRINCIPAL` role gate on this route, unlike the other master-data screens. The sidebar and command palette use the same gate.
- `master_permissions:update` to see the edit action. UI gating is a convenience only; the backend (auth-service) is the security boundary (ARCH-FE-001 D6.4).
- To run the tests: Node toolchain of the repository. Commands are listed under Procedure.

## Procedure

### 1. Delivered behavior

**List (`permission-list-page.tsx`)**
- Reads the whole catalogue with GET `/api/v1/master-permissions`. The server does not paginate, so search and paging run on the client (`useClientPagedList`, 20 rows per page).
- Search matches key, name, category, module and description (case-insensitive).
- Columns: Key, Nama, Kategori, Modul, Status (read-only badge; a dash when `active` is unknown), Tenant ("Boleh dipakai" when `customerPermitted` is true, otherwise "Internal"), and Aksi only when the session holds `master_permissions:update`.
- States: loading (status text plus skeleton rows), error with a "Coba lagi" retry, empty ("Belum ada permission."), and no match ("Tidak ada permission yang cocok.").

**Removed from the UI (REQ-FE-035)**
- No create button or create dialog path.
- No activate/deactivate switch.
- No delete action or delete confirmation.
- These controls do not render even when the session holds `master_permissions:view`, `:create`, `:update`, `:delete`, `:activate` and `:deactivate`.
- The functions `createMasterPermission` and `deleteMasterPermission`, their module tests and their route names were removed from the API module (user-approved amendment 2026-10-12).

**Edit dialog (`permission-form-dialog.tsx`)**
- Opened with "Ubah" on a row (visible only with `master_permissions:update`).
- Editable fields: `name` (required, trimmed, at most 100 characters) and `description` (optional, trimmed).
- Read-only text, not form controls: `key`, `category`, `module`, Status (`active`) and "Role pelanggan" (`customerPermitted`). These show the values loaded by the list.
- On "Simpan" the dialog runs this sequence in one try block:
  1. GET `/api/v1/master-permissions/{id}` (re-fetch). If it fails, no PATCH is sent, the error alert is shown and the dialog stays open.
  2. If the re-fetched permission lacks a boolean `active` or `customerPermitted`, the save is refused: the alert "Data permission dari server tidak lengkap. Perubahan tidak disimpan." is shown, no PATCH is sent, and no default value is invented.
  3. PATCH `/api/v1/master-permissions/{id}` with the full body: `key`, `category`, `module`, `active`, `customerPermitted` taken unchanged from the re-fetch (not from the stale list values), and `name` and `description` from the form (FE-OQ-38 default: full body).
  4. On success: invalidate caches, toast "Permission disimpan.", close the dialog.
- A PATCH failure shows an alert (server message for conflicts such as 409), keeps the dialog open and shows no toast. The dialog cannot be closed while a request is in flight.

**Cache invalidation (ARCH-FE-001 D12.1)**
After a successful edit the event `masterPermissionWrite` invalidates `['system','masterPermissions']`, all `['system','tenantPermissions']` and `['system','rolePermissions']`. A failed write invalidates nothing.

### 2. API usage

| Call | Function | Permission | Used by |
|------|----------|------------|---------|
| GET `/api/v1/master-permissions` | `listMasterPermissions()` | `master_permissions:view` | List page |
| GET `/api/v1/master-permissions/{id}` | `getMasterPermission(id)` (route name `masterPermissions.get`) | `master_permissions:view` | Edit dialog, before PATCH |
| PATCH `/api/v1/master-permissions/{id}` | `updateMasterPermission(id, input)` (route name `masterPermissions.update`) | `master_permissions:update` | Edit dialog |

Responses are unwrapped from `{ "data": ... }` and validated with the Zod schemas in `@/types/master-permission`. `toRequestBody` is a whitelist of the contract keys and always sends `description` (empty string when absent).

PATCH body shape (example values only, no real data):

```json
{
  "key": "example_module:view",
  "name": "Lihat contoh",
  "description": "",
  "category": "example",
  "module": "example_module",
  "active": true,
  "customerPermitted": false
}
```

Errors go through `describeWriteFailure` / `describeReadFailure`, which show a user-safe message and a reference id when available and do not expose internals.

### 3. Tests

| File | Tests | Covers |
|------|-------|--------|
| `permission-list-page.test.tsx` | 22 `it` definitions (two are `it.each`: four single-key cases and two missing-flag cases) | List states, client search and paging, gates, no create/active/delete control with every key, edit dialog (one PATCH, fresh read-only values, missing flags refused, failed re-fetch, validation, PATCH failure and 409), invalidation |
| `schema.test.ts` | 7 | Edit schema (`name`, `description`) |
| `src/lib/api/modules/master-permissions.test.ts` | 13 | `listMasterPermissions`, `getMasterPermission`, `updateMasterPermission`, request body whitelist |
| `src/test/handlers/catalog.ts` | n/a | MSW handlers for this page: GET by id and PATCH on `/master-permissions/:id` (POST and DELETE handlers removed) |
| `src/test/handlers/tenant-permissions.ts` | n/a | Shared MSW handler for GET `/master-permissions` (the list), not in `catalog.ts` |

Delivered results (Unit Test Report v1.1 and QA report v1.1): `npx tsc -p tsconfig.app.json --noEmit` exit 0, `npx eslint src` exit 0, `npx vitest run` 75 files, 912 tests passed, 0 failed. The QA report wording on 909 versus 912 tests is handed to the `qa` agent (see OQ5); this document quotes the 912 figure of the Unit Test Report and QA report v1.1 and does not edit either. Regressions for TODO-011, TODO-013 and TODO-015 (tenant permissions tab, role permission checklist, refused roles) pass in the same run.

To rerun: `npx vitest run src/features/catalog/master-permissions src/lib/api/modules/master-permissions.test.ts`, or the full `npx vitest run`.

## Examples

Gate behavior by session permissions:

| Session keys | Route | Edit action | Create / delete / active |
|--------------|-------|-------------|--------------------------|
| no `master_permissions:view` | blocked by route guard (FORBIDDEN) | n/a | n/a |
| `master_permissions:view` | list only | hidden, no Aksi column | not offered |
| `master_permissions:view`, `:update` | list | "Ubah" shown | not offered |
| all `master_permissions:*` keys | list | "Ubah" shown | still not offered |

### Managing the catalogue (create, activate, deactivate, delete)

The SP web no longer creates, activates, deactivates or deletes permissions. These changes are made through Flyway migrations in auth-service. A new permission is granted to the `SYS_PRINCIPAL` role directly in the same migration (the V4 pattern), so the role holds it without any UI step. Catalogue changes accompany the feature that uses them: the migration for a permission ships with the feature that checks that key. Users who previously did these actions in the UI therefore use a migration in auth-service instead. The migrations live in the auth-service repository, outside this one. The V4 pattern (`V4__seed_system_roles_and_bootstrap_admin.sql` grants all master permissions to `SYS_PRINCIPAL`) was verified by the user on 2026-10-12.

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| No "Ubah" button or Aksi column | Session lacks `master_permissions:update` | Check `me.permissions`; grant the key in auth-service |
| Save shows "Data permission dari server tidak lengkap. Perubahan tidak disimpan." | The re-fetched GET body lacks a boolean `active` or `customerPermitted` | Inspect the GET `/api/v1/master-permissions/{id}` response; report to auth-service owner (OQ1). Nothing was written |
| Save shows an error alert and the dialog stays open | Re-fetch failed, PATCH rejected (for example 409 or 403), or network error | Read the alert text and reference id; retry. A failed re-fetch never sends a PATCH |
| Edit succeeded but another screen shows old data | Query not refetched yet | Edit invalidates master, tenant and role permission queries; reload the other screen |
| Status shows a dash | Server list item has no `active` | Contract question (OQ1); the page does not guess |
| List shows "Coba lagi" | GET list failed | Use retry; check API gateway and auth-service |
| Core permission can be deactivated or deleted by direct API call | The API still allows it; only the UI control was removed | Known gap BG-12 / SP-BG-13, handled in the platform repository |

## References

- Requirements: REQ-FE-035 (read-only catalogue), REQ-FE-018, REQ-FE-036, REQ-FE-040, REQ-FE-048
- Architecture: ARCH-FE-001 v1.0.4 D5.3, D6.4, D7, D8 Table 2 (`katalog-permission`), D9, D12.1, BG-12, FE-OQ-38
- ADRs: ADR-002 (fetch client used through `apiRequest`), ADR-003 (TanStack Query and form handling), ADR-005 (test stack: Vitest, Testing Library, MSW)
- Plan: TODO-021, file-provenance rows FP-230 to FP-237
- Reports: QA v1.1 (Go), Code Review (Approved, 0 Critical/High), Unit Test Report v1.1 (PASS)

## Open Questions

| ID | Question | Why it matters | Impact | Owner | Blocking | Status | Answer / Default |
|----|----------|----------------|--------|-------|----------|--------|------------------|
| OQ1 | Does the live GET `/api/v1/master-permissions/{id}` always return `active` and `customerPermitted`? (QA OQ1) | Decides whether the "data tidak lengkap" refusal can occur | Edit flow | user / platform | No | Open | Not verified live. Page refuses the save if a flag is missing |
| OQ2 | Does the live API accept the full-body PATCH (FE-OQ-38)? (QA OQ2) | Edit success on the live stack | Edit flow | user / platform | No | Open | Documented default: full body |
| OQ3 | Does auth-service reject PATCH without `master_permissions:update` server-side? | UI gating is UX only | Security boundary | platform (auth-service) | No | Open | Not verified; outside this repository |
| OQ4 | BG-12 / SP-BG-13: server guard against deactivate/delete of core permissions | Defence in depth after UI removal | Lock-out risk via direct API | platform (auth-service architect_backend) | No | Open | External, not blocking |
| OQ5 | QA report wording on 909 versus 912 passed tests | Consistency of reported figures | Documentation only | qa | No | Open | Handed to `qa`; this document uses 912 and does not edit the QA report |
