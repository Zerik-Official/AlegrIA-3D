import { memo } from 'react'

/**
 * Props for {@link StoryTitle}.
 */
interface StoryTitleProps {
  /** Whether the title is showing; toggling fades it in and out. */
  visible: boolean
  /** Small caps line above the title. */
  eyebrow?: string
  /** Main line. */
  title: string
  /** Optional supporting line under the title. */
  subtitle?: string
  /** Vertical placement — `top` keeps the center of the screen clear for the scene. */
  placement?: 'top' | 'center'
}

/** Gold hairline with a small diamond at its center, framing the title plate above and below. */
const Ornament = memo(function Ornament() {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="h-px w-24 bg-linear-to-r from-transparent to-gold-bright/80" />
      <span className="h-1.5 w-1.5 rotate-45 bg-gold-bright shadow-[0_0_8px_rgba(255,204,51,0.9)]" />
      <span className="h-px w-24 bg-linear-to-l from-transparent to-gold-bright/80" />
    </div>
  )
})

/**
 * Temporary cinematic title the story uses to speak to the player (the book
 * asking to move on, the portal opening, the finale's farewell). Set on a dark,
 * blurred plate with gold hairlines and heavy text shadows so it stays legible
 * over any scene, from the bright carnival streets to the gloomy library.
 * Purely decorative: it never takes pointer events, so pointer lock and
 * movement keep working underneath it.
 *
 * @param props - Title copy and visibility
 * @returns Title overlay
 */
export const StoryTitle = memo(function StoryTitle({ visible, eyebrow, title, subtitle, placement = 'top' }: StoryTitleProps) {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 z-30 w-[min(92vw,780px)] -translate-x-1/2 transition-all duration-1000 ease-out ${
        placement === 'top' ? 'top-[12vh]' : 'top-1/2 -translate-y-1/2'
      } ${visible ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-sm scale-[0.97]'}`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-gold-bright/25 bg-[linear-gradient(180deg,rgba(14,9,4,0.82)_0%,rgba(8,5,2,0.9)_100%)] px-8 py-6 text-center shadow-[0_18px_60px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,220,140,0.12)] backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,196,80,0.16)_0%,transparent_65%)]" />
        <div className="relative">
          {eyebrow && <div className="font-cinzel text-[11px] tracking-[0.42em] uppercase text-gold-bright [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">{eyebrow}</div>}
          <div className="mt-3">
            <Ornament />
          </div>
          <div className="font-cinzel mt-3 text-[clamp(20px,3.2vw,32px)] leading-tight tracking-[0.12em] uppercase text-[#fff3dc] [text-shadow:0_2px_4px_rgba(0,0,0,0.95),0_0_24px_rgba(255,190,80,0.55)]">
            {title}
          </div>
          {subtitle && (
            <p className="mx-auto mt-3 max-w-150 text-[14px] leading-7 tracking-[0.04em] text-parchment [text-shadow:0_1px_4px_rgba(0,0,0,0.95)]">{subtitle}</p>
          )}
          <div className="mt-4">
            <Ornament />
          </div>
        </div>
      </div>
    </div>
  )
})
