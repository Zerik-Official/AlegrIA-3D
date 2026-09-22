import { memo, useMemo } from 'react'
import { Bookshelf } from './Bookshelf'
import { Pedestal } from '../../pedestal/components/Pedestal'
import { LevitatingBook } from '../../pedestal/components/LevitatingBook'
import { Wormhole } from '../../wormhole/components/Wormhole'
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
        <meshStandardMaterial color="#0e0a06" roughness={0.92} metalness={0.04} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1208" roughness={0.75} metalness={0.08} />
      </mesh>
      <gridHelper args={[20, 20, '#2a1e0e', '#1e150a']} position={[0, 0.006, 0]} />

      <mesh rotation-x={Math.PI / 2} position={[0, 5.2, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial color="#0a0603" roughness={1} />
      </mesh>

      {[-6, -3, 0, 3, 6].map((z) => (
        <mesh key={z} position={[0, 5.15, z]}>
          <boxGeometry args={[22, 0.18, 0.16]} />
          <meshStandardMaterial color="#1a0f08" roughness={0.8} />
        </mesh>
      ))}

      <mesh position={[0, 2.6, -11]} receiveShadow>
        <boxGeometry args={[22, 5.2, 0.45]} />
        <meshStandardMaterial color="#14100c" roughness={0.9} />
      </mesh>
      <mesh position={[-6.5, 2.6, 11]} receiveShadow>
        <boxGeometry args={[9, 5.2, 0.45]} />
        <meshStandardMaterial color="#14100c" roughness={0.9} />
      </mesh>
      <mesh position={[6.5, 2.6, 11]} receiveShadow>
        <boxGeometry args={[9, 5.2, 0.45]} />
        <meshStandardMaterial color="#14100c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.2, 11]}>
        <boxGeometry args={[5, 1.8, 0.45]} />
        <meshStandardMaterial color="#1a1208" roughness={0.85} />
      </mesh>

      <mesh position={[-11, 2.6, 0]} receiveShadow>
        <boxGeometry args={[0.45, 5.2, 22]} />
        <meshStandardMaterial color="#14100c" roughness={0.9} />
      </mesh>
      <mesh position={[11, 2.6, 0]} receiveShadow>
        <boxGeometry args={[0.45, 5.2, 22]} />
        <meshStandardMaterial color="#14100c" roughness={0.9} />
      </mesh>

      {torchLights.map(([x, y, z], i) => (
        <pointLight key={i} position={[x, y, z]} intensity={1.1} distance={6} color="#ff9a3c" decay={2} />
      ))}
      {torchMeshes.map(([x, y, z], i) => (
        <mesh key={`t-${i}`} position={[x, y, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.45, 8]} />
          <meshStandardMaterial color="#2b1a0e" />
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

      <ScatteredBooks />

      <ambientLight intensity={0.42} color="#ffecd0" />
      <hemisphereLight args={['#ffeedd', '#0a0a0f', 0.45]} />

      <spotLight position={[0, 4, 12]} angle={0.5} penumbra={0.7} intensity={4} color="#ffdca0" distance={18} />
    </group>
  )
})
