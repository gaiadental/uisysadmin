/**
 * Confirm dialogs (ARCH-FE-001 D11, D16, REQ-FE-039). One provider hosts one
 * confirm dialog at a time. `confirm()` resolves true only when the user
 * confirms. Cancel, Escape, the overlay and the close button resolve false.
 *
 * A confirm dialog is destructive or default, has explanation text and has no
 * typed input. When it closes, focus returns to the element that opened it.
 *
 * The legacy request kinds (tenant delete, temporary password, and the others
 * that used mock data types) are removed. Module TODOs add their dialogs by
 * calling `confirm()`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ConfirmTone = "destructive" | "default"

export interface ConfirmRequest {
  readonly title: string
  /** What happens when the user confirms. Plain text, never a typed confirmation. */
  readonly description: string
  readonly confirmLabel: string
  /** Defaults to "Batal". */
  readonly cancelLabel?: string
  readonly tone: ConfirmTone
}

interface ConfirmEntry {
  readonly request: ConfirmRequest
  /** The element that had focus when the dialog opened. Focus returns here. */
  readonly opener: HTMLElement | null
  readonly resolve: (confirmed: boolean) => void
}

export interface DialogsContextValue {
  /** Opens a confirm dialog and resolves with the user's choice. */
  readonly confirm: (request: ConfirmRequest) => Promise<boolean>
}

const DialogsContext = createContext<DialogsContextValue | null>(null)

export function DialogsProvider({
  children,
}: {
  readonly children: ReactNode
}) {
  const [entry, setEntry] = useState<ConfirmEntry | null>(null)
  const [open, setOpen] = useState(false)
  const pendingRef = useRef<ConfirmEntry | null>(null)

  // Resolves the pending confirm once. The entry stays in state while the
  // dialog animates out, so the body does not disappear mid-animation.
  const settle = useCallback((confirmed: boolean) => {
    const current = pendingRef.current
    if (current === null) return
    pendingRef.current = null
    setOpen(false)
    current.resolve(confirmed)
  }, [])

  const confirm = useCallback((request: ConfirmRequest): Promise<boolean> => {
    // A new request replaces an open one, which resolves as cancelled.
    pendingRef.current?.resolve(false)
    return new Promise<boolean>((resolve) => {
      const active = document.activeElement
      const next: ConfirmEntry = {
        request,
        opener: active instanceof HTMLElement ? active : null,
        resolve,
      }
      pendingRef.current = next
      setEntry(next)
      setOpen(true)
    })
  }, [])

  const value = useMemo<DialogsContextValue>(() => ({ confirm }), [confirm])

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <ConfirmHost entry={entry} open={open} onSettle={settle} />
    </DialogsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook reads DialogsContext, which stays private to this file
export function useDialogs(): DialogsContextValue {
  const value = useContext(DialogsContext)
  if (value === null) {
    throw new Error("useDialogs must be used inside DialogsProvider.")
  }
  return value
}

interface ConfirmHostProps {
  readonly entry: ConfirmEntry | null
  readonly open: boolean
  readonly onSettle: (confirmed: boolean) => void
}

function ConfirmHost({ entry, open, onSettle }: ConfirmHostProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onSettle(false)
      }}
    >
      {entry === null ? null : (
        <DialogContent
          finalFocus={() => entry.opener ?? true}
          className="max-w-md"
        >
          <ConfirmBody request={entry.request} onSettle={onSettle} />
        </DialogContent>
      )}
    </Dialog>
  )
}

function ConfirmBody({
  request,
  onSettle,
}: {
  readonly request: ConfirmRequest
  readonly onSettle: (confirmed: boolean) => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{request.title}</DialogTitle>
        <DialogDescription>{request.description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onSettle(false)}>
          {request.cancelLabel ?? "Batal"}
        </Button>
        <Button
          variant={request.tone === "destructive" ? "destructive" : "default"}
          onClick={() => onSettle(true)}
        >
          {request.confirmLabel}
        </Button>
      </DialogFooter>
    </>
  )
}
