/**
 * Per-frame music analysis for reactive 3D scenes: smoothed volume and
 * bass/mids/treble energy plus a decaying beat pulse, falling back to a
 * gentle synthetic groove when the audio is silent or can't be analysed.
 * @module shared/hooks/useAudioAnalysis
 */

import { useEffect, useRef } from 'react'
import { readAudioAnalysis, type AudioAnalysis, type AudioSourceName } from '@/shared/audio/audioAnalyser'

/** Smoothed analysis snapshot delivered to scenes. */
export interface SmoothedAudioAnalysis {
  /** Whether real audio data was read. */
  live: boolean
  /** Overall volume, `[0, 1]`. */
  volume: number
  /** Bass energy, `[0, 1]`. */
  bass: number
  /** Mid energy, `[0, 1]`. */
  mids: number
  /** Treble energy, `[0, 1]`. */
  treble: number
  /** Beat pulse, `1` on onset decaying towards `0`. */
  beat: number
}

/**
 * @param source - Which music to follow
 * @param apply - Called every frame with the smoothed analysis
 */
export function useAudioAnalysis(source: AudioSourceName, apply: (analysis: SmoothedAudioAnalysis) => void): void {
  const applyRef = useRef(apply)
  useEffect(() => {
    applyRef.current = apply
  }, [apply])

  useEffect(() => {
    const levels = new Float32Array(24)
    const smoothed: SmoothedAudioAnalysis = { live: false, volume: 0, bass: 0, mids: 0, treble: 0, beat: 0 }
    let frame = 0
    const tick = (now: number): void => {
      const analysis: AudioAnalysis | null = readAudioAnalysis(source, levels)
      const t = now / 1000
      const target: SmoothedAudioAnalysis = analysis
        ? { live: true, volume: analysis.volume, bass: analysis.bass, mids: analysis.mids, treble: analysis.treble, beat: analysis.beat }
        : {
            live: false,
            volume: 0.35 + 0.2 * Math.sin(t * 1.7),
            bass: 0.4 + 0.3 * Math.sin(t * 2.2),
            mids: 0.35 + 0.2 * Math.sin(t * 1.3 + 1),
            treble: 0.3 + 0.2 * Math.sin(t * 3.1 + 2),
            beat: 0,
          }
      smoothed.live = target.live
      smoothed.volume += (target.volume - smoothed.volume) * 0.3
      smoothed.bass += (target.bass - smoothed.bass) * 0.35
      smoothed.mids += (target.mids - smoothed.mids) * 0.3
      smoothed.treble += (target.treble - smoothed.treble) * 0.3
      smoothed.beat = target.live ? target.beat : 0
      applyRef.current(smoothed)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [source])
}
