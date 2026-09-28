/**
 * The team credits scene: the Blender-authored RIWI Barranquilla room,
 * Jafet dancing between its pillars for the orbiting camera (`CreditsCamera`,
 * driven from `PlayerRig`), engine-driven decor from `engine/config/credits.json`,
 * and ambient lighting. The music and the roll of names are DOM overlays
 * (`CreditsHUD`), not part of this 3D group.
 * @module features/credits/components/CreditsScene
 */

import { memo } from 'react'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { CreditsRoom } from '@/features/credits/components/CreditsRoom'
import { JafetDancer } from '@/features/credits/components/JafetDancer'
import { initialCreditsEntities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link CreditsScene}.
 */
interface CreditsSceneProps {
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

export const CreditsScene = memo(function CreditsScene({ editableEntities }: CreditsSceneProps) {
  const entities = editableEntities ?? initialCreditsEntities

  return (
    <group>
      <CreditsRoom />
      <PhaseEngine entities={entities} />
      <JafetDancer />
      <ambientLight intensity={0.55} color="#fff3e0" />
      <hemisphereLight args={['#fff3e0', '#2a2018', 0.5]} />
    </group>
  )
})
