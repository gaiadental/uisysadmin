import * as React from "react"
import { IconInfoCircle } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type InfoTooltipProps = {
  /** Penjelasan untuk presentasi — konteks bisnis, bukan label aksi. */
  children: React.ReactNode
  side?: React.ComponentProps<typeof TooltipContent>["side"]
  className?: string
}

/**
 * Ikon "i" kecil di sebelah judul halaman/bagian — anotasi untuk demo ke
 * atasan/stakeholder. Beda dari IconButton+Tooltip (yang menjelaskan aksi):
 * ini menjelaskan *konteks* — kenapa halaman/bagian ini ada, siapa
 * pemakainya, aturan bisnis kuncinya.
 *
 * Contoh:
 *   <PageHeader title="Daftar tenant" annotation="..." />
 *   <SectionInfo>Checklist ini dipakai saat …</SectionInfo>
 */
export function InfoTooltip({
  children,
  side = "right",
  className,
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label="Penjelasan"
          />
        }
      >
        <IconInfoCircle className="size-full" />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn("max-w-xs text-left leading-snug", className)}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Baris catatan konteks untuk sub-bagian halaman (mis. di atas satu tabel
 * atau satu tab) — dipakai saat konteksnya butuh lebih dari satu kalimat
 * dan lebih pas ditulis langsung daripada disembunyikan di tooltip.
 */
export function SectionNote({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <IconInfoCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
