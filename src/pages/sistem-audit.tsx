import * as React from "react"
import { toast } from "sonner"
import { IconDownload, IconEye, IconSearch } from "@tabler/icons-react"

import { auditActors, auditLogs } from "@/data/audit-logs"
import { isoDateTime, relativeTime } from "@/lib/format"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton } from "@/components/icon-button"
import { TableCard } from "@/components/table-card"
import { TablePagination } from "@/components/table-pagination"
import { usePagination } from "@/hooks/use-pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

export function SistemAuditPage() {
  const [q, setQ] = React.useState("")
  const [actor, setActor] = React.useState("ALL")
  const [outcome, setOutcome] = React.useState("ALL")

  const rows = auditLogs.filter((l) => {
    if (
      q &&
      !`${l.action} ${l.target} ${l.note ?? ""}`
        .toLowerCase()
        .includes(q.toLowerCase())
    )
      return false
    if (actor !== "ALL" && l.actor !== actor) return false
    if (outcome !== "ALL" && l.outcome !== outcome) return false
    return true
  })

  const pg = usePagination(rows, 10)

  return (
    <PageBody>
      <PageHeader
        title="Log audit"
        description="Catatan tindakan Tim IT pada konsol."
        annotation="Jejak siapa melakukan apa, kapan, berhasil atau ditolak — dipakai untuk investigasi dan kepatuhan. Entri REJECTED artinya sistem menolak tindakan (mis. coba hapus negara yang masih dipakai)."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Ekspor log audit dimulai", {
                description: `${rows.length} entri sesuai filter · permission audit.export`,
              })
            }
          >
            <IconDownload />
            Ekspor
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari aksi, target, atau catatan"
            className="pl-8"
          />
        </div>
        <Select value={actor} onValueChange={(v) => setActor(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Aktor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua aktor</SelectItem>
            {auditActors.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={outcome} onValueChange={(v) => setOutcome(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Hasil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua hasil</SelectItem>
            <SelectItem value="SUCCESS">SUCCESS</SelectItem>
            <SelectItem value="REJECTED">REJECTED</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TableCard title="Entri audit" count={rows.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Waktu</TableHead>
              <TableHead className="w-32">Aktor</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="w-24">Hasil</TableHead>
              <TableHead className="w-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.pageItems.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                  <span title={isoDateTime(l.at)}>{relativeTime(l.at)}</span>
                </TableCell>
                <TableCell className="py-2 text-sm">{l.actor}</TableCell>
                <TableCell className="py-2">
                  <code className="font-mono text-xs">{l.action}</code>
                  {l.note ? (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {l.note}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="py-2 font-mono text-xs">
                  {l.target}
                </TableCell>
                <TableCell className="py-2">
                  {l.outcome === "SUCCESS" ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-600/30 font-mono text-[0.7rem] text-emerald-700 dark:text-emerald-400"
                    >
                      SUCCESS
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 font-mono text-[0.7rem] text-destructive"
                    >
                      REJECTED
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex justify-end">
                    <IconButton
                      icon={IconEye}
                      label="Lihat detail entri"
                      onClick={() =>
                        toast("Detail entri audit", { description: l.id })
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Tidak ada entri yang cocok.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination pagination={pg} unit="entri" />
      </TableCard>
    </PageBody>
  )
}
