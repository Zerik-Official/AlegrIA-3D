/**
 * Editable entity definitions for the position editor.
 * Export JSON from the editor to replace these defaults.
 * @module features/editor/config/editableEntities
 */

import phase1Json from '@/engine/config/phase1.json'
import libraryJson from '@/engine/config/library.json'
import phase2Json from '@/engine/config/phase2.json'
import type { EditableEntity } from '@/engine/types'

export type { EditableEntity } from '@/engine/types'

/**
 * Initial Phase 1 entities — single source is `engine/config/phase1.json`.
 * Export from the editor overwrites this JSON.
 */
export const initialPhase1Entities: EditableEntity[] = phase1Json as EditableEntity[]

/**
 * Initial Library entities — source `engine/config/library.json`.
 */
export const initialLibraryEntities: EditableEntity[] = libraryJson as EditableEntity[]

/**
 * Initial Phase 2 entities — source `engine/config/phase2.json`.
 */
export const initialPhase2Entities: EditableEntity[] = phase2Json as EditableEntity[]
