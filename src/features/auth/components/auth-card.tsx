import type { ReactNode } from "react"

interface AuthCardProps {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
}

/**
 * The page frame for the signed-out and account forms: a white card on the
 * grey canvas, so the text never sits straight on the page background. Its h1
 * takes focus after a route change (D16).
 */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <section className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <header className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {title}
          </h1>
          {description !== undefined ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </header>
        {children}
      </section>
    </div>
  )
}
