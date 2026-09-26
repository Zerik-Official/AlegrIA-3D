/**
 * Directs the library's story beats around its narration: waking the book
 * near the end of the opening narration, making it usable only once the
 * narration is over, and the titles that accompany each beat.
 * @module app/hooks/useLibraryDirector
 */

import { useEffect, useState } from 'react'
import { useTransientFlag } from '@/shared/hooks/useTransientFlag'
import type { PhaseFlow } from '@/app/hooks/usePhaseFlow'
import type { Narration } from '@/app/hooks/useNarration'

/** Seconds left in the library's opening narration at which the pedestal lights up and the book appears. */
const BOOK_AWAKEN_AT_REMAINING_SEC = 30
/** If the library's narration is never heard (missing/blocked audio), carry on as if it had ended after this long, in ms. */
const NARRATION_FALLBACK_MS = 15000
/** How long the "the book is calling you" title stays up once the book can be used, in ms. */
const BOOK_CALLING_TITLE_MS = 10000
/** How long the "portal to the future" title stays up once the portal opens, in ms. */
const LIBRARY_PORTAL_TITLE_MS = 9000

/** Library state derived by {@link useLibraryDirector}. */
export interface LibraryDirection {
  /** Whether this is the library's second (return) visit. */
  isReturnVisit: boolean
  /** Whether the first visit's awakening cinematic is playing — movement locked, camera guided. */
  bookCinematicPlaying: boolean
  /** Whether the "the book is calling you" title is up (first visit). */
  showBookCalling: boolean
  /** Whether the "return the book" title is up (second visit). */
  showReturnBook: boolean
  /** Whether the "portal to the future" title is up. */
  showPortalTitle: boolean
  /** Whether the white burst restoring the hall is flashing. */
  showBurstFlash: boolean
}

/**
 * @param phaseFlow - Phase state machine
 * @param narration - The library's narration, as followed by `useNarration`
 * @returns Library beats and titles
 */
export function useLibraryDirector(phaseFlow: PhaseFlow, narration: Narration): LibraryDirection {
  const { phase, bookStage, libraryVisitCount, libraryPortalUnlocked, awakenLibraryBook, finishLibraryDialog } = phaseFlow
  const inLibrary = phase === 'exploring'
  const [fallbackDone, setFallbackDone] = useState(false)
  const fallbackKey = `${inLibrary}:${libraryVisitCount}`
  const [prevFallbackKey, setPrevFallbackKey] = useState(fallbackKey)
  if (fallbackKey !== prevFallbackKey) {
    setPrevFallbackKey(fallbackKey)
    setFallbackDone(false)
  }

  useEffect(() => {
    if (!inLibrary) return
    const id = window.setTimeout(() => setFallbackDone(true), NARRATION_FALLBACK_MS)
    return () => window.clearTimeout(id)
  }, [inLibrary, libraryVisitCount])

  const narrationOver = narration.ended || (fallbackDone && !narration.heard)

  useEffect(() => {
    if (!inLibrary || bookStage !== 'dormant') return
    const nearEnd = narration.remainingSec !== null && narration.remainingSec <= BOOK_AWAKEN_AT_REMAINING_SEC
    if (nearEnd || narrationOver) awakenLibraryBook()
  }, [inLibrary, bookStage, narration.remainingSec, narrationOver, awakenLibraryBook])

  useEffect(() => {
    if (inLibrary && bookStage === 'waiting' && narrationOver) finishLibraryDialog()
  }, [inLibrary, bookStage, narrationOver, finishLibraryDialog])

  const isReturnVisit = libraryVisitCount >= 2
  const bookReady = inLibrary && bookStage === 'ready'
  const showBookCalling = useTransientFlag(bookReady && !isReturnVisit, BOOK_CALLING_TITLE_MS)
  const showPortalTitle = useTransientFlag(inLibrary && libraryPortalUnlocked, LIBRARY_PORTAL_TITLE_MS)

  return {
    isReturnVisit,
    bookCinematicPlaying: inLibrary && (bookStage === 'igniting' || bookStage === 'awakening'),
    showBookCalling,
    showReturnBook: bookReady && isReturnVisit,
    showPortalTitle,
    showBurstFlash: inLibrary && bookStage === 'transforming',
  }
}
