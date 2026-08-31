/**
 * SISTEM › Sesi aktif.
 * Sesi klinik hanya dikelola per-tenant (agregat jumlah), tidak per-pengguna.
 *
 * JANGAN kembangkan `TenantSessionAggregate` menjadi daftar sesi per-user
 * tenant (device/IP/nama pengguna klinik) — itu data bisnis tenant-scoped,
 * di luar cakupan SysPrincipal. Cakupan yang disetujui: agregat + tombol
 * cabut-semua, menunggu endpoint baru
 * `DELETE /admin/tenants/{tenantId}/sessions` di auth-service.
 * (`ITAccountSession` di bawah beda cakupan — itu sesi akun Tim IT sendiri,
 * data platform-infra, bukan data tenant.)
 */

export type TenantSessionAggregate = {
  tenantCode: string
  tenantName: string
  sessions: number
  oldestLoginAt: string // ISO
}

export type ITAccountSession = {
  accountId: string
  accountName: string
  device: string // font-mono ringkas
  ip: string // font-mono
  startedAt: string // ISO
  lastSeenAt: string // ISO
  current: boolean // sesi perangkat ini
}

export const tenantSessionAggregates: TenantSessionAggregate[] = [
  { tenantCode: "GAIA", tenantName: "GAIA Dental Group", sessions: 10, oldestLoginAt: "2026-08-29T02:10:00Z" },
  { tenantCode: "SENYUM", tenantName: "Klinik Senyum Sehat", sessions: 7, oldestLoginAt: "2026-08-29T01:30:00Z" },
  { tenantCode: "NUSANTARA", tenantName: "Klinik Gigi Nusantara", sessions: 6, oldestLoginAt: "2026-08-29T03:05:00Z" },
  { tenantCode: "ORTHOPLUS", tenantName: "OrthoPlus Center", sessions: 5, oldestLoginAt: "2026-08-29T04:12:00Z" },
  { tenantCode: "DENTIKA", tenantName: "Dentika Family Dental", sessions: 4, oldestLoginAt: "2026-08-29T04:40:00Z" },
  { tenantCode: "KIDDOS", tenantName: "Kiddos Dental Care", sessions: 4, oldestLoginAt: "2026-08-29T05:00:00Z" },
  { tenantCode: "BRIGHT", tenantName: "Bright Smile Studio", sessions: 3, oldestLoginAt: "2026-08-29T05:20:00Z" },
  { tenantCode: "MAXILLA", tenantName: "Maxilla Oral Surgery", sessions: 2, oldestLoginAt: "2026-08-29T06:00:00Z" },
  { tenantCode: "PEARL", tenantName: "Pearl Dental Boutique", sessions: 2, oldestLoginAt: "2026-08-29T06:30:00Z" },
  { tenantCode: "ARImdN", tenantName: "Arini Dental Nusa", sessions: 1, oldestLoginAt: "2026-08-29T07:15:00Z" },
]

export const itAccountSessions: ITAccountSession[] = [
  {
    accountId: "a1e7c3b0-2f4d-4a91-8c6e-1b2d3f4a5c60",
    accountName: "Irfan W.",
    device: "macOS · Chrome 140",
    ip: "103.28.14.201",
    startedAt: "2026-08-29T06:00:00Z",
    lastSeenAt: "2026-08-29T09:40:00Z",
    current: true,
  },
  {
    accountId: "a1e7c3b0-2f4d-4a91-8c6e-1b2d3f4a5c60",
    accountName: "Irfan W.",
    device: "iPadOS · Safari 18",
    ip: "103.28.14.207",
    startedAt: "2026-08-28T22:15:00Z",
    lastSeenAt: "2026-08-29T08:05:00Z",
    current: false,
  },
  {
    accountId: "b2f8d4c1-3a5e-4b02-9d7f-2c3e4a5b6d71",
    accountName: "Dewi K.",
    device: "Windows · Edge 140",
    ip: "180.244.132.9",
    startedAt: "2026-08-29T07:30:00Z",
    lastSeenAt: "2026-08-29T08:12:00Z",
    current: false,
  },
]

export const tenantSessionTotal = tenantSessionAggregates.reduce(
  (n, t) => n + t.sessions,
  0
)
export const itSessionTotal = itAccountSessions.length
export const activeSessionTotal = tenantSessionTotal + itSessionTotal // 47
