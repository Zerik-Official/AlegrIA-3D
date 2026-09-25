import { memo, type ReactNode } from 'react'

/**
 * Props for {@link PortalPrompt}.
 */
interface PortalPromptProps {
  /** Whether the player is in range and the prompt shows. */
  visible: boolean
  /** Button label. */
  children: ReactNode
  /** Runs the interaction. */
  onActivate: () => void
  /** Glow color of the button's border and shadow, as an `r, g, b` triple. */
  glowRgb: string
  /** Whether a click anywhere on screen also activates it — off while the editor owns the mouse. */
  catchClicks?: boolean
  /** Tooltip for the full-screen click catcher. */
  catcherTitle?: string
}

/**
 * The bottom-center interaction prompt shown in range of a portal or the
 * book: a glowing button, plus (with pointer lock the cursor is hidden, so
 * the button can't be aimed at) a transparent full-screen catcher that
 * turns any click into the same interaction.
 *
 * @param props - Visibility, label, action and tint
 * @returns Prompt elements, or `null` when hidden
 */
export const PortalPrompt = memo(function PortalPrompt({ visible, children, onActivate, glowRgb, catchClicks = true, catcherTitle = 'Click para atravesar al portal' }: PortalPromptProps) {
  if (!visible) return null
  return (
    <>
      <button
        onClick={onActivate}
        style={{ borderColor: `rgba(${glowRgb}, 0.4)`, boxShadow: `0 0 30px rgba(${glowRgb}, 0.35)` }}
        className="pointer-events-auto fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-3 rounded-full border bg-[#0a0f1e]/85 px-6 py-3 text-[13px] font-semibold tracking-[0.14em] uppercase text-parchment backdrop-blur-xl"
      >
        {children}
      </button>
      {catchClicks && (
        <div onClick={onActivate} style={{ position: 'fixed', inset: 0, zIndex: 9, cursor: 'pointer', pointerEvents: 'auto' }} title={catcherTitle} />
      )}
    </>
  )
})
