export type TenantStatus = "ACTIVE" | "INACTIVE"
export type RegistrationState = "COMPLETED" | "PENDING_STORAGE" | "PENDING_FEATURES"
export type StorageMode = "MULTI_TENANT" | "DEDICATED"

export type Tenant = {
  id: string // UUID
  code: string // kode singkat, font-mono
  name: string
  categoryKey: string
  countryIso2: string
  /**
   * `branchCount`, `userCount`, `activeSessions` adalah ringkasan agregat
   * yang disinkronkan via event dari master-data / profile-service /
   * auth-service — SysPrincipal (Konsol Sistem) TIDAK melakukan live-query
   * langsung ke tabel tenant-scoped untuk angka ini. Level agregat boleh
   * tampil di sini; daftar/detail per-baris (pegawai, cabang) tetap dilarang.
   */
  branchCount: number
  userCount: number
  status: TenantStatus
  registrationState: RegistrationState
  storageMode: StorageMode
  createdAt: string // ISO
  activeSessions: number
}

/** TENANT › Daftar tenant (12) */
export const tenants: Tenant[] = [
  {
    id: "9f1c2a7e-1d3b-4c8a-9e2f-6b0a7d4e1c33",
    code: "GAIA",
    name: "GAIA Dental Group",
    categoryKey: "GROUP_PRACTICE",
    countryIso2: "ID",
    branchCount: 6,
    userCount: 48,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2024-02-11T03:12:00Z",
    activeSessions: 9,
  },
  {
    id: "2b7d9e14-8a6c-4f2b-b1d0-3c5e8f9a0b21",
    code: "SENYUM",
    name: "Klinik Senyum Sehat",
    categoryKey: "GENERAL_DENTAL",
    countryIso2: "ID",
    branchCount: 3,
    userCount: 21,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2024-05-03T09:40:00Z",
    activeSessions: 6,
  },
  {
    id: "c4a1f0d2-5e7b-4a9c-8f31-1b2c3d4e5f60",
    code: "ORTHOPLUS",
    name: "OrthoPlus Center",
    categoryKey: "ORTHODONTIC",
    countryIso2: "MY",
    branchCount: 2,
    userCount: 14,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2024-06-19T02:05:00Z",
    activeSessions: 5,
  },
  {
    id: "77e0b3c9-9d1a-4b6e-a2f8-4d6e8a0c2b14",
    code: "DENTIKA",
    name: "Dentika Family Dental",
    categoryKey: "GENERAL_DENTAL",
    countryIso2: "ID",
    branchCount: 2,
    userCount: 18,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2024-07-28T06:30:00Z",
    activeSessions: 4,
  },
  {
    id: "1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9",
    code: "BRIGHT",
    name: "Bright Smile Studio",
    categoryKey: "COSMETIC",
    countryIso2: "SG",
    branchCount: 1,
    userCount: 7,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2024-09-02T04:15:00Z",
    activeSessions: 3,
  },
  {
    id: "8d7c6b5a-4f3e-42d1-90c8-7b6a5d4c3e2f",
    code: "KIDDOS",
    name: "Kiddos Dental Care",
    categoryKey: "PEDIATRIC",
    countryIso2: "ID",
    branchCount: 2,
    userCount: 12,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2024-10-11T08:00:00Z",
    activeSessions: 4,
  },
  {
    id: "3e4f5a6b-7c8d-49e0-a1b2-c3d4e5f60718",
    code: "MAXILLA",
    name: "Maxilla Oral Surgery",
    categoryKey: "ORAL_SURGERY",
    countryIso2: "TH",
    branchCount: 1,
    userCount: 9,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2024-11-20T01:25:00Z",
    activeSessions: 3,
  },
  {
    id: "6f70a1b2-c3d4-45e6-9788-1a2b3c4d5e6f",
    code: "PEARL",
    name: "Pearl Dental Boutique",
    categoryKey: "COSMETIC",
    countryIso2: "PH",
    branchCount: 1,
    userCount: 6,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2025-01-08T05:45:00Z",
    activeSessions: 2,
  },
  {
    id: "b1c2d3e4-f506-4718-8293-0a1b2c3d4e5f",
    code: "NUSANTARA",
    name: "Klinik Gigi Nusantara",
    categoryKey: "GENERAL_DENTAL",
    countryIso2: "ID",
    branchCount: 4,
    userCount: 30,
    status: "ACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2025-02-14T07:10:00Z",
    activeSessions: 5,
  },
  {
    id: "e5f60718-2938-4a4b-9c1d-2e3f40516273",
    code: "ARImdN",
    name: "Arini Dental Nusa",
    categoryKey: "PEDIATRIC",
    countryIso2: "ID",
    branchCount: 0,
    userCount: 2,
    status: "ACTIVE",
    registrationState: "PENDING_FEATURES",
    storageMode: "MULTI_TENANT",
    createdAt: "2025-07-30T02:00:00Z",
    activeSessions: 1,
  },
  {
    id: "0a1b2c3d-4e5f-4061-9829-3a4b5c6d7e8f",
    code: "CEMPAKA",
    name: "Klinik Cempaka Dental",
    categoryKey: "GENERAL_DENTAL",
    countryIso2: "MY",
    branchCount: 0,
    userCount: 0,
    status: "ACTIVE",
    registrationState: "PENDING_STORAGE",
    storageMode: "MULTI_TENANT",
    createdAt: "2025-08-21T10:35:00Z",
    activeSessions: 0,
  },
  {
    id: "4d5e6f70-8192-4a3b-8c4d-5e6f70819293",
    code: "LAMA01",
    name: "Klinik Drg. Hartono (lama)",
    categoryKey: "GENERAL_DENTAL",
    countryIso2: "ID",
    branchCount: 1,
    userCount: 4,
    status: "INACTIVE",
    registrationState: "COMPLETED",
    storageMode: "MULTI_TENANT",
    createdAt: "2023-11-02T04:50:00Z",
    activeSessions: 0,
  },
]

export const activeTenantCount = tenants.filter((t) => t.status === "ACTIVE").length
export const incompleteSetupCount = tenants.filter(
  (t) => t.registrationState !== "COMPLETED"
).length

export function findTenantByCode(code: string) {
  return tenants.find((t) => t.code.toLowerCase() === code.toLowerCase())
}
