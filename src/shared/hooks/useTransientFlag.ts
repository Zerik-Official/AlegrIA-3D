/**
 * A flag that turns on when a condition becomes true and switches itself off
 * again after a while — for temporary titles and notices tied to story beats.
 * @module shared/hooks/useTransientFlag
 */

import { useEffect, useState } from 'react'

/**
 * @param when - Condition whose rising edge raises the flag; the flag drops immediately if it turns false
 * @param durationMs - How long the flag stays up after `when` turns true, in ms
 * @returns Whether the flag is currently up
 */
export function useTransientFlag(when: boolean, durationMs: number): boolean {
  const [up, setUp] = useState(false)

  useEffect(() => {
    if (!when) {
      setUp(false)
      return
    }
    setUp(true)
    const id = window.setTimeout(() => setUp(false), durationMs)
    return () => window.clearTimeout(id)
  }, [when, durationMs])

  return up
}
