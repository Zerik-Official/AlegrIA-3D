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
import { useTrailBuffer, createTrailMaterial, pushTrailSample } from '@/features/cityIntro/renderers/trail'
import { buildLaneCurve } from '@/features/cityIntro/renderers/flightLane'
import type { EntityRendererProps } from '@/engine/types'

/** Trail sample count of the propulsion wake. */
const TRAIN_TRAIL_LENGTH = 30
/** Cars per flying train, engine included. */
const TRAIN_CAR_COUNT = 4
/** Length of one train car body. */
const TRAIN_CAR_LENGTH = 1.3
/**
 * Length (scene units) the capsule train is rescaled to — its largest
 * bounding-box dimension — so it reads at street scale over the avenue.
 */
const TRAIN_TARGET_SIZE = 6.5
/**
 * The capsule train's own extent along its length, in model units
 * (`tren-futurista.py`): nose at `-X`, the propulsion nozzle's rim at `+X`.
 */
const MODEL_NOSE_X = -1.05
const MODEL_NOZZLE_X = 9.28
/** Height of the nozzle's axis, in model units. */
const MODEL_NOZZLE_Y = 0.04
/** Model-to-scene scale that {@link TRAIN_TARGET_SIZE} results in. */
const MODEL_SCALE = TRAIN_TARGET_SIZE / (MODEL_NOZZLE_X - MODEL_NOSE_X)
/** Offset that centers the model's length on the train's anchor. */
const MODEL_CENTER_OFFSET = -((MODEL_NOSE_X + MODEL_NOZZLE_X) / 2) * MODEL_SCALE
/** Nozzle position relative to the train's anchor, in scene units. */
const NOZZLE_X = MODEL_NOZZLE_X * MODEL_SCALE + MODEL_CENTER_OFFSET
const NOZZLE_Y = MODEL_NOZZLE_Y * MODEL_SCALE
/** Color of the nozzle's glow, plume and wake — the model's own cyan light strips. */
const THRUSTER_COLOR = '#49E9FF'

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
export function ProceduralFlyingTrain({ color = '#7ad8ff', seed = 42 }: { color?: string; seed?: number }) {
  const windowTexture = useMemo(() => createWindowGridTexture(seed + 7, 14, 2), [seed])
  const offset = -((TRAIN_CAR_COUNT - 1) * (TRAIN_CAR_LENGTH + 0.1)) / 2
  return (
    <group position={[offset, 0, 0]}>
      {Array.from({ length: TRAIN_CAR_COUNT }).map((_, i) => (
        <TrainCar key={i} index={i} isEngine={i === 0} color={color} windowTexture={windowTexture} />
      ))}
    </group>
  )
}

/**
 * Propulsion plume at the nozzle: a bright core and a wider, softer cone
 * pointing back along `+X`, both additive and flickering like exhaust.
 * @returns Plume group, placed at the nozzle
 */
function ThrusterPlume() {
  const coreRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const flicker = 1 + Math.sin(t * 38) * 0.08 + Math.sin(t * 23 + 1.3) * 0.06
    if (coreRef.current) coreRef.current.scale.set(flicker, 1, 1)
    if (haloRef.current) {
      haloRef.current.scale.set(1.05 + Math.sin(t * 17) * 0.1, 1, 1)
      const halo = haloRef.current.material as THREE.MeshBasicMaterial
      halo.opacity = 0.32 + Math.sin(t * 29) * 0.06
    }
  })

  return (
    <group position={[NOZZLE_X, NOZZLE_Y, 0]}>
      <mesh ref={coreRef} rotation-z={Math.PI / 2} position={[0.28, 0, 0]}>
        <coneGeometry args={[0.07, 0.56, 12, 1, true]} />
        <meshBasicMaterial color="#e8fdff" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef} rotation-z={Math.PI / 2} position={[0.5, 0, 0]}>
        <coneGeometry args={[0.13, 1, 14, 1, true]} />
        <meshBasicMaterial color={THRUSTER_COLOR} transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh rotation-y={Math.PI / 2}>
        <circleGeometry args={[0.11, 18]} />
        <meshBasicMaterial color={THRUSTER_COLOR} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

/**
 * The capsule maglev (`tren-capsula-futurista.glb`, nose first): follows its
 * assigned flight lane (JSON `title`, looked up in `context.flightLanes`) at
 * a constant arc-length speed when one exists, otherwise slides back and
 * forth along local X. Its rear thruster burns with a flickering plume and
 * leaves a fading cyan wake behind it.
 * @param props - Entity props
 * @returns Renderer element
 */
export function FlyingTrainRenderer({ entity, context }: EntityRendererProps) {
  const color = entity.variant ?? '#7ad8ff'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const groupRef = useRef<THREE.Group>(null)
  const trailRef = useRef<THREE.Points>(null)
  const laneWaypoints = entity.title ? context?.flightLanes?.[entity.title] : undefined
  const laneCurve = useMemo(() => buildLaneCurve(laneWaypoints), [laneWaypoints])
  const { range, speed, laneSpeed, laneStart, laneReverse } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return {
      range: 12 + rand() * 10,
      speed: 0.06 + rand() * 0.05,
      laneSpeed: 2.4 + rand() * 1.6,
      laneStart: rand(),
      laneReverse: rand() > 0.5,
    }
  }, [seed])
  const trailPositions = useTrailBuffer(TRAIN_TRAIL_LENGTH)
  const trailIndices = useMemo(() => Float32Array.from({ length: TRAIN_TRAIL_LENGTH }, (_, i) => i), [])
  const trailMaterial = useMemo(() => createTrailMaterial(THRUSTER_COLOR, TRAIN_TRAIL_LENGTH), [])

  useFrame(({ clock }) => {
    if (laneCurve) {
      const length = laneCurve.getLength()
      const dir = laneReverse ? -1 : 1
      const u = THREE.MathUtils.euclideanModulo(laneStart + (clock.elapsedTime * laneSpeed * dir) / length, 1)
      const point = laneCurve.getPointAt(u)
      const tangent = laneCurve.getTangentAt(u)
      const y = point.y + Math.sin(clock.elapsedTime * 0.8 + seed) * 0.15
      const heading = Math.atan2(tangent.z * dir, -tangent.x * dir)
      if (groupRef.current) {
        groupRef.current.position.set(point.x, y, point.z)
        groupRef.current.rotation.y = heading
      }
      pushTrailSample(trailRef.current, point.x + Math.cos(heading) * NOZZLE_X, y + NOZZLE_Y, point.z - Math.sin(heading) * NOZZLE_X)
    } else {
      const t = clock.elapsedTime * speed + seed
      const x = Math.sin(t) * range
      const direction = Math.cos(t) >= 0 ? 1 : -1
      if (groupRef.current) {
        groupRef.current.position.x = x
        groupRef.current.rotation.y = direction > 0 ? Math.PI : 0
      }
      pushTrailSample(trailRef.current, x - direction * NOZZLE_X, NOZZLE_Y, 0)
    }
  })

  return (
    <>
      <mesh position={[0, -0.35, 0]}>
        <planeGeometry args={[range * 2 + 2, 0.18]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={groupRef}>
        <ModelLoader
          src={modelRegistry['cityIntro/flying-train'].path}
          fallback={<ProceduralFlyingTrain color={color} seed={seed} />}
          targetSize={TRAIN_TARGET_SIZE}
          position={[MODEL_CENTER_OFFSET, 0, 0]}
          castShadow={false}
        />
        <ThrusterPlume />
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
