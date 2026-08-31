import type { Tenant } from "@/data/tenants"

/**
 * Identitas sistem yang muncul di Detail Tenant › Tab "Ringkasan".
 * Sengaja tidak memuat kuota/skema penyimpanan — domain kuota penyimpanan
 * per tenant belum pernah dirancang di ERD manapun, jadi tidak ditampilkan
 * di sini supaya angka mock tidak keburu disepakati sebagai kontrak.
 */
export type SystemIdentity = {
  tenantId: string // UUID
  createdAt: string
  lastEventAt: string
}

export type ConditionCheck = {
  key: string
  label: string
  ok: boolean
  note: string
}

export function systemIdentityFor(t: Tenant): SystemIdentity {
  return {
    tenantId: t.id,
    createdAt: t.createdAt,
    lastEventAt:
      t.activeSessions > 0 ? "2026-08-29T06:30:00Z" : "2026-08-10T04:00:00Z",
  }
}

/** Checklist kondisi tenant (Tab "Ringkasan"). */
export function conditionsFor(t: Tenant): ConditionCheck[] {
  return [
    {
      key: "storage",
      label: "Penyimpanan terpasang",
      ok: t.registrationState !== "PENDING_STORAGE",
      note:
        t.registrationState === "PENDING_STORAGE"
          ? "registration_state=PENDING_STORAGE"
          : `storage_mode=${t.storageMode}`,
    },
    {
      key: "features",
      label: "Pemilihan fitur tuntas",
      ok: t.registrationState !== "PENDING_FEATURES",
      note:
        t.registrationState === "PENDING_FEATURES"
          ? "registration_state=PENDING_FEATURES"
          : "feature_set=locked",
    },
    {
      key: "branch",
      label: "Minimal satu cabang terdaftar",
      ok: t.branchCount > 0,
      note: `branch_count=${t.branchCount}`,
    },
    {
      key: "activity",
      label: "Ada aktivitas 30 hari terakhir",
      ok: t.activeSessions > 0,
      note: `active_sessions=${t.activeSessions}`,
    },
    {
      key: "status",
      label: "Tenant berstatus aktif",
      ok: t.status === "ACTIVE",
      note: `status=${t.status}`,
    },
  ]
}
