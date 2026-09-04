import * as React from "react"
import { toast } from "sonner"
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"

import {
  tenantCategories as seedCategories,
  type TenantCategory,
} from "@/data/tenant-categories"
import { useDialogs } from "@/components/dialogs/dialogs"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton, IconButtonGroup } from "@/components/icon-button"
import { TableCard } from "@/components/table-card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function KatalogKategoriPage() {
  const dialogs = useDialogs()
  const [categories, setCategories] =
    React.useState<TenantCategory[]>(seedCategories)

  return (
    <PageBody>
      <PageHeader
        title="Kategori tenant"
        description="Klasifikasi jenis praktik klinik."
        annotation="Dipakai saat mendaftarkan tenant baru dan sebagai filter di Daftar tenant. Kategori yang masih dipakai tenant tidak bisa dihapus."
        actions={
          <Button
            onClick={() =>
              dialogs.open({
                kind: "category.create",
                existingKeys: categories.map((c) => c.key),
                onCreate: (category) =>
                  setCategories((cs) => [...cs, category]),
              })
            }
          >
            <IconPlus />
            Tambah kategori
          </Button>
        }
      />

      <TableCard title="Kategori" count={categories.length}>
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
            {categories.map((c) => (
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
