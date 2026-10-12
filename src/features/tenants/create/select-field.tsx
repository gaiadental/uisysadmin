/**
 * A labelled native select for the tenant forms (ARCH-FE-001 D9, D16). A
 * native element gives keyboard access, an associated label and screen reader
 * support without extra code, and works with React Hook Form `register`.
 * An empty value is the "none" option.
 */

import type { ComponentProps } from "react"
import { IconChevronDown } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

export interface SelectOption {
  readonly value: string
  readonly label: string
}

interface SelectFieldProps extends ComponentProps<"select"> {
  readonly options: readonly SelectOption[]
  /** Text of the empty option. Shown first. */
  readonly placeholder: string
}

export function SelectField({
  options,
  placeholder,
  className,
  ...props
}: SelectFieldProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full min-w-0 appearance-none rounded-xl border border-input bg-card py-1 pr-10 pl-4 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}
