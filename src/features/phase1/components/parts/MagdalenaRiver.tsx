/**
 * The Río Magdalena — a big, curving river along the east edge of the map.
 * Built the same way as the old small arroyo (`Arroyo/`, now retired): a
 * continuous sloped-bank surface per side swept along a curve
 * (`buildLoftGeometry`) so there's no gap where it blends into the ground,
 * animated water in the channel (`ArroyoWater`, same stylized shader,
 * untouched), and rocks/reeds along the curved edge (`ArroyoBanks`).
 *
 * The channel is cut down into the terrain rather than being fenced in by
 * raised banks: the surrounding ground stays flat at `y = 0` and the water sits
 * {@link MAGDALENA_WATER_Y} below it, so the river is visible from anywhere
 * near it instead of being hidden behind its own bluff. Ground layout around
 * the channel keys off {@link MAGDALENA_CORRIDOR}.
 * @module features/phase1/components/parts/MagdalenaRiver
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { buildRiverCurve, buildLoftGeometry, sampleBankEdge, type CrossSectionPoint } from '@/features/phase1/components/parts/Arroyo/riverPath'
import { BankRocks, ReedLine } from '@/features/phase1/components/parts/Arroyo/ArroyoBanks'
import { ArroyoWater } from '@/features/phase1/components/parts/Arroyo/ArroyoWater'

/**
 * `[x, z]` control points — a long, gently sinuous meander running
 * north-south along the map's east edge.
 */
export const MAGDALENA_CONTROL_POINTS: Array<[number, number]> = [
  [78, -95],
  [72, -68],
  [80, -42],
  [74, -16],
  [82, 8],
  [75, 32],
  [81, 58],
  [76, 82],
  [79, 95],
]

/** Water's edge, shared by both bank profiles so the water ribbon meets each bank with no gap. */
const WATER_HALF = 10
const WATER_WIDTH = WATER_HALF * 2

/**
 * Water surface height. The channel is cut *below* the surrounding terrain
 * rather than being walled in by raised banks: a bluff tall enough to read as
 * a riverbank also hides the water from anyone walking the town, and putting
 * the water a metre and a half down means the player looks into the river from
 * anywhere near it. It also leaves nothing coplanar with the ground planes,
 * which is what made the surface flicker in and out.
 */
export const MAGDALENA_WATER_Y = -1.55

/** Cross-section stations, from the surrounding ground down to the channel bed. */
const BANK_OUTER_HALF = 20
const BANK_LIP_HALF = 15
const BED_HALF = 4.5
const BANK_OUTER_Y = -0.03
const BANK_LIP_Y = -0.35
const BED_Y = -2.15
const CENTER_Y = -2.35

/** Slack for the Catmull-Rom curve overshooting its control points on the bends. */
const CURVE_MARGIN = 2

const CONTROL_X = MAGDALENA_CONTROL_POINTS.map(([x]) => x)
const CONTROL_Z = MAGDALENA_CONTROL_POINTS.map(([, z]) => z)
const CURVE_MIN_X = Math.min(...CONTROL_X) - CURVE_MARGIN
const CURVE_MAX_X = Math.max(...CONTROL_X) + CURVE_MARGIN

/**
 * The band of ground the river owns, for whoever lays out the terrain around
 * it (`Phase1Scene`'s ground planes, `Phase1Backdrop`'s hills).
 *
 * Its edges are pulled in to where the meandering bank is guaranteed to reach
 * at *every* point along the curve — `westX` is the furthest east the west
 * bank's outer edge ever gets, and vice versa — so a straight-edged ground
 * plane stopping there is always met by the bank loft, and never leaves a hole
 * where the river bends away from it.
 */
export const MAGDALENA_CORRIDOR = {
  westX: CURVE_MAX_X - BANK_OUTER_HALF,
  eastX: CURVE_MIN_X + BANK_OUTER_HALF,
  minZ: Math.min(...CONTROL_Z),
  maxZ: Math.max(...CONTROL_Z),
}

/**
 * @returns Reusable Magdalena centerline curve, for anything that needs to
 * follow the river (e.g. `PuertoBoat`'s patrol path)
 */
export function buildMagdalenaCurve(): THREE.CatmullRomCurve3 {
  return buildRiverCurve(MAGDALENA_CONTROL_POINTS)
}

/**
 * One side's cross-section, from the flat ground it blends into, over the lip,
 * down past the waterline and on to the channel bed. Both sides run all the
 * way to the centerline (`offset: 0`), so together the two lofts close the bed
 * with no seam down the middle for the translucent water to show a hole through.
 * @param side - Which side of the centerline (`1` = west/town, `-1` = east/far, given the curve's heading)
 * @returns Ordered cross-section stations: ground → lip → waterline → bed
 */
function bankProfile(side: 1 | -1): CrossSectionPoint[] {
  return [
    { offset: side * BANK_OUTER_HALF, y: BANK_OUTER_Y },
    { offset: side * BANK_LIP_HALF, y: BANK_LIP_Y },
    { offset: side * WATER_HALF, y: MAGDALENA_WATER_Y },
    { offset: side * BED_HALF, y: BED_Y },
    { offset: 0, y: CENTER_Y },
  ]
}

/**
 * @returns Río Magdalena group
 */
export const MagdalenaRiver = memo(function MagdalenaRiver() {
  const curve = useMemo(() => buildMagdalenaCurve(), [])

  const townBankGeometry = useMemo(() => buildLoftGeometry(curve, bankProfile(1), 128), [curve])
  const farBankGeometry = useMemo(() => buildLoftGeometry(curve, bankProfile(-1), 128), [curve])

  const rockEdgePoints = useMemo(
    () => [...sampleBankEdge(curve, WATER_HALF, 1, 46), ...sampleBankEdge(curve, WATER_HALF, -1, 46)],
    [curve]
  )
  const reedEdgePoints = useMemo(() => sampleBankEdge(curve, WATER_HALF + 0.9, -1, 36), [curve])
  const midStreamRocks = useMemo(() => sampleBankEdge(curve, WATER_HALF * 0.62, 1, 14), [curve])

  return (
    <group>
      <mesh geometry={townBankGeometry} receiveShadow frustumCulled={false}>
        <meshStandardMaterial color="#5a4326" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={farBankGeometry} receiveShadow frustumCulled={false}>
        <meshStandardMaterial color="#4a3a22" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <BankRocks points={rockEdgePoints} y={MAGDALENA_WATER_Y} />
      <ReedLine points={reedEdgePoints} y={MAGDALENA_WATER_Y + 0.2} />
      <BankRocks points={midStreamRocks} y={MAGDALENA_WATER_Y - 0.45} />

      <ArroyoWater curve={curve} width={WATER_WIDTH} y={MAGDALENA_WATER_Y} />
    </group>
  )
})
