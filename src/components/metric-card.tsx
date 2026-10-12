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
  /**
   * Keadaan data async (REQ-FE-037). "loading" dan "error" menggantikan nilai
   * dengan teks yang dibacakan pembaca layar; default "ready" menampilkan nilai.
   */
  state?: "ready" | "loading" | "error"
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  state = "ready",
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
        <span className="text-sm font-medium text-muted-foreground">
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
      {state === "ready" ? (
        <div
          className={cn(
            "font-mono text-2xl font-semibold tabular-nums",
            tone === "destructive" && "text-destructive"
          )}
        >
          {value}
        </div>
      ) : state === "loading" ? (
        <div
          role="status"
          className="text-sm text-muted-foreground"
        >
          Memuat...
        </div>
      ) : (
        <div role="alert" className="text-sm text-destructive">
          Gagal dimuat
        </div>
      )}
      {hint ? (
        <span className="text-sm text-muted-foreground">{hint}</span>
      ) : null}
    </Card>
  )
}
