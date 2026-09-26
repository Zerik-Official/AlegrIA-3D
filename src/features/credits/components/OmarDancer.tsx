/**
 * Omar, dancing at the credits scene's center and facing the orbiting
 * camera's path, with his name floating over his head. Reuses Phase 2's
 * "Rey Momo" model and its procedural dance (`ReyMomoPerformer`) — the
 * standalone `.glb` originally used here (a Sketchfab export) had no
 * reliable real-world scale and stayed disproportionate to the room even
 * after normalizing it, so a known-good, already human-scaled character
 * replaces it.
 * @module features/credits/components/OmarDancer
 */

import { memo } from 'react'
import { modelRegistry } from '@/shared/config/models'
import { ReyMomoPerformer } from '@/features/phase2/components/parts/ReyMomoPerformer'
import { NameTag } from '@/features/credits/components/NameTag'
import { CREDITS_CENTER } from '@/features/credits/config/creditsConfig'

/** Height over Omar's head the name tag floats at. */
const NAME_TAG_Y = 2.5

export const OmarDancer = memo(function OmarDancer() {
  return (
    <group position={CREDITS_CENTER}>
      <ReyMomoPerformer
        src={modelRegistry['phase2/rey-momo'].path}
        fallback={
          <mesh position={[0, 1.1, 0]} castShadow>
            <capsuleGeometry args={[0.35, 1.2, 4, 8]} />
            <meshStandardMaterial color="#e8dfc8" roughness={0.85} />
          </mesh>
        }
      />
      <NameTag text="Beckham Caceres" position={[0, NAME_TAG_Y, 0]} />
    </group>
  )
})
