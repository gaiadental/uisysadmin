/**
 * Shared setup for the system role component tests. Not a test file itself
 * (vitest matches *.test.*). Each test file still owns its own `vi.mock` calls.
 */

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { render, type RenderResult } from "@testing-library/react"
import type { ReactElement } from "react"

import { DialogsProvider } from "@/components/dialogs/dialogs"

export const ALL_ROLE_PERMISSIONS: readonly string[] = [
  "system_roles:view",
  "system_roles:create",
  "system_roles:update",
  "system_roles:delete",
  "master_permissions:view",
  "system_users:view",
]

export function renderWithClient(
  ui: ReactElement,
  queryClient: QueryClient
): RenderResult {
  return render(
    <QueryClientProvider client={queryClient}>
      <DialogsProvider>{ui}</DialogsProvider>
    </QueryClientProvider>
  )
}
