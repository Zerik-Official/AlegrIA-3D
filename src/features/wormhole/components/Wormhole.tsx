import { useRef, useMemo, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { wormholeConfig } from '@/shared/config/appConfig'
import { createSeededRandom } from '@/shared/utils/random'

/** Deterministic random source for this module's procedural layout, so render stays pure. */
const seededRandom = createSeededRandom(15130)

/** Where the effect sits unless told otherwise: over the pedestal's levitating book. */
const DEFAULT_CENTER: [number, number, number] = [0, 1.65, 0]

/**
 * Props for {@link Wormhole}.
 */
interface WormholeProps {
  /** Whether the wormhole tunnel should be visible and animated. */
  active: boolean
  /** Normalized progress in [0,1]. */
  progress: number
  /** World position the effect is centered on — the pedestal's book by default, the portal when crossing it. */
  center?: [number, number, number]
}

/** Reused quaternion instances to avoid per-frame allocations. */
const flipQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
const targetQuat = new THREE.Quaternion()

/**
 * NMS-inspired hyperjump wormhole: concentric torus rings + streaking star field.
 * Optimized with precomputed ring metadata, memoized buffers and reused quaternions.
 *
 * @param props - Wormhole state
 * @returns Wormhole group or null when inactive
 */
export const Wormhole = memo(function Wormhole({ active, progress, center = DEFAULT_CENTER }: WormholeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const starsRef = useRef<THREE.Points>(null)
  const ringRefs = useRef<THREE.Mesh[]>([])
  const { camera } = useThree()
  const count = wormholeConfig.ringCount

  const rings = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        z: -i * 1.18,
        radius: 1.35 + i * 0.052,
        hue: i < 10 ? 38 : i < 22 ? 195 : i < 34 ? 265 : 0,
        sat: i < 10 ? 95 : 85,
        light: i < 10 ? 56 : 62,
        opacity: 1 - i / count,
        color: new THREE.Color(`hsl(${i < 10 ? 38 : i < 22 ? 195 : i < 34 ? 265 : 0}, ${i < 10 ? 95 : 85}%, ${i < 10 ? 56 : 62}%)`),
        emissive: new THREE.Color(`hsl(${i < 10 ? 38 : i < 22 ? 195 : i < 34 ? 265 : 0}, 100%, 58%)`),
      })),
    [count],
  )

  const starCount = wormholeConfig.starCount
  const starPositions = useMemo(() => {
    const arr = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const r = 0.25 + seededRandom() * 3.1
      const theta = seededRandom() * Math.PI * 2
      const z = -seededRandom() * 52
      arr[i * 3] = Math.cos(theta) * r
      arr[i * 3 + 1] = Math.sin(theta) * r
      arr[i * 3 + 2] = z
    }
    return arr
  }, [starCount])

  const starSpeeds = useMemo(() => {
    const arr = new Float32Array(starCount)
    for (let i = 0; i < starCount; i++) arr[i] = 0.18 + seededRandom() * 0.55
    return arr
  }, [starCount])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    targetQuat.copy((camera as THREE.PerspectiveCamera).quaternion)
    targetQuat.multiply(flipQuat)
    groupRef.current.quaternion.slerp(targetQuat, active ? 0.18 : 0.08)

    for (let i = 0; i < ringRefs.current.length; i++) {
      const mesh = ringRefs.current[i]
      if (!mesh) continue
      let z = mesh.position.z + 0.08 + progress * 0.22
      if (z > 5) z -= count * 1.18
      mesh.position.z = z
      mesh.rotation.z = t * (0.28 + i * 0.004) + i * 0.13
      const s = 1 + Math.sin(t * 1.8 + i * 0.31) * 0.05 + progress * 0.42
      mesh.scale.set(s, s, 1)
    }

    if (active) {
      groupRef.current.rotateZ(0.015 + progress * 0.03)
    }

    if (starsRef.current) {
      const pos = starsRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < starCount; i++) {
        let z = pos.getZ(i)
        z += starSpeeds[i] * (1.2 + progress * 3.5)
        if (z > 4.5) {
          z = -52 + Math.random() * 2
          const r = 0.25 + Math.random() * 3.1
          const theta = Math.random() * Math.PI * 2
          pos.setX(i, Math.cos(theta) * r)
          pos.setY(i, Math.sin(theta) * r)
        }
        pos.setZ(i, z)
      }
      pos.needsUpdate = true
      const mat = starsRef.current.material as THREE.PointsMaterial
      mat.size = 0.04 + progress * 0.12
      mat.opacity = 0.55 + progress * 0.45
    }
  })

  if (!active && progress === 0) return null

  return (
    <group ref={groupRef} position={center}>
      <mesh position={[0, 0, -count * 0.58]}>
        <sphereGeometry args={[0.85 + progress * 3.1, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.92} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -count * 0.57]}>
        <sphereGeometry args={[1.25 + progress * 4.2, 32, 32]} />
        <meshStandardMaterial
          color="#a8d8ff"
          emissive="#3a7bff"
          emissiveIntensity={1.4 + progress * 2.5}
          transparent
          opacity={0.38}
          depthWrite={false}
        />
      </mesh>

      {rings.map((r, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) ringRefs.current[i] = el
          }}
          position={[0, 0, r.z]}
          rotation-z={i * 0.13}
        >
          <torusGeometry args={[r.radius, 0.07 + (i % 4) * 0.018 + progress * 0.04, 10, 64]} />
          <meshStandardMaterial
            color={r.color}
            emissive={r.emissive}
            emissiveIntensity={0.85 + progress * 1.4}
            transparent
            opacity={r.opacity * (0.62 + progress * 0.38)}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#d8e8ff"
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      <points position={[0, 0, -10]}>
        <sphereGeometry args={[3.0, 12, 12]} />
        <pointsMaterial size={0.025} color="#9a7bff" transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
      </points>

      <mesh>
        <cylinderGeometry args={[0.02, 4.2, 56, 32, 1, true]} />
        <meshStandardMaterial
          color="#3a7bff"
          emissive="#7a3cff"
          emissiveIntensity={0.32 + progress * 0.4}
          transparent
          opacity={0.09 + progress * 0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh position={[0, 0, 3.8]}>
        <ringGeometry args={[3.9, 4.25, 64]} />
        <meshBasicMaterial
          color="#ff3b9a"
          transparent
          opacity={0.07 + progress * 0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
})
