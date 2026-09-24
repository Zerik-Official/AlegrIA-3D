/**
 * Loops Phase 2's picó ("El Poderoso") in the background, fading its volume
 * by distance from the player so it reads as a real sound source on the
 * platform rather than a flat music bed — capped well under the narration
 * track's volume (`usePhaseAudio`'s `VOLUME`) so it never buries it.
 * @module app/hooks/usePicoAudio
 */

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const base = import.meta.env.BASE_URL
const PICO_SRC = `${base}sounds/sound-poderoso.mp3`

/** Distance within which the picó plays at its full (capped) volume. */
const NEAR_RADIUS = 4
/** Distance beyond which the picó is inaudible. */
const FAR_RADIUS = 20
/**
 * Loudest the picó ever gets — deliberately under `usePhaseAudio`'s
 * narration volume (0.55) so it stays a background layer even standing
 * right next to it, instead of drowning out `PART-4-DORADE.mp3`.
 */
const MAX_VOLUME = 0.32

/**
 * @param active - Whether the picó should be audible at all (Phase 2 only)
 * @param distance - Player's distance to the picó, in world units (`Infinity` when `active` is `false`)
 */
export function usePicoAudio(active: boolean, distance: number): void {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  if (audioRef.current === null && typeof Audio !== 'undefined') {
    const el = new Audio(PICO_SRC)
    el.loop = true
    el.volume = 0
    audioRef.current = el
  }

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (active) {
      if (el.paused) el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [active])

  useEffect(() => {
    const el = audioRef.current
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
