import * as React from "react"
import type { IconType } from "@/lib/icon"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ButtonProps = React.ComponentProps<typeof Button>

export type IconButtonProps = Omit<ButtonProps, "children"> & {
  /** Ikon dari @tabler/icons-react, mis. `IconPower`, `IconTrash`, `IconEye`. */
  icon: IconType
  /** Teks tooltip + label aksesibilitas. Wajib. */
  label: string
  /** Sisi kemunculan tooltip. */
  tooltipSide?: React.ComponentProps<typeof TooltipContent>["side"]
}

/**
 * Tombol aksi ikon-saja untuk baris tabel & header.
 * Selalu terbungkus Tooltip shadcn/ui dan punya label sr-only.
 * Tooltip tetap tampil walau tombol `disabled` (trigger dibungkus <span>).
 *
 * Contoh:
 *   <IconButton icon={IconPower} label="Nonaktifkan tenant" onClick={fn} />
 *   <IconButton icon={IconTrash} label="Hapus tenant" variant="destructive" />
 */
export function IconButton({
  icon: Icon,
  label,
  tooltipSide = "top",
  variant = "ghost",
  size = "icon-sm",
  className,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>
        <Button
          type="button"
          variant={variant}
          size={size}
          disabled={disabled}
          aria-label={label}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            variant === "destructive" && "text-destructive hover:text-destructive",
            className
          )}
          {...props}
        >
          <Icon aria-hidden />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Grup tombol aksi baris tabel — jarak rapat & rata kanan. */
export function IconButtonGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center justify-end gap-0.5", className)}
      {...props}
    />
  )
}
