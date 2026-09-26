import { memo } from 'react'

/**
 * Variant for bahareque houses.
 */
export type BaharequeVariant = 'short' | 'medium' | 'long'

/**
 * Props for {@link BaharequeHouse}.
 */
interface BaharequeHouseProps {
  /** World position. */
  position: [number, number, number]
  /** Y rotation. */
  rotationY?: number
  /** Uniform scale. */
  scale?: number
  /** Wall color. */
  wallColor?: string
  /** Roof color. */
  roofColor?: string
  /** Size variant. */
  variant?: BaharequeVariant
}

/**
 * Procedural bahareque house with mud walls and log frame.
 * Variants allow Blender swap via `phase1/bahareque-house-*` registry.
 *
 * @param props - House appearance
 * @returns House group
 */
export const BaharequeHouse = memo(function BaharequeHouse({
  position,
  rotationY = 0,
  scale = 1,
  wallColor = '#8b5e3c',
  roofColor = '#5a3a18',
  variant = 'medium',
}: BaharequeHouseProps) {
  const dims: [number, number, number] = variant === 'short' ? [2.1, 1.7, 1.9] : variant === 'long' ? [3.9, 1.7, 2.2] : [2.8, 1.7, 2.2]
  const roofDims: [number, number, number] = variant === 'short' ? [2.4, 0.18, 2.2] : variant === 'long' ? [4.2, 0.18, 2.5] : [3.1, 0.18, 2.5]
  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={dims} />
        <meshStandardMaterial color={wallColor} roughness={0.96} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.85, 0.02]}>
        <boxGeometry args={[2.84, 1.74, 2.24]} />
        <meshStandardMaterial color="#3d2b1f" transparent opacity={0} />
      </mesh>
      {[-1.35, 1.35].map((x) => (
        <mesh key={x} position={[x, 0.85, 1.12]} castShadow>
          <boxGeometry args={[0.09, 1.72, 0.09]} />
          <meshStandardMaterial color="#2e1f14" roughness={0.88} />
        </mesh>
      ))}
      <mesh position={[0, 1.62, 1.12]}>
        <boxGeometry args={[2.9, 0.09, 0.09]} />
        <meshStandardMaterial color="#2e1f14" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.12, 1.12]}>
        <boxGeometry args={[2.9, 0.09, 0.09]} />
        <meshStandardMaterial color="#2e1f14" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.82, 0]} rotation-x={0.22} castShadow>
        <boxGeometry args={roofDims} />
        <meshStandardMaterial color={roofColor} roughness={0.98} />
      </mesh>
      <mesh position={[0, 1.95, -0.02]} rotation-x={-0.22} castShadow>
        <boxGeometry args={roofDims} />
        <meshStandardMaterial color="#6b4a1f" roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.42, 1.13]}>
        <planeGeometry args={[0.62, 0.78]} />
        <meshStandardMaterial color="#1a1208" roughness={1} />
      </mesh>
    </group>
  )
})
