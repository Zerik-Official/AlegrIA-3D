/**
 * Ground-level collision circles for Phase 2 landmarks — keeps the player
 * from walking through buildings that have no physics mesh of their own.
 * @module features/phase2/config/phase2Collision
 */

import { initialPhase2Entities } from '@/features/editor/config/editableEntities'

/** Footprint radius for the parroquia model at `scale: 1`. */
const PARROQUIA_COLLISION_RADIUS = 2.4

const parroquia = initialPhase2Entities.find((e) => e.id === 'parroquia')

/** Collision circles the player can't walk into while exploring Phase 2. */
export const phase2Obstacles: Array<{ x: number; z: number; radius: number }> = parroquia
  ? [{ x: parroquia.position[0], z: parroquia.position[2], radius: PARROQUIA_COLLISION_RADIUS * parroquia.scale }]
  : []
