import type { ReactNode } from "react"

import { navigateTo } from "@/app/router"
import { cn } from "@/lib/utils"

interface AppLinkProps {
  readonly to: string
  readonly children: ReactNode
  readonly className?: string
}

/**
 * An in-app link. It keeps the anchor semantics, and a plain click moves
 * through the History API without a page reload. A modified click (new tab,
 * for example) is left to the browser.
 */
export function AppLink({ to, children, className }: AppLinkProps) {
  return (
    <a
      href={to}
      className={cn(
        "text-sm font-medium text-primary underline-offset-4 hover:underline",
        className
      )}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        event.preventDefault()
        navigateTo(to)
      }}
    >
      {children}
    </a>
  )
}
