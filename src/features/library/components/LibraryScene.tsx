import { memo, useMemo } from 'react'
import { Bookshelf } from './Bookshelf'
import { Pedestal } from '../../pedestal/components/Pedestal'
import { LevitatingBook } from '../../pedestal/components/LevitatingBook'
import { Wormhole } from '../../wormhole/components/Wormhole'
import { TimeVortexParticles } from '../../wormhole/components/TimeVortexParticles'
import { CyberWall } from './CyberWall'
import { ScatteredBooks } from './ScatteredBooks'

/**
 * Props for {@link LibraryScene}.
 */
interface LibrarySceneProps {
  /** Whether the wormhole transition is currently active. */
  wormholeActive: boolean
  /** Wormhole progress in [0,1]. */
  wormholeProgress: number
}

/**
 * Library hall scene composed of floor, walls, bookshelves and central pedestal.
 * Static elements are memoized to avoid re-renders; lights are shared and intensity-tuned for performance.
 * All meshes support Blender replacement via registry (`library/*`).
 *
 * @param props - Scene state
 * @returns Library group
 */
export const LibraryScene = memo(function LibraryScene({ wormholeActive, wormholeProgress }: LibrarySceneProps) {
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
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#080a12" roughness={0.92} metalness={0.06} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0e1320" roughness={0.78} metalness={0.12} />
      </mesh>
      <gridHelper args={[20, 20, '#0a1a2e', '#0f1f36']} position={[0, 0.006, 0]} />

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

      <CyberWall position={[-11, 2.6, 0]} size={[0.45, 5.2, 22]} rotationY={Math.PI / 2} missingIndex={2} />
      <CyberWall position={[11, 2.6, 0]} size={[0.45, 5.2, 22]} rotationY={-Math.PI / 2} missingIndex={7} />

      {torchLights.map(([x, y, z], i) => (
        <pointLight key={i} position={[x, y, z]} intensity={0.75} distance={5.2} color="#0ab8ff" decay={2} />
      ))}
      {torchMeshes.map(([x, y, z], i) => (
        <mesh key={`t-${i}`} position={[x, y, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.45, 8]} />
          <meshStandardMaterial color="#0a1a26" emissive="#0ab8ff" emissiveIntensity={0.18} />
        </mesh>
      ))}

      <Bookshelf position={[-7.2, 1.6, -10.05]} width={5.2} />
      <Bookshelf position={[0, 1.6, -10.05]} width={5.2} />
      <Bookshelf position={[7.2, 1.6, -10.05]} width={5.2} />

      <Bookshelf position={[-10.05, 1.6, -6]} rotationY={Math.PI / 2} width={5} />
      <Bookshelf position={[-10.05, 1.6, 0]} rotationY={Math.PI / 2} width={5} />
      <Bookshelf position={[-10.05, 1.6, 6]} rotationY={Math.PI / 2} width={5} />

      <Bookshelf position={[10.05, 1.6, -6]} rotationY={-Math.PI / 2} width={5} />
      <Bookshelf position={[10.05, 1.6, 0]} rotationY={-Math.PI / 2} width={5} />
      <Bookshelf position={[10.05, 1.6, 6]} rotationY={-Math.PI / 2} width={5} />

      <Pedestal />
      <LevitatingBook />

      <Wormhole active={wormholeActive} progress={wormholeProgress} />
      <TimeVortexParticles active={wormholeActive} progress={wormholeProgress} />

      <ScatteredBooks />

      <ambientLight intensity={0.18} color="#7ab8ff" />
      <hemisphereLight args={['#0a1a2e', '#020508', 0.38]} />
      <pointLight position={[0, 1.82, 0]} intensity={2.4} distance={5.2} color="#ffcc66" decay={2} />
      <spotLight position={[0, 4.8, 0]} angle={0.5} penumbra={0.62} intensity={3.2} color="#ffe9a0" distance={11} />
      <spotLight position={[0, 4, 12]} angle={0.5} penumbra={0.7} intensity={1.15} color="#0ab8ff" distance={18} />
    </group>
  )
})
