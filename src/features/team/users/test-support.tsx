/**
 * Shared setup for the system user component tests. Not a test file itself
 * (vitest matches *.test.*). Each test file still owns its own `vi.mock` calls,
 * which vitest hoists per file.
 */

import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { render, type RenderResult } from "@testing-library/react"
import type { ReactElement } from "react"

import { DialogsProvider } from "@/components/dialogs/dialogs"

export const ALL_USER_PERMISSIONS: readonly string[] = [
  "system_users:view",
  "system_users:create",
  "system_users:update",
  "system_users:delete",
  "system_users:reset_password",
  "system_roles:view",
  "sessions:view",
  "sessions:revoke",
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
