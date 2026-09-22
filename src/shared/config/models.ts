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
  'phase1/arroyo': { path: `${base}models/phase1/arroyo.glb`, fallback: 'procedural-arroyo' },
  'phase1/aduana': { path: `${base}models/phase1/aduana.glb`, fallback: 'procedural-aduana' },
  'phase1/estacion-montoya': { path: `${base}models/phase1/estacion-montoya.glb`, fallback: 'procedural-estacion' },
  'phase1/sepia-photo': { path: `${base}models/phase1/sepia-photo.glb`, fallback: 'procedural-sepia-photo' },
  'phase1/portal': { path: `${base}models/phase1/portal.glb`, fallback: 'procedural-portal-phase1' },
  'phase2/facade': { path: `${base}models/phase2/facade.glb`, fallback: 'procedural-facade' },
  'phase2/temple': { path: `${base}models/phase2/temple.glb`, fallback: 'procedural-temple' },
  'phase2/trinitaria': { path: `${base}models/phase2/trinitaria.glb`, fallback: 'procedural-trinitaria' },
  'phase2/portal': { path: `${base}models/phase2/portal.glb`, fallback: 'procedural-portal-phase2' },
}