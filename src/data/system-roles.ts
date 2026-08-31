import { permissions } from "@/data/permissions"

export type SystemRole = {
  id: string
  key: string // font-mono, mis. "OWNER"
  label: string
  description: string
  /** Peran bawaan platform — tidak bisa dihapus, hanya izinnya yang bisa diubah. */
  isSystem: boolean
  permissionKeys: string[]
}

const allKeys = permissions.map((p) => p.key)
const viewKeys = permissions.filter((p) => p.key.endsWith(".view")).map((p) => p.key)

/** TIM IT › Peran — CRUD peran + pemetaan master_permissions. */
export const systemRoles: SystemRole[] = [
  {
    id: "role_owner",
    key: "OWNER",
    label: "Pemilik konsol",
    description:
      "Akses penuh ke seluruh modul konsol, termasuk Pengaturan platform.",
    isSystem: true,
    permissionKeys: allKeys,
  },
  {
    id: "role_operator",
    key: "OPERATOR",
    label: "Operator",
    description:
      "Mengelola tenant, katalog, dan sesi sehari-hari — tanpa akses Pengaturan platform.",
    isSystem: true,
    permissionKeys: permissions
      .filter((p) => p.group !== "role" && p.group !== "permission")
      .map((p) => p.key),
  },
  {
    id: "role_viewer",
    key: "VIEWER",
    label: "Peninjau",
    description: "Akses lihat-saja ke seluruh modul, tanpa aksi mutasi.",
    isSystem: true,
    permissionKeys: viewKeys,
  },
  {
    id: "role_auditor",
    key: "AUDITOR",
    label: "Auditor eksternal",
    description: "Akses terbatas untuk keperluan audit kepatuhan.",
    isSystem: false,
    permissionKeys: permissions
      .filter((p) => p.group === "audit" || p.group === "report")
      .map((p) => p.key),
  },
]

export function roleLabel(key: string): string {
  return systemRoles.find((r) => r.key === key)?.label ?? key
}

export function findRoleByKey(key: string) {
  return systemRoles.find((r) => r.key === key)
}
