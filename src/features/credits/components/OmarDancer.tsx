/**
 * Omar, dancing at the credits scene's center and facing the orbiting
 * camera's path, with his name floating over his head. Reuses
 * `CongasPerformer` for the baked-animation `.glb` playback — it's generic
 * (any src + fallback, plays every clip on loop), the same contract Omar's
 * model needs.
 * @module features/credits/components/OmarDancer
 */

import { memo } from 'react'
import { modelRegistry } from '@/shared/config/models'
import { CongasPerformer } from '@/features/phase2/components/parts/CongasPerformer'
import { NameTag } from '@/features/credits/components/NameTag'
import { CREDITS_CENTER } from '@/features/credits/config/creditsConfig'

/** Height over Omar's head the name tag floats at. */
const NAME_TAG_Y = 2.1

export const OmarDancer = memo(function OmarDancer() {
  return (
    <group position={CREDITS_CENTER}>
      <CongasPerformer
        src={modelRegistry['credits/omar-dancing'].path}
        fallback={
          <group>
            <mesh position={[0, 0.85, 0]} castShadow>
              <capsuleGeometry args={[0.3, 0.85, 4, 8]} />
              <meshStandardMaterial color="#8a3a5a" roughness={0.8} />
            </mesh>
            <mesh position={[0, 1.5, 0]} castShadow>
              <sphereGeometry args={[0.2, 12, 12]} />
              <meshStandardMaterial color="#c68642" roughness={0.85} />
            </mesh>
          </group>
        }
      />
      <NameTag text="Omar Vizcaino" position={[0, NAME_TAG_Y, 0]} />
    </group>
  )
})
