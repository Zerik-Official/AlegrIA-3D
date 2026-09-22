import { memo } from 'react'

/**
 * Props for {@link AndenAlto}.
 */
interface AndenAltoProps {
  /** World position. */
  position: [number, number, number]
  /** Length along X. */
  length?: number
}

/**
 * Elevated sidewalk to resist arroyos.
 *
 * @param props - Sidewalk placement
 * @returns Anden group
 */
export const AndenAlto = memo(function AndenAlto({ position, length = 3.2 }: AndenAltoProps) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[length, 0.44, 1.05]} />
        <meshStandardMaterial color="#9a8a6a" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[length + 0.06, 0.06, 1.12]} />
        <meshStandardMaterial color="#7a6a4a" roughness={0.88} />
      </mesh>
      <mesh position={[0, -0.05, 0.52]}>
        <boxGeometry args={[length, 0.12, 0.04]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.86} />
      </mesh>
    </group>
  )
})
