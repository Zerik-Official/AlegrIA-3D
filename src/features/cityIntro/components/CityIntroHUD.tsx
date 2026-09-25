import { memo } from 'react'
import { FiEye, FiMove, FiClock } from 'react-icons/fi'
import { PortalPrompt } from '@/app/components/hud/PortalPrompt'

/**
 * Props for {@link CityIntroHUD}.
 */
interface CityIntroHUDProps {
  /** Whether the scripted walk has handed over to free roaming (narration over and the library reached). */
  freeRoam: boolean
  /** Seconds remaining in the current narration/dialogue; `null` to hide. */
  audioRemainingSec?: number | null
  /** Whether the player is in range of RIWI Barranquilla's credits door. */
  nearCreditsDoor?: boolean
  /** Enters the credits scene. */
  onEnterCredits?: () => void
}

/**
 * Minimal overlay for the finale's walk: a look-only hint while the camera
 * rides the street, and a movement hint once the player is free to roam.
 *
 * @param props - HUD state
 * @returns HUD overlay
 */
export const CityIntroHUD = memo(function CityIntroHUD({ freeRoam, audioRemainingSec, nearCreditsDoor = false, onEnterCredits = () => {} }: CityIntroHUDProps) {
  const showCountdown = typeof audioRemainingSec === 'number' && Number.isFinite(audioRemainingSec) && audioRemainingSec > 0.35
  const countdownSec = showCountdown ? Math.ceil(audioRemainingSec as number) : 0
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-5 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.55)_100%)]" />

      <div className="pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 text-center">
        <div className="font-cinzel text-[11px] tracking-[0.3em] uppercase text-parchment/50">Escena -1 — Barrio Abajo 2050</div>
        <div className="font-cinzel mt-1.5 text-[20px] tracking-[0.06em] text-parchment drop-shadow-[0_2px_20px_rgba(120,180,255,0.4)]">
          Futurismo Abajero
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-8 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[11px] tracking-[0.14em] uppercase text-parchment/60 backdrop-blur-md">
        {freeRoam ? (
          <>
            <FiMove className="h-3.5 w-3.5 text-gold" /> WASD — Explorar libremente • Shift — Correr
          </>
        ) : (
          <>
            <FiEye className="h-3.5 w-3.5 text-gold" /> Mouse — Mirar alrededor mientras caminas
          </>
        )}
      </div>

      <PortalPrompt visible={freeRoam && nearCreditsDoor} onActivate={onEnterCredits} glowRgb="168, 85, 255" catcherTitle="Click para ver la escena de créditos">
        Ver escena de créditos
      </PortalPrompt>

      {showCountdown && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-10 flex items-center gap-2 rounded-md border border-gold/20 bg-black/45 px-3 py-2 text-[11px] tracking-[0.14em] uppercase text-parchment/70 backdrop-blur-md">
          <FiClock className="h-3.5 w-3.5 opacity-80 text-gold" />
          <span>
            Diálogo: <span className="text-gold-bright font-semibold tabular-nums">{countdownSec}s</span>
          </span>
        </div>
      )}
    </>
  )
})
