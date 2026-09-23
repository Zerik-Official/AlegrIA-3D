/**
 * Editor-facing catalog of the entity types each scene can contain.
 * This is the "possible elements of the scene" manifest: it drives the editor's
 * "Add element" menu so new elements are spawned with sensible defaults and never
 * require code changes — only an entry here plus a renderer in `engine/entityRegistry`.
 * @module engine/config/entityCatalog
 */

import type { EditableEntity } from '@/engine/types'

/** Scenes that own an editor instance (see `App.tsx`'s `useEditor` calls). */
export type SceneId = 'cityIntro' | 'library' | 'phase1' | 'phase2'

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
    type: 'logo-tower',
    label: 'Torre con Logo riwi',
    scenes: ['cityIntro'],
    defaultEntity: { position: [0, 0, 0], rotationY: 0, scale: 1 },
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
    type: 'trinitaria',
    label: 'Trinitaria',
    scenes: ['phase2'],
    defaultEntity: { position: [0, 0.42, 0], rotationY: 0, scale: 1.1, variant: '#d82a7a' },
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