import { useRef, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '../../../models/shared/ModelLoader'
import { modelRegistry } from '../../../shared/config/models'

/**
 * Procedural pedestal geometry.
 * Extracted for reuse when no Blender glTF is available.
 */
function ProceduralPedestalGeometry() {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ringRef.current) return
    ringRef.current.rotation.z = clock.elapsedTime * 0.6
    const s = 1 + Math.sin(clock.elapsedTime * 1.2) * 0.04
    ringRef.current.scale.set(s, s, 1)
  })

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.05, 1.2, 0.3, 32]} />
        <meshStandardMaterial color="#1a1208" roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.32, 0]} receiveShadow>
        <cylinderGeometry args={[1.02, 1.05, 0.06, 32]} />
        <meshStandardMaterial color="#c9a86a" roughness={0.35} metalness={0.6} emissive="#332209" emissiveIntensity={0.15} />
      </mesh>

      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.52, 0.8, 32]} />
        <meshStandardMaterial color="#2c1e0f" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.44, 0.44, 0.78, 32, 1, true]} />
        <meshStandardMaterial color="#3d2b12" roughness={0.8} transparent opacity={0.0} />
      </mesh>

      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.12, 1.15]} />
        <meshStandardMaterial color="#0f0a04" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[1.08, 0.02, 1.08]} />
        <meshStandardMaterial color="#c9a86a" emissive="#ffcc33" emissiveIntensity={0.25} />
      </mesh>

      <mesh ref={ringRef} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <ringGeometry args={[1.55, 1.68, 64]} />
        <meshStandardMaterial
          color="#c9a86a"
          emissive="#ffb400"
          emissiveIntensity={0.35}
          roughness={0.4}
          metalness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.021, 0]}>
        <ringGeometry args={[1.72, 1.76, 64]} />
        <meshStandardMaterial color="#8a6a2a" emissive="#ffcc33" emissiveIntensity={0.18} side={THREE.DoubleSide} />
      </mesh>

      <spotLight
        position={[0, 6, 0]}
        angle={0.35}
        penumbra={0.6}
        intensity={18}
        color="#ffe9a0"
        distance={12}
        decay={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 1.35, 0]} intensity={1.2} distance={3.2} color="#ffcc66" decay={2} />
    </group>
  )
}

/**
 * Pedestal assembly. Tries to load a Blender `.glb` first, falls back to procedural geometry.
 * Replace by dropping `public/models/pedestal/pedestal.glb` (Blender export, origin at base center).
 *
 * @returns Pedestal group
 * @link https://threejs.org/docs/#examples/en/loaders/GLTFLoader
 */
export const Pedestal = memo(function Pedestal() {
  const entry = modelRegistry['pedestal/base']

  return (
    <ModelLoader src={entry.path} fallback={<ProceduralPedestalGeometry />} />
  )
})

export { ProceduralPedestalGeometry }
