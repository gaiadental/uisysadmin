import * as React from "react"
import { IconCheck } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

/**
 * A pill choice for a short, mutually exclusive list (2 to 5 options). The
 * input stays a native radio, so keyboard and screen readers work and it
 * registers with React Hook Form. The selected chip shows a check and the
 * primary tint. Pass the radio props; the label is `children`.
 */
function ChoiceChip({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "children"> & {
  children: React.ReactNode
}) {
  return (
    <label
      data-slot="choice-chip"
      className={cn(
        "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-input bg-card px-5 text-sm font-medium transition-colors hover:bg-muted/60 has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-not-allowed has-disabled:opacity-50",
        className
      )}
    >
      <input type="radio" className="peer sr-only" {...props} />
      <IconCheck
        aria-hidden="true"
        className="hidden size-4 peer-checked:block"
      />
      {children}
    </label>
  )
}

export { ChoiceChip }
