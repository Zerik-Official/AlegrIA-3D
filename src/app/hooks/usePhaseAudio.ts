/**
 * Drives the single shared ambient/cue audio element from the current game
 * phase — one track plays at a time, switching (and stopping whatever was
 * playing before) whenever the resolved track changes.
 * @module app/hooks/usePhaseAudio
 */

import { useEffect, useRef, useState } from 'react'
import { audioTracks, type AudioTrackKey } from '@/shared/config/audio'
import type { GamePhase } from '@/shared/types'

/** Playback volume for every track. */
const VOLUME = 0.55

/**
 * Resolves which track should be playing for a given phase.
 * `exploring` (the library) plays a different track the first time through
 * versus the second (after the Phase 2 → library portal) — every other
 * phase maps to exactly one track. Returns `null` for `idle`, where nothing plays yet.
 * @param phase - Current game phase
 * @param libraryVisitCount - How many times `exploring` has been entered so far
 * @returns Track key to play, or `null` for silence
 */
function trackKeyForPhase(phase: GamePhase, libraryVisitCount: number): AudioTrackKey | null {
  switch (phase) {
    case 'wormhole':
      return 'vortex'
    case 'exploring':
      return libraryVisitCount >= 2 ? 'present' : 'alegria'
    case 'phase1':
    case 'museum':
      return 'origins'
    case 'phase2':
      return 'dorade'
    case 'cityIntro':
      return 'finalFuture'
    default:
      return null
  }
}

/**
 * @param phase - Current game phase
 * @param libraryVisitCount - How many times `exploring` has been entered so far
 * @returns Seconds remaining in the current narration/dialogue, or `null` when no track is active
 */
export function usePhaseAudio(phase: GamePhase, libraryVisitCount: number): number | null {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  if (audioRef.current === null && typeof Audio !== 'undefined') {
    audioRef.current = new Audio()
    audioRef.current.volume = VOLUME
  }

  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const key = trackKeyForPhase(phase, libraryVisitCount)
    if (!key) {
      el.pause()
      setRemaining(null)
      return
    }
    const src = audioTracks[key]
    el.loop = false
    if (!el.src.endsWith(src)) {
      el.src = src
      el.currentTime = 0
      el.play().catch(() => {})
    } else if (el.paused) {
      el.play().catch(() => {})
    }
  }, [phase, libraryVisitCount])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const update = (): void => {
      if (!el.duration || Number.isNaN(el.duration) || !Number.isFinite(el.duration)) {
        setRemaining(null)
        return
      }
      if (el.paused || el.ended) {
        if (el.ended) {
          setRemaining(0)
        } else {
          setRemaining(null)
        }
        return
      }
      const r = Math.max(0, el.duration - el.currentTime)
      setRemaining(r)
    }

    const onLoaded = (): void => update()
    const onTimeUpdate = (): void => update()
    const onEnded = (): void => setRemaining(0)
    const onPlay = (): void => update()
    const onPause = (): void => update()

    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('ended', onEnded)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)

    const id = window.setInterval(update, 250)

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      window.clearInterval(id)
    }
  }, [phase, libraryVisitCount])

  useEffect(
    () => () => {
      audioRef.current?.pause()
    },
    []
  )

  return remaining
}
