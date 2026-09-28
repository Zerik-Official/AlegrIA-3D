/**
 * Loops Phase 2's congas drumming in the background, fading its volume by
 * distance from the player so it reads as a real sound source by the fritos
 * stand rather than a flat music bed — capped under `usePicoAudio`'s own cap
 * (itself already under the narration track's volume), so even standing
 * right next to the congas player it never buries the picó or the narration.
 * @module app/hooks/useCongasAudio
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const base = import.meta.env.BASE_URL
const CONGAS_SRC = `${base}sounds/cumbia-sound.mp3`

/** Distance within which the congas play at their full (capped) volume. */
const NEAR_RADIUS = 3
/** Distance beyond which the congas are inaudible. */
const FAR_RADIUS = 13
/**
 * Loudest the congas ever get — deliberately under `usePicoAudio`'s own cap
 * (0.32), which is itself under the narration's volume, so this stays the
 * quietest ambient layer regardless of how close the player stands.
 */
const MAX_VOLUME = 0.24

/**
 * @returns The hook's audio element, or `null` where `Audio` is unavailable
 */
function createAudioElement(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  const el = new Audio(CONGAS_SRC)
  el.loop = true
  el.volume = 0
  return el
}

/**
 * @param active - Whether the congas should be audible at all (Phase 2 only)
 * @param distance - Player's distance to the congas character, in world units (`Infinity` when `active` is `false`)
 */
export function useCongasAudio(active: boolean, distance: number): void {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const el = (audioRef.current ??= createAudioElement())
    if (!el) return
    if (active) {
      if (el.paused) el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [active])

  useEffect(() => {
    const el = (audioRef.current ??= createAudioElement())
    if (!el || !active) return
    const falloff = 1 - THREE.MathUtils.smoothstep(distance, NEAR_RADIUS, FAR_RADIUS)
    el.volume = THREE.MathUtils.clamp(falloff, 0, 1) * MAX_VOLUME
  }, [active, distance])

  useEffect(
    () => () => {
      audioRef.current?.pause()
    },
    []
  )
}
