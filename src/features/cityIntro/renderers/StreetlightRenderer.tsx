/**
 * `streetlight` entity renderer for the `cityIntro` scene.
 * @module features/cityIntro/renderers/StreetlightRenderer
 */

import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'

/**
 * Pole + warm lamp head with a soft glow halo and matching point light.
 * @returns Streetlight group
 */
export function ProceduralStreetlight() {
  return (
    <group>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 3.2, 8]} />
        <meshStandardMaterial color="#161a20" roughness={0.55} metalness={0.65} />
      </mesh>
      <mesh position={[0, 3.15, 0.26]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.032, 0.032, 0.56, 6]} />
        <meshStandardMaterial color="#161a20" roughness={0.55} metalness={0.65} />
      </mesh>
      <mesh position={[0, 3.02, 0.52]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#ffe9b0" emissive="#ffcf6b" emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[0, 3.02, 0.52]}>
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshBasicMaterial color="#ffcf6b" transparent opacity={0.16} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight position={[0, 3.0, 0.52]} intensity={1.15} distance={6.5} color="#ffcf6b" decay={2} />
    </group>
  )
}

/**
 * @returns Renderer element
 */
export function StreetlightRenderer() {
  return <ModelLoader src={modelRegistry['cityIntro/streetlight'].path} fallback={<ProceduralStreetlight />} />
}
