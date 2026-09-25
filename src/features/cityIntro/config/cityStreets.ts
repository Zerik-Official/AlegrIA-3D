/**
 * The future city's street plan beyond the main avenue: the side street that
 * turns right in front of the aduana (the library), and the paved walks that
 * open from the avenue onto RIWI's building and the two screen buildings.
 * Kept as data so the scene's paving and the free-roam walkable areas are
 * derived from one source and can't drift apart.
 * @module features/cityIntro/config/cityStreets
 */

import type { Bounds } from '@/shared/types'

/** Half-width of the main avenue's asphalt, out to its yellow curb lines. */
export const AVENUE_CURB_X = 3.55
/** Outer edge of the main avenue's sidewalks. */
export const AVENUE_SIDEWALK_OUTER_X = 5.8
/** Width of every sidewalk strip. */
export const SIDEWALK_WIDTH = 2.4

/** The side street turning right in front of the aduana. */
export const SIDE_STREET = {
  /** Z of its centerline. */
  centerZ: -35.5,
  /** Half-width of its asphalt, out to its curb lines. */
  curbHalf: 3.6,
  /** X where it leaves the avenue and where it ends. */
  fromX: AVENUE_CURB_X,
  toX: 34,
  /** Z of the aduana's facade, which its south sidewalk runs up against. */
  southLimitZ: -40.6,
} as const

/** A paved walk from the avenue up to a building's front. */
export interface Plaza {
  /** Stable id. */
  id: string
  /** Walk area, `[minX, maxX, minZ, maxZ]`. */
  area: [number, number, number, number]
  /** Which side of the avenue it opens off (`-1` west, `1` east) — the neon guide lines run away from it. */
  side: -1 | 1
  /** Accent color of its guide lines. */
  accent: string
}

/**
 * The walks opened where houses used to hide the landmarks: the space left
 * between the remaining houses, from the avenue's sidewalk to each facade.
 */
export const PLAZAS: Plaza[] = [
  { id: 'plaza-riwi', area: [-12.8, -AVENUE_SIDEWALK_OUTER_X, 9.4, 20.6], side: -1, accent: '#a855ff' },
  { id: 'plaza-pantalla-oeste', area: [-13, -AVENUE_SIDEWALK_OUTER_X, -25, -1.2], side: -1, accent: '#00B4D8' },
  { id: 'plaza-pantalla-este', area: [AVENUE_SIDEWALK_OUTER_X, 13, 2.4, 14.6], side: 1, accent: '#FF007F' },
  { id: 'plaza-riwi-barranquilla', area: [19.5, 28.5, -30, -19.5], side: 1, accent: '#a855ff' },
]

/** Player body radius kept clear of every walkable edge. */
const EDGE = 0.4

/**
 * @param area - `[minX, maxX, minZ, maxZ]`
 * @returns The area shrunk by the player's body radius, as movement bounds
 */
function inset([minX, maxX, minZ, maxZ]: [number, number, number, number]): Bounds {
  return { minX: minX + EDGE, maxX: maxX - EDGE, minZ: minZ + EDGE, maxZ: maxZ - EDGE }
}

/**
 * Where the player may walk once the finale hands over to free roaming: the
 * avenue up to the aduana's steps, the side street in front of it, and the
 * three plazas. Overlapping rectangles — the player may stand anywhere inside
 * at least one of them.
 */
export const CITY_WALKABLE_AREAS: Bounds[] = [
  inset([-AVENUE_SIDEWALK_OUTER_X - 0.4, AVENUE_SIDEWALK_OUTER_X + 0.4, SIDE_STREET.southLimitZ, 30.4]),
  inset([AVENUE_CURB_X, SIDE_STREET.toX + SIDEWALK_WIDTH, SIDE_STREET.southLimitZ, SIDE_STREET.centerZ + SIDE_STREET.curbHalf + SIDEWALK_WIDTH]),
  ...PLAZAS.map((plaza) => inset([plaza.area[0] - (plaza.side < 0 ? 0 : 0.6), plaza.area[1] + (plaza.side < 0 ? 0.6 : 0), plaza.area[2], plaza.area[3]])),
]

/**
 * Stretches of the city kept free of background skyline filler, as
 * `[minX, maxX, minZ, maxZ]` — the side street must end in open air rather
 * than run into a filler block.
 */
export const FILLER_CLEAR_ZONES: Array<[number, number, number, number]> = [[15, 42, -46, -18]]
