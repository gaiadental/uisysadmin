export type FeatureFlag = {
  key: string // font-mono, mis. "appointment.scheduling"
  label: string
  description: string
  core: boolean // CORE = terkunci, selalu aktif
  enabled: boolean
}

export type FeatureModule = {
  key: string // mis. "CLINICAL"
  label: string
  flags: FeatureFlag[]
}

/**
 * Modul fitur yang dapat diaktifkan per tenant.
 * Dipakai di Detail Tenant › Tab "Fitur aktif" dan wizard Tambah tenant › Langkah 3.
 * Checkbox pada flag `core` selalu disabled + checked.
 */
export const featureModules: FeatureModule[] = [
  {
    key: "CORE",
    label: "Inti sistem",
    flags: [
      {
        key: "tenant.identity",
        label: "Identitas tenant",
        description: "Kode, nama, kategori, dan negara tenant.",
        core: true,
        enabled: true,
      },
      {
        key: "auth.session",
        label: "Sesi & autentikasi",
        description: "Login pengguna klinik dan manajemen sesi.",
        core: true,
        enabled: true,
      },
      {
        key: "audit.trail",
        label: "Jejak audit",
        description: "Pencatatan aktivitas pada tenant.",
        core: true,
        enabled: true,
      },
    ],
  },
  {
    key: "CLINICAL",
    label: "Klinis",
    flags: [
      {
        key: "appointment.scheduling",
        label: "Penjadwalan janji temu",
        description: "Kalender dan antrean kunjungan pasien.",
        core: false,
        enabled: true,
      },
      {
        key: "medical.record",
        label: "Rekam medis gigi",
        description: "Odontogram dan riwayat perawatan.",
        core: false,
        enabled: true,
      },
      {
        key: "treatment.plan",
        label: "Rencana perawatan",
        description: "Tahapan perawatan multi-kunjungan.",
        core: false,
        enabled: false,
      },
    ],
  },
  {
    key: "OPERATIONS",
    label: "Operasional",
    flags: [
      {
        key: "inventory.stock",
        label: "Stok & bahan habis pakai",
        description: "Pemantauan persediaan bahan klinik.",
        core: false,
        enabled: true,
      },
      {
        key: "lab.order",
        label: "Order laboratorium",
        description: "Pengiriman dan pelacakan kerja lab gigi.",
        core: false,
        enabled: false,
      },
    ],
  },
  {
    key: "INTEGRATION",
    label: "Integrasi",
    flags: [
      {
        key: "api.public",
        label: "Akses API publik",
        description: "Token API untuk sistem pihak ketiga tenant.",
        core: false,
        enabled: false,
      },
      {
        key: "webhook.outbound",
        label: "Webhook keluar",
        description: "Kirim event domain ke endpoint tenant.",
        core: false,
        enabled: false,
      },
    ],
  },
]

export const optionalFeatureCount = featureModules
  .flatMap((m) => m.flags)
  .filter((f) => !f.core).length
