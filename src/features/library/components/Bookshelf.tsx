import { memo, useMemo } from 'react'
import * as THREE from 'three'

/**
 * Props for {@link Bookshelf}.
 */
interface BookshelfProps {
  /** World position of the shelf group. */
  position: [number, number, number]
  /** Y-axis rotation in radians. */
  rotationY?: number
  /** Shelf width. */
  width?: number
  /** Shelf height. */
  height?: number
  /** Shelf depth. */
  depth?: number
  /** Whether this is the restored library's shelving: polished wood, gilded trim and every row fully stocked. */
  restored?: boolean
}

/** Color palette reused across all bookshelves to reduce material instances. */
const PALETTE = ['#5b2a1a', '#8b4513', '#2c3e50', '#4a6741', '#7a3b2e', '#1e3a5f', '#6b4c2a', '#3d2b1f'] as const

/** Richer, livelier spines for the restored library. */
const RESTORED_PALETTE = ['#8b1a3a', '#1e4a7a', '#2f6b3a', '#b8742a', '#6b2a6b', '#a83a2a', '#1e6b6b', '#c9a86a', '#5b2a1a'] as const

/** Shared materials to avoid per-bookshelf allocation. */
const sharedMaterials = {
  frame: new THREE.MeshStandardMaterial({ color: '#2b1a0e', roughness: 0.85, metalness: 0.05 }),
  voidMat: new THREE.MeshStandardMaterial({ color: '#0f0a06', roughness: 1 }),
  shelf: new THREE.MeshStandardMaterial({ color: '#3d2616', roughness: 0.7 }),
  cornice: new THREE.MeshStandardMaterial({ color: '#1a0f08', roughness: 0.6 }),
}

/** Shared materials for the restored library's shelving. */
const restoredMaterials = {
  frame: new THREE.MeshStandardMaterial({ color: '#6b3a1c', roughness: 0.5, metalness: 0.08 }),
  voidMat: new THREE.MeshStandardMaterial({ color: '#2a160a', roughness: 0.9 }),
  shelf: new THREE.MeshStandardMaterial({ color: '#8a4e26', roughness: 0.45 }),
  cornice: new THREE.MeshStandardMaterial({ color: '#c9a86a', roughness: 0.3, metalness: 0.7, emissive: '#3a2608', emissiveIntensity: 0.3 }),
}

/**
 * Procedural bookshelf composed of frame, shelves and randomized book volumes.
 * Optimized with memoized book layouts and shared materials.
 * Supports replacement via Blender glTF at `/models/library/bookshelf.glb`.
 *
 * @param props - Shelf placement and dimensions
 * @returns Bookshelf group
 * @link https://threejs.org/docs/#api/en/geometries/BoxGeometry
 */
export const Bookshelf = memo(function Bookshelf({
  position,
  rotationY = 0,
  width = 4,
  height = 3.2,
  depth = 0.45,
  restored = false,
}: BookshelfProps) {
  const mats = restored ? restoredMaterials : sharedMaterials
  const palette = restored ? RESTORED_PALETTE : PALETTE
  /**
   * Computes book instances once per size change.
   * Caches random distribution to avoid per-render churn.
   */
  const books = useMemo(() => {
    const items: { color: string; w: number; h: number; x: number; y: number; z: number }[] = []
    const rows = 4
    for (let r = 0; r < rows; r++) {
      const y = -height / 2 + 0.35 + r * (height / rows)
      let x = -width / 2 + 0.22
      while (x < width / 2 - 0.22) {
        const w = 0.12 + Math.random() * 0.18
        const h = 0.48 + Math.random() * 0.18
        if (x + w > width / 2 - 0.1) break
        if (restored || Math.random() > 0.15) {
          items.push({
            color: palette[Math.floor(Math.random() * palette.length)],
            w,
            h,
            x: x + w / 2,
            y: y + h / 2 - 0.12,
            z: (Math.random() - 0.5) * 0.06,
          })
        }
        x += w + 0.015
      }
    }
    return items
  }, [width, height, restored, palette])

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <primitive object={mats.frame} attach="material" />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[width - 0.12, height - 0.12, depth - 0.06]} />
        <primitive object={mats.voidMat} attach="material" />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, -height / 2 + 0.06 + i * (height / 5), 0]} receiveShadow>
          <boxGeometry args={[width - 0.06, 0.04, depth - 0.02]} />
          <primitive object={mats.shelf} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[0.04, height - 0.12, depth - 0.04]} />
        <primitive object={mats.shelf} attach="material" />
      </mesh>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, depth / 2 - 0.08 + b.z]} castShadow>
          <boxGeometry args={[b.w - 0.01, b.h, 0.18]} />
          <meshStandardMaterial color={b.color} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, height / 2 + 0.06, 0.02]}>
        <boxGeometry args={[width + 0.14, 0.12, depth + 0.08]} />
        <primitive object={mats.cornice} attach="material" />
      </mesh>
      <pointLight
        position={[0, height / 2 - 0.4, depth / 2 + 0.3]}
        intensity={restored ? 1.1 : 0.7}
        distance={3.5}
        color="#ffcc66"
        decay={2}
      />
    </group>
  )
})
