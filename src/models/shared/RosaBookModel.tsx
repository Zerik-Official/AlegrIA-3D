/**
 * The Libro de Rosa ("Historia del Barrio Abajo") as a closed hardcover,
 * loaded from the Blender asset built by `.vscode/scripts/libro-historia-rosa.py`.
 * @module models/shared/RosaBookModel
 */

import { memo } from 'react'
import { ModelLoader } from '@/models/shared/ModelLoader'
import { modelRegistry } from '@/shared/config/models'

/**
 * The asset's own dimensions, in meters: cover width (glTF X, spine at `-X`),
 * thickness (glTF Y, lying cover-up from `y = 0`) and height (glTF Z, the
 * title's top towards `-Z`).
 */
const BOOK_WIDTH = 0.245
const BOOK_THICKNESS = 0.034
const BOOK_HEIGHT = 0.32

/**
 * Stand-in drawn in the asset's own frame while it loads or when it's
 * missing: the dark cover, the page block and the gilded frame.
 * @returns Procedural book lying cover-up
 */
export function ProceduralRosaBook() {
  return (
    <group>
      <mesh position={[0, BOOK_THICKNESS / 2, 0]} castShadow>
        <boxGeometry args={[BOOK_WIDTH, BOOK_THICKNESS, BOOK_HEIGHT]} />
        <meshStandardMaterial color="#20242c" roughness={0.55} />
      </mesh>
      <mesh position={[BOOK_WIDTH / 2 + 0.001, BOOK_THICKNESS / 2, 0]}>
        <boxGeometry args={[0.004, BOOK_THICKNESS - 0.008, BOOK_HEIGHT - 0.012]} />
        <meshStandardMaterial color="#efe7d2" roughness={0.85} />
      </mesh>
      {[
        [0, (BOOK_HEIGHT - 0.03) / 2, BOOK_WIDTH - 0.03, 0.0022],
        [0, -(BOOK_HEIGHT - 0.03) / 2, BOOK_WIDTH - 0.03, 0.0022],
      ].map(([x, z, w, d], i) => (
        <mesh key={`h-${i}`} position={[x, BOOK_THICKNESS + 0.0005, z]}>
          <boxGeometry args={[w, 0.001, d]} />
          <meshStandardMaterial color="#d8b24c" metalness={0.55} roughness={0.32} />
        </mesh>
      ))}
      {[-(BOOK_WIDTH - 0.03) / 2, (BOOK_WIDTH - 0.03) / 2].map((x, i) => (
        <mesh key={`v-${i}`} position={[x, BOOK_THICKNESS + 0.0005, 0]}>
          <boxGeometry args={[0.0022, 0.001, BOOK_HEIGHT - 0.03]} />
          <meshStandardMaterial color="#d8b24c" metalness={0.55} roughness={0.32} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Props for {@link RosaBookModel}.
 */
interface RosaBookModelProps {
  /** Height of the standing book, in scene units. */
  height?: number
  /** Whether it casts and receives shadows. */
  castShadow?: boolean
}

/**
 * The book standing upright and centered on its origin, its cover facing
 * local `+Z` and its spine at `-X`, scaled to `height`.
 * @param props - Size and shadow flag
 * @returns Book group
 */
export const RosaBookModel = memo(function RosaBookModel({ height = 0.62, castShadow = true }: RosaBookModelProps) {
  return (
    <group scale={height / BOOK_HEIGHT}>
      <group rotation-x={Math.PI / 2} position={[0, 0, -BOOK_THICKNESS / 2]}>
        <ModelLoader src={modelRegistry['pedestal/book'].path} castShadow={castShadow} fallback={<ProceduralRosaBook />} />
      </group>
    </group>
  )
})
