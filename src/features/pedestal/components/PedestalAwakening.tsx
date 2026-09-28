import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createSeededRandom } from '@/shared/utils/random'

/** Deterministic random source for this module's procedural layout, so render stays pure. */
const seededRandom = createSeededRandom(43415)

/**
 * Props for {@link PedestalAwakening}.
 */
interface PedestalAwakeningProps {
  /** Whether the awakening is playing; it starts over every time this turns true. */
  active: boolean
}

/** Height of the book's hover point over the pedestal. */
const BOOK_Y = 1.78
/** Ceiling height the light column reaches. */
const COLUMN_TOP = 5.2
/** Motes spiraling up the column. */
const MOTE_COUNT = 140
/** Seconds the whole awakening lasts. */
const TOTAL = 3

/**
 * The first visit's awakening, once the pedestal has flickered to life: a
 * column of golden light erupts from it up to the ceiling, a shockwave rolls
 * across the floor, motes spiral up the beam and a flare marks the instant
 * the Libro de Rosa materializes above it, before the light settles.
 *
 * @param props - Activation
 * @returns Awakening group, or `null` while idle
 */
export const PedestalAwakening = memo(function PedestalAwakening({ active }: PedestalAwakeningProps) {
  const startedAt = useRef<number | null>(null)
  const columnGroupRef = useRef<THREE.Group>(null)
  const columnRef = useRef<THREE.Mesh>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const waveRef = useRef<THREE.Mesh>(null)
  const flareRef = useRef<THREE.Mesh>(null)
  const motesRef = useRef<THREE.Points>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(MOTE_COUNT * 3)
    const ph = new Float32Array(MOTE_COUNT)
    for (let i = 0; i < MOTE_COUNT; i++) {
      ph[i] = seededRandom()
      pos[i * 3 + 1] = seededRandom() * COLUMN_TOP
    }
    return { positions: pos, phases: ph }
  }, [])

  useFrame(({ clock }) => {
    if (!active) {
      startedAt.current = null
      return
    }
    if (startedAt.current === null) startedAt.current = clock.elapsedTime
    const t = clock.elapsedTime - startedAt.current
    const rise = THREE.MathUtils.smoothstep(t, 0, 0.5)
    const fade = 1 - THREE.MathUtils.smoothstep(t, TOTAL - 1.3, TOTAL)

    if (columnGroupRef.current) columnGroupRef.current.scale.set(1, Math.max(0.001, rise), 1)
    if (columnRef.current) {
      columnRef.current.scale.set(1 + Math.sin(t * 9) * 0.05, 1, 1 + Math.sin(t * 9) * 0.05)
      const mat = columnRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.32 * rise * fade
    }
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.7 * rise * fade
    }
    if (waveRef.current) {
      const w = THREE.MathUtils.clamp(t / 1.4, 0, 1)
      const s = 1 + w * 5
      waveRef.current.scale.set(s, s, 1)
      const mat = waveRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - w) * 0.75
    }
    if (flareRef.current) {
      const f = THREE.MathUtils.smoothstep(t, 0.3, 0.6) * (1 - THREE.MathUtils.smoothstep(t, 0.7, 1.6))
      flareRef.current.scale.setScalar(0.3 + f * 1.6)
      const mat = flareRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = f
    }
    if (motesRef.current) {
      const attr = motesRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < MOTE_COUNT; i++) {
        const y = (attr.getY(i) + 0.035 + phases[i] * 0.03) % COLUMN_TOP
        const a = phases[i] * Math.PI * 2 + y * 1.8 + t * 2
        const r = 0.25 + phases[i] * 0.35
        attr.setXYZ(i, Math.cos(a) * r, y, Math.sin(a) * r)
      }
      attr.needsUpdate = true
      const mat = motesRef.current.material as THREE.PointsMaterial
      mat.opacity = rise * fade
    }
    if (lightRef.current) lightRef.current.intensity = 14 * rise * fade
  })

  if (!active) return null

  return (
    <group>
      <pointLight ref={lightRef} position={[0, BOOK_Y, 0]} intensity={0} distance={12} color="#ffd98a" decay={1.6} />
      <group ref={columnGroupRef}>
        <mesh ref={columnRef} position={[0, COLUMN_TOP / 2, 0]} renderOrder={7}>
          <cylinderGeometry args={[0.62, 0.9, COLUMN_TOP, 32, 1, true]} />
          <meshBasicMaterial color="#ffd98a" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh ref={coreRef} position={[0, COLUMN_TOP / 2, 0]} renderOrder={7}>
          <cylinderGeometry args={[0.16, 0.26, COLUMN_TOP, 16, 1, true]} />
          <meshBasicMaterial color="#fff6dc" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <mesh ref={waveRef} rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} renderOrder={7}>
        <ringGeometry args={[1.6, 1.8, 64]} />
        <meshBasicMaterial color="#ffcc55" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={flareRef} position={[0, BOOK_Y, 0]} renderOrder={8}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial color="#fff4d6" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <points ref={motesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#ffe6a0" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  )
})
