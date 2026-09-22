/**
 * Engine types for data-driven phase rendering.
 * @module engine/types
 */

import type { Vector3Tuple } from 'three'

/**
 * Editable entity record — the single JSON-serializable unit the engine renders.
 * `type` is intentionally an open string keyed against `engine/entityRegistry`'s
 * renderer map and `engine/config/entityCatalog`'s editor palette, so new scene
 * elements can be declared purely in JSON/catalog data without touching engine code.
 */
export interface EditableEntity {
  /** Unique identifier; also used as the THREE.Object3D name for gizmo lookup. */
  id: string
  /** Logical type — looked up in `entityRegistry` for rendering and `entityCatalog` for the editor palette. */
  type: string
  /** World position. */
  position: Vector3Tuple
  /** Y rotation in radians. */
  rotationY: number
  /** Uniform scale. */
  scale: number
  /** Variant or color hint (e.g. `'short'|'medium'|'long'`, a hex color, a shelf width). */
  variant?: string
  /** Image URL carried by picture-like entities (e.g. sepia photo frames, posters). */
  imageSrc?: string
  /** Optional display title, used by entities that show captions or feed the photo modal. */
  title?: string
  /** Optional display description, used by entities that show captions or feed the photo modal. */
  description?: string
}

/**
 * Phase configuration driven by JSON.
 */
export interface PhaseConfig {
  /** Phase identifier. */
  id: string
  /** Human readable name. */
  name: string
  /** Entities to render in this phase. */
  entities: EditableEntity[]
}

/**
 * Render context passed to the engine.
 */
export interface EngineRenderContext {
  /** Currently highlighted photo id for sepia frames. */
  highlightedPhotoId?: string | null
  /** Ritual progress for book animation. */
  ritualProgress?: number
}
