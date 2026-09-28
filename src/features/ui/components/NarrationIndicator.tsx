import { memo } from 'react'
import { FiClock } from 'react-icons/fi'
import { LuOrbit } from 'react-icons/lu'

/**
 * Props for {@link NarrationIndicator}.
 */
interface NarrationIndicatorProps {
  /** Seconds left in the current narration; `null` to not show it. */
  audioRemainingSec?: number | null
  /** Seconds left until the Libro de Rosa opens the portal, shown once the narration is over; `null` to not show it. */
  portalCountdownSec?: number | null
}

/**
 * The bottom-right countdown pill: the narration's remaining seconds while it
 * plays, then (in the open phases) the seconds left until the portal opens.
 * Renders nothing when there is nothing to count down. Not positioned itself —
 * whoever places it decides where it sits.
 *
 * @param props - Countdowns
 * @returns Countdown pill, or `null`
 */
export const NarrationIndicator = memo(function NarrationIndicator({ audioRemainingSec, portalCountdownSec }: NarrationIndicatorProps) {
  const dialogueRunning = typeof audioRemainingSec === 'number' && Number.isFinite(audioRemainingSec) && audioRemainingSec > 0.35
  if (dialogueRunning) {
    return (
      <div className="pointer-events-none flex items-center gap-2 rounded-md border border-gold/20 bg-black/45 px-3 py-2 text-[11px] tracking-[0.14em] uppercase text-parchment/70 backdrop-blur-md">
        <FiClock className="h-3.5 w-3.5 opacity-80 text-gold" />
        <span>
          Diálogo: <span className="text-gold-bright font-semibold tabular-nums">{Math.ceil(audioRemainingSec as number)}s</span>
        </span>
      </div>
    )
  }
  if (typeof portalCountdownSec === 'number') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="pointer-events-none flex items-center gap-2 rounded-md border border-[#78b4ff]/30 bg-black/55 px-3 py-2 text-[11px] tracking-[0.14em] uppercase text-parchment/75 shadow-[0_0_18px_rgba(90,160,255,0.25)] backdrop-blur-md">
          <LuOrbit className="h-3.5 w-3.5 animate-spin text-[#a8c8ff] [animation-duration:3s]" />
          <span>
            Portal en: <span className="font-semibold tabular-nums text-[#cfe0ff]">{portalCountdownSec}s</span>
          </span>
        </div>
        <div className="pointer-events-none rounded-md bg-black/40 px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase text-parchment/55 backdrop-blur-md">
          Presiona <span className="font-semibold text-[#cfe0ff]">T</span> para saltar la espera
        </div>
      </div>
    )
  }
  return null
})