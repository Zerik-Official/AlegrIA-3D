/**
 * The Libro de Rosa on display in the restored library: the book itself on
 * a table under the skylight where the pedestal used to stand, and one page
 * per table in a ring around it.
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
  /** What floats over the table: a page sheet showing the scan, or the closed book itself. */
  display: 'page' | 'book'
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

/** The book at the center, then the six pages in reading order around the ring. */
export const BOOK_PAGES: BookPage[] = [
  {
    id: 'book-rosa-0',
    src: `${base}images/book-rosa/Book-rosa-0.jpg`,
    title: 'El Libro de Rosa — Historia del Barrio Abajo',
    table: [0, 0],
    display: 'book',
  },
  ...RING_ANGLES_DEG.map((deg, i): BookPage => {
    const a = (deg * Math.PI) / 180
    return {
      id: `book-rosa-${i + 1}`,
      src: `${base}images/book-rosa/Book-rosa-${i + 1}.jpg`,
      title: `El Libro de Rosa — Página ${i + 1}`,
      table: [Math.round(Math.sin(a) * RING_RADIUS * 100) / 100, Math.round(Math.cos(a) * RING_RADIUS * 100) / 100],
      display: 'page',
    }
  }),
]
