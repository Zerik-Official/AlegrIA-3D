/**
 * Engine types for data-driven phase rendering.
 * @module engine/types
 */

import type { ReactNode } from 'react'
import type { Vector3, Vector3Tuple } from 'three'

/**
 * Collider attached to an entity, in the entity's local space: `offset` and
 * the dimensions are multiplied by the entity's `scale` and turned by its
 * `rotationY`. A rotated box still collides as its world-space AABB, the only
 * shape the player resolver understands.
 */
export interface ColliderSpec {
  /** `box` becomes a walkable solid, `cylinder` a blocking circle, `none` disables the type's default collider. */
  shape: 'box' | 'cylinder' | 'none'
  /** Local offset of the collider's center (box) or base center (cylinder). */
  offset?: Vector3Tuple
  /** Box extents along local X, Y and Z. */
  size?: Vector3Tuple
  /** Cylinder radius. */
  radius?: number
  /** Cylinder height. */
  height?: number
  /** When set, the collider only takes part in collision while the scene lists this tag as active (see {@link EngineRenderContext.colliderTags}). */
  tag?: string
}

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
  /**
   * Video playlist carried by screen-like entities — plays each URL in order,
   * advancing to the next when one ends and looping back to the first after
   * the last, muted throughout. Takes priority over {@link videoSrc} when set
   * and non-empty; a single-item array behaves like `videoSrc`.
   */
  videoSrcs?: string[]
  /** Collider override; when absent the type's default from `engine/config/colliders.json` applies. */
  collider?: ColliderSpec
  /** Footprint `[width along X, depth along Z]` of area-like entities (`walk-area`), multiplied by `scale`; rotation is ignored, areas stay axis-aligned. */
  areaSize?: [number, number]
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
  /** World positions of the scene's `rail-tunnel` mouths, which bound the train's line. */
  railTunnels?: Vector3Tuple[]
  /** Tags of the tagged colliders that currently collide; tagged colliders are ignored when this is omitted. */
  colliderTags?: string[]
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