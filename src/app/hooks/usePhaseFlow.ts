/**
 * Owns the game's phase state machine: current phase, the wormhole transition
 * timeline between phases, and the two per-phase intro overlays.
 *
 * Flow: `idle` → `exploring` (library, 1st visit) → `phase1` → `phase2` →
 * `exploring` (library, 2nd visit, via the Phase 2 return portal) →
 * `cityIntro` (finale, via the restored library's portal). Every arrow after
 * the first is a wormhole transition, played in the scene it leaves from
 * (`wormholeSource`); `libraryVisitCount` is what tells the book which
 * choreography to run.
 * @module app/hooks/usePhaseFlow
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { appConfig } from '@/shared/config/appConfig'
import { easeCubicInOut } from '@/shared/utils/perf'
import { cityIntroModelUrls, cityIntroVideoUrls, phase2ModelUrls, phase2VideoUrls } from '@/shared/config/models'
import { audioTracks } from '@/shared/config/audio'
import type { GamePhase } from '@/shared/types'
import { WormholeTimeline } from '@/app/engine/WormholeTimeline'

/**
 * Choreography of the central book in the library.
 *
 * First visit: the hall opens with the pedestal switched off and no book
 * (`dormant`); near the end of the opening narration the pedestal flickers to
 * life (`igniting`) and the book materializes over it in a column of light
 * (`awakening`), then floats untouchable (`waiting`) until the narration
 * ends, only then becoming usable (`ready`).
 *
 * Second visit (the
 * return from Phase 2): the pedestal starts empty (`hidden`), the book
 * materializes on its own (`appearing`) and floats untouchable while the
 * return narration plays (`waiting`). Once the narration ends it can be
 * returned (`ready`); interacting sends it flying to its shelf (`returning`),
 * where it bursts into white light that remakes the whole hall
 * (`transforming`) before settling into the restored library (`restored`)
 * and opening the portal to the `cityIntro` finale.
 */
export type LibraryBookStage =
  | 'dormant'
  | 'igniting'
  | 'awakening'
  | 'hidden'
  | 'appearing'
  | 'waiting'
  | 'ready'
  | 'returning'
  | 'transforming'
  | 'restored'

/** How long the pedestal takes to flicker to full power before the book materializes, on the first visit, in ms. */
const PEDESTAL_IGNITE_MS = 2200
/** How long the book's materialization in its column of light lasts before it can be used, in ms. */
const BOOK_AWAKEN_MS = 3000

/** How long after entering the library the book takes to start materializing/fully appear, in ms — gives the "empty pedestal" beat room to read before the book shows up "out of nowhere". */
const BOOK_APPEAR_DELAY_MS = 1400
const BOOK_APPEAR_DONE_MS = 2400
/** How long the book takes to fly from the pedestal to its shelf before it bursts, in ms. */
const BOOK_RETURN_FLIGHT_MS = 2600
/** Time into the light burst at which the screen is fully white and the hall swaps to its restored look, in ms. */
const BURST_PEAK_MS = 1100
/** Total length of the light burst, from the book exploding to the restored hall fully revealed, in ms. */
const BURST_DONE_MS = 3200
/** How long after the hall is restored before the portal to the future opens, in ms. */
const PORTAL_UNLOCK_DELAY_MS = 1400

/** Public state and actions exposed by {@link usePhaseFlow}. */
export interface PhaseFlow {
  /** Current game phase. */
  phase: GamePhase
  /** Wormhole transition progress in [0,1]. */
  wormholeProgress: number
  /** Phase the current (or most recent) wormhole transition leads to. */
  wormholeTarget: GamePhase
  /** Phase the current (or most recent) wormhole transition left from — its scene stays on screen while the crossing plays. */
  wormholeSource: GamePhase
  /** Phase whose scene is on screen: `phase` itself, or the phase being left while a wormhole plays. */
  scenePhase: GamePhase
  /**
   * Which crossing cinematic the wormhole plays: `book` for the book's ritual
   * over the pedestal (the library's first visit, into Phase 1), `portal` for
   * diving through the portal the player walked into (every other crossing).
   */
  crossingMode: 'book' | 'portal'
  /** Whether the current open phase's intro overlay is covering the screen. */
  introOverlayOpen: boolean
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
  /** Whether the library has been remade by the returned book's light burst — swaps the abandoned hall for the restored one and removes the pedestal. */
  libraryRestored: boolean
  /** Whether the `cityIntro` portal has appeared and can be used — only true once the returned book has restored the hall. */
  libraryPortalUnlocked: boolean
  /** Transitions from `idle` straight into `exploring` (the library), where the experience now starts. */
  startExperience: () => void
  /** Transitions from `cityIntro` into `exploring`, once the player has reached the library door. */
  enterLibrary: () => void
  /**
   * Book interaction in the library, ignored until the book is `ready`: first visit heads to Phase 1 immediately.
   * On the second (and later) visit it returns the book to its shelf, which
   * restores the hall and opens the `cityIntro` portal — see
   * {@link LibraryBookStage}. Ignored until the return narration has ended.
   */
  handleBookInteract: () => void
  /** Called once the library's narration ends, making the book usable (`waiting` → `ready`) on either visit. */
  finishLibraryDialog: () => void
  /** Starts the first visit's awakening cinematic — pedestal ignition, then the book materializing (`dormant` → `igniting` → `awakening` → `waiting`). */
  awakenLibraryBook: () => void
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
  const [wormholeSource, setWormholeSource] = useState<GamePhase>('exploring')
  const [showPhase1Overlay, setShowPhase1Overlay] = useState(true)
  const [showPhase2Overlay, setShowPhase2Overlay] = useState(true)
  const [libraryVisitCount, setLibraryVisitCount] = useState(0)
  const [bookStage, setBookStage] = useState<LibraryBookStage>('dormant')
  const [libraryRestored, setLibraryRestored] = useState(false)
  const [libraryPortalUnlocked, setLibraryPortalUnlocked] = useState(false)
  const timeline = useRef(new WormholeTimeline()).current
  /** Pending `setTimeout` ids from the book/portal choreography, cleared on unmount or when a new visit restarts it. */
  const bookTimers = useRef<number[]>([])

  const isCityIntro = phase === 'cityIntro'
  const isPhase1 = phase === 'phase1' || phase === 'museum'
  const isPhase2 = phase === 'phase2'
  const scenePhase = phase === 'wormhole' ? wormholeSource : phase
  const crossingMode = wormholeSource === 'exploring' && wormholeTarget === 'phase1' ? 'book' : 'portal'
  const introOverlayOpen = (isPhase1 && showPhase1Overlay) || (isPhase2 && showPhase2Overlay)

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
        setLibraryPortalUnlocked(false)
        setLibraryRestored(false)
        setBookStage('hidden')
        bookTimers.current.push(window.setTimeout(() => setBookStage('appearing'), BOOK_APPEAR_DELAY_MS))
        bookTimers.current.push(window.setTimeout(() => setBookStage('waiting'), BOOK_APPEAR_DONE_MS))
      } else {
        setLibraryRestored(false)
        setLibraryPortalUnlocked(false)
        setBookStage('dormant')
      }
      return next
    })
  }, [phase, clearBookTimers])

  useEffect(() => clearBookTimers, [clearBookTimers])

  /**
   * Warms the fetch/glTF-parse cache for a destination's assets in the
   * background while the 17s wormhole into it plays, so it doesn't freeze on
   * arrival: the finale's models and billboard videos, or Phase 2's models,
   * parade videos and narration (Phase 2 is heavy, and its intro overlay
   * should open onto a scene that's already there).
   * @param target - Phase the wormhole leads to
   */
  const preloadAssetsFor = useCallback((target: GamePhase) => {
    const models = target === 'cityIntro' ? cityIntroModelUrls() : target === 'phase2' ? phase2ModelUrls() : []
    const media = target === 'cityIntro' ? cityIntroVideoUrls() : target === 'phase2' ? [...phase2VideoUrls(), audioTracks.dorade] : []
    models.forEach((url) => {
      useGLTF.preload(url)
      fetch(url, { method: 'HEAD' }).catch(() => {})
    })
    media.forEach((url) => {
      fetch(url).catch(() => {})
    })
  }, [])

  const startWormhole = useCallback(
    (target: GamePhase) => {
      if (phase === 'wormhole' || phase === target) return
      preloadAssetsFor(target)
      setWormholeTarget(target)
      setWormholeSource(phase)
      setPhase('wormhole')
      timeline.start(appConfig.wormhole.durationMs, easeCubicInOut, setWormholeProgress, () => {
        setPhase(target)
        setWormholeProgress(0)
        if (target === 'phase1') setShowPhase1Overlay(true)
        if (target === 'phase2') setShowPhase2Overlay(true)
      })
    },
    [phase, timeline, preloadAssetsFor]
  )

  const startExperience = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('exploring')
  }, [phase])
  const enterLibrary = useCallback(() => setPhase('exploring'), [])

  /**
   * First visit: interacting heads straight to Phase 1, as before. Second
   * (and later) visit: once `ready`, interacting returns the book to its
   * shelf and schedules the rest of the choreography — the burst, the
   * restored hall and the portal — the `cityIntro` wormhole itself happens
   * at that portal.
   */
  const handleBookInteract = useCallback(() => {
    if (bookStage !== 'ready') return
    if (libraryVisitCount < 2) {
      startWormhole('phase1')
      return
    }
    setBookStage('returning')
    const burstAt = BOOK_RETURN_FLIGHT_MS
    bookTimers.current.push(window.setTimeout(() => setBookStage('transforming'), burstAt))
    bookTimers.current.push(window.setTimeout(() => setLibraryRestored(true), burstAt + BURST_PEAK_MS))
    bookTimers.current.push(window.setTimeout(() => setBookStage('restored'), burstAt + BURST_DONE_MS))
    bookTimers.current.push(window.setTimeout(() => setLibraryPortalUnlocked(true), burstAt + BURST_DONE_MS + PORTAL_UNLOCK_DELAY_MS))
  }, [startWormhole, libraryVisitCount, bookStage])

  const awakenLibraryBook = useCallback(() => {
    if (bookStage !== 'dormant') return
    setBookStage('igniting')
    bookTimers.current.push(window.setTimeout(() => setBookStage('awakening'), PEDESTAL_IGNITE_MS))
    bookTimers.current.push(window.setTimeout(() => setBookStage('waiting'), PEDESTAL_IGNITE_MS + BOOK_AWAKEN_MS))
  }, [bookStage])

  const finishLibraryDialog = useCallback(() => {
    setBookStage((stage) => (stage === 'waiting' ? 'ready' : stage))
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
      setLibraryRestored(false)
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
    wormholeSource,
    scenePhase,
    crossingMode,
    introOverlayOpen,
    showPhase1Overlay,
    showPhase2Overlay,
    isCityIntro,
    isPhase1,
    isPhase2,
    libraryVisitCount,
    bookStage,
    libraryRestored,
    libraryPortalUnlocked,
    startExperience,
    enterLibrary,
    handleBookInteract,
    finishLibraryDialog,
    awakenLibraryBook,
    startWormholeToPhase2,
    startWormholeToLibrary,
    startWormholeToCityIntro,
    dismissPhase1Intro,
    dismissPhase2Intro,
    jumpToPhase,
  }
}
