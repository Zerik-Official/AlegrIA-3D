/**
 * Drives the Libro de Rosa's HUD companion in the open phases (Phase 1 and
 * Phase 2), where the player roams freely and used to have to hunt for the
 * portal: the book floats calmly while the narration plays, and once it has
 * been over for a while it grows restless, glides to the center of the screen
 * and opens the portal right in front of the player.
 * @module app/hooks/useStoryBookFlow
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { appConfig } from '@/shared/config/appConfig'

/**
 * Beat of the companion book's choreography.
 * - `hidden` outside the open phases
 * - `calm` floating over the dialogue/portal indicator, spinning gently on its axis — through the
 *   narration and then the wait while it channels energy for the portal
 * - `restless` spinning brusquely, cover bursting open and pages flipping
 * - `summoning` gliding to the center of the screen while spinning up
 * - `portal` the portal has opened in front of the player; the book fades away
 */
export type StoryBookStage = 'hidden' | 'calm' | 'restless' | 'summoning' | 'portal'

/** Public state exposed by {@link useStoryBookFlow}. */
export interface StoryBookFlow {
  /** Current beat of the choreography. */
  stage: StoryBookStage
  /** Whether the portal has been summoned and can be crossed. */
  portalOpen: boolean
  /** Whether the "portal opened" title is still showing. */
  showPortalTitle: boolean
  /** Which title follows the narration's end while the book gathers energy: first `channeling`, then `explore`, then none. */
  waitTitle: 'channeling' | 'explore' | null
  /** Whole seconds left until the book grows restless and summons the portal, or `null` outside that wait. */
  portalCountdownSec: number | null
  /** World XZ where the summoned portal was placed, or `null` before it exists. */
  portalXZ: [number, number] | null
  /** Records where the summoned portal landed; called once by the in-scene portal. */
  handlePortalPlaced: (xz: [number, number]) => void
}

/**
 * @param active - Whether the player is in an open phase (Phase 1 or Phase 2)
 * @param phaseKey - Identifies the current open phase, so the choreography restarts on every new one
 * @param audioRemainingSec - Seconds remaining in the phase narration; `0` once it has ended, `null` while unknown
 * @returns Choreography state and the portal placement callback
 */
export function useStoryBookFlow(active: boolean, phaseKey: string, audioRemainingSec: number | null): StoryBookFlow {
  const [stage, setStage] = useState<StoryBookStage>('hidden')
  const [dialogEnded, setDialogEnded] = useState(false)
  const [showPortalTitle, setShowPortalTitle] = useState(false)
  const [portalXZ, setPortalXZ] = useState<[number, number] | null>(null)
  const [waitTitle, setWaitTitle] = useState<'channeling' | 'explore' | null>(null)
  const [portalCountdownSec, setPortalCountdownSec] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  /** Whether this phase's narration has been seen playing — gates both its end and the missing-audio fallback. */
  const sawAudio = useRef(false)

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }, [])

  useEffect(() => {
    clearTimers()
    setDialogEnded(false)
    setShowPortalTitle(false)
    setPortalXZ(null)
    setWaitTitle(null)
    setPortalCountdownSec(null)
    sawAudio.current = false
    setStage(active ? 'calm' : 'hidden')
    if (!active) return
    timers.current.push(
      window.setTimeout(() => {
        if (!sawAudio.current) setDialogEnded(true)
      }, appConfig.storyBook.dialogFallbackMs)
    )
  }, [active, phaseKey, clearTimers])

  /**
   * Only a narration seen actually playing in this phase can end: right after
   * a wormhole the previous track's final `0` lingers for a moment, and must
   * not be mistaken for this phase's dialogue having finished.
   */
  useEffect(() => {
    if (!active || typeof audioRemainingSec !== 'number') return
    if (audioRemainingSec > 0) sawAudio.current = true
    else if (sawAudio.current) setDialogEnded(true)
  }, [active, audioRemainingSec])

  useEffect(() => {
    if (!active || !dialogEnded) return
    const { waitAfterDialogMs, restlessMs, summonMs, portalTitleMs, channelingTitleMs, exploreTitleMs } = appConfig.storyBook
    const restlessAt = performance.now() + waitAfterDialogMs
    const tick = (): void => {
      const left = Math.max(0, Math.ceil((restlessAt - performance.now()) / 1000))
      setPortalCountdownSec(left > 0 ? left : null)
    }
    tick()
    const intervalId = window.setInterval(tick, 250)
    setWaitTitle('channeling')
    const ids = [
      window.setTimeout(() => setWaitTitle('explore'), channelingTitleMs),
      window.setTimeout(() => setWaitTitle(null), channelingTitleMs + exploreTitleMs),
      window.setTimeout(() => {
        window.clearInterval(intervalId)
        setPortalCountdownSec(null)
        setStage('restless')
      }, waitAfterDialogMs),
      window.setTimeout(() => setStage('summoning'), waitAfterDialogMs + restlessMs),
      window.setTimeout(() => {
        setStage('portal')
        setShowPortalTitle(true)
      }, waitAfterDialogMs + restlessMs + summonMs),
      window.setTimeout(() => setShowPortalTitle(false), waitAfterDialogMs + restlessMs + summonMs + portalTitleMs),
    ]
    timers.current.push(...ids)
    return () => {
      ids.forEach((id) => window.clearTimeout(id))
      window.clearInterval(intervalId)
    }
  }, [active, dialogEnded])

  useEffect(() => clearTimers, [clearTimers])

  const handlePortalPlaced = useCallback((xz: [number, number]) => setPortalXZ(xz), [])

  return { stage, portalOpen: stage === 'portal', showPortalTitle, waitTitle, portalCountdownSec, portalXZ, handlePortalPlaced }
}
