/**
 * Root page for a signed-in user (ARCH-FE-001 D6.3). When no module is visible
 * it shows a neutral message, not an empty dashboard. Copy is a proposed
 * default until FE-OQ-22 is answered.
 */

import { useId } from "react"

import { useAuth } from "@/app/providers/auth-provider"
import { hasVisibleModule } from "@/app/navigation"

export function LandingPage() {
  const { status, me } = useAuth()
  const titleId = useId()

  if (me === null) return null

  const modulesVisible = hasVisibleModule({ status, me })

  return (
    <section
      aria-labelledby={titleId}
      className="mx-auto flex max-w-md flex-col gap-2 px-4 py-16 text-center"
    >
      <h1 id={titleId} className="text-lg font-semibold">
        Beranda
      </h1>
      <p className="text-sm text-muted-foreground">
        {modulesVisible
          ? "Pilih menu di sisi kiri untuk membuka halaman."
          : "Belum ada modul yang tersedia untuk akun Anda. Hubungi administrator untuk meminta akses."}
      </p>
    </section>
  )
}
