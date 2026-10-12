/**
 * Page titles and breadcrumbs for every route key (ARCH-FE-001 D10). Copy is
 * Indonesian (C-09) and a proposed default until FE-OQ-22 is answered.
 *
 * The keys are the path-route keys of `app/router.tsx`. A module TODO adds its
 * keys here and its routes to the router table. The router table must have
 * one entry for each key here (type-checked).
 */

export type RouteMeta = {
  /** Judul di topbar & <PageHeader>. */
  title: string
  /** Deskripsi singkat di bawah judul halaman. */
  description?: string
  /** Jejak remah untuk topbar (kelompok › halaman). */
  breadcrumb: string[]
}

export const routeMeta = {
  dashboard: {
    title: "Dashboard",
    description: "Ringkasan jumlah data master pada platform.",
    breadcrumb: ["Dashboard"],
  },
  "auth.login": {
    title: "Masuk",
    description: "Masuk ke akun SysAdmin GAIA Dental Clinic Anda.",
    breadcrumb: ["Masuk"],
  },
  "auth.forgot-password": {
    title: "Lupa password",
    description: "Minta tautan atur ulang password.",
    breadcrumb: ["Masuk", "Lupa password"],
  },
  "auth.reset-password": {
    title: "Atur ulang password",
    description: "Tetapkan password baru dengan tautan dari e-mail.",
    breadcrumb: ["Masuk", "Atur ulang password"],
  },
  "auth.change-password": {
    title: "Ubah password",
    description: "Ubah password akun Anda untuk melanjutkan.",
    breadcrumb: ["Akun", "Ubah password"],
  },
  "tenant.list": {
    title: "Daftar tenant",
    description:
      "Seluruh tenant klinik pada platform, lintas negara dan kategori.",
    breadcrumb: ["Tenant", "Daftar tenant"],
  },
  "tenant.new": {
    title: "Tambah tenant",
    description: "Buat tenant baru melalui wizard berlangkah.",
    breadcrumb: ["Tenant", "Tambah tenant"],
  },
  "tenant.detail": {
    title: "Detail tenant",
    description: "Ringkasan dan profil satu tenant.",
    breadcrumb: ["Tenant", "Detail"],
  },
  "tenant.permissions": {
    title: "Permission tenant",
    description: "Permission yang boleh dipakai satu tenant.",
    breadcrumb: ["Tenant", "Detail", "Permissions"],
  },
  "catalog.permission": {
    title: "Permission",
    description:
      "Kunci permission yang tersedia untuk dipetakan ke peran tenant.",
    breadcrumb: ["Katalog", "Permission"],
  },
  "catalog.tenant-categories": {
    title: "Kategori tenant",
    description: "Klasifikasi jenis praktik klinik.",
    breadcrumb: ["Katalog", "Kategori tenant"],
  },
  "catalog.countries": {
    title: "Negara",
    description: "Negara yang didukung untuk pendaftaran tenant.",
    breadcrumb: ["Katalog", "Negara"],
  },
  "team.users": {
    title: "Akun",
    description: "Akun anggota Tim IT dengan akses lintas tenant.",
    breadcrumb: ["Tim IT", "Akun"],
  },
  "team.user-detail": {
    title: "Detail akun",
    description: "Detail akun Tim IT dan sesi aktifnya.",
    breadcrumb: ["Tim IT", "Akun", "Detail"],
  },
  "team.roles": {
    title: "Peran",
    description: "Peran Tim IT dan pemetaan permission per peran.",
    breadcrumb: ["Tim IT", "Peran"],
  },
  "team.role-detail": {
    title: "Detail peran",
    description: "Detail peran Tim IT dan daftar permission-nya.",
    breadcrumb: ["Tim IT", "Peran", "Detail"],
  },
  "account.sessions": {
    title: "Sesi saya",
    description: "Perangkat yang sedang masuk ke akun Anda.",
    breadcrumb: ["Akun", "Sesi saya"],
  },
} satisfies Record<string, RouteMeta>

/** The route keys of this app's router table. */
export type RouteKey = keyof typeof routeMeta
