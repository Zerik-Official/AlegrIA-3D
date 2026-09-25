/**
 * `poderoso-premium` entity renderer — "El Poderoso Premium", the oversized
 * sound-system rig parked in front of RIWI's building on the side street by
 * the aduana. Bounces on the beat and sheds musical notes the same way "El
 * Poderoso" does in Phase 2, with its own knot of dancers (the main avenue's
 * crowd doesn't reach this far off the avenue).
 * @module features/cityIntro/renderers/PoderosoPremiumRenderer
 */

import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { MusicalJukebox } from '@/features/phase2/components/parts/MusicalJukebox'
import { LocalDanceCrowd } from '@/features/cityIntro/components/carnival/LocalDanceCrowd'
import type { EntityRendererProps } from '@/engine/types'

/**
 * @param _props - Entity props (placement is applied by `PhaseEngine`)
 * @returns Bouncing, note-shedding rig with its own dance crowd
 */
export function PoderosoPremiumRenderer(_props: EntityRendererProps) {
  return (
    <group>
      <MusicalJukebox>
        <ModelLoader
          src={modelRegistry['cityIntro/poderoso-premium'].path}
          fallback={
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[2.8, 2.4, 1.4]} />
              <meshStandardMaterial color="#1B1B1F" roughness={0.6} />
            </mesh>
          }
        />
      </MusicalJukebox>
      <LocalDanceCrowd count={34} radius={5.5} exclude={2.6} />
    </group>
  )
}
