/**
 * `walk-area` entity renderer: publishes an axis-aligned rectangle the player
 * may walk inside (see `features/player/walkAreas`) and draws it while the
 * editor's collision view is on.
 * @module features/player/renderers/WalkAreaRenderer
 */

import { useContext, useEffect } from 'react'
import * as THREE from 'three'
import { DEFAULT_AREA_SIZE, registerWalkArea, unregisterWalkArea } from '@/features/player/walkAreas'
import { CollisionPublishContext } from '@/features/player/CollisionPublishContext'
import { useCollisionDebugVisible } from '@/features/editor/state/collisionDebug'
import type { EntityRendererProps } from '@/engine/types'

/** Height of the debug walls marking the area's edges. */
const WALL_HEIGHT = 2.5
/** Debug color of walkable areas. */
const AREA_COLOR = '#5cff8a'
/** Keeps scene-wide fades from overriding the debug opacity. */
const OWNS_OPACITY = { ownsOpacity: true }

/**
 * @param props - Entity props
 * @returns Debug drawing while the collision view is on, otherwise nothing
 */
export function WalkAreaRenderer({ entity }: EntityRendererProps) {
  const debugVisible = useCollisionDebugVisible()
  const [width, depth] = entity.areaSize ?? DEFAULT_AREA_SIZE
  const [x, , z] = entity.position
  const scale = entity.scale
  const publish = useContext(CollisionPublishContext)

  useEffect(() => {
    if (!publish) return
    const halfX = (width * scale) / 2
    const halfZ = (depth * scale) / 2
    registerWalkArea(entity.id, { minX: x - halfX, maxX: x + halfX, minZ: z - halfZ, maxZ: z + halfZ })
    return () => unregisterWalkArea(entity.id)
  }, [entity.id, x, z, width, depth, scale, publish])

  if (!debugVisible) return null
  return (
    <group rotation-y={-entity.rotationY} userData={{ editorIgnore: true }}>
      <mesh position={[0, 0.06, 0]} rotation-x={-Math.PI / 2} renderOrder={997} userData={OWNS_OPACITY}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial color={AREA_COLOR} transparent opacity={0.08} depthWrite={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, WALL_HEIGHT / 2, 0]} renderOrder={999} userData={OWNS_OPACITY}>
        <boxGeometry args={[width, WALL_HEIGHT, depth]} />
        <meshBasicMaterial color={AREA_COLOR} wireframe transparent opacity={0.7} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}