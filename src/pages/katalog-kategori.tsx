import { toast } from "sonner"
import { IconPencil, IconTrash } from "@tabler/icons-react"

import { tenantCategories } from "@/data/tenant-categories"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton, IconButtonGroup } from "@/components/icon-button"
import { TableCard } from "@/components/table-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function KatalogKategoriPage() {
  return (
    <PageBody>
      <PageHeader
        title="Kategori tenant"
        description="Klasifikasi jenis praktik klinik."
      />

      <TableCard title="Kategori" count={tenantCategories.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-32 text-right">Tenant</TableHead>
              <TableHead className="w-20 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenantCategories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="py-2">
                  <code className="font-mono text-xs font-medium">{c.key}</code>
                </TableCell>
                <TableCell className="py-2 text-sm">{c.label}</TableCell>
                <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                  {c.tenantCount}
                </TableCell>
                <TableCell className="py-2">
                  <IconButtonGroup>
                    <IconButton
                      icon={IconPencil}
                      label="Ubah label kategori"
                      onClick={() =>
                        toast("Ubah kategori", {
                          description: `${c.key} — form ubah menyusul.`,
                        })
                      }
                    />
                    <IconButton
                      icon={IconTrash}
                      label={
                        c.tenantCount > 0
                          ? "Tidak dapat dihapus — masih dipakai tenant"
                          : "Hapus kategori"
                      }
                      variant="destructive"
                      disabled={c.tenantCount > 0}
                      onClick={() =>
                        toast.error("Konfirmasi hapus kategori", {
                          description: `${c.key} — dialog menyusul di TAHAP 5.`,
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
      <p className="text-xs text-muted-foreground">
        Kategori yang masih dipakai tenant tidak dapat dihapus.
      </p>
    </PageBody>
  )
}
