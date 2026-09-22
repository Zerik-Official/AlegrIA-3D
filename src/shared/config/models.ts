/**
 * Model registry for Blender-authored assets.
 * Replace any entry's `path` with your exported `.glb` to override the procedural fallback.
 * Export settings recommended: Blender -> File -> Export -> glTF 2.0 (.glb), Apply Modifiers, +Y Up.
 * @module shared/config/models
 * @link https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
 */

import type { ModelRegistry } from '../types'

/**
 * Default model registry.
 * Paths are resolved relative to the Vite `public/` folder (`/models/...`).
 * When a file is missing at `path`, the corresponding `fallback` procedural mesh is rendered.
 */
export const modelRegistry: ModelRegistry = {
  'library/bookshelf': { path: '/models/library/bookshelf.glb', fallback: 'procedural-bookshelf' },
  'library/scattered-book': { path: '/models/library/scattered-book.glb', fallback: 'procedural-scattered-book' },
  'pedestal/base': { path: '/models/pedestal/pedestal.glb', fallback: 'procedural-pedestal' },
  'pedestal/book': { path: '/models/pedestal/book.glb', fallback: 'procedural-book' },
  'museum/pedestal': { path: '/models/museum/pedestal-display.glb', fallback: 'procedural-museum-pedestal' },
  'museum/column': { path: '/models/museum/column.glb', fallback: 'procedural-column' },
  'museum/painting-frame': { path: '/models/museum/painting-frame.glb', fallback: 'procedural-painting' },
}
