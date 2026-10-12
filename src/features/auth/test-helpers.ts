/**
 * Render helpers for the auth component tests. They only build the provider
 * tree, so each test file keeps its own setup (environment, token, location).
 * The file is not a test file itself (vitest matches *.test.*).
 */

import { createElement, type ReactElement } from "react"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { render, type RenderResult } from "@testing-library/react"

import { AuthProvider } from "@/app/providers/auth-provider"
import { AppRouter } from "@/app/router"
import { createQueryClient } from "@/lib/query/client"

export const TEST_API_BASE_URL = "http://sp.test"

export function newTestQueryClient(): QueryClient {
  return createQueryClient()
}

/** Renders one component inside the query client and the auth provider. */
export function renderWithProviders(
  ui: ReactElement,
  queryClient: QueryClient
): RenderResult {
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AuthProvider, null, ui)
    )
  )
}

/**
 * Sets the address bar to `path`, then renders the app router, so the route
 * guard and its redirects run as they do in the app.
 */
export function renderRouterAt(
  path: string,
  queryClient: QueryClient
): RenderResult {
  window.history.replaceState(null, "", path)
  return renderWithProviders(createElement(AppRouter), queryClient)
}
