/**
 * Core domain types for the AlegrIA 3D experience.
 * @module shared/types
 */

/**
 * Application flow phase.
 * - `idle` waiting for user to start
 * - `cityIntro` scripted walk through the futuristic city street to the library door
 * - `exploring` free movement inside the library
 * - `wormhole` transition animation
 * - `phase1` Barrio Abajo origins (1857–1900) with bahareque and arroyo
 * - `phase2` Época Dorada, Tradición y Carnaval with trinitaria and temple
 */
export type GamePhase = 'idle' | 'cityIntro' | 'exploring' | 'wormhole' | 'phase1' | 'phase2' | 'credits'

/**
 * Axis-aligned movement bounds.
 */
export interface Bounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

/**
 * Keyboard movement state.
 */
export interface KeysState {
  w: boolean
  a: boolean
  s: boolean
  d: boolean
  shift: boolean
}

/**
 * Registry entry for a replaceable 3D model.
 * @property path - Public URL to the `.glb/.gltf` asset (under `/models/...`)
 * @property fallback - Identifier of the procedural fallback to use when the asset is missing
 */
export interface ModelEntry {
  path: string
  fallback: string
}

/**
 * Map of logical model names to registry entries.
 */
export type ModelRegistry = Record<string, ModelEntry>
