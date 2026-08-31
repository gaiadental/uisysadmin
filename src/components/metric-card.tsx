import * as React from "react"
import type { IconType } from "@/lib/icon"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type MetricCardProps = {
  label: string
  value: React.ReactNode
  icon?: IconType
  /** Nada merah untuk metrik yang menandakan kegagalan. */
  tone?: "default" | "destructive"
  hint?: string
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: MetricCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "gap-2 p-4",
        tone === "destructive" && "ring-destructive/30 bg-destructive/5"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        {Icon ? (
          <Icon
            className={cn(
              "size-4 text-muted-foreground",
              tone === "destructive" && "text-destructive"
            )}
          />
        ) : null}
      </div>
      <div
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          tone === "destructive" && "text-destructive"
        )}
      >
        {value}
      </div>
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </Card>
  )
}
