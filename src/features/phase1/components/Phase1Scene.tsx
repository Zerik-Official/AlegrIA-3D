import { memo } from 'react'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'
import { ProceduralTree, ProceduralTrinitaria, ProceduralPortal } from '@/shared/components/ReusableModels'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import { BaharequeHouse, type BaharequeVariant } from '@/features/phase1/components/parts/BaharequeHouse'
import { AndenAlto } from '@/features/phase1/components/parts/AndenAlto'
import { Arroyo } from '@/features/phase1/components/parts/Arroyo'
import { SepiaPhotoFrame } from '@/features/phase1/components/parts/SepiaPhotoFrame'
import { Phase1Sun, Phase1Clouds } from '@/features/phase1/components/parts/Phase1Environment'

/**
 * Props for {@link Phase1Scene}.
 */
interface Phase1SceneProps {
  /** Id of the photo currently highlighted by proximity. */
  highlightedPhotoId?: string | null
}

/**
 * Placement entry for a single bahareque house instance.
 */
interface Phase1HouseConfig {
  /** Unique key. */
  id: string
  /** World position — kept clear of the arroyo band (z ∈ [-3.2, 0.95]) across the full X range. */
  position: [number, number, number]
  /** Y rotation in radians. */
  rotationY: number
  /** Registry/fallback variant. */
  variant: BaharequeVariant
  /** Wall color for the procedural fallback. */
  wallColor: string
  /** Optional roof color override for the procedural fallback. */
  roofColor?: string
}

const phase1Houses: Phase1HouseConfig[] = [
  { id: 'house-1', position: [-4.2, 0, -4.8], rotationY: 0.18, variant: 'short', wallColor: '#8b5e3c' },
  { id: 'house-2', position: [3.8, 0, -4.4], rotationY: -0.22, variant: 'medium', wallColor: '#7a4e2e', roofColor: '#4a2f14' },
  { id: 'house-3', position: [-1.2, 0, -7.2], rotationY: 0.08, variant: 'long', wallColor: '#9a6b44' },
  { id: 'house-4', position: [5.2, 0, 3.6], rotationY: -0.42, variant: 'medium', wallColor: '#8b5e3c' },
  { id: 'house-5', position: [-5.8, 0, 3.8], rotationY: 0.32, variant: 'short', wallColor: '#7a5a3a', roofColor: '#5a3a18' },
  { id: 'house-6', position: [-8.4, 0, -5.2], rotationY: 0.52, variant: 'long', wallColor: '#8b6a4a' },
  { id: 'house-7', position: [8.2, 0, 2.8], rotationY: -0.62, variant: 'medium', wallColor: '#9a7a5a' },
  { id: 'house-8', position: [-2.8, 0, 6.8], rotationY: 0.12, variant: 'short', wallColor: '#7a5a3a' },
  { id: 'house-9', position: [2.2, 0, 9.2], rotationY: -0.18, variant: 'long', wallColor: '#8b6b4e' },
  { id: 'house-10', position: [-6.8, 0, 6.2], rotationY: 0.42, variant: 'medium', wallColor: '#8b5e3c' },
]

/**
 * Phase 1 scene — Barrio Abajo origins (1857–1900).
 * Tierra, bahareque (3 variants), andenes altos, arroyo, sepia photos, sun and clouds.
 * All meshes swappable via registry (`phase1/*`).
 *
 * @param props - Scene callbacks
 * @returns Phase 1 group
 */
export const Phase1Scene = memo(function Phase1Scene({ highlightedPhotoId }: Phase1SceneProps) {
  const aduanaEntry = modelRegistry['phase1/aduana']
  const estacionEntry = modelRegistry['phase1/estacion-montoya']

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

      <Phase1Sun />
      <Phase1Clouds />
      <Arroyo />

      <ModelLoader
        src={aduanaEntry.path}
        position={[-7.2, 0, 4.2]}
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
        position={[7.4, 0, 5.1]}
        rotation={[0, -0.22, 0]}
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

      {phase1Houses.map((house) => (
        <ModelLoader
          key={house.id}
          src={modelRegistry[`phase1/bahareque-house-${house.variant}`].path}
          position={house.position}
          rotation={[0, house.rotationY, 0]}
          scale={0.62}
          fallback={
            <BaharequeHouse
              position={house.position}
              rotationY={house.rotationY}
              variant={house.variant}
              wallColor={house.wallColor}
              roofColor={house.roofColor}
              scale={0.62}
            />
          }
        />
      ))}

      <ModelLoader
        src={modelRegistry['phase1/anden-alto'].path}
        position={[-4.2, 0, -3.6]}
        fallback={<AndenAlto position={[-4.2, 0, -3.6]} length={3.4} />}
        scale={0.9}
      />
      <ModelLoader
        src={modelRegistry['phase1/anden-alto'].path}
        position={[3.8, 0, -3.2]}
        fallback={<AndenAlto position={[3.8, 0, -3.2]} length={3.1} />}
        scale={0.9}
      />
      <ModelLoader
        src={modelRegistry['phase1/anden-alto'].path}
        position={[-1.2, 0, -6.2]}
        fallback={<AndenAlto position={[-1.2, 0, -6.2]} length={2.8} />}
        scale={0.9}
      />
      <ModelLoader
        src={modelRegistry['phase1/anden-alto'].path}
        position={[0, 0, 8.2]}
        fallback={<AndenAlto position={[0, 0, 8.2]} length={9.2} />}
        scale={0.9}
      />

      {sepiaPhotos.map((photo, idx) => (
        <ModelLoader
          key={photo.id}
          src={modelRegistry['phase1/sepia-photo'].path}
          position={photo.position}
          rotation={[0, photo.rotationY, 0]}
          fallback={
            <SepiaPhotoFrame
              position={photo.position}
              rotationY={photo.rotationY}
              imageIndex={idx}
              highlighted={highlightedPhotoId === photo.id}
            />
          }
        />
      ))}

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

      <ProceduralPortal position={[0, 1.05, 15.8]} radius={1.55} />

      <ambientLight intensity={0.62} color="#ffe9c4" />
      <hemisphereLight args={['#ffecd0', '#6b4a2a', 0.52]} />
      <directionalLight position={[18, 14, -12]} intensity={1.05} color="#fff4d0" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 3.2, -1.2]} intensity={0.42} distance={9} color="#8ab4c2" decay={2} />
    </group>
  )
})