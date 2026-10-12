import type { QueryClient } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { setAccessToken } from "@/lib/api/refresh"
import {
  API,
  FIXTURE_OTHER_SESSION,
  FIXTURE_SESSION,
} from "@/test/handlers/auth"
import { server } from "@/test/server"
import type { Session } from "@/types/session"

import { SessionsPage } from "./sessions-page"
import {
  newTestQueryClient,
  renderWithProviders,
  TEST_API_BASE_URL,
} from "./test-helpers"

let queryClient: QueryClient

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", TEST_API_BASE_URL)
  setAccessToken(null)
  queryClient = newTestQueryClient()
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  vi.spyOn(console, "warn").mockImplementation(() => undefined)
})

afterEach(() => {
  cleanup()
  queryClient.clear()
  setAccessToken(null)
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

/**
 * Serves the sessions list from `state` and applies the revoke calls to it, so
 * the list refetches the way the server would after a revoke.
 */
function serveSessions(initial: readonly Session[]) {
  let sessions: readonly Session[] = initial
  const deletedIds: string[] = []
  let revokeAllCalls = 0
  server.use(
    http.get(`${API}/sessions`, () => HttpResponse.json({ data: sessions })),
    http.delete(`${API}/sessions/:sessionId`, ({ params }) => {
      deletedIds.push(String(params.sessionId))
      sessions = sessions.filter(
        (session) => session.sessionId !== params.sessionId
      )
      return HttpResponse.json({ data: { status: "SESSION_REVOKED" } })
    }),
    http.delete(`${API}/sessions`, () => {
      revokeAllCalls += 1
      const revoked = sessions.filter((session) => !session.isCurrent).length
      sessions = sessions.filter((session) => session.isCurrent)
      return HttpResponse.json({
        data: { status: "SESSIONS_REVOKED", count: revoked },
      })
    })
  )
  return {
    deletedIds,
    revokeAllCalls: () => revokeAllCalls,
  }
}

describe("SessionsPage (D4.9)", () => {
  it("marks the current session with a badge and never offers revoke for it", async () => {
    serveSessions([FIXTURE_SESSION, FIXTURE_OTHER_SESSION])
    renderWithProviders(<SessionsPage />, queryClient)

    const currentRow = (
      await screen.findByText(FIXTURE_SESSION.ipAddress)
    ).closest("tr")
    expect(currentRow).not.toBeNull()
    if (currentRow === null) return
    expect(within(currentRow).getByText("Sesi ini")).toBeInTheDocument()
    expect(within(currentRow).queryByRole("button")).toBeNull()

    expect(
      screen.queryByRole("button", {
        name: `Cabut sesi dari ${FIXTURE_SESSION.ipAddress}`,
      })
    ).toBeNull()
    expect(
      screen.getByRole("button", {
        name: `Cabut sesi dari ${FIXTURE_OTHER_SESSION.ipAddress}`,
      })
    ).toBeInTheDocument()
  })

  it("revokes one other session by its id and refreshes the list", async () => {
    const { deletedIds } = serveSessions([
      FIXTURE_SESSION,
      FIXTURE_OTHER_SESSION,
    ])
    renderWithProviders(<SessionsPage />, queryClient)

    fireEvent.click(
      await screen.findByRole("button", {
        name: `Cabut sesi dari ${FIXTURE_OTHER_SESSION.ipAddress}`,
      })
    )

    await waitFor(() =>
      expect(deletedIds).toEqual([FIXTURE_OTHER_SESSION.sessionId])
    )
    await waitFor(() =>
      expect(screen.queryByText(FIXTURE_OTHER_SESSION.ipAddress)).toBeNull()
    )
    expect(screen.getByText(FIXTURE_SESSION.ipAddress)).toBeInTheDocument()
  })

  it("asks for a second step before revoking all other sessions, and then sends one call", async () => {
    const state = serveSessions([FIXTURE_SESSION, FIXTURE_OTHER_SESSION])
    renderWithProviders(<SessionsPage />, queryClient)

    fireEvent.click(
      await screen.findByRole("button", { name: "Cabut semua sesi lain" })
    )
    expect(
      screen.getByText(
        "Cabut semua sesi lain? Sesi di perangkat ini tetap aktif."
      )
    ).toBeInTheDocument()
    expect(state.revokeAllCalls()).toBe(0)

    fireEvent.click(
      screen.getByRole("button", { name: "Ya, cabut semua sesi lain" })
    )

    await waitFor(() => expect(state.revokeAllCalls()).toBe(1))
    await waitFor(() =>
      expect(screen.queryByText(FIXTURE_OTHER_SESSION.ipAddress)).toBeNull()
    )
    expect(screen.getByText(FIXTURE_SESSION.ipAddress)).toBeInTheDocument()
  })

  it("disables revoke all when the current session is the only one", async () => {
    serveSessions([FIXTURE_SESSION])
    renderWithProviders(<SessionsPage />, queryClient)

    expect(
      await screen.findByRole("button", { name: "Cabut semua sesi lain" })
    ).toBeDisabled()
  })
})
