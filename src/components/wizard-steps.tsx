import { IconCheck } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

export type WizardStep = {
  id: string
  title: string
  /** Enum teknis singkat untuk ditampilkan font-mono. */
  key: string
}

type WizardStepsProps = {
  steps: WizardStep[]
  /** Indeks langkah aktif (0-based). */
  current: number
  /** Loncat ke langkah tertentu (hanya langkah yang sudah dilewati). */
  onStepClick?: (index: number) => void
}

export function WizardSteps({ steps, current, onStepClick }: WizardStepsProps) {
  return (
    <ol className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0">
      {steps.map((step, i) => {
        const state =
          i < current ? "done" : i === current ? "active" : "upcoming"
        const clickable = i < current && !!onStepClick
        return (
          <li key={step.id} className="flex flex-1 items-center gap-3">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(i)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-1 py-1 text-left transition-colors",
                clickable && "hover:opacity-80"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs tabular-nums",
                  state === "done" &&
                    "border-primary bg-primary text-primary-foreground",
                  state === "active" && "border-primary text-primary",
                  state === "upcoming" &&
                    "border-border text-muted-foreground"
                )}
              >
                {state === "done" ? (
                  <IconCheck className="size-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              <span className="flex flex-col leading-tight">
                <span
                  className={cn(
                    "text-sm font-medium",
                    state === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
                <code className="font-mono text-xs text-muted-foreground">
                  {step.key}
                </code>
              </span>
            </button>
            {i < steps.length - 1 ? (
              <span
                className={cn(
                  "hidden h-px flex-1 sm:block",
                  i < current ? "bg-primary" : "bg-border"
                )}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
