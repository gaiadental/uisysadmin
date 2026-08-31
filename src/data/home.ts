export type AttentionKind = "EVENT_FAILED" | "SETUP_INCOMPLETE"

export type AttentionRow = {
  id: string
  kind: AttentionKind
  tenantCode: string
  summary: string
  detail: string // enum / state, font-mono
  since: string // ISO
}

/** Dashboard › tabel "Perlu ditangani". */
export const attentionRows: AttentionRow[] = [
  {
    id: "att_01",
    kind: "EVENT_FAILED",
    tenantCode: "GAIA",
    summary: "Event gagal diproses",
    detail: "TenantFeatureToggled",
    since: "2026-08-29T07:12:00Z",
  },
  {
    id: "att_02",
    kind: "EVENT_FAILED",
    tenantCode: "NUSANTARA",
    summary: "Event gagal diproses",
    detail: "PermissionRoleUpdated",
    since: "2026-08-29T05:40:00Z",
  },
  {
    id: "att_03",
    kind: "EVENT_FAILED",
    tenantCode: "SENYUM",
    summary: "Event gagal diproses",
    detail: "SessionRevokedAll",
    since: "2026-08-28T21:05:00Z",
  },
  {
    id: "att_04",
    kind: "SETUP_INCOMPLETE",
    tenantCode: "CEMPAKA",
    summary: "Setup penyimpanan belum tuntas",
    detail: "registration_state=PENDING_STORAGE",
    since: "2026-08-21T10:35:00Z",
  },
  {
    id: "att_05",
    kind: "SETUP_INCOMPLETE",
    tenantCode: "ARImdN",
    summary: "Pemilihan fitur belum tuntas",
    detail: "registration_state=PENDING_FEATURES",
    since: "2026-07-30T02:00:00Z",
  },
]

export type ActivityRow = {
  id: string
  actor: string // akun Tim IT
  action: string // enum, font-mono
  target: string // kode tenant / key
  at: string // ISO
}

/** Dashboard › 5 baris log aktivitas terakhir. */
export const activityRows: ActivityRow[] = [
  {
    id: "act_01",
    actor: "Irfan W.",
    action: "TENANT_DEACTIVATED",
    target: "LAMA01",
    at: "2026-08-29T09:20:00Z",
  },
  {
    id: "act_02",
    actor: "Dewi K.",
    action: "PERMISSION_TOGGLED_OFF",
    target: "lab.order",
    at: "2026-08-29T08:05:00Z",
  },
  {
    id: "act_03",
    actor: "Irfan W.",
    action: "SESSION_REVOKED_ALL",
    target: "SENYUM",
    at: "2026-08-28T17:42:00Z",
  },
  {
    id: "act_04",
    actor: "Rizky A.",
    action: "TENANT_CREATED",
    target: "CEMPAKA",
    at: "2026-08-21T10:35:00Z",
  },
  {
    id: "act_05",
    actor: "Dewi K.",
    action: "COUNTRY_DISABLED",
    target: "KH",
    at: "2026-08-20T11:15:00Z",
  },
]
