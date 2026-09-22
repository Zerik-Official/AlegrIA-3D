/**
 * Engine types for data-driven phase rendering.
 * @module engine/types
 */

import type { EditableEntity } from '@/features/editor/config/editableEntities'

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
