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

/**
 * Temporary cinematic title the story uses to speak to the player (the book
 * asking to move on, the portal opening, the finale's farewell). Purely
 * decorative: it never takes pointer events, so pointer lock and movement
 * keep working underneath it.
 *
 * @param props - Title copy and visibility
 * @returns Title overlay
 */
export const StoryTitle = memo(function StoryTitle({ visible, eyebrow, title, subtitle, placement = 'top' }: StoryTitleProps) {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 z-30 w-[min(92vw,760px)] -translate-x-1/2 text-center transition-all duration-1000 ease-out ${
        placement === 'top' ? 'top-[14vh]' : 'top-1/2 -translate-y-1/2'
      } ${visible ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'}`}
    >
      {eyebrow && <div className="font-cinzel text-[11px] tracking-[0.42em] uppercase text-gold-bright/80">{eyebrow}</div>}
      <div className="font-cinzel mt-2 text-[clamp(20px,3.4vw,34px)] leading-tight tracking-[0.12em] uppercase text-parchment drop-shadow-[0_0_28px_rgba(255,200,90,0.55)]">
        {title}
      </div>
      {subtitle && <p className="mx-auto mt-3 max-w-150 text-[14px] leading-7 tracking-[0.04em] text-parchment/75 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">{subtitle}</p>}
    </div>
  )
})
