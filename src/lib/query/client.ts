/**
 * QueryClient defaults (ARCH-FE-001 D12.2, D3.1). Retry is off, so reads are
 * never retried automatically. Window-focus refetch is off, so a focus event
 * never rotates the refresh token (D4.3). There is no persister: the cache is
 * memory only. Staleness is set per resource in its own TODO.
 */

import { QueryClient } from "@tanstack/react-query"

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
