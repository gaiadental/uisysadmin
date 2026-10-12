// @vitest-environment jsdom
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createQueryClient } from "@/lib/query/client"
import { applyInvalidation } from "@/lib/query/invalidation"

import { REFUSED_ROLES_KEY, useRefusedRoles } from "./refused-roles"

let queryClient: QueryClient

beforeEach(() => {
  queryClient = createQueryClient()
})
afterEach(() => {
  cleanup()
  queryClient.clear()
})

function setup() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useRefusedRoles(), { wrapper })
}

describe("useRefusedRoles (OQ-P-46)", () => {
  it("starts empty, marks per role, and is idempotent", async () => {
    const { result } = setup()
    expect(result.current.isRefused(2)).toBe(false)

    act(() => result.current.markRefused(2))
    act(() => result.current.markRefused(2))

    await waitFor(() => expect(result.current.isRefused(2)).toBe(true))
    expect(result.current.isRefused(3)).toBe(false)
    expect(queryClient.getQueryData(REFUSED_ROLES_KEY)).toEqual([2])
  })

  it("is shared by two hook consumers on the same client", async () => {
    const first = setup()
    const second = setup()
    act(() => first.result.current.markRefused(7))
    await waitFor(() => expect(second.result.current.isRefused(7)).toBe(true))
  })

  it("is cleared by queryClient.clear() (logout, D12.2)", async () => {
    const first = setup()
    act(() => first.result.current.markRefused(2))
    await waitFor(() => expect(first.result.current.isRefused(2)).toBe(true))

    // Logout leaves the protected screens, so the consumer unmounts, then the cache is cleared.
    first.unmount()
    act(() => queryClient.clear())
    expect(queryClient.getQueryData(REFUSED_ROLES_KEY)).toBeUndefined()

    const next = setup()
    expect(next.result.current.isRefused(2)).toBe(false)
  })

  it("survives role and permission invalidations (key outside the D12.1 families)", async () => {
    const { result } = setup()
    act(() => result.current.markRefused(2))
    await waitFor(() => expect(result.current.isRefused(2)).toBe(true))

    await applyInvalidation(queryClient, { kind: "systemRoleWrite", roleId: 2 })
    await applyInvalidation(queryClient, {
      kind: "rolePermissionsReplace",
      roleId: 2,
    })
    await applyInvalidation(queryClient, { kind: "masterPermissionWrite" })

    expect(queryClient.getQueryData(REFUSED_ROLES_KEY)).toEqual([2])
    expect(result.current.isRefused(2)).toBe(true)
  })
})
