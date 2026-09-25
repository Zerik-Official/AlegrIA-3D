/**
 * Paleta "Futurismo Abajero 2050" — el rediseño de `cityIntro` de calle
 * cyberpunk genérica a futurismo caribeño / afrofuturismo patrimonial.
 *
 * Los tonos salen del sistema de diseño de AlegrIA (amarillo solar, azul
 * caribe, rojo picó/carnaval) más los neones de atardecer que dan la capa
 * "2050". Cualquier renderer de esta escena debe tomar sus colores de aquí
 * en vez de hardcodear hex, para que retocar la identidad de la fase sea un
 * solo archivo.
 * @module features/cityIntro/config/colorPalette
 */

/** Amarillo solar — molduras, bordillos, energía solar integrada. */
export const SOLAR_YELLOW = '#FFB703'
/** Azul caribe — fachadas frescas, vidrios, sombras de cielo. */
export const CARIBBEAN_BLUE = '#00B4D8'
/** Rojo carnaval / picó — fachadas festivas y acentos de tambora. */
export const CARNAVAL_RED = '#E63946'
/** Magenta neón — murales holográficos y luz de atardecer. */
export const NEON_MAGENTA = '#FF007F'

/** Verde flora del sistema de diseño — matarratón, robles, vegetación. */
export const FLORA_GREEN = '#1E8C86'
/** Amarillo de floración del roble amarillo (Tabebuia). */
export const ROBLE_BLOOM = '#F2C14E'
/** Ocre de fachada republicana desgastada. */
export const OCRE_TIERRA = '#D98E3C'
/** Teja de barro / ladrillo del barrio. */
export const TEJA_BARRO = '#A8452C'
/** Naranja de atardecer caribeño, en el horizonte del skybox. */
export const SUNSET_ORANGE = '#FF7A3C'
/** Púrpura profundo del cenit al caer la tarde. */
export const DUSK_PURPLE = '#2B0F4A'
/** Cian neón, contrapunto frío de los neones cálidos. */
export const NEON_CYAN = '#5AD8FF'
/** Fuego cálido de los faroles de La Guacherna. */
export const GUACHERNA_FIRE = '#FFD08A'

/**
 * Colores de fachada que rotan las casas neopatrimoniales cuando su entidad
 * JSON no trae `variant`. Orden pensado para que casas contiguas no repitan.
 */
export const FACADE_PALETTE = [SOLAR_YELLOW, CARIBBEAN_BLUE, CARNAVAL_RED, OCRE_TIERRA, FLORA_GREEN] as const

/** Neones que rotan en molduras/zócalos cuando la entidad no especifica uno. */
export const TRIM_PALETTE = [NEON_MAGENTA, NEON_CYAN, SOLAR_YELLOW] as const
