/**
 * Gothic temple silhouette with an illuminated rose window, used as the
 * procedural fallback for Phase 2's parroquia model.
 * @module features/phase2/components/parts/GothicTemple
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Props for {@link GothicTemple}. */
interface GothicTempleProps {
  /** World position. */
  position: [number, number, number]
}

/**
 * @param props - Placement
 * @returns Temple group
 */
export function GothicTemple({ position }: GothicTempleProps) {
  const glowRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!glowRef.current) return
    const mat = glowRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = 0.42 + Math.sin(clock.elapsedTime * 0.9) * 0.12
  })
  return (
    <group position={position}>
      <mesh position={[0, 1.65, 0]} castShadow>
        <boxGeometry args={[4.2, 3.3, 2.0]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.98} />
      </mesh>
      <mesh position={[0, 3.45, 0]} castShadow>
        <coneGeometry args={[2.3, 1.8, 4]} />
        <meshStandardMaterial color="#0f0f12" roughness={0.98} />
      </mesh>
      <mesh ref={glowRef} position={[0, 1.35, 1.02]}>
        <planeGeometry args={[1.45, 1.85]} />
        <meshStandardMaterial color="#0a0f1e" emissive="#ff8a1a" emissiveIntensity={0.42} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 1.35, 1.03]}>
        <planeGeometry args={[1.45, 1.85]} />
        <meshStandardMaterial color="#ffcc66" wireframe transparent opacity={0.08} />
      </mesh>
      <pointLight position={[0, 1.55, 1.4]} intensity={2.2} distance={7} color="#ffb84a" decay={2} />
    </group>
  )
}
