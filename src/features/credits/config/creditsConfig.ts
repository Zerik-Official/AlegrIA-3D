/**
 * The team credits scene: where its door prompt sits on `cityIntro`'s RIWI
 * Barranquilla building, the room's layout, the orbiting camera's path
 * around Omar, and the roll of names shown while "CREDITS-MUSIC.mp3" plays.
 * @module features/credits/config/creditsConfig
 */

import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'

/**
 * How far in front of the RIWI Barranquilla building (along its facing
 * direction) the door trigger sits — close to the entrance itself, since the
 * street party ("El Poderoso Premium" and its dancers) moved down to the
 * street's actual dead end instead of camping right at the door.
 */
const DOOR_OFFSET = 3

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

/** World point the credits scene's room is built around — between its two columns, where Omar dances. */
export const CREDITS_CENTER: [number, number, number] = [0, 0, 0]
/** Height the orbiting camera looks at (roughly Omar's chest/head). */
export const CREDITS_LOOK_HEIGHT = 1.35

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
}

/** One role section of the credits roll. */
export interface CreditSection {
  title: string
  members: CreditMember[]
}

/** Heading shown above the roll. */
export const CREDITS_HEADING = 'Equipo Futuro Abajero'
/** Subheading introducing the member list. */
export const CREDITS_SUBHEADING = 'Integrantes'

/** The team, by section — shown in the credits roll, typed on letter by letter. */
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
    title: 'QA visual',
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
    members: [{ name: 'Andrés Elles', role: 'Sonido ambiental' }],
  },
]

/** Credit for the background track, shown in the music box. */
export const CREDITS_MUSIC_BY = 'By Andrés Elles'

/** Role label that gets the special "leader" writing animation in the roll. */
export const CREDITS_LEADER_ROLE = 'Líder'

/** Heading of the book dedication panel, on the right side of the credits scene. */
export const CREDITS_BOOK_HEADING = 'El Libro de Rosa'
/** Its body text — the in-game book's real-world source. */
export const CREDITS_BOOK_DEDICATION = 'Toda la investigación de esta experiencia está basada en el libro de'
/** The book's author, credited by name. */
export const CREDITS_BOOK_AUTHOR = 'Rosa A. Peñaranda Castillo'