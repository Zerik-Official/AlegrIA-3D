import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Sun and sky dome for Phase 1 with soft daylight.
 *
 * @returns Environment group
 */
export const Phase1Sun = memo(function Phase1Sun() {
  const sunRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!sunRef.current) return
    sunRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.08) * 0.04
  })
  return (
    <group>
      <mesh position={[18, 14, -12]} ref={sunRef}>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshBasicMaterial color="#fff4d0" />
      </mesh>
      <mesh position={[18, 14, -12]}>
        <sphereGeometry args={[3.2, 24, 24]} />
        <meshBasicMaterial color="#ffb84a" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      <directionalLight position={[18, 14, -12]} intensity={1.15} color="#fff4d0" castShadow shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={['#ffecd0', '#6b4a2a', 0.52]} />
    </group>
  )
})

/**
 * Drifting clouds for Phase 1.
 *
 * @returns Clouds group
 */
export const Phase1Clouds = memo(function Phase1Clouds() {
  const groupRef = useRef<THREE.Group>(null)
  const clouds = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        x: (Math.random() - 0.5) * 32,
        z: -8 - Math.random() * 18,
        y: 9 + Math.random() * 3,
        s: 1.2 + Math.random() * 0.9,
        speed: 0.08 + Math.random() * 0.06,
      })),
    []
  )

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime
    groupRef.current.children.forEach((c, i) => {
      const data = clouds[i]
      c.position.x = data.x + Math.sin(t * data.speed + i) * 1.2
      c.position.y = data.y + Math.sin(t * 0.12 + i) * 0.22
    })
  })

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[1.2, 12, 12]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.32} roughness={1} />
          </mesh>
          <mesh position={[0.9, 0.22, 0.12]}>
            <sphereGeometry args={[0.82, 12, 12]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.28} roughness={1} />
          </mesh>
          <mesh position={[-0.8, 0.18, -0.08]}>
            <sphereGeometry args={[0.92, 12, 12]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  )
})
