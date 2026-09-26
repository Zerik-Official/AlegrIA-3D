/**
 * DOM equalizer bars moving to the music: real frequency bands when the
 * source can be analysed, a gentle synthetic dance otherwise (silence,
 * paused audio or no Web Audio), so the bars never freeze flat.
 * @module shared/components/LiveEqualizer
 */

import { memo, useCallback, useRef } from 'react'
import { useLiveBars } from '@/shared/hooks/useLiveBars'
import type { AudioSourceName } from '@/shared/audio/audioAnalyser'

/**
 * Props for {@link LiveEqualizer}.
 */
interface LiveEqualizerProps {
  /** Which music to follow. */
  source: AudioSourceName
  /** Number of bars. */
  bars?: number
  /** Classes of the bars' container (size it; the bars fill it from the bottom). */
  className?: string
}

/**
 * @param props - Source, bar count and container classes
 * @returns Bars container
 */
export const LiveEqualizer = memo(function LiveEqualizer({ source, bars = 24, className = '' }: LiveEqualizerProps) {
  const barRefs = useRef<Array<HTMLSpanElement | null>>([])
  const apply = useCallback((i: number, level: number) => {
    const bar = barRefs.current[i]
    if (bar) bar.style.transform = `scaleY(${level})`
  }, [])
  useLiveBars(source, bars, apply)

  return (
    <div aria-hidden className={`pointer-events-none flex items-end gap-[2px] ${className}`}>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            barRefs.current[i] = el
          }}
          className="h-full flex-1 origin-bottom rounded-t-[2px] will-change-transform"
          style={{
            background: `linear-gradient(to top, #ff007f, ${i / bars > 0.5 ? '#ffcc33' : '#49e9ff'})`,
            transform: 'scaleY(0.1)',
          }}
        />
      ))}
    </div>
  )
})
