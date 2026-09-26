/**
 * The team credits scene: where its door prompt sits on `cityIntro`'s RIWI
 * Barranquilla building, the room's layout, the orbiting camera's path
 * around Jafet, and the roll of names shown while "CREDITS-MUSIC.mp3" plays.
 * @module features/credits/config/creditsConfig
 */

import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'

/**
 * How far in front of the RIWI Barranquilla building (along its facing
 * direction) the door trigger — and its visible portal — sit. Out in the open
 * forecourt rather than tucked against the door, so the portal reads clearly
 * from a distance; the concert stage sits at the street's actual dead end
 * instead of camping here.
 */
const DOOR_OFFSET = 5.5

/**
 * World XZ of the credits door prompt — looked up once from the
 * `riwi-barranquilla` entity's own position/rotation in `cityIntro.json`, offset
 * along the direction its entrance faces, so it tracks the building instead of
 * a position hardcoded here going stale on the next redesign.
 */
export const CREDITS_DOOR_XZ: [number, number] = (() => {
  const building = initialCityIntroEntities.find((e) => e.type === 'riwi-barranquilla')
  if (!building) return [24, -26]
  const [x, , z] = building.position
  return [x + Math.sin(building.rotationY) * DOOR_OFFSET, z + Math.cos(building.rotationY) * DOOR_OFFSET]
})()

/** Distance within which the door prompt shows. */
export const CREDITS_DOOR_RANGE = 3.2

/** Height above the ground the visible credits portal is centered at. */
export const CREDITS_PORTAL_Y = 1.35
/** Visible credits portal's ring radius. */
export const CREDITS_PORTAL_RADIUS = 1.3
/** Visible credits portal's warm accent color (outer ring, halo, embers). */
export const CREDITS_PORTAL_ACCENT = '#ffd27a'
/** Visible credits portal's cool glow color (inner ring, vortex, ground light). */
export const CREDITS_PORTAL_GLOW = '#a855ff'

/** World point the credits scene's room is built around — between its two columns, where Jafet dances. */
export const CREDITS_CENTER: [number, number, number] = [0, 0, 0]
/** Height the orbiting camera looks at (roughly Jafet's chest/head). */
export const CREDITS_LOOK_HEIGHT = 1.35

/** Name floating over the dancer at the center of the credits room. */
export const CREDITS_DANCER_NAME = 'Jafet Torres Del Futuro'
/** Line that pops up next to the dancer every half minute. */
export const CREDITS_SHOUT_TEXT = 'Chicos, silencio porfaa'

/** Orbiting camera's distance from {@link CREDITS_CENTER}. */
export const CREDITS_CAMERA_RADIUS = 5.2
/** Orbiting camera's height off the floor. */
export const CREDITS_CAMERA_HEIGHT = 1.7
/** Seconds for one full orbit. */
export const CREDITS_ORBIT_PERIOD_S = 42

/** One credit entry. */
export interface CreditMember {
  name: string
  role?: string
  /** Extra effect behind the name's letters: `soundBars` pulses equalizer bars, like a volume meter. */
  effect?: 'soundBars'
}

/** One role section of the credits roll. */
export interface CreditSection {
  title: string
  members: CreditMember[]
}

/** Prefix of each section's title in the cinematic slam-in (`Equipo de Investigación`, ...). */
export const CREDITS_SECTION_PREFIX = 'Equipo de'

/** Heading shown above the roll. */
export const CREDITS_HEADING = 'Equipo Futuro Abajero'
/** Subheading introducing the member list. */
export const CREDITS_SUBHEADING = 'Integrantes'

/**
 * The team, by section — first announced one name at a time with the
 * cinematic slam-in (`CinematicCredits`), then shown in full in the roll,
 * typed on letter by letter.
 */
export const CREDITS_ROLL: CreditSection[] = [
  {
    title: 'Investigación',
    members: [
      { name: 'Alejandra Jiménez', role: 'Líder' },
      { name: 'Juan Esteban Bolívar' },
      { name: 'Jose Gutiérrez' },
      { name: 'Alfredo Arteta' },
    ],
  },
  {
    title: 'Desarrollo',
    members: [
      { name: 'José Nicolás Guarín', role: 'Líder' },
      { name: 'Sebastián Mendoza' },
      { name: 'Gustavo Guzmán' },
      { name: 'José Romero' },
    ],
  },
  {
    title: 'QA y visual',
    members: [
      { name: 'Jose Rangel', role: 'Líder' },
      { name: 'Saeb García' },
      { name: 'Leonardo Pérez' },
    ],
  },
  {
    title: 'Narración',
    members: [{ name: 'Jose Gutierrez' }],
  },
  {
    title: 'Producción',
    members: [{ name: 'Andrés Elles', role: 'Sonido ambiental', effect: 'soundBars' }],
  },
]

/** Credit for the background track, shown in the music box. */
export const CREDITS_MUSIC_BY = 'By Andrés Elles'

/** Role label that gets the special "leader" writing animation in the roll. */
export const CREDITS_LEADER_ROLE = 'Líder'

/** Heading of the book dedication panel, on the right side of the credits scene. */
export const CREDITS_BOOK_HEADING = 'El Libro de Rosa'
/** Line of the dedication panel that frames the whole experience. */
export const CREDITS_BOOK_QUOTE = 'Un barrio no se mide en calles, sino en las memorias de quienes lo habitan.'
/** Its body text — the in-game book's real-world source. */
export const CREDITS_BOOK_DEDICATION = 'Toda la investigación de esta experiencia está basada en el libro de'
/** The book's author, credited by name. */
export const CREDITS_BOOK_AUTHOR = 'Rosa A. Peñaranda Castillo'