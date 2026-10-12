import { useEffect, useState } from "react"

/**
 * A whole-second countdown for the 429 submit lock (D4.5). `remaining` is 0
 * when no lock is running. `start` sets the number of seconds. Each tick
 * schedules the next one, and the timer is cleared on unmount.
 */
export function useCountdown(): {
  readonly remaining: number
  readonly start: (seconds: number) => void
} {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => {
      setRemaining((seconds) => seconds - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  return { remaining, start: setRemaining }
}
