import { memo, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { Pedestal } from '@/features/pedestal/components/Pedestal'
import { LevitatingBook } from '@/features/pedestal/components/LevitatingBook'
import { PedestalAwakening } from '@/features/pedestal/components/PedestalAwakening'
import { Wormhole } from '@/features/wormhole/components/Wormhole'
import { TimeVortexParticles } from '@/features/wormhole/components/TimeVortexParticles'
import { CyberWall } from '@/features/library/components/CyberWall'
import { ScatteredBooks } from '@/features/library/components/ScatteredBooks'
import { PendantLamp } from '@/features/library/components/PendantLamp'
import { ReadingTable, SectionSign, ToppledShelf } from '@/features/library/components/LibraryFurnishings'
import { TimeVortexSequence } from '@/features/cinematics/components/TimeVortexSequence'
import { PortalCrossingSequence } from '@/features/cinematics/components/PortalCrossingSequence'
import { RestoredLibrary } from '@/features/library/components/RestoredLibrary'
import { LightBurst } from '@/features/library/components/LightBurst'
import { ProceduralPortal } from '@/shared/components/ReusableModels'
import { PortalOpening } from '@/shared/components/PortalOpening'
import { registerCollisionSolids, unregisterCollisionSolids } from '@/features/player/collision'
import {
  AISLE_SHELVES,
  BOOK_SHELF_SLOT,
  CEILING_Y,
  LIBRARY_PORTAL_POSITION,
  LIBRARY_PORTAL_RADIUS,
  LAMPS,
  READING_TABLES,
  SECTION_SIGNS,
  SHELF_HEIGHT,
  TOPPLED_SHELVES,
  WALL_SHELVES,
  libraryCollisionSolids,
  restoredLibraryCollisionSolids,
} from '@/features/library/config/libraryLayout'

import { PhaseEngine } from '@/engine/PhaseEngine'
import type { EditableEntity } from '@/features/editor/config/editableEntities'
import type { LibraryBookStage } from '@/app/hooks/usePhaseFlow'

/**
 * Props for {@link FlickeringTorch}.
 */
interface FlickeringTorchProps {
  /** World position of the light source. */
  position: readonly [number, number, number]
}

/**
 * Warm, unsteady point light standing in for emergency lighting in an
 * abandoned building — intensity wanders via layered sine noise.
 *
 * @param props - Light placement
 * @returns Point light
 */
const FlickeringTorch = memo(function FlickeringTorch({ position }: FlickeringTorchProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.elapsedTime
    lightRef.current.intensity = 0.55 + Math.sin(t * 8 + position[0]) * 0.14 + Math.sin(t * 19 + position[2]) * 0.08
  })
  return <pointLight ref={lightRef} position={position as [number, number, number]} intensity={0.6} distance={5.2} color="#ff8a1a" decay={2} />
})

/**
 * Props for {@link WallTorchFixture}.
 */
interface WallTorchFixtureProps {
  /** World position of the wall mount. */
  position: readonly [number, number, number]
}

/**
 * Small wall-mounted bracket + glowing bulb, oriented to face into the room
 * from whichever side wall it's mounted on.
 *
 * @param props - Fixture placement
 * @returns Fixture group
 */
const WallTorchFixture = memo(function WallTorchFixture({ position }: WallTorchFixtureProps) {
  const bulbRef = useRef<THREE.Mesh>(null)
  const facesRight = position[0] < 0
  useFrame(({ clock }) => {
    if (!bulbRef.current) return
    const mat = bulbRef.current.material as THREE.MeshStandardMaterial
    const t = clock.elapsedTime
    mat.emissiveIntensity = Math.max(0.25, 0.75 + Math.sin(t * 9 + position[0]) * 0.18 + Math.sin(t * 21 + position[2]) * 0.1)
  })
  return (
    <group position={position as [number, number, number]} rotation-y={facesRight ? Math.PI / 2 : -Math.PI / 2}>
      <mesh castShadow>
        <boxGeometry args={[0.06, 0.06, 0.2]} />
        <meshStandardMaterial color="#1a1e26" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.16, 0.14]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
        <meshStandardMaterial color="#1a1e26" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh ref={bulbRef} position={[0, -0.26, 0.16]}>
        <icosahedronGeometry args={[0.055, 0]} />
        <meshStandardMaterial color="#ffcf6b" emissive="#ff8a1a" emissiveIntensity={0.75} />
      </mesh>
    </group>
  )
})

/**
 * Props for {@link BookGlowLights}.
 */
interface BookGlowLightsProps {
  /** Target power `[0,1]` — `0` while the pedestal is still switched off. */
  power: number
}

/**
 * The warm key light hugging the book and the spot pouring down on it, eased
 * between dark and full strength along with the pedestal they belong to.
 *
 * @param props - Power level
 * @returns Lights
 */
const BookGlowLights = memo(function BookGlowLights({ power }: BookGlowLightsProps) {
  const pointRef = useRef<THREE.PointLight>(null)
  const spotRef = useRef<THREE.SpotLight>(null)
  const current = useRef(power)
  useFrame((_, delta) => {
    current.current = THREE.MathUtils.damp(current.current, power, 1.4, Math.min(delta, 0.05))
    if (pointRef.current) pointRef.current.intensity = 2.4 * current.current
    if (spotRef.current) spotRef.current.intensity = 3.2 * current.current
  })
  return (
    <>
      <pointLight ref={pointRef} position={[0, 1.82, 0]} intensity={2.4 * power} distance={5.2} color="#ffcc66" decay={2} />
      <spotLight ref={spotRef} position={[0, 4.8, 0]} angle={0.5} penumbra={0.62} intensity={3.2 * power} color="#ffe9a0" distance={11} />
    </>
  )
})

/**
 * Props for {@link LibraryScene}.
 */
interface LibrarySceneProps {
  /** Whether the wormhole transition is currently active. */
  wormholeActive: boolean
  /** Wormhole progress in [0,1]. */
  wormholeProgress: number
  /** Book/portal choreography stage — see {@link LibraryBookStage}. Defaults to `'ready'` (book always present, no portal), matching the first visit. */
  bookStage?: LibraryBookStage
  /** Whether the returned book has remade the hall — swaps the abandoned library for {@link RestoredLibrary} and removes the pedestal. */
  libraryRestored?: boolean
  /** Whether the `cityIntro` portal has appeared and can be used. */
  libraryPortalUnlocked?: boolean
  /** Which cinematic the running wormhole plays: the book's ritual over the pedestal, or diving through the restored hall's portal. */
  crossingMode?: 'book' | 'portal'
  /** Optional engine-driven entities for editor. */
  editableEntities?: EditableEntity[]
}

/**
 * Library hall scene composed of floor, walls, bookshelves and central pedestal.
 * Static elements are memoized to avoid re-renders; lights are shared and intensity-tuned for performance.
 * All meshes support Blender replacement via registry (`library/*`).
 *
 * @param props - Scene state
 * @returns Library group
 */
export const LibraryScene = memo(function LibraryScene({
  wormholeActive,
  wormholeProgress,
  bookStage = 'ready',
  libraryRestored = false,
  libraryPortalUnlocked = false,
  crossingMode = 'book',
  editableEntities,
}: LibrarySceneProps) {
  const libraryRef = useRef<THREE.Group>(null)
  const bookGone = bookStage === 'dormant' || bookStage === 'igniting' || bookStage === 'hidden' || bookStage === 'transforming' || bookStage === 'restored'
  const pedestalPower = bookStage === 'dormant' ? 0 : 1
  const bookAppear = bookGone ? 0 : 1
  const bookShelved = bookStage === 'returning' || bookStage === 'transforming' || bookStage === 'restored' ? 1 : 0
  const showRestored = libraryRestored && !editableEntities

  useFrame(() => {
    if (!libraryRef.current) return
    const voidProgress = THREE.MathUtils.clamp((wormholeProgress - 0.32) / 0.28, 0, 1)
    const fade = 1 - voidProgress
    libraryRef.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh && mesh.material && !mesh.userData.ownsOpacity) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial & { transparent?: boolean; opacity?: number }
          if (mat.opacity !== undefined && mat.transparent !== undefined) {
            if (voidProgress > 0.01) mat.transparent = true
            mat.opacity = THREE.MathUtils.lerp(mat.opacity, fade, 0.12)
          }
        })
      }
    })
  })

  useEffect(() => {
    registerCollisionSolids('library-furnishings', showRestored ? restoredLibraryCollisionSolids : libraryCollisionSolids)
    return () => unregisterCollisionSolids('library-furnishings')
  }, [showRestored])

  /**
   * Emergency wall lighting, thinned out now that the pendant lamps carry the
   * room — the fixtures on the walls still all glow (`torchMeshes`), but only
   * these few contribute a real light, keeping the hall's total light count
   * within what forward rendering handles comfortably.
   */
  const torchLights = useMemo(
    () =>
      [
        [-10.6, 2.2, -6],
        [-10.6, 2.2, 6],
        [10.6, 2.2, -6],
        [10.6, 2.2, 6],
      ] as const,
    [],
  )

  const torchMeshes = useMemo(
    () =>
      [
        [-10.75, 2.0, -6],
        [-10.75, 2.0, 0],
        [-10.75, 2.0, 6],
        [10.75, 2.0, -6],
        [10.75, 2.0, 0],
        [10.75, 2.0, 6],
      ] as const,
    [],
  )

  return (
    <group>
      <group ref={libraryRef}>
        {showRestored ? (
          <RestoredLibrary />
        ) : (
          <>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[22, 22]} />
          <meshStandardMaterial color="#080a12" roughness={0.92} metalness={0.06} transparent opacity={1} />
        </mesh>
        <gridHelper args={[20, 20, '#0a1a2e', '#0f1f36']} position={[0, 0.015, 0]} />

      <mesh rotation-x={Math.PI / 2} position={[0, 5.2, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#04060a" roughness={1} />
      </mesh>

      {[-6, -3, 0, 3, 6].map((z) => (
        <mesh key={z} position={[0, 5.15, z]}>
          <boxGeometry args={[22, 0.18, 0.16]} />
          <meshStandardMaterial color="#0a0f1e" roughness={0.82} metalness={0.22} />
        </mesh>
      ))}

      {editableEntities ? (
        <PhaseEngine entities={editableEntities.filter((e) => e.type !== 'book')} />
      ) : (
        <>
          <CyberWall position={[0, 2.6, -11]} size={[22, 5.2, 0.45]} missingIndex={5} />
          <mesh position={[-6.5, 2.6, 11]} receiveShadow>
            <boxGeometry args={[9, 5.2, 0.45]} />
            <meshStandardMaterial color="#0e1320" roughness={0.88} metalness={0.12} />
          </mesh>
          <mesh position={[6.5, 2.6, 11]} receiveShadow>
            <boxGeometry args={[9, 5.2, 0.45]} />
            <meshStandardMaterial color="#0e1320" roughness={0.88} metalness={0.12} />
          </mesh>
          <mesh position={[0, 4.2, 11]}>
            <boxGeometry args={[5, 1.8, 0.45]} />
            <meshStandardMaterial color="#0a0f18" roughness={0.86} metalness={0.18} />
          </mesh>

          <CyberWall position={[-11, 2.6, 0]} size={[22, 5.2, 0.45]} rotationY={Math.PI / 2} missingIndex={2} />
          <CyberWall position={[11, 2.6, 0]} size={[22, 5.2, 0.45]} rotationY={-Math.PI / 2} missingIndex={7} />

          {[...WALL_SHELVES, ...AISLE_SHELVES].map((shelf) => (
            <Bookshelf
              key={`shelf-${shelf.position[0]}-${shelf.position[1]}`}
              position={[shelf.position[0], SHELF_HEIGHT / 2, shelf.position[1]]}
              rotationY={shelf.rotationY}
              width={shelf.width}
            />
          ))}

          {TOPPLED_SHELVES.map((shelf) => (
            <ToppledShelf
              key={`toppled-${shelf.position[0]}-${shelf.position[1]}`}
              position={shelf.position}
              rotationY={shelf.rotationY}
              tilt={shelf.tilt}
              width={shelf.width}
            />
          ))}

          {READING_TABLES.map((table) => (
            <ReadingTable key={`table-${table.position[0]}-${table.position[1]}`} position={table.position} rotationY={table.rotationY} />
          ))}

          {SECTION_SIGNS.map((sign) => (
            <SectionSign key={sign.label} position={sign.position} rotationY={sign.rotationY} label={sign.label} ceilingY={CEILING_Y} />
          ))}

          <ScatteredBooks />
          <Pedestal power={pedestalPower} />
        </>
      )}

      {LAMPS.map((lamp, i) => (
        <PendantLamp
          key={`lamp-${lamp.position[0]}-${lamp.position[1]}`}
          position={lamp.position}
          ceilingY={CEILING_Y}
          drop={lamp.drop}
          flicker={lamp.flicker}
          phase={i * 2.37}
        />
      ))}

      {torchLights.map((p) => (
        <FlickeringTorch key={`torch-light-${p[0]}-${p[1]}-${p[2]}`} position={p} />
      ))}
      {torchMeshes.map((p, i) => (
        <WallTorchFixture key={`torch-mesh-${i}`} position={p} />
      ))}
          </>
        )}
      </group>

      {editableEntities ? (
        <PhaseEngine entities={editableEntities.filter((e) => e.type === 'book')} context={{ ritualProgress: wormholeProgress }} />
      ) : (
        <LevitatingBook ritualProgress={crossingMode === 'book' ? wormholeProgress : 0} appear={bookAppear} shelved={bookShelved} />
      )}
      <PedestalAwakening active={bookStage === 'awakening'} />
      <LightBurst active={bookStage === 'transforming'} origin={BOOK_SHELF_SLOT} />
      {libraryPortalUnlocked && (
        <group position={LIBRARY_PORTAL_POSITION}>
          <PortalOpening radius={LIBRARY_PORTAL_RADIUS} accentColor="#ffcc33" glowColor="#5ad8ff">
            <ProceduralPortal position={[0, 0, 0]} radius={LIBRARY_PORTAL_RADIUS} accentColor="#ffcc33" glowColor="#5ad8ff" />
          </PortalOpening>
        </group>
      )}

      {crossingMode === 'portal' ? (
        <>
          <PortalCrossingSequence active={wormholeActive} progress={wormholeProgress} center={LIBRARY_PORTAL_POSITION} />
          <Wormhole active={wormholeActive} progress={wormholeProgress} center={LIBRARY_PORTAL_POSITION} />
          <TimeVortexParticles active={wormholeActive} progress={wormholeProgress} center={LIBRARY_PORTAL_POSITION} />
        </>
      ) : (
        <>
          <TimeVortexSequence active={wormholeActive} progress={wormholeProgress} />
          <Wormhole active={wormholeActive} progress={wormholeProgress} />
          <TimeVortexParticles active={wormholeActive} progress={wormholeProgress} />
        </>
      )}

      {!showRestored && (
        <>
          <ambientLight intensity={0.18} color="#7ab8ff" />
          <hemisphereLight args={['#0a1a2e', '#020508', 0.38]} />
          <BookGlowLights power={pedestalPower} />
          <spotLight position={[0, 4, 12]} angle={0.5} penumbra={0.7} intensity={1.15} color="#0ab8ff" distance={18} />
        </>
      )}
    </group>
  )
})
