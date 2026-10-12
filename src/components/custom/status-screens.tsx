/**
 * Status screens for the route guard and the boot error (ARCH-FE-001 D4.2, D13,
 * D16). Each screen has one h1 and no color-only meaning. Copy is Indonesian
 * (C-09) and is a proposed default until FE-OQ-22 is answered.
 */

import { useId, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

interface StatusScreenProps {
  readonly title: string
  readonly message: string
  readonly children?: ReactNode
}

function StatusScreen({ title, message, children }: StatusScreenProps) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center"
    >
      <h1 id={titleId} className="text-lg font-semibold text-foreground">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </section>
  )
}

/** Shown when the route is denied by a gate (D6.5). */
export function ForbiddenScreen() {
  return (
    <StatusScreen
      title="Akses ditolak"
      message="Anda tidak punya akses ke halaman ini."
    >
      <Button variant="outline" onClick={() => window.history.back()}>
        Kembali
      </Button>
    </StatusScreen>
  )
}

/** Shown for a path that no route matches (D10). */
export function NotFoundScreen() {
  return (
    <StatusScreen
      title="Halaman tidak ditemukan"
      message="Alamat yang Anda buka tidak tersedia."
    >
      <Button variant="outline" onClick={() => window.history.back()}>
        Kembali
      </Button>
    </StatusScreen>
  )
}

interface ServiceUnavailableScreenProps {
  readonly onRetry: () => void
}

/**
 * Shown when the boot refresh failed for a reason other than an ended session
 * (D4.2 step 4). The login form is not shown, because the session may still be
 * valid.
 */
export function ServiceUnavailableScreen({
  onRetry,
}: ServiceUnavailableScreenProps) {
  return (
    <StatusScreen
      title="Layanan tidak tersedia"
      message="Sesi Anda belum bisa diperiksa. Coba lagi beberapa saat lagi."
    >
      <Button onClick={onRetry}>Coba lagi</Button>
    </StatusScreen>
  )
}

/** Shown while the auth status is `unknown` or a route chunk is loading. */
export function RouteLoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground"
    >
      Memuat halaman...
    </div>
  )
}
