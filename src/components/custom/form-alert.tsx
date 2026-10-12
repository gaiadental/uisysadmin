/**
 * Form-level alert (ARCH-FE-001 D9, D13, D16). It is announced with
 * role="alert" and shows the reference id, so a user can quote it when
 * reporting a problem. Renders nothing when there is no message.
 */

import type { ReactNode } from "react"

import { referenceLine } from "@/lib/notify"

interface FormAlertProps {
  readonly message: string | null
  readonly referenceId?: string | null
  /** Optional follow-up content, such as a link to the next step. */
  readonly children?: ReactNode
}

export function FormAlert({
  message,
  referenceId = null,
  children,
}: FormAlertProps) {
  if (message === null) return null
  return (
    <div
      role="alert"
      className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <p>{message}</p>
      {referenceId !== null ? (
        <p className="text-xs text-muted-foreground">
          {referenceLine(referenceId)}
        </p>
      ) : null}
      {children}
    </div>
  )
}
