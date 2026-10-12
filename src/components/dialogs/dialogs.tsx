/**
 * Confirm dialogs (ARCH-FE-001 D11, D16, REQ-FE-039). One provider hosts one
 * confirm dialog at a time. `confirm()` resolves true only when the user
 * confirms. Cancel, Escape, the overlay and the close button resolve false.
 *
 * A confirm dialog is destructive or default and has explanation text. When
 * it closes, focus returns to the element that opened it.
 *
 * Friction scales with the damage. A reversible action is one step. A
 * `permanent` action asks the user to type "delete" before the red button
 * works (owner decision, supersedes the "no typed input" line of ARCH-FE-001
 * D11 until the architecture is updated). Focus starts on Batal, so Enter or
 * Space on open cancels.
 *
 * The legacy request kinds (tenant delete, temporary password, and the others
 * that used mock data types) are removed. Module TODOs add their dialogs by
 * calling `confirm()`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type ConfirmTone = "destructive" | "default"

/** The word the user types to confirm a permanent action. */
export const CONFIRM_WORD = "delete"

export interface ConfirmRequest {
  readonly title: string
  /** What happens when the user confirms. Plain text, never a typed confirmation. */
  readonly description: string
  readonly confirmLabel: string
  /** Defaults to "Batal". */
  readonly cancelLabel?: string
  readonly tone: ConfirmTone
  /** Concrete consequences, one short line each. Shown as a list. */
  readonly impact?: readonly string[]
  /**
   * Data is lost for good. The confirm button stays disabled until the user
   * types the word "delete".
   */
  readonly permanent?: boolean
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
  // Focus starts on the safe choice, never on the destructive one.
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onSettle(false)
      }}
    >
      {entry === null ? null : (
        <DialogContent
          initialFocus={cancelRef}
          finalFocus={() => entry.opener ?? true}
          className="max-w-md"
        >
          <ConfirmBody
            request={entry.request}
            onSettle={onSettle}
            cancelRef={cancelRef}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}

function ConfirmBody({
  request,
  onSettle,
  cancelRef,
}: {
  readonly request: ConfirmRequest
  readonly onSettle: (confirmed: boolean) => void
  readonly cancelRef: RefObject<HTMLButtonElement | null>
}) {
  const destructive = request.tone === "destructive"
  const permanent = request.permanent === true
  const [typed, setTyped] = useState("")
  const inputId = useId()
  const hintId = useId()
  const matches = typed.trim().toLowerCase() === CONFIRM_WORD

  const cancel = (
    <Button
      ref={cancelRef}
      variant={destructive ? "default" : "outline"}
      onClick={() => onSettle(false)}
    >
      {request.cancelLabel ?? "Batal"}
    </Button>
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>{request.title}</DialogTitle>
        <DialogDescription>{request.description}</DialogDescription>
      </DialogHeader>

      {request.impact !== undefined && request.impact.length > 0 ? (
        <ul className="flex flex-col gap-1.5 rounded-xl bg-muted/70 p-4 text-sm">
          {request.impact.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden="true" className="text-muted-foreground">
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {permanent ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-sm font-medium">
            Ketik <span className="font-mono">{CONFIRM_WORD}</span> untuk
            menghapus
          </label>
          <Input
            id={inputId}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches) onSettle(true)
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={CONFIRM_WORD}
            aria-describedby={hintId}
          />
          <p id={hintId} className="text-xs text-muted-foreground">
            Tombol hapus aktif setelah kata di atas diketik persis.
          </p>
        </div>
      ) : null}

      <DialogFooter className="gap-3 sm:items-center">
        <Button
          variant={destructive ? "destructive" : "default"}
          className={destructive ? "sm:mr-auto" : undefined}
          disabled={permanent && !matches}
          onClick={() => onSettle(true)}
        >
          {request.confirmLabel}
        </Button>
        {cancel}
      </DialogFooter>
    </>
  )
}
