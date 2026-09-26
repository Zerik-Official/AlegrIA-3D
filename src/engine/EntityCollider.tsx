/**
 * Publishes an entity's JSON collider to the shared collision world and,
 * while the editor's collision view is on, draws it in the entity's local
 * space so it follows the gizmo live.
 * @module engine/EntityCollider
 */

import { memo, useEffect } from 'react'
import * as THREE from 'three'
import { buildColliderShapes, DEFAULT_BOX_SIZE, DEFAULT_CYLINDER_HEIGHT, DEFAULT_CYLINDER_RADIUS, isColliderActive, resolveCollider } from '@/engine/colliders'
import { registerCollisionSolids, unregisterCollisionSolids } from '@/features/player/collision'
import { useCollisionDebugVisible } from '@/features/editor/state/collisionDebug'
import type { ColliderSpec, EditableEntity } from '@/engine/types'

/** Debug color of a collider that currently collides. */
const ACTIVE_COLOR = '#39d0ff'
/** Keeps scene-wide fades (the library's wormhole fade-out) from overriding the debug opacity. */
const OWNS_OPACITY = { ownsOpacity: true }
/** Debug color of a tagged collider whose tag is not active in this scene state. */
const INACTIVE_COLOR = '#7a7f8c'

/**
 * Props for {@link EntityCollider}.
 */
interface EntityColliderProps {
  /** Owner entity. */
  entity: EditableEntity
  /** Tags the scene currently enables for tagged colliders. */
  activeTags?: string[]
}

/**
 * Props for {@link ColliderGizmo}.
 */
interface ColliderGizmoProps {
  /** Collider to draw, in the owner's local space. */
  spec: ColliderSpec
  /** Whether the collider currently collides. */
  active: boolean
}

/**
 * Translucent fill plus wireframe outline of a collider.
 * @param props - Collider and state
 * @returns Debug group, ignored by the editor's spawn raycast
 */
function ColliderGizmo({ spec, active }: ColliderGizmoProps) {
  const color = active ? ACTIVE_COLOR : INACTIVE_COLOR
  const [ox, oy, oz] = spec.offset ?? [0, 0, 0]
  const isCylinder = spec.shape === 'cylinder'
  const radius = spec.radius ?? DEFAULT_CYLINDER_RADIUS
  const height = spec.height ?? DEFAULT_CYLINDER_HEIGHT
  const size = spec.size ?? DEFAULT_BOX_SIZE
  const position: [number, number, number] = isCylinder ? [ox, oy + height / 2, oz] : [ox, oy, oz]
  const geometry = isCylinder ? <cylinderGeometry args={[radius, radius, height, 24]} /> : <boxGeometry args={size} />

  return (
    <group position={position} userData={{ editorIgnore: true }}>
      <mesh renderOrder={998} userData={OWNS_OPACITY}>
        {geometry}
        <meshBasicMaterial color={color} transparent opacity={0.14} depthWrite={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh renderOrder={999} userData={OWNS_OPACITY}>
        {geometry}
        <meshBasicMaterial color={color} wireframe transparent opacity={0.85} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}

/**
 * @param props - Owner entity and active tags
 * @returns The collider's debug drawing while the collision view is on, otherwise nothing
 */
export const EntityCollider = memo(function EntityCollider({ entity, activeTags }: EntityColliderProps) {
  const debugVisible = useCollisionDebugVisible()
  const spec = resolveCollider(entity)
  const active = !!spec && isColliderActive(spec, activeTags)

  useEffect(() => {
    if (!spec || !active) return
    const id = `json:${entity.id}`
    const { solids, circles } = buildColliderShapes(entity, spec)
    registerCollisionSolids(id, solids, circles, 'json')
    return () => unregisterCollisionSolids(id)
  }, [entity, spec, active])

  if (!spec || !debugVisible) return null
  return <ColliderGizmo spec={spec} active={active} />
})
