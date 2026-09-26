import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { createSeededRandom } from '@/shared/utils/random'

/** Deterministic random source for this module's procedural layout, so render stays pure. */
const seededRandom = createSeededRandom(27397)

/**
 * Scattered book entry.
 */
type ScatteredBook = {
  pos: [number, number, number]
  rot: [number, number, number]
  scale: [number, number, number]
  color: string
  open: boolean
}

const PALETTE = [
  '#5b2a1a',
  '#8b4513',
  '#2c3e50',
  '#4a6741',
  '#7a3b2e',
  '#1e3a5f',
  '#6b4c2a',
  '#3d2b1f',
  '#4d1a0f',
] as const

/** Shared geometry instances to reduce allocation. */
const planeGeometry = new THREE.PlaneGeometry(1, 1)
const boxGeometry = new THREE.BoxGeometry(1, 1, 1)

/**
 * Static scattered books conveying an abandoned library narrative.
 * All transforms are memoized once; materials are shared where possible.
 * Replace individual books via `/models/library/scattered-book.glb` + {@link ModelLoader}.
 *
 * @returns Group of randomized book meshes
 */
export const ScatteredBooks = memo(function ScatteredBooks() {
  const books: ScatteredBook[] = useMemo(() => {
    const entries: ScatteredBook[] = []
    const clusters: Array<[number, number]> = [
      [2.2, 1.1],
      [-2.6, 0.8],
      [1.8, -2.4],
      [-1.4, -3.1],
      [3.4, 0.2],
      [-3.6, -1.2],
      [0.9, 3.2],
      [-2.0, 2.8],
    ]

    clusters.forEach(([x, z]) => {
      const count = 2 + Math.floor(seededRandom() * 3)
      for (let i = 0; i < count; i++) {
        entries.push({
          pos: [x + (seededRandom() - 0.5) * 1.1, 0.02, z + (seededRandom() - 0.5) * 1.0],
          rot: [seededRandom() * 0.25, seededRandom() * Math.PI * 2, (seededRandom() - 0.5) * 0.35],
          scale: [0.52 + seededRandom() * 0.18, 0.06 + seededRandom() * 0.03, 0.36 + seededRandom() * 0.12],
          color: PALETTE[Math.floor(seededRandom() * PALETTE.length)],
          open: seededRandom() > 0.55,
        })
      }
    })

    for (let i = 0; i < 10; i++) {
      const angle = seededRandom() * Math.PI * 2
      const r = 4.2 + seededRandom() * 4.8
      entries.push({
        pos: [Math.cos(angle) * r, 0.015, Math.sin(angle) * r],
        rot: [seededRandom() * 0.18, seededRandom() * Math.PI * 2, (seededRandom() - 0.5) * 0.3],
        scale: [0.48 + seededRandom() * 0.2, 0.055, 0.34 + seededRandom() * 0.1],
        color: PALETTE[Math.floor(seededRandom() * PALETTE.length)],
        open: seededRandom() > 0.65,
      })
    }
    return entries
  }, [])

  return (
    <group>
      {books.map((b, i) => (
        <group key={i} position={b.pos} rotation-x={b.rot[0]} rotation-y={b.rot[1]} rotation-z={b.rot[2]}>
          <mesh position={[0, -0.008, 0]} rotation-x={-Math.PI / 2} scale={[b.scale[0] * 1.25, b.scale[2] * 1.25, 1]}>
            <primitive object={planeGeometry} attach="geometry" />
            <meshBasicMaterial color="#000" transparent opacity={0.18} depthWrite={false} />
          </mesh>
          <mesh castShadow receiveShadow scale={b.scale}>
            <primitive object={boxGeometry} attach="geometry" />
            <meshStandardMaterial color={b.color} roughness={0.72} metalness={0.06} />
          </mesh>
          <mesh position={[0, 0.018, 0]} scale={[b.scale[0] * 0.96, 0.022, b.scale[2] * 0.96]}>
            <primitive object={boxGeometry} attach="geometry" />
            <meshStandardMaterial color="#f5e6c8" roughness={0.95} />
          </mesh>
          {b.open && (
            <mesh position={[0, 0.032, 0]} rotation-y={0.22} scale={[b.scale[0] * 0.9, 0.008, b.scale[2] * 0.92]}>
              <primitive object={boxGeometry} attach="geometry" />
              <meshStandardMaterial color="#fff8e0" roughness={1} transparent opacity={0.92} />
            </mesh>
          )}
          <mesh position={[b.scale[0] * 0.44, 0.005, 0]} scale={[0.012, 0.02, b.scale[2] * 0.9]}>
            <primitive object={boxGeometry} attach="geometry" />
            <meshStandardMaterial color="#c9a86a" metalness={0.45} roughness={0.45} />
          </mesh>
        </group>
      ))}

      <points position={[0, 0.18, 0]}>
        <sphereGeometry args={[5.2, 8, 8]} />
        <pointsMaterial size={0.018} color="#9a8a6a" transparent opacity={0.22} depthWrite={false} sizeAttenuation />
      </points>
    </group>
  )
})
