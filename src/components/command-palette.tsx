/**
 * Command palette (ARCH-FE-001 D6.3). It lists the pages that the navigation
 * config allows for the current `me`, so a page it offers is a page the
 * sidebar also shows. It searches pages only: the mock tenant, account and
 * permission lists are gone.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createContext,
  useContext,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import {
  IconArrowRight,
  IconCornerDownLeft,
  IconHash,
  IconSearch,
} from "@tabler/icons-react"

import { useAuth } from "@/app/providers/auth-provider"
import { visibleNavSections } from "@/app/navigation"
import { navigateTo } from "@/app/router"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

interface Command {
  readonly id: string
  readonly label: string
  readonly path: string
  readonly group: string
  readonly keywords: string
}

interface PaletteApi {
  readonly open: () => void
  readonly close: () => void
  readonly toggle: () => void
}

interface PaletteState {
  readonly open: boolean
  readonly session: number
}

const PaletteContext = createContext<PaletteApi | null>(null)

// eslint-disable-next-line react-refresh/only-export-components -- the hook reads PaletteContext, which stays private to this file
export function useCommandPalette(): PaletteApi {
  const api = useContext(PaletteContext)
  if (api === null) {
    throw new Error(
      "useCommandPalette must be used inside CommandPaletteProvider."
    )
  }
  return api
}

export function CommandPaletteProvider({
  children,
}: {
  readonly children: ReactNode
}) {
  // `session` changes on every open. The palette is keyed by it, so each
  // opening starts with an empty query and the first row highlighted.
  const [palette, setPalette] = useState<PaletteState>({
    open: false,
    session: 0,
  })
  const api = useMemo<PaletteApi>(
    () => ({
      open: () =>
        setPalette((current) => ({ open: true, session: current.session + 1 })),
      close: () => setPalette((current) => ({ ...current, open: false })),
      toggle: () =>
        setPalette((current) =>
          current.open
            ? { ...current, open: false }
            : { open: true, session: current.session + 1 }
        ),
    }),
    []
  )

  // Ctrl+K or Cmd+K toggles the palette.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        api.toggle()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [api])

  return (
    <PaletteContext.Provider value={api}>
      {children}
      <CommandPalette
        key={palette.session}
        open={palette.open}
        onClose={api.close}
      />
    </PaletteContext.Provider>
  )
}

function CommandPalette({
  open,
  onClose,
}: {
  readonly open: boolean
  readonly onClose: () => void
}) {
  const { status, me } = useAuth()
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const commands = useMemo<Command[]>(
    () =>
      visibleNavSections({ status, me }).flatMap((section) =>
        section.items.map((item) => ({
          id: item.id,
          label: item.label,
          path: item.path,
          group: section.label,
          keywords: `${item.label} ${section.label} ${item.path}`.toLowerCase(),
        }))
      ),
    [status, me]
  )

  const needle = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      needle === ""
        ? commands
        : commands.filter((command) => command.keywords.includes(needle)),
    [commands, needle]
  )

  // Keeps the highlighted row inside the list when the filter shrinks it.
  const highlighted = Math.min(active, Math.max(filtered.length - 1, 0))

  const runCommand = useCallback(
    (command: Command) => {
      navigateTo(command.path)
      onClose()
    },
    [onClose]
  )

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = Math.max(filtered.length, 1)
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActive((index) => (index + 1) % count)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActive((index) => (index - 1 + count) % count)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const command = filtered[highlighted]
      if (command !== undefined) runCommand(command)
    }
  }

  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${highlighted}"]`
    )
    row?.scrollIntoView({ block: "nearest" })
  }, [highlighted])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <IconSearch className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="Cari halaman"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Perintah"
          />
          <Kbd>ESC</Kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk <code className="font-mono">{query}</code>
            </p>
          ) : (
            filtered.map((command, index) => (
              <div key={command.id}>
                {index === 0 || filtered[index - 1]?.group !== command.group ? (
                  <p className="px-2 pt-2 pb-1 font-mono text-xs tracking-wide text-muted-foreground uppercase">
                    {command.group}
                  </p>
                ) : null}
                <button
                  type="button"
                  data-index={index}
                  onMouseMove={() => setActive(index)}
                  onClick={() => runCommand(command)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm",
                    index === highlighted ? "bg-muted" : "hover:bg-muted/50"
                  )}
                >
                  <IconArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">
                    {command.label}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {command.path}
                    </span>
                  </span>
                  {index === highlighted ? (
                    <IconCornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" />
                  ) : null}
                </button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
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
