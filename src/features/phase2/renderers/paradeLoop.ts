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
 * `[x, z]` corners of the loop — the outer street ring in `phase2.json`'s
 * paving grid (see the `suelo-calles-adoquin-calle-recta`/`-cruce` tiles at
 * `±32`), well inside `appConfig.player.phase2Bounds`.
 */
const LOOP_CORNERS: Array<[number, number]> = [
  [-32, -32],
  [32, -32],
  [32, 32],
  [-32, 32],
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
  /** Travel direction. */
  reverse: boolean
}

/**
 * @param id - Entity id, seeding this vehicle's pacing so it differs from its siblings
 * @returns Deterministic loop pacing for that entity
 */
export function paradeLoopParamsFor(id: string): ParadeLoopParams {
  const rand = createSeededRandom(hashSeed(id))
  return { speed: 2.4 + rand() * 1.4, startU: rand(), reverse: rand() > 0.5 }
}

/**
 * Drives `groupRef`'s position/heading around the shared parade loop every
 * frame. The model's forward is assumed to be local `+Z` (Blender `+Y`,
 * matching this asset family's authoring convention — see
 * `FlyingCarRenderer`'s identical heading formula for cars).
 * @param groupRef - Ref to the group wrapping the vehicle's model
 * @param id - Entity id, for deterministic per-vehicle pacing
 */
export function useParadeLoopMotion(groupRef: RefObject<THREE.Group | null>, id: string): void {
  const curve = useMemo(() => getParadeLoopCurve(), [])
  const params = useMemo(() => paradeLoopParamsFor(id), [id])

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const length = curve.getLength()
    const dir = params.reverse ? -1 : 1
    const u = THREE.MathUtils.euclideanModulo(params.startU + (clock.elapsedTime * params.speed * dir) / length, 1)
    const point = curve.getPointAt(u)
    const tangent = curve.getTangentAt(u)
    const heading = Math.atan2(tangent.x * dir, tangent.z * dir)
    group.position.set(point.x, point.y, point.z)
    group.rotation.y = heading
  })
}
