/**
 * Engine types for data-driven phase rendering.
 * @module engine/types
 */

import type { ReactNode } from 'react'
import type { Vector3, Vector3Tuple } from 'three'

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
  /** Video URL carried by screen-like entities (e.g. `ad-tower`), looped and muted. */
  videoSrc?: string
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
  /** Named `cityIntro` flight-lane waypoints (see `features/cityIntro/renderers/flightLane`), keyed by lane id. */
  flightLanes?: Record<string, Vector3[]>
}

/**
 * Props passed to every entity renderer registered in `engine/entityRegistry`
 * (and any per-scene renderer module it merges in, e.g. `engine/cityIntroRenderers`).
 * The entity's own `position`/`rotationY`/`scale` are already applied by `PhaseEngine`'s
 * wrapping group, so renderers place their content at the origin.
 */
export interface EntityRendererProps {
  /** The JSON-driven entity being rendered. */
  entity: EditableEntity
  /** Optional per-frame render context (highlight state, ritual progress, ...). */
  context?: EngineRenderContext
}

/** A component that renders one entity type. */
export type EntityRenderer = (props: EntityRendererProps) => ReactNode
