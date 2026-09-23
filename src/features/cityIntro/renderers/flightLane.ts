/**
 * Flight-lane helpers: turn `flight-lane-point` entities into named closed
 * loops so `flying-car`/`flying-train` entities can travel an authored route
 * (set via each vehicle's `title` field as the lane id) instead of orbiting
 * a single JSON anchor.
 * @module features/cityIntro/renderers/flightLane
 */

import * as THREE from 'three'
import type { EditableEntity } from '@/engine/types'

/**
 * Groups `flight-lane-point` entities into named, ordered waypoint lists.
 * Each point's `variant` is `"<laneId>:<order>"`, mirroring `path-point`'s
 * bare order string but namespaced by lane.
 * @param entities - All entities in the cityIntro scene
 * @returns Map of lane id to ordered waypoints (world space)
 */
export function buildFlightLanes(entities: EditableEntity[]): Record<string, THREE.Vector3[]> {
  const grouped: Record<string, { order: number; point: THREE.Vector3 }[]> = {}
  for (const entity of entities) {
    if (entity.type !== 'flight-lane-point' || !entity.variant) continue
    const [laneId, orderRaw] = entity.variant.split(':')
    if (!laneId) continue
    const list = (grouped[laneId] ??= [])
    list.push({ order: parseFloat(orderRaw ?? '0') || 0, point: new THREE.Vector3(...entity.position) })
  }
  const lanes: Record<string, THREE.Vector3[]> = {}
  for (const [laneId, points] of Object.entries(grouped)) {
    lanes[laneId] = points.sort((a, b) => a.order - b.order).map((p) => p.point)
  }
  return lanes
}

/**
 * Builds a closed Catmull-Rom loop from a lane's waypoints, so vehicles can
 * circulate it indefinitely. Returns `null` when there aren't enough points.
 * @param waypoints - Ordered lane waypoints
 * @returns Closed curve, or `null` when the lane has fewer than 3 points
 */
export function buildLaneCurve(waypoints: THREE.Vector3[] | undefined): THREE.CatmullRomCurve3 | null {
  if (!waypoints || waypoints.length < 3) return null
  return new THREE.CatmullRomCurve3(waypoints, true, 'catmullrom', 0.4)
}
