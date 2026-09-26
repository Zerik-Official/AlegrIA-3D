/**
 * "Futurismo Abajero 2050" Palette — the redesign of `cityIntro` from a
 * generic cyberpunk street to Caribbean futurism / heritage Afrofuturism.
 *
 * The shades originate from the AlegrIA design system (solar yellow,
 * Caribbean blue, Carnival/picó red) plus sunset neons that provide the "2050" layer.
 * Any renderer for this scene must derive its colors from here instead of hardcoding
 * hex values, so tweaking the phase identity requires editing only a single file.
 * @module features/cityIntro/config/colorPalette
 */

/** Solar yellow — moldings, curbs, integrated solar energy. */
export const SOLAR_YELLOW = '#FFB703'
/** Caribbean blue — fresh facades, glass, sky shadows. */
export const CARIBBEAN_BLUE = '#00B4D8'
/** Carnival / picó red — festive facades and tambora accents. */
export const CARNAVAL_RED = '#E63946'
/** Neon magenta — holographic murals and sunset glow. */
export const NEON_MAGENTA = '#FF007F'

/** System design flora green — matarratón, oaks, vegetation. */
export const FLORA_GREEN = '#1E8C86'
/** Blooming yellow of the yellow oak (Tabebuia). */
export const ROBLE_BLOOM = '#F2C14E'
/** Ochre from weathered Republican facades. */
export const OCRE_TIERRA = '#D98E3C'
/** Roof tile / neighborhood brick red. */
export const TEJA_BARRO = '#A8452C'
/** Caribbean sunset orange, for the skybox horizon. */
export const SUNSET_ORANGE = '#FF7A3C'
/** Deep purple of the zenith at dusk. */
export const DUSK_PURPLE = '#2B0F4A'
/** Neon cyan, a cool counterpoint to warm neons. */
export const NEON_CYAN = '#5AD8FF'
/** Warm fire glow of La Guacherna lanterns. */
export const GUACHERNA_FIRE = '#FFD08A'

/**
 * Facade colors rotated by neo-heritage houses when their JSON entity
 * lacks a `variant`. Ordered so adjacent houses do not repeat colors.
 */
export const FACADE_PALETTE = [SOLAR_YELLOW, CARIBBEAN_BLUE, CARNAVAL_RED, OCRE_TIERRA, FLORA_GREEN] as const

/** Neons that rotate on moldings/baseboards when the entity leaves them unspecified. */
export const TRIM_PALETTE = [NEON_MAGENTA, NEON_CYAN, SOLAR_YELLOW] as const