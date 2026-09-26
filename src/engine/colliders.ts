/**
 * Resolves the collider of each JSON entity and turns it into colliders for
 * the shared collision world (see `features/player/collision`).
 *
 * An entity's own `collider` wins; otherwise its type's default is read from
 * `engine/config/colliders.json`, whose keys are exact types or prefixes
 * ending in `*`.
 * @module engine/colliders
 */

import colliderDefaultsJson from '@/engine/config/colliders.json'
import { createBoxSolid, type CollisionCircle, type CollisionSolid } from '@/features/player/collision'
import type { ColliderSpec, EditableEntity } from '@/engine/types'

/** Default collider per entity type, keyed by exact type or by a prefix ending in `*`. */
const colliderDefaults = colliderDefaultsJson as unknown as Record<string, ColliderSpec>

/** Box size used when a box collider omits `size`. */
export const DEFAULT_BOX_SIZE: [number, number, number] = [1, 1, 1]
/** Cylinder radius used when a cylinder collider omits `radius`. */
export const DEFAULT_CYLINDER_RADIUS = 0.5
/** Cylinder height used when a cylinder collider omits `height`. */
export const DEFAULT_CYLINDER_HEIGHT = 2

/**
 * @param type - Entity type
 * @returns The type's default collider, or `undefined` when it has none
 */
export function defaultColliderForType(type: string): ColliderSpec | undefined {
  if (colliderDefaults[type]) return colliderDefaults[type]
  for (const [key, spec] of Object.entries(colliderDefaults)) {
    if (key.endsWith('*') && type.startsWith(key.slice(0, -1))) return spec
  }
  return undefined
}

/**
 * @param entity - Entity to resolve
 * @returns The collider the entity uses, or `undefined` when it has none
 */
export function resolveCollider(entity: EditableEntity): ColliderSpec | undefined {
  const spec = entity.collider ?? defaultColliderForType(entity.type)
  if (!spec || spec.shape === 'none') return undefined
  return spec
}

/**
 * @param spec - Collider to test
 * @param activeTags - Tags the scene currently enables
 * @returns Whether the collider should collide right now
 */
export function isColliderActive(spec: ColliderSpec, activeTags: readonly string[] | undefined): boolean {
  if (!spec.tag) return true
  return !!activeTags?.includes(spec.tag)
}

/**
 * Builds the world-space colliders of an entity's collider spec.
 * @param entity - Owner entity, providing position, `rotationY` and `scale`
 * @param spec - Collider in the entity's local space
 * @returns Box solids and blocking circles to register
 */
export function buildColliderShapes(entity: EditableEntity, spec: ColliderSpec): { solids: CollisionSolid[]; circles: CollisionCircle[] } {
  const [px, py, pz] = entity.position
  const [ox, oy, oz] = spec.offset ?? [0, 0, 0]
  const cos = Math.cos(entity.rotationY)
  const sin = Math.sin(entity.rotationY)
  const scale = entity.scale
  const x = px + (ox * cos + oz * sin) * scale
  const y = py + oy * scale
  const z = pz + (-ox * sin + oz * cos) * scale

  if (spec.shape === 'cylinder') {
    const radius = (spec.radius ?? DEFAULT_CYLINDER_RADIUS) * scale
    const height = (spec.height ?? DEFAULT_CYLINDER_HEIGHT) * scale
    return { solids: [], circles: [{ x, z, radius, minY: y, maxY: y + height }] }
  }

  const [sx, sy, sz] = spec.size ?? DEFAULT_BOX_SIZE
  return {
    solids: [createBoxSolid({ x, y, z, sizeX: sx * scale, sizeY: sy * scale, sizeZ: sz * scale, rotationY: entity.rotationY })],
    circles: [],
  }
}
