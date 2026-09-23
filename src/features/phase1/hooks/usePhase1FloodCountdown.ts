/**
 * Countdown to Phase 1's next periodic street flood.
 * @module features/phase1/hooks/usePhase1FloodCountdown
 */

import { useEffect, useState } from 'react'
import { phase1FloodConfig } from '@/features/phase1/config/phase1Flood'

/** Phase 1 flood countdown state. */
export interface Phase1FloodCountdown {
  /** Whether the map is currently in its flood window (rising, held, or receding). */
  isFlooding: boolean
  /** Whole seconds remaining until the next flood begins. */
  secondsUntilNext: number
}

/**
 * Ticks off {@link phase1FloodConfig}'s cycle so HUD elements can show how
 * long until the map floods again.
 * @returns Current flood countdown state
 */
export function usePhase1FloodCountdown(): Phase1FloodCountdown {
  const [state, setState] = useState<Phase1FloodCountdown>({
    isFlooding: false,
    secondsUntilNext: Math.ceil(phase1FloodConfig.cycleSeconds),
  })

  useEffect(() => {
    const start = performance.now()
    const tick = () => {
      const { cycleSeconds, riseDuration, holdDuration, recedeDuration } = phase1FloodConfig
      const elapsed = (performance.now() - start) / 1000
      const t = elapsed % cycleSeconds
      const floodEnd = riseDuration + holdDuration + recedeDuration
      setState({ isFlooding: t < floodEnd, secondsUntilNext: Math.ceil(cycleSeconds - t) })
    }
    const id = setInterval(tick, 250)
    tick()
    return () => clearInterval(id)
  }, [])

  return state
}
