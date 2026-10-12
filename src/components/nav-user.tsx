/**
 * Account block at the foot of the sidebar (ARCH-FE-001 D4.8, REQ-FE-016). It
 * shows the login id and the role key from `me`. Logout ends the session
 * through the auth provider, then moves to the login page.
 *
 * `me` has no display name for the role. The role key is shown as the label.
 */

import { useState } from "react"
import { IconLogout } from "@tabler/icons-react"

import { useAuth } from "@/app/providers/auth-provider"
import { LOGIN_PATH } from "@/app/guards/route-guard"
import { navigateTo } from "@/app/router"
import { Button } from "@/components/ui/button"
import { notifyError } from "@/lib/notify"

export function NavUser() {
  const { me, logout } = useAuth()
  const [pending, setPending] = useState(false)

  if (me === null) return null

  async function handleLogout() {
    setPending(true)
    try {
      await logout()
      navigateTo(LOGIN_PATH, { replace: true })
    } catch (error) {
      notifyError(error, "Gagal keluar. Coba lagi.")
    } finally {
      setPending(false)
    }
  }

  const initial = me.loginId.trim().charAt(0).toUpperCase()

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-semibold text-primary"
      >
        {initial}
      </span>
      <div className="grid min-w-0 flex-1 text-left leading-tight">
        <span className="truncate text-sm font-medium" title={me.loginId}>
          {me.loginId}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {me.role}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Keluar"
        title="Keluar"
        disabled={pending}
        onClick={() => void handleLogout()}
      >
        <IconLogout />
      </Button>
    </div>
  )
}
