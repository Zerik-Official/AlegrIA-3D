/**
 * The team credits scene: the recreated RIWI coworking room, Omar dancing
 * between its two columns for the orbiting camera (`CreditsCamera`, driven
 * from `PlayerRig`), and ambient lighting. The music and the roll of names
 * are DOM overlays (`CreditsHUD`), not part of this 3D group.
 * @module features/credits/components/CreditsScene
 */

import { memo } from 'react'
import { CreditsRoom } from '@/features/credits/components/CreditsRoom'
import { OmarDancer } from '@/features/credits/components/OmarDancer'

export const CreditsScene = memo(function CreditsScene() {
  return (
    <group>
      <CreditsRoom />
      <OmarDancer />
      <ambientLight intensity={0.55} color="#fff3e0" />
      <hemisphereLight args={['#fff3e0', '#2a2018', 0.5]} />
    </group>
  )
})
