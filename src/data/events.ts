export type EventStatus = "PROCESSED" | "PENDING" | "FAILED"

export type DomainEvent = {
  id: string // UUID
  name: string // enum PascalCase, font-mono
  tenantCode: string
  status: EventStatus
  attempts: number
  occurredAt: string // ISO
  lastError?: string // font-mono, hanya untuk FAILED
}

/** SISTEM › Event — 3 di antaranya FAILED (badge merah di sidebar). */
export const domainEvents: DomainEvent[] = [
  {
    id: "e1a2b3c4-0000-4a11-9c22-100000000001",
    name: "TenantFeatureToggled",
    tenantCode: "GAIA",
    status: "FAILED",
    attempts: 4,
    occurredAt: "2026-08-29T07:12:00Z",
    lastError: "handler_timeout after 30s",
  },
  {
    id: "e1a2b3c4-0000-4a11-9c22-100000000002",
    name: "PermissionRoleUpdated",
    tenantCode: "NUSANTARA",
    status: "FAILED",
    attempts: 3,
    occurredAt: "2026-08-29T05:40:00Z",
    lastError: "constraint_violation: role_permission_fk",
  },
  {
    id: "e1a2b3c4-0000-4a11-9c22-100000000003",
    name: "SessionRevokedAll",
    tenantCode: "SENYUM",
    status: "FAILED",
    attempts: 2,
    occurredAt: "2026-08-28T21:05:00Z",
    lastError: "downstream_unavailable: auth-service",
  },
  {
    id: "e1a2b3c4-0000-4a11-9c22-100000000004",
    name: "TenantCreated",
    tenantCode: "CEMPAKA",
    status: "PENDING",
    attempts: 1,
    occurredAt: "2026-08-29T09:55:00Z",
  },
  {
    id: "e1a2b3c4-0000-4a11-9c22-100000000005",
    name: "TenantDeactivated",
    tenantCode: "LAMA01",
    status: "PROCESSED",
    attempts: 1,
    occurredAt: "2026-08-29T09:20:00Z",
  },
  {
    id: "e1a2b3c4-0000-4a11-9c22-100000000006",
    name: "CountryDisabled",
    tenantCode: "—",
    status: "PROCESSED",
    attempts: 1,
    occurredAt: "2026-08-20T11:15:00Z",
  },
  {
    id: "e1a2b3c4-0000-4a11-9c22-100000000007",
    name: "PermissionAccessDisabled",
    tenantCode: "—",
    status: "PROCESSED",
    attempts: 2,
    occurredAt: "2026-08-29T08:05:00Z",
  },
  {
    id: "e1a2b3c4-0000-4a11-9c22-100000000008",
    name: "TenantStorageProvisioned",
    tenantCode: "NUSANTARA",
    status: "PROCESSED",
    attempts: 1,
    occurredAt: "2025-02-14T07:12:00Z",
  },
]

export const failedEventCount = domainEvents.filter(
  (e) => e.status === "FAILED"
).length
