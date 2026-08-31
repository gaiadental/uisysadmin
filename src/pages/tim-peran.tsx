import * as React from "react"
import { toast } from "sonner"
import { IconLock, IconPlus, IconShieldCog, IconTrash } from "@tabler/icons-react"

import { systemRoles as seedRoles, type SystemRole } from "@/data/system-roles"
import { itAccounts } from "@/data/it-accounts"
import { useDialogs } from "@/components/dialogs/dialogs"
import { PageBody, PageHeader } from "@/components/page-header"
import { IconButton, IconButtonGroup } from "@/components/icon-button"
import { TableCard } from "@/components/table-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TimPeranPage() {
  const dialogs = useDialogs()
  const [roles, setRoles] = React.useState<SystemRole[]>(seedRoles)

  const memberCount = (roleKey: string) =>
    itAccounts.filter((a) => a.role === roleKey).length

  return (
    <PageBody>
      <PageHeader
        title="Peran"
        description="Peran Tim IT dan pemetaan permission per peran — menggantikan enum peran tetap."
        actions={
          <Button
            onClick={() =>
              toast("Tambah peran", {
                description: "Form buat peran baru menyusul.",
              })
            }
          >
            <IconPlus />
            Tambah peran
          </Button>
        }
      />

      <TableCard title="Daftar peran" count={roles.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Key</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead className="w-24 text-right">Anggota</TableHead>
              <TableHead className="w-28 text-right">Izin</TableHead>
              <TableHead className="w-24">Tipe</TableHead>
              <TableHead className="w-20 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((r) => {
              const members = memberCount(r.key)
              return (
                <TableRow key={r.id}>
                  <TableCell className="py-2">
                    <code className="font-mono text-xs font-medium">
                      {r.key}
                    </code>
                  </TableCell>
                  <TableCell className="py-2">
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                    {members}
                  </TableCell>
                  <TableCell className="py-2 text-right font-mono text-xs tabular-nums">
                    {r.permissionKeys.length}
                  </TableCell>
                  <TableCell className="py-2">
                    {r.isSystem ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 font-mono text-[0.65rem]"
                      >
                        <IconLock className="size-2.5" />
                        Bawaan
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-mono text-[0.65rem]">
                        Kustom
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2">
                    <IconButtonGroup>
                      <IconButton
                        icon={IconShieldCog}
                        label="Kelola izin peran"
                        onClick={() =>
                          dialogs.open({
                            kind: "role.permissions",
                            role: r,
                            onSave: (permissionKeys) =>
                              setRoles((rs) =>
                                rs.map((x) =>
                                  x.id === r.id ? { ...x, permissionKeys } : x
                                )
                              ),
                          })
                        }
                      />
                      <IconButton
                        icon={IconTrash}
                        label={
                          r.isSystem
                            ? "Peran bawaan tidak dapat dihapus"
                            : members > 0
                              ? "Tidak dapat dihapus — masih ada anggota"
                              : "Hapus peran"
                        }
                        variant="destructive"
                        disabled={r.isSystem || members > 0}
                        onClick={() =>
                          toast.error("Konfirmasi hapus peran", {
                            description: `${r.key} — dialog menyusul.`,
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
      <p className="text-xs text-muted-foreground">
        Peran bertanda <span className="font-mono">Bawaan</span> (OWNER,
        OPERATOR, VIEWER) tidak dapat dihapus — hanya izinnya yang bisa diubah.
        Akun Tim IT di TIM IT › Akun memakai <span className="font-mono">key</span>{" "}
        peran ini, bukan enum tetap.
      </p>
    </PageBody>
  )
}
