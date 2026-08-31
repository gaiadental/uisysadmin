import * as React from "react"
import { toast } from "sonner"
import { IconEye, IconRefresh } from "@tabler/icons-react"

import { domainEvents, type EventStatus } from "@/data/events"
import { isoDateTime, relativeTime } from "@/lib/format"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton, IconButtonGroup } from "@/components/icon-button"
import { TableCard } from "@/components/table-card"
import { Badge } from "@/components/ui/badge"
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

function EventStatusBadge({ status }: { status: EventStatus }) {
  if (status === "FAILED")
    return (
      <Badge variant="destructive" className="font-mono text-[0.7rem]">
        FAILED
      </Badge>
    )
  if (status === "PENDING")
    return (
      <Badge
        variant="outline"
        className="border-amber-600/40 font-mono text-[0.7rem] text-amber-700 dark:text-amber-500"
      >
        PENDING
      </Badge>
    )
  return (
    <Badge
      variant="outline"
      className="border-emerald-600/30 font-mono text-[0.7rem] text-emerald-700 dark:text-emerald-400"
    >
      PROCESSED
    </Badge>
  )
}

export function SistemEventPage() {
  const [status, setStatus] = React.useState("ALL")
  const rows = domainEvents.filter(
    (e) => status === "ALL" || e.status === status
  )
  const failed = domainEvents.filter((e) => e.status === "FAILED").length

  return (
    <PageBody>
      <PageHeader
        title="Event"
        description="Antrean event domain beserta status pemrosesan."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(v) => setStatus(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua status</SelectItem>
            <SelectItem value="FAILED">FAILED</SelectItem>
            <SelectItem value="PENDING">PENDING</SelectItem>
            <SelectItem value="PROCESSED">PROCESSED</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          <span className="font-mono text-destructive">{failed}</span> gagal /{" "}
          <span className="font-mono">{domainEvents.length}</span> event
        </span>
      </div>

      <TableCard title="Event domain" count={rows.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead className="w-28">Tenant</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-20 text-right">Percobaan</TableHead>
              <TableHead className="hidden xl:table-cell">Galat terakhir</TableHead>
              <TableHead className="w-28">Terjadi</TableHead>
              <TableHead className="w-20 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="py-2">
                  <code className="font-mono text-xs font-medium">{e.name}</code>
                </TableCell>
                <TableCell className="py-2 font-mono text-xs">
                  {e.tenantCode}
                </TableCell>
                <TableCell className="py-2">
                  <EventStatusBadge status={e.status} />
                </TableCell>
                <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                  {e.attempts}
                </TableCell>
                <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground xl:table-cell">
                  {e.lastError ?? "—"}
                </TableCell>
                <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                  <span title={isoDateTime(e.occurredAt)}>
                    {relativeTime(e.occurredAt)}
                  </span>
                </TableCell>
                <TableCell className="py-2">
                  <IconButtonGroup>
                    <IconButton
                      icon={IconRefresh}
                      label="Proses ulang event"
                      disabled={e.status !== "FAILED"}
                      onClick={() =>
                        toast.success("Event dijadwalkan diproses ulang", {
                          description: `${e.name} · ${e.tenantCode} · percobaan ke-${
                            e.attempts + 1
                          }`,
                        })
                      }
                    />
                    <IconButton
                      icon={IconEye}
                      label="Lihat payload event"
                      onClick={() =>
                        toast("Detail event", {
                          description: `${e.id}`,
                        })
                      }
                    />
                  </IconButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </PageBody>
  )
}
