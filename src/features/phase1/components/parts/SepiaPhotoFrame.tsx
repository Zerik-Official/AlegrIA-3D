import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link SepiaPhotoFrame}.
 */
interface SepiaPhotoFrameProps {
  /** World position. */
  position: [number, number, number]
  /** Y rotation. */
  rotationY?: number
  /** Index for phase offset. */
  imageIndex?: number
  /** Whether the frame is highlighted due to proximity. */
  highlighted?: boolean
}

/**
 * Floating sepia photo with orange tint and proximity highlight.
 *
 * @param props - Frame appearance
 * @returns Frame group
 */
export const SepiaPhotoFrame = memo(function SepiaPhotoFrame({ position, rotationY = 0, imageIndex = 0, highlighted = false }: SepiaPhotoFrameProps) {
  const ref = useRef<THREE.Group>(null)
  const frameRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime + imageIndex * 1.3
    ref.current.position.y = position[1] + Math.sin(t * 0.42) * 0.14
    ref.current.rotation.y = rotationY + Math.sin(t * 0.18) * 0.08
    ref.current.rotation.z = Math.sin(t * 0.22) * 0.04
    if (frameRef.current) {
      const mat = frameRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = highlighted ? 0.42 + Math.sin(t * 3.2) * 0.18 : 0.06
    }
    if (highlighted) {
      const s = 1.04 + Math.sin(clock.elapsedTime * 2.2) * 0.02
      ref.current.scale.set(s, s, s)
    } else {
      ref.current.scale.set(1, 1, 1)
    }
  })

  return (
    <group ref={ref} position={position} rotation-y={rotationY}>
      <mesh castShadow>
        <boxGeometry args={[1.45, 1.02, 0.04]} />
        <meshStandardMaterial color="#1a1208" roughness={0.72} />
      </mesh>
      <mesh ref={frameRef} position={[0, 0, 0.028]}>
        <boxGeometry args={[1.38, 0.96, 0.015]} />
        <meshStandardMaterial color={highlighted ? '#ffcc66' : '#c9a86a'} emissive={highlighted ? '#ff8a1a' : '#000000'} emissiveIntensity={highlighted ? 0.32 : 0} metalness={0.18} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[1.32, 0.9]} />
        <meshStandardMaterial color="#704214" roughness={0.98} emissive={highlighted ? '#ff8a1a' : '#000000'} emissiveIntensity={highlighted ? 0.18 : 0} />
      </mesh>
      <mesh position={[0, 0, 0.044]}>
        <planeGeometry args={[1.32, 0.9]} />
        <meshStandardMaterial color="#ff8a1a" transparent opacity={highlighted ? 0.32 : 0.22} roughness={1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.58, 0.02]}>
        <planeGeometry args={[0.92, 0.08]} />
        <meshBasicMaterial color={highlighted ? '#ffcc66' : '#f5e6c8'} transparent opacity={highlighted ? 1 : 0.92} />
      </mesh>
      {highlighted && (
        <mesh position={[0, 0, 0.06]}>
          <ringGeometry args={[0.82, 0.86, 32]} />
          <meshBasicMaterial color="#ffcc66" transparent opacity={0.42} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
})
