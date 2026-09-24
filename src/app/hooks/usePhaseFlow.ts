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
import { cityIntroModelUrls, cityIntroVideoUrls } from '@/shared/config/models'
import type { GamePhase } from '@/shared/types'
import { WormholeTimeline } from '@/app/engine/WormholeTimeline'

/**
 * Choreography of the central book on the library's *second* visit (the
 * return from Phase 2): the pedestal starts empty (`hidden`), the book
 * materializes on its own (`appearing` → `ready`), interacting starts the
 * return narration (`reading`), and once that narration ends the book flies
 * off to a shelf (`stored`) before the `cityIntro` portal unlocks. The first
 * visit skips all of this and stays `ready` throughout.
 */
export type LibraryBookStage = 'hidden' | 'appearing' | 'ready' | 'reading' | 'stored'

/** How long after entering the library the book takes to start materializing/fully appear, in ms — gives the "empty pedestal" beat room to read before the book shows up "out of nowhere". */
const BOOK_APPEAR_DELAY_MS = 1400
const BOOK_APPEAR_DONE_MS = 2400
/** How long after the book finishes flying to its shelf before the portal unlocks, in ms. */
const PORTAL_UNLOCK_DELAY_MS = 1600

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
  /** Stage of the book/portal choreography on the library's second (return) visit — see {@link LibraryBookStage}. */
  bookStage: LibraryBookStage
  /** Whether the `cityIntro` portal has appeared and can be used — only true after the returning book has been read and shelved. */
  libraryPortalUnlocked: boolean
  /** Transitions from `idle` straight into `exploring` (the library), where the experience now starts. */
  startExperience: () => void
  /** Transitions from `cityIntro` into `exploring`, once the player has reached the library door. */
  enterLibrary: () => void
  /**
   * Book interaction in the library: first visit heads to Phase 1 immediately.
   * On the second (and later) visit it instead starts the return narration —
   * see {@link LibraryBookStage} — and the `cityIntro` wormhole is triggered
   * separately, at the portal, once it unlocks.
   */
  handleBookInteract: () => void
  /** Called once the return narration playing during `reading` finishes, advancing the book to `stored` and, shortly after, unlocking the portal. */
  finishBookReading: () => void
  /** Starts the wormhole transition into Phase 2 (triggered near the Phase 1 portal). */
  startWormholeToPhase2: () => void
  /** Starts the wormhole transition back to the library (triggered near the Phase 2 portal). */
  startWormholeToLibrary: () => void
  /** Starts the wormhole transition into the `cityIntro` finale (triggered at the library's unlocked portal). */
  startWormholeToCityIntro: () => void
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
  const [bookStage, setBookStage] = useState<LibraryBookStage>('ready')
  const [libraryPortalUnlocked, setLibraryPortalUnlocked] = useState(false)
  const timeline = useRef(new WormholeTimeline()).current
  /** Pending `setTimeout` ids from the book/portal choreography, cleared on unmount or when a new visit restarts it. */
  const bookTimers = useRef<number[]>([])

  const isCityIntro = phase === 'cityIntro'
  const isPhase1 = phase === 'phase1' || phase === 'museum'
  const isPhase2 = phase === 'phase2'

  const clearBookTimers = useCallback(() => {
    bookTimers.current.forEach((id) => window.clearTimeout(id))
    bookTimers.current = []
  }, [])

  useEffect(() => {
    if (phase !== 'exploring') return
    setLibraryVisitCount((count) => {
      const next = count + 1
      clearBookTimers()
      if (next >= 2) {
        // Second (and later) visit: pedestal starts empty, then the book
        // materializes on its own — see `LibraryBookStage`.
        setLibraryPortalUnlocked(false)
        setBookStage('hidden')
        bookTimers.current.push(window.setTimeout(() => setBookStage('appearing'), BOOK_APPEAR_DELAY_MS))
        bookTimers.current.push(window.setTimeout(() => setBookStage('ready'), BOOK_APPEAR_DONE_MS))
      } else {
        setBookStage('ready')
      }
      return next
    })
  }, [phase, clearBookTimers])

  useEffect(() => clearBookTimers, [clearBookTimers])

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
    cityIntroVideoUrls().forEach((url) => {
      fetch(url).catch(() => {})
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

  /**
   * First visit: interacting heads straight to Phase 1, as before. Second
   * (and later) visit: interacting only starts the return narration
   * (`reading`) — the `cityIntro` wormhole itself now happens at the portal,
   * once {@link finishBookReading} unlocks it.
   */
  const handleBookInteract = useCallback(() => {
    if (libraryVisitCount >= 2) {
      setBookStage((stage) => (stage === 'ready' ? 'reading' : stage))
      return
    }
    startWormhole('phase1')
  }, [startWormhole, libraryVisitCount])

  const finishBookReading = useCallback(() => {
    setBookStage((stage) => {
      if (stage !== 'reading') return stage
      bookTimers.current.push(window.setTimeout(() => setLibraryPortalUnlocked(true), PORTAL_UNLOCK_DELAY_MS))
      return 'stored'
    })
  }, [])

  const startWormholeToPhase2 = useCallback(() => startWormhole('phase2'), [startWormhole])
  const startWormholeToLibrary = useCallback(() => startWormhole('exploring'), [startWormhole])
  const startWormholeToCityIntro = useCallback(() => startWormhole('cityIntro'), [startWormhole])
  const dismissPhase1Intro = useCallback(() => setShowPhase1Overlay(false), [])
  const dismissPhase2Intro = useCallback(() => setShowPhase2Overlay(false), [])

  /**
   * Instantly jumps to `target`, bypassing walk/wormhole sequencing.
   * @param target - Destination game phase
   */
  const jumpToPhase = useCallback(
    (target: GamePhase) => {
      timeline.cancel()
      clearBookTimers()
      setWormholeProgress(0)
      setShowPhase1Overlay(false)
      setShowPhase2Overlay(false)
      setBookStage('ready')
      setLibraryPortalUnlocked(false)
      setPhase(target)
      if (target === 'phase1' || target === 'phase2') {
        setWormholeTarget(target)
      }
    },
    [timeline, clearBookTimers]
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
    bookStage,
    libraryPortalUnlocked,
    startExperience,
    enterLibrary,
    handleBookInteract,
    finishBookReading,
    startWormholeToPhase2,
    startWormholeToLibrary,
    startWormholeToCityIntro,
    dismissPhase1Intro,
    dismissPhase2Intro,
    jumpToPhase,
  }
}
