/**
 * Model registry for Blender-authored assets.
 * Replace any entry's `path` with your exported `.glb` to override the procedural fallback.
 * Export settings recommended: Blender -> File -> Export -> glTF 2.0 (.glb), Apply Modifiers, +Y Up.
 * @module shared/config/models
 * @link https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
 */

import type { ModelRegistry } from '@/shared/types'

/**
 * Default model registry.
 * Paths are resolved relative to the Vite `public/` folder (`/models/...`).
 * When a file is missing at `path`, the corresponding `fallback` procedural mesh is rendered.
 */
const base = import.meta.env.BASE_URL

export const modelRegistry: ModelRegistry = {
  'library/bookshelf': { path: `${base}models/library/bookshelf.glb`, fallback: 'procedural-bookshelf' },
  'library/scattered-book': { path: `${base}models/library/scattered-book.glb`, fallback: 'procedural-scattered-book' },
  'library/cyber-wall': { path: `${base}models/library/cyber-wall.glb`, fallback: 'procedural-cyber-wall' },
  'pedestal/base': { path: `${base}models/pedestal/pedestal.glb`, fallback: 'procedural-pedestal' },
  'pedestal/book': { path: `${base}models/pedestal/book.glb`, fallback: 'procedural-book' },
  'museum/pedestal': { path: `${base}models/museum/pedestal-display.glb`, fallback: 'procedural-museum-pedestal' },
  'museum/column': { path: `${base}models/museum/column.glb`, fallback: 'procedural-column' },
  'museum/painting-frame': { path: `${base}models/museum/painting-frame.glb`, fallback: 'procedural-painting' },
  'wormhole/portal': { path: `${base}models/wormhole/portal.glb`, fallback: 'procedural-portal' },
  'phase1/bahareque-house-short': { path: `${base}models/phase1/bahareque-house-short.glb`, fallback: 'procedural-bahareque-short' },
  'phase1/bahareque-house-medium': { path: `${base}models/phase1/bahareque-house-medium.glb`, fallback: 'procedural-bahareque-medium' },
  'phase1/bahareque-house-long': { path: `${base}models/phase1/bahareque-house-long.glb`, fallback: 'procedural-bahareque-long' },
  'phase1/bahareque-house': { path: `${base}models/phase1/bahareque-house.glb`, fallback: 'procedural-bahareque-house' },
  'phase1/anden-alto': { path: `${base}models/phase1/anden-alto.glb`, fallback: 'procedural-anden-alto' },
  'phase1/aduana': { path: `${base}models/phase1/aduana.glb`, fallback: 'procedural-aduana' },
  'phase1/estacion-montoya': { path: `${base}models/phase1/estacion-montoya.glb`, fallback: 'procedural-estacion' },
  'phase1/sepia-photo': { path: `${base}models/phase1/sepia-photo.glb`, fallback: 'procedural-sepia-photo' },
  'phase1/portal': { path: `${base}models/phase1/portal.glb`, fallback: 'procedural-portal-phase1' },
  'phase2/facade': { path: `${base}models/phase2/facade.glb`, fallback: 'procedural-facade' },
  'phase2/temple': { path: `${base}models/phase2/temple.glb`, fallback: 'procedural-temple' },
  'phase2/parroquia': { path: `${base}models/phase2/parroquia-sagrado-jesus.glb`, fallback: 'procedural-parroquia' },
  'phase2/trinitaria': { path: `${base}models/phase2/trinitaria.glb`, fallback: 'procedural-trinitaria' },
  'phase2/portal': { path: `${base}models/phase2/portal.glb`, fallback: 'procedural-portal-phase2' },
  'phase2/bailarina-amarilla': { path: `${base}models/phase2/bailarina-vestido-amarilla-puntos-blancos.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarina-azul': { path: `${base}models/phase2/bailarina-vestido-azul-puntos-blancos.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarina-roja': { path: `${base}models/phase2/bailarina-vestido-rojo-puntos-blancos.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarina-verde': { path: `${base}models/phase2/bailarina-vestido-verde-puntos-blancos.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarin-blanco': { path: `${base}models/phase2/bailarin-blanco-camisa.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarin-blanco-azul': { path: `${base}models/phase2/bailarin-blanco-azul-camisa.glb`, fallback: 'procedural-dancer' },
  'phase2/carrosa-riwi': { path: `${base}models/phase2/carrosa-azul-riwi.glb`, fallback: 'procedural-parade-vehicle' },
  'phase2/carrosa-marimonda': { path: `${base}models/phase2/carrosa-marimonda.glb`, fallback: 'procedural-parade-vehicle' },
  'phase2/chiva-rumbera': { path: `${base}models/phase2/chiva-rumbera.glb`, fallback: 'procedural-parade-vehicle' },
  'phase2/casa-carnavalera': { path: `${base}models/phase2/casa-carnavalera-marimonda.glb`, fallback: 'procedural-carnival-house' },
  'cityIntro/skyscraper': { path: `${base}models/cityIntro/skyscraper.glb`, fallback: 'procedural-skyscraper' },
  'cityIntro/streetlight': { path: `${base}models/cityIntro/streetlight.glb`, fallback: 'procedural-streetlight' },
  'cityIntro/flying-car-retro': { path: `${base}models/cityIntro/flyning-retro-car.glb`, fallback: 'procedural-flying-car' },
  'cityIntro/flying-car-star': { path: `${base}models/cityIntro/star-car.glb`, fallback: 'procedural-flying-car' },
  'cityIntro/flying-car-classic': { path: `${base}models/cityIntro/toyota-corolla.glb`, fallback: 'procedural-flying-car' },
  'cityIntro/flying-train': { path: `${base}models/cityIntro/flying-train.glb`, fallback: 'procedural-flying-train' },
  'cityIntro/moon': { path: `${base}models/cityIntro/moon.glb`, fallback: 'procedural-moon' },
  'cityIntro/library-facade': { path: `${base}models/cityIntro/aduana-barranquilla.glb`, fallback: 'procedural-library-facade' },
  'cityIntro/planet': { path: `${base}models/cityIntro/planet.glb`, fallback: 'procedural-planet' },
  'cityIntro/logo-tower': { path: `${base}models/cityIntro/logo-tower.glb`, fallback: 'procedural-logo-tower' },
  'cityIntro/ad-tower': { path: `${base}models/cityIntro/ad-tower.glb`, fallback: 'procedural-ad-tower' },
}

/**
 * Every `cityIntro/*` model URL in the registry, used to preload city-intro
 * assets while the launch spinner is showing (`usePhaseFlow`'s launch
 * effect) so the walk doesn't freeze mid-reveal parsing them. Includes
 * entries with no real `.glb` yet — their preload just resolves/404s fast.
 * @returns Model URLs
 */
export function cityIntroModelUrls(): string[] {
  return Object.entries(modelRegistry)
    .filter(([key]) => key.startsWith('cityIntro/'))
    .map(([, entry]) => entry.path)
}