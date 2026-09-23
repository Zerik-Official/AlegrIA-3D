/**
 * Stylized, curving river — a sunken-looking but always above-ground-level
 * (see `BANK_Y`/`WATER_Y`) channel so the water reads as contained by its
 * banks instead of a flat sheet over the whole ground, carrying an animated,
 * noise-textured water surface (`ArroyoWater`), with rocky banks and reeds
 * scattered along its curved edge (`ArroyoBanks`).
 * @module features/phase1/components/parts/Arroyo
 */

import { memo, useMemo } from 'react'
import { createSoftCircleTexture } from '@/shared/utils/textures'
import { createRiverCurve, buildRibbonGeometry, sampleBankEdge } from '@/features/phase1/components/parts/Arroyo/riverPath'
import { BankRocks, ReedLine } from '@/features/phase1/components/parts/Arroyo/ArroyoBanks'
import { ArroyoWater } from '@/features/phase1/components/parts/Arroyo/ArroyoWater'

/** Muddy bank strip: half-width and height above the surrounding ground. */
const BANK_WIDTH = 2.0
const BANK_Y = 0.14
/** Water ribbon: narrower and a touch lower than the bank, so it reads as sitting in a shallow groove. */
const WATER_WIDTH = 1.4
const WATER_Y = 0.05
/** How far past the bank strip's edge the soft dirt-to-ground fade extends. */
const SHORE_FADE_WIDTH = BANK_WIDTH + 1.6

/**
 * @returns Arroyo group
 */
export const Arroyo = memo(function Arroyo() {
  const curve = useMemo(() => createRiverCurve(), [])
  const bankAlphaMap = useMemo(() => createSoftCircleTexture(), [])

  const bankGeometry = useMemo(() => buildRibbonGeometry(curve, BANK_WIDTH, BANK_Y), [curve])
  const shoreFadeGeometry = useMemo(() => buildRibbonGeometry(curve, SHORE_FADE_WIDTH, BANK_Y - 0.01), [curve])

  const rockEdgePoints = useMemo(
    () => [...sampleBankEdge(curve, BANK_WIDTH / 2, -1, 22), ...sampleBankEdge(curve, BANK_WIDTH / 2, 1, 22)],
    [curve]
  )
  const reedEdgePoints = useMemo(
    () => [...sampleBankEdge(curve, BANK_WIDTH / 2 + 0.5, -1, 19), ...sampleBankEdge(curve, BANK_WIDTH / 2 + 0.5, 1, 19)],
    [curve]
  )
  const midStreamRocks = useMemo(() => sampleBankEdge(curve, 0, 1, 14), [curve])

  return (
    <group>
      <mesh geometry={shoreFadeGeometry} receiveShadow>
        <meshStandardMaterial color="#5a4a2a" alphaMap={bankAlphaMap} transparent roughness={1} depthWrite={false} />
      </mesh>
      <mesh geometry={bankGeometry} receiveShadow>
        <meshStandardMaterial color="#4a3a22" roughness={1} />
      </mesh>

      <BankRocks points={rockEdgePoints} y={BANK_Y} />
      <ReedLine points={reedEdgePoints} />
      <BankRocks points={midStreamRocks} y={WATER_Y} />

      <ArroyoWater curve={curve} width={WATER_WIDTH} y={WATER_Y} />
    </group>
  )
})
