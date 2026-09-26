/**
 * Everything drawn in the 3D canvas for the story: the scene on screen (or
 * the time tunnel once a portal has been crossed), the summoned portals, the
 * crossing cinematic and the wormhole camera.
 * @module app/components/SceneStage
 */

import { memo } from 'react'
import { CityIntroScene } from '@/features/cityIntro/components/CityIntroScene'
import { CreditsScene } from '@/features/credits/components/CreditsScene'
import { LibraryScene } from '@/features/library/components/LibraryScene'
import { Phase1Scene } from '@/features/phase1/components/Phase1Scene'
import { Phase2Scene } from '@/features/phase2/components/Phase2Scene'
import { StoryPortal } from '@/features/storyBook/components/StoryPortal'
import { PortalCrossing } from '@/features/cinematics/components/PortalCrossing'
import { WormholeCamera } from '@/app/components/WormholeCamera'
import { phaseSceneRegistry } from '@/app/engine/PhaseSceneRegistry'
import type { Experience } from '@/app/hooks/useExperience'

/** Crossing progress at which the camera is through the portal and the scene left behind stops being drawn. */
const PORTAL_CROSSED_AT = 0.56

/**
 * Props for {@link SceneStage}.
 */
interface SceneStageProps {
  /** Composed experience state. */
  experience: Experience
}

/**
 * Renders the scene of `scenePhase` — the phase being left while a wormhole
 * plays, so every crossing happens in its own scene instead of cutting back
 * to the library. `idle` already mounts the library behind the start screen,
 * so its assets and shaders are warm by the time the player walks in. Once a
 * portal crossing has carried the camera through, the scene gives way to the
 * tunnel alone.
 *
 * @param props - Experience state
 * @returns Stage elements
 */
export const SceneStage = memo(function SceneStage({ experience }: SceneStageProps) {
  const { phaseFlow, editors, editor, proximity, storyBook, raining, portalFocus, bookPages } = experience
  const { phase, scenePhase, crossingMode, wormholeProgress } = phaseFlow
  const inWormhole = phase === 'wormhole'
  const crossedPortal = inWormhole && crossingMode === 'portal' && wormholeProgress > PORTAL_CROSSED_AT
  const sceneId = phaseSceneRegistry.resolveScene(scenePhase)
  const visual = crossedPortal ? phaseSceneRegistry.resolveTunnelVisual() : phaseSceneRegistry.resolveVisual(scenePhase, phaseFlow.libraryRestored)
  const editing = editor.isEditorEnabled

  return (
    <>
      <fog attach="fog" args={[visual.fog.color, visual.fog.near, visual.fog.far]} />
      <color attach="background" args={[visual.background]} />

      {!crossedPortal && sceneId === 'cityIntro' && <CityIntroScene editableEntities={editing ? editors.cityIntroEditor.entities : undefined} />}
      {!crossedPortal && sceneId === 'credits' && <CreditsScene />}
      {!crossedPortal && sceneId === 'library' && (
        <LibraryScene
          wormholeActive={inWormhole}
          wormholeProgress={wormholeProgress}
          bookStage={phaseFlow.bookStage}
          libraryRestored={phaseFlow.libraryRestored}
          libraryPortalUnlocked={phaseFlow.libraryPortalUnlocked}
          crossingMode={crossingMode}
          editableEntities={editing ? editors.libraryEditor.entities : undefined}
          pagesInteractive={phase === 'exploring' && !editing && !bookPages.openPage}
          focusedPageId={bookPages.focusedPageId}
          onPageFocus={bookPages.setFocusedPageId}
        />
      )}
      {!crossedPortal && sceneId === 'phase1' && (
        <>
          <Phase1Scene highlightedPhotoId={proximity.highlightedPhotoId} editableEntities={editing ? editors.phase1Editor.entities : undefined} raining={raining} />
          {!editing && (
            <StoryPortal active={storyBook.portalOpen} onPlaced={storyBook.handlePortalPlaced} accentColor="#ff8a1a" glowColor="#5ad8ff" />
          )}
        </>
      )}
      {!crossedPortal && sceneId === 'phase2' && (
        <>
          <Phase2Scene editableEntities={editing ? editors.phase2Editor.entities : undefined} />
          {!editing && (
            <StoryPortal
              active={storyBook.portalOpen}
              onPlaced={storyBook.handlePortalPlaced}
              accentColor="#ff8ad2"
              glowColor="#78b4ff"
            />
          )}
        </>
      )}

      {inWormhole && crossingMode === 'portal' && portalFocus && (
        <PortalCrossing active progress={wormholeProgress} center={portalFocus.position} yaw={portalFocus.yaw} />
      )}
      <WormholeCamera active={inWormhole} progress={wormholeProgress} mode={crossingMode} focus={portalFocus?.position} focusYaw={portalFocus?.yaw} />
    </>
  )
})
