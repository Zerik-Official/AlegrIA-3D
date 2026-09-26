/**
 * Equalizer bars pulsing up and down behind a line of text, like a volume
 * meter — drawn behind the sound designer's name in the credits.
 * @module features/credits/components/SoundBars
 */

import { memo, useMemo } from 'react'

/**
 * Props for {@link SoundBars}.
 */
interface SoundBarsProps {
  /** How many bars span the text's width. */
  count: number
}

/**
 * Absolutely positioned: fills its (relatively positioned) parent from the
 * bottom, behind the text. Each bar has its own tempo and phase, derived
 * from its index so the pattern never looks mechanical yet stays stable.
 * @param props - Bar count
 * @returns Bars layer
 */
export const SoundBars = memo(function SoundBars({ count }: SoundBarsProps) {
  const bars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        duration: 0.42 + ((i * 37) % 11) * 0.045,
        delay: -((i * 53) % 17) * 0.06,
        hue: i / Math.max(1, count - 1),
      })),
    [count]
  )

  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-[0.1em] -top-[0.15em] -z-10 flex items-end justify-between gap-[2px] opacity-70">
      {bars.map((bar, i) => (
        <span
          key={i}
          className="h-full flex-1 origin-bottom rounded-t-[2px]"
          style={{
            background: `linear-gradient(to top, #ff007f, ${bar.hue > 0.5 ? '#ffcc33' : '#49e9ff'})`,
            boxShadow: '0 0 8px rgba(255, 0, 127, 0.45)',
            animation: `credits-eq ${bar.duration}s ease-in-out ${bar.delay}s infinite alternate`,
          }}
        />
      ))}
    </span>
  )
})
