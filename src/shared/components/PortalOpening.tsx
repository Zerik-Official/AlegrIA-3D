import { memo, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createSeededRandom } from '@/shared/utils/random'

/** Deterministic random source for this module's procedural layout, so render stays pure. */
const seededRandom = createSeededRandom(64923)

/**
 * Props for {@link PortalOpening}.
 */
interface PortalOpeningProps {
  /** The portal itself, revealed as the rift widens. */
  children: ReactNode
  /** Portal radius — sizes the rift, shockwave and sparks. */
  radius?: number
  /** Warm accent color of the rift and sparks. */
  accentColor?: string
  /** Cool color of the shockwave and flare light. */
  glowColor?: string
}

/** Sparks thrown out when the rift bursts open. */
const SPARK_COUNT = 90
/** Seconds the vertical rift takes to tear from nothing to full height. */
const TEAR_END = 0.45
/** Seconds over which the rift widens into the full portal. */
const OPEN_START = 0.35
const OPEN_END = 1.35
/** Seconds after which every opening effect has faded and hides itself. */
const DONE = 1.9

/**
 * @param k - Progress in [0,1]
 * @returns Back-out eased progress, overshooting slightly before settling at 1
 */
function easeOutBack(k: number): number {
  const c = 1.4
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2)
}

/**
 * How a summoned portal comes into being: a thin vertical rift of light tears
 * open from its center, then widens sideways into the full ring while a
 * shockwave ring and a spray of sparks burst outwards and a flare lights the
 * surroundings. Plays once, the moment it mounts; the portal is untouched
 * afterwards. The portal faces its local `+Z`.
 *
 * @param props - Portal to reveal, its size and colors
 * @returns Opening group
 */
export const PortalOpening = memo(function PortalOpening({ children, radius = 1.4, accentColor = '#ffcc33', glowColor = '#5ad8ff' }: PortalOpeningProps) {
  const startedAt = useRef<number | null>(null)
  const portalRef = useRef<THREE.Group>(null)
  const riftRef = useRef<THREE.Mesh>(null)
  const waveRef = useRef<THREE.Mesh>(null)
  const sparksRef = useRef<THREE.Points>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const effectsRef = useRef<THREE.Group>(null)

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(SPARK_COUNT * 3)
    const vel = new Float32Array(SPARK_COUNT * 3)
    for (let i = 0; i < SPARK_COUNT; i++) {
      const a = seededRandom() * Math.PI * 2
      const speed = 2.2 + seededRandom() * 3.2
      vel[i * 3] = Math.cos(a) * speed
      vel[i * 3 + 1] = Math.sin(a) * speed
      vel[i * 3 + 2] = (seededRandom() - 0.2) * 1.6
    }
    return { positions: pos, velocities: vel }
  }, [])

  useFrame(({ clock }, delta) => {
    if (startedAt.current === null) startedAt.current = clock.elapsedTime
    const t = clock.elapsedTime - startedAt.current
    const dt = Math.min(delta, 0.05)

    if (portalRef.current) {
      const k = THREE.MathUtils.clamp((t - OPEN_START) / (OPEN_END - OPEN_START), 0, 1)
      const sx = Math.max(0.001, easeOutBack(k))
      const sy = Math.max(0.001, THREE.MathUtils.lerp(0.35, 1, 1 - Math.pow(1 - k, 3)) * (k > 0 ? 1 : 0))
      portalRef.current.scale.set(sx, sy, sx)
    }

    if (effectsRef.current) effectsRef.current.visible = t < DONE
    if (t >= DONE) return

    if (riftRef.current) {
      const tear = THREE.MathUtils.smoothstep(t, 0, TEAR_END)
      const fade = 1 - THREE.MathUtils.smoothstep(t, 0.7, 1.3)
      const widen = 1 + THREE.MathUtils.smoothstep(t, OPEN_START, OPEN_END) * 6
      riftRef.current.scale.set(widen, Math.max(0.001, tear), 1)
      const mat = riftRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = fade * (0.85 + Math.sin(t * 40) * 0.15)
    }

    if (waveRef.current) {
      const w = THREE.MathUtils.clamp((t - 0.4) / 0.9, 0, 1)
      const s = 0.6 + w * 2.4
      waveRef.current.scale.set(s, s, 1)
      const mat = waveRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = w > 0 ? (1 - w) * 0.8 : 0
    }

    if (sparksRef.current) {
      const burst = t > 0.4
      const attr = sparksRef.current.geometry.attributes.position as THREE.BufferAttribute
      const velocities = (sparksRef.current.geometry.attributes.aVelocity as THREE.BufferAttribute).array as Float32Array
      for (let i = 0; i < SPARK_COUNT; i++) {
        if (!burst) continue
        attr.setXYZ(
          i,
          attr.getX(i) + velocities[i * 3] * dt,
          attr.getY(i) + velocities[i * 3 + 1] * dt - 0.6 * dt,
          attr.getZ(i) + velocities[i * 3 + 2] * dt
        )
        velocities[i * 3] *= 0.96
        velocities[i * 3 + 1] *= 0.96
      }
      attr.needsUpdate = true
      const mat = sparksRef.current.material as THREE.PointsMaterial
      mat.opacity = burst ? 1 - THREE.MathUtils.smoothstep(t, 0.9, DONE) : 0
    }

    if (lightRef.current) {
      const flare = THREE.MathUtils.smoothstep(t, 0.1, 0.45) * (1 - THREE.MathUtils.smoothstep(t, 0.6, DONE))
      lightRef.current.intensity = flare * 16
    }
  })

  return (
    <group>
      <group ref={portalRef} scale={0.001}>
        {children}
      </group>
      <group ref={effectsRef}>
        <pointLight ref={lightRef} intensity={0} distance={14} color={glowColor} decay={1.8} />
        <mesh ref={riftRef} position={[0, 0, 0.08]} renderOrder={10}>
          <planeGeometry args={[radius * 0.07, radius * 2.3]} />
          <meshBasicMaterial color="#fff8e6" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh ref={waveRef} position={[0, 0, 0.04]} renderOrder={9}>
          <ringGeometry args={[radius * 0.92, radius, 64]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
        <points ref={sparksRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-aVelocity" args={[velocities, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.07} color={accentColor} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
        </points>
      </group>
    </group>
  )
})
