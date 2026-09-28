/**
 * Tracks the player's position and derives distance-based gameplay flags:
 * proximity to the central book, to the phase portal, and to sepia photos.
 * @module app/hooks/usePlayerProximity
 */

import { useCallback, useState } from 'react'
import * as THREE from 'three'
import { appConfig } from '@/shared/config/appConfig'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import { findNearestSepiaPhoto } from '@/app/engine/proximity'
import { LIBRARY_PORTAL_POSITION } from '@/features/library/config/libraryLayout'
import { initialPhase1Entities, initialPhase2Entities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'
import { CREDITS_DOOR_RANGE, CREDITS_DOOR_XZ } from '@/features/credits/config/creditsConfig'
import type { GamePhase } from '@/shared/types'

/**
 * Finds `entities`' `portal` entity's XZ position, so proximity stays
 * correct however each phase's map is laid out instead of a position
 * hardcoded here going stale on the next redesign.
 * @param entities - Phase entity list to search
 * @returns Portal XZ, or `null` if that phase has none
 */
function portalXZFrom(entities: EditableEntity[]): [number, number] | null {
  const portal = entities.find((e) => e.type === 'portal')
  return portal ? [portal.position[0], portal.position[2]] : null
}

/**
 * The library's portal to the `cityIntro` finale, in front of the back wall's
 * broken panel — not JSON-driven since `LibraryScene`'s default (non-editor)
 * render is itself hardcoded JSX, not entity-driven. It only becomes visible
 * and usable once the returning book has been read and shelved (see
 * `usePhaseFlow`'s `libraryPortalUnlocked`); its position stays fixed here so
 * proximity is correct even while it's hidden.
 */
const LIBRARY_PORTAL_XZ: [number, number] = [LIBRARY_PORTAL_POSITION[0], LIBRARY_PORTAL_POSITION[2]]

/** Phase 1's portal (to Phase 2) and Phase 2's portal (back to the library), read once from their JSON. */
const PORTAL_XZ_BY_PHASE: Partial<Record<GamePhase, [number, number]>> = {
  phase1: portalXZFrom(initialPhase1Entities) ?? undefined,
  phase2: portalXZFrom(initialPhase2Entities) ?? undefined,
  exploring: LIBRARY_PORTAL_XZ,
}
/** Interact range around the current scene's portal. */
const PORTAL_RANGE = 2.8
/** Interact range around a sepia photo. */
const PHOTO_RANGE = 2.4

/**
 * World XZ spots whose audio fades by distance. Follows the rendered
 * entities (see `useExperience`), so moving them in the editor moves the sound.
 */
export interface Phase2AudioSpots {
  /** XZ of "El Poderoso" (picó), or `null` when the scene has no such entity. */
  pico: [number, number] | null
  /** XZ of the congas character, or `null` when the scene has no such entity. */
  congas: [number, number] | null
}

/** Public state and updater exposed by {@link usePlayerProximity}. */
export interface PlayerProximity {
  /** Whether the player is within interact range of the central book. */
  nearBook: boolean
  /** Whether the player is within interact range of the phase portal. */
  nearPortal: boolean
  /** Id of the sepia photo currently highlighted by proximity, if any. */
  highlightedPhotoId: string | null
  /** Distance from the player to Phase 2's picó ("El Poderoso"), or `Infinity` outside Phase 2 / if it has no entity. */
  picoDistance: number
  /** Distance from the player to Phase 2's congas character, or `Infinity` outside Phase 2 / if it has no entity. */
  congasDistance: number
  /** Whether the player is within interact range of the credits door at RIWI Barranquilla (`cityIntro` only). */
  nearCreditsDoor: boolean
  /** Feeds the latest camera position; call from `PlayerControls.onPositionChange`. */
  handlePosition: (pos: THREE.Vector3) => void
}

/**
 * @param phase - Current game phase, used to gate sepia-photo highlighting to Phase 1
 * @param portalXZOverride - Where the current phase's portal actually is when it's placed at runtime (the Libro de Rosa's summoned portal in the open phases); `null` while it hasn't opened yet, `undefined` to use the phase's authored portal
 * @param photoSpots - Photo hotspots following the rendered `sepia-photo` entities; defaults to the static catalog
 * @param audioSpots - Phase 2 audio spots following the rendered entities
 * @returns Proximity flags and the position feed callback
 */
export function usePlayerProximity(
  phase: GamePhase,
  portalXZOverride?: [number, number] | null,
  photoSpots: Pick<SepiaPhotoConfig, 'id' | 'position'>[] = sepiaPhotos,
  audioSpots: Phase2AudioSpots = { pico: null, congas: null },
): PlayerProximity {
  const [distance, setDistance] = useState(9)
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)
  const [picoDistance, setPicoDistance] = useState(Infinity)
  const [congasDistance, setCongasDistance] = useState(Infinity)
  const [nearCreditsDoor, setNearCreditsDoor] = useState(false)
  const [nearPortal, setNearPortal] = useState(false)

  const nearBook = distance < appConfig.player.interactDistance
  const portalXZ = portalXZOverride === undefined ? PORTAL_XZ_BY_PHASE[phase] : portalXZOverride

  const handlePosition = useCallback(
    (pos: THREE.Vector3) => {
      setNearPortal(!!portalXZ && Math.hypot(pos.x - portalXZ[0], pos.z - portalXZ[1]) < PORTAL_RANGE)
      setDistance(Math.hypot(pos.x, pos.z))
      if (phase === 'phase1') {
        setHighlightedPhotoId(findNearestSepiaPhoto(pos.x, pos.z, photoSpots, PHOTO_RANGE))
      } else {
        setHighlightedPhotoId(null)
      }
      setPicoDistance(phase === 'phase2' && audioSpots.pico ? Math.hypot(pos.x - audioSpots.pico[0], pos.z - audioSpots.pico[1]) : Infinity)
      setCongasDistance(phase === 'phase2' && audioSpots.congas ? Math.hypot(pos.x - audioSpots.congas[0], pos.z - audioSpots.congas[1]) : Infinity)
      setNearCreditsDoor(phase === 'cityIntro' && Math.hypot(pos.x - CREDITS_DOOR_XZ[0], pos.z - CREDITS_DOOR_XZ[1]) < CREDITS_DOOR_RANGE)
    },
    [phase, portalXZ, photoSpots, audioSpots]
  )

  return { nearBook, nearPortal, highlightedPhotoId, picoDistance, congasDistance, nearCreditsDoor, handlePosition }
}
