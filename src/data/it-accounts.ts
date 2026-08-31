/**
 * `role` merujuk ke `key` peran di `data/system-roles.ts` — dikelola di
 * TIM IT › Peran, bukan enum tetap. Ditulis sebagai `string` supaya peran
 * kustom (di luar OWNER/OPERATOR/VIEWER bawaan) bisa dibuat tanpa ubah tipe.
 */
export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED" // dibekukan sementara (mis. pelanggaran kebijakan), beda dari nonaktif manual
  | "PENDING_APPROVAL" // akun baru menunggu persetujuan Pemilik konsol

export type ITAccount = {
  id: string // UUID
  name: string
  email: string
  role: string // key di data/system-roles.ts
  status: AccountStatus
  isSelf: boolean // akun yang sedang login → badge [Anda]
  activeSessions: number
  lastActiveAt: string // ISO
  createdAt: string
}

/** TIM IT › Akun (5) */
export const itAccounts: ITAccount[] = [
  {
    id: "a1e7c3b0-2f4d-4a91-8c6e-1b2d3f4a5c60",
    name: "Irfan W.",
    email: "it.gaiadental@gmail.com",
    role: "OWNER",
    status: "ACTIVE",
    isSelf: true,
    activeSessions: 2,
    lastActiveAt: "2026-08-29T09:40:00Z",
    createdAt: "2023-10-01T00:00:00Z",
  },
  {
    id: "b2f8d4c1-3a5e-4b02-9d7f-2c3e4a5b6d71",
    name: "Dewi K.",
    email: "dewi.k@gaiadental.internal",
    role: "OPERATOR",
    status: "ACTIVE",
    isSelf: false,
    activeSessions: 1,
    lastActiveAt: "2026-08-29T08:12:00Z",
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "c3a9e5d2-4b6f-4c13-8e80-3d4f5b6c7e82",
    name: "Rizky A.",
    email: "rizky.a@gaiadental.internal",
    role: "OPERATOR",
    status: "ACTIVE",
    isSelf: false,
    activeSessions: 0,
    lastActiveAt: "2026-08-28T16:05:00Z",
    createdAt: "2024-03-20T00:00:00Z",
  },
  {
    id: "d4b0f6e3-5c70-4d24-9f91-4e5a6c7d8f93",
    name: "Sari M.",
    email: "sari.m@gaiadental.internal",
    role: "VIEWER",
    status: "SUSPENDED",
    isSelf: false,
    activeSessions: 0,
    lastActiveAt: "2026-06-02T04:30:00Z",
    createdAt: "2024-08-08T00:00:00Z",
  },
  {
    id: "e5c1a2b3-6d70-4f81-9e02-5f6a7b8c9d10",
    name: "Yoga P.",
    email: "yoga.p@gaiadental.internal",
    role: "AUDITOR",
    status: "PENDING_APPROVAL",
    isSelf: false,
    activeSessions: 0,
    lastActiveAt: "2026-08-27T03:00:00Z",
    createdAt: "2026-08-27T03:00:00Z",
  },
]

export const accountStatusLabel: Record<AccountStatus, string> = {
  ACTIVE: "Aktif",
  INACTIVE: "Nonaktif",
  SUSPENDED: "Dibekukan",
  PENDING_APPROVAL: "Menunggu persetujuan",
}
