/**
 * `street-jukebox-car` entity renderer — the hover carrosa parked amid the
 * avenue's dancing crowd, "batuqueándose" on the beat with musical notes
 * rising off its sound equipment like "El Poderoso" does in Phase 2. It never
 * moves from its spot (unlike the parade floats); the avenue crowd
 * (`CarnivalCrowd`) already dances all around it, kept clear of its
 * footprint by `carnivalLayout`'s blocking boxes.
 * @module features/cityIntro/renderers/StreetJukeboxCarRenderer
 */

import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { MusicalJukebox } from '@/features/phase2/components/parts/MusicalJukebox'
import type { EntityRendererProps } from '@/engine/types'

/**
 * @param _props - Entity props (placement is applied by `PhaseEngine`)
 * @returns Bouncing, note-shedding street jukebox car
 */
export function StreetJukeboxCarRenderer(_props: EntityRendererProps) {
  return (
    <MusicalJukebox>
      <ModelLoader
        src={modelRegistry['cityIntro/street-jukebox-car'].path}
        fallback={
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[3.6, 1, 7.8]} />
            <meshStandardMaterial color="#4B107A" roughness={0.5} metalness={0.2} />
          </mesh>
        }
      />
    </MusicalJukebox>
  )
}
