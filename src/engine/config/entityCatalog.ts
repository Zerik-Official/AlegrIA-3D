/**
 * Editor-facing catalog of the entity types each scene can contain.
 * This is the "possible elements of the scene" manifest: it drives the editor's
 * "Add element" menu so new elements are spawned with sensible defaults and never
 * require code changes — only an entry here plus a renderer in `engine/entityRegistry`.
 * @module engine/config/entityCatalog
 */

import type { EditableEntity } from '@/engine/types'

/** Scenes that own an editor instance (see `App.tsx`'s `useEditor` calls). */
export type SceneId = 'cityIntro' | 'library' | 'phase1' | 'phase2' | 'credits'

/**
 * One addable element: its renderer `type`, a human label for the editor UI,
 * which scene(s) it belongs to, and the entity fields it should start with.
 */
export interface EntityCatalogItem {
  /** Matches `EditableEntity.type` / `entityRegistry` key. */
  type: string
  /** Label shown in the editor's "Add element" dropdown. */
  label: string
  /** Scenes this element can be added to. */
  scenes: SceneId[]
  /** Fields merged onto a fresh entity (besides the generated `id` and `type`, which come from this item). */
  defaultEntity: Omit<EditableEntity, 'id' | 'type'>
}

/**
 * Full manifest of addable elements, grouped implicitly by `scenes`.
 * Add a row here to make a new element type available in the editor's Add menu.
 */
export const entityCatalog: EntityCatalogItem[] = [
  {
    type: 'path-point',
    label: 'Punto de Camino',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: '0' },
  },
  {
    type: 'neo-heritage-house',
    label: 'Casa neopatrimonial (abajera 2050)',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: '#FFB703', title: '#FF007F' },
  },
  {
    type: 'culture-mural',
    label: 'Mural cultural holográfico',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'marimonda', title: '#FFB703' },
  },
  {
    type: 'floating-farol',
    label: 'Farol flotante (La Guacherna)',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: '#FFD08A' },
  },
  {
    type: 'anden-bordillo',
    label: 'Andén con bordillo amarillo',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: '6' },
  },
  {
    type: 'roble-amarillo',
    label: 'Roble amarillo en flor',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: '#F2C14E' },
  },
  {
    type: 'skyscraper',
    label: 'Rascacielos',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: '#3a4a6a' },
  },
  {
    type: 'streetlight',
    label: 'Farola',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'flying-car',
    label: 'Auto Volador',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 6, 0], rotationY: 0, scale: 1, variant: '#ff6a3a' },
  },
  {
    type: 'flying-train',
    label: 'Tren Volador',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 9, 0], rotationY: 0, scale: 1, variant: '#7ad8ff' },
  },
  {
    type: 'flight-lane-point',
    label: 'Punto de Carril de Vuelo',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 8, 0], rotationY: 0, scale: 1, variant: 'nuevo-carril:0' },
  },
  {
    type: 'riwi-building',
    label: 'Edificio riwi 2050',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'riwi-barranquilla',
    label: 'Sede RIWI Barranquilla',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'ad-bus',
    label: 'Bus flotante con pantalla (video con sonido)',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, videoSrc: '/videos/future/barrio-abajo-tour.mp4' },
  },
  {
    type: 'street-jukebox-car',
    label: 'Carro-picó riwi (avenida)',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'poderoso-premium',
    label: 'El Poderoso Premium (picó)',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'mesh-tower',
    label: 'Torre de malla futurista',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'needle-tower',
    label: 'Torre aguja futurista',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'neon-bench',
    label: 'Banca neón',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'neon-planter',
    label: 'Maceta neón',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'screen-building',
    label: 'Edificio pantalla neón (video)',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 0.35, videoSrc: '/videos/cityIntro/first.mp4' },
  },
  {
    type: 'ad-tower',
    label: 'Torre de Pantallas',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: '#ff2a6d' },
  },
  {
    type: 'moon',
    label: 'Luna',
    scenes: ['cityIntro'],
    defaultEntity: { position: [-20, 26, -60], rotationY: 0, scale: 1 },
  },
  {
    type: 'planet',
    label: 'Planeta',
    scenes: ['cityIntro'],
    defaultEntity: { position: [45, 48, -100], rotationY: 0, scale: 4, variant: '#c9a877' },
  },
  {
    type: 'library-facade',
    label: 'Fachada de Biblioteca',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'cyber-wall',
    label: 'Muro Cyber',
    scenes: ['library'],
    defaultEntity: { position: [0, 2.6, -11], rotationY: 0, scale: 1, variant: '22x5.2' },
  },
  {
    type: 'bookshelf',
    label: 'Estantería',
    scenes: ['library'],
    defaultEntity: { position: [0, 1.6, -10.05], rotationY: 0, scale: 1, variant: '5.2' },
  },
  {
    type: 'pedestal',
    label: 'Pedestal',
    scenes: ['library'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'book',
    label: 'Libro Levitante',
    scenes: ['library'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'bahareque-house',
    label: 'Casa de Bahareque',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 0.62, variant: 'medium' },
  },
  {
    type: 'sepia-photo',
    label: 'Foto Sepia (Cartel)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 1.9, 0], rotationY: 0, scale: 1, imageSrc: '', title: '', description: '' },
  },
  {
    type: 'phase1-train',
    label: 'Tren Animado (ruedas + riel)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase1/vehicles/tren-completo' },
  },
  {
    type: 'phase1-floor',
    label: 'Suelo Phase1 (genérico)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase1/floors/rieles-riel-recta' },
  },
  {
    type: 'phase1-decoration',
    label: 'Decoración Phase1 (genérica)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase1/decorators/decorativos-barril' },
  },
  {
    type: 'phase1-scene',
    label: 'Escena Phase1',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase1/scenes/puerto-fluvial' },
  },
  {
    type: 'phase1-vehicle',
    label: 'Vehículo Phase1 (genérico)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase1/vehicles/tren-vagon' },
  },
  {
    type: 'phase1-model',
    label: 'Modelo Phase1 (cualquiera)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase1/decorators/decorativos-tinaja' },
  },
  {
    type: 'phase1/scenes/puerto-fluvial',
    label: 'Escena · Aduana / Puerto Fluvial',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/scenes/mini-puerto-barranquilla-1857',
    label: 'Escena · Mini Puerto (malecón + casas + escaleras)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/scenes/estacion-montoya',
    label: 'Escena · Estación Montoya (con andén y vía)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/vehicles/tren-completo',
    label: 'Tren · Completo (loco + coche + vagón)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/vehicles/tren-locomotora',
    label: 'Tren · Locomotora',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/vehicles/tren-coche',
    label: 'Tren · Coche de Pasajeros',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/vehicles/tren-vagon',
    label: 'Tren · Vagón de Carga',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-recta',
    label: 'Riel · Recta (8m)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-recta-media',
    label: 'Riel · Recta Media',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-recta-gastada',
    label: 'Riel · Recta Gastada',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-curva',
    label: 'Riel · Curva',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-curva-suave',
    label: 'Riel · Curva Suave',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-cruce',
    label: 'Riel · Cruce',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-desvio-der',
    label: 'Riel · Desvío Derecha',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-desvio-izq',
    label: 'Riel · Desvío Izquierda',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-paso-nivel',
    label: 'Riel · Paso a Nivel',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-calle-recta',
    label: 'Riel · Calle Recta (cruce peatonal)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-calle-curva',
    label: 'Riel · Calle Curva',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/floors/rieles-riel-tope',
    label: 'Riel · Tope (final de línea)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-ancla',
    label: 'Deco · Ancla',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-barril',
    label: 'Deco · Barril',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-barriles-trio',
    label: 'Deco · Trío de Barriles',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-bote-canoa',
    label: 'Deco · Canoa',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-bote-chalupa',
    label: 'Deco · Chalupa',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-cajon-a',
    label: 'Deco · Cajón A',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-cajon-b',
    label: 'Deco · Cajón B',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-cajon-c',
    label: 'Deco · Cajón C',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-canasto',
    label: 'Deco · Canasto',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-costal',
    label: 'Deco · Costal',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-fardo',
    label: 'Deco · Fardo',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-palma-coco',
    label: 'Deco · Palma de Coco',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-pila-cajas',
    label: 'Deco · Pila de Cajas',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-pila-costales',
    label: 'Deco · Pila de Costales',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-pila-tablones',
    label: 'Deco · Pila de Tablones',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-poste-amarre',
    label: 'Deco · Poste de Amarre',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-tarima',
    label: 'Deco · Tarima',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-tinaja',
    label: 'Deco · Tinaja',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase1/decorators/decorativos-vapor-fluvial',
    label: 'Deco · Vapor Fluvial (barco a vapor)',
    scenes: ['phase1'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'facade',
    label: 'Fachada Colorida',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: '#e85a3a' },
  },
  {
    type: 'temple',
    label: 'Templo Gótico',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'parroquia',
    label: 'Parroquia Sagrado Corazón',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'carnival-house',
    label: 'Casa Carnavalera',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'trinitaria',
    label: 'Trinitaria',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0.42, 0], rotationY: 0, scale: 1.1, variant: '#d82a7a' },
  },
  {
    type: 'dancer',
    label: 'Bailarín/a de Carnaval',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'bailarina-amarilla' },
  },
  {
    type: 'parade-vehicle',
    label: 'Carro/Carroza de Carnaval',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'chiva-rumbera' },
  },
  {
    type: 'rey-momo',
    label: 'Rey Momo (baila)',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2-house',
    label: 'Casa Phase2 (genérica)',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase2/houses/casa-cafe' },
  },
  {
    type: 'phase2-floor',
    label: 'Suelo Phase2 (genérico)',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase2/floors/suelo-arena' },
  },
  {
    type: 'phase2-decoration',
    label: 'Decoración Phase2 (genérica)',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase2/decorations/farol-calle' },
  },
  {
    type: 'phase2-scene',
    label: 'Escena Phase2',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase2/scenes/plaza-baile-carnaval' },
  },
  {
    type: 'phase2-model',
    label: 'Modelo Phase2 (cualquiera)',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1, variant: 'phase2/houses/casa-verde' },
  },
  {
    type: 'phase2/houses/casa-balcones-rojos',
    label: 'Casa · Balcones Rojos',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casa-cafe',
    label: 'Casa · Café',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casa-cyan',
    label: 'Casa · Cyan',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casa-marron-premium',
    label: 'Casa · Marrón Premium',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casa-verde',
    label: 'Casa · Verde',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casa-celeste-l-teja',
    label: 'Casa · Celeste L Teja',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casa-esquina-amarilla',
    label: 'Casa · Esquina Amarilla',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casa-olivo-portal-arcos',
    label: 'Casa · Olivo Portal Arcos',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casa-rosa-hastial',
    label: 'Casa · Rosa Hastial',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/casita-coral-plana',
    label: 'Casa · Casita Coral Plana',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/houses/puesto-fruteria',
    label: 'Puesto · Frutería',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/carrito-frutas-1',
    label: 'Deco · Carrito Frutas 1',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/carrito-frutas-2',
    label: 'Deco · Carrito Frutas 2',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/carrito-frutas-3',
    label: 'Deco · Carrito Frutas 3',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/caja-limas-tomates',
    label: 'Deco · Caja Limas/Tomates',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/caja-mangos-papayas',
    label: 'Deco · Caja Mangos/Papayas',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/caja-naranjas',
    label: 'Deco · Caja Naranjas',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/canasta-mixta',
    label: 'Deco · Canasta Mixta',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/canasta-naranjas',
    label: 'Deco · Canasta Naranjas',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/pila-cajas-pinas',
    label: 'Deco · Pila Cajas Piñas',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/puestos',
    label: 'Deco · Puestos',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/silla-banquito',
    label: 'Deco · Silla Banquito',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/mesa-corona',
    label: 'Decoración · Mesa · Corona',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/vitrina-super-fritos',
    label: 'Decoración · Puesto · Fritos',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/el-poderoso',
    label: 'Decoración · El Poderoso',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/farol-calle',
    label: 'Deco · Farol Calle',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/planta-flores-maceta',
    label: 'Deco · Planta Flores Maceta',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/planta-hojas-maceta',
    label: 'Deco · Planta Hojas Maceta',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/decorations/planta-palma-maceta',
    label: 'Deco · Planta Palma Maceta',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-aceras-ladrillo',
    label: 'Suelo · Aceras Ladrillo',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-aceras-ladrillo-acera-curva-exterior',
    label: 'Suelo · Acera Curva Exterior',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-aceras-ladrillo-acera-curva-interior',
    label: 'Suelo · Acera Curva Interior',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-aceras-ladrillo-acera-esquina',
    label: 'Suelo · Acera Esquina',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-aceras-ladrillo-acera-recta',
    label: 'Suelo · Acera Recta',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-aceras-ladrillo-plataforma-casa',
    label: 'Suelo · Plataforma Casa',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-arena',
    label: 'Suelo · Arena',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-arena-arena-camino-curva',
    label: 'Suelo · Arena Camino Curva',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-arena-arena-camino-recta',
    label: 'Suelo · Arena Camino Recta',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-arena-arena-parche-redondo',
    label: 'Suelo · Arena Parche Redondo',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-arena-arena-plana-a',
    label: 'Suelo · Arena Plana A',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-arena-arena-plana-b',
    label: 'Suelo · Arena Plana B',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-calles-adoquin',
    label: 'Suelo · Calles Adoquín',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-calles-adoquin-calle-cruce',
    label: 'Suelo · Calle Cruce',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-calles-adoquin-calle-curva',
    label: 'Suelo · Calle Curva',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-calles-adoquin-calle-plaza',
    label: 'Suelo · Calle Plaza',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/floors/suelo-calles-adoquin-calle-recta',
    label: 'Suelo · Calle Recta',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'phase2/scenes/plaza-baile-carnaval',
    label: 'Escena · Plaza Baile Carnaval',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
  {
    type: 'portal',
    label: 'Portal',
    scenes: ['phase1', 'phase2'],
    defaultEntity: { position: [0, 1.05, 0], rotationY: 0, scale: 1.5 },
  },
  {
    type: 'generic',
    label: 'Genérico (placeholder)',
    scenes: ['cityIntro', 'library', 'phase1', 'phase2'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
  },
]

/**
 * Filters the catalog down to what a given scene can spawn.
 * @param scene - Target scene id
 * @returns Catalog items available in that scene
 */
export function catalogForScene(scene: SceneId): EntityCatalogItem[] {
  return entityCatalog.filter((item) => item.scenes.includes(scene))
}