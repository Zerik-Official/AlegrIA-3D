/**
 * Composes every piece of the experience's state — the phase machine, the
 * narration and what hangs off it (the library's beats, the open phases'
 * book, the rain, the finale), proximity, the editor and the photo modal —
 * into one object the scene and HUD render from, and wires the side effects
 * that belong to no single view (hotkeys, pointer lock).
 * @module app/hooks/useExperience
 */

import { useEffect, useMemo } from 'react'
import { usePhaseFlow, type PhaseFlow } from '@/app/hooks/usePhaseFlow'
import { usePhaseAudio } from '@/app/hooks/usePhaseAudio'
import { useNarration, type Narration } from '@/app/hooks/useNarration'
import { useStoryBookFlow, type PortalPlacement, type StoryBookFlow } from '@/app/hooks/useStoryBookFlow'
import { usePlayerProximity, type PlayerProximity } from '@/app/hooks/usePlayerProximity'
import { usePicoAudio } from '@/app/hooks/usePicoAudio'
import { useCongasAudio } from '@/app/hooks/useCongasAudio'
import { togglePerfMonitor } from '@/features/debug/state/perfMonitor'
import { useSceneEditors, type SceneEditors } from '@/app/hooks/useSceneEditors'
import { useEditorMode, type EditorMode } from '@/app/hooks/useEditorMode'
import { usePhotoSelection, type PhotoSelection } from '@/app/hooks/usePhotoSelection'
import { useLibraryDirector, type LibraryDirection } from '@/app/hooks/useLibraryDirector'
import { useCityFinale, type CityFinale } from '@/app/hooks/useCityFinale'
import { usePhase1Rain } from '@/app/hooks/usePhase1Rain'
import { useBookPages, type BookPages } from '@/app/hooks/useBookPages'
import { usePointerLockGuard } from '@/app/hooks/usePointerLockGuard'
import { useHotkeys } from '@/app/hooks/useHotkeys'
import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'
import { LIBRARY_PORTAL_POSITION } from '@/features/library/config/libraryLayout'
import type { HotkeyContext } from '@/app/engine/HotkeyRouter'
import { narrationState } from '@/shared/audio/narrationState'
import type { GamePhase } from '@/shared/types'

/** The restored library's portal, which faces straight into the hall. */
const LIBRARY_PORTAL: PortalPlacement = { position: LIBRARY_PORTAL_POSITION, yaw: 0 }

/** Everything the scene and HUD render from — see {@link useExperience}. */
export interface Experience {
  phaseFlow: PhaseFlow
  /** Seconds left in the current narration, or `null` (see `usePhaseAudio`). */
  audioRemainingSec: number | null
  /** The on-screen scene's narration. */
  narration: Narration
  /** The open phases' Libro de Rosa companion. */
  storyBook: StoryBookFlow
  proximity: PlayerProximity
  editors: SceneEditors
  editor: EditorMode
  photo: PhotoSelection
  library: LibraryDirection
  city: CityFinale
  /** Whether it's raining over Phase 1. */
  raining: boolean
  /** The restored library's Libro de Rosa pages. */
  bookPages: BookPages
  /** Whether the player is in an open phase (Phase 1 or Phase 2), outside a wormhole. */
  inOpenPhase: boolean
  /** Whether the open phases' book companion and its titles are on screen. */
  storyBookVisible: boolean
  /** Portal the current (or next) portal crossing dives into, if any. */
  portalFocus: PortalPlacement | null
}

/**
 * @param phase - Phase to test
 * @returns Whether it is one of the open phases (Phase 1 or Phase 2)
 */
function isOpenPhase(phase: GamePhase): boolean {
  return phase === 'phase1' || phase === 'phase2'
}

/**
 * @returns The composed experience state
 */
export function useExperience(): Experience {
  const phaseFlow = usePhaseFlow()
  const { phase, scenePhase, libraryVisitCount } = phaseFlow
  const editor = useEditorMode()
  const photo = usePhotoSelection()
  const audioRemainingSec = usePhaseAudio(phase, libraryVisitCount)
  const narration = useNarration(phase !== 'idle', `${scenePhase}-${libraryVisitCount}`, audioRemainingSec)
  const narratorSpeaking = typeof audioRemainingSec === 'number' && audioRemainingSec > 0.35

  useEffect(() => {
    narrationState.speaking = narratorSpeaking
  }, [narratorSpeaking])

  const inOpenPhase = isOpenPhase(phase)
  const storyBook = useStoryBookFlow(isOpenPhase(scenePhase), scenePhase, narration.ended, narration.heard)
  const storyPortalXZ = useMemo<[number, number] | null>(
    () => (storyBook.portal ? [storyBook.portal.position[0], storyBook.portal.position[2]] : null),
    [storyBook.portal]
  )
  const proximity = usePlayerProximity(phase, inOpenPhase ? storyPortalXZ : undefined)
  usePicoAudio(phaseFlow.isPhase2, proximity.picoDistance)
  useCongasAudio(phaseFlow.isPhase2, proximity.congasDistance)

  const editors = useSceneEditors(scenePhase)
  const library = useLibraryDirector(phaseFlow, narration)
  const city = useCityFinale(phaseFlow.isCityIntro, editor.isEditorEnabled ? editors.cityIntroEditor.entities : initialCityIntroEntities, narration)
  const bookPages = useBookPages(phaseFlow.libraryRestored)
  const raining = usePhase1Rain(scenePhase === 'phase1', narration)

  const storyBookVisible = inOpenPhase && !phaseFlow.introOverlayOpen && !photo.selectedPhoto && !editor.isEditorEnabled
  const portalFocus = scenePhase === 'exploring' ? LIBRARY_PORTAL : isOpenPhase(scenePhase) ? storyBook.portal : null

  usePointerLockGuard(editor.isEditorEnabled || phaseFlow.introOverlayOpen || phase === 'idle' || phaseFlow.isCredits)

  const hotkeyContext: HotkeyContext = {
    phase,
    nearBook: proximity.nearBook,
    nearPortal: proximity.nearPortal,
    libraryPortalUnlocked: phaseFlow.libraryPortalUnlocked,
    showPhase1Overlay: phaseFlow.showPhase1Overlay,
    showPhase2Overlay: phaseFlow.showPhase2Overlay,
    isCityIntro: phaseFlow.isCityIntro,
    cityFreeRoam: city.freeRoam,
    isPhase1: phaseFlow.isPhase1,
    isPhase2: phaseFlow.isPhase2,
    isCredits: phaseFlow.isCredits,
    nearCreditsDoor: proximity.nearCreditsDoor,
    enterCredits: phaseFlow.enterCredits,
    exitCredits: phaseFlow.exitCredits,
    highlightedPhotoId: proximity.highlightedPhotoId,
    hasSelectedPhoto: !!photo.selectedPhoto,
    isEditorEnabled: editor.isEditorEnabled,
    toggleEditor: editor.toggleEditor,
    closeEditor: editor.closeEditor,
    setEditorMode: editors.currentEditor.setMode,
    startExperience: phaseFlow.startExperience,
    handleBookInteract: phaseFlow.handleBookInteract,
    startWormholeToPhase2: phaseFlow.startWormholeToPhase2,
    startWormholeToLibrary: phaseFlow.startWormholeToLibrary,
    startWormholeToCityIntro: phaseFlow.startWormholeToCityIntro,
    dismissPhase1Intro: phaseFlow.dismissPhase1Intro,
    dismissPhase2Intro: phaseFlow.dismissPhase2Intro,
    selectPhoto: photo.selectPhoto,
    closePhoto: photo.closePhoto,
    canSkipBookWait: storyBook.canSkipWait,
    skipBookWait: storyBook.skipWait,
    focusedBookPageId: bookPages.focusedPageId,
    hasOpenBookPage: !!bookPages.openPage,
    openBookPage: bookPages.openFocusedPage,
    closeBookPage: bookPages.closePage,
    togglePerfMonitor,
  }
  useHotkeys(hotkeyContext)

  return {
    phaseFlow,
    audioRemainingSec,
    narration,
    storyBook,
    proximity,
    editors,
    editor,
    photo,
    library,
    city,
    raining,
    bookPages,
    inOpenPhase,
    storyBookVisible,
    portalFocus,
  }
}
