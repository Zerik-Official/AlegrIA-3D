import { useRef, memo, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RosaBookModel } from '@/models/shared/RosaBookModel'
import { BOOK_SHELF_SLOT } from '@/features/library/config/libraryLayout'

/**
 * Props for {@link LevitatingBook}.
 */
interface LevitatingBookProps {
  /** Vortex ritual progress in [0,1]; drives the spin, the writhing and the effects. */
  ritualProgress?: number
  /** Materialize-in scale target, `[0,1]`; `0` hides the book entirely (empty pedestal), `1` (default) is fully visible. Smoothly damped, not instant. */
  appear?: number
  /** Target progress `[0,1]` flying from the pedestal to its shelf slot; `0` (default) stays at the pedestal, `1` sits shelved. Smoothly damped, not instant. */
  shelved?: number
}

/** Hover height of the book over the pedestal. */
const HOVER_Y = 1.78
/** World-space delta from the book's pedestal hover height to the shelf slot it returns to (see `BOOK_SHELF_SLOT`). */
const SHELF_OFFSET = new THREE.Vector3(BOOK_SHELF_SLOT[0], BOOK_SHELF_SLOT[1] - HOVER_Y, BOOK_SHELF_SLOT[2])
/** Distance within which the book turns its cover towards the player. */
const FOLLOW_RANGE = 7
/** Spin speed at the height of the ritual, in radians per second. */
const RITUAL_SPIN = 26
/** Rising aura particles. */
const AURA_PARTICLES = 70
/** Sparks along the ritual's spiral. */
const SPIRAL_SPARKS = 140
/** Rune rings orbiting the book: radius and resting tilt. */
const RUNE_RINGS: Array<{ radius: number; tilt: [number, number] }> = [
  { radius: 0.62, tilt: [1.2, 0.2] },
  { radius: 0.78, tilt: [0.5, -0.7] },
  { radius: 0.94, tilt: [-0.9, 0.45] },
]

/** Reusable scratch vector for the book's world position. */
const scratchWorld = new THREE.Vector3()

/**
 * @param from - Current angle
 * @param to - Target angle
 * @returns Signed shortest angular difference
 */
function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

/**
 * The Libro de Rosa over the pedestal: it hovers and turns its cover
 * towards the player once they come close; during the vortex ritual it
 * spins faster and faster on its own axis while writhing and pulsing,
 * wrapped in its circular aura, rune rings and a rising spiral of sparks.
 * Smoothly scales in/out (`appear`) and flies to its shelf slot (`shelved`).
 *
 * @param props - Ritual progress, appearance and shelving
 * @returns Book group
 */
export const LevitatingBook = memo(function LevitatingBook({ ritualProgress = 0, appear = 1, shelved = 0 }: LevitatingBookProps) {
  const wrapRef = useRef<THREE.Group>(null)
  const bookRef = useRef<THREE.Group>(null)
  const effectsRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const spiralRef = useRef<THREE.Points>(null)
  const ringRefs = useRef<Array<THREE.Mesh | null>>([])
  /** Damped values, tracked outside React state so the smoothing runs every frame without re-rendering. */
  const current = useRef({ appear, shelved, ritual: 0, yaw: 0 })

  const aura = useMemo(() => {
    const positions = new Float32Array(AURA_PARTICLES * 3)
    const speeds = new Float32Array(AURA_PARTICLES)
    for (let i = 0; i < AURA_PARTICLES; i++) {
      const r = 0.45 + Math.random() * 0.9
      const theta = Math.random() * Math.PI * 2
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.1
      positions[i * 3 + 2] = Math.sin(theta) * r
      speeds[i] = 0.15 + Math.random() * 0.55
    }
    return { positions, speeds }
  }, [])

  const spiralPositions = useMemo(() => new Float32Array(SPIRAL_SPARKS * 3), [])

  useFrame(({ clock, camera }, delta) => {
    const wrap = wrapRef.current
    if (!wrap) return
    const t = clock.elapsedTime
    const dt = Math.min(delta, 0.05)
    const c = current.current
    c.appear = THREE.MathUtils.damp(c.appear, appear, 3, delta)
    c.shelved = THREE.MathUtils.damp(c.shelved, shelved, 2.2, delta)
    c.ritual = THREE.MathUtils.damp(c.ritual, ritualProgress, 6, delta)
    const r = c.ritual

    wrap.scale.setScalar(c.appear)
    wrap.position.copy(SHELF_OFFSET).multiplyScalar(c.shelved)

    const book = bookRef.current
    if (book) {
      const baseY = HOVER_Y + Math.sin(t * 0.9) * 0.14 + Math.sin(t * 1.7) * 0.03
      book.position.y = baseY + r * 1.15 + Math.sin(t * (2.2 + r * 6)) * r * 0.12

      book.getWorldPosition(scratchWorld)
      const dx = camera.position.x - scratchWorld.x
      const dz = camera.position.z - scratchWorld.z
      if (r > 0.01) {
        c.yaw += dt * (0.35 + Math.pow(r, 1.4) * RITUAL_SPIN)
      } else if (c.shelved > 0.5) {
        c.yaw += angleDelta(c.yaw, 0) * Math.min(1, dt * 2.5)
      } else if (Math.hypot(dx, dz) < FOLLOW_RANGE) {
        c.yaw += angleDelta(c.yaw, Math.atan2(dx, dz)) * Math.min(1, dt * 3.2)
      } else {
        c.yaw += dt * 0.35
      }

      book.rotation.set(
        Math.sin(t * 0.5) * 0.05 + Math.sin(t * 6.3) * 0.38 * r,
        c.yaw,
        Math.sin(t * 0.6) * 0.05 + Math.sin(t * 4.7 + 1.2) * 0.32 * r
      )
      const grow = 1 + r * 0.55
      const pulse = Math.sin(t * 11) * 0.12 * r
      book.scale.set(grow * (1 + pulse), grow * (1 - pulse * 0.8), grow)
    }

    if (effectsRef.current && book) effectsRef.current.position.y = book.position.y

    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.12 + r * 1.85)
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.2 + Math.sin(t * 1.1) * 0.07 + r * 0.5
      mat.emissiveIntensity = 1.2 + r * 4.2
    }
    if (lightRef.current) lightRef.current.intensity = 2.2 + r * 7 + Math.sin(t * 17) * r * 1.5

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return
      const { tilt } = RUNE_RINGS[i]
      const direction = i % 2 === 0 ? 1 : -1
      ring.rotation.set(tilt[0] + Math.sin(t * 0.7 + i) * 0.2, t * (0.4 + r * 7) * direction, tilt[1] + Math.cos(t * 0.5 + i) * 0.2)
      ring.scale.setScalar(1 + r * (0.5 + i * 0.15) + Math.sin(t * 3 + i) * 0.03)
      const mat = ring.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + r * 0.75
    })

    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < AURA_PARTICLES; i++) {
        let y = pos.getY(i) + aura.speeds[i] * (0.008 + r * 0.022)
        if (y > 0.7 + r * 0.6) {
          y = -0.7 - r * 0.3
          const theta = Math.random() * Math.PI * 2
          const rad = 0.45 + Math.random() * (0.9 + r * 1.2)
          pos.setX(i, Math.cos(theta) * rad)
          pos.setZ(i, Math.sin(theta) * rad)
        }
        pos.setY(i, y)
      }
      pos.needsUpdate = true
      particlesRef.current.rotation.y = t * (0.08 + r * 0.42)
      const pm = particlesRef.current.material as THREE.PointsMaterial
      pm.size = 0.028 + r * 0.022
    }

    if (spiralRef.current) {
      const pos = spiralRef.current.geometry.attributes.position as THREE.BufferAttribute
      const swirl = t * (1.5 + r * 9)
      for (let i = 0; i < SPIRAL_SPARKS; i++) {
        const u = ((i / SPIRAL_SPARKS + t * (0.12 + r * 0.5)) % 1 + 1) % 1
        const angle = u * Math.PI * 6 + swirl + (i % 2) * Math.PI
        const radius = (0.3 + u * 0.8) * (0.6 + r * 0.9)
        pos.setXYZ(i, Math.cos(angle) * radius, -0.9 + u * 2.2, Math.sin(angle) * radius)
      }
      pos.needsUpdate = true
      const sm = spiralRef.current.material as THREE.PointsMaterial
      sm.opacity = Math.min(1, r * 1.6)
      spiralRef.current.visible = r > 0.01
    }
  })

  if (appear <= 0.001 && current.current.appear <= 0.001) return <group ref={wrapRef} />

  return (
    <group ref={wrapRef}>
      <group ref={effectsRef} position={[0, HOVER_Y, 0]}>
        <mesh ref={glowRef} renderOrder={6}>
          <sphereGeometry args={[0.95, 32, 32]} />
          <meshStandardMaterial color="#ffcc33" emissive="#ffb400" emissiveIntensity={1.2} transparent opacity={0.22} depthWrite={false} />
        </mesh>
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[aura.positions, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.028} color="#ffe9a0" transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
        <points ref={spiralRef} visible={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[spiralPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.05} color="#fff1b8" transparent opacity={0} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
        {RUNE_RINGS.map((ring, i) => (
          <mesh
            key={ring.radius}
            ref={(el) => {
              ringRefs.current[i] = el
            }}
          >
            <torusGeometry args={[ring.radius, 0.007, 8, 96]} />
            <meshBasicMaterial color="#ffd166" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <group ref={bookRef} position={[0, HOVER_Y, 0]}>
        <pointLight ref={lightRef} position={[0, 0, 0.6]} intensity={2.2} distance={4.5} color="#ffcc66" decay={2} />
        <RosaBookModel height={0.62} />
      </group>

      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.02, 0.35, 0.65, 16, 1, true]} />
        <meshStandardMaterial color="#ffcc33" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
})
