/**
 * Geometry of the Río Magdalena: its meandering centerline, cross-section
 * heights and the band of ground it owns, shared by the river itself
 * (`MagdalenaRiver`), the terrain around it and the boats that follow it.
 * @module features/phase1/config/magdalenaRiver
 */

import type * as THREE from 'three'
import { buildRiverCurve } from '@/features/phase1/components/parts/Arroyo/riverPath'

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
export const WATER_HALF = 10
export const WATER_WIDTH = WATER_HALF * 2

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
export const BANK_OUTER_HALF = 20
export const BANK_LIP_HALF = 15
export const BED_HALF = 4.5
export const BANK_OUTER_Y = -0.03
export const BANK_LIP_Y = -0.35
export const BED_Y = -2.15
export const CENTER_Y = -2.35

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