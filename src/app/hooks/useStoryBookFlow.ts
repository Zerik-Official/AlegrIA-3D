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

/** How long the "book overloaded" skip title stays up before the restless/summon/portal sequence kicks in. */
const OVERLOAD_TITLE_MS = 2200

/** Public state exposed by {@link useStoryBookFlow}. */
export interface StoryBookFlow {
  /** Current beat of the choreography. */
  stage: StoryBookStage
  /** Whether the portal has been summoned and can be crossed. */
  portalOpen: boolean
  /** Whether the "portal opened" title is still showing. */
  showPortalTitle: boolean
  /** Whether the "book overloaded" skip title is showing (see `skipWait`). */
  showOverloadTitle: boolean
  /** Which title follows the narration's end while the book gathers energy: first `channeling`, then `explore`, then none. */
  waitTitle: 'channeling' | 'explore' | null
  /** Whole seconds left until the book grows restless and summons the portal, or `null` outside that wait. */
  portalCountdownSec: number | null
  /** Where the summoned portal was placed, or `null` before it exists. */
  portal: PortalPlacement | null
  /** Records where the summoned portal landed; called once by the in-scene portal. */
  handlePortalPlaced: (placement: PortalPlacement) => void
  /**
   * Skips straight to the book growing restless and summoning the portal —
   * bound to `T`. Only takes effect before the portal has been summoned
   * (`stage === 'calm'`); shows the "book overloaded" title in place of the
   * usual minute-long wait.
   */
  skipWait: () => void
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
  const [showOverloadTitle, setShowOverloadTitle] = useState(false)
  const [portal, setPortal] = useState<PortalPlacement | null>(null)
  const [waitTitle, setWaitTitle] = useState<'channeling' | 'explore' | null>(null)
  const [portalCountdownSec, setPortalCountdownSec] = useState<number | null>(null)
  const heardRef = useRef(dialogHeard)
  /** Set by `skipWait`; read once when the wait effect (re-)starts, so a `T` press during narration also skips the wait once it begins. */
  const skipRequestedRef = useRef(false)
  const [skipToken, setSkipToken] = useState(0)

  useEffect(() => {
    heardRef.current = dialogHeard
  }, [dialogHeard])

  useEffect(() => {
    setFallbackEnded(false)
    setShowPortalTitle(false)
    setShowOverloadTitle(false)
    setPortal(null)
    setWaitTitle(null)
    setPortalCountdownSec(null)
    skipRequestedRef.current = false
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
    const skipped = skipRequestedRef.current
    const restlessDelay = skipped ? OVERLOAD_TITLE_MS : waitAfterDialogMs

    const ids: number[] = []
    let intervalId: number | undefined

    if (skipped) {
      setShowOverloadTitle(true)
      setWaitTitle(null)
      setPortalCountdownSec(null)
      ids.push(window.setTimeout(() => setShowOverloadTitle(false), OVERLOAD_TITLE_MS))
    } else {
      const restlessAt = performance.now() + restlessDelay
      const tick = (): void => {
        const left = Math.max(0, Math.ceil((restlessAt - performance.now()) / 1000))
        setPortalCountdownSec(left > 0 ? left : null)
      }
      tick()
      intervalId = window.setInterval(tick, 250)
      setWaitTitle('channeling')
      ids.push(window.setTimeout(() => setWaitTitle('explore'), channelingTitleMs))
      ids.push(window.setTimeout(() => setWaitTitle(null), channelingTitleMs + exploreTitleMs))
    }

    ids.push(
      window.setTimeout(() => {
        if (intervalId !== undefined) window.clearInterval(intervalId)
        setPortalCountdownSec(null)
        setStage('restless')
      }, restlessDelay)
    )
    ids.push(window.setTimeout(() => setStage('summoning'), restlessDelay + restlessMs))
    ids.push(
      window.setTimeout(() => {
        setStage('portal')
        setShowPortalTitle(true)
      }, restlessDelay + restlessMs + summonMs)
    )
    ids.push(window.setTimeout(() => setShowPortalTitle(false), restlessDelay + restlessMs + summonMs + portalTitleMs))

    return () => {
      ids.forEach((id) => window.clearTimeout(id))
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [waitStarted, skipToken])

  const skipWait = useCallback(() => {
    if (stage !== 'calm' || skipRequestedRef.current) return
    skipRequestedRef.current = true
    setSkipToken((n) => n + 1)
  }, [stage])

  const handlePortalPlaced = useCallback((placement: PortalPlacement) => setPortal(placement), [])

  return {
    stage,
    portalOpen: stage === 'portal',
    showPortalTitle,
    showOverloadTitle,
    waitTitle,
    portalCountdownSec,
    portal,
    handlePortalPlaced,
    skipWait,
  }
}
