/**
 * The player's controls for whichever scene is being played: the finale's
 * mototaxi ride (which stays parked once the player gets off) and free
 * roam, first-person movement in the library and the open phases, plus the
 * cinematic camera guide.
 * @module app/components/PlayerRig
 */

import { memo } from 'react'
import { MototaxiRide } from '@/features/cityIntro/components/mototaxi/MototaxiRide'
import { PlayerControls } from '@/features/player/components/PlayerControls'
import { CinematicLookAt } from '@/app/components/CinematicLookAt'
import { CreditsCamera } from '@/app/components/CreditsCamera'
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
  const { phaseFlow, proximity, city, library, photo, editor, bookPages } = experience
  if (editor.isEditorEnabled) return null

  return (
    <>
      {phaseFlow.isCityIntro && (
        <MototaxiRide
          pathEntities={city.walkPath}
          speed={appConfig.cityIntro.walkSpeed}
          riding={!city.freeRoam}
          view={city.rideView}
          onProgress={city.setWalkProgress}
        />
      )}
      {phaseFlow.isCityIntro && city.freeRoam && (
        <PlayerControls
          enabled
          onPositionChange={proximity.handlePosition}
          useCollisionWorld
          spawnAtStart={false}
        />
      )}
      {phaseFlow.phase === 'exploring' && (
        <PlayerControls
          enabled={!bookPages.openPage}
          onPositionChange={proximity.handlePosition}
          useCollisionWorld
          movementLocked={library.bookCinematicPlaying}
        />
      )}
      <CinematicLookAt active={library.bookCinematicPlaying} target={BOOK_FOCUS} />
      {phaseFlow.isPhase1 && (
        <PlayerControls
          enabled={!phaseFlow.showPhase1Overlay && !photo.selectedPhoto}
          onPositionChange={proximity.handlePosition}
          useCollisionWorld
        />
      )}
      {phaseFlow.isPhase2 && (
        <PlayerControls
          enabled={!phaseFlow.showPhase2Overlay}
          onPositionChange={proximity.handlePosition}
          useCollisionWorld
        />
      )}
      <CreditsCamera active={phaseFlow.isCredits} />
    </>
  )
})
