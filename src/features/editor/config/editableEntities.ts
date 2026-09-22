/**
 * Editable entity definitions for the position editor.
 * Export JSON from the editor to replace these defaults.
 * @module features/editor/config/editableEntities
 */

import type { Vector3Tuple } from 'three'

/**
 * Editable entity type.
 */
export type EditableEntityType = 'bahareque-house' | 'anden-alto' | 'tree' | 'trinitaria' | 'sepia-photo' | 'portal' | 'generic'

/**
 * Editable entity record.
 */
export interface EditableEntity {
  /** Unique identifier. */
  id: string
  /** Logical type for icon and model lookup. */
  type: EditableEntityType
  /** World position. */
  position: Vector3Tuple
  /** Y rotation in radians. */
  rotationY: number
  /** Uniform scale. */
  scale: number
  /** Variant or color hint. */
  variant?: string
}

/**
 * Initial Phase 1 entities — mirrors `Phase1Scene` defaults.
 * Export from the editor overwrites this file or a `phase1.json`.
 */
export const initialPhase1Entities: EditableEntity[] = [
  { id: 'house-01', type: 'bahareque-house', position: [-4.2, 0, -4.8], rotationY: 0.18, scale: 0.62, variant: 'short' },
  { id: 'house-02', type: 'bahareque-house', position: [3.8, 0, -4.4], rotationY: -0.22, scale: 0.62, variant: 'medium' },
  { id: 'house-03', type: 'bahareque-house', position: [-1.2, 0, -7.2], rotationY: 0.08, scale: 0.62, variant: 'long' },
  { id: 'house-04', type: 'bahareque-house', position: [5.2, 0, 3.6], rotationY: -0.42, scale: 0.62, variant: 'medium' },
  { id: 'house-05', type: 'bahareque-house', position: [-5.8, 0, 3.8], rotationY: 0.32, scale: 0.62, variant: 'short' },
  { id: 'house-06', type: 'bahareque-house', position: [-8.4, 0, -5.2], rotationY: 0.52, scale: 0.62, variant: 'long' },
  { id: 'house-07', type: 'bahareque-house', position: [8.2, 0, 2.8], rotationY: -0.62, scale: 0.62, variant: 'medium' },
  { id: 'photo-01', type: 'sepia-photo', position: [-1.2, 1.85, 3.8], rotationY: 0.22, scale: 1 },
  { id: 'photo-02', type: 'sepia-photo', position: [1.6, 1.92, 4.4], rotationY: -0.18, scale: 1 },
  { id: 'portal-phase1', type: 'portal', position: [0, 1.05, 15.8], rotationY: 0, scale: 1.55 },
]