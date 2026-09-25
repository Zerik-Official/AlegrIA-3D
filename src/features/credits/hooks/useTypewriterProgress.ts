/**
 * Advances a character count at a fixed rate up to `totalLength`, pauses once
 * fully revealed, then restarts from zero — drives the credits roll's
 * letter-by-letter reveal, looping for as long as the scene stays open.
 * @module features/credits/hooks/useTypewriterProgress
 */

import { useEffect, useState } from 'react'

/**
 * @param totalLength - Characters to reveal before looping
 * @param charsPerSecond - Reveal speed
 * @param restartDelayMs - Pause at full reveal before restarting
 * @returns How many characters are currently revealed, `[0, totalLength]`
 */
export function useTypewriterProgress(totalLength: number, charsPerSecond = 26, restartDelayMs = 4000): number {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    if (totalLength <= 0) {
      setRevealed(0)
      return
    }
    let raf = 0
    let restartTimer: number | undefined
    let start = performance.now()

    const tick = (now: number): void => {
      const count = Math.min(totalLength, Math.floor(((now - start) / 1000) * charsPerSecond))
      setRevealed(count)
      if (count < totalLength) {
        raf = requestAnimationFrame(tick)
      } else {
        restartTimer = window.setTimeout(() => {
          start = performance.now()
          setRevealed(0)
          raf = requestAnimationFrame(tick)
        }, restartDelayMs)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      if (restartTimer !== undefined) window.clearTimeout(restartTimer)
    }
  }, [totalLength, charsPerSecond, restartDelayMs])

  return revealed
}