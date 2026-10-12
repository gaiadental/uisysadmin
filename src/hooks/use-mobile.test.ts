// @vitest-environment jsdom
/**
 * useIsMobile (TODO-017 scope extension, OQ-P-60): the hook now reads the
 * viewport through useSyncExternalStore. Behaviour is unchanged: mobile means
 * a width below 768 px, and a media query change re-renders the hook.
 */

import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useIsMobile } from "./use-mobile"

type Listener = () => void

let listeners: Set<Listener>
let removed: number
let queries: string[]
const originalWidth = window.innerWidth

function setWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  })
}

beforeEach(() => {
  listeners = new Set()
  removed = 0
  queries = []
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => {
      queries.push(query)
      return {
        matches: false,
        media: query,
        addEventListener: (_type: string, listener: Listener) => {
          listeners.add(listener)
        },
        removeEventListener: (_type: string, listener: Listener) => {
          removed += 1
          listeners.delete(listener)
        },
      }
    },
  })
})

afterEach(() => {
  cleanup()
  setWidth(originalWidth)
  vi.restoreAllMocks()
})

describe("useIsMobile", () => {
  it("is true below 768 px", () => {
    setWidth(767)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it("is false at the 768 px boundary and above", () => {
    setWidth(768)
    expect(renderHook(() => useIsMobile()).result.current).toBe(false)
    setWidth(1440)
    expect(renderHook(() => useIsMobile()).result.current).toBe(false)
  })

  it("is true for a very small width", () => {
    setWidth(0)
    expect(renderHook(() => useIsMobile()).result.current).toBe(true)
  })

  it("subscribes to the max-width 767 px query", () => {
    setWidth(1024)
    renderHook(() => useIsMobile())
    expect(queries).toContain("(max-width: 767px)")
    expect(listeners.size).toBe(1)
  })

  it("re-renders when the media query changes", () => {
    setWidth(1024)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
    act(() => {
      setWidth(500)
      listeners.forEach((listener) => listener())
    })
    expect(result.current).toBe(true)
    act(() => {
      setWidth(900)
      listeners.forEach((listener) => listener())
    })
    expect(result.current).toBe(false)
  })

  it("removes its listener on unmount", () => {
    setWidth(1024)
    const { unmount } = renderHook(() => useIsMobile())
    expect(listeners.size).toBe(1)
    unmount()
    expect(removed).toBe(1)
    expect(listeners.size).toBe(0)
  })
})
