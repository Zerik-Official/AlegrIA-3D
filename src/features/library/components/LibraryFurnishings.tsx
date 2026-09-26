/**
 * The dressing that turns the hall into a library rather than a room with
 * shelves in it: hanging section placards, the stacks that went over into each
 * other, and the abandoned reading tables.
 * @module features/library/components/LibraryFurnishings
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { Bookshelf } from '@/features/library/components/Bookshelf'
import { SHELF_DEPTH, SHELF_HEIGHT, TABLE_SIZE, TABLE_TOP_Y } from '@/features/library/config/libraryLayout'
import { createSeededRandom } from '@/shared/utils/random'

/** Deterministic random source for this module's procedural layout, so render stays pure. */
const seededRandom = createSeededRandom(90164)

/**
 * Generates (once per label) a placard texture — grimy parchment with the
 * section name stencilled across it and a couple of worn-through patches.
 * @param label - Section name
 * @returns Canvas-based sign texture
 */
function useSectionSignTexture(label: string): THREE.Texture {
  return useMemo(() => {
    const w = 512
    const h = 128
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#1a1712'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#c9b88c'
    ctx.fillRect(6, 6, w - 12, h - 12)

    ctx.fillStyle = 'rgba(40,30,18,0.16)'
    for (let i = 0; i < 26; i++) {
      const x = seededRandom() * w
      const y = seededRandom() * h
      ctx.beginPath()
      ctx.ellipse(x, y, 6 + seededRandom() * 26, 4 + seededRandom() * 14, seededRandom() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.font = 'bold 62px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#2b2118'
    ctx.fillText(label, w / 2, h / 2 + 4)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [label])
}

/** Props for {@link SectionSign}. */
interface SectionSignProps {
  /** `[x, z]` floor position the placard hangs above. */
  position: [number, number]
  /** Y rotation in radians. */
  rotationY: number
  /** Section name painted on it. */
  label: string
  /** Y the hanging chains are anchored at. */
  ceilingY: number
}

/** Height the placard's face hangs at. */
const SIGN_Y = 3.85

/**
 * @param props - Placement and label
 * @returns Hanging placard group
 */
export const SectionSign = memo(function SectionSign({ position, rotationY, label, ceilingY }: SectionSignProps) {
  const texture = useSectionSignTexture(label)
  const chainLength = ceilingY - SIGN_Y - 0.16

  return (
    <group position={[position[0], 0, position[1]]} rotation-y={rotationY}>
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} position={[x, SIGN_Y + 0.16 + chainLength / 2, 0]}>
          <cylinderGeometry args={[0.009, 0.009, chainLength, 4]} />
          <meshStandardMaterial color="#0c0f16" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, SIGN_Y, 0]} castShadow>
        <boxGeometry args={[1.72, 0.44, 0.05]} />
        <meshStandardMaterial color="#241c12" roughness={0.85} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, SIGN_Y, side * 0.031]} rotation-y={side > 0 ? 0 : Math.PI}>
          <planeGeometry args={[1.62, 0.36]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
})

/** Props for {@link ToppledShelf}. */
interface ToppledShelfProps {
  /** `[x, z]` floor position of the unit's base. */
  position: [number, number]
  /** Y rotation aiming the direction it falls (its local `+Z`). */
  rotationY: number
  /** Lean away from upright, in radians. */
  tilt: number
  /** Unit width along its own run. */
  width: number
}

/**
 * A shelving unit caught mid-fall. The lean is applied about the unit's base
 * edge rather than its center — pivoting about the center would sink the top
 * half through the floor — and the whole thing lifts by half its depth as it
 * goes over, so a flat unit rests on its back instead of in the floor.
 *
 * @param props - Placement and lean
 * @returns Toppled shelf group
 */
export const ToppledShelf = memo(function ToppledShelf({ position, rotationY, tilt, width }: ToppledShelfProps) {
  return (
    <group position={[position[0], (SHELF_DEPTH / 2) * Math.sin(tilt), position[1]]} rotation-y={rotationY}>
      <group rotation-x={tilt}>
        <Bookshelf position={[0, SHELF_HEIGHT / 2, 0]} width={width} />
      </group>
    </group>
  )
})

/** Props for {@link ReadingTable}. */
interface ReadingTableProps {
  /** `[x, z]` floor position of the table's center. */
  position: [number, number]
  /** Y rotation in radians. */
  rotationY: number
}

/**
 * Long reading table with a pair of benches, both left where the last readers
 * pushed them.
 * @param props - Placement
 * @returns Table group
 */
export const ReadingTable = memo(function ReadingTable({ position, rotationY }: ReadingTableProps) {
  const [tableWidth, tableDepth] = TABLE_SIZE
  const legInset = 0.18

  return (
    <group position={[position[0], 0, position[1]]} rotation-y={rotationY}>
      <mesh position={[0, TABLE_TOP_Y, 0]} castShadow receiveShadow>
        <boxGeometry args={[tableWidth, 0.07, tableDepth]} />
        <meshStandardMaterial color="#3a2616" roughness={0.75} />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            position={[sx * (tableWidth / 2 - legInset), TABLE_TOP_Y / 2, sz * (tableDepth / 2 - legInset)]}
            castShadow
          >
            <boxGeometry args={[0.09, TABLE_TOP_Y, 0.09]} />
            <meshStandardMaterial color="#2b1a0e" roughness={0.85} />
          </mesh>
        ))
      )}
      {[-1, 1].map((side, i) => (
        <group key={side} position={[side * 0.12, 0, side * (tableDepth / 2 + 0.44)]} rotation-y={i === 0 ? 0.08 : -0.14}>
          <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[tableWidth * 0.78, 0.06, 0.3]} />
            <meshStandardMaterial color="#38240f" roughness={0.82} />
          </mesh>
          {[-1, 1].map((lx) => (
            <mesh key={lx} position={[lx * (tableWidth * 0.31), 0.21, 0]} castShadow>
              <boxGeometry args={[0.07, 0.42, 0.24]} />
              <meshStandardMaterial color="#2b1a0e" roughness={0.88} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
})
