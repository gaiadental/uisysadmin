import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

type TableCardProps = {
  title?: string
  /** Angka di badge kanan header (font-mono). */
  count?: number
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Card pembungkus tabel dengan header opsional + badge jumlah. */
export function TableCard({
  title,
  count,
  description,
  actions,
  children,
  className,
}: TableCardProps) {
  return (
    <Card className={cn("gap-0 overflow-x-auto py-0", className)}>
      {title || actions ? (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {title ? (
                <span className="font-heading text-sm font-semibold">
                  {title}
                </span>
              ) : null}
              {typeof count === "number" ? (
                <Badge variant="outline" className="font-mono">
                  {count}
                </Badge>
              ) : null}
            </div>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </Card>
  )
}
