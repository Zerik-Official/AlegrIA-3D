/**
 * Text whose letters are filled with a live equalizer — the bars are clipped
 * to the glyphs, the way titles get filled with video — for the sound
 * designer's name in the credits.
 * @module features/credits/components/EqualizerText
 */

import { memo, useCallback, useId, useMemo, useRef } from 'react'
import { useLiveBars } from '@/shared/hooks/useLiveBars'

/**
 * Props for {@link EqualizerText}.
 */
interface EqualizerTextProps {
  /** Text to draw. */
  text: string
  /** Font size, in px. */
  fontSize: number
  /** CSS font weight. */
  fontWeight?: number
  /** CSS font family. */
  fontFamily?: string
  /** Letter spacing, in px. */
  letterSpacing?: number
}

/** Width of one bar, gap included, in px. */
const BAR_PITCH = 4

/**
 * @param text - Text to measure
 * @param font - CSS font shorthand
 * @param letterSpacing - Extra px per letter
 * @returns Rendered width in px
 */
function measureText(text: string, font: string, letterSpacing: number): number {
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return text.length * 10
  ctx.font = font
  return ctx.measureText(text).width + letterSpacing * text.length
}

/**
 * @param props - Text and font
 * @returns Inline SVG sized to the text
 */
export const EqualizerText = memo(function EqualizerText({ text, fontSize, fontWeight = 600, fontFamily = 'Cinzel, serif', letterSpacing = 0 }: EqualizerTextProps) {
  const clipId = useId()
  const gradientId = useId()
  const width = useMemo(
    () => Math.ceil(measureText(text, `${fontWeight} ${fontSize}px ${fontFamily}`, letterSpacing)) + 4,
    [text, fontSize, fontWeight, fontFamily, letterSpacing]
  )
  const height = Math.ceil(fontSize * 1.3)
  const bars = Math.max(1, Math.ceil(width / BAR_PITCH))
  const barRefs = useRef<Array<SVGRectElement | null>>([])

  const apply = useCallback((i: number, level: number) => {
    const bar = barRefs.current[i]
    if (bar) bar.style.transform = `scaleY(${0.35 + level * 0.65})`
  }, [])
  useLiveBars('phase', bars, apply)

  const textProps = {
    x: 0,
    y: fontSize,
    fontSize,
    fontWeight,
    fontFamily,
    letterSpacing,
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="inline-block overflow-visible align-middle" aria-label={text} role="img">
      <defs>
        <clipPath id={clipId}>
          <text {...textProps}>{text}</text>
        </clipPath>
        <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff007f" />
          <stop offset="55%" stopColor="#ffcc33" />
          <stop offset="100%" stopColor="#49e9ff" />
        </linearGradient>
      </defs>
      <text {...textProps} fill="rgba(255, 243, 216, 0.22)" style={{ filter: 'drop-shadow(0 0 6px rgba(255, 0, 127, 0.55))' }}>
        {text}
      </text>
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: bars }, (_, i) => (
          <rect
            key={i}
            ref={(el) => {
              barRefs.current[i] = el
            }}
            x={i * BAR_PITCH}
            y={0}
            width={BAR_PITCH - 1}
            height={height}
            fill={`url(#${gradientId})`}
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom', transform: 'scaleY(0.5)' }}
          />
        ))}
      </g>
    </svg>
  )
})
