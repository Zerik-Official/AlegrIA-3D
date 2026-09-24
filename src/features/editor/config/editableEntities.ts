/**
 * Editable entity definitions for the position editor.
 * Export JSON from the editor to replace these defaults.
 * @module features/editor/config/editableEntities
 */

import phase1Json from '@/engine/config/phase1.json'
import libraryJson from '@/engine/config/library.json'
import phase2Json from '@/engine/config/phase2.json'
import cityIntroJson from '@/engine/config/cityIntro.json'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import type { EditableEntity } from '@/engine/types'

export type { EditableEntity } from '@/engine/types'

/**
 * `phase1.json` only carries placement; `sepiaPhotos` is the single source for
 * each frame's image/title/description, so merge it in by id here rather than
 * duplicating asset paths in two places.
 */
function withSepiaPhotoContent(entities: EditableEntity[]): EditableEntity[] {
  return entities.map((entity) => {
    if (entity.type !== 'sepia-photo') return entity
    const photo = sepiaPhotos.find((p) => p.id === entity.id)
    if (!photo) return entity
    return { ...entity, imageSrc: photo.src, title: photo.title, description: photo.description }
  })
}

/**
 * Initial City Intro entities — source `engine/config/cityIntro.json`.
 */
export const initialCityIntroEntities: EditableEntity[] = cityIntroJson as EditableEntity[]

/**
 * Initial Phase 1 entities — single source is `engine/config/phase1.json`.
 * Export from the editor overwrites this JSON.
 */
export const initialPhase1Entities: EditableEntity[] = withSepiaPhotoContent(phase1Json as EditableEntity[])

/**
 * Initial Library entities — source `engine/config/library.json`.
 */
export const initialLibraryEntities: EditableEntity[] = libraryJson as EditableEntity[]

/**
 * Initial Phase 2 entities — source `engine/config/phase2.json`.
 */
export const initialPhase2Entities: EditableEntity[] = phase2Json as EditableEntity[]
