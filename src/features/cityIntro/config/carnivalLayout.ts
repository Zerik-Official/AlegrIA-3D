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

/** How many dancers fill the avenue — kept modest since only the ones in the camera's view get animated (see `CarnivalCrowd`), but all of them still draw. */
export const CROWD_COUNT = 260
/** Half-width of the corridor kept free along the walk's path, so the camera never goes through anyone. */
export const WALK_CLEARANCE = 1.3

/** Clothes in carnival colors, shared by every instanced crowd (the avenue and the local knots around the sound systems). */
export const CARNIVAL_CLOTHES = ['#FF007F', '#FFB703', '#00B4D8', '#39FF88', '#E63946', '#8A2BE2', '#FF7A00', '#1E8C86', '#F2C14E', '#FFFFFF']
/** Skin tones, shared the same way. */
export const CARNIVAL_SKIN = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#5c3317', '#a0522d']

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

/**
 * World XZ of the parked "street jukebox" carrosa (`street-jukebox-car`
 * entity) — looked up once from `cityIntro.json` so `CarnivalMusicSystem` and
 * the crowd layout can react to wherever it's actually placed instead of a
 * position hardcoded here going stale on the next redesign. Falls back to a
 * reasonable spot on the avenue if the entity is missing.
 */
export const STREET_JUKEBOX_CAR_XZ: [number, number] = (() => {
  const car = initialCityIntroEntities.find((e) => e.type === 'street-jukebox-car')
  return car ? [car.position[0], car.position[2]] : [-3.3, 7]
})()

/**
 * World XZ of "El Poderoso Premium" rig (`poderoso-premium` entity), parked
 * in front of RIWI's building on the side street by the aduana — looked up
 * the same way as {@link STREET_JUKEBOX_CAR_XZ}.
 */
export const PODEROSO_PREMIUM_XZ: [number, number] = (() => {
  const rig = initialCityIntroEntities.find((e) => e.type === 'poderoso-premium')
  return rig ? [rig.position[0], rig.position[2]] : [29, -36.5]
})()

/** Half-footprint of the parked street jukebox car, so the avenue crowd dances around it instead of through it. */
const CAR_HALF_FOOTPRINT: [number, number] = [2.2, 4.3]
CROWD_BLOCKING_BOXES.push([
  STREET_JUKEBOX_CAR_XZ[0] - CAR_HALF_FOOTPRINT[0],
  STREET_JUKEBOX_CAR_XZ[0] + CAR_HALF_FOOTPRINT[0],
  STREET_JUKEBOX_CAR_XZ[1] - CAR_HALF_FOOTPRINT[1],
  STREET_JUKEBOX_CAR_XZ[1] + CAR_HALF_FOOTPRINT[1],
])
