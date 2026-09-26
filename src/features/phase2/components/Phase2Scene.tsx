import { memo } from 'react'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { Phase2Streets } from '@/features/phase2/components/parts/Phase2Streets'
import { initialPhase2Entities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/** Entities farther than this from the camera don't cast shadows (see `PhaseEngine`). */
const SHADOW_DISTANCE = 30

/**
 * The phase's authored entities minus its fixed `portal`: outside the editor
 * the way forward is the portal the Libro de Rosa summons in front of the
 * player (see `StoryPortal`), so the authored one stays editable but hidden.
 */
const PLAY_ENTITIES = initialPhase2Entities.filter((e) => e.type !== 'portal')

/**
 * Props for {@link Phase2Scene}.
 */
interface Phase2SceneProps {
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

/**
 * Phase 2 scene — Época Dorada, Tradición y Carnaval (1919–1950s).
 * Engine-driven for its landmarks, sun and clouds (`engine/config/phase2.json`);
 * static for the ground. All meshes swappable via registry (`phase2/*`).
 *
 * @param props - Scene props
 * @returns Phase 2 group
 */
export const Phase2Scene = memo(function Phase2Scene({ editableEntities }: Phase2SceneProps) {
  const entities = editableEntities ?? PLAY_ENTITIES

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[240, 240]} />
        <meshStandardMaterial color="#bfa86a" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#c9b896" roughness={0.96} />
      </mesh>
      <Phase2Streets />

      <PhaseEngine entities={entities} shadowDistance={SHADOW_DISTANCE} />

      <ambientLight intensity={0.72} color="#ffe9c4" />
      <pointLight position={[0, 3.2, 2.5]} intensity={1.8} distance={12} color="#ff8a1a" decay={2} />
    </group>
  )
})
