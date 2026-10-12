import * as React from "react"

import { cn } from "@/lib/utils"
import { InfoTooltip } from "@/components/info-tooltip"

type PageHeaderProps = {
  title: string
  description?: string
  /**
   * Catatan konteks untuk presentasi (hover ikon "i" di sebelah judul) —
   * kenapa halaman ini ada, siapa pemakainya, aturan bisnis kuncinya.
   * Beda dari `description`, yang tetap tampil sebagai teks biasa.
   */
  annotation?: React.ReactNode
  /** Tombol aksi tingkat halaman (mis. Tambah tenant, Cabut sesi). */
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  annotation,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 pb-1 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="flex items-center gap-1.5 font-heading text-2xl font-semibold tracking-tight">
          {title}
          {annotation ? <InfoTooltip>{annotation}</InfoTooltip> : null}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

/** Pembungkus konten halaman — padding & lebar maksimum konsisten. */
export function PageBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6",
        className
      )}
      {...props}
    />
  )
}
