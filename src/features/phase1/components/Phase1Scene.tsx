import { memo } from 'react'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { ProceduralTree, ProceduralTrinitaria } from '@/shared/components/ReusableModels'
import { AndenAlto } from '@/features/phase1/components/parts/AndenAlto'
import { Arroyo } from '@/features/phase1/components/parts/Arroyo'
import { Phase1Sun, Phase1Clouds } from '@/features/phase1/components/parts/Phase1Environment'
import { GroundDetail } from '@/features/phase1/components/parts/GroundDetail'
import { PhaseEngine } from '@/engine/PhaseEngine'
import { initialPhase1Entities } from '@/features/editor/config/editableEntities'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

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
 * Phase 1 scene — Barrio Abajo origins (1857–1900).
 * Engine-driven for houses, photos and portal; static for ground, arroyo and landmarks.
 *
 * @param props - Scene props
 * @returns Phase 1 group
 */
export const Phase1Scene = memo(function Phase1Scene({ highlightedPhotoId, editableEntities }: Phase1SceneProps) {
  const aduanaEntry = modelRegistry['phase1/aduana']
  const estacionEntry = modelRegistry['phase1/estacion-montoya']
  const entities = editableEntities ?? initialPhase1Entities

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[42, 42]} />
        <meshStandardMaterial color="#6b4a2a" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#7a5a2e" roughness={0.98} />
      </mesh>
      <gridHelper args={[40, 10, '#5a3d1a', '#7a5a2e']} position={[0, 0.002, 0]} />
      <GroundDetail />

      <Phase1Sun />
      <Phase1Clouds />
      <Arroyo />

      <ModelLoader
        src={aduanaEntry.path}
        fallback={
          <group position={[-7.2, 0, 4.2]}>
            <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
              <boxGeometry args={[3.6, 2.1, 2.4]} />
              <meshStandardMaterial color="#c9b896" roughness={0.86} />
            </mesh>
            <mesh position={[0, 2.22, 0]}>
              <boxGeometry args={[3.8, 0.18, 2.6]} />
              <meshStandardMaterial color="#2e1f14" roughness={0.88} />
            </mesh>
            {[-1.1, 0, 1.1].map((x) => (
              <mesh key={x} position={[x, 1.05, 1.22]}>
                <boxGeometry args={[0.22, 1.1, 0.05]} />
                <meshStandardMaterial color="#1a1208" />
              </mesh>
            ))}
          </group>
        }
      />

      <ModelLoader
        src={estacionEntry.path}
        fallback={
          <group position={[7.4, 0, 5.1]} rotation-y={-0.22}>
            <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
              <boxGeometry args={[4.1, 1.9, 1.9]} />
              <meshStandardMaterial color="#8a7a5a" roughness={0.92} />
            </mesh>
            <mesh position={[0, 1.92, 0]}>
              <boxGeometry args={[4.3, 0.14, 2.1]} />
              <meshStandardMaterial color="#3d2b1f" roughness={0.88} />
            </mesh>
          </group>
        }
      />

      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<AndenAlto position={[-4.2, 0, -3.6]} length={3.4} />} scale={0.9} />
      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<AndenAlto position={[3.8, 0, -3.2]} length={3.1} />} scale={0.9} />
      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<AndenAlto position={[-1.2, 0, -6.2]} length={2.8} />} scale={0.9} />
      <ModelLoader src={modelRegistry['phase1/anden-alto'].path} fallback={<AndenAlto position={[0, 0, 8.2]} length={9.2} />} scale={0.9} />

      <PhaseEngine entities={entities} context={{ highlightedPhotoId }} />

      <ProceduralTree position={[-6.8, 0, -2.2]} scale={1.15} foliageColor="#2a5a1e" />
      <ProceduralTree position={[6.2, 0, -1.4]} scale={1.28} foliageColor="#1e4a14" trunkColor="#2e1f14" />
      <ProceduralTree position={[-2.2, 0, 4.8]} scale={0.92} foliageColor="#3a6a1e" />
      <ProceduralTree position={[4.8, 0, 3.2]} scale={1.05} foliageColor="#2a5a1e" />
      <ProceduralTree position={[-8.8, 0, 3.4]} scale={0.98} foliageColor="#1e3a0f" />
      <ProceduralTree position={[8.4, 0, 5.8]} scale={1.12} foliageColor="#2a4a14" />
      <ProceduralTree position={[-7.2, 0, 6.8]} scale={1.08} foliageColor="#2a4a1e" />
      <ProceduralTree position={[7.6, 0, 7.4]} scale={1.02} foliageColor="#3a5a1e" />
      <ProceduralTrinitaria position={[-4.8, 0, -2.2]} bloomColor="#d82a7a" scale={1} />
      <ProceduralTrinitaria position={[4.2, 0, -2.0]} bloomColor="#7a2ad8" scale={1.1} />
      <ProceduralTrinitaria position={[-1.8, 0, -4.2]} bloomColor="#ff6a1a" scale={0.92} />
      <ProceduralTrinitaria position={[2.8, 0, 1.8]} bloomColor="#d82a7a" scale={1.05} />
      <ProceduralTrinitaria position={[-6.2, 0, 2.4]} bloomColor="#a52ad8" scale={0.98} />
      <ProceduralTrinitaria position={[1.2, 0, 5.2]} bloomColor="#ff6a1a" scale={1} />
      <ProceduralTrinitaria position={[-2.4, 0, 7.2]} bloomColor="#d82a3a" scale={0.94} />

      <ambientLight intensity={0.62} color="#ffe9c4" />
      <hemisphereLight args={['#ffecd0', '#6b4a2a', 0.52]} />
      <directionalLight position={[18, 14, -12]} intensity={1.05} color="#fff4d0" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 3.2, -1.2]} intensity={0.42} distance={9} color="#8ab4c2" decay={2} />
    </group>
  )
})
