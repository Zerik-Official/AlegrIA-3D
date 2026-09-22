/**
 * Entity renderers for the `cityIntro` scene (futuristic street, skyscrapers,
 * flying traffic, moon, and the abandoned library facade). Kept in its own
 * module and merged into `engine/entityRegistry`'s map, so that registry file
 * doesn't grow unbounded as more scenes get their own JSON-driven dressing.
 * Every hand-built model here is registered in `shared/config/models.ts` and
 * wrapped in `ModelLoader`, so dropping a matching `.glb` under
 * `public/models/cityIntro/` swaps it in with zero code changes.
 * @module engine/cityIntroRenderers
 */

import { useCallback, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { createWindowGridTexture, createWeatheredWallTexture } from '@/shared/utils/textures'
import { ScenePlanet } from '@/shared/components/SceneAtmosphere'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import type { EntityRenderer, EntityRendererProps } from '@/engine/types'

/**
 * Ring-buffer of trailing world/local positions, shifted one slot per frame.
 * Shared by flying cars and trains for their light-trail effect.
 * @param length - Number of trail samples to keep
 * @returns The backing buffer and a `push` to record the current head position
 */
function useTrailBuffer(length: number) {
  const positions = useMemo(() => new Float32Array(length * 3), [length])
  const initialized = useRef(false)
  const push = useCallback(
    (x: number, y: number, z: number) => {
      if (!initialized.current) {
        for (let i = 0; i < length; i++) {
          positions[i * 3] = x
          positions[i * 3 + 1] = y
          positions[i * 3 + 2] = z
        }
        initialized.current = true
        return
      }
      for (let i = length - 1; i > 0; i--) {
        positions[i * 3] = positions[(i - 1) * 3]
        positions[i * 3 + 1] = positions[(i - 1) * 3 + 1]
        positions[i * 3 + 2] = positions[(i - 1) * 3 + 2]
      }
      positions[0] = x
      positions[1] = y
      positions[2] = z
    },
    [positions, length]
  )
  return { positions, push }
}

/**
 * Builds the additive, tail-fading point material shared by every light trail.
 * @param color - Trail color
 * @param count - Sample count (matches the trail buffer length)
 * @returns Shader material
 */
function createTrailMaterial(color: string, count: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uCount: { value: count } },
    vertexShader: `
      attribute float aIndex;
      uniform float uCount;
      varying float vFade;
      void main() {
        vFade = 1.0 - (aIndex / uCount);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (7.0 * vFade + 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vFade;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.0, d) * vFade * 0.85;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  })
}

function SkyscraperRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#3a4a6a'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const { width, depth, height, hasBeacon } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return {
      width: 3.0 + rand() * 2.6,
      depth: 2.8 + rand() * 2.4,
      height: 14 + rand() * 24,
      hasBeacon: rand() > 0.4,
    }
  }, [seed])
  const windowTexture = useMemo(() => createWindowGridTexture(seed, 5, Math.round(height * 1.4)), [seed, height])

  return (
    <ModelLoader
      src={modelRegistry['cityIntro/skyscraper'].path}
      fallback={
        <group>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} roughness={0.55} metalness={0.35} />
          </mesh>
          <mesh position={[0, height / 2, depth / 2 + 0.01]}>
            <planeGeometry args={[width * 0.92, height * 0.94]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[0, height / 2, -depth / 2 - 0.01]} rotation-y={Math.PI}>
            <planeGeometry args={[width * 0.92, height * 0.94]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[width / 2 + 0.01, height / 2, 0]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[depth * 0.92, height * 0.94]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[-width / 2 - 0.01, height / 2, 0]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[depth * 0.92, height * 0.94]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          {hasBeacon && (
            <>
              <mesh position={[0, height + 0.8, 0]}>
                <cylinderGeometry args={[0.035, 0.05, 1.6, 6]} />
                <meshStandardMaterial color="#2a2e38" roughness={0.6} metalness={0.7} />
              </mesh>
              <mesh position={[0, height + 1.65, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color="#ff3355" />
              </mesh>
              <pointLight position={[0, height + 1.65, 0]} intensity={0.8} distance={4} color="#ff3355" decay={2} />
            </>
          )}
        </group>
      }
    />
  )
}

function StreetlightRenderer() {
  return (
    <ModelLoader
      src={modelRegistry['cityIntro/streetlight'].path}
      fallback={
        <group>
          <mesh position={[0, 1.6, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.06, 3.2, 8]} />
            <meshStandardMaterial color="#161a20" roughness={0.55} metalness={0.65} />
          </mesh>
          <mesh position={[0, 3.15, 0.26]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.032, 0.032, 0.56, 6]} />
            <meshStandardMaterial color="#161a20" roughness={0.55} metalness={0.65} />
          </mesh>
          <mesh position={[0, 3.02, 0.52]}>
            <sphereGeometry args={[0.15, 12, 12]} />
            <meshStandardMaterial color="#ffe9b0" emissive="#ffcf6b" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0, 3.02, 0.52]}>
            <sphereGeometry args={[0.26, 10, 10]} />
            <meshBasicMaterial color="#ffcf6b" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <pointLight position={[0, 3.0, 0.52]} intensity={1.15} distance={6.5} color="#ffcf6b" decay={2} />
        </group>
      }
    />
  )
}

/** Trail sample count for a single flying car. */
const CAR_TRAIL_LENGTH = 16

/**
 * Low, sporty hull built from a flattened capsule + canopy + nose + fins,
 * reading as a "flying car" silhouette instead of a bare capsule.
 */
function ProceduralFlyingCar({ color }: { color: string }) {
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

function FlyingCarRenderer({ entity }: EntityRendererProps) {
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

/** Trail sample count for the lead engine of a flying train. */
const TRAIN_TRAIL_LENGTH = 22
/** Cars per flying train, engine included. */
const TRAIN_CAR_COUNT = 4
/** Length of one train car body. */
const TRAIN_CAR_LENGTH = 1.3

/** One capsule-bodied, window-striped train car; the lead car also gets a nose cone. */
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

/** Sleek multi-car maglev built from capsule cars with window strips, a nose, and a glowing rail. */
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

function FlyingTrainRenderer({ entity }: EntityRendererProps) {
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

function MoonRenderer() {
  return (
    <ModelLoader
      src={modelRegistry['cityIntro/moon'].path}
      fallback={
        <group>
          <mesh>
            <sphereGeometry args={[4, 24, 24]} />
            <meshStandardMaterial color="#e8e4d8" emissive="#e8e4d8" emissiveIntensity={0.42} roughness={1} />
          </mesh>
          <mesh>
            <sphereGeometry args={[4.7, 20, 20]} />
            <meshBasicMaterial color="#cfe0ff" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh>
            <sphereGeometry args={[5.6, 16, 16]} />
            <meshBasicMaterial color="#cfe0ff" transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <directionalLight intensity={0.38} color="#cfe0ff" />
        </group>
      }
    />
  )
}

/** Generates (once) a weathered "BIBLIOTECA" sign texture with a few dead/flickering letters. */
function useLibrarySignTexture(): THREE.Texture {
  return useMemo(() => {
    const w = 512
    const h = 96
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.font = 'bold 58px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const deadIndices = new Set([2, 7])
    const chars = 'BIBLIOTECA'.split('')
    const spacing = w / (chars.length + 1)
    for (let i = 0; i < chars.length; i++) {
      const dead = deadIndices.has(i)
      ctx.fillStyle = dead ? '#5a4a2a' : '#3a2a14'
      ctx.shadowColor = dead ? 'transparent' : '#ff8a1a'
      ctx.shadowBlur = dead ? 0 : 14
      ctx.fillText(chars[i], spacing * (i + 1), h / 2)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
}

/** Generates (once) a vertical-baluster balcony-rail texture, a few bars missing to read as decayed. */
function useBalusterTexture(seed: number): THREE.Texture {
  return useMemo(() => {
    const w = 96
    const h = 20
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)
    const rand = createSeededRandom(seed)
    const count = 11
    const spacing = w / count
    ctx.fillStyle = '#d8cca8'
    for (let i = 0; i < count; i++) {
      if (rand() > 0.82) continue
      ctx.fillRect(i * spacing + spacing * 0.28, 1, spacing * 0.44, h - 2)
    }
    ctx.fillRect(0, 0, w, 2)
    ctx.fillRect(0, h - 2, w, 2)
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [seed])
}

/**
 * Flat front-facing triangle (base centered on X, apex up), used for both the
 * extruded pediment silhouette (with `depth`) and its recessed tympanum panel
 * (`depth = 0`, i.e. a plain `ShapeGeometry`).
 */
function useTriangleGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  return useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-width / 2, 0)
    shape.lineTo(width / 2, 0)
    shape.lineTo(0, height)
    shape.lineTo(-width / 2, 0)
    if (depth <= 0) return new THREE.ShapeGeometry(shape)
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 })
    geo.translate(0, 0, -depth / 2)
    return geo
  }, [width, height, depth])
}

/** Facade footprint, reused across the colonnade, floors, cornices and pediment. */
const FACADE_WIDTH = 16
const FACADE_DEPTH = 7
const GROUND_HEIGHT = 3.4
const CORNICE_HEIGHT = 0.28
const UPPER_HEIGHT = 3.0
const ROOF_CORNICE_HEIGHT = 0.32
const BAY_COUNT = 6
const BAY_WIDTH = FACADE_WIDTH / BAY_COUNT
const COLUMN_HEIGHT = GROUND_HEIGHT - 0.85
const FRONT_Z = FACADE_DEPTH / 2

/**
 * Weathered Republican/colonial facade in the style of Barranquilla's Aduana
 * building — ochre walls, an arched ground-floor colonnade, shuttered upper
 * windows with balustraded balconies and awnings, and a pedimented roofline
 * with a fading "BIBLIOTECA" sign — reworked as abandoned (boarded door,
 * broken shutters, missing balusters, grime streaks, climbing vines).
 */
function LibraryFacadeRenderer() {
  const glowRef = useRef<THREE.Mesh>(null)
  const signRef = useRef<THREE.Mesh>(null)
  const signTexture = useLibrarySignTexture()
  const balusterTexture = useBalusterTexture(hashSeed('library-facade-balusters'))
  const wallWeather = useMemo(() => createWeatheredWallTexture(hashSeed('library-facade-wall-1')), [])
  const upperWeather = useMemo(() => createWeatheredWallTexture(hashSeed('library-facade-wall-2')), [])

  const pedimentGeometry = useTriangleGeometry(6.6, 1.9, ROOF_CORNICE_HEIGHT + 0.2)
  const tympanumGeometry = useTriangleGeometry(5.6, 1.55, 0)

  const upperY = GROUND_HEIGHT + CORNICE_HEIGHT
  const roofY = upperY + UPPER_HEIGHT

  const windows = useMemo(
    () =>
      Array.from({ length: BAY_COUNT }).map((_, i) => {
        const rand = createSeededRandom(hashSeed(`library-window-${i}`))
        return { x: -FACADE_WIDTH / 2 + BAY_WIDTH * (i + 0.5), broken: rand() > 0.62, ajar: rand() > 0.5 }
      }),
    []
  )

  const vines = useMemo(() => {
    const rand = createSeededRandom(hashSeed('library-facade-vines'))
    return Array.from({ length: 4 }).map(() => ({
      x: -6.5 + rand() * 13,
      height: 2 + rand() * 3.2,
      sway: rand() * Math.PI,
    }))
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(t * 0.6) * 0.1
    }
    if (signRef.current) {
      const mat = signRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.6 + Math.sin(t * 13) * 0.05 * (Math.sin(t * 0.7) > 0.8 ? 1 : 0.1)
    }
  })

  return (
    <ModelLoader
      src={modelRegistry['cityIntro/library-facade'].path}
      fallback={
        <group>
          {/* ground floor body */}
          <mesh position={[0, GROUND_HEIGHT / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[FACADE_WIDTH, GROUND_HEIGHT, FACADE_DEPTH]} />
            <meshStandardMaterial color="#8a7238" roughness={0.94} />
          </mesh>
          <mesh position={[0, GROUND_HEIGHT / 2, FRONT_Z + 0.01]}>
            <planeGeometry args={[FACADE_WIDTH, GROUND_HEIGHT]} />
            <meshBasicMaterial map={wallWeather} transparent />
          </mesh>

          {/* colonnade */}
          {Array.from({ length: BAY_COUNT + 1 }).map((_, i) => (
            <mesh key={i} position={[-FACADE_WIDTH / 2 + i * BAY_WIDTH, COLUMN_HEIGHT / 2, FRONT_Z + 0.18]} castShadow>
              <cylinderGeometry args={[0.2, 0.24, COLUMN_HEIGHT, 10]} />
              <meshStandardMaterial color="#d8cca8" roughness={0.82} />
            </mesh>
          ))}

          {Array.from({ length: BAY_COUNT }).map((_, i) => {
            const x = -FACADE_WIDTH / 2 + BAY_WIDTH * (i + 0.5)
            const isEntrance = i === Math.floor(BAY_COUNT / 2)
            return (
              <group key={i} position={[x, 0, FRONT_Z + 0.18]}>
                <mesh position={[0, COLUMN_HEIGHT, 0]}>
                  <torusGeometry args={[BAY_WIDTH * 0.4, 0.09, 8, 20, Math.PI]} />
                  <meshStandardMaterial color="#d8cca8" roughness={0.82} />
                </mesh>
                <mesh position={[0, COLUMN_HEIGHT * 0.5, -0.3]}>
                  <planeGeometry args={[BAY_WIDTH * 0.7, COLUMN_HEIGHT * 0.94]} />
                  <meshStandardMaterial color="#0e0a06" roughness={1} />
                </mesh>
                {isEntrance ? (
                  <>
                    <mesh position={[0, COLUMN_HEIGHT * 0.34, -0.2]}>
                      <planeGeometry args={[BAY_WIDTH * 0.48, COLUMN_HEIGHT * 0.6]} />
                      <meshStandardMaterial color="#1e150c" roughness={0.92} />
                    </mesh>
                    <mesh ref={glowRef} position={[0, COLUMN_HEIGHT * 0.34, -0.19]}>
                      <planeGeometry args={[BAY_WIDTH * 0.4, COLUMN_HEIGHT * 0.5]} />
                      <meshStandardMaterial color="#0a0f1a" emissive="#ff8a1a" emissiveIntensity={0.3} transparent opacity={0.55} />
                    </mesh>
                    {Array.from({ length: 4 }).map((_, p) => (
                      <mesh
                        key={p}
                        position={[0, COLUMN_HEIGHT * 0.1 + p * (COLUMN_HEIGHT * 0.5) * 0.28, -0.17]}
                        rotation-z={p % 2 === 0 ? 0.025 : -0.02}
                      >
                        <boxGeometry args={[BAY_WIDTH * 0.5, 0.1, 0.03]} />
                        <meshStandardMaterial color="#3a2a18" roughness={0.88} />
                      </mesh>
                    ))}
                  </>
                ) : (
                  <mesh position={[0, COLUMN_HEIGHT * 0.32, -0.17]}>
                    <planeGeometry args={[BAY_WIDTH * 0.42, COLUMN_HEIGHT * 0.5]} />
                    <meshStandardMaterial color="#120d08" roughness={0.96} />
                  </mesh>
                )}
              </group>
            )
          })}

          {/* cornice band */}
          <mesh position={[0, GROUND_HEIGHT + CORNICE_HEIGHT / 2, 0.1]}>
            <boxGeometry args={[FACADE_WIDTH + 0.4, CORNICE_HEIGHT, FACADE_DEPTH + 0.4]} />
            <meshStandardMaterial color="#d8cca8" roughness={0.8} />
          </mesh>

          {/* upper floor body */}
          <mesh position={[0, upperY + UPPER_HEIGHT / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[FACADE_WIDTH, UPPER_HEIGHT, FACADE_DEPTH]} />
            <meshStandardMaterial color="#8a7238" roughness={0.94} />
          </mesh>
          <mesh position={[0, upperY + UPPER_HEIGHT / 2, FRONT_Z + 0.01]}>
            <planeGeometry args={[FACADE_WIDTH, UPPER_HEIGHT]} />
            <meshBasicMaterial map={upperWeather} transparent />
          </mesh>

          {windows.map((w, i) => (
            <group key={i} position={[w.x, upperY, FRONT_Z + 0.02]}>
              <mesh position={[0, UPPER_HEIGHT * 0.52, 0]}>
                <planeGeometry args={[BAY_WIDTH * 0.64, UPPER_HEIGHT * 0.74]} />
                <meshStandardMaterial color="#d8cca8" roughness={0.78} />
              </mesh>
              <mesh position={[0, UPPER_HEIGHT * 0.52, 0.015]}>
                <planeGeometry args={[BAY_WIDTH * 0.54, UPPER_HEIGHT * 0.62]} />
                <meshStandardMaterial color="#0a0704" roughness={1} />
              </mesh>
              {[-1, 1].map((side) => (
                <mesh
                  key={side}
                  position={[side * BAY_WIDTH * 0.14 * (w.broken && side === 1 ? 1.7 : 1), UPPER_HEIGHT * 0.52, 0.03]}
                  rotation-y={w.broken && side === 1 ? 0.85 : 0}
                >
                  <planeGeometry args={[BAY_WIDTH * 0.27, UPPER_HEIGHT * 0.6]} />
                  <meshStandardMaterial color={w.broken ? '#26361f' : '#2e4a2e'} roughness={0.88} side={THREE.DoubleSide} />
                </mesh>
              ))}
              <mesh position={[0, UPPER_HEIGHT * 0.12, 0.06]}>
                <planeGeometry args={[BAY_WIDTH * 0.72, UPPER_HEIGHT * 0.18]} />
                <meshBasicMaterial map={balusterTexture} transparent />
              </mesh>
              {w.ajar && (
                <mesh position={[0, UPPER_HEIGHT * 0.94, 0.22]} rotation-x={-0.48}>
                  <planeGeometry args={[BAY_WIDTH * 0.74, 0.46]} />
                  <meshStandardMaterial color="#141a26" roughness={0.9} side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          ))}

          {/* roof cornice + pediment */}
          <mesh position={[0, roofY + ROOF_CORNICE_HEIGHT / 2, 0.1]}>
            <boxGeometry args={[FACADE_WIDTH + 0.4, ROOF_CORNICE_HEIGHT, FACADE_DEPTH + 0.4]} />
            <meshStandardMaterial color="#d8cca8" roughness={0.8} />
          </mesh>
          <mesh position={[0, roofY + ROOF_CORNICE_HEIGHT, 0]} geometry={pedimentGeometry} castShadow>
            <meshStandardMaterial color="#d8cca8" roughness={0.8} />
          </mesh>
          <mesh position={[0, roofY + ROOF_CORNICE_HEIGHT + 0.18, FRONT_Z - 0.05]} geometry={tympanumGeometry}>
            <meshStandardMaterial color="#8a7238" roughness={0.88} />
          </mesh>
          <mesh ref={signRef} position={[0, roofY + ROOF_CORNICE_HEIGHT + 0.7, FRONT_Z + 0.03]}>
            <planeGeometry args={[4.4, 0.65]} />
            <meshBasicMaterial map={signTexture} transparent opacity={0.7} />
          </mesh>
          {[-2.6, -0.9, 0.9, 2.6].map((x) => (
            <mesh key={x} position={[x, roofY + ROOF_CORNICE_HEIGHT + 0.06, FRONT_Z - 0.15]}>
              <boxGeometry args={[0.3, 0.36, 0.16]} />
              <meshStandardMaterial color="#d8cca8" roughness={0.8} />
            </mesh>
          ))}

          {vines.map((v, i) => (
            <group key={i} position={[v.x, 0, FRONT_Z + 0.02]} rotation-z={Math.sin(v.sway) * 0.05}>
              <mesh position={[0, v.height / 2, 0]}>
                <cylinderGeometry args={[0.02, 0.03, v.height, 5]} />
                <meshStandardMaterial color="#2a4a1e" roughness={0.95} />
              </mesh>
              {Array.from({ length: Math.round(v.height * 1.6) }).map((_, j) => (
                <mesh key={j} position={[(j % 2 === 0 ? 1 : -1) * 0.12, (j / (v.height * 1.6)) * v.height, 0.02]} rotation-z={0.6}>
                  <planeGeometry args={[0.14, 0.2]} />
                  <meshStandardMaterial color="#3a6a24" roughness={0.9} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          ))}

          {/* rubble at the base */}
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[-5 + i * 2.5 + (i % 2) * 0.4, 0.04, FRONT_Z + 1.5 + (i % 3) * 0.3]} rotation-y={i}>
              <boxGeometry args={[0.4 + (i % 2) * 0.2, 0.08, 0.35]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
            </mesh>
          ))}

          <pointLight position={[0, 1.8, FRONT_Z + 1.3]} intensity={1.4} distance={7} color="#ff8a1a" decay={2} />
          <pointLight position={[0, GROUND_HEIGHT + UPPER_HEIGHT, FRONT_Z + 2]} intensity={0.5} distance={10} color="#8fa8ff" decay={2} />
        </group>
      }
    />
  )
}

function PlanetRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#c9a877'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const hasRing = seed % 3 === 0
  return (
    <ModelLoader
      src={modelRegistry['cityIntro/planet'].path}
      fallback={<ScenePlanet radius={3} color={color} hasRing={hasRing} rotationSpeed={0.04 + (seed % 7) * 0.01} seed={seed} />}
    />
  )
}

function PathPointRenderer() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = 0.15 + Math.sin(clock.elapsedTime * 1.4 + ref.current.position.x) * 0.05
  })
  return (
    <mesh ref={ref} position={[0, 0.15, 0]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshBasicMaterial color="#ffcc33" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

/**
 * Renderer map for the `cityIntro` scene's entity types — merged into
 * `engine/entityRegistry`'s `entityRegistry` export.
 */
export const cityIntroRenderers: Record<string, EntityRenderer> = {
  skyscraper: SkyscraperRenderer,
  streetlight: StreetlightRenderer,
  'flying-car': FlyingCarRenderer,
  'flying-train': FlyingTrainRenderer,
  moon: MoonRenderer,
  'library-facade': LibraryFacadeRenderer,
  planet: PlanetRenderer,
  'path-point': PathPointRenderer,
}