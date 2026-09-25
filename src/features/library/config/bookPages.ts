/**
 * The Libro de Rosa's pages on display in the restored library: one per
 * table, set in a ring around the skylight where the pedestal used to stand.
 * @module features/library/config/bookPages
 */

const base = import.meta.env.BASE_URL

/** One page of the Libro de Rosa on display. */
export interface BookPage {
  /** Stable id. */
  id: string
  /** Full-resolution scan, shown in the page modal. */
  src: string
  /** Caption. */
  title: string
  /** `[x, z]` floor position of the table the page floats over. */
  table: [number, number]
}

/** Distance from the hall's center to each display table. */
const RING_RADIUS = 4.2
/**
 * Angles (clockwise from `+Z`, the entrance side) of the six tables — the
 * ring skips straight ahead and straight behind, keeping the walk from the
 * entrance to the center and on to the portal clear.
 */
const RING_ANGLES_DEG = [45, 90, 135, 225, 270, 315]

/** Height of a display table's top. */
export const PAGE_TABLE_TOP_Y = 0.92
/** Height the pages float at, around eye level. */
export const PAGE_FLOAT_Y = 1.72
/** Side of the square collider around each round table. */
export const PAGE_TABLE_FOOTPRINT = 1.1

/** The six pages, in reading order around the ring. */
export const BOOK_PAGES: BookPage[] = RING_ANGLES_DEG.map((deg, i) => {
  const a = (deg * Math.PI) / 180
  return {
    id: `book-rosa-${i + 1}`,
    src: `${base}images/book-rosa/Book-rosa-${i + 1}.jpg`,
    title: `El Libro de Rosa — Página ${i + 1}`,
    table: [Math.round(Math.sin(a) * RING_RADIUS * 100) / 100, Math.round(Math.cos(a) * RING_RADIUS * 100) / 100],
  }
})
