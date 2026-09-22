/**
 * `planet` entity renderer for the `cityIntro` scene.
 * @module features/cityIntro/renderers/PlanetRenderer
 */

import { useMemo } from 'react'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { ScenePlanet } from '@/shared/components/SceneAtmosphere'
import { hashSeed } from '@/shared/utils/random'
import type { EntityRendererProps } from '@/engine/types'

/**
 * Distant rotating planet with a soft colored point light, so it contributes
 * a bit of actual illumination to the sky instead of being purely decorative.
 * @param props - Entity props
 * @returns Renderer element
 */
export function PlanetRenderer({ entity }: EntityRendererProps) {
  const color = entity.variant ?? '#c9a877'
  const seed = useMemo(() => hashSeed(entity.id), [entity.id])
  const hasRing = seed % 3 === 0
  return (
    <ModelLoader
      src={modelRegistry['cityIntro/planet'].path}
      fallback={
        <group>
          <ScenePlanet radius={3} color={color} hasRing={hasRing} rotationSpeed={0.04 + (seed % 7) * 0.01} seed={seed} />
          <pointLight intensity={2.2} distance={140} color={color} decay={2} />
        </group>
      }
    />
  )
}
