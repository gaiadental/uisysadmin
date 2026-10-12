/**
 * Vitest setup for every test file (ARCH-FE-001 D19). Starts the MSW server,
 * resets per-test overrides and adds the jest-dom matchers. A request without a
 * handler fails the test, so no call reaches the real network.
 */

import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll } from "vitest"

import { server } from "./server"

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
