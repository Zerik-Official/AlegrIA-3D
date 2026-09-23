import { memo } from 'react'
import { SceneSun, SceneClouds } from '@/shared/components/SceneAtmosphere'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { Phase2Streets } from '@/features/phase2/components/parts/Phase2Streets'
import { initialPhase2Entities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link Phase2Scene}.
 */
interface Phase2SceneProps {
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

/**
 * Phase 2 scene — Época Dorada, Tradición y Carnaval (1919–1950s).
 * Engine-driven for its landmarks (currently the Parroquia Sagrado Corazón);
 * static for ground, sun and clouds. All meshes swappable via registry (`phase2/*`).
 *
 * @param props - Scene props
 * @returns Phase 2 group
 */
export const Phase2Scene = memo(function Phase2Scene({ editableEntities }: Phase2SceneProps) {
  const entities = editableEntities ?? initialPhase2Entities

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[84, 84]} />
        <meshStandardMaterial color="#bfa86a" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#c9b896" roughness={0.96} />
      </mesh>
      <Phase2Streets />

      <PhaseEngine entities={entities} />

      <SceneClouds count={10} spreadX={70} rangeZ={[-36, -14]} rangeY={[18, 24]} color="#fff4e0" underColor="#f0c88a" />
      <ambientLight intensity={0.72} color="#ffe9c4" />
      <SceneSun position={[8, 24, 4]} color="#fff4d0" glowColor="#ffd27a" intensity={1.45} hemisphere={{ sky: '#ffecd0', ground: '#bfa86a', intensity: 0.52 }} />
      <pointLight position={[0, 3.2, 2.5]} intensity={1.8} distance={12} color="#ff8a1a" decay={2} />
    </group>
  )
})
