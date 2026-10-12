import { cn } from "@/lib/utils"

export type WizardStep = {
  id: string
  title: string
}

type WizardStepsProps = {
  steps: WizardStep[]
  /** Indeks langkah aktif (0-based). */
  current: number
  className?: string
}

/** "Langkah n/N" with a thin progress bar. The step title is the heading under it. */
export function WizardSteps({ steps, current, className }: WizardStepsProps) {
  const total = steps.length
  const position = current + 1
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-sm text-muted-foreground">
        Langkah {position}/{total}
        <span className="sr-only">: {steps[current]?.title}</span>
      </p>
      <div
        role="progressbar"
        aria-label="Kemajuan langkah"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={position}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${(position / total) * 100}%` }}
        />
      </div>
    </div>
  )
}
