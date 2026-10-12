import { Fragment } from "react"
import { IconSearch } from "@tabler/icons-react"

import { breadcrumbFor } from "@/app/navigation"
import { splitHref, useLocationHref } from "@/app/router"
import { useCommandPalette } from "@/components/command-palette"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  const { pathname } = splitHref(useLocationHref())
  const crumbs = breadcrumbFor(pathname) ?? []
  const palette = useCommandPalette()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-vertical:self-auto"
        />

        <nav
          aria-label="Jejak navigasi"
          className="hidden items-center gap-1.5 text-sm sm:flex"
        >
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <Fragment key={`${index}-${crumb}`}>
                {index > 0 ? (
                  <span aria-hidden="true" className="text-muted-foreground/60">
                    /
                  </span>
                ) : null}
                <span
                  aria-current={last ? "page" : undefined}
                  className={
                    last
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {crumb}
                </span>
              </Fragment>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={palette.open}
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 sm:w-88 lg:w-104 dark:bg-input/30"
          >
            <IconSearch className="size-4 shrink-0" />
            <span className="hidden truncate sm:inline">Cari halaman</span>
            <span className="truncate sm:hidden">Cari</span>
            <Kbd className="ml-auto">⌘K</Kbd>
          </button>
        </div>
      </div>
    </header>
  )
}
