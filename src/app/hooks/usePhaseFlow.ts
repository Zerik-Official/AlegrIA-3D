/**
 * Owns the game's phase state machine: current phase, the wormhole transition
 * timeline between phases, and the two per-phase intro overlays.
 * @module app/hooks/usePhaseFlow
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { appConfig } from '@/shared/config/appConfig'
import { easeCubicInOut } from '@/shared/utils/perf'
import type { GamePhase } from '@/shared/types'
import { WormholeTimeline } from '@/app/engine/WormholeTimeline'

/** Public state and actions exposed by {@link usePhaseFlow}. */
export interface PhaseFlow {
  /** Current game phase. */
  phase: GamePhase
  /** Wormhole transition progress in [0,1]. */
  wormholeProgress: number
  /** Phase the current (or most recent) wormhole transition leads to. */
  wormholeTarget: GamePhase
  /** Whether Phase 1's intro overlay is showing. */
  showPhase1Overlay: boolean
  /** Whether Phase 2's intro overlay is showing. */
  showPhase2Overlay: boolean
  /** Whether `phase` currently resolves to Phase 1 (including the `museum` alias). */
  isPhase1: boolean
  /** Whether `phase` currently resolves to Phase 2. */
  isPhase2: boolean
  /** Transitions from `idle` into `exploring`. */
  startExploring: () => void
  /** Starts the wormhole transition into Phase 1. */
  startWormholeToPhase1: () => void
  /** Starts the wormhole transition into Phase 2. */
  startWormholeToPhase2: () => void
  /** Dismisses the Phase 1 intro overlay. */
  dismissPhase1Intro: () => void
  /** Dismisses the Phase 2 intro overlay. */
  dismissPhase2Intro: () => void
  /** Reloads the page to return to the library from Phase 2. */
  returnToLibrary: () => void
}

/**
 * @returns Phase flow state and transition actions
 */
export function usePhaseFlow(): PhaseFlow {
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [wormholeProgress, setWormholeProgress] = useState(0)
  const [wormholeTarget, setWormholeTarget] = useState<GamePhase>('phase1')
  const [showPhase1Overlay, setShowPhase1Overlay] = useState(true)
  const [showPhase2Overlay, setShowPhase2Overlay] = useState(true)
  const timeline = useRef(new WormholeTimeline()).current

  const isPhase1 = phase === 'phase1' || phase === 'museum'
  const isPhase2 = phase === 'phase2'

  const startWormhole = useCallback(
    (target: GamePhase) => {
      if (phase === 'wormhole' || phase === target) return
      setWormholeTarget(target)
      setPhase('wormhole')
      timeline.start(appConfig.wormhole.durationMs, easeCubicInOut, setWormholeProgress, () => {
        setPhase(target)
        setWormholeProgress(0)
        if (target === 'phase1') setShowPhase1Overlay(true)
        if (target === 'phase2') setShowPhase2Overlay(true)
      })
    },
    [phase, timeline]
  )

  const startWormholeToPhase1 = useCallback(() => startWormhole('phase1'), [startWormhole])
  const startWormholeToPhase2 = useCallback(() => startWormhole('phase2'), [startWormhole])
  const startExploring = useCallback(() => setPhase('exploring'), [])
  const dismissPhase1Intro = useCallback(() => setShowPhase1Overlay(false), [])
  const dismissPhase2Intro = useCallback(() => setShowPhase2Overlay(false), [])
  const returnToLibrary = useCallback(() => window.location.reload(), [])

  useEffect(() => () => timeline.cancel(), [timeline])

  return {
    phase,
    wormholeProgress,
    wormholeTarget,
    showPhase1Overlay,
    showPhase2Overlay,
    isPhase1,
    isPhase2,
    startExploring,
    startWormholeToPhase1,
    startWormholeToPhase2,
    dismissPhase1Intro,
    dismissPhase2Intro,
    returnToLibrary,
  }
}
