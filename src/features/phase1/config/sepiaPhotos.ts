/**
 * Sepia photo configuration for Phase 1.
 * @module features/phase1/config/sepiaPhotos
 */

/**
 * Sepia photo entry.
 */
export interface SepiaPhotoConfig {
  /** Unique identifier. */
  id: string
  /** Image source under `public/` or remote URL. Use placeholder when empty. */
  src: string
  /** Title displayed in frame and modal. */
  title: string
  /** Short description for modal. */
  description: string
  /** World position of the floating frame. */
  position: [number, number, number]
  /** Y rotation in radians. */
  rotationY?: number
}

const base = import.meta.env.BASE_URL

/**
 * @param filename - Raw filename under `public/images/placeholders`
 * @returns URL-safe path, so spaces/accents in the original asset names still resolve
 */
function placeholder(filename: string): string {
  return `${base}images/placeholders/${encodeURIComponent(filename)}`
}

/**
 * Historical photos — one entry per real image under `public/images/placeholders`.
 * Positions are kept in open plaza, away from bahareque houses and arroyo at z≈-1.1.
 */
export const sepiaPhotos: SepiaPhotoConfig[] = [
  {
    id: 'photo-1857-declaratoria',
    src: placeholder('Declalatoria de la ciudad.jpg'),
    title: '1857 — Declaratoria de Ciudad',
    description: 'Barranquilla es elevada a ciudad. Primer trazo urbano cerca del Magdalena.',
    position: [-1.2, 1.85, 3.8],
    rotationY: 0.22,
  },
  {
    id: 'photo-aduana',
    src: placeholder('Aduana y puerto fluvial.png'),
    title: 'Aduana y Puerto Fluvial',
    description: 'Auge portuario. Bodegas y muelles que dieron nombre a Barrio Abajo.',
    position: [1.6, 1.92, 4.4],
    rotationY: -0.18,
  },
  {
    id: 'photo-estacion-montoya',
    src: placeholder('Estación montoya.png'),
    title: 'Estación Montoya',
    description: 'Nodo ferroviario y comercial. Llegada de inmigrantes y mercancías.',
    position: [0.2, 2.05, 5.8],
    rotationY: 0.08,
  },
  {
    id: 'photo-andenes-altos',
    src: placeholder('Andenes altos en abarrio abajo.png'),
    title: 'Andenes Altos',
    description: 'Arquitectura vernácula elevada para resistir los arroyos.',
    position: [3.4, 1.78, 7.2],
    rotationY: -0.32,
  },
]
