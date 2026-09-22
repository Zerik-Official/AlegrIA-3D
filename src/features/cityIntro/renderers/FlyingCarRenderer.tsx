/**
 * `flying-car` entity renderer for the `cityIntro` scene.
 * @module features/cityIntro/renderers/FlyingCarRenderer
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { useTrailBuffer, createTrailMaterial } from '@/features/cityIntro/renderers/trail'
import type { EntityRendererProps } from '@/engine/types'

/** Trail sample count for a single flying car. */
const CAR_TRAIL_LENGTH = 16

/**
 * Low, sporty hull built from a flattened capsule + canopy + nose + fins,
 * reading as a "flying car" silhouette instead of a bare capsule.
 * @param props - Body color
 * @returns Car body group
 */
export function ProceduralFlyingCar({ color = '#ff6a3a' }: { color?: string }) {
  return (
    <group>
      <mesh rotation-x={Math.PI / 2} scale={[1, 1, 0.46]} castShadow>
        <capsuleGeometry args={[0.24, 0.62, 4, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.13, 0.04]} scale={[0.6, 0.46, 0.85]}>
        <sphereGeometry args={[0.26, 12, 10]} />
        <meshStandardMaterial color="#8fd8ff" transparent opacity={0.55} metalness={0.2} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.02, 0.5]} rotation-x={Math.PI / 2} scale={[1, 1, 0.46]}>
        <coneGeometry args={[0.2, 0.3, 10]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.2, 0.02, -0.42]} rotation-y={s * 0.35}>
          <boxGeometry args={[0.03, 0.12, 0.24]} />
          <meshStandardMaterial color="#1a1a20" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`h${s}`} position={[s * 0.12, -0.02, 0.58]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshBasicMaterial color="#eaffff" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`t${s}`} position={[s * 0.14, 0.0, -0.55]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshBasicMaterial color="#ff3355" />
        </mesh>
      ))}
      <mesh position={[0, -0.16, 0]}>
        <planeGeometry args={[0.34, 0.5]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight intensity={0.5} distance={2.4} color={color} decay={2} />
    </group>
  )
}

/**
 * Orbits a flying car around its JSON anchor and trails a fading light behind it.
 * @param props - Entity props
 * @returns Renderer element
 */
export function FlyingCarRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#ff6a3a'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const groupRef = useRef<THREE.Group>(null)
  const trailRef = useRef<THREE.Points>(null)
  const { radiusX, radiusZ, speed, phase } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return { radiusX: 3.5 + rand() * 3.5, radiusZ: 2 + rand() * 2.5, speed: 0.18 + rand() * 0.22, phase: rand() * Math.PI * 2 }
  }, [seed])
  const { positions: trailPositions, push: pushTrail } = useTrailBuffer(CAR_TRAIL_LENGTH)
  const trailIndices = useMemo(() => Float32Array.from({ length: CAR_TRAIL_LENGTH }, (_, i) => i), [])
  const trailMaterial = useMemo(() => createTrailMaterial(color, CAR_TRAIL_LENGTH), [color])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase
    const x = Math.cos(t) * radiusX
    const y = Math.sin(t * 1.7) * 0.7
    const z = Math.sin(t) * radiusZ
    if (groupRef.current) {
      groupRef.current.position.set(x, y, z)
      groupRef.current.rotation.y = -t + Math.PI / 2
    }
    pushTrail(x, y - 0.05, z)
    const attr = trailRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (attr) attr.needsUpdate = true
  })

  return (
    <>
      <group ref={groupRef}>
        <ModelLoader src={modelRegistry['cityIntro/flying-car'].path} fallback={<ProceduralFlyingCar color={color} />} />
      </group>
      <points ref={trailRef} material={trailMaterial} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
          <bufferAttribute attach="attributes-aIndex" args={[trailIndices, 1]} />
        </bufferGeometry>
      </points>
    </>
  )
}
