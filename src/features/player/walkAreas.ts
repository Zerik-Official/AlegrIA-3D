/**
 * Shared registry of the rectangles the player may walk inside. Scenes
 * publish them from their JSON `walk-area` entities; the player stays inside
 * the union of every registered rectangle, and moves freely while none is.
 * @module features/player/walkAreas
 */

import type { Bounds } from '@/shared/types'

const areas = new Map<string, Bounds>()
let flattened: Bounds[] = []
let stale = false

/**
 * Registers (or replaces) one walkable rectangle.
 * @param id - Stable owner id, typically the entity id
 * @param bounds - World-space rectangle
 */
export function registerWalkArea(id: string, bounds: Bounds): void {
  areas.set(id, bounds)
  stale = true
}

/**
 * @param id - Owner id passed to {@link registerWalkArea}
 */
export function unregisterWalkArea(id: string): void {
  if (areas.delete(id)) stale = true
}

/**
 * @returns Every registered rectangle, cached until the registry changes
 */
export function getWalkAreas(): readonly Bounds[] {
  if (stale) {
    flattened = Array.from(areas.values())
    stale = false
  }
  return flattened
}

/**
 * @param list - Walkable rectangles
 * @param x - World X
 * @param z - World Z
 * @returns Whether `(x, z)` lies inside at least one of them
 */
export function isInsideWalkAreas(list: readonly Bounds[], x: number, z: number): boolean {
  for (const a of list) if (x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ) return true
  return false
}
