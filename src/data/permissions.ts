export type Permission = {
  key: string // font-mono, mis. "patient.view"
  group: string // font-mono kelompok, mis. "patient"
  label: string
  core: boolean // CORE = tidak dapat dinonaktifkan
  enabled: boolean // status akses global
  boundTenants: number // jumlah tenant yang masih memetakan permission ini ke peran
  boundRoles: string[] // contoh nama peran yang memakainya
}

type Spec = {
  group: string
  groupLabel: string
  actions: [string, string][] // [action, label]
  coreActions?: string[]
}

const SPECS: Spec[] = [
  {
    group: "appointment",
    groupLabel: "Janji temu",
    actions: [
      ["view", "Lihat janji temu"],
      ["create", "Buat janji temu"],
      ["update", "Ubah janji temu"],
      ["cancel", "Batalkan janji temu"],
      ["reschedule", "Jadwal ulang janji temu"],
    ],
    coreActions: ["view"],
  },
  {
    group: "patient",
    groupLabel: "Data pasien",
    actions: [
      ["view", "Lihat data pasien"],
      ["create", "Daftarkan pasien"],
      ["update", "Ubah data pasien"],
      ["delete", "Hapus data pasien"],
      ["export", "Ekspor data pasien"],
      ["merge", "Gabungkan rekam ganda"],
    ],
    coreActions: ["view"],
  },
  {
    group: "clinical_record",
    groupLabel: "Rekam klinis",
    actions: [
      ["view", "Lihat rekam klinis"],
      ["create", "Buat catatan klinis"],
      ["update", "Ubah catatan klinis"],
      ["sign", "Tanda tangani catatan"],
      ["amend", "Koreksi catatan terkunci"],
    ],
    coreActions: ["view"],
  },
  {
    group: "treatment_plan",
    groupLabel: "Rencana perawatan",
    actions: [
      ["view", "Lihat rencana perawatan"],
      ["create", "Susun rencana perawatan"],
      ["update", "Ubah rencana perawatan"],
      ["approve", "Setujui rencana perawatan"],
    ],
  },
  {
    group: "prescription",
    groupLabel: "Resep",
    actions: [
      ["view", "Lihat resep"],
      ["create", "Terbitkan resep"],
      ["dispense", "Serahkan obat"],
    ],
  },
  {
    group: "lab_order",
    groupLabel: "Order lab",
    actions: [
      ["view", "Lihat order lab"],
      ["create", "Buat order lab"],
      ["update", "Ubah order lab"],
      ["receive", "Terima hasil lab"],
    ],
  },
  {
    group: "inventory",
    groupLabel: "Persediaan",
    actions: [
      ["view", "Lihat stok"],
      ["adjust", "Sesuaikan stok"],
      ["transfer", "Pindahkan stok"],
      ["count", "Stok opname"],
    ],
  },
  {
    group: "schedule",
    groupLabel: "Jadwal praktik",
    actions: [
      ["view", "Lihat jadwal praktik"],
      ["manage", "Atur jadwal praktik"],
      ["publish", "Terbitkan jadwal praktik"],
    ],
  },
  {
    group: "report",
    groupLabel: "Laporan",
    actions: [["view", "Lihat laporan operasional"]],
  },
  {
    group: "role",
    groupLabel: "Peran",
    actions: [
      ["view", "Lihat peran"],
      ["create", "Buat peran"],
      ["update", "Ubah peran"],
      ["assign", "Tetapkan peran ke pengguna"],
      ["delete", "Hapus peran"],
    ],
    coreActions: ["view"],
  },
  {
    group: "permission",
    groupLabel: "Permission",
    actions: [
      ["view", "Lihat permission"],
      ["assign", "Petakan permission ke peran"],
    ],
    coreActions: ["view"],
  },
  {
    group: "audit",
    groupLabel: "Audit",
    actions: [
      ["view", "Lihat log audit"],
      ["export", "Ekspor log audit"],
    ],
    coreActions: ["view"],
  },
  {
    group: "setting",
    groupLabel: "Pengaturan",
    actions: [
      ["view", "Lihat pengaturan"],
      ["update", "Ubah pengaturan"],
    ],
    coreActions: ["view"],
  },
  {
    group: "integration_api",
    groupLabel: "API integrasi",
    actions: [
      ["view", "Lihat kredensial API"],
      ["rotate_key", "Putar kunci API"],
      ["revoke", "Cabut kunci API"],
    ],
  },
  {
    group: "webhook",
    groupLabel: "Webhook",
    actions: [
      ["view", "Lihat webhook"],
      ["create", "Buat webhook"],
      ["delete", "Hapus webhook"],
    ],
  },
]

const ROLE_POOL = [
  "Dokter gigi",
  "Perawat gigi",
  "Resepsionis",
  "Admin klinik",
  "Apoteker",
  "Manajer operasional",
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export const permissions: Permission[] = SPECS.flatMap((spec) =>
  spec.actions.map(([action, label]) => {
    const key = `${spec.group}.${action}`
    const core = spec.coreActions?.includes(action) ?? false
    const h = hash(key)
    const bound = core ? 12 : h % 13 // 0..12
    const roleCount = bound === 0 ? 0 : 1 + (h % 3)
    return {
      key,
      group: spec.group,
      label,
      core,
      enabled: core ? true : h % 7 !== 0, // sebagian kecil non-core dimatikan
      boundTenants: bound,
      boundRoles: ROLE_POOL.slice(0, roleCount),
    }
  })
)

export const permissionGroups = SPECS.map((s) => ({
  key: s.group,
  label: s.groupLabel,
}))

export const permissionCount = permissions.length // 52
