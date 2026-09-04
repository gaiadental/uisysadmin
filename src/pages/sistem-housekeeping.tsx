import { toast } from "sonner"
import { IconTrash, IconX } from "@tabler/icons-react"

import {
  deletionQueue,
  schedulerRuns,
  type QueueStatus,
  type SchedulerRunOutcome,
} from "@/data/housekeeping"
import { isoDate, isoDateTime, relativeTime } from "@/lib/format"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton, IconButtonGroup } from "@/components/icon-button"
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

function QueueStatusBadge({ status }: { status: QueueStatus }) {
  return status === "SCHEDULED" ? (
    <Badge variant="outline" className="font-mono text-[0.7rem]">
      SCHEDULED
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-amber-600/40 font-mono text-[0.7rem] text-amber-700 dark:text-amber-500"
    >
      ON_HOLD
    </Badge>
  )
}

function OutcomeBadge({ outcome }: { outcome: SchedulerRunOutcome }) {
  const map = {
    OK: "border-emerald-600/30 text-emerald-700 dark:text-emerald-400",
    PARTIAL: "border-amber-600/40 text-amber-700 dark:text-amber-500",
    FAILED: "border-destructive/40 text-destructive",
  } as const
  return (
    <Badge variant="outline" className={`font-mono text-[0.7rem] ${map[outcome]}`}>
      {outcome}
    </Badge>
  )
}

export function SistemHousekeepingPage() {
  return (
    <PageBody>
      <PageHeader
        title="Housekeeping"
        description="Antrean penghapusan permanen terjadwal dan riwayat scheduler."
        annotation="Tenant nonaktif >180 hari masuk antrean dan dihapus permanen otomatis oleh scheduler terjadwal — bukan dipicu manual. Riwayat tiap run scheduler ada di tab kedua."
      />

      <Tabs defaultValue="antrean">
        <TabsList>
          <TabsTrigger value="antrean">
            Antrean hapus permanen
            <Badge variant="secondary" className="ml-1.5 font-mono">
              {deletionQueue.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="riwayat">
            Riwayat scheduler
            <Badge variant="secondary" className="ml-1.5 font-mono">
              {schedulerRuns.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="antrean">
          <Card className="gap-0 overflow-x-auto py-0">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Tipe</TableHead>
              <TableHead>Referensi</TableHead>
              <TableHead>Alasan</TableHead>
              <TableHead className="hidden lg:table-cell">Diminta</TableHead>
              <TableHead className="w-28">Jadwal</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-20 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deletionQueue.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="py-2 font-mono text-xs">
                  {d.targetType}
                </TableCell>
                <TableCell className="py-2">
                  <code className="font-mono text-xs font-medium">
                    {d.targetRef}
                  </code>
                </TableCell>
                <TableCell className="py-2 text-sm text-muted-foreground">
                  {d.reason}
                </TableCell>
                <TableCell className="hidden py-2 text-xs text-muted-foreground lg:table-cell">
                  {d.requestedBy}
                  <span className="ml-1.5 font-mono">
                    {relativeTime(d.requestedAt)}
                  </span>
                </TableCell>
                <TableCell className="py-2 font-mono text-xs">
                  <span title={isoDateTime(d.runAt)}>{isoDate(d.runAt)}</span>
                </TableCell>
                <TableCell className="py-2">
                  <QueueStatusBadge status={d.status} />
                </TableCell>
                <TableCell className="py-2">
                  <IconButtonGroup>
                    <IconButton
                      icon={IconX}
                      label="Batalkan dari antrean"
                      onClick={() =>
                        toast(`Dibatalkan dari antrean`, {
                          description: `${d.targetType} ${d.targetRef}`,
                        })
                      }
                    />
                    <IconButton
                      icon={IconTrash}
                      label="Jalankan penghapusan sekarang"
                      variant="destructive"
                      disabled={d.status === "ON_HOLD"}
                      onClick={() =>
                        toast.error("Jalankan penghapusan", {
                          description: `${d.targetRef} — dialog konfirmasi menyusul di TAHAP 5.`,
                        })
                      }
                    />
                  </IconButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat">
          <Card className="gap-0 overflow-x-auto py-0">
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead className="w-32">Mulai</TableHead>
              <TableHead className="w-24 text-right">Durasi</TableHead>
              <TableHead className="w-24 text-right">Item</TableHead>
              <TableHead className="w-20 text-right">Gagal</TableHead>
              <TableHead className="w-24">Hasil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedulerRuns.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="py-2">
                  <code className="font-mono text-xs font-medium">{r.job}</code>
                </TableCell>
                <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                  <span title={isoDateTime(r.startedAt)}>
                    {relativeTime(r.startedAt)}
                  </span>
                </TableCell>
                <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                  {(r.durationMs / 1000).toFixed(1)}s
                </TableCell>
                <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                  {r.itemsProcessed.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                  {r.itemsFailed > 0 ? (
                    <span className="text-destructive">{r.itemsFailed}</span>
                  ) : (
                    "0"
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <OutcomeBadge outcome={r.outcome} />
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
