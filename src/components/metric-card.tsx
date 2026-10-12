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
        "gap-3 p-5",
        tone === "destructive" && "ring-destructive/30 bg-destructive/5"
      )}
    >
      <div className="flex items-center gap-3">
        {Icon ? (
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
              tone === "destructive" && "bg-destructive/10 text-destructive"
            )}
          >
            <Icon className="size-5" />
          </span>
        ) : null}
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </div>
      {state === "ready" ? (
        <div
          className={cn(
            "font-heading text-3xl font-semibold tabular-nums",
            tone === "destructive" && "text-destructive"
          )}
        >
          {value}
        </div>
      ) : state === "loading" ? (
        <div role="status" className="text-sm text-muted-foreground">
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
