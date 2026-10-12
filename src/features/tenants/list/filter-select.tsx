/**
 * One labelled filter select for the tenant list (ARCH-FE-001 D8.1, D16). An
 * empty `value` means "no filter" and shows the first option, which carries
 * the "all" label.
 */

import { useId } from "react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ALL_VALUE } from "./list-filters"

export interface FilterOption {
  readonly value: string
  readonly label: string
}

interface FilterSelectProps {
  readonly label: string
  /** The selected value, or "" for no filter. */
  readonly value: string
  /** The first option is the "all" option and has the value ALL_VALUE. */
  readonly options: readonly FilterOption[]
  readonly onChange: (value: string) => void
  readonly disabled?: boolean
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: FilterSelectProps) {
  const triggerId = useId()
  return (
    <div className="flex flex-col gap-1.5 sm:w-48">
      <Label htmlFor={triggerId} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select
        value={value === "" ? ALL_VALUE : value}
        items={[...options]}
        disabled={disabled}
        onValueChange={(next) => {
          onChange(next === null || next === ALL_VALUE ? "" : String(next))
        }}
      >
        <SelectTrigger id={triggerId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
