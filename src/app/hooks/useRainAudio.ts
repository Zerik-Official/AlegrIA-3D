/**
 * Plays Phase 1's rain ambience, fading it in as the rain builds and back out
 * when it stops, independently of the narration track.
 * @module app/hooks/useRainAudio
 */

import { useEffect, useRef } from 'react'
import { ambienceTracks } from '@/shared/config/audio'
import { appConfig } from '@/shared/config/appConfig'

/** How often the fade steps the volume, in ms. */
const FADE_STEP_MS = 50
/** How long fading back out takes, in ms. */
const FADE_OUT_MS = 1800

/**
 * @returns The hook's audio element, or `null` where `Audio` is unavailable
 */
function createAudioElement(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null
  const el = new Audio(ambienceTracks.rain)
  el.loop = true
  el.volume = 0
  return el
}

/**
 * @param active - Whether it's raining
 */
export function useRainAudio(active: boolean): void {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const el = (audioRef.current ??= createAudioElement())
    if (!el) return
    const target = active ? appConfig.rain.volume : 0
    const durationMs = active ? appConfig.rain.buildUpSec * 1000 : FADE_OUT_MS
    const step = (appConfig.rain.volume * FADE_STEP_MS) / durationMs
    if (active && el.paused) el.play().catch(() => {})
    const id = window.setInterval(() => {
      const next = el.volume + Math.sign(target - el.volume) * step
      el.volume = Math.min(1, Math.max(0, Math.abs(target - el.volume) <= step ? target : next))
      if (el.volume === target) {
        window.clearInterval(id)
        if (!active) el.pause()
      }
    }, FADE_STEP_MS)
    return () => window.clearInterval(id)
  }, [active])

  useEffect(
    () => () => {
      audioRef.current?.pause()
    },
    []
  )
}
