import * as React from "react"
import { toast } from "sonner"
import {
  IconCheck,
  IconCopy,
  IconLoader2,
  IconLock,
  IconLogout,
  IconPower,
  IconRocket,
  IconAlertOctagon,
  IconTrash,
  IconAlertTriangle,
  IconX,
} from "@tabler/icons-react"

import type { Tenant } from "@/data/tenants"
import type { Permission } from "@/data/permissions"
import { permissionGroups, permissions } from "@/data/permissions"
import type { SystemRole } from "@/data/system-roles"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/* ------------------------------------------------------------------ */
/* Tipe permintaan dialog                                             */
/* ------------------------------------------------------------------ */

type DialogRequest =
  | { kind: "tenant.deactivate"; tenant: Tenant; onConfirm?: () => void }
  | { kind: "tenant.delete"; tenant: Tenant; onConfirm?: () => void }
  | {
      kind: "session.revokeAll"
      tenantCode: string
      tenantName: string
      sessions: number
      onConfirm?: () => void
    }
  | { kind: "permission.rejectDisable"; permission: Permission }
  | {
      kind: "permission.disableInTenant"
      flagKey: string
      flagLabel: string
      roles: string[]
      tenantCode: string
      onConfirm?: () => void
    }
  | { kind: "account.tempPassword"; accountName: string; email: string }
  | { kind: "tenant.createProgress"; code: string; onDone?: () => void }
  | {
      kind: "role.permissions"
      role: SystemRole
      onSave: (permissionKeys: string[]) => void
    }

type DialogsContextValue = {
  open: (req: DialogRequest) => void
  close: () => void
}

const DialogsContext = React.createContext<DialogsContextValue | null>(null)

export function useDialogs() {
  const ctx = React.useContext(DialogsContext)
  if (!ctx) throw new Error("useDialogs harus dipakai di dalam <DialogsProvider>")
  return ctx
}

export function DialogsProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = React.useState<DialogRequest | null>(null)
  const close = React.useCallback(() => setReq(null), [])
  const open = React.useCallback((r: DialogRequest) => setReq(r), [])

  return (
    <DialogsContext.Provider value={{ open, close }}>
      {children}
      <DialogHost req={req} onClose={close} />
    </DialogsContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/* Host — merender dialog aktif                                       */
/* ------------------------------------------------------------------ */

function DialogHost({
  req,
  onClose,
}: {
  req: DialogRequest | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={req !== null}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      {req ? (
        <DialogContent
          className={
            req.kind === "account.tempPassword"
              ? "max-w-md"
              : req.kind === "role.permissions"
                ? "max-w-lg"
                : undefined
          }
        >
          {req.kind === "tenant.deactivate" && (
            <DeactivateTenant req={req} onClose={onClose} />
          )}
          {req.kind === "tenant.delete" && (
            <DeleteTenant req={req} onClose={onClose} />
          )}
          {req.kind === "session.revokeAll" && (
            <RevokeAllSessions req={req} onClose={onClose} />
          )}
          {req.kind === "permission.rejectDisable" && (
            <RejectDisablePermission req={req} onClose={onClose} />
          )}
          {req.kind === "permission.disableInTenant" && (
            <DisablePermissionInTenant req={req} onClose={onClose} />
          )}
          {req.kind === "account.tempPassword" && (
            <TempPassword req={req} onClose={onClose} />
          )}
          {req.kind === "tenant.createProgress" && (
            <CreateTenantProgress req={req} onClose={onClose} />
          )}
          {req.kind === "role.permissions" && (
            <RolePermissions req={req} onClose={onClose} />
          )}
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

/* ------------------------------------------------------------------ */
/* 6.1a — Nonaktifkan tenant                                          */
/* ------------------------------------------------------------------ */

function DeactivateTenant({
  req,
  onClose,
}: {
  req: Extract<DialogRequest, { kind: "tenant.deactivate" }>
  onClose: () => void
}) {
  const { tenant } = req
  return (
    <>
      <DialogHeader>
        <DialogTitle>Nonaktifkan tenant</DialogTitle>
        <DialogDescription>
          Tenant{" "}
          <code className="font-mono text-foreground">{tenant.code}</code> —{" "}
          {tenant.name} akan dinonaktifkan.
        </DialogDescription>
      </DialogHeader>

      <ul className="space-y-1.5 rounded-lg bg-muted/60 p-3 text-sm">
        <ImpactItem>
          <span className="font-mono">{tenant.userCount}</span> pengguna klinik
          kehilangan akses masuk
        </ImpactItem>
        <ImpactItem>
          <span className="font-mono">{tenant.activeSessions}</span> sesi aktif
          akan diakhiri
        </ImpactItem>
        <ImpactItem>
          Event terjadwal untuk tenant ini dihentikan sementara
        </ImpactItem>
        <ImpactItem>
          Masuk hitung mundur housekeeping —{" "}
          <span className="font-mono">180 hari</span> nonaktif berturut-turut
          akan dihapus permanen otomatis (lihat SISTEM › Housekeeping)
        </ImpactItem>
        <ImpactItem>
          Aktifkan kembali kapan saja sebelum hitung mundur berakhir untuk
          membatalkan penghapusan
        </ImpactItem>
      </ul>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            req.onConfirm?.()
            toast.success(`Tenant ${tenant.code} dinonaktifkan`, {
              description:
                "Masuk antrean hitung mundur housekeeping — dihapus otomatis dalam 180 hari bila tetap nonaktif.",
            })
            onClose()
          }}
        >
          <IconPower />
          Nonaktifkan tenant
        </Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 6.1b — Hapus tenant (ketik kode)                                   */
/* ------------------------------------------------------------------ */

function DeleteTenant({
  req,
  onClose,
}: {
  req: Extract<DialogRequest, { kind: "tenant.delete" }>
  onClose: () => void
}) {
  const { tenant } = req
  const [confirmText, setConfirmText] = React.useState("")
  const match = confirmText.trim() === tenant.code

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <IconAlertOctagon className="size-4 text-destructive" />
          Percepat penghapusan permanen
        </DialogTitle>
        <DialogDescription>
          Tenant{" "}
          <code className="font-mono text-foreground">{tenant.code}</code>{" "}
          langsung ditambahkan ke antrean housekeeping untuk dihapus permanen
          pada proses berikutnya — melewati masa tunggu 180 hari yang berjalan
          sejak dinonaktifkan.
        </DialogDescription>
      </DialogHeader>

      <ul className="space-y-1.5 rounded-lg bg-destructive/5 p-3 text-sm">
        <ImpactItem tone="destructive">
          Seluruh data tenant, cabang, dan rekam dihapus
        </ImpactItem>
        <ImpactItem tone="destructive">
          <span className="font-mono">{tenant.userCount}</span> pengguna klinik
          dicabut aksesnya
        </ImpactItem>
        <ImpactItem tone="destructive">
          Masuk antrean housekeeping dengan prioritas segera — bukan menunggu
          jatuh tempo 180 hari (lihat SISTEM › Housekeeping)
        </ImpactItem>
      </ul>

      <div className="space-y-1.5">
        <Label htmlFor="delete-confirm" className="text-xs">
          Ketik kode tenant{" "}
          <code className="font-mono text-foreground">{tenant.code}</code> untuk
          mengonfirmasi
        </Label>
        <Input
          id="delete-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          className="font-mono"
          placeholder={tenant.code}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="destructive"
          disabled={!match}
          onClick={() => {
            req.onConfirm?.()
            toast.success(`Tenant ${tenant.code} masuk antrean housekeeping`, {
              description: "Prioritas segera — lihat SISTEM › Housekeeping.",
            })
            onClose()
          }}
        >
          <IconTrash />
          Percepat penghapusan
        </Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 6.2 — Cabut semua sesi tenant                                      */
/* ------------------------------------------------------------------ */

function RevokeAllSessions({
  req,
  onClose,
}: {
  req: Extract<DialogRequest, { kind: "session.revokeAll" }>
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Cabut semua sesi</DialogTitle>
        <DialogDescription>
          Seluruh sesi aktif pada tenant{" "}
          <code className="font-mono text-foreground">{req.tenantCode}</code> —{" "}
          {req.tenantName} akan diakhiri.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg bg-muted/60 p-3 text-sm">
        <p>
          <span className="font-mono text-lg font-semibold">
            {req.sessions}
          </span>{" "}
          sesi pengguna klinik akan dipaksa keluar. Pengguna harus masuk
          kembali. Tindakan tidak memengaruhi status tenant.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            req.onConfirm?.()
            toast.success(`${req.sessions} sesi ${req.tenantCode} dicabut`)
            onClose()
          }}
        >
          <IconLogout />
          Cabut {req.sessions} sesi
        </Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 6.3 — Tolak nonaktifkan permission (terikat tenant / CORE)         */
/* ------------------------------------------------------------------ */

function RejectDisablePermission({
  req,
  onClose,
}: {
  req: Extract<DialogRequest, { kind: "permission.rejectDisable" }>
  onClose: () => void
}) {
  const { permission } = req
  const reason = permission.core
    ? "core"
    : permission.boundTenants > 0
      ? "bound"
      : "other"

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <IconX className="size-4 text-destructive" />
          Tidak dapat dinonaktifkan
        </DialogTitle>
        <DialogDescription>
          Permission{" "}
          <code className="font-mono text-foreground">{permission.key}</code>{" "}
          tidak dapat dinonaktifkan saat ini.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 rounded-lg bg-destructive/5 p-3 text-sm">
        {reason === "core" ? (
          <p className="flex items-start gap-2">
            <IconLock className="mt-0.5 size-4 shrink-0 text-destructive" />
            Permission bertanda{" "}
            <Badge variant="secondary" className="mx-0.5 font-mono text-[0.65rem]">
              CORE
            </Badge>
            wajib aktif untuk seluruh tenant dan tidak dapat dimatikan.
          </p>
        ) : (
          <>
            <p className="flex items-start gap-2">
              <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              Masih terikat ke{" "}
              <span className="font-mono">{permission.boundTenants}</span> tenant
              melalui peran berikut:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {permission.boundRoles.map((r) => (
                <Badge key={r} variant="outline" className="text-xs">
                  {r}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Lepaskan permission ini dari seluruh peran tenant terlebih dahulu,
              lalu coba lagi.
            </p>
          </>
        )}
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Mengerti</Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 6.4 — Matikan permission di tenant (dampak ke peran)               */
/* ------------------------------------------------------------------ */

function DisablePermissionInTenant({
  req,
  onClose,
}: {
  req: Extract<DialogRequest, { kind: "permission.disableInTenant" }>
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Matikan fitur untuk tenant ini</DialogTitle>
        <DialogDescription>
          <code className="font-mono text-foreground">{req.flagKey}</code> akan
          dimatikan pada tenant{" "}
          <code className="font-mono text-foreground">{req.tenantCode}</code>.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 rounded-lg bg-muted/60 p-3 text-sm">
        <p>Peran berikut akan kehilangan akses ke {req.flagLabel}:</p>
        {req.roles.length > 0 ? (
          <ul className="space-y-1">
            {req.roles.map((r) => (
              <li key={r} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                {r}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tidak ada peran yang saat ini memakai fitur ini.
          </p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            req.onConfirm?.()
            toast.success(`${req.flagKey} dimatikan untuk ${req.tenantCode}`)
            onClose()
          }}
        >
          <IconPower />
          Tetap matikan
        </Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 6.5 — Password sementara                                           */
/* ------------------------------------------------------------------ */

function genPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz"
  let out = ""
  for (let i = 0; i < 16; i++)
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12)}`
}

function TempPassword({
  req,
  onClose,
}: {
  req: Extract<DialogRequest, { kind: "account.tempPassword" }>
  onClose: () => void
}) {
  const [password] = React.useState(genPassword)
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(password)
    } catch {
      /* clipboard tidak tersedia — abaikan */
    }
    setCopied(true)
    toast.success("Password sementara disalin")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Password sementara</DialogTitle>
        <DialogDescription>
          Untuk {req.accountName} —{" "}
          <span className="font-mono">{req.email}</span>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-muted px-3 py-2.5 font-mono text-sm tracking-wide select-all">
            {password}
          </code>
          <Button variant="outline" size="icon" onClick={copy} aria-label="Salin">
            {copied ? <IconCheck /> : <IconCopy />}
          </Button>
        </div>
        <p className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-500">
          <IconAlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Password ini hanya tampil sekali. Salin dan serahkan melalui kanal
          aman — tidak dapat dilihat lagi setelah dialog ditutup.
        </p>
      </div>

      <DialogFooter>
        <Button onClick={onClose}>Selesai</Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* 6.6 — Progres pembuatan tenant (asinkron)                          */
/* ------------------------------------------------------------------ */

const CREATE_STEPS = [
  "Validasi identitas tenant",
  "Provisioning penyimpanan (MULTI_TENANT)",
  "Terapkan set fitur",
  "Semai akun admin awal",
  "Terbitkan event TenantCreated",
] as const

type StepState = "pending" | "running" | "done" | "failed"

function CreateTenantProgress({
  req,
  onClose,
}: {
  req: Extract<DialogRequest, { kind: "tenant.createProgress" }>
  onClose: () => void
}) {
  const [states, setStates] = React.useState<StepState[]>(
    () => CREATE_STEPS.map(() => "pending")
  )
  const [finished, setFinished] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    let i = 0
    function tick() {
      if (cancelled) return
      if (i >= CREATE_STEPS.length) {
        setFinished(true)
        return
      }
      const idx = i
      setStates((s) => s.map((v, k) => (k === idx ? "running" : v)))
      window.setTimeout(() => {
        if (cancelled) return
        setStates((s) => s.map((v, k) => (k === idx ? "done" : v)))
        i += 1
        tick()
      }, 650)
    }
    tick()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <DialogHeader>
        <DialogTitle>Membuat tenant</DialogTitle>
        <DialogDescription>
          Kode <code className="font-mono text-foreground">{req.code}</code> —
          proses berjalan asinkron.
        </DialogDescription>
      </DialogHeader>

      <ul className="space-y-2">
        {CREATE_STEPS.map((label, i) => {
          const st = states[i]
          return (
            <li key={label} className="flex items-center gap-2.5 text-sm">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  st === "done" &&
                    "border-emerald-600/40 bg-emerald-600/15 text-emerald-700 dark:text-emerald-400",
                  st === "running" && "border-primary text-primary",
                  st === "failed" &&
                    "border-destructive/40 bg-destructive/10 text-destructive",
                  st === "pending" && "border-border text-muted-foreground"
                )}
              >
                {st === "done" ? (
                  <IconCheck className="size-3" />
                ) : st === "running" ? (
                  <IconLoader2 className="size-3 animate-spin" />
                ) : st === "failed" ? (
                  <IconX className="size-3" />
                ) : (
                  <span className="font-mono text-[0.65rem]">{i + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  st === "pending" && "text-muted-foreground",
                  st === "failed" && "text-destructive"
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ul>

      <DialogFooter>
        <Button
          disabled={!finished}
          onClick={() => {
            req.onDone?.()
            onClose()
          }}
        >
          {finished ? <IconRocket /> : <IconLoader2 className="animate-spin" />}
          {finished ? "Buka daftar tenant" : "Memproses…"}
        </Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Kelola izin peran — assign master_permissions per role              */
/* ------------------------------------------------------------------ */

function RolePermissions({
  req,
  onClose,
}: {
  req: Extract<DialogRequest, { kind: "role.permissions" }>
  onClose: () => void
}) {
  const { role } = req
  const [checked, setChecked] = React.useState<Set<string>>(
    () => new Set(role.permissionKeys)
  )

  const toggle = (key: string, on: boolean) =>
    setChecked((s) => {
      const next = new Set(s)
      if (on) next.add(key)
      else next.delete(key)
      return next
    })

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Kelola izin —{" "}
          <code className="font-mono text-foreground">{role.key}</code>
        </DialogTitle>
        <DialogDescription>
          Pilih master_permissions yang dimiliki peran {role.label}.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
        {permissionGroups.map((g) => {
          const groupPerms = permissions.filter((p) => p.group === g.key)
          return (
            <div key={g.key} className="rounded-lg border border-border">
              <div className="border-b border-border bg-muted/40 px-3 py-1.5">
                <code className="font-mono text-xs text-muted-foreground">
                  {g.key}
                </code>{" "}
                <span className="text-xs font-medium">{g.label}</span>
              </div>
              <div className="divide-y divide-border">
                {groupPerms.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked.has(p.key)}
                      onCheckedChange={(v) => toggle(p.key, v === true)}
                    />
                    <code className="font-mono text-xs">{p.key}</code>
                    <span className="text-xs text-muted-foreground">
                      {p.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button
          onClick={() => {
            req.onSave(Array.from(checked))
            toast.success(`Izin peran ${role.key} disimpan`, {
              description: `${checked.size} permission ditetapkan.`,
            })
            onClose()
          }}
        >
          <IconCheck />
          Simpan izin
        </Button>
      </DialogFooter>
    </>
  )
}

/* ------------------------------------------------------------------ */

function ImpactItem({
  children,
  tone = "default",
}: {
  children: React.ReactNode
  tone?: "default" | "destructive"
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          tone === "destructive" ? "bg-destructive" : "bg-muted-foreground"
        )}
      />
      <span>{children}</span>
    </li>
  )
}
