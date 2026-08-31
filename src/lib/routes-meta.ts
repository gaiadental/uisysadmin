import type { RouteName } from "@/router"

export type RouteMeta = {
  /** Judul di topbar & <PageHeader>. */
  title: string
  /** Deskripsi singkat di bawah judul halaman. */
  description?: string
  /** Jejak remah untuk topbar (kelompok › halaman). */
  breadcrumb: string[]
}

export const routeMeta: Record<RouteName, RouteMeta> = {
  beranda: {
    title: "Dashboard",
    description: "Ringkasan kondisi platform dan hal yang perlu ditangani.",
    breadcrumb: ["Dashboard"],
  },
  "tenant.list": {
    title: "Daftar tenant",
    description:
      "Seluruh tenant klinik pada platform, lintas negara dan kategori.",
    breadcrumb: ["Tenant", "Daftar tenant"],
  },
  "tenant.create": {
    title: "Tambah tenant",
    description: "Buat tenant baru melalui wizard berlangkah.",
    breadcrumb: ["Tenant", "Tambah tenant"],
  },
  "tenant.detail": {
    title: "Detail tenant",
    description: "Kondisi sistem, profil, dan fitur aktif untuk satu tenant.",
    breadcrumb: ["Tenant", "Detail"],
  },
  "katalog.permission": {
    title: "Permission",
    description:
      "Kunci permission yang tersedia untuk dipetakan ke peran tenant.",
    breadcrumb: ["Katalog", "Permission"],
  },
  "katalog.kategori": {
    title: "Kategori tenant",
    description: "Klasifikasi jenis praktik klinik.",
    breadcrumb: ["Katalog", "Kategori tenant"],
  },
  "katalog.negara": {
    title: "Negara",
    description: "Negara yang didukung untuk pendaftaran tenant.",
    breadcrumb: ["Katalog", "Negara"],
  },
  "tim.akun": {
    title: "Akun",
    description: "Akun anggota Tim IT dengan akses lintas tenant.",
    breadcrumb: ["Tim IT", "Akun"],
  },
  "tim.peran": {
    title: "Peran",
    description: "Peran Tim IT dan pemetaan permission per peran.",
    breadcrumb: ["Tim IT", "Peran"],
  },
  "sistem.event": {
    title: "Event",
    description: "Antrean event domain beserta status pemrosesan.",
    breadcrumb: ["Sistem", "Event"],
  },
  "sistem.sesi": {
    title: "Sesi aktif",
    description: "Agregat sesi login per tenant dan sesi akun Tim IT.",
    breadcrumb: ["Sistem", "Sesi aktif"],
  },
  "sistem.housekeeping": {
    title: "Housekeeping",
    description: "Antrean penghapusan terjadwal dan riwayat scheduler.",
    breadcrumb: ["Sistem", "Housekeeping"],
  },
  "sistem.audit": {
    title: "Log audit",
    description: "Catatan tindakan Tim IT pada konsol.",
    breadcrumb: ["Sistem", "Log audit"],
  },
  "sistem.pengaturan": {
    title: "Pengaturan platform",
    description: "Masa berlaku token, batas sesi, dan retensi housekeeping.",
    breadcrumb: ["Sistem", "Pengaturan platform"],
  },
}
