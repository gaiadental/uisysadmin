import * as React from "react"
import {
  IconArrowRight,
  IconBuilding,
  IconCornerDownLeft,
  IconHash,
  IconKey,
  IconSearch,
  IconUserCircle,
} from "@tabler/icons-react"

import { navigate, type RouteName } from "@/router"
import { routeMeta } from "@/lib/routes-meta"
import { tenants } from "@/data/tenants"
import { itAccounts } from "@/data/it-accounts"
import { permissions } from "@/data/permissions"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"

type Command = {
  id: string
  label: string
  hint?: string
  group: "Navigasi" | "Tenant" | "Akun" | "Permission"
  keywords: string
  run: () => void
}

const NAV_ROUTES: RouteName[] = [
  "beranda",
  "tenant.list",
  "tenant.create",
  "katalog.permission",
  "katalog.kategori",
  "katalog.negara",
  "tim.akun",
  "tim.peran",
  "sistem.event",
  "sistem.sesi",
  "sistem.housekeeping",
  "sistem.audit",
  "sistem.pengaturan",
]

const ROUTE_PATH: Record<RouteName, string> = {
  beranda: "/",
  "tenant.list": "/tenant",
  "tenant.create": "/tenant/tambah",
  "tenant.detail": "/tenant",
  "katalog.permission": "/katalog/permission",
  "katalog.kategori": "/katalog/kategori",
  "katalog.negara": "/katalog/negara",
  "tim.akun": "/tim/akun",
  "tim.peran": "/tim/peran",
  "sistem.event": "/sistem/event",
  "sistem.sesi": "/sistem/sesi",
  "sistem.housekeeping": "/sistem/housekeeping",
  "sistem.audit": "/sistem/audit",
  "sistem.pengaturan": "/sistem/pengaturan",
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type CtxValue = { open: () => void; close: () => void; toggle: () => void }
const Ctx = React.createContext<CtxValue | null>(null)

export function useCommandPalette() {
  const ctx = React.useContext(Ctx)
  if (!ctx) throw new Error("useCommandPalette butuh <CommandPaletteProvider>")
  return ctx
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const api = React.useMemo<CtxValue>(
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((o) => !o),
    }),
    []
  )

  // ⌘K / Ctrl+K global
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        api.toggle()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [api])

  return (
    <Ctx.Provider value={api}>
      {children}
      <CommandPalette open={open} onClose={api.close} />
    </Ctx.Provider>
  )
}

function CommandPalette({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [q, setQ] = React.useState("")
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (open) {
      setQ("")
      setActive(0)
    }
  }, [open])

  const commands = React.useMemo<Command[]>(() => {
    const nav: Command[] = NAV_ROUTES.map((r) => ({
      id: `nav:${r}`,
      label: routeMeta[r].title,
      hint: routeMeta[r].breadcrumb.join(" › "),
      group: "Navigasi",
      keywords: `${routeMeta[r].title} ${routeMeta[r].breadcrumb.join(" ")} ${r}`,
      run: () => {
        navigate(ROUTE_PATH[r])
        onClose()
      },
    }))
    const ten: Command[] = tenants.map((t) => ({
      id: `tenant:${t.code}`,
      label: `Buka tenant ${t.code}`,
      hint: `${t.name} · ${t.id}`,
      group: "Tenant",
      keywords: `${t.code} ${t.name} ${t.id}`,
      run: () => {
        navigate(`/tenant/${t.code}`)
        onClose()
      },
    }))
    const acc: Command[] = itAccounts.map((a) => ({
      id: `account:${a.id}`,
      label: `Buka akun ${a.name}`,
      hint: `${a.email} · ${a.role}`,
      group: "Akun",
      keywords: `${a.name} ${a.email} ${a.role} ${a.id}`,
      run: () => {
        navigate("/tim/akun")
        onClose()
      },
    }))
    const perm: Command[] = permissions.map((p) => ({
      id: `permission:${p.key}`,
      label: `Buka permission ${p.key}`,
      hint: p.label,
      group: "Permission",
      keywords: `${p.key} ${p.label} ${p.group}`,
      run: () => {
        navigate("/katalog/permission")
        onClose()
      },
    }))
    return [...nav, ...ten, ...acc, ...perm]
  }, [onClose])

  const query = q.trim().toLowerCase()
  const filtered = React.useMemo(() => {
    if (!query) return commands
    // Tempel UUID → langsung cocokkan ke tenant
    if (UUID_RE.test(query)) {
      const hit = commands.filter((c) =>
        c.keywords.toLowerCase().includes(query)
      )
      return hit.length ? hit : commands
    }
    return commands.filter((c) => c.keywords.toLowerCase().includes(query))
  }, [commands, query])

  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(filtered.length - 1, 0)))
  }, [filtered.length])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => (a + 1) % Math.max(filtered.length, 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => (a - 1 + filtered.length) % Math.max(filtered.length, 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      filtered[active]?.run()
    }
  }

  React.useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`
    )
    el?.scrollIntoView({ block: "nearest" })
  }, [active])

  let lastGroup = ""

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        <div className="sr-only" aria-hidden />
        <div className="flex items-center gap-2 border-b border-border px-3">
          <IconSearch className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Cari tenant, akun, permission, atau tempel UUID"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Perintah"
          />
          <Kbd>ESC</Kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk <code className="font-mono">{q}</code>
            </p>
          ) : (
            filtered.map((c, i) => {
              const showGroup = c.group !== lastGroup
              lastGroup = c.group
              return (
                <React.Fragment key={c.id}>
                  {showGroup ? (
                    <p className="px-2 pt-2 pb-1 font-mono text-[0.7rem] tracking-wide text-muted-foreground uppercase">
                      {c.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => c.run()}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm",
                      i === active ? "bg-muted" : "hover:bg-muted/50"
                    )}
                  >
                    {c.group === "Tenant" ? (
                      <IconBuilding className="size-4 shrink-0 text-muted-foreground" />
                    ) : c.group === "Akun" ? (
                      <IconUserCircle className="size-4 shrink-0 text-muted-foreground" />
                    ) : c.group === "Permission" ? (
                      <IconKey className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <IconArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="flex-1 truncate">
                      {c.label}
                      {c.hint ? (
                        <span className="ml-2 font-mono text-xs text-muted-foreground">
                          {c.hint}
                        </span>
                      ) : null}
                    </span>
                    {i === active ? (
                      <IconCornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                  </button>
                </React.Fragment>
              )
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-3 py-2 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconHash className="size-3" />
            {filtered.length} hasil
          </span>
          <span className="ml-auto flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navigasi
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd>
            pilih
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
