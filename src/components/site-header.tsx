import * as React from "react"
import { IconSearch } from "@tabler/icons-react"

import { useRoute } from "@/router"
import { routeMeta } from "@/lib/routes-meta"
import { useCommandPalette } from "@/components/command-palette"
import { Badge } from "@/components/ui/badge"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  const route = useRoute()
  const meta = routeMeta[route.name]
  const palette = useCommandPalette()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:self-auto"
        />

        <nav className="hidden items-center gap-1.5 text-sm sm:flex">
          {meta.breadcrumb.map((crumb, i) => {
            const last = i === meta.breadcrumb.length - 1
            return (
              <React.Fragment key={crumb}>
                {i > 0 ? (
                  <span className="text-muted-foreground/60">/</span>
                ) : null}
                <span
                  className={
                    last
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {crumb}
                </span>
              </React.Fragment>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={palette.open}
            className="flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 sm:w-88 lg:w-104 dark:bg-input/30"
          >
            <IconSearch className="size-4 shrink-0" />
            <span className="hidden truncate sm:inline">
              Cari tenant, akun, permission, atau tempel UUID
            </span>
            <span className="truncate sm:hidden">Cari…</span>
            <Kbd className="ml-auto">⌘K</Kbd>
          </button>
        </div>
      </div>
    </header>
  )
}
