/**
 * `skyscraper` entity renderer for the `cityIntro` scene.
 * @module features/cityIntro/renderers/SkyscraperRenderer
 */

import { useMemo } from 'react'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { createWindowGridTexture } from '@/shared/utils/textures'
import { hashSeed, createSeededRandom } from '@/shared/utils/random'
import type { EntityRendererProps } from '@/engine/types'

/**
 * Boxy tower with lit-window facades on all four sides and an optional
 * rooftop hazard beacon; size and beacon presence come from a seed derived
 * from the entity id, so the same entity always looks the same.
 * @param props - Entity props
 * @returns Renderer element
 */
export function SkyscraperRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#3a4a6a'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const { width, depth, height, hasBeacon } = useMemo(() => {
    const rand = createSeededRandom(seed)
    return {
      width: 3.0 + rand() * 2.6,
      depth: 2.8 + rand() * 2.4,
      height: 14 + rand() * 24,
      hasBeacon: rand() > 0.4,
    }
  }, [seed])
  const windowTexture = useMemo(() => createWindowGridTexture(seed, 5, Math.round(height * 1.4)), [seed, height])

  return (
    <ModelLoader
      src={modelRegistry['cityIntro/skyscraper'].path}
      fallback={
        <group>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} roughness={0.55} metalness={0.35} />
          </mesh>
          <mesh position={[0, height / 2, depth / 2 + 0.01]}>
            <planeGeometry args={[width * 0.92, height * 0.94]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[0, height / 2, -depth / 2 - 0.01]} rotation-y={Math.PI}>
            <planeGeometry args={[width * 0.92, height * 0.94]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[width / 2 + 0.01, height / 2, 0]} rotation-y={Math.PI / 2}>
            <planeGeometry args={[depth * 0.92, height * 0.94]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          <mesh position={[-width / 2 - 0.01, height / 2, 0]} rotation-y={-Math.PI / 2}>
            <planeGeometry args={[depth * 0.92, height * 0.94]} />
            <meshBasicMaterial map={windowTexture} transparent />
          </mesh>
          {hasBeacon && (
            <>
              <mesh position={[0, height + 0.8, 0]}>
                <cylinderGeometry args={[0.035, 0.05, 1.6, 6]} />
                <meshStandardMaterial color="#2a2e38" roughness={0.6} metalness={0.7} />
              </mesh>
              <mesh position={[0, height + 1.65, 0]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial color="#ff3355" />
              </mesh>
              <pointLight position={[0, height + 1.65, 0]} intensity={0.8} distance={4} color="#ff3355" decay={2} />
            </>
          )}
        </group>
      }
    />
  )
}
