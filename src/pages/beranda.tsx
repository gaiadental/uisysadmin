import { toast } from "sonner"
import {
  IconBuilding,
  IconAlertCircle,
  IconDevices,
  IconAlertTriangle,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react"

import { navigate } from "@/router"
import {
  activeTenantCount,
  incompleteSetupCount,
} from "@/data/tenants"
import { navCounts } from "@/data/nav"
import { activityRows, attentionRows } from "@/data/home"
import { relativeTime } from "@/lib/format"
import { PageBody, PageHeader } from "@/components/page-header"
import { MetricCard } from "@/components/metric-card"
import { IconButton, IconButtonGroup } from "@/components/icon-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function BerandaPage() {
  return (
    <PageBody>
      <PageHeader
        title="Dashboard"
        description="Ringkasan kondisi platform dan hal yang perlu ditangani."
        annotation="Titik masuk harian Tim IT — ringkasan lintas semua tenant. 'Perlu ditangani' menggabungkan event gagal dan setup yang belum tuntas supaya tidak perlu buka satu per satu."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tenant aktif"
          value={activeTenantCount}
          icon={IconBuilding}
          hint="dari 12 tenant terdaftar"
        />
        <MetricCard
          label="Setup belum tuntas"
          value={incompleteSetupCount}
          icon={IconAlertTriangle}
          hint="menunggu penyimpanan / fitur"
        />
        <MetricCard
          label="Event gagal"
          value={navCounts.eventFailed}
          icon={IconAlertCircle}
          tone="destructive"
          hint="perlu diproses ulang"
        />
        <MetricCard
          label="Sesi aktif"
          value={navCounts.activeSession}
          icon={IconDevices}
          hint="agregat seluruh tenant"
        />
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="flex-row items-center justify-between border-b bg-muted/40 py-3">
          <CardTitle className="text-sm">Perlu ditangani</CardTitle>
          <Badge variant="outline" className="font-mono">
            {attentionRows.length}
          </Badge>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Tenant</TableHead>
              <TableHead>Masalah</TableHead>
              <TableHead className="hidden md:table-cell">Detail</TableHead>
              <TableHead className="w-24">Sejak</TableHead>
              <TableHead className="w-20 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attentionRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="py-2 font-mono text-xs">
                  {row.tenantCode}
                </TableCell>
                <TableCell className="py-2">
                  <span className="flex items-center gap-2">
                    {row.kind === "EVENT_FAILED" ? (
                      <Badge
                        variant="destructive"
                        className="font-mono text-[0.7rem]"
                      >
                        EVENT
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-600/40 font-mono text-[0.7rem] text-amber-700 dark:text-amber-500"
                      >
                        SETUP
                      </Badge>
                    )}
                    {row.summary}
                  </span>
                </TableCell>
                <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground md:table-cell">
                  {row.detail}
                </TableCell>
                <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                  {relativeTime(row.since)}
                </TableCell>
                <TableCell className="py-2">
                  <IconButtonGroup>
                    {row.kind === "EVENT_FAILED" ? (
                      <IconButton
                        icon={IconRefresh}
                        label="Proses ulang event"
                        onClick={() =>
                          toast.success("Event dijadwalkan diproses ulang", {
                            description: `${row.detail} · ${row.tenantCode}`,
                          })
                        }
                      />
                    ) : null}
                    <IconButton
                      icon={IconEye}
                      label="Lihat detail tenant"
                      onClick={() => navigate(`/tenant/${row.tenantCode}`)}
                    />
                  </IconButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b bg-muted/40 py-3">
          <CardTitle className="text-sm">Log aktivitas terakhir</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Akun</TableHead>
              <TableHead>Tindakan</TableHead>
              <TableHead>Sasaran</TableHead>
              <TableHead className="w-24 text-right">Waktu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activityRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="py-2 text-xs">{row.actor}</TableCell>
                <TableCell className="py-2">
                  <code className="font-mono text-xs text-muted-foreground">
                    {row.action}
                  </code>
                </TableCell>
                <TableCell className="py-2 font-mono text-xs">
                  {row.target}
                </TableCell>
                <TableCell className="py-2 text-right font-mono text-xs text-muted-foreground">
                  {relativeTime(row.at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </PageBody>
  )
}
