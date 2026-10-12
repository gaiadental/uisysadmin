/**
 * Shell for signed-in screens: the sidebar and the header (ARCH-FE-001 D6.3,
 * D10). It also provides the command palette, which only signed-in users see.
 */

import type { CSSProperties, ReactNode } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { CommandPaletteProvider } from "@/components/command-palette"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const SHELL_STYLE = {
  "--sidebar-width": "calc(var(--spacing) * 68)",
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties

export function AuthenticatedLayout({
  children,
}: {
  readonly children: ReactNode
}) {
  return (
    <CommandPaletteProvider>
      <SidebarProvider defaultOpen style={SHELL_STYLE}>
        <AppSidebar variant="floating" />
        <SidebarInset>
          <SiteHeader />
          <main id="main" className="@container/main flex flex-1 flex-col">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </CommandPaletteProvider>
  )
}
