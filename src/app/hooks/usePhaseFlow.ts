/**
 * Owns the game's phase state machine: current phase, the wormhole transition
 * timeline between phases, and the two per-phase intro overlays.
 *
 * Flow: `idle` → `exploring` (library, 1st visit) → `phase1` → `phase2` →
 * `exploring` (library, 2nd visit, via the Phase 2 return portal) →
 * `cityIntro` (finale, via the book's second use). Every arrow is a wormhole
 * transition; `libraryVisitCount` is what tells the book which one to start.
 * @module app/hooks/usePhaseFlow
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { appConfig } from '@/shared/config/appConfig'
import { easeCubicInOut } from '@/shared/utils/perf'
import { cityIntroModelUrls } from '@/shared/config/models'
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
  /** Whether `phase` currently resolves to the city intro walk. */
  isCityIntro: boolean
  /** Whether `phase` currently resolves to Phase 1 (including the `museum` alias). */
  isPhase1: boolean
  /** Whether `phase` currently resolves to Phase 2. */
  isPhase2: boolean
  /** How many times `exploring` (the library) has been entered so far — 0 before the first visit. */
  libraryVisitCount: number
  /** Transitions from `idle` straight into `exploring` (the library), where the experience now starts. */
  startExperience: () => void
  /** Transitions from `cityIntro` into `exploring`, once the player has reached the library door. */
  enterLibrary: () => void
  /** Book interaction in the library: first visit heads to Phase 1, the second (and later) heads to the `cityIntro` finale. */
  handleBookInteract: () => void
  /** Starts the wormhole transition into Phase 2 (triggered near the Phase 1 portal). */
  startWormholeToPhase2: () => void
  /** Starts the wormhole transition back to the library (triggered near the Phase 2 portal). */
  startWormholeToLibrary: () => void
  /** Dismisses the Phase 1 intro overlay. */
  dismissPhase1Intro: () => void
  /** Dismisses the Phase 2 intro overlay. */
  dismissPhase2Intro: () => void
  /**
   * Instantly jumps to any phase without the linear walk/wormhole sequence.
   * Intended for editor/dev use: cancels any in-flight wormhole timeline and clears overlays.
   */
  jumpToPhase: (target: GamePhase) => void
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
  const [libraryVisitCount, setLibraryVisitCount] = useState(0)
  const timeline = useRef(new WormholeTimeline()).current

  const isCityIntro = phase === 'cityIntro'
  const isPhase1 = phase === 'phase1' || phase === 'museum'
  const isPhase2 = phase === 'phase2'

  useEffect(() => {
    if (phase === 'exploring') setLibraryVisitCount((count) => count + 1)
  }, [phase])

  /**
   * The `cityIntro` finale's assets aren't preloaded until they're actually
   * needed — the 17s wormhole transition into it gives plenty of time to warm
   * the fetch/glTF-parse cache in the background, so the walk doesn't freeze
   * mid-reveal loading them.
   */
  const preloadCityIntroAssets = useCallback(() => {
    cityIntroModelUrls().forEach((url) => {
      useGLTF.preload(url)
      fetch(url, { method: 'HEAD' }).catch(() => {})
    })
  }, [])

  const startWormhole = useCallback(
    (target: GamePhase) => {
      if (phase === 'wormhole' || phase === target) return
      if (target === 'cityIntro') preloadCityIntroAssets()
      setWormholeTarget(target)
      setPhase('wormhole')
      timeline.start(appConfig.wormhole.durationMs, easeCubicInOut, setWormholeProgress, () => {
        setPhase(target)
        setWormholeProgress(0)
        if (target === 'phase1') setShowPhase1Overlay(true)
        if (target === 'phase2') setShowPhase2Overlay(true)
      })
    },
    [phase, timeline, preloadCityIntroAssets]
  )

  const startExperience = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('exploring')
  }, [phase])
  const enterLibrary = useCallback(() => setPhase('exploring'), [])
  const handleBookInteract = useCallback(() => startWormhole(libraryVisitCount >= 2 ? 'cityIntro' : 'phase1'), [startWormhole, libraryVisitCount])
  const startWormholeToPhase2 = useCallback(() => startWormhole('phase2'), [startWormhole])
  const startWormholeToLibrary = useCallback(() => startWormhole('exploring'), [startWormhole])
  const dismissPhase1Intro = useCallback(() => setShowPhase1Overlay(false), [])
  const dismissPhase2Intro = useCallback(() => setShowPhase2Overlay(false), [])

  /**
   * Instantly jumps to `target`, bypassing walk/wormhole sequencing.
   * @param target - Destination game phase
   */
  const jumpToPhase = useCallback(
    (target: GamePhase) => {
      timeline.cancel()
      setWormholeProgress(0)
      setShowPhase1Overlay(false)
      setShowPhase2Overlay(false)
      setPhase(target)
      if (target === 'phase1' || target === 'phase2') {
        setWormholeTarget(target)
      }
    },
    [timeline]
  )

  useEffect(() => () => timeline.cancel(), [timeline])

  return {
    phase,
    wormholeProgress,
    wormholeTarget,
    showPhase1Overlay,
    showPhase2Overlay,
    isCityIntro,
    isPhase1,
    isPhase2,
    libraryVisitCount,
    startExperience,
    enterLibrary,
    handleBookInteract,
    startWormholeToPhase2,
    startWormholeToLibrary,
    dismissPhase1Intro,
    dismissPhase2Intro,
    jumpToPhase,
  }
}
