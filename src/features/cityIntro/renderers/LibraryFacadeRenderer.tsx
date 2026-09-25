/**
 * `library-facade` entity renderer for the `cityIntro` scene — the weathered
 * Republican/colonial building the player approaches at the end of the walk.
 * @module features/cityIntro/renderers/LibraryFacadeRenderer
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { createWeatheredWallTexture } from '@/shared/utils/textures'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import { Reflector } from '@/features/cityIntro/renderers/Reflector'
import { ProceduralStreetlight } from '@/features/cityIntro/renderers/StreetlightRenderer'

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
 * @returns Facade group
 */
export function ProceduralLibraryFacade() {
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
    <group>
          <mesh position={[0, GROUND_HEIGHT / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[FACADE_WIDTH, GROUND_HEIGHT, FACADE_DEPTH]} />
            <meshStandardMaterial color="#8a7238" roughness={0.94} />
          </mesh>
          <mesh position={[0, GROUND_HEIGHT / 2, FRONT_Z + 0.01]}>
            <planeGeometry args={[FACADE_WIDTH, GROUND_HEIGHT]} />
            <meshBasicMaterial map={wallWeather} transparent />
          </mesh>

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

          <mesh position={[0, GROUND_HEIGHT + CORNICE_HEIGHT / 2, 0.1]}>
            <boxGeometry args={[FACADE_WIDTH + 0.4, CORNICE_HEIGHT, FACADE_DEPTH + 0.4]} />
            <meshStandardMaterial color="#d8cca8" roughness={0.8} />
          </mesh>

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

          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[-5 + i * 2.5 + (i % 2) * 0.4, 0.04, FRONT_Z + 1.5 + (i % 3) * 0.3]} rotation-y={i}>
              <boxGeometry args={[0.4 + (i % 2) * 0.2, 0.08, 0.35]} />
              <meshStandardMaterial color="#2a2a2a" roughness={0.95} />
            </mesh>
          ))}

      <pointLight position={[0, 1.8, FRONT_Z + 1.3]} intensity={1.4} distance={7} color="#ff8a1a" decay={2} />
      <pointLight position={[0, GROUND_HEIGHT + UPPER_HEIGHT, FRONT_Z + 2]} intensity={0.5} distance={10} color="#8fa8ff" decay={2} />
    </group>
  )
}

/** Ground-level yellow floodlights (x offsets in front of the facade) — wide enough to reach both ends of the real `.glb`, which is broader than the procedural fallback's 16-unit width. */
const FACADE_SPOT_XS = [-20, -12, -4, 4, 12, 20]
const FACADE_SPOT_COLOR = '#ffd23a'

/**
 * Futuristic lighting rig framing the landmark facade — a pair of the city's
 * streetlight fixtures flanking it, warm floodlights washing the colonnade,
 * a second row aimed higher to reach the upper floor and roofline, and side
 * fill so the building's flanks don't fall into darkness — kept outside the
 * procedural fallback so it lights the real `.glb` too, which has no light
 * sources of its own (its neon sign is emissive-only, it doesn't cast light).
 * @returns Light rig elements
 */
function FacadeLightRig() {
  return (
    <>
      {FACADE_SPOT_XS.map((x) => (
        <Reflector key={`low-${x}`} position={[x, 0.45, 15]} aimAt={[x * 0.7, 3, 0]} color={FACADE_SPOT_COLOR} />
      ))}
      {FACADE_SPOT_XS.map((x) => (
        <Reflector key={`high-${x}`} position={[x, 0.45, 15]} aimAt={[x * 0.7, 9.5, 0]} color={FACADE_SPOT_COLOR} intensity={70} />
      ))}
      <group position={[-24, 0, 9]}>
        <ProceduralStreetlight />
      </group>
      <group position={[24, 0, 9]}>
        <ProceduralStreetlight />
      </group>
      <pointLight position={[-12, 2.2, 11]} intensity={2.2} distance={26} color="#ff8a1a" decay={2} />
      <pointLight position={[12, 2.2, 11]} intensity={2.2} distance={26} color="#ff8a1a" decay={2} />
      <pointLight position={[0, 10.5, 10]} intensity={1.6} distance={22} color="#5ad8ff" decay={2} />
      <pointLight position={[0, 3.5, 13]} intensity={1.1} distance={18} color="#8fd8ff" decay={2} />
      <pointLight position={[-22, 5, 4]} intensity={1.8} distance={22} color="#ffd23a" decay={2} />
      <pointLight position={[22, 5, 4]} intensity={1.8} distance={22} color="#ffd23a" decay={2} />
      <pointLight position={[0, 4.5, -6]} intensity={1.3} distance={24} color="#8fa8ff" decay={2} />
    </>
  )
}

/**
 * @returns Renderer element
 */
export function LibraryFacadeRenderer() {
  return (
    <>
      <ModelLoader src={modelRegistry['cityIntro/library-facade'].path} fallback={<ProceduralLibraryFacade />} />
      <FacadeLightRig />
    </>
  )
}
