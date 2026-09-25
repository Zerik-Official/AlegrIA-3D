/**
 * Drives the Libro de Rosa's HUD companion in the open phases (Phase 1 and
 * Phase 2), where the player roams freely and used to have to hunt for the
 * portal: the book floats calmly while the narration plays, channels energy
 * for a while once it's over, then grows restless, glides to the center of
 * the screen and opens the portal right in front of the player.
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

/** Where the summoned portal stands: its center, and the Y rotation turning its face (local `+Z`) towards the player. */
export interface PortalPlacement {
  position: [number, number, number]
  yaw: number
}

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
  /** Where the summoned portal was placed, or `null` before it exists. */
  portal: PortalPlacement | null
  /** Records where the summoned portal landed; called once by the in-scene portal. */
  handlePortalPlaced: (placement: PortalPlacement) => void
}

/**
 * @param active - Whether an open phase's scene is on screen (including while its portal is being crossed)
 * @param phaseKey - Identifies that open phase, so the choreography restarts on every new one
 * @param dialogEnded - Whether that phase's narration has played through (see `useNarration`)
 * @param dialogHeard - Whether that phase's narration has been heard at all — without it, the missing-audio fallback ends the wait
 * @returns Choreography state and the portal placement callback
 */
export function useStoryBookFlow(active: boolean, phaseKey: string, dialogEnded: boolean, dialogHeard: boolean): StoryBookFlow {
  const [stage, setStage] = useState<StoryBookStage>('hidden')
  const [fallbackEnded, setFallbackEnded] = useState(false)
  const [showPortalTitle, setShowPortalTitle] = useState(false)
  const [portal, setPortal] = useState<PortalPlacement | null>(null)
  const [waitTitle, setWaitTitle] = useState<'channeling' | 'explore' | null>(null)
  const [portalCountdownSec, setPortalCountdownSec] = useState<number | null>(null)
  const heardRef = useRef(dialogHeard)

  useEffect(() => {
    heardRef.current = dialogHeard
  }, [dialogHeard])

  useEffect(() => {
    setFallbackEnded(false)
    setShowPortalTitle(false)
    setPortal(null)
    setWaitTitle(null)
    setPortalCountdownSec(null)
    setStage(active ? 'calm' : 'hidden')
    if (!active) return
    const id = window.setTimeout(() => {
      if (!heardRef.current) setFallbackEnded(true)
    }, appConfig.storyBook.dialogFallbackMs)
    return () => window.clearTimeout(id)
  }, [active, phaseKey])

  const waitStarted = active && (dialogEnded || fallbackEnded)

  useEffect(() => {
    if (!waitStarted) return
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
    return () => {
      ids.forEach((id) => window.clearTimeout(id))
      window.clearInterval(intervalId)
    }
  }, [waitStarted])

  const handlePortalPlaced = useCallback((placement: PortalPlacement) => setPortal(placement), [])

  return { stage, portalOpen: stage === 'portal', showPortalTitle, waitTitle, portalCountdownSec, portal, handlePortalPlaced }
}
