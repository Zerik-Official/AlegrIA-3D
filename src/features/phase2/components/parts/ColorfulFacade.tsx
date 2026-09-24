/**
 * Colorful facade with trinitaria balcony, used as Phase 2's generic
 * "Fachada Colorida" procedural fallback.
 * @module features/phase2/components/parts/ColorfulFacade
 */

/** Props for {@link ColorfulFacade}. */
interface ColorfulFacadeProps {
  /** World position. */
  position: [number, number, number]
  /** Wall color. */
  color: string
  /** Y rotation in radians. */
  rotationY?: number
}

/**
 * @param props - Placement and color
 * @returns Facade group
 */
export function ColorfulFacade({ position, color, rotationY = 0 }: ColorfulFacadeProps) {
  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.2, 1.9]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.32, 0.98]}>
        <boxGeometry args={[3.0, 0.18, 0.22]} />
        <meshStandardMaterial color="#2e1f14" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.82, 0.98]}>
        <boxGeometry args={[3.0, 0.14, 0.22]} />
        <meshStandardMaterial color="#f5e6c8" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.05, 0.99]}>
        <planeGeometry args={[2.2, 1.05]} />
        <meshStandardMaterial color="#1a1208" roughness={1} />
      </mesh>
      <mesh position={[-0.72, 1.02, 1.02]}>
        <planeGeometry args={[0.42, 0.72]} />
        <meshStandardMaterial color="#7ab8ff" transparent opacity={0.22} roughness={0.32} />
      </mesh>
      <mesh position={[0.72, 1.02, 1.02]}>
        <planeGeometry args={[0.42, 0.72]} />
        <meshStandardMaterial color="#7ab8ff" transparent opacity={0.22} roughness={0.32} />
      </mesh>
    </group>
  )
}
