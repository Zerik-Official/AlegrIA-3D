/**
 * Shared driving loop for Phase 2's `parade-vehicle` entities — a closed
 * curve tracing the plaza's outer street ring, so cars/floats read as
 * patrolling the whole quadrant instead of sitting parked. Each vehicle gets
 * its own speed/start/direction from its entity id, so a handful of vehicles
 * spread themselves around the loop instead of convoying together.
 * @module features/phase2/renderers/paradeLoop
 */

import { useMemo, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'

/**
 * `[x, z]` corners of the loop — the small block right around the central
 * platform/dancers, on the paving grid's `±16` street row/column (see the
 * `suelo-calles-adoquin-calle-recta`/`-cruce` tiles), matching where these
 * vehicles originally sat (`x: 16`) and passing right by the portal at
 * `[0, -16]`. This is deliberately not the whole plaza — just the block the
 * vehicles were parked around originally, now driven instead of parked.
 */
const LOOP_CORNERS: Array<[number, number]> = [
  [-16, -16],
  [16, -16],
  [16, 16],
  [-16, 16],
]

let cachedLoopCurve: THREE.CatmullRomCurve3 | null = null

/**
 * @returns The (memoized, shared) closed loop curve every parade vehicle follows
 */
export function getParadeLoopCurve(): THREE.CatmullRomCurve3 {
  if (!cachedLoopCurve) {
    cachedLoopCurve = new THREE.CatmullRomCurve3(LOOP_CORNERS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'catmullrom', 0.12)
  }
  return cachedLoopCurve
}

/** One vehicle's deterministic pacing around {@link getParadeLoopCurve}. */
export interface ParadeLoopParams {
  /** Units per second along the loop. */
  speed: number
  /** Starting position in `[0, 1)` around the loop. */
  startU: number
}

/**
 * @param id - Entity id, seeding this vehicle's pacing so it differs from its siblings
 * @returns Deterministic loop pacing for that entity — every vehicle travels the same
 *   direction around the loop so they never meet head-on/collide; only speed and starting
 *   position vary per vehicle.
 */
export function paradeLoopParamsFor(id: string): ParadeLoopParams {
  const rand = createSeededRandom(hashSeed(id))
  return { speed: 1.0 + rand() * 0.6, startU: rand() }
}

/**
 * Per-`entity.variant` heading correction, in radians, added on top of the
 * loop's computed heading. Every model here is assumed to be authored
 * front-forward on local `+Z` (Blender `+Y`) — same convention as
 * `FlyingCarRenderer`'s cars — but if a given `.glb` was actually authored
 * facing the other way, it'll drive tail-first until its entry here is
 * flipped by `Math.PI`.
 */
const FACING_OFFSET: Record<string, number> = {
  'carrosa-riwi': 0,
  'carrosa-marimonda': 0,
  'chiva-rumbera': 0,
}

/**
 * Drives `groupRef`'s position/heading around the shared parade loop every frame.
 * @param groupRef - Ref to the group wrapping the vehicle's model
 * @param id - Entity id, for deterministic per-vehicle pacing
 * @param variant - `entity.variant`, used to look up this model's {@link FACING_OFFSET}
 */
export function useParadeLoopMotion(groupRef: RefObject<THREE.Group | null>, id: string, variant?: string): void {
  const curve = useMemo(() => getParadeLoopCurve(), [])
  const params = useMemo(() => paradeLoopParamsFor(id), [id])
  const facingOffset = FACING_OFFSET[variant ?? ''] ?? 0

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const length = curve.getLength()
    const u = THREE.MathUtils.euclideanModulo(params.startU + (clock.elapsedTime * params.speed) / length, 1)
    const point = curve.getPointAt(u)
    const tangent = curve.getTangentAt(u)
    const heading = Math.atan2(-tangent.x, -tangent.z)
    group.position.set(point.x, point.y, point.z)
    group.rotation.y = heading + facingOffset
  })
}
