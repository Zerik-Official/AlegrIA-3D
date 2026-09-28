/**
 * The project's partners, shown on the start screen, in the credits and as
 * holograms in the future city.
 * @module shared/config/partners
 */

const base = import.meta.env.BASE_URL

/** One partner logo. */
export interface Partner {
  /** Partner name, used as alt text and tooltip. */
  name: string
  /** Logo URL. */
  src: string
  /** Whether the logo is a dark monochrome mark that must be turned white to read on dark backdrops. */
  invert?: boolean
}

export const PARTNERS: Partner[] = [
  { name: 'Alcaldía de Barranquilla', src: `${base}logos/alcaldia-brq.webp`, invert: true },
  { name: 'Barrio Abajo del Río Tour', src: `${base}logos/barrio-abajo-tour.webp` },
  { name: 'Riwi', src: `${base}logos/riwi-logo.webp` },
]
