/**
 * Draws the colliders that come from loaded models (`COL_*` proxies and
 * bounds fallbacks) while the editor's collision view is on. JSON colliders
 * draw themselves (see `engine/EntityCollider`), so only model ones are here;
 * they are read-only since they live in the `.glb` files.
 * @module features/editor/components/CollisionDebugLayer
 */

import { memo, useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCollisionsBySource, getCollisionVersion, type CollisionCircle, type CollisionSolid } from '@/features/player/collision'
import { useCollisionDebugVisible } from '@/features/editor/state/collisionDebug'

/** Debug color of model colliders, distinct from the editable JSON ones. */
const MODEL_COLOR = '#ff9a3c'

/**
 * Props for {@link ModelColliderShape}.
 */
interface ModelColliderShapeProps {
  /** Center of the shape. */
  position: [number, number, number]
  /** Geometry of the shape. */
  geometry: React.ReactNode
}

/**
 * @param props - Placement and geometry
 * @returns Translucent fill and wireframe outline
 */
function ModelColliderShape({ position, geometry }: ModelColliderShapeProps) {
  return (
    <group position={position}>
      <mesh renderOrder={998}>
        {geometry}
        <meshBasicMaterial color={MODEL_COLOR} transparent opacity={0.1} depthWrite={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh renderOrder={999}>
        {geometry}
        <meshBasicMaterial color={MODEL_COLOR} wireframe transparent opacity={0.8} depthWrite={false} fog={false} />
      </mesh>
    </group>
  )
}

/**
 * @returns Model collider drawings, or nothing while the collision view is off
 */
export const CollisionDebugLayer = memo(function CollisionDebugLayer() {
  const visible = useCollisionDebugVisible()
  const [shapes, setShapes] = useState<{ solids: CollisionSolid[]; circles: CollisionCircle[] }>({ solids: [], circles: [] })
  const seenVersion = useRef(-1)

  useEffect(() => {
    if (!visible) seenVersion.current = -1
  }, [visible])

  useFrame(() => {
    if (!visible) return
    const version = getCollisionVersion()
    if (version === seenVersion.current) return
    seenVersion.current = version
    setShapes(getCollisionsBySource('model'))
  })

  if (!visible) return null

  return (
    <group userData={{ editorIgnore: true }}>
      {shapes.solids.map((solid, i) => (
        <ModelColliderShape
          key={`solid-${i}`}
          position={[(solid.minX + solid.maxX) / 2, (solid.minY + solid.maxY) / 2, (solid.minZ + solid.maxZ) / 2]}
          geometry={<boxGeometry args={[solid.maxX - solid.minX, solid.maxY - solid.minY, solid.maxZ - solid.minZ]} />}
        />
      ))}
      {shapes.circles.map((circle, i) => (
        <ModelColliderShape
          key={`circle-${i}`}
          position={[circle.x, (circle.minY + circle.maxY) / 2, circle.z]}
          geometry={<cylinderGeometry args={[circle.radius, circle.radius, circle.maxY - circle.minY, 24]} />}
        />
      ))}
    </group>
  )
})
