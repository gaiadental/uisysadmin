/**
 * Per-route error boundary (ARCH-FE-001 D10, D13). The router wraps each
 * route's lazy page in one instance, so a render or chunk-load failure stays
 * inside that route. The fallback offers a reload. The development log line
 * carries only the route key and the error name (REQ-FE-046, D18).
 */

import { Component, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import type { RouteKey } from "@/lib/routes-meta"

interface RouteErrorBoundaryProps {
  readonly routeKey: RouteKey
  readonly children: ReactNode
}

interface RouteErrorBoundaryState {
  readonly failed: boolean
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: unknown): void {
    if (import.meta.env.DEV) {
      console.error("Route render failed.", {
        route: this.props.routeKey,
        kind: error instanceof Error ? error.name : "UNKNOWN",
      })
    }
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return (
      <section
        aria-labelledby="route-error-title"
        className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center"
      >
        <h1 id="route-error-title" className="text-lg font-semibold">
          Halaman gagal dimuat
        </h1>
        <p className="text-sm text-muted-foreground">
          Muat ulang halaman untuk mencoba lagi.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Muat ulang halaman
        </Button>
      </section>
    )
  }
}
