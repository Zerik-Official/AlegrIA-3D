import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'

/**
 * Props for {@link ProceduralCyberWall}.
 */
interface CyberWallProps {
  /** World position of the wall center. */
  position: [number, number, number]
  /** Wall dimensions in world units. */
  size: [number, number, number]
  /** Rotation around Y axis. */
  rotationY?: number
  /** Index of the panel that is missing; -1 disables the hole. */
  missingIndex?: number
}

/**
 * Procedural cybernetic wall with segmented panels, emissive seams and a missing piece.
 * Rendered when no Blender `glb` is present at `library/cyber-wall`.
 *
 * @param props - Wall placement
 * @returns Cyber wall group
 */
function ProceduralCyberWall({ position, size, rotationY = 0, missingIndex = 5 }: CyberWallProps) {
  const sparkRef = useRef<THREE.Points>(null)
  const [width, height, depth] = size

  const cols = 4
  const rows = 2
  const panelCount = cols * rows

  const sparkPositions = useMemo(() => {
    const arr = new Float32Array(48 * 3)
    for (let i = 0; i < 48; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.8
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1.2
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.35
    }
    return arr
  }, [])

  useFrame(({ clock }) => {
    if (!sparkRef.current) return
    const t = clock.elapsedTime
    const mat = sparkRef.current.material as THREE.PointsMaterial
    mat.opacity = 0.35 + Math.sin(t * 18) * 0.22 + Math.sin(t * 7) * 0.12
    sparkRef.current.rotation.z = Math.sin(t * 0.9) * 0.08
  })

  const missingCol = missingIndex % cols
  const missingRow = Math.floor(missingIndex / cols)

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#0a0f18" roughness={0.82} metalness={0.42} />
      </mesh>

      {Array.from({ length: panelCount }).map((_, idx) => {
        if (idx === missingIndex) return null
        const col = idx % cols
        const row = Math.floor(idx / cols)
        const px = -width / 2 + (width / cols) * (col + 0.5)
        const py = -height / 2 + (height / rows) * (row + 0.5)
        const isCracked = idx === 2 || idx === 6
        return (
          <group key={idx} position={[px, py, depth / 2 + 0.02]}>
            <mesh receiveShadow>
              <boxGeometry args={[width / cols - 0.08, height / rows - 0.08, 0.04]} />
              <meshStandardMaterial
                color={isCracked ? '#101a26' : '#111827'}
                roughness={isCracked ? 0.92 : 0.62}
                metalness={0.38}
                emissive={isCracked ? '#051018' : '#000000'}
              />
            </mesh>
            <mesh position={[0, 0, 0.025]}>
              <planeGeometry args={[width / cols - 0.14, 0.015]} />
              <meshStandardMaterial
                color="#0ab8ff"
                emissive="#0ab8ff"
                emissiveIntensity={isCracked ? 0.18 : 0.92}
                transparent
                opacity={isCracked ? 0.28 : 0.92}
              />
            </mesh>
            <mesh position={[0, 0, 0.025]} rotation-z={Math.PI / 2}>
              <planeGeometry args={[height / rows - 0.14, 0.012]} />
              <meshStandardMaterial color="#0ab8ff" emissive="#0ab8ff" emissiveIntensity={0.62} transparent opacity={0.62} />
            </mesh>
            {isCracked && (
              <mesh position={[0.18, -0.08, 0.03]} rotation-z={0.42}>
                <planeGeometry args={[0.72, 0.008]} />
                <meshBasicMaterial color="#ff3b1f" transparent opacity={0.72} />
              </mesh>
            )}
          </group>
        )
      })}

      {missingIndex >= 0 && (
        <group position={[-width / 2 + (width / cols) * (missingCol + 0.5), -height / 2 + (height / rows) * (missingRow + 0.5), 0]}>
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[width / cols - 0.06, height / rows - 0.06]} />
            <meshBasicMaterial color="#020508" />
          </mesh>
          <pointLight position={[0, 0, 0.35]} intensity={1.8} distance={2.6} color="#ff3b1f" decay={2} />
          <pointLight position={[0, 0, 0.22]} intensity={1.1} distance={3.2} color="#0ab8ff" decay={2} />
          <points ref={sparkRef} position={[0, 0, 0.12]}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.035} color="#ff8a2a" transparent opacity={0.52} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
          </points>
          {[
            [-0.32, 0.12, 0.08],
            [0.28, -0.18, 0.06],
            [0.12, 0.22, 0.09],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]} rotation-z={Math.random() * Math.PI}>
              <boxGeometry args={[0.22, 0.015, 0.015]} />
              <meshStandardMaterial color="#2a3a48" roughness={0.68} metalness={0.42} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}

/**
 * Cyber wall entry with Blender override.
 * Drop `public/models/library/cyber-wall.glb` to replace procedural geometry.
 *
 * @param props - Wall placement
 * @returns Wall group
 */
export const CyberWall = memo(function CyberWall(props: CyberWallProps) {
  const entry = modelRegistry['library/cyber-wall']
  if (!entry) return <ProceduralCyberWall {...props} />
  return <ModelLoader src={entry.path} fallback={<ProceduralCyberWall {...props} />} />
})

export { ProceduralCyberWall }
