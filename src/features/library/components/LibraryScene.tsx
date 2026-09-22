import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { Pedestal } from '@/features/pedestal/components/Pedestal'
import { LevitatingBook } from '@/features/pedestal/components/LevitatingBook'
import { Wormhole } from '@/features/wormhole/components/Wormhole'
import { TimeVortexParticles } from '@/features/wormhole/components/TimeVortexParticles'
import { CyberWall } from '@/features/library/components/CyberWall'
import { ScatteredBooks } from '@/features/library/components/ScatteredBooks'
import { TimeVortexSequence } from '@/features/cinematics/components/TimeVortexSequence'

import { PhaseEngine } from '@/engine/PhaseEngine'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Props for {@link LibraryScene}.
 */
interface LibrarySceneProps {
  /** Whether the wormhole transition is currently active. */
  wormholeActive: boolean
  /** Wormhole progress in [0,1]. */
  wormholeProgress: number
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
export const LibraryScene = memo(function LibraryScene({ wormholeActive, wormholeProgress, editableEntities }: LibrarySceneProps) {
  const libraryRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!libraryRef.current) return
    const voidProgress = THREE.MathUtils.clamp((wormholeProgress - 0.32) / 0.28, 0, 1)
    const fade = 1 - voidProgress * 0.96
    libraryRef.current.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh && mesh.material) {
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial & { transparent?: boolean; opacity?: number }
          if (mat.opacity !== undefined && mat.transparent !== undefined) {
            if (voidProgress > 0.01) mat.transparent = true
            if (mesh.userData.isBook !== true) mat.opacity = THREE.MathUtils.lerp(mat.opacity, fade, 0.12)
          }
        })
      }
    })
  })

  const torchLights = useMemo(
    () =>
      [
        [-10.6, 2.2, -6],
        [-10.6, 2.2, 0],
        [-10.6, 2.2, 6],
        [10.6, 2.2, -6],
        [10.6, 2.2, 0],
        [10.6, 2.2, 6],
        [-5, 2.2, -10.6],
        [0, 2.2, -10.6],
        [5, 2.2, -10.6],
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
        <PhaseEngine entities={editableEntities} />
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

          <Bookshelf position={[-7.2, 1.6, -10.05]} width={5.2} />
          <Bookshelf position={[0, 1.6, -10.05]} width={5.2} />
          <Bookshelf position={[7.2, 1.6, -10.05]} width={5.2} />

          <Bookshelf position={[-10.05, 1.6, -6]} rotationY={Math.PI / 2} width={5} />
          <Bookshelf position={[-10.05, 1.6, 0]} rotationY={Math.PI / 2} width={5} />
          <Bookshelf position={[-10.05, 1.6, 6]} rotationY={Math.PI / 2} width={5} />

          <Bookshelf position={[10.05, 1.6, -6]} rotationY={-Math.PI / 2} width={5} />
          <Bookshelf position={[10.05, 1.6, 0]} rotationY={-Math.PI / 2} width={5} />
          <Bookshelf position={[10.05, 1.6, 6]} rotationY={-Math.PI / 2} width={5} />

          <ScatteredBooks />
        </>
      )}
      </group>

      {editableEntities ? (
        <PhaseEngine entities={editableEntities.filter((e) => e.type === 'pedestal' || e.type === 'book')} context={{ ritualProgress: wormholeProgress }} />
      ) : (
        <>
          <Pedestal />
          <LevitatingBook ritualProgress={wormholeProgress} />
        </>
      )}
      <TimeVortexSequence active={wormholeActive} progress={wormholeProgress} />

      <Wormhole active={wormholeActive} progress={wormholeProgress} />
      <TimeVortexParticles active={wormholeActive} progress={wormholeProgress} />

      <ambientLight intensity={0.18} color="#7ab8ff" />
      <hemisphereLight args={['#0a1a2e', '#020508', 0.38]} />
      <pointLight position={[0, 1.82, 0]} intensity={2.4} distance={5.2} color="#ffcc66" decay={2} />
      <spotLight position={[0, 4.8, 0]} angle={0.5} penumbra={0.62} intensity={3.2} color="#ffe9a0" distance={11} />
      <spotLight position={[0, 4, 12]} angle={0.5} penumbra={0.7} intensity={1.15} color="#0ab8ff" distance={18} />
    </group>
  )
})
