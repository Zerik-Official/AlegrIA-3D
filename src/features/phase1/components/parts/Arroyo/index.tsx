/**
 * Stylized, curving river. The banks are one continuous sloped surface per
 * side — ground level at the outer edge, rising to a crest, then dipping
 * back down to the water's edge — built by sweeping a cross-section profile
 * along the curve (`buildLoftGeometry`), so there's no gap or floating-platform
 * seam where it should blend into the surrounding ground. The animated,
 * noise-textured water (`ArroyoWater`) sits in the groove between the two
 * banks, and rocks/reeds scatter along the curved edge (`ArroyoBanks`).
 * @module features/phase1/components/parts/Arroyo
 */

import { memo, useMemo } from 'react'
import * as THREE from 'three'
import { createRiverCurve, buildLoftGeometry, sampleBankEdge, type CrossSectionPoint } from '@/features/phase1/components/parts/Arroyo/riverPath'
import { BankRocks, ReedLine } from '@/features/phase1/components/parts/Arroyo/ArroyoBanks'
import { ArroyoWater } from '@/features/phase1/components/parts/Arroyo/ArroyoWater'

/** Where each bank meets the surrounding ground (must be `y: 0` to blend seamlessly). */
const OUTER_HALF = 1.8
/** Bank crest — the highest point of each side, containing the water. */
const BANK_HALF = 1.0
const BANK_Y = 0.16
/** Water's edge, at the foot of the inward slope from the bank crest. */
const WATER_HALF = 0.7
const WATER_Y = 0.04
const WATER_WIDTH = WATER_HALF * 2

/**
 * One bank's cross-section: ground → up to the crest → down to the water's edge.
 * @param side - Which side of the centerline this bank is on
 * @returns Ordered cross-section stations
 */
function bankProfile(side: 1 | -1): CrossSectionPoint[] {
  return [
    { offset: side * OUTER_HALF, y: 0 },
    { offset: side * BANK_HALF, y: BANK_Y },
    { offset: side * WATER_HALF, y: WATER_Y },
  ]
}

/**
 * @returns Arroyo group
 */
export const Arroyo = memo(function Arroyo() {
  const curve = useMemo(() => createRiverCurve(), [])

  const leftBankGeometry = useMemo(() => buildLoftGeometry(curve, bankProfile(-1)), [curve])
  const rightBankGeometry = useMemo(() => buildLoftGeometry(curve, bankProfile(1)), [curve])

  const rockEdgePoints = useMemo(
    () => [...sampleBankEdge(curve, BANK_HALF, -1, 22), ...sampleBankEdge(curve, BANK_HALF, 1, 22)],
    [curve]
  )
  const reedEdgePoints = useMemo(
    () => [...sampleBankEdge(curve, BANK_HALF + 0.4, -1, 19), ...sampleBankEdge(curve, BANK_HALF + 0.4, 1, 19)],
    [curve]
  )
  const midStreamRocks = useMemo(() => sampleBankEdge(curve, 0, 1, 14), [curve])

  return (
    <group>
      <mesh geometry={leftBankGeometry} receiveShadow>
        <meshStandardMaterial color="#4a3a22" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rightBankGeometry} receiveShadow>
        <meshStandardMaterial color="#4a3a22" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      <BankRocks points={rockEdgePoints} y={BANK_Y} />
      <ReedLine points={reedEdgePoints} y={BANK_Y} />
      <BankRocks points={midStreamRocks} y={WATER_Y} />

      <ArroyoWater curve={curve} width={WATER_WIDTH} y={WATER_Y} />
    </group>
  )
})
