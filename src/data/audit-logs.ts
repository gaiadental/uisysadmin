export type AuditOutcome = "SUCCESS" | "REJECTED"

export type AuditLog = {
  id: string
  at: string // ISO
  actor: string // akun Tim IT
  action: string // enum, font-mono
  target: string // kode tenant / key / iso2
  outcome: AuditOutcome
  note?: string
}

/** SISTEM › Log audit — tindakan Tim IT pada konsol. */
export const auditLogs: AuditLog[] = [
  { id: "au_01", at: "2026-08-29T09:40:00Z", actor: "Irfan W.", action: "SESSION_LIST_VIEWED", target: "—", outcome: "SUCCESS" },
  { id: "au_02", at: "2026-08-29T09:20:00Z", actor: "Irfan W.", action: "TENANT_DEACTIVATED", target: "LAMA01", outcome: "SUCCESS", note: "impact_sessions=0" },
  { id: "au_03", at: "2026-08-29T08:32:00Z", actor: "Dewi K.", action: "PERMISSION_TOGGLE_OFF", target: "patient.export", outcome: "REJECTED", note: "bound_tenants=6" },
  { id: "au_04", at: "2026-08-29T08:05:00Z", actor: "Dewi K.", action: "PERMISSION_TOGGLED_OFF", target: "lab_order.receive", outcome: "SUCCESS" },
  { id: "au_05", at: "2026-08-28T17:42:00Z", actor: "Irfan W.", action: "SESSION_REVOKED_ALL", target: "SENYUM", outcome: "SUCCESS", note: "revoked=8" },
  { id: "au_06", at: "2026-08-28T15:10:00Z", actor: "Rizky A.", action: "EVENT_REPROCESS_REQUESTED", target: "PermissionRoleUpdated", outcome: "SUCCESS" },
  { id: "au_07", at: "2026-08-28T11:03:00Z", actor: "Irfan W.", action: "IT_ACCOUNT_SELF_DEACTIVATE", target: "a1e7c3b0", outcome: "REJECTED", note: "self_protection" },
  { id: "au_08", at: "2026-08-21T10:35:00Z", actor: "Rizky A.", action: "TENANT_CREATED", target: "CEMPAKA", outcome: "SUCCESS", note: "storage_mode=MULTI_TENANT" },
  { id: "au_09", at: "2026-08-20T11:15:00Z", actor: "Dewi K.", action: "COUNTRY_DISABLED", target: "KH", outcome: "SUCCESS" },
  { id: "au_10", at: "2026-08-20T11:12:00Z", actor: "Dewi K.", action: "COUNTRY_DISABLE_ATTEMPT", target: "ID", outcome: "REJECTED", note: "tenant_count=7" },
  { id: "au_11", at: "2026-08-18T09:48:00Z", actor: "Irfan W.", action: "PERMANENT_DELETE_SCHEDULED", target: "OLDCLINIC", outcome: "SUCCESS", note: "run_at=2026-09-01" },
  { id: "au_12", at: "2026-08-15T14:20:00Z", actor: "Rizky A.", action: "TEMP_PASSWORD_ISSUED", target: "sari.m@gaiadental.internal", outcome: "SUCCESS" },
]

export const auditActors = [...new Set(auditLogs.map((l) => l.actor))]
