/**
 * Sepia photo configuration for Phase 1.
 * Replace `src` with real historical images; placeholders use sepia procedural fallback.
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
 * Placeholder sepia photos — swap `src` with real assets.
 * Positions are kept in open plaza, away from bahareque houses and arroyo at z≈-1.1.
 */
export const sepiaPhotos: SepiaPhotoConfig[] = [
  {
    id: 'photo-1857-declaratoria',
    src: `${base}images/placeholders/sepia-1857.jpg`,
    title: '1857 — Declaratoria de Ciudad',
    description: 'Barranquilla es elevada a ciudad. Primer trazo urbano cerca del Magdalena.',
    position: [-1.2, 1.85, 3.8],
    rotationY: 0.22,
  },
  {
    id: 'photo-aduana',
    src: `${base}images/placeholders/sepia-aduana.jpg`,
    title: 'Aduana y Puerto Fluvial',
    description: 'Auge portuario. Bodegas y muelles que dieron nombre a Barrio Abajo.',
    position: [1.6, 1.92, 4.4],
    rotationY: -0.18,
  },
  {
    id: 'photo-estacion-montoya',
    src: `${base}images/placeholders/sepia-montoya.jpg`,
    title: 'Estación Montoya',
    description: 'Nodo ferroviario y comercial. Llegada de inmigrantes y mercancías.',
    position: [0.2, 2.05, 5.8],
    rotationY: 0.08,
  },
  {
    id: 'photo-pasaje-chinos',
    src: `${base}images/placeholders/sepia-pasaje.jpg`,
    title: 'Pasaje de los Chinos',
    description: 'Pasajes de inmigración con vivienda colectiva y comercio.',
    position: [-3.2, 1.78, 6.8],
    rotationY: 0.42,
  },
  {
    id: 'photo-andenes-altos',
    src: `${base}images/placeholders/sepia-andenes.jpg`,
    title: 'Andenes Altos',
    description: 'Arquitectura vernácula elevada para resistir los arroyos.',
    position: [3.4, 1.78, 7.2],
    rotationY: -0.32,
  },
  {
    id: 'photo-bahareque',
    src: `${base}images/placeholders/sepia-bahareque.jpg`,
    title: 'Bahareque — Tierra y Troncos',
    description: 'Muros de barro y entramado de madera, fresca y sismorresistente.',
    position: [0, 2.18, -4.2],
    rotationY: 0.02,
  },
]
