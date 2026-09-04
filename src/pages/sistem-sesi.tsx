import { toast } from "sonner"
import { IconLogout } from "@tabler/icons-react"

import {
  activeSessionTotal,
  itAccountSessions,
  itSessionTotal,
  tenantSessionAggregates,
  tenantSessionTotal,
} from "@/data/sessions"
import { isoDateTime, relativeTime } from "@/lib/format"
import { useDialogs } from "@/components/dialogs/dialogs"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton } from "@/components/icon-button"
import { MetricCard } from "@/components/metric-card"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function SistemSesiPage() {
  const dialogs = useDialogs()

  return (
    <PageBody>
      <PageHeader
        title="Sesi aktif"
        description="Agregat sesi login per tenant dan sesi akun Tim IT. Sesi klinik hanya dihitung per tenant, bukan per pengguna."
        annotation="Dua cakupan berbeda: agregat sesi klinik per tenant (bukan per pengguna — batasan yang sengaja dijaga) vs sesi akun Tim IT sendiri secara rinci (perangkat, IP)."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Total sesi aktif" value={activeSessionTotal} />
        <MetricCard label="Sesi klinik (agregat)" value={tenantSessionTotal} />
        <MetricCard label="Sesi akun Tim IT" value={itSessionTotal} />
      </div>

      <Tabs defaultValue="tenant">
        <TabsList>
          <TabsTrigger value="tenant">
            Agregat sesi per tenant
            <Badge variant="secondary" className="ml-1.5 font-mono">
              {tenantSessionAggregates.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="akun">
            Sesi akun Tim IT
            <Badge variant="secondary" className="ml-1.5 font-mono">
              {itAccountSessions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenant" className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Agregat saja — tidak akan dikembangkan menjadi daftar sesi per
            pengguna klinik (device/IP/nama). Cabut-semua menunggu endpoint{" "}
            <code className="font-mono">
              DELETE /admin/tenants/{"{tenantId}"}/sessions
            </code>{" "}
            di auth-service.
          </p>
          <Card className="gap-0 overflow-x-auto py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-24 text-right">Sesi</TableHead>
                  <TableHead className="w-40 hidden sm:table-cell">Login terlama</TableHead>
                  <TableHead className="w-20 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantSessionAggregates.map((t) => (
                  <TableRow key={t.tenantCode}>
                    <TableCell className="py-2 font-mono text-xs font-medium">
                      {t.tenantCode}
                    </TableCell>
                    <TableCell className="py-2 text-sm">{t.tenantName}</TableCell>
                    <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                      {t.sessions}
                    </TableCell>
                    <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground sm:table-cell">
                      <span title={isoDateTime(t.oldestLoginAt)}>
                        {relativeTime(t.oldestLoginAt)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex justify-end">
                        <IconButton
                          icon={IconLogout}
                          label={`Cabut semua sesi tenant ${t.tenantCode}`}
                          onClick={() =>
                            dialogs.open({
                              kind: "session.revokeAll",
                              tenantCode: t.tenantCode,
                              tenantName: t.tenantName,
                              sessions: t.sessions,
                            })
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="akun">
          <Card className="gap-0 overflow-x-auto py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Akun</TableHead>
                  <TableHead>Perangkat</TableHead>
                  <TableHead className="w-32">IP</TableHead>
                  <TableHead className="w-32 hidden lg:table-cell">Mulai</TableHead>
                  <TableHead className="w-28">Terakhir</TableHead>
                  <TableHead className="w-20 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itAccountSessions.map((s, i) => (
                  <TableRow key={`${s.accountId}-${i}`}>
                    <TableCell className="py-2">
                      <span className="flex items-center gap-2 text-sm">
                        {s.accountName}
                        {s.current ? (
                          <Badge
                            variant="outline"
                            className="h-4 px-1 text-[0.65rem]"
                          >
                            sesi ini
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 font-mono text-xs">
                      {s.device}
                    </TableCell>
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                      {s.ip}
                    </TableCell>
                    <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground lg:table-cell">
                      {relativeTime(s.startedAt)}
                    </TableCell>
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                      {relativeTime(s.lastSeenAt)}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex justify-end">
                        <IconButton
                          icon={IconLogout}
                          label={
                            s.current
                              ? "Tidak dapat mencabut sesi yang sedang dipakai"
                              : `Cabut sesi ${s.accountName}`
                          }
                          disabled={s.current}
                          onClick={() =>
                            toast(`Sesi ${s.accountName} dicabut`, {
                              description: `${s.device} · ${s.ip}`,
                            })
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </PageBody>
  )
}
