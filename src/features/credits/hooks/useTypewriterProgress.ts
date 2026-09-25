/**
 * Advances a character count at a fixed rate up to `totalLength`, then stops
 * — drives the credits roll's letter-by-letter reveal, written once and left
 * on screen rather than retyped in a loop.
 * @module features/credits/hooks/useTypewriterProgress
 */

import { useEffect, useState } from 'react'

/**
 * @param totalLength - Characters to reveal
 * @param charsPerSecond - Reveal speed
 * @returns How many characters are currently revealed, `[0, totalLength]`
 */
export function useTypewriterProgress(totalLength: number, charsPerSecond = 26): number {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    if (totalLength <= 0) {
      setRevealed(0)
      return
    }
    let raf = 0
    const start = performance.now()

    const tick = (now: number): void => {
      const count = Math.min(totalLength, Math.floor(((now - start) / 1000) * charsPerSecond))
      setRevealed(count)
      if (count < totalLength) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [totalLength, charsPerSecond])

  return revealed
}
