import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  onNear?: (near: boolean) => void
}

export function LevitatingBook({ onNear: _onNear }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  // particle positions
  const particleCount = 70
  const positions = useRef<Float32Array>(new Float32Array(particleCount * 3))
  const speeds = useRef<Float32Array>(new Float32Array(particleCount))

  if (positions.current[1] === 0) {
    for (let i = 0; i < particleCount; i++) {
      const r = 0.45 + Math.random() * 0.9
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 1.1
      positions.current[i * 3] = Math.cos(theta) * r
      positions.current[i * 3 + 1] = y
      positions.current[i * 3 + 2] = Math.sin(theta) * r
      speeds.current[i] = 0.15 + Math.random() * 0.55
    }
  }

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.position.y = 1.78 + Math.sin(t * 0.9) * 0.18 + Math.sin(t * 1.7) * 0.04
      groupRef.current.rotation.y = t * 0.35
      groupRef.current.rotation.z = Math.sin(t * 0.6) * 0.08
      groupRef.current.rotation.x = Math.sin(t * 0.5) * 0.06
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 1.4) * 0.12
      glowRef.current.scale.set(s, s, s)
      ;(glowRef.current.material as THREE.MeshStandardMaterial).opacity = 0.22 + Math.sin(t * 1.1) * 0.08
    }
    if (particlesRef.current) {
      const pos = (particlesRef.current.geometry.attributes.position as THREE.BufferAttribute)
      for (let i = 0; i < particleCount; i++) {
        let y = pos.getY(i)
        y += speeds.current[i] * 0.008
        if (y > 0.7) {
          y = -0.7
          const theta = Math.random() * Math.PI * 2
          const r = 0.45 + Math.random() * 0.9
          pos.setX(i, Math.cos(theta) * r)
          pos.setZ(i, Math.sin(theta) * r)
        }
        pos.setY(i, y)
      }
      pos.needsUpdate = true
      particlesRef.current.rotation.y = t * 0.08
    }
  })

  return (
    <group>
      {/* Glow volume */}
      <mesh ref={glowRef} position={[0, 1.78, 0]}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshStandardMaterial color="#ffcc33" emissive="#ffb400" emissiveIntensity={1.2} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Particles */}
      <points ref={particlesRef} position={[0, 1.78, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions.current, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.028} color="#ffe9a0" transparent opacity={0.85} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* Book group */}
      <group ref={groupRef} position={[0, 1.78, 0]}>
        {/* Light from book */}
        <pointLight intensity={2.2} distance={4} color="#ffcc66" decay={2} />

        {/* Book cover bottom */}
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.72, 0.08, 0.52]} />
          <meshStandardMaterial color="#3d1a0a" roughness={0.55} metalness={0.1} />
        </mesh>
        {/* Pages block */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.68, 0.12, 0.48]} />
          <meshStandardMaterial color="#f5e6c8" roughness={0.9} />
        </mesh>
        {/* Page lines */}
        <mesh position={[0, 0.02, 0.01]}>
          <boxGeometry args={[0.66, 0.11, 0.46]} />
          <meshStandardMaterial color="#fff8e0" roughness={1} />
        </mesh>
        {/* Cover top — slightly open */}
        <group rotation-z={0.18} rotation-y={-0.12} position={[0.06, 0.09, 0]}>
          <mesh castShadow position={[0, 0.04, 0]}>
            <boxGeometry args={[0.74, 0.05, 0.54]} />
            <meshStandardMaterial color="#6b1d0f" roughness={0.45} metalness={0.15} />
          </mesh>
          {/* Gold corners */}
          <mesh position={[0.32, 0.07, 0.22]}>
            <boxGeometry args={[0.08, 0.01, 0.08]} />
            <meshStandardMaterial color="#c9a86a" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-0.32, 0.07, 0.22]}>
            <boxGeometry args={[0.08, 0.01, 0.08]} />
            <meshStandardMaterial color="#c9a86a" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Sigil */}
          <mesh position={[0, 0.071, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.11, 0.13, 32]} />
            <meshStandardMaterial color="#ffcc33" emissive="#ffb400" emissiveIntensity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.072, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.04, 32]} />
            <meshStandardMaterial color="#ffec88" emissive="#ffcc33" emissiveIntensity={1} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Floating runes (small icosa) */}
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

      {/* Lectern shadow beam */}
      <mesh position={[0, 1.15, 0]} rotation-x={0}>
        <cylinderGeometry args={[0.02, 0.35, 0.65, 16, 1, true]} />
        <meshStandardMaterial color="#ffcc33" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}
