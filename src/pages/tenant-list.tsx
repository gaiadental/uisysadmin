import * as React from "react"
import { toast } from "sonner"
import { IconEye, IconInfoCircle, IconPlus, IconPower, IconSearch } from "@tabler/icons-react"

import { navigate } from "@/router"
import { useDialogs } from "@/components/dialogs/dialogs"
import { tenants } from "@/data/tenants"
import { tenantCategories } from "@/data/tenant-categories"
import { isoDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton, IconButtonGroup } from "@/components/icon-button"
import { TablePagination } from "@/components/table-pagination"
import { usePagination } from "@/hooks/use-pagination"
import {
  BranchCount,
  TenantStatusBadge,
  categoryLabel,
  countryName,
} from "@/components/tenant-bits"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TenantListPage() {
  const dialogs = useDialogs()
  const [q, setQ] = React.useState("")
  const [category, setCategory] = React.useState("ALL")
  const [status, setStatus] = React.useState("ALL")

  const rows = tenants.filter((t) => {
    const text = `${t.code} ${t.name} ${t.id}`.toLowerCase()
    if (q && !text.includes(q.toLowerCase())) return false
    if (category !== "ALL" && t.categoryKey !== category) return false
    if (status !== "ALL" && t.status !== status) return false
    return true
  })

  const pg = usePagination(rows, 10)

  return (
    <PageBody>
      <PageHeader
        title="Daftar tenant"
        description="Seluruh tenant klinik pada platform, lintas negara dan kategori."
        annotation="Nonaktifkan memulai hitung mundur housekeeping 180 hari. Sengaja tidak ada tombol hapus manual di sini — lihat catatan di bawah tabel."
        actions={
          <Button onClick={() => navigate("/tenant/tambah")}>
            <IconPlus />
            Tambah tenant
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari kode, nama, atau UUID"
            className="pl-8"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua kategori</SelectItem>
            {tenantCategories.map((c) => (
              <SelectItem key={c.key} value={c.key}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua status</SelectItem>
            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
            <SelectItem value="INACTIVE">INACTIVE</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          <span className="font-mono">{rows.length}</span> / {tenants.length}{" "}
          tenant
        </span>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <IconInfoCircle className="mt-0.5 size-3.5 shrink-0" />
        Penghapusan tenant bersifat otomatis: tenant berstatus{" "}
        <code className="font-mono">INACTIVE</code> lebih dari 180 hari dihapus
        permanen oleh scheduler housekeeping. Tidak ada aksi hapus manual di
        sini.
      </p>

      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="w-36 hidden lg:table-cell">Kategori</TableHead>
              <TableHead className="w-36 hidden md:table-cell">Negara</TableHead>
              <TableHead className="w-20 text-right">Cabang</TableHead>
              <TableHead className="w-24 text-right">Pengguna</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-28 hidden xl:table-cell">Dibuat</TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.pageItems.map((t) => {
              const inactive = t.status === "INACTIVE"
              return (
                <TableRow
                  key={t.id}
                  className={cn(inactive && "opacity-55")}
                >
                  <TableCell className="py-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/tenant/${t.code}`)}
                      className="font-mono text-xs font-medium hover:underline"
                    >
                      {t.code}
                    </button>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="flex items-center gap-2">
                      {t.name}
                      {t.registrationState !== "COMPLETED" ? (
                        <Badge
                          variant="outline"
                          className="border-amber-600/40 font-mono text-[0.65rem] text-amber-700 dark:text-amber-500"
                        >
                          {t.registrationState}
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="hidden py-2 text-muted-foreground lg:table-cell">
                    {categoryLabel(t.categoryKey)}
                  </TableCell>
                  <TableCell className="hidden py-2 md:table-cell">
                    <span className="font-mono text-xs">{t.countryIso2}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {countryName(t.countryIso2)}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    <BranchCount count={t.branchCount} />
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                    {t.userCount}
                  </TableCell>
                  <TableCell className="py-2">
                    <TenantStatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground xl:table-cell">
                    {isoDate(t.createdAt)}
                  </TableCell>
                  <TableCell className="py-2">
                    <IconButtonGroup>
                      <IconButton
                        icon={IconPower}
                        label={
                          inactive ? "Aktifkan tenant" : "Nonaktifkan tenant"
                        }
                        onClick={() =>
                          inactive
                            ? toast.success(`Tenant ${t.code} diaktifkan`)
                            : dialogs.open({ kind: "tenant.deactivate", tenant: t })
                        }
                      />
                      <IconButton
                        icon={IconEye}
                        label="Lihat detail"
                        onClick={() => navigate(`/tenant/${t.code}`)}
                      />
                    </IconButtonGroup>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Tidak ada tenant yang cocok dengan filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination pagination={pg} unit="tenant" />
      </Card>
    </PageBody>
  )
}
