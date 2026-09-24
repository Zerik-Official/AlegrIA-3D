/**
 * The Río Magdalena — a big, curving river along the east edge of the map.
 * Built the same way as the old small arroyo (`Arroyo/`, now retired): a
 * continuous sloped-bank surface per side swept along a curve
 * (`buildLoftGeometry`) so there's no gap where it blends into the ground,
 * animated water in the channel (`ArroyoWater`, same stylized shader,
 * untouched), and rocks/reeds along the curved edge (`ArroyoBanks`). Unlike
 * the arroyo, the two banks are asymmetric: the town (west) side rises
 * steeply from the water — the bluff the port/station/boardwalk scenes sit
 * on top of — while the far (east) side is a low, gentle sandbar fading into
 * the backdrop, since nothing is built over there.
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

/** Town (west) side — the steep bluff the port/station/boardwalk sit on top of. */
const TOWN_CREST_HALF = WATER_HALF + 3
const TOWN_OUTER_HALF = TOWN_CREST_HALF + 3.5
const TOWN_CREST_Y = 2.0

/** Far (east) side — a low sandbar, nothing built there. */
const FAR_CREST_HALF = WATER_HALF + 3.5
const FAR_OUTER_HALF = FAR_CREST_HALF + 3.5
const FAR_CREST_Y = 0.5

/** West-most X the town bluff blends into flat ground at, for laying out plaza/port content clear of the slope. */
export const MAGDALENA_TOWN_EDGE_X = Math.min(...MAGDALENA_CONTROL_POINTS.map(([x]) => x)) - TOWN_OUTER_HALF

/**
 * @returns Reusable Magdalena centerline curve, for anything that needs to
 * follow the river (e.g. `PuertoBoat`'s patrol path)
 */
export function buildMagdalenaCurve(): THREE.CatmullRomCurve3 {
  return buildRiverCurve(MAGDALENA_CONTROL_POINTS)
}

/**
 * @param side - Which side of the centerline (`1` = west/town, `-1` = east/far, given the curve's heading)
 * @returns Ordered cross-section stations: ground → bank crest → water's edge
 */
function bankProfile(side: 1 | -1): CrossSectionPoint[] {
  const [crestHalf, outerHalf, crestY] = side === 1 ? [TOWN_CREST_HALF, TOWN_OUTER_HALF, TOWN_CREST_Y] : [FAR_CREST_HALF, FAR_OUTER_HALF, FAR_CREST_Y]
  return [
    { offset: side * outerHalf, y: 0 },
    { offset: side * crestHalf, y: crestY },
    { offset: side * WATER_HALF, y: 0.02 },
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
  const reedEdgePoints = useMemo(() => sampleBankEdge(curve, WATER_HALF + 0.6, -1, 36), [curve])
  const midStreamRocks = useMemo(() => sampleBankEdge(curve, WATER_HALF * 0.55, 1, 14), [curve])

  return (
    <group>
      <mesh geometry={townBankGeometry} receiveShadow frustumCulled={false}>
        <meshStandardMaterial color="#5a4326" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={farBankGeometry} receiveShadow frustumCulled={false}>
        <meshStandardMaterial color="#4a3a22" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <BankRocks points={rockEdgePoints} y={0.02} />
      <ReedLine points={reedEdgePoints} y={0.02} />
      <BankRocks points={midStreamRocks} y={0} />

      <ArroyoWater curve={curve} width={WATER_WIDTH} y={0} />
    </group>
  )
})
