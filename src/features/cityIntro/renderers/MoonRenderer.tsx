/**
 * `moon` entity renderer for the `cityIntro` scene.
 * @module features/cityIntro/renderers/MoonRenderer
 */

import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'

/**
 * Glowing sphere with a soft halo and a faint directional moonlight.
 * @returns Renderer element
 */
export function MoonRenderer() {
  return (
    <ModelLoader
      src={modelRegistry['cityIntro/moon'].path}
      fallback={
        <group>
          <mesh>
            <sphereGeometry args={[4, 24, 24]} />
            <meshStandardMaterial color="#e8e4d8" emissive="#e8e4d8" emissiveIntensity={0.42} roughness={1} />
          </mesh>
          <mesh>
            <sphereGeometry args={[4.7, 20, 20]} />
            <meshBasicMaterial color="#cfe0ff" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh>
            <sphereGeometry args={[5.6, 16, 16]} />
            <meshBasicMaterial color="#cfe0ff" transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <directionalLight intensity={0.38} color="#cfe0ff" />
        </group>
      }
    />
  )
}
