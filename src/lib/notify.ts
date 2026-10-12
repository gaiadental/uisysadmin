/**
 * Error notices (ARCH-FE-001 D13, REQ-FE-008). The caller writes the title.
 * Server message text is not shown, because it is not a UI contract and the
 * UI branches on code and status only. The reference id is shown so that a
 * user can quote it when reporting the problem.
 */

import { toast } from "sonner"

import { ApiError } from "@/lib/api/errors"

/** The line that carries the reference id, such as "Kode referensi: 3f9c0a". */
export function referenceLine(correlationId: string): string {
  return `Kode referensi: ${correlationId}`
}

/**
 * Shows an error toast. Client-side failures (network, timeout, a non-JSON
 * body, a contract mismatch) carry copy written by the frontend, so their
 * message is shown. An HTTP error shows only the title and the reference id.
 */
export function notifyError(error: unknown, title: string): void {
  if (!(error instanceof ApiError)) {
    toast.error(title)
    return
  }

  const lines: string[] = []
  if (error.kind !== "HTTP") lines.push(error.message)
  if (error.correlationId !== null) {
    lines.push(referenceLine(error.correlationId))
  }
  // Logs carry the code, the status and the reference id. Never the body or headers.
  console.error(
    `[notify] ${error.kind} code=${error.code} status=${error.status ?? "none"} ref=${error.correlationId ?? "none"}`
  )

  toast.error(
    title,
    lines.length > 0 ? { description: lines.join(" ") } : undefined
  )
}
