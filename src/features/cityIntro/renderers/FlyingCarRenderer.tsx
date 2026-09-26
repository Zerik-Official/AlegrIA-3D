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
import { useTrailBuffer, createTrailMaterial, pushTrailSample } from '@/features/cityIntro/renderers/trail'
import { buildLaneCurve } from '@/features/cityIntro/renderers/flightLane'
import type { EntityRendererProps } from '@/engine/types'

/** Trail sample count for a single flying car. */
const CAR_TRAIL_LENGTH = 16
/** Registry keys of the available car hulls; one is picked per-entity from its id seed for variety. */
const CAR_MODEL_KEYS = ['cityIntro/flying-car-retro', 'cityIntro/flying-car-star', 'cityIntro/flying-car-classic'] as const
/**
 * Largest bounding-box dimension (scene units) a car hull is rescaled to fit,
 * matching the `ProceduralFlyingCar` fallback's size — the source `.glb` files
 * are authored at an unrelated unit scale and would otherwise render car-sized
 * models the size of buildings.
 */
const CAR_TARGET_SIZE = 1.15

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
 * Follows its assigned flight lane (JSON `title`, looked up in
 * `context.flightLanes`) at a constant arc-length speed when one exists;
 * otherwise orbits its JSON anchor like before. Trails a fading light behind
 * it either way, and picks one of a few car hulls from its id seed for variety.
 * @param props - Entity props
 * @returns Renderer element
 */
export function FlyingCarRenderer({ entity, context }: EntityRendererProps) {
  const color = entity.variant ?? '#ff6a3a'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const modelKey = CAR_MODEL_KEYS[seed % CAR_MODEL_KEYS.length]
  const groupRef = useRef<THREE.Group>(null)
  const trailRef = useRef<THREE.Points>(null)
  const laneWaypoints = entity.title ? context?.flightLanes?.[entity.title] : undefined
  const laneCurve = useMemo(() => buildLaneCurve(laneWaypoints), [laneWaypoints])
  const { radiusX, radiusZ, speed, phase, laneSpeed, laneStart, laneReverse, bobPhase } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return {
      radiusX: 3.5 + rand() * 3.5,
      radiusZ: 2 + rand() * 2.5,
      speed: 0.18 + rand() * 0.22,
      phase: rand() * Math.PI * 2,
      laneSpeed: 1.4 + rand() * 1.6,
      laneStart: rand(),
      laneReverse: rand() > 0.5,
      bobPhase: rand() * Math.PI * 2,
    }
  }, [seed])
  const trailPositions = useTrailBuffer(CAR_TRAIL_LENGTH)
  const trailIndices = useMemo(() => Float32Array.from({ length: CAR_TRAIL_LENGTH }, (_, i) => i), [])
  const trailMaterial = useMemo(() => createTrailMaterial(color, CAR_TRAIL_LENGTH), [color])

  useFrame(({ clock }) => {
    let x: number
    let y: number
    let z: number
    let heading: number
    if (laneCurve) {
      const length = laneCurve.getLength()
      const dir = laneReverse ? -1 : 1
      const u = THREE.MathUtils.euclideanModulo(laneStart + (clock.elapsedTime * laneSpeed * dir) / length, 1)
      const point = laneCurve.getPointAt(u)
      const tangent = laneCurve.getTangentAt(u)
      x = point.x
      y = point.y + Math.sin(clock.elapsedTime * 1.6 + bobPhase) * 0.22
      z = point.z
      heading = Math.atan2(tangent.x * dir, tangent.z * dir)
    } else {
      const t = clock.elapsedTime * speed + phase
      x = Math.cos(t) * radiusX
      y = Math.sin(t * 1.7) * 0.7
      z = Math.sin(t) * radiusZ
      heading = -t + Math.PI / 2
    }
    if (groupRef.current) {
      groupRef.current.position.set(x, y, z)
      groupRef.current.rotation.y = heading
    }
    pushTrailSample(trailRef.current, x, y - 0.05, z)
  })

  return (
    <>
      <group ref={groupRef}>
        <ModelLoader src={modelRegistry[modelKey].path} fallback={<ProceduralFlyingCar color={color} />} targetSize={CAR_TARGET_SIZE} castShadow={false} />
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
