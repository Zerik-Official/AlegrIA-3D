/**
 * Tracks the restored library's Libro de Rosa pages: which one is under the
 * crosshair and which one is open in the page modal — and warms the browser
 * cache with the full-resolution scans as soon as the hall is restored, so
 * the modal opens on a sharp image instantly.
 * @module app/hooks/useBookPages
 */

import { useCallback, useEffect, useState } from 'react'
import { BOOK_PAGES, type BookPage } from '@/features/library/config/bookPages'

/** Public state and actions exposed by {@link useBookPages}. */
export interface BookPages {
  /** Page under the crosshair, if any. */
  focusedPageId: string | null
  /** Reports the page under the crosshair (from the in-scene displays). */
  setFocusedPageId: (id: string | null) => void
  /** Page open in the modal, if any. */
  openPage: BookPage | null
  /** Opens the focused page. */
  openFocusedPage: () => void
  /** Closes the modal. */
  closePage: () => void
}

/**
 * @param libraryRestored - Whether the hall (and so the pages) has been restored
 * @returns Page focus/open state and actions
 */
export function useBookPages(libraryRestored: boolean): BookPages {
  const [focusedPageId, setFocusedPageId] = useState<string | null>(null)
  const [openPageId, setOpenPageId] = useState<string | null>(null)

  useEffect(() => {
    if (!libraryRestored) {
      setFocusedPageId(null)
      setOpenPageId(null)
      return
    }
    BOOK_PAGES.forEach((page) => {
      const img = new Image()
      img.decoding = 'async'
      img.src = page.src
    })
  }, [libraryRestored])

  const openFocusedPage = useCallback(() => {
    if (focusedPageId) setOpenPageId(focusedPageId)
  }, [focusedPageId])
  const closePage = useCallback(() => setOpenPageId(null), [])

  return {
    focusedPageId,
    setFocusedPageId,
    openPage: BOOK_PAGES.find((p) => p.id === openPageId) ?? null,
    openFocusedPage,
    closePage,
  }
}
