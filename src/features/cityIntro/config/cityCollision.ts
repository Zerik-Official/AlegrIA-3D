/**
 * Collision for the finale's free roam, read from `cityIntro.json` so it
 * stays in sync with the authored layout: the street's trees as blocking
 * circles, the raised sidewalk slabs as solids the player steps up onto, and
 * the parked ad bus as a solid block.
 * Where the player may walk at all is `cityStreets`' `CITY_WALKABLE_AREAS`.
 * @module features/cityIntro/config/cityCollision
 */

import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'
import { createBoxSolid, type CollisionSolid } from '@/features/player/collision'
import { CARNIVAL_STALLS, STALL_SIZE } from '@/features/cityIntro/config/carnivalLayout'

/** Trunk radius the player keeps clear of around each roble. */
const TREE_COLLISION_RADIUS = 0.5
/** Raised sidewalk slab (`anden-bordillo`) cross-section — see `AbajeroStreetProps`' `CurbRenderer`. */
const SLAB_DEPTH = 2.1
const SLAB_HEIGHT = 0.34
/** Slab length when its entity doesn't say. */
const SLAB_DEFAULT_LENGTH = 6
/** Ad bus footprint (model-local width along X, length along Z), with a little room around it. */
const BUS_WIDTH = 3.4
const BUS_LENGTH = 12.8
/** Height of the bus's collider — it hovers, but the player can't walk under it. */
const BUS_HEIGHT = 4

/** Every roble lining the sidewalks, as a blocking circle for `PlayerControls`. */
export const cityObstacles: Array<{ x: number; z: number; radius: number }> = initialCityIntroEntities
  .filter((e) => e.type === 'roble-amarillo')
  .map((e) => ({ x: e.position[0], z: e.position[2], radius: TREE_COLLISION_RADIUS * e.scale }))

/** Every raised sidewalk slab, low enough to step onto and walk along, plus the parked ad bus and the street party's stalls, which block. */
export const cityCollisionSolids: CollisionSolid[] = [
  ...initialCityIntroEntities
    .filter((e) => e.type === 'anden-bordillo')
    .map((e) =>
      createBoxSolid({
        x: e.position[0],
        y: SLAB_HEIGHT / 2,
        z: e.position[2],
        sizeX: SLAB_DEPTH * e.scale,
        sizeY: SLAB_HEIGHT * e.scale,
        sizeZ: (Number.parseFloat(e.variant ?? '') || SLAB_DEFAULT_LENGTH) * e.scale,
        rotationY: e.rotationY,
      })
    ),
  ...initialCityIntroEntities
    .filter((e) => e.type === 'ad-bus')
    .map((e) =>
      createBoxSolid({
        x: e.position[0],
        y: (BUS_HEIGHT * e.scale) / 2,
        z: e.position[2],
        sizeX: BUS_WIDTH * e.scale,
        sizeY: BUS_HEIGHT * e.scale,
        sizeZ: BUS_LENGTH * e.scale,
        rotationY: e.rotationY,
      })
    ),
  ...CARNIVAL_STALLS.map(({ position: [x, z] }) =>
    createBoxSolid({ x, y: 1.25, z, sizeX: STALL_SIZE[0], sizeY: 2.5, sizeZ: STALL_SIZE[1], rotationY: 0 })
  ),
]
