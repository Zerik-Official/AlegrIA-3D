/**
 * "Baila la Calle 2050" — the street party along the future city's main
 * avenue: the beat everything moves to, where the crowd dances, where the
 * pennant strings, holograms and food stalls go, and the spots the crowd
 * keeps clear of (trees, sidewalk slabs, the parked bus, the stalls and the
 * walk's own corridor).
 * @module features/cityIntro/config/carnivalLayout
 */

import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'

/** Tempo of the party — crowd, pennants, lights and holograms all pulse on it. */
export const CARNIVAL_BPM = 112

/**
 * @param t - Elapsed seconds
 * @returns Beats elapsed, and a sharp `[0,1]` kick peaking on each beat
 */
export function beatAt(t: number): { beat: number; kick: number } {
  const beat = (t * CARNIVAL_BPM) / 60
  return { beat, kick: Math.pow(0.5 + 0.5 * Math.cos(beat * Math.PI * 2), 6) }
}

/** Carnival neon palette. */
export const CARNIVAL_NEON = ['#FFD60A', '#39FF88', '#2E9BFF', '#FF007F', '#FF7A00'] as const

/** Stretch of the avenue the party fills, as `[minX, maxX, minZ, maxZ]` — sidewalk to sidewalk, from the walk's start to the aduana. */
export const PARTY_AREA: [number, number, number, number] = [-5.5, 5.5, -38.5, 27]

/** How many dancers fill the avenue. */
export const CROWD_COUNT = 520
/** Half-width of the corridor kept free along the walk's path, so the camera never goes through anyone. */
export const WALK_CLEARANCE = 1.3

/** A food stall on the sidewalk, facing the avenue. */
export interface CarnivalStall {
  text: string
  color: string
  /** `[x, z]` of the stall's center. */
  position: [number, number]
  /** Sidewalk it stands on: `-1` west, `1` east. */
  side: -1 | 1
}

/** The stalls, set where the sidewalks are free of trees, slabs, plazas and the bus. */
export const CARNIVAL_STALLS: CarnivalStall[] = [
  { text: 'FRITOS 2050', color: '#FFB703', position: [-5.25, 26], side: -1 },
  { text: 'CHICHA NEÓN', color: '#FF007F', position: [5.25, 18], side: 1 },
  { text: 'RASPAO SOLAR', color: '#39FF88', position: [5.25, -28], side: 1 },
  { text: 'AREPA E’ HUEVO', color: '#FF9E3D', position: [-5.25, -35.5], side: -1 },
]
/** Stall footprint across and along the avenue. */
export const STALL_SIZE: [number, number] = [1.2, 2.7]

/** Pennant strings: the poles they hang from, their height and how often they cross the avenue. */
export const PENNANT_POLES = { x: 6.1, height: 5.4, fromZ: 26, toZ: -37, spacing: 4.4 }

/** A suspended hologram over the avenue. */
export interface CarnivalHologram {
  z: number
  side: -1 | 1
  /** Index into the hologram artworks. */
  art: number
}

/** The holograms, alternating sides up the avenue, above the pennant strings. */
export const CARNIVAL_HOLOGRAMS: CarnivalHologram[] = [
  { z: 20, side: -1, art: 0 },
  { z: 8, side: 1, art: 1 },
  { z: -4, side: -1, art: 2 },
  { z: -17, side: 1, art: 3 },
  { z: -30, side: -1, art: 1 },
]

/** An axis-aligned footprint, `[minX, maxX, minZ, maxZ]`. */
export type Footprint = [number, number, number, number]

/** Where the parked ad bus stands (it's rotated half a turn, so its footprint is symmetric). */
const bus = initialCityIntroEntities.find((e) => e.type === 'ad-bus')
/** Stretches of the east sidewalk where pennant poles can't stand: under the bus, and the side street's mouth. */
export const POLE_BLOCKED_EAST_Z: Array<[number, number]> = [
  ...(bus ? [[bus.position[2] - 7, bus.position[2] + 7] as [number, number]] : []),
  [-40, -31],
]

/**
 * Footprints the crowd keeps out of: the sidewalk slabs, the bus and the
 * stalls. Trees are circles (see {@link CROWD_BLOCKING_CIRCLES}).
 */
export const CROWD_BLOCKING_BOXES: Footprint[] = [
  ...initialCityIntroEntities
    .filter((e) => e.type === 'anden-bordillo')
    .map((e): Footprint => {
      const half = (Number.parseFloat(e.variant ?? '') || 6) / 2
      return [e.position[0] - 1.2, e.position[0] + 1.2, e.position[2] - half, e.position[2] + half]
    }),
  ...(bus ? [[bus.position[0] - 2.3, bus.position[0] + 2.3, bus.position[2] - 6.8, bus.position[2] + 6.8] as Footprint] : []),
  ...CARNIVAL_STALLS.map(({ position: [x, z] }): Footprint => [x - STALL_SIZE[0] / 2 - 0.4, x + STALL_SIZE[0] / 2 + 0.4, z - STALL_SIZE[1] / 2 - 0.4, z + STALL_SIZE[1] / 2 + 0.4]),
]

/** Circles the crowd keeps out of: the trees' trunks and canopies. */
export const CROWD_BLOCKING_CIRCLES: Array<{ x: number; z: number; radius: number }> = initialCityIntroEntities
  .filter((e) => e.type === 'roble-amarillo')
  .map((e) => ({ x: e.position[0], z: e.position[2], radius: 1.1 }))
