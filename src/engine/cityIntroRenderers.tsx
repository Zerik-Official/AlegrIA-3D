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
import { createWindowGridTexture } from '@/shared/utils/textures'
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
    ctx.fillStyle = '#05060a'
    ctx.fillRect(0, 0, w, h)
    ctx.font = 'bold 58px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const deadIndices = new Set([2, 7])
    const chars = 'BIBLIOTECA'.split('')
    const spacing = w / (chars.length + 1)
    for (let i = 0; i < chars.length; i++) {
      const dead = deadIndices.has(i)
      ctx.fillStyle = dead ? '#2a2010' : '#ffcf6b'
      ctx.shadowColor = dead ? 'transparent' : '#ff8a1a'
      ctx.shadowBlur = dead ? 0 : 18
      ctx.fillText(chars[i], spacing * (i + 1), h / 2)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [])
}

function LibraryFacadeRenderer() {
  const glowRef = useRef<THREE.Mesh>(null)
  const signRef = useRef<THREE.Mesh>(null)
  const signTexture = useLibrarySignTexture()
  const vineSeed = useMemo(() => hashSeed('library-facade-vines'), [])

  const vines = useMemo(() => {
    const rand = createSeededRandom(vineSeed)
    return Array.from({ length: 6 }).map(() => ({
      x: -5 + rand() * 10,
      height: 2 + rand() * 3.5,
      sway: rand() * Math.PI,
    }))
  }, [vineSeed])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.32 + Math.sin(t * 0.6) * 0.1
    }
    if (signRef.current) {
      const mat = signRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.75 + Math.sin(t * 14) * 0.06 * (Math.sin(t * 0.7) > 0.8 ? 1 : 0.15)
    }
  })

  return (
    <ModelLoader
      src={modelRegistry['cityIntro/library-facade'].path}
      fallback={
        <group>
          <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[12, 9, 8]} />
            <meshStandardMaterial color="#1c2230" roughness={0.94} />
          </mesh>
          {[-4.2, -1.4, 1.4, 4.2].map((x) => (
            <mesh key={x} position={[x, 3.2, 4.05]} castShadow>
              <cylinderGeometry args={[0.3, 0.34, 6.2, 10]} />
              <meshStandardMaterial color="#2a3040" roughness={0.85} />
            </mesh>
          ))}
          <mesh position={[0, 9.3, 0]} rotation-y={Math.PI / 4} castShadow>
            <coneGeometry args={[8.2, 2.4, 4]} />
            <meshStandardMaterial color="#12161e" roughness={0.95} />
          </mesh>

          <mesh position={[0, 1.6, 4.08]}>
            <planeGeometry args={[1.8, 3.2]} />
            <meshStandardMaterial color="#05060a" roughness={1} />
          </mesh>
          <mesh ref={glowRef} position={[0, 1.6, 4.1]}>
            <planeGeometry args={[1.6, 3.0]} />
            <meshStandardMaterial color="#0a0f1a" emissive="#ff8a1a" emissiveIntensity={0.32} transparent opacity={0.85} />
          </mesh>

          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.15 * i + 0.08, 4.5 + i * 0.5]} receiveShadow>
              <boxGeometry args={[6 - i * 0.6, 0.16, 0.5]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.92} />
            </mesh>
          ))}

          {[-4.6, -1.6, 1.6, 4.6].map((x) => (
            <group key={x} position={[x, 6.0, 4.06]}>
              <mesh>
                <planeGeometry args={[1.1, 1.6]} />
                <meshStandardMaterial color="#0a0d14" roughness={1} />
              </mesh>
              {Array.from({ length: 3 }).map((_, s) => (
                <mesh key={s} position={[(s - 1) * 0.32, 0, 0.008]} rotation-z={0.15 + s * 0.1}>
                  <planeGeometry args={[0.06, 1.5]} />
                  <meshStandardMaterial color="#0d1420" transparent opacity={0.7} side={THREE.DoubleSide} />
                </mesh>
              ))}
              <mesh position={[0, 0, 0.01]} rotation-z={0.15}>
                <boxGeometry args={[1.3, 0.08, 0.02]} />
                <meshStandardMaterial color="#4a3420" roughness={0.9} />
              </mesh>
              <mesh position={[0, 0, 0.01]} rotation-z={-0.2}>
                <boxGeometry args={[1.3, 0.08, 0.02]} />
                <meshStandardMaterial color="#4a3420" roughness={0.9} />
              </mesh>
            </group>
          ))}

          <mesh position={[0, 7.9, 4.02]}>
            <boxGeometry args={[5.4, 0.7, 0.12]} />
            <meshStandardMaterial color="#0a0d14" roughness={0.9} />
          </mesh>
          <mesh ref={signRef} position={[0, 7.9, 4.09]}>
            <planeGeometry args={[5.2, 0.6]} />
            <meshBasicMaterial map={signTexture} transparent opacity={0.85} />
          </mesh>

          {vines.map((v, i) => (
            <group key={i} position={[v.x, 0, 4.1]} rotation-z={Math.sin(v.sway) * 0.05}>
              <mesh position={[0, v.height / 2, 0]}>
                <cylinderGeometry args={[0.02, 0.03, v.height, 5]} />
                <meshStandardMaterial color="#2a4a1e" roughness={0.95} />
              </mesh>
              {Array.from({ length: Math.round(v.height * 2) }).map((_, j) => (
                <mesh key={j} position={[(j % 2 === 0 ? 1 : -1) * 0.12, (j / (v.height * 2)) * v.height, 0.02]} rotation-z={0.6}>
                  <planeGeometry args={[0.14, 0.2]} />
                  <meshStandardMaterial color="#3a6a24" roughness={0.9} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          ))}

          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[-5 + i * 2.5 + (i % 2) * 0.4, 0.04, 5.6 + (i % 3) * 0.3]} rotation-y={i}>
              <boxGeometry args={[0.4 + (i % 2) * 0.2, 0.08, 0.35]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
            </mesh>
          ))}

          <pointLight position={[0, 1.8, 5.4]} intensity={1.6} distance={7} color="#ff8a1a" decay={2} />
        </group>
      }
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
  'path-point': PathPointRenderer,
}
