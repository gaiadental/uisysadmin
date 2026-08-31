import * as React from "react"

import type { RouteName } from "@/router"
import { BerandaPage } from "@/pages/beranda"
import { TenantListPage } from "@/pages/tenant-list"
import { TenantDetailPage } from "@/pages/tenant-detail"
import { TenantCreatePage } from "@/pages/tenant-create"
import { KatalogPermissionPage } from "@/pages/katalog-permission"
import { KatalogKategoriPage } from "@/pages/katalog-kategori"
import { KatalogNegaraPage } from "@/pages/katalog-negara"
import { TimAkunPage } from "@/pages/tim-akun"
import { TimPeranPage } from "@/pages/tim-peran"
import { SistemEventPage } from "@/pages/sistem-event"
import { SistemSesiPage } from "@/pages/sistem-sesi"
import { SistemHousekeepingPage } from "@/pages/sistem-housekeeping"
import { SistemAuditPage } from "@/pages/sistem-audit"
import { SistemPengaturanPage } from "@/pages/sistem-pengaturan"

/**
 * Peta route → komponen halaman.
 * Entri yang belum diredesign masih memakai PlaceholderPage.
 */
export const pageRegistry: Record<RouteName, React.ComponentType> = {
  beranda: BerandaPage,
  "tenant.list": TenantListPage,
  "tenant.create": TenantCreatePage,
  "tenant.detail": TenantDetailPage,
  "katalog.permission": KatalogPermissionPage,
  "katalog.kategori": KatalogKategoriPage,
  "katalog.negara": KatalogNegaraPage,
  "tim.akun": TimAkunPage,
  "tim.peran": TimPeranPage,
  "sistem.event": SistemEventPage,
  "sistem.sesi": SistemSesiPage,
  "sistem.housekeeping": SistemHousekeepingPage,
  "sistem.audit": SistemAuditPage,
  "sistem.pengaturan": SistemPengaturanPage,
}
