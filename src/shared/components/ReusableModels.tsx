import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link ProceduralTree}.
 */
interface TreeProps {
  /** World position. */
  position: [number, number, number]
  /** Uniform scale. */
  scale?: number
  /** Foliage color. */
  foliageColor?: string
  /** Trunk color. */
  trunkColor?: string
}

/**
 * Low-poly reusable tree with parametric colors and scale.
 * Reuse across phases to avoid polygon duplication.
 *
 * @param props - Tree appearance
 * @returns Tree group
 */
export const ProceduralTree = memo(function ProceduralTree({ position, scale = 1, foliageColor = '#2a5a1e', trunkColor = '#3d2b1f' }: TreeProps) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.52, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 1.05, 7]} />
        <meshStandardMaterial color={trunkColor} roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.22, 0]} castShadow>
        <icosahedronGeometry args={[0.62, 0]} />
        <meshStandardMaterial color={foliageColor} roughness={0.88} />
      </mesh>
      <mesh position={[0.18, 1.02, 0.12]} castShadow>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color={foliageColor} roughness={0.88} />
      </mesh>
    </group>
  )
})

/**
 * Props for {@link ProceduralTrinitaria}.
 */
interface TrinitariaProps {
  /** World position. */
  position: [number, number, number]
  /** Bloom color (magenta/purple/orange). */
  bloomColor?: string
  /** Scale. */
  scale?: number
}

/**
 * Reusable trinitaria (bougainvillea) with paper-like blooms.
 *
 * @param props - Flower appearance
 * @returns Flower group
 */
export const ProceduralTrinitaria = memo(function ProceduralTrinitaria({ position, bloomColor = '#d82a7a', scale = 1 }: TrinitariaProps) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.22) * 0.08
  })
  const blooms = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        p: [(Math.random() - 0.5) * 0.62, 0.18 + Math.random() * 0.42, (Math.random() - 0.5) * 0.62] as [number, number, number],
        s: 0.12 + Math.random() * 0.1,
      })),
    []
  )
  return (
    <group position={position} scale={scale} ref={ref}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.64, 6]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.92} />
      </mesh>
      {blooms.map((b, i) => (
        <mesh key={i} position={b.p} scale={b.s}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial color={bloomColor} side={THREE.DoubleSide} roughness={0.92} emissive={bloomColor} emissiveIntensity={0.08} />
        </mesh>
      ))}
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.18, 7, 7]} />
        <meshStandardMaterial color="#2a5a1e" roughness={0.92} />
      </mesh>
    </group>
  )
})

/**
 * Props for {@link ProceduralPortal}.
 */
interface PortalProps {
  /** World position. */
  position: [number, number, number]
  /** Portal radius. */
  radius?: number
  /** Label for accessibility. */
  label?: string
}

/**
 * Reusable portal mesh to travel between phases.
 * Place anywhere; swap via `phase2/portal` in `models.ts`.
 *
 * @param props - Portal placement
 * @returns Portal group
 */
export const ProceduralPortal = memo(function ProceduralPortal({ position, radius = 1.15 }: PortalProps) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.z = clock.elapsedTime * 0.42
    const s = 1 + Math.sin(clock.elapsedTime * 1.2) * 0.06
    ref.current.scale.set(s, s, 1)
  })
  return (
    <group position={position}>
      <mesh ref={ref}>
        <ringGeometry args={[radius * 0.72, radius, 32]} />
        <meshStandardMaterial color="#ffcc33" emissive="#0ab8ff" emissiveIntensity={0.92} side={THREE.DoubleSide} transparent opacity={0.88} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <circleGeometry args={[radius * 0.68, 32]} />
        <meshBasicMaterial color="#0ab8ff" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <pointLight intensity={1.4} distance={4.2} color="#0ab8ff" decay={2} />
    </group>
  )
})
