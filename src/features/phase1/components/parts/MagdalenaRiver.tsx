/**
 * The Río Magdalena — a big, mostly-straight river along the east edge of
 * the map. Built the same way as the old small arroyo (`Arroyo/`, now
 * retired): a continuous sloped-bank surface per side swept along a curve
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

/** `[x, z]` control points — a gentle meander running north-south along the map's east edge. */
const CONTROL_POINTS: Array<[number, number]> = [
  [27, -58],
  [24.5, -34],
  [28, -12],
  [25, 10],
  [29.5, 32],
  [26, 58],
]

/** Water's edge, shared by both bank profiles so the water ribbon meets each bank with no gap. */
const WATER_HALF = 9
const WATER_WIDTH = WATER_HALF * 2

/** Town (west) side — the steep bluff the port/station/boardwalk sit on top of. */
const TOWN_CREST_HALF = WATER_HALF + 2.5
const TOWN_OUTER_HALF = TOWN_CREST_HALF + 3
const TOWN_CREST_Y = 2.0

/** Far (east) side — a low sandbar, nothing built there. */
const FAR_CREST_HALF = WATER_HALF + 3.5
const FAR_OUTER_HALF = FAR_CREST_HALF + 3.5
const FAR_CREST_Y = 0.5

/**
 * @param side - Which side of the centerline (`1` = west/town, `-1` = east/far, given the curve's heading)
 * @returns Ordered cross-section stations: ground → bank crest → water's edge
 */
function bankProfile(side: 1 | -1): CrossSectionPoint[] {
  const [crestHalf, outerHalf, crestY] = side === 1 ? [TOWN_CREST_HALF, TOWN_OUTER_HALF, TOWN_CREST_Y] : [FAR_CREST_HALF, FAR_OUTER_HALF, FAR_CREST_Y]
  return [
    { offset: side * outerHalf, y: 0 },
    { offset: side * crestHalf, y: crestY },
    { offset: side * WATER_HALF, y: 0 },
  ]
}

/**
 * @returns Río Magdalena group
 */
export const MagdalenaRiver = memo(function MagdalenaRiver() {
  const curve = useMemo(() => buildRiverCurve(CONTROL_POINTS), [])

  const townBankGeometry = useMemo(() => buildLoftGeometry(curve, bankProfile(1), 96), [curve])
  const farBankGeometry = useMemo(() => buildLoftGeometry(curve, bankProfile(-1), 96), [curve])

  const rockEdgePoints = useMemo(
    () => [...sampleBankEdge(curve, WATER_HALF, 1, 34), ...sampleBankEdge(curve, WATER_HALF, -1, 34)],
    [curve]
  )
  const reedEdgePoints = useMemo(() => sampleBankEdge(curve, WATER_HALF + 0.6, -1, 28), [curve])
  const midStreamRocks = useMemo(() => sampleBankEdge(curve, WATER_HALF * 0.55, 1, 10), [curve])

  return (
    <group>
      <mesh geometry={townBankGeometry} receiveShadow>
        <meshStandardMaterial color="#5a4326" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={farBankGeometry} receiveShadow>
        <meshStandardMaterial color="#4a3a22" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <BankRocks points={rockEdgePoints} y={0.02} />
      <ReedLine points={reedEdgePoints} y={0.02} />
      <BankRocks points={midStreamRocks} y={0} />

      <ArroyoWater curve={curve} width={WATER_WIDTH} y={0} />
    </group>
  )
})

/** West-most X the town bluff blends into flat ground at, for laying out plaza content clear of the slope. */
export const MAGDALENA_TOWN_EDGE_X = CONTROL_POINTS[0][0] - TOWN_OUTER_HALF
