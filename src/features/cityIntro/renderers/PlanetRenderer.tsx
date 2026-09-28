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
 * Distant rotating planet, self-lit by its emissive surface and halo — no
 * point light, which would cost on every lit pixel of the city below.
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
        <ScenePlanet radius={3} color={color} hasRing={hasRing} rotationSpeed={0.04 + (seed % 7) * 0.01} seed={seed} />
      }
    />
  )
}
