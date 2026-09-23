import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createSeededRandom } from '@/shared/utils/random'

/** Instance count for the hazy background skyline. */
const COUNT = 320
/** Half-width of the near corridor kept clear so filler never clips the curated JSON buildings. */
const CLEAR_CORRIDOR_X = 16
/** Z beyond which the near corridor no longer needs protecting (past the last curated building/library). */
const CLEAR_CORRIDOR_MIN_Z = -65
/** Deterministic seed so the skyline looks the same every load without being JSON-authored. */
const SEED = 9182731

/**
 * A single `InstancedMesh` of simple, dimly-lit boxes stretching far past the
 * curated JSON skyscrapers, so the city reads as an endless sprawl fading into
 * fog instead of stopping abruptly at the edge of the authored street. Not
 * JSON/editor-driven on purpose — hundreds of individually-editable background
 * silhouettes would defeat the point; only the near "hero" buildings are authored.
 *
 * @returns Instanced filler-building mesh
 */
export const CityFillerSkyline = memo(function CityFillerSkyline() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.2, emissive: '#0a0a1e', emissiveIntensity: 0.5 }), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const rand = createSeededRandom(SEED)
    const dummy = new THREE.Object3D()
    const color = new THREE.Color()
    let placed = 0
    let attempts = 0
    while (placed < COUNT && attempts < COUNT * 6) {
      attempts++
      const x = (rand() > 0.5 ? 1 : -1) * (18 + rand() * 130)
      const z = 80 - rand() * 310
      if (Math.abs(x) < CLEAR_CORRIDOR_X && z > CLEAR_CORRIDOR_MIN_Z) continue

      const width = 3 + rand() * 5
      const depth = 3 + rand() * 5
      const height = 10 + rand() * 50
      dummy.position.set(x, height / 2, z)
      dummy.scale.set(width, height, depth)
      dummy.rotation.y = rand() * Math.PI
      dummy.updateMatrix()
      mesh.setMatrixAt(placed, dummy.matrix)

      const tone = 0.14 + rand() * 0.2
      color.setRGB(tone * 0.55, tone * 0.6, tone * 0.95)
      mesh.setColorAt(placed, color)
      placed++
    }
    mesh.count = placed
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  return <instancedMesh ref={meshRef} args={[geometry, material, COUNT]} frustumCulled={false} receiveShadow />
})
