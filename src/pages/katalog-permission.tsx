import * as React from "react"
import { toast } from "sonner"
import { IconLock, IconPower, IconSearch } from "@tabler/icons-react"

import {
  permissionGroups,
  permissions,
  type Permission,
} from "@/data/permissions"
import { useDialogs } from "@/components/dialogs/dialogs"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton } from "@/components/icon-button"
import { TableCard } from "@/components/table-card"
import { TablePagination } from "@/components/table-pagination"
import { usePagination } from "@/hooks/use-pagination"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function KatalogPermissionPage() {
  const dialogs = useDialogs()
  const [q, setQ] = React.useState("")
  const [group, setGroup] = React.useState("ALL")
  const [state, setState] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(permissions.map((p) => [p.key, p.enabled]))
  )

  const rows = permissions.filter((p) => {
    if (q && !`${p.key} ${p.label}`.toLowerCase().includes(q.toLowerCase()))
      return false
    if (group !== "ALL" && p.group !== group) return false
    return true
  })

  const pg = usePagination(rows, 12)
  const activeCount = permissions.filter((p) => state[p.key]).length

  function attemptToggle(p: Permission, nextOn: boolean) {
    // 6.3 — CORE atau masih terikat ke tenant → tampilan blokir.
    if (!nextOn && (p.core || p.boundTenants > 0)) {
      dialogs.open({ kind: "permission.rejectDisable", permission: p })
      return
    }
    setState((s) => ({ ...s, [p.key]: nextOn }))
    toast.success(
      nextOn ? `Akses ${p.key} diaktifkan` : `Akses ${p.key} dinonaktifkan`
    )
  }

  return (
    <PageBody>
      <PageHeader
        title="Permission"
        description="Kunci permission yang tersedia untuk dipetakan ke peran tenant."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari key atau nama permission"
            className="pl-8"
          />
        </div>
        <Select value={group} onValueChange={(v) => setGroup(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Kelompok" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua kelompok</SelectItem>
            {permissionGroups.map((g) => (
              <SelectItem key={g.key} value={g.key}>
                {g.label}{" "}
                <code className="font-mono text-xs text-muted-foreground">
                  {g.key}
                </code>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground sm:ml-auto">
          <span className="font-mono">{activeCount}</span> aktif /{" "}
          <span className="font-mono">{permissions.length}</span> permission
        </span>
      </div>

      <TableCard title="Daftar permission" count={rows.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="w-36 hidden md:table-cell">Kelompok</TableHead>
              <TableHead className="w-32 text-right">Tenant terikat</TableHead>
              <TableHead className="w-20 text-center">Akses</TableHead>
              <TableHead className="w-12 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.pageItems.map((p) => {
              const on = state[p.key]
              return (
                <TableRow key={p.key} className={on ? "" : "opacity-60"}>
                  <TableCell className="py-2">
                    <span className="flex items-center gap-2">
                      <code className="font-mono text-xs font-medium">
                        {p.key}
                      </code>
                      {p.core ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 font-mono text-[0.65rem]"
                        >
                          <IconLock className="size-2.5" />
                          CORE
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-sm">{p.label}</TableCell>
                  <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground md:table-cell">
                    {p.group}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {p.boundTenants > 0 ? (
                      <span className="font-mono text-xs tabular-nums">
                        {p.boundTenants}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-muted-foreground">
                        0
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex justify-center">
                      <Switch
                        checked={on}
                        disabled={p.core}
                        onCheckedChange={(v) => attemptToggle(p, v)}
                        aria-label={`Akses ${p.key}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex justify-end">
                      <IconButton
                        icon={IconPower}
                        label={
                          p.core
                            ? "Coba nonaktifkan (CORE — akan ditolak)"
                            : on
                              ? "Nonaktifkan akses"
                              : "Aktifkan akses"
                        }
                        onClick={() => attemptToggle(p, !on)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <TablePagination pagination={pg} unit="permission" />
      </TableCard>
    </PageBody>
  )
}
