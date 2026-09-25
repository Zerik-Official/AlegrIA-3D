/**
 * Tracks which of Phase 1's sepia photos is open in the photo modal.
 * @module app/hooks/usePhotoSelection
 */

import { useCallback, useState } from 'react'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'

/** One sepia photo record. */
export type SepiaPhoto = (typeof sepiaPhotos)[number]

/** Public state and actions exposed by {@link usePhotoSelection}. */
export interface PhotoSelection {
  /** Photo open in the modal, if any. */
  selectedPhoto: SepiaPhoto | null
  /** Opens a photo by id. */
  selectPhoto: (id: string) => void
  /** Closes the modal. */
  closePhoto: () => void
}

/**
 * @returns Selected photo and the actions to open/close it
 */
export function usePhotoSelection(): PhotoSelection {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const selectedPhoto = sepiaPhotos.find((p) => p.id === selectedPhotoId) ?? null
  const selectPhoto = useCallback((id: string) => setSelectedPhotoId(id), [])
  const closePhoto = useCallback(() => setSelectedPhotoId(null), [])
  return { selectedPhoto, selectPhoto, closePhoto }
}
