/**
 * Drives the single shared ambient/cue audio element from the current game
 * phase — one track plays at a time, switching (and stopping whatever was
 * playing before) whenever the resolved track changes.
 * @module app/hooks/usePhaseAudio
 */

import { useEffect, useRef, useState } from 'react'
import { audioTracks, type AudioTrackKey } from '@/shared/config/audio'
import { registerAudioSource } from '@/shared/audio/audioAnalyser'
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
      return 'origins'
    case 'phase2':
      return 'dorade'
    case 'cityIntro':
      return 'finalFuture'
    case 'credits':
      return 'credits'
    default:
      return null
  }
}

/**
 * @returns The hook's audio element, or `null` where `Audio` is unavailable
 */
function createAudioElement(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  const el = new Audio()
  el.volume = VOLUME
  registerAudioSource('phase', el)
  return el
}

/** Tracks that repeat for as long as their scene stays on screen instead of playing once. */
const LOOPING_TRACKS = new Set<AudioTrackKey>(['credits'])

/**
 * @param phase - Current game phase
 * @param libraryVisitCount - How many times `exploring` has been entered so far
 * @returns Seconds remaining in the current phase's narration/dialogue, or `null` when no track is active —
 * never the previous track's leftover countdown in the moment right after a switch
 */
export function usePhaseAudio(phase: GamePhase, libraryVisitCount: number): number | null {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /** Latest countdown, tagged with the track it describes — so a previous track's leftover is never shown after a switch. */
  const [countdown, setCountdown] = useState<{ key: AudioTrackKey | null; remaining: number | null }>({ key: null, remaining: null })
  const expectedKey = trackKeyForPhase(phase, libraryVisitCount)

  useEffect(() => {
    const el = (audioRef.current ??= createAudioElement())
    if (!el) return
    const key = trackKeyForPhase(phase, libraryVisitCount)
    if (!key) {
      el.pause()
      return
    }
    const src = audioTracks[key]
    el.loop = LOOPING_TRACKS.has(key)
    if (!el.src.endsWith(src)) {
      el.src = src
      el.currentTime = 0
      el.play().catch(() => {})
    } else if (el.paused) {
      el.play().catch(() => {})
    }
  }, [phase, libraryVisitCount])

  useEffect(() => {
    const el = (audioRef.current ??= createAudioElement())
    if (!el) return
    const key = trackKeyForPhase(phase, libraryVisitCount)
    const setRemaining = (remaining: number | null): void => setCountdown({ key, remaining })

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

  return expectedKey !== null && expectedKey === countdown.key ? countdown.remaining : null
}
