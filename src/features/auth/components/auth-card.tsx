import type { ReactNode } from "react"

interface AuthCardProps {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
}

/** The page frame for the signed-out and account forms. Its h1 takes focus after a route change (D16). */
export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <section className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold text-foreground">
          {title}
        </h1>
        {description !== undefined ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  )
}
