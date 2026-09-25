/**
 * Ground-level obstacles for the finale's free roam — the street's trees,
 * read from `cityIntro.json` so they stay in sync with the authored layout.
 * @module features/cityIntro/config/cityCollision
 */

import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'

/** Trunk radius the player keeps clear of around each roble. */
const TREE_COLLISION_RADIUS = 0.5

/** Every roble lining the sidewalks, as a blocking circle for `PlayerControls`. */
export const cityObstacles: Array<{ x: number; z: number; radius: number }> = initialCityIntroEntities
  .filter((e) => e.type === 'roble-amarillo')
  .map((e) => ({ x: e.position[0], z: e.position[2], radius: TREE_COLLISION_RADIUS * e.scale }))
