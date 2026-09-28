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
  /** Whether the portal wait is counting down right now — the only moment `T` ({@link skipWait}) does anything. */
  canSkipWait: boolean
  /**
   * Skips straight to the book growing restless and summoning the portal,
   * bypassing the rest of the wait after the narration. Only takes effect
   * while that wait is counting down ({@link canSkipWait}); presses at any
   * other time are ignored and never carried over.
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
  const [stage, setStage] = useState<StoryBookStage>(active ? 'calm' : 'hidden')
  const [fallbackEnded, setFallbackEnded] = useState(false)
  const [showPortalTitle, setShowPortalTitle] = useState(false)
  const [showOverloadTitle, setShowOverloadTitle] = useState(false)
  const [portal, setPortal] = useState<PortalPlacement | null>(null)
  const [waitTitle, setWaitTitle] = useState<'channeling' | 'explore' | null>(null)
  const [portalCountdownSec, setPortalCountdownSec] = useState<number | null>(null)
  const heardRef = useRef(dialogHeard)
  const [skipRequested, setSkipRequested] = useState(false)

  useEffect(() => {
    heardRef.current = dialogHeard
  }, [dialogHeard])

  const flowKey = `${active}:${phaseKey}`
  const [prevFlowKey, setPrevFlowKey] = useState(flowKey)
  if (flowKey !== prevFlowKey) {
    setPrevFlowKey(flowKey)
    setFallbackEnded(false)
    setShowPortalTitle(false)
    setShowOverloadTitle(false)
    setPortal(null)
    setWaitTitle(null)
    setPortalCountdownSec(null)
    setSkipRequested(false)
    setStage(active ? 'calm' : 'hidden')
  }

  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(() => {
      if (!heardRef.current) setFallbackEnded(true)
    }, appConfig.storyBook.dialogFallbackMs)
    return () => window.clearTimeout(id)
  }, [active, phaseKey])

  const waitStarted = flowKey === prevFlowKey && active && (dialogEnded || fallbackEnded)
  const waitKey = waitStarted ? (skipRequested ? 'skip' : 'wait') : 'idle'
  const [prevWaitKey, setPrevWaitKey] = useState<'idle' | 'wait' | 'skip'>('idle')
  if (waitKey !== prevWaitKey) {
    setPrevWaitKey(waitKey)
    if (waitKey === 'skip') {
      setShowOverloadTitle(true)
      setWaitTitle(null)
      setPortalCountdownSec(null)
    } else if (waitKey === 'wait') {
      setWaitTitle('channeling')
      setPortalCountdownSec(Math.ceil(appConfig.storyBook.waitAfterDialogMs / 1000))
    }
  }

  useEffect(() => {
    if (!waitStarted) return
    const { waitAfterDialogMs, restlessMs, summonMs, portalTitleMs, channelingTitleMs, exploreTitleMs } = appConfig.storyBook
    const skipped = skipRequested
    const restlessDelay = skipped ? OVERLOAD_TITLE_MS : waitAfterDialogMs

    const ids: number[] = []
    let intervalId: number | undefined

    if (skipped) {
      ids.push(window.setTimeout(() => setShowOverloadTitle(false), OVERLOAD_TITLE_MS))
    } else {
      const restlessAt = performance.now() + restlessDelay
      const tick = (): void => {
        const left = Math.max(0, Math.ceil((restlessAt - performance.now()) / 1000))
        setPortalCountdownSec(left > 0 ? left : null)
      }
      intervalId = window.setInterval(tick, 250)
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
  }, [waitStarted, skipRequested])

  const canSkipWait = waitKey === 'wait' && stage === 'calm'

  const skipWait = useCallback(() => {
    if (!canSkipWait) return
    setSkipRequested(true)
  }, [canSkipWait])

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
    canSkipWait,
    skipWait,
  }
}
