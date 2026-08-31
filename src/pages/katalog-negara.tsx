import * as React from "react"
import { toast } from "sonner"
import { IconPower, IconTrash } from "@tabler/icons-react"

import { countries } from "@/data/countries"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton, IconButtonGroup } from "@/components/icon-button"
import { TableCard } from "@/components/table-card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function KatalogNegaraPage() {
  const [active, setActive] = React.useState<Record<string, boolean>>(
    () => Object.fromEntries(countries.map((c) => [c.iso2, c.active]))
  )

  return (
    <PageBody>
      <PageHeader
        title="Negara"
        description="Negara yang didukung untuk pendaftaran tenant."
      />

      <TableCard title="Negara" count={countries.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ISO2</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="w-24">Kode telp</TableHead>
              <TableHead className="w-28 text-right">Tenant</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.map((c) => {
              const on = active[c.iso2]
              return (
                <TableRow key={c.id} className={on ? "" : "opacity-60"}>
                  <TableCell className="py-2 font-mono text-xs font-medium">
                    {c.iso2}
                  </TableCell>
                  <TableCell className="py-2 text-sm">{c.name}</TableCell>
                  <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                    {c.dialCode}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                    {c.tenantCount}
                  </TableCell>
                  <TableCell className="py-2">
                    {on ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-600/30 font-mono text-emerald-700 dark:text-emerald-400"
                      >
                        AKTIF
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="font-mono text-muted-foreground"
                      >
                        NONAKTIF
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <IconButtonGroup>
                      <IconButton
                        icon={IconPower}
                        label={
                          !on
                            ? "Aktifkan negara"
                            : c.tenantCount > 0
                              ? "Tidak dapat dinonaktifkan — masih dipakai tenant"
                              : "Nonaktifkan negara"
                        }
                        disabled={on && c.tenantCount > 0}
                        onClick={() => {
                          setActive((s) => ({ ...s, [c.iso2]: !on }))
                          toast(
                            !on
                              ? `Negara ${c.iso2} diaktifkan`
                              : `Negara ${c.iso2} dinonaktifkan`
                          )
                        }}
                      />
                      <IconButton
                        icon={IconTrash}
                        label={
                          c.tenantCount > 0
                            ? "Tidak dapat dihapus — masih dipakai tenant"
                            : "Hapus negara"
                        }
                        variant="destructive"
                        disabled={c.tenantCount > 0}
                        onClick={() =>
                          toast.error("Konfirmasi hapus negara", {
                            description: `${c.iso2} — dialog menyusul di TAHAP 5.`,
                          })
                        }
                      />
                    </IconButtonGroup>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableCard>
    </PageBody>
  )
}
