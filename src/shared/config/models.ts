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
  'phase2/houses/casa-balcones-rojos': { path: `${base}models/phase2/houses/casa-balcones-rojos.glb`, fallback: 'procedural-house' },
  'phase2/houses/casa-cafe': { path: `${base}models/phase2/houses/casa-cafe.glb`, fallback: 'procedural-house' },
  'phase2/houses/casa-cyan': { path: `${base}models/phase2/houses/casa-cyan.glb`, fallback: 'procedural-house' },
  'phase2/houses/casa-marron-premium': { path: `${base}models/phase2/houses/casa-marron-premium.glb`, fallback: 'procedural-house' },
  'phase2/houses/casa-verde': { path: `${base}models/phase2/houses/casa-verde.glb`, fallback: 'procedural-house' },
  'phase2/houses/casa-celeste-l-teja': { path: `${base}models/phase2/houses/casa-celeste-l-teja.glb`, fallback: 'procedural-house' },
  'phase2/houses/casa-esquina-amarilla': { path: `${base}models/phase2/houses/casa-esquina-amarilla.glb`, fallback: 'procedural-house' },
  'phase2/houses/casa-olivo-portal-arcos': { path: `${base}models/phase2/houses/casa-olivo-portal-arcos.glb`, fallback: 'procedural-house' },
  'phase2/houses/casa-rosa-hastial': { path: `${base}models/phase2/houses/casa-rosa-hastial.glb`, fallback: 'procedural-house' },
  'phase2/houses/casita-coral-plana': { path: `${base}models/phase2/houses/casita-coral-plana.glb`, fallback: 'procedural-house' },
  'phase2/houses/puesto-fruteria': { path: `${base}models/phase2/houses/puesto-fruteria.glb`, fallback: 'procedural-house' },
  'phase2/decorations/carrito-frutas-1': { path: `${base}models/phase2/decorations/carrito-frutas-1.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/carrito-frutas-2': { path: `${base}models/phase2/decorations/carrito-frutas-2.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/carrito-frutas-3': { path: `${base}models/phase2/decorations/carrito-frutas-3.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/caja-limas-tomates': { path: `${base}models/phase2/decorations/decoracion-caja-limas-tomates.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/caja-mangos-papayas': { path: `${base}models/phase2/decorations/decoracion-caja-mangos-papayas.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/caja-naranjas': { path: `${base}models/phase2/decorations/decoracion-caja-naranjas.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/canasta-mixta': { path: `${base}models/phase2/decorations/decoracion-canasta-mixta.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/canasta-naranjas': { path: `${base}models/phase2/decorations/decoracion-canasta-naranjas.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/pila-cajas-pinas': { path: `${base}models/phase2/decorations/decoracion-pila-cajas-pinas.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/puestos': { path: `${base}models/phase2/decorations/decoracion-puestos.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/silla-banquito': { path: `${base}models/phase2/decorations/decoracion-silla-banquito.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/farol-calle': { path: `${base}models/phase2/decorations/farol-calle.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/mesa-corona': { path: `${base}models/phase2/decorations/mesa-corona.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/vitrina-super-fritos': { path: `${base}models/phase2/decorations/vitrina-super-fritos.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/el-poderoso': { path: `${base}models/phase2/decorations/el-poderoso.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/planta-flores-maceta': { path: `${base}models/phase2/decorations/planta-flores-maceta.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/planta-hojas-maceta': { path: `${base}models/phase2/decorations/planta-hojas-maceta.glb`, fallback: 'procedural-decoration' },
  'phase2/decorations/planta-palma-maceta': { path: `${base}models/phase2/decorations/planta-palma-maceta.glb`, fallback: 'procedural-decoration' },
  'phase2/floors/suelo-aceras-ladrillo': { path: `${base}models/phase2/floors/suelo-aceras-ladrillo.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-aceras-ladrillo-acera-curva-exterior': { path: `${base}models/phase2/floors/suelo-aceras-ladrillo-acera-curva-exterior.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-aceras-ladrillo-acera-curva-interior': { path: `${base}models/phase2/floors/suelo-aceras-ladrillo-acera-curva-interior.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-aceras-ladrillo-acera-esquina': { path: `${base}models/phase2/floors/suelo-aceras-ladrillo-acera-esquina.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-aceras-ladrillo-acera-recta': { path: `${base}models/phase2/floors/suelo-aceras-ladrillo-acera-recta.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-aceras-ladrillo-plataforma-casa': { path: `${base}models/phase2/floors/suelo-aceras-ladrillo-plataforma-casa.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-arena': { path: `${base}models/phase2/floors/suelo-arena.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-arena-arena-camino-curva': { path: `${base}models/phase2/floors/suelo-arena-arena-camino-curva.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-arena-arena-camino-recta': { path: `${base}models/phase2/floors/suelo-arena-arena-camino-recta.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-arena-arena-parche-redondo': { path: `${base}models/phase2/floors/suelo-arena-arena-parche-redondo.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-arena-arena-plana-a': { path: `${base}models/phase2/floors/suelo-arena-arena-plana-a.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-arena-arena-plana-b': { path: `${base}models/phase2/floors/suelo-arena-arena-plana-b.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-calles-adoquin': { path: `${base}models/phase2/floors/suelo-calles-adoquin.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-calles-adoquin-calle-cruce': { path: `${base}models/phase2/floors/suelo-calles-adoquin-calle-cruce.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-calles-adoquin-calle-curva': { path: `${base}models/phase2/floors/suelo-calles-adoquin-calle-curva.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-calles-adoquin-calle-plaza': { path: `${base}models/phase2/floors/suelo-calles-adoquin-calle-plaza.glb`, fallback: 'procedural-floor' },
  'phase2/floors/suelo-calles-adoquin-calle-recta': { path: `${base}models/phase2/floors/suelo-calles-adoquin-calle-recta.glb`, fallback: 'procedural-floor' },
  'phase2/scenes/plaza-baile-carnaval': { path: `${base}models/phase2/scenes/plaza-baile-carnaval.glb`, fallback: 'procedural-scene' },
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