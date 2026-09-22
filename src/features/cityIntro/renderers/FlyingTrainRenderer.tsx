/**
 * `flying-train` entity renderer for the `cityIntro` scene.
 * @module features/cityIntro/renderers/FlyingTrainRenderer
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { createWindowGridTexture } from '@/shared/utils/textures'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { useTrailBuffer, createTrailMaterial } from '@/features/cityIntro/renderers/trail'
import type { EntityRendererProps } from '@/engine/types'

/** Trail sample count for the lead engine of a flying train. */
const TRAIN_TRAIL_LENGTH = 22
/** Cars per flying train, engine included. */
const TRAIN_CAR_COUNT = 4
/** Length of one train car body. */
const TRAIN_CAR_LENGTH = 1.3

/**
 * One capsule-bodied, window-striped train car; the lead car also gets a nose cone.
 * @param props - Position index, whether this is the lead car, color and window texture
 * @returns Car group
 */
function TrainCar({ index, isEngine, color, windowTexture }: { index: number; isEngine: boolean; color: string; windowTexture: THREE.Texture }) {
  const x = index * (TRAIN_CAR_LENGTH + 0.1)
  return (
    <group position={[x, 0, 0]}>
      <mesh rotation-z={Math.PI / 2} scale={[1, 1, 0.62]} castShadow>
        <capsuleGeometry args={[0.28, TRAIN_CAR_LENGTH - 0.16, 4, 10]} />
        <meshStandardMaterial color={isEngine ? color : '#1a2230'} emissive={color} emissiveIntensity={isEngine ? 0.5 : 0.16} metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, 0.18]}>
        <planeGeometry args={[TRAIN_CAR_LENGTH * 0.82, 0.22]} />
        <meshBasicMaterial map={windowTexture} transparent />
      </mesh>
      <mesh position={[0, 0.05, -0.18]} rotation-y={Math.PI}>
        <planeGeometry args={[TRAIN_CAR_LENGTH * 0.82, 0.22]} />
        <meshBasicMaterial map={windowTexture} transparent />
      </mesh>
      {isEngine && (
        <mesh position={[-(TRAIN_CAR_LENGTH / 2 + 0.16), 0, 0]} rotation-z={Math.PI / 2} scale={[1, 1, 0.62]}>
          <coneGeometry args={[0.28, 0.4, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.6} roughness={0.28} />
        </mesh>
      )}
      {index < TRAIN_CAR_COUNT - 1 && (
        <mesh position={[TRAIN_CAR_LENGTH / 2 + 0.05, 0, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 8]} />
          <meshStandardMaterial color="#0d0f14" metalness={0.6} roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}

/**
 * Sleek multi-car maglev built from capsule cars with window strips, a nose, and a glowing rail.
 * @param props - Livery color and deterministic seed
 * @returns Train group
 */
function ProceduralFlyingTrain({ color, seed }: { color: string; seed: number }) {
  const windowTexture = useMemo(() => createWindowGridTexture(seed + 7, 14, 2), [seed])
  const offset = -((TRAIN_CAR_COUNT - 1) * (TRAIN_CAR_LENGTH + 0.1)) / 2
  return (
    <group position={[offset, 0, 0]}>
      {Array.from({ length: TRAIN_CAR_COUNT }).map((_, i) => (
        <TrainCar key={i} index={i} isEngine={i === 0} color={color} windowTexture={windowTexture} />
      ))}
      <pointLight intensity={0.85} distance={5.5} color={color} decay={2} />
    </group>
  )
}

/**
 * Slides a flying train back and forth along local X and trails a fading light behind the lead car.
 * @param props - Entity props
 * @returns Renderer element
 */
export function FlyingTrainRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#7ad8ff'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const groupRef = useRef<THREE.Group>(null)
  const trailRef = useRef<THREE.Points>(null)
  const { range, speed } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return { range: 12 + rand() * 10, speed: 0.06 + rand() * 0.05 }
  }, [seed])
  const { positions: trailPositions, push: pushTrail } = useTrailBuffer(TRAIN_TRAIL_LENGTH)
  const trailIndices = useMemo(() => Float32Array.from({ length: TRAIN_TRAIL_LENGTH }, (_, i) => i), [])
  const trailMaterial = useMemo(() => createTrailMaterial(color, TRAIN_TRAIL_LENGTH), [color])
  const leadOffset = ((TRAIN_CAR_COUNT - 1) * (TRAIN_CAR_LENGTH + 0.1)) / 2

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + seed
    const x = Math.sin(t) * range
    const direction = Math.cos(t) >= 0 ? 1 : -1
    if (groupRef.current) groupRef.current.position.x = x
    pushTrail(x - direction * leadOffset, -0.06, 0)
    const attr = trailRef.current?.geometry.attributes.position as THREE.BufferAttribute | undefined
    if (attr) attr.needsUpdate = true
  })

  return (
    <>
      <mesh position={[0, -0.35, 0]}>
        <planeGeometry args={[range * 2 + 2, 0.18]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={groupRef}>
        <ModelLoader src={modelRegistry['cityIntro/flying-train'].path} fallback={<ProceduralFlyingTrain color={color} seed={seed} />} />
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
