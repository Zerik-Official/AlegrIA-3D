/**
 * Street-grid layout for Phase 2's expanded town — a plaza around the
 * parroquia with streets radiating out into a simple block grid.
 * @module features/phase2/config/phase2Streets
 */

/** One straight paved strip. */
export interface StreetSegment {
  /** World axis the strip runs along. */
  axis: 'x' | 'z'
  /** Offset along the cross axis (the street's centerline). */
  offset: number
  /** Strip length along its running axis. */
  length: number
}

/** Tunable dimensions and colors for {@link Phase2Streets}. */
export interface Phase2StreetsConfig {
  /** Road surface width (the darker paved band). */
  roadWidth: number
  /** Total width including both sidewalks (the lighter band under the road). */
  sidewalkWidth: number
  /** Side length of the square plaza the parroquia stands on. */
  plazaSize: number
  /** Road surface color. */
  roadColor: string
  /** Sidewalk color. */
  sidewalkColor: string
  /** Plaza pavement color. */
  plazaColor: string
  /** The grid itself — offsets are centered on the parroquia at the origin. */
  segments: StreetSegment[]
}

export const phase2StreetsConfig: Phase2StreetsConfig = {
  roadWidth: 4.4,
  sidewalkWidth: 6,
  plazaSize: 14,
  roadColor: '#7d7568',
  sidewalkColor: '#d9a878',
  plazaColor: '#8a8060',
  segments: [
    { axis: 'z', offset: -32, length: 84 },
    { axis: 'z', offset: -16, length: 84 },
    { axis: 'z', offset: 0, length: 84 },
    { axis: 'z', offset: 16, length: 84 },
    { axis: 'z', offset: 32, length: 84 },
    { axis: 'x', offset: -32, length: 84 },
    { axis: 'x', offset: -16, length: 84 },
    { axis: 'x', offset: 0, length: 84 },
    { axis: 'x', offset: 16, length: 84 },
    { axis: 'x', offset: 32, length: 84 },
  ],
}
