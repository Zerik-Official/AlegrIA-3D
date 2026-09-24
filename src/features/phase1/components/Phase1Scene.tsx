import { memo } from 'react'
import { ProceduralTree, ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { Phase1Sun, Phase1Clouds } from '@/features/phase1/components/parts/Phase1Environment'
import { GroundDetail } from '@/features/phase1/components/parts/GroundDetail'
import { Phase1Flood } from '@/features/phase1/components/parts/Phase1Flood'
import { Phase1Backdrop } from '@/features/phase1/components/parts/Phase1Backdrop'
import { MagdalenaRiver } from '@/features/phase1/components/parts/MagdalenaRiver'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { initialPhase1Entities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/** Entities farther than this from the camera don't cast shadows (see `PhaseEngine`). */
const SHADOW_DISTANCE = 34

/**
 * Props for {@link Phase1Scene}.
 */
interface Phase1SceneProps {
  /** Id of the photo currently highlighted by proximity. */
  highlightedPhotoId?: string | null
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

/**
 * Phase 1 scene — Barrio Abajo & the Río Magdalena waterfront (1857–1900).
 * Fully JSON/engine-driven (see `engine/config/phase1.json`): houses, the
 * port/station/boardwalk set pieces, the rail kit and its animated train,
 * port decor and the sepia photos all come from `PhaseEngine`. Only the
 * ground, the river and unauthored atmosphere (backdrop, sun, flood) stay
 * hardcoded here, same as Phase 2's plaza floor and lighting.
 *
 * @param props - Scene props
 * @returns Phase 1 group
 */
export const Phase1Scene = memo(function Phase1Scene({ highlightedPhotoId, editableEntities }: Phase1SceneProps) {
  const entities = editableEntities ?? initialPhase1Entities

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[480, 480]} />
        <meshStandardMaterial color="#5a4022" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-14, 0, 0]} receiveShadow>
        <planeGeometry args={[68, 120]} />
        <meshStandardMaterial color="#6b4a2a" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-14, 0.001, 0]} receiveShadow>
        <planeGeometry args={[66, 118]} />
        <meshStandardMaterial color="#7a5a2e" roughness={0.98} />
      </mesh>
      <gridHelper args={[66, 16, '#5a3d1a', '#7a5a2e']} position={[-14, 0.002, 0]} />
      <GroundDetail />
      <Phase1Backdrop />

      <Phase1Sun />
      <Phase1Clouds />
      <MagdalenaRiver />
      <Phase1Flood />

      <PhaseEngine entities={entities} context={{ highlightedPhotoId }} shadowDistance={SHADOW_DISTANCE} />

      <ProceduralTree position={[-30, 0, -12]} scale={1.15} foliageColor="#2a5a1e" />
      <ProceduralTree position={[-4, 0, -30]} scale={1.28} foliageColor="#1e4a14" trunkColor="#2e1f14" />
      <ProceduralTree position={[-22, 0, 20]} scale={0.92} foliageColor="#3a6a1e" />
      <ProceduralTree position={[-2, 0, 30]} scale={1.05} foliageColor="#2a5a1e" />
      <ProceduralTree position={[-34, 0, 4]} scale={0.98} foliageColor="#1e3a0f" />
      <ProceduralTree position={[-10, 0, -4]} scale={1.12} foliageColor="#2a4a14" />
      <ProceduralTree position={[-26, 0, 36]} scale={1.08} foliageColor="#2a4a1e" />
      <ProceduralTree position={[-16, 0, -38]} scale={1.02} foliageColor="#3a5a1e" />
      <ProceduralTrinitaria position={[-20, 0, -8]} bloomColor="#d82a7a" scale={1} />
      <ProceduralTrinitaria position={[-10, 0, -20]} bloomColor="#7a2ad8" scale={1.1} />
      <ProceduralTrinitaria position={[-30, 0, 16]} bloomColor="#ff6a1a" scale={0.92} />
      <ProceduralTrinitaria position={[-6, 0, 18]} bloomColor="#d82a7a" scale={1.05} />
      <ProceduralTrinitaria position={[-24, 0, -30]} bloomColor="#a52ad8" scale={0.98} />
      <ProceduralTrinitaria position={[-16, 0, 44]} bloomColor="#ff6a1a" scale={1} />

      <ambientLight intensity={0.62} color="#ffe9c4" />
      <hemisphereLight args={['#ffecd0', '#6b4a2a', 0.52]} />
      <directionalLight position={[18, 14, -12]} intensity={1.05} color="#fff4d0" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[9, 3.2, -8]} intensity={0.42} distance={16} color="#8ab4c2" decay={2} />
    </group>
  )
})
