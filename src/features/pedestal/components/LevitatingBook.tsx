import { useRef, memo, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'

/**
 * Props for {@link LevitatingBook}.
 */
interface LevitatingBookProps {
  /** Optional proximity callback (reserved for future use). */
  onNear?: (near: boolean) => void
  /** Vortex ritual progress in [0,1]; drives spin and opening. */
  ritualProgress?: number
  /** Materialize-in scale target, `[0,1]`; `0` hides the book entirely (empty pedestal), `1` (default) is fully visible. Smoothly damped, not instant. */
  appear?: number
  /** Target progress `[0,1]` flying from the pedestal to its shelf slot; `0` (default) stays at the pedestal, `1` sits shelved. Smoothly damped, not instant. */
  shelved?: number
}

/** World-space delta from the pedestal to the first bookshelf slot the returning book settles into, once read. */
const SHELF_OFFSET = new THREE.Vector3(-7.2, -0.18, -10.05)

/**
 * Procedural levitating book with hover, rotation and particle aura.
 * Optimized: reuses single Float32Array, updates buffer in place, avoids per-frame allocations.
 */
function ProceduralBookGeometry({ onNear: _onNear, ritualProgress = 0 }: LevitatingBookProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const coverRef = useRef<THREE.Group>(null)

  const particleCount = 70
  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const spd = new Float32Array(particleCount)
    for (let i = 0; i < particleCount; i++) {
      const r = 0.45 + Math.random() * 0.9
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 1.1
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(theta) * r
      spd[i] = 0.15 + Math.random() * 0.55
    }
    return { positions: pos, speeds: spd }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const r = ritualProgress
    if (groupRef.current) {
      const baseY = 1.78 + Math.sin(t * 0.9) * 0.18 + Math.sin(t * 1.7) * 0.04
      const lift = r * 1.15 + Math.sin(t * (2.2 + r * 6)) * r * 0.14
      groupRef.current.position.y = baseY + lift
      const spin = 0.35 + r * 9.5
      groupRef.current.rotation.y = t * spin
      groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.08 + r * Math.sin(t * 9) * 0.18
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.06 + r * 0.28
      const s = 1 + r * 0.82 + Math.sin(t * 2.2) * r * 0.06
      groupRef.current.scale.set(s, s, s)
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 1.4) * 0.12 + r * 1.85
      glowRef.current.scale.set(s, s, s)
      const mat = glowRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = 0.22 + Math.sin(t * 1.1) * 0.08 + r * 0.52
      mat.emissiveIntensity = 1.2 + r * 4.2
    }
    if (coverRef.current) {
      const open = 0.18 + r * 1.45
      coverRef.current.rotation.y = -0.12 - r * 0.92
      coverRef.current.rotation.x = open * -0.22
      coverRef.current.position.y = 0.09 + r * 0.28
      coverRef.current.rotation.z = r * 0.18
    }
    if (particlesRef.current) {
      const pos = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < particleCount; i++) {
        let y = pos.getY(i)
        y += speeds[i] * (0.008 + ritualProgress * 0.022)
        if (y > 0.7 + ritualProgress * 0.6) {
          y = -0.7 - ritualProgress * 0.3
          const theta = Math.random() * Math.PI * 2
          const rad = 0.45 + Math.random() * (0.9 + ritualProgress * 1.2)
          pos.setX(i, Math.cos(theta) * rad)
          pos.setZ(i, Math.sin(theta) * rad)
        }
        pos.setY(i, y)
      }
      pos.needsUpdate = true
      particlesRef.current.rotation.y = t * (0.08 + ritualProgress * 0.42)
      const pm = particlesRef.current.material as THREE.PointsMaterial
      pm.size = 0.028 + ritualProgress * 0.022
      pm.opacity = 0.85 + ritualProgress * 0.12
    }
  })

  return (
    <group renderOrder={6}>
      <mesh ref={glowRef} position={[0, 1.78, 0]} renderOrder={6}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshStandardMaterial
          color="#ffcc33"
          emissive="#ffb400"
          emissiveIntensity={1.2}
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </mesh>

      <points ref={particlesRef} position={[0, 1.78, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.028}
          color="#ffe9a0"
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <group ref={groupRef} position={[0, 1.78, 0]}>
        <pointLight intensity={2.2} distance={4} color="#ffcc66" decay={2} />

        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.72, 0.08, 0.52]} />
          <meshStandardMaterial color="#5b0f1f" roughness={0.52} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.68, 0.12, 0.48]} />
          <meshStandardMaterial color="#f5e6c8" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.02, 0.01]}>
          <boxGeometry args={[0.66, 0.11, 0.46]} />
          <meshStandardMaterial color="#fff8e0" roughness={1} />
        </mesh>
        <group ref={coverRef} rotation-z={0.18} rotation-y={-0.12} position={[0.06, 0.09, 0]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <boxGeometry args={[0.74, 0.05, 0.54]} />
            <meshStandardMaterial color="#8b1a3a" roughness={0.42} metalness={0.18} />
          </mesh>
          <mesh position={[0.32, 0.07, 0.22]}>
            <boxGeometry args={[0.08, 0.01, 0.08]} />
            <meshStandardMaterial color="#c9a86a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.32, 0.07, 0.22]}>
            <boxGeometry args={[0.08, 0.01, 0.08]} />
            <meshStandardMaterial color="#c9a86a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.071, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.11, 0.13, 32]} />
            <meshStandardMaterial color="#ffcc33" emissive="#ffb400" emissiveIntensity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.072, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.04, 32]} />
            <meshStandardMaterial color="#ffec88" emissive="#ffcc33" emissiveIntensity={1} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {[
          [0.9, 0.15, 0.2],
          [-0.85, -0.1, 0.35],
          [0.2, 0.45, -0.75],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]} scale={0.06}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#ffcc33" emissive="#ffb400" emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>

      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.02, 0.35, 0.65, 16, 1, true]} />
        <meshStandardMaterial
          color="#ffcc33"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

/**
 * Levitating book entry point with Blender swap support.
 * Place `public/models/pedestal/book.glb` to override procedural version without code changes.
 *
 * @param props - Optional interaction callback
 * @returns Book group
 */
export const LevitatingBook = memo(function LevitatingBook({ appear = 1, shelved = 0, ...rest }: LevitatingBookProps) {
  const entry = modelRegistry['pedestal/book']
  const wrapRef = useRef<THREE.Group>(null)
  /** Current (damped) appear/shelved values, tracked outside React state so the smoothing runs every frame without re-rendering. */
  const current = useRef({ appear, shelved })

  useFrame((_, delta) => {
    const group = wrapRef.current
    if (!group) return
    current.current.appear = THREE.MathUtils.damp(current.current.appear, appear, 3, delta)
    current.current.shelved = THREE.MathUtils.damp(current.current.shelved, shelved, 2.2, delta)
    const s = current.current.appear
    group.scale.set(s, s, s)
    group.position.set(SHELF_OFFSET.x * current.current.shelved, SHELF_OFFSET.y * current.current.shelved, SHELF_OFFSET.z * current.current.shelved)
  })

  // Fully hidden (empty pedestal) once both the target and the damped current scale have settled at 0 — skip mounting the (heavier) model/fallback subtree.
  if (appear <= 0.001 && current.current.appear <= 0.001) return <group ref={wrapRef} />

  return (
    <group ref={wrapRef}>
      <ModelLoader src={entry.path} fallback={<ProceduralBookGeometry {...rest} />} />
    </group>
  )
})

export { ProceduralBookGeometry }
