/**
 * Floor plan of the abandoned library hall — where its shelving runs, which
 * shelves have gone over in the collapsed row, where the pendant lamps hang
 * and which of them still flicker.
 *
 * Kept as data rather than inline JSX. The colliders the player walks
 * against live in `engine/config/library.json` as `collider` entities.
 * @module features/library/config/libraryLayout
 */

/** Shared shelf dimensions — `Bookshelf`'s own defaults for height/depth. */
export const SHELF_HEIGHT = 3.2
export const SHELF_DEPTH = 0.45

/** Y the ceiling sits at, where every lamp cable and hanging sign is anchored. */
export const CEILING_Y = 5.2

/** Center of the portal to the `cityIntro` finale, standing in the back wall's alcove (it faces `+Z`, into the hall). */
export const LIBRARY_PORTAL_POSITION: [number, number, number] = [0, 1.55, -9.8]

/** Radius of the portal to the `cityIntro` finale. */
export const LIBRARY_PORTAL_RADIUS = 1.4

/** World position of the shelf slot the returned Libro de Rosa flies into — where its light burst erupts. */
export const BOOK_SHELF_SLOT: [number, number, number] = [-7.2, 1.6, -9.9]

/** One upright shelving unit. */
export interface ShelfPlacement {
  /** `[x, z]` floor position of the unit's center. */
  position: [number, number]
  /** Y rotation in radians — `0` runs the unit along X. */
  rotationY: number
  /** Unit width along its own run. */
  width: number
}

/**
 * Shelving pushed against the hall's walls. Deliberately leaves the back
 * wall's center clear: that alcove is where the portal to the finale opens,
 * lining up with `CyberWall`'s own missing panel.
 */
export const WALL_SHELVES: ShelfPlacement[] = [
  { position: [-7.2, -10.05], rotationY: 0, width: 5.2 },
  { position: [7.2, -10.05], rotationY: 0, width: 5.2 },
  { position: [-10.05, -6], rotationY: Math.PI / 2, width: 5 },
  { position: [-10.05, 0], rotationY: Math.PI / 2, width: 5 },
  { position: [-10.05, 6], rotationY: Math.PI / 2, width: 5 },
  { position: [10.05, -6], rotationY: -Math.PI / 2, width: 5 },
  { position: [10.05, 0], rotationY: -Math.PI / 2, width: 5 },
  { position: [10.05, 6], rotationY: -Math.PI / 2, width: 5 },
]

/**
 * Free-standing stacks forming four reading sections, split by a cross aisle
 * at `z ≈ 0` and set well clear of the pedestal so the ritual still reads from
 * anywhere in the room.
 */
export const AISLE_SHELVES: ShelfPlacement[] = [
  { position: [-6.4, -3.4], rotationY: Math.PI / 2, width: 4.4 },
  { position: [-6.4, 3.4], rotationY: Math.PI / 2, width: 4.4 },
  { position: [6.4, -3.4], rotationY: Math.PI / 2, width: 4.4 },
  { position: [6.4, 3.4], rotationY: Math.PI / 2, width: 4.4 },
]

/** One shelving unit caught mid-collapse in the toppled row. */
export interface ToppledShelfPlacement {
  /** `[x, z]` floor position of the unit's base. */
  position: [number, number]
  /** Y rotation in radians, aiming the direction the unit falls (its local `+Z`). */
  rotationY: number
  /** Lean away from upright, in radians — `0` is standing, `Math.PI / 2` is flat on its face. */
  tilt: number
  /** Unit width along its own run. */
  width: number
}

/**
 * A row of stacks that went over into each other like dominoes, running along
 * the hall's north side: flat at the far end, each one propped a little higher
 * against the next, the last still barely leaning.
 */
export const TOPPLED_SHELVES: ToppledShelfPlacement[] = [
  { position: [-1.6, 7.7], rotationY: -Math.PI / 2, tilt: 0.28, width: 3.4 },
  { position: [-3.1, 7.7], rotationY: -Math.PI / 2, tilt: 0.62, width: 3.4 },
  { position: [-4.6, 7.7], rotationY: -Math.PI / 2, tilt: 0.95, width: 3.4 },
  { position: [-6.1, 7.7], rotationY: -Math.PI / 2, tilt: 1.24, width: 3.4 },
  { position: [-7.6, 7.7], rotationY: -Math.PI / 2, tilt: 1.52, width: 3.4 },
]

/** A reading table with its pair of benches. */
export interface ReadingTablePlacement {
  /** `[x, z]` floor position of the table's center. */
  position: [number, number]
  /** Y rotation in radians. */
  rotationY: number
}

/** Long reading tables left behind in the side sections. */
export const READING_TABLES: ReadingTablePlacement[] = [
  { position: [-3.2, -6.6], rotationY: 0.12 },
  { position: [3.6, 6.4], rotationY: -0.28 },
]

/**
 * The restored library's reading tables: the originals, plus one set where the
 * toppled row used to lie, now a quiet reading corner.
 */
export const RESTORED_READING_TABLES: ReadingTablePlacement[] = [...READING_TABLES, { position: [-4.6, 7.4], rotationY: 0 }]

/** `[x, z]` floor positions of the restored library's flowering planters: flanking the portal's arch and the entrance. */
export const RESTORED_PLANTERS: Array<[number, number]> = [
  [-2.9, -9.9],
  [2.9, -9.9],
  [-2.9, 10.1],
  [2.9, 10.1],
]

/** Table top surface height, and the footprint its collider covers. */
export const TABLE_TOP_Y = 0.78
export const TABLE_SIZE: [number, number] = [2.4, 1.15]

/** A section placard hanging over an aisle. */
export interface SectionSignPlacement {
  /** `[x, z]` floor position the sign hangs above. */
  position: [number, number]
  /** Y rotation in radians. */
  rotationY: number
  /** Label painted on the placard. */
  label: string
}

/** Section placards, naming each quadrant of the hall. */
export const SECTION_SIGNS: SectionSignPlacement[] = [
  { position: [-6.4, -7.2], rotationY: 0, label: 'HISTORIA' },
  { position: [6.4, -7.2], rotationY: 0, label: 'CIENCIAS' },
  { position: [-6.4, 0], rotationY: Math.PI / 2, label: 'ARCHIVO' },
  { position: [6.4, 0], rotationY: -Math.PI / 2, label: 'LITERATURA' },
]

/** One hanging cone lamp. */
export interface LampPlacement {
  /** `[x, z]` floor position the lamp hangs above. */
  position: [number, number]
  /** Length of cable from the ceiling down to the shade. */
  drop: number
  /** Whether this lamp's ballast is failing and it stutters every few seconds. */
  flicker: boolean
}

/**
 * Cone lamps on their cables. Only three of the eight still stutter — a hall
 * where every fixture flickered at once would read as a strobe effect rather
 * than as failing wiring.
 */
export const LAMPS: LampPlacement[] = [
  { position: [-6.4, -6.4], drop: 1.7, flicker: false },
  { position: [6.4, -6.4], drop: 1.5, flicker: true },
  { position: [-6.4, 6.4], drop: 1.6, flicker: true },
  { position: [6.4, 6.4], drop: 1.8, flicker: false },
  { position: [0, -7.6], drop: 2.1, flicker: false },
  { position: [0, 7.6], drop: 1.9, flicker: true },
  { position: [-8.8, 0], drop: 1.5, flicker: false },
  { position: [8.8, 0], drop: 1.6, flicker: false },
]
