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
import { buildLoftGeometry, sampleBankEdge, type CrossSectionPoint } from '@/features/phase1/components/parts/Arroyo/riverPath'
import { BANK_LIP_HALF, BANK_LIP_Y, BANK_OUTER_HALF, BANK_OUTER_Y, BED_HALF, BED_Y, CENTER_Y, MAGDALENA_WATER_Y, WATER_HALF, WATER_WIDTH, buildMagdalenaCurve } from '@/features/phase1/config/magdalenaRiver'
import { BankRocks, ReedLine } from '@/features/phase1/components/parts/Arroyo/ArroyoBanks'
import { ArroyoWater } from '@/features/phase1/components/parts/Arroyo/ArroyoWater'

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
