/**
 * Model registry for Blender-authored assets.
 * Replace any entry's `path` with your exported `.glb` to override the procedural fallback.
 * Export settings recommended: Blender -> File -> Export -> glTF 2.0 (.glb), Apply Modifiers, +Y Up.
 * @module shared/config/models
 * @link https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
 */

import cityIntroJson from '@/engine/config/cityIntro.json'
import phase2Json from '@/engine/config/phase2.json'
import { resolvePublicSrc } from '@/shared/utils/media'
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
  'phase1/sepia-photo': { path: `${base}models/phase1/sepia-photo.glb`, fallback: 'procedural-sepia-photo' },
  'phase1/portal': { path: `${base}models/phase1/portal.glb`, fallback: 'procedural-portal-phase1' },
  'phase1/houses/casa-tienda': { path: `${base}models/phase1/houses/barrio-abajo-casa-tienda.glb`, fallback: 'procedural-bahareque-house' },
  'phase1/houses/casa-corredor': { path: `${base}models/phase1/houses/barrio-abajo-casa-corredor.glb`, fallback: 'procedural-bahareque-house' },
  'phase1/houses/casa-patio': { path: `${base}models/phase1/houses/barrio-abajo-casa-patio.glb`, fallback: 'procedural-bahareque-house' },
  'phase1/floors/suelo-calle-tierra': { path: `${base}models/phase1/floors/barrio-abajo-suelo-calle-tierra.glb`, fallback: 'procedural-floor' },
  'phase1/floors/suelo-anden-alto': { path: `${base}models/phase1/floors/barrio-abajo-suelo-anden-alto.glb`, fallback: 'procedural-floor' },
  'phase1/floors/suelo-anden-escalon': { path: `${base}models/phase1/floors/barrio-abajo-suelo-anden-escalon.glb`, fallback: 'procedural-floor' },
  'phase1/floors/suelo-empedrado': { path: `${base}models/phase1/floors/barrio-abajo-suelo-empedrado.glb`, fallback: 'procedural-floor' },
  'phase1/decorators/cerca-cana': { path: `${base}models/phase1/decorators/barrio-abajo-cerca-cana.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/arbol-matarraton': { path: `${base}models/phase1/decorators/barrio-abajo-arbol-matarraton.glb`, fallback: 'procedural-decoration' },
  'phase1/scenes/puerto-fluvial': { path: `${base}models/phase1/scenes/puerto-fluvial.glb`, fallback: 'procedural-scene' },
  'phase1/scenes/mini-puerto-barranquilla-1857': { path: `${base}models/phase1/scenes/mini-puerto-barranquilla-1857.glb`, fallback: 'procedural-scene' },
  'phase1/scenes/estacion-montoya': { path: `${base}models/phase1/scenes/estacion-montoya.glb`, fallback: 'procedural-scene' },
  'phase1/vehicles/tren-completo': { path: `${base}models/phase1/vehicles/tren-completo.glb`, fallback: 'procedural-train' },
  'phase1/vehicles/tren-locomotora': { path: `${base}models/phase1/vehicles/tren-locomotora.glb`, fallback: 'procedural-train' },
  'phase1/vehicles/tren-coche': { path: `${base}models/phase1/vehicles/tren-coche.glb`, fallback: 'procedural-train' },
  'phase1/vehicles/tren-vagon': { path: `${base}models/phase1/vehicles/tren-vagon.glb`, fallback: 'procedural-train' },
  'phase1/floors/rieles': { path: `${base}models/phase1/floors/rieles.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-recta': { path: `${base}models/phase1/floors/rieles-riel-recta.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-recta-media': { path: `${base}models/phase1/floors/rieles-riel-recta-media.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-recta-gastada': { path: `${base}models/phase1/floors/rieles-riel-recta-gastada.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-curva': { path: `${base}models/phase1/floors/rieles-riel-curva.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-curva-suave': { path: `${base}models/phase1/floors/rieles-riel-curva-suave.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-cruce': { path: `${base}models/phase1/floors/rieles-riel-cruce.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-desvio-der': { path: `${base}models/phase1/floors/rieles-riel-desvio-der.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-desvio-izq': { path: `${base}models/phase1/floors/rieles-riel-desvio-izq.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-paso-nivel': { path: `${base}models/phase1/floors/rieles-riel-paso-nivel.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-calle-recta': { path: `${base}models/phase1/floors/rieles-riel-calle-recta.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-calle-curva': { path: `${base}models/phase1/floors/rieles-riel-calle-curva.glb`, fallback: 'procedural-floor' },
  'phase1/floors/rieles-riel-tope': { path: `${base}models/phase1/floors/rieles-riel-tope.glb`, fallback: 'procedural-floor' },
  'phase1/decorators/decorativos-ancla': { path: `${base}models/phase1/decorators/decorativos-ancla.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-barril': { path: `${base}models/phase1/decorators/decorativos-barril.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-barriles-trio': { path: `${base}models/phase1/decorators/decorativos-barriles-trio.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-bote-canoa': { path: `${base}models/phase1/decorators/decorativos-bote-canoa.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-bote-chalupa': { path: `${base}models/phase1/decorators/decorativos-bote-chalupa.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-cajon-a': { path: `${base}models/phase1/decorators/decorativos-cajon-a.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-cajon-b': { path: `${base}models/phase1/decorators/decorativos-cajon-b.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-cajon-c': { path: `${base}models/phase1/decorators/decorativos-cajon-c.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-canasto': { path: `${base}models/phase1/decorators/decorativos-canasto.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-costal': { path: `${base}models/phase1/decorators/decorativos-costal.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-fardo': { path: `${base}models/phase1/decorators/decorativos-fardo.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-palma-coco': { path: `${base}models/phase1/decorators/decorativos-palma-coco.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-pila-cajas': { path: `${base}models/phase1/decorators/decorativos-pila-cajas.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-pila-costales': { path: `${base}models/phase1/decorators/decorativos-pila-costales.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-pila-tablones': { path: `${base}models/phase1/decorators/decorativos-pila-tablones.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-poste-amarre': { path: `${base}models/phase1/decorators/decorativos-poste-amarre.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-tarima': { path: `${base}models/phase1/decorators/decorativos-tarima.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-tinaja': { path: `${base}models/phase1/decorators/decorativos-tinaja.glb`, fallback: 'procedural-decoration' },
  'phase1/decorators/decorativos-vapor-fluvial': { path: `${base}models/phase1/decorators/decorativos-vapor-fluvial.glb`, fallback: 'procedural-decoration' },
  'phase2/facade': { path: `${base}models/phase2/facade.glb`, fallback: 'procedural-facade' },
  'phase2/temple': { path: `${base}models/phase2/temple.glb`, fallback: 'procedural-temple' },
  'phase2/parroquia': { path: `${base}models/phase2/parroquia-sagrado-jesus.glb`, fallback: 'procedural-parroquia' },
  'phase2/trinitaria': { path: `${base}models/phase2/trinitaria.glb`, fallback: 'procedural-trinitaria' },
  'phase2/portal': { path: `${base}models/phase2/portal.glb`, fallback: 'procedural-portal-phase2' },
  'phase2/bailarina-amarilla': { path: `${base}models/phase2/characters/bailarina-vestido-amarilla-puntos-blancos.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarina-azul': { path: `${base}models/phase2/characters/bailarina-vestido-azul-puntos-blancos.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarina-roja': { path: `${base}models/phase2/characters/bailarina-vestido-rojo-puntos-blancos.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarina-verde': { path: `${base}models/phase2/characters/bailarina-vestido-verde-puntos-blancos.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarin-blanco': { path: `${base}models/phase2/characters/bailarin-blanco-camisa.glb`, fallback: 'procedural-dancer' },
  'phase2/bailarin-blanco-azul': { path: `${base}models/phase2/characters/bailarin-blanco-azul-camisa.glb`, fallback: 'procedural-dancer' },
  'phase2/rey-momo': { path: `${base}models/phase2/characters/rey-momo-sombrero.glb`, fallback: 'procedural-dancer' },
  'phase2/congas-personaje': { path: `${base}models/phase2/characters/congas-personaje.glb`, fallback: 'procedural-dancer' },
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
  'cityIntro/tower-mesh': { path: `${base}models/cityIntro/torre-red-futurista.glb`, fallback: 'procedural-skyscraper' },
  'cityIntro/tower-needle': { path: `${base}models/cityIntro/torre-aguja-futurista.glb`, fallback: 'procedural-skyscraper' },
  'cityIntro/bench-neon': { path: `${base}models/cityIntro/banca-futurista-neon.glb`, fallback: 'procedural-skyscraper' },
  'cityIntro/planter-neon': { path: `${base}models/cityIntro/maceta-futurista-luces.glb`, fallback: 'procedural-skyscraper' },
  'cityIntro/screen-building': { path: `${base}models/cityIntro/edificio-pantalla-neon.glb`, fallback: 'procedural-skyscraper' },
  'cityIntro/skyscraper': { path: `${base}models/cityIntro/skyscraper.glb`, fallback: 'procedural-skyscraper' },
  'cityIntro/streetlight': { path: `${base}models/cityIntro/streetlight.glb`, fallback: 'procedural-streetlight' },
  'cityIntro/flying-car-retro': { path: `${base}models/cityIntro/flyning-retro-car.glb`, fallback: 'procedural-flying-car' },
  'cityIntro/flying-car-star': { path: `${base}models/cityIntro/star-car.glb`, fallback: 'procedural-flying-car' },
  'cityIntro/flying-car-classic': { path: `${base}models/cityIntro/toyota-corolla.glb`, fallback: 'procedural-flying-car' },
  'cityIntro/flying-train': { path: `${base}models/cityIntro/flying-train.glb`, fallback: 'procedural-flying-train' },
  'cityIntro/moon': { path: `${base}models/cityIntro/moon.glb`, fallback: 'procedural-moon' },
  'cityIntro/library-facade': { path: `${base}models/cityIntro/aduana-barranquilla.glb`, fallback: 'procedural-library-facade' },
  'cityIntro/planet': { path: `${base}models/cityIntro/planet.glb`, fallback: 'procedural-planet' },
  'cityIntro/riwi-barranquilla': { path: `${base}models/future/scenes/riwi-barranquilla.glb`, fallback: 'procedural-riwi-building' },
  'cityIntro/ad-bus': { path: `${base}models/future/vehicles/bus-anuncio-una-pantalla.glb`, fallback: 'procedural-flying-car' },
  'cityIntro/riwi-building': { path: `${base}models/cityIntro/riwi-edificio-2050.glb`, fallback: 'procedural-riwi-building' },
  'cityIntro/ad-tower': { path: `${base}models/cityIntro/ad-tower.glb`, fallback: 'procedural-ad-tower' },
  'cityIntro/street-jukebox-car': { path: `${base}models/future/vehicles/riwi-carrosa-future.glb`, fallback: 'procedural-parade-vehicle' },
  'cityIntro/poderoso-premium': { path: `${base}models/future/decorators/poderoso-premium.glb`, fallback: 'procedural-decoration' },
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

/**
 * Every `videoSrc`/`videoSrcs` URL authored on `cityIntro.json` entities (the
 * screen-building billboards), resolved against the app base — used to warm
 * the browser's HTTP cache during the wormhole transition alongside
 * {@link cityIntroModelUrls}, so playback doesn't stall fetching video bytes
 * the moment the scene mounts.
 * @returns Resolved video URLs
 */
export function cityIntroVideoUrls(): string[] {
  return videoUrlsOf(cityIntroJson as Array<{ videoSrc?: string; videoSrcs?: string[] }>)
}

/**
 * Every `phase2/*` model URL in the registry — preloaded while the player
 * crosses Phase 1's portal, so Phase 2 doesn't stall parsing them on arrival.
 * @returns Model URLs
 */
export function phase2ModelUrls(): string[] {
  return Object.entries(modelRegistry)
    .filter(([key]) => key.startsWith('phase2/'))
    .map(([, entry]) => entry.path)
}

/**
 * Every `videoSrc`/`videoSrcs` URL authored on `phase2.json` entities (the
 * parade floats' screens), resolved against the app base — warmed alongside
 * {@link phase2ModelUrls}.
 * @returns Resolved video URLs
 */
export function phase2VideoUrls(): string[] {
  return videoUrlsOf(phase2Json as Array<{ videoSrc?: string; videoSrcs?: string[] }>)
}

/**
 * @param entities - Authored entities that may carry videos
 * @returns Their resolved, de-duplicated video URLs
 */
function videoUrlsOf(entities: Array<{ videoSrc?: string; videoSrcs?: string[] }>): string[] {
  const urls = new Set<string>()
  for (const entity of entities) {
    const single = resolvePublicSrc(entity.videoSrc)
    if (single) urls.add(single)
    for (const src of entity.videoSrcs ?? []) {
      const resolved = resolvePublicSrc(src)
      if (resolved) urls.add(resolved)
    }
  }
  return [...urls]
}