/**
 * Tracks the player's position and derives distance-based gameplay flags:
 * proximity to the central book, to the phase portal, and to sepia photos.
 * @module app/hooks/usePlayerProximity
 */

import { useCallback, useRef, useState } from 'react'
import * as THREE from 'three'
import { appConfig } from '@/shared/config/appConfig'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import { findNearestSepiaPhoto } from '@/app/engine/proximity'
import { initialPhase1Entities } from '@/features/editor/config/editableEntities'
import type { GamePhase } from '@/shared/types'

/**
 * Portal position on the XZ ground plane (world units) — read from
 * `phase1.json`'s `portal` entity so this stays correct however the map is
 * laid out, instead of a position hardcoded here going stale on the next redesign.
 */
const portalEntity = initialPhase1Entities.find((e) => e.type === 'portal')
const PORTAL_XZ: [number, number] = portalEntity ? [portalEntity.position[0], portalEntity.position[2]] : [0, 0]
/** Interact range around the phase portal. */
const PORTAL_RANGE = 2.8
/** Interact range around a sepia photo. */
const PHOTO_RANGE = 2.4

/** Public state and updater exposed by {@link usePlayerProximity}. */
export interface PlayerProximity {
  /** Whether the player is within interact range of the central book. */
  nearBook: boolean
  /** Whether the player is within interact range of the phase portal. */
  nearPortal: boolean
  /** Id of the sepia photo currently highlighted by proximity, if any. */
  highlightedPhotoId: string | null
  /** Feeds the latest camera position; call from `PlayerControls.onPositionChange`. */
  handlePosition: (pos: THREE.Vector3) => void
}

/**
 * @param phase - Current game phase, used to gate sepia-photo highlighting to Phase 1
 * @returns Proximity flags and the position feed callback
 */
export function usePlayerProximity(phase: GamePhase): PlayerProximity {
  const playerPos = useRef(new THREE.Vector3(0, appConfig.player.eyeHeight, 9))
  const [distance, setDistance] = useState(9)
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)

  const nearBook = distance < appConfig.player.interactDistance
  const nearPortal = Math.hypot(playerPos.current.x - PORTAL_XZ[0], playerPos.current.z - PORTAL_XZ[1]) < PORTAL_RANGE

  const handlePosition = useCallback(
    (pos: THREE.Vector3) => {
      playerPos.current.copy(pos)
      setDistance(Math.hypot(pos.x, pos.z))
      if (phase === 'phase1' || phase === 'museum') {
        setHighlightedPhotoId(findNearestSepiaPhoto(pos.x, pos.z, sepiaPhotos, PHOTO_RANGE))
      } else {
        setHighlightedPhotoId(null)
      }
    },
    [phase]
  )

  return { nearBook, nearPortal, highlightedPhotoId, handlePosition }
}
