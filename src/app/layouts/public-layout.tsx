/**
 * Layout for signed-out screens: login, forgot and reset password, and the
 * boot and error screens (ARCH-FE-001 D10). It has no sidebar and reads no
 * session data. The login page is full-bleed and brings its own backdrop, so
 * it gets no header.
 */

import type { ReactNode } from "react"

import { LOGIN_PATH } from "@/app/guards/route-guard"
import { splitHref, useLocationHref } from "@/app/router"

export function PublicLayout({ children }: { readonly children: ReactNode }) {
  const { pathname } = splitHref(useLocationHref())
  if (pathname === LOGIN_PATH) {
    return (
      <main id="main" className="flex min-h-svh flex-col text-foreground">
        {children}
      </main>
    )
  }
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="flex h-14 items-center px-4 lg:px-6">
        <span className="font-heading text-base font-semibold">SysAdmin</span>
      </header>
      <main id="main" className="flex flex-1 flex-col justify-center">
        {children}
      </main>
    </div>
  )
}
