import { toast } from "sonner"
import { IconKey, IconLogout, IconPower, IconUserPlus } from "@tabler/icons-react"

import { accountStatusLabel, itAccounts, type AccountStatus } from "@/data/it-accounts"
import { roleLabel } from "@/data/system-roles"
import { useDialogs } from "@/components/dialogs/dialogs"
import { relativeTime } from "@/lib/format"
import { cn } from "@/lib/utils"
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

function StatusBadge({ status }: { status: AccountStatus }) {
  const tone: Record<AccountStatus, string> = {
    ACTIVE:
      "border-emerald-600/30 text-emerald-700 dark:text-emerald-400",
    INACTIVE: "",
    SUSPENDED: "border-destructive/40 text-destructive",
    PENDING_APPROVAL:
      "border-amber-600/40 text-amber-700 dark:text-amber-500",
  }
  return (
    <Badge
      variant={status === "INACTIVE" ? "secondary" : "outline"}
      className={cn("font-mono", tone[status])}
    >
      {status}
    </Badge>
  )
}

export function TimAkunPage() {
  const dialogs = useDialogs()
  return (
    <PageBody>
      <PageHeader
        title="Akun"
        description="Akun anggota Tim IT dengan akses lintas tenant."
        actions={
          <Button
            onClick={() =>
              toast("Tambah akun", { description: "Form tambah akun menyusul." })
            }
          >
            <IconUserPlus />
            Tambah akun
          </Button>
        }
      />

      <TableCard title="Akun Tim IT" count={itAccounts.length}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="w-36">Peran</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead className="w-28 hidden text-right lg:table-cell">Sesi</TableHead>
              <TableHead className="w-32 hidden xl:table-cell">Terakhir aktif</TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itAccounts.map((a) => {
              const canToggle = a.status === "ACTIVE" || a.status === "INACTIVE"
              const inactive = a.status === "INACTIVE"
              return (
                <TableRow
                  key={a.id}
                  className={cn(a.status !== "ACTIVE" && "opacity-70")}
                >
                  <TableCell className="py-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {a.name}
                      {a.isSelf ? (
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[0.65rem]"
                        >
                          Anda
                        </Badge>
                      ) : null}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground md:hidden">
                      {a.email}
                    </span>
                  </TableCell>
                  <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground md:table-cell">
                    {a.email}
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="text-sm">{roleLabel(a.role)}</span>
                    <code className="ml-1.5 font-mono text-xs text-muted-foreground">
                      {a.role}
                    </code>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="flex flex-col gap-0.5">
                      <StatusBadge status={a.status} />
                      <span className="text-[0.65rem] text-muted-foreground">
                        {accountStatusLabel[a.status]}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden py-2 text-right font-mono text-xs tabular-nums lg:table-cell">
                    {a.activeSessions}
                  </TableCell>
                  <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground xl:table-cell">
                    {relativeTime(a.lastActiveAt)}
                  </TableCell>
                  <TableCell className="py-2">
                    <IconButtonGroup>
                      <IconButton
                        icon={IconKey}
                        label="Setel ulang password sementara"
                        onClick={() =>
                          dialogs.open({
                            kind: "account.tempPassword",
                            accountName: a.name,
                            email: a.email,
                          })
                        }
                      />
                      <IconButton
                        icon={IconLogout}
                        label={
                          a.activeSessions === 0
                            ? "Tidak ada sesi untuk dicabut"
                            : "Cabut sesi akun ini"
                        }
                        disabled={a.activeSessions === 0}
                        onClick={() =>
                          toast(`Sesi ${a.name} dicabut`, {
                            description: `${a.activeSessions} sesi diakhiri.`,
                          })
                        }
                      />
                      <IconButton
                        icon={IconPower}
                        label={
                          a.isSelf
                            ? "Tidak dapat menonaktifkan akun sendiri"
                            : !canToggle
                              ? `Akun ${accountStatusLabel[a.status].toLowerCase()} — selesaikan proses itu dulu`
                              : inactive
                                ? "Aktifkan akun"
                                : "Nonaktifkan akun"
                        }
                        disabled={a.isSelf || !canToggle}
                        onClick={() =>
                          toast(
                            inactive
                              ? `Akun ${a.name} diaktifkan`
                              : `Akun ${a.name} dinonaktifkan`
                          )
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
        Akun bertanda <span className="font-mono">[Anda]</span> tidak dapat
        dinonaktifkan sendiri sebagai proteksi. Peran mengacu ke TIM IT ›{" "}
        <span className="font-mono">Peran</span> — bukan enum tetap.
      </p>
    </PageBody>
  )
}
