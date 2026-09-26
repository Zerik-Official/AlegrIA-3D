/**
 * Drives a set of equalizer bars every animation frame from the music's
 * frequency bands, falling back to a gentle synthetic dance when the audio
 * is silent or can't be analysed.
 * @module shared/hooks/useLiveBars
 */

import { useEffect, useRef } from 'react'
import { readAudioLevels, type AudioSourceName } from '@/shared/audio/audioAnalyser'

/**
 * @param source - Which music to follow
 * @param count - Number of bars
 * @param apply - Called every frame for each bar with its smoothed level, `[0.06, 1]`
 */
export function useLiveBars(source: AudioSourceName, count: number, apply: (index: number, level: number) => void): void {
  const applyRef = useRef(apply)
  useEffect(() => {
    applyRef.current = apply
  }, [apply])

  useEffect(() => {
    const levels = new Float32Array(count)
    const smoothed = new Float32Array(count)
    let frame = 0
    const tick = (now: number): void => {
      const live = readAudioLevels(source, levels)
      const t = now / 1000
      for (let i = 0; i < count; i++) {
        const target = live ? levels[i] : 0.3 + 0.22 * Math.sin(t * (2.1 + (i % 5) * 0.37) + i * 0.9) + 0.14 * Math.sin(t * 5.3 + i * 1.7)
        smoothed[i] += (target - smoothed[i]) * 0.35
        applyRef.current(i, Math.max(0.06, Math.min(1, smoothed[i])))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [source, count])
}
