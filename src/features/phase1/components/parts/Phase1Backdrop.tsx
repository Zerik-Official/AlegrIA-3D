import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createSeededRandom } from '@/shared/utils/random'

/** Instance counts for the two instanced backdrop layers. */
const HILL_COUNT = 28
const TREE_COUNT = 220
/** Annulus the backdrop is scattered across, clear of the authored plaza. */
const INNER_RADIUS = 24
const OUTER_RADIUS = 140
/** Deterministic seed so the backdrop looks the same every load. */
const SEED = 4471

/**
 * Picks a random point in the backdrop annulus.
 * @param rand - Seeded [0,1) generator
 * @returns XZ point
 */
function ringPoint(rand: () => number): { x: number; z: number } {
  const angle = rand() * Math.PI * 2
  const r = INNER_RADIUS + rand() * (OUTER_RADIUS - INNER_RADIUS)
  return { x: Math.cos(angle) * r, z: Math.sin(angle) * r }
}

/**
 * Distant hills and a dense tree line filling the horizon beyond Phase 1's
 * authored plaza, so the world fades into haze instead of stopping at a
 * visible ground-plane edge. Three `InstancedMesh` layers (hills, trunks,
 * foliage) keep this to three draw calls regardless of instance count. Not
 * JSON/editor-driven on purpose — this is unauthored backdrop, not scene content.
 *
 * @returns Backdrop group
 */
export const Phase1Backdrop = memo(function Phase1Backdrop() {
  const hillsRef = useRef<THREE.InstancedMesh>(null)
  const trunksRef = useRef<THREE.InstancedMesh>(null)
  const foliageRef = useRef<THREE.InstancedMesh>(null)

  const hillGeometry = useMemo(() => new THREE.SphereGeometry(1, 12, 8), [])
  const hillMaterial = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1 }), [])
  const trunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.12, 0.16, 1, 6), [])
  const trunkMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2e1f14', roughness: 0.95 }), [])
  const foliageGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), [])
  const foliageMaterial = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.9 }), [])

  useLayoutEffect(() => {
    const rand = createSeededRandom(SEED)
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()

    const hills = hillsRef.current
    if (hills) {
      for (let i = 0; i < HILL_COUNT; i++) {
        const { x, z } = ringPoint(rand)
        const s = 10 + rand() * 26
        dummy.position.set(x, -s * 0.3, z)
        dummy.scale.set(s, s * (0.35 + rand() * 0.25), s)
        dummy.rotation.y = rand() * Math.PI
        dummy.updateMatrix()
        hills.setMatrixAt(i, dummy.matrix)
        const tone = 0.3 + rand() * 0.25
        color.setRGB(tone * 0.5, tone * 0.55, tone * 0.28)
        hills.setColorAt(i, color)
      }
      hills.instanceMatrix.needsUpdate = true
      if (hills.instanceColor) hills.instanceColor.needsUpdate = true
    }

    const trunks = trunksRef.current
    const foliage = foliageRef.current
    if (trunks && foliage) {
      for (let i = 0; i < TREE_COUNT; i++) {
        const { x, z } = ringPoint(rand)
        const trunkHeight = 1.6 + rand() * 1.6
        dummy.position.set(x, trunkHeight / 2, z)
        dummy.scale.set(1, trunkHeight, 1)
        dummy.rotation.y = rand() * Math.PI
        dummy.updateMatrix()
        trunks.setMatrixAt(i, dummy.matrix)

        const foliageScale = 0.9 + rand() * 1.1
        dummy.position.set(x, trunkHeight + foliageScale * 0.55, z)
        dummy.scale.setScalar(foliageScale)
        dummy.updateMatrix()
        foliage.setMatrixAt(i, dummy.matrix)
        const tone = 0.28 + rand() * 0.24
        color.setRGB(tone * 0.35, tone * 0.65, tone * 0.28)
        foliage.setColorAt(i, color)
      }
      trunks.instanceMatrix.needsUpdate = true
      foliage.instanceMatrix.needsUpdate = true
      if (foliage.instanceColor) foliage.instanceColor.needsUpdate = true
    }
  }, [])

  return (
    <group>
      <instancedMesh ref={hillsRef} args={[hillGeometry, hillMaterial, HILL_COUNT]} frustumCulled={false} />
      <instancedMesh ref={trunksRef} args={[trunkGeometry, trunkMaterial, TREE_COUNT]} frustumCulled={false} />
      <instancedMesh ref={foliageRef} args={[foliageGeometry, foliageMaterial, TREE_COUNT]} frustumCulled={false} />
    </group>
  )
})
