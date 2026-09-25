import { memo, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getCollisionSolids } from '@/features/player/collision'

/**
 * Props for {@link RainSplashes}.
 */
interface RainSplashesProps {
  /** How many ripples are alive at once at full strength. */
  count: number
  /** Current rain strength `[0,1]`, eased by `PhaseRain`. */
  intensity: MutableRefObject<number>
}

/** Radius around the player splashes land within. */
const SPLASH_REACH = 14
/** Seconds one ripple lasts. */
const LIFETIME = 0.5
/** Highest surface a splash may land on — anything taller is a building, not a floor. */
const MAX_FLOOR_Y = 1.2

/**
 * @param x - World X
 * @param z - World Z
 * @returns Height of the walkable floor at `(x, z)` — raised sidewalks and decks included, ground level otherwise
 */
function floorAt(x: number, z: number): number {
  let top = 0
  for (const s of getCollisionSolids()) {
    if (s.maxY > MAX_FLOOR_Y || x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) continue
    if (s.maxY > top) top = s.maxY
  }
  return top
}

/** Reused transform scratch so the ripples allocate nothing per frame. */
const scratch = {
  matrix: new THREE.Matrix4(),
  position: new THREE.Vector3(),
  quaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
  scale: new THREE.Vector3(),
  color: new THREE.Color(),
}

/**
 * Raindrops hitting the ground around the player: little rings that spring
 * open and fade, respawning at random spots (on raised sidewalks too) with
 * staggered lifetimes so the ground seems to boil with rain.
 *
 * @param props - Ripple count and live intensity
 * @returns Instanced ripples
 */
export const RainSplashes = memo(function RainSplashes({ count, intensity }: RainSplashesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const state = useMemo(() => {
    const ages = new Float32Array(count)
    const spots = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) ages[i] = Math.random() * LIFETIME
    return { ages, spots }
  }, [count])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < count; i++) mesh.setColorAt(i, scratch.color.setRGB(0, 0, 0))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [count])

  useFrame(({ camera }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const dt = Math.min(delta, 0.05)
    const alive = Math.floor(count * intensity.current)
    for (let i = 0; i < count; i++) {
      state.ages[i] += dt
      if (state.ages[i] >= LIFETIME) {
        state.ages[i] -= LIFETIME
        const a = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random()) * SPLASH_REACH
        const x = camera.position.x + Math.cos(a) * r
        const z = camera.position.z + Math.sin(a) * r
        state.spots[i * 3] = x
        state.spots[i * 3 + 1] = floorAt(x, z) + 0.035
        state.spots[i * 3 + 2] = z
      }
      const k = state.ages[i] / LIFETIME
      const s = i < alive ? 0.25 + k * 1.6 : 0.0001
      scratch.position.set(state.spots[i * 3], state.spots[i * 3 + 1], state.spots[i * 3 + 2])
      scratch.scale.set(s, s, s)
      scratch.matrix.compose(scratch.position, scratch.quaternion, scratch.scale)
      mesh.setMatrixAt(i, scratch.matrix)
      const fade = (1 - k) * 0.7
      mesh.setColorAt(i, scratch.color.setRGB(fade, fade, fade * 1.08))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <ringGeometry args={[0.05, 0.075, 16]} />
      <meshBasicMaterial color="#ffffff" transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </instancedMesh>
  )
})
