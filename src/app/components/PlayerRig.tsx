/**
 * The player's controls for whichever scene is being played: the finale's
 * scripted walk or free roam, and first-person movement in the library and
 * the open phases, plus the cinematic camera guide.
 * @module app/components/PlayerRig
 */

import { memo } from 'react'
import { CityWalkControls } from '@/features/cityIntro/components/CityWalkControls'
import { PlayerControls } from '@/features/player/components/PlayerControls'
import { CinematicLookAt } from '@/app/components/CinematicLookAt'
import { cityObstacles } from '@/features/cityIntro/config/cityCollision'
import { phase2Obstacles } from '@/features/phase2/config/phase2Collision'
import { appConfig } from '@/shared/config/appConfig'
import type { Experience } from '@/app/hooks/useExperience'

/** Where the book hovers over the pedestal — what the awakening cinematic turns the camera towards. */
const BOOK_FOCUS: [number, number, number] = [0, 1.78, 0]

/**
 * Props for {@link PlayerRig}.
 */
interface PlayerRigProps {
  /** Composed experience state. */
  experience: Experience
}

/**
 * Mounts the one set of controls the current phase calls for; none while
 * idle, in a wormhole (the wormhole camera drives) or while editing.
 *
 * @param props - Experience state
 * @returns Controls elements
 */
export const PlayerRig = memo(function PlayerRig({ experience }: PlayerRigProps) {
  const { phaseFlow, proximity, city, library, photo, editor } = experience
  if (editor.isEditorEnabled) return null

  return (
    <>
      {phaseFlow.isCityIntro && !city.freeRoam && (
        <CityWalkControls
          enabled
          pathEntities={city.walkPath}
          speed={appConfig.cityIntro.walkSpeed}
          eyeHeight={appConfig.cityIntro.eyeHeight}
          onProgress={city.setWalkProgress}
        />
      )}
      {phaseFlow.isCityIntro && city.freeRoam && (
        <PlayerControls
          enabled
          onPositionChange={proximity.handlePosition}
          bounds={appConfig.player.cityBounds}
          obstacles={cityObstacles}
          spawnAtStart={false}
          avoidPedestal={false}
        />
      )}
      {phaseFlow.phase === 'exploring' && (
        <PlayerControls
          enabled
          onPositionChange={proximity.handlePosition}
          bounds={appConfig.player.libraryBounds}
          useCollisionWorld
          avoidPedestal={!phaseFlow.libraryRestored}
          movementLocked={library.bookCinematicPlaying}
        />
      )}
      <CinematicLookAt active={library.bookCinematicPlaying} target={BOOK_FOCUS} />
      {phaseFlow.isPhase1 && (
        <PlayerControls
          enabled={!phaseFlow.showPhase1Overlay && !photo.selectedPhoto}
          onPositionChange={proximity.handlePosition}
          bounds={appConfig.player.phase1Bounds}
          useCollisionWorld
        />
      )}
      {phaseFlow.isPhase2 && (
        <PlayerControls
          enabled={!phaseFlow.showPhase2Overlay}
          onPositionChange={proximity.handlePosition}
          bounds={appConfig.player.phase2Bounds}
          obstacles={phase2Obstacles}
        />
      )}
    </>
  )
})
