import { memo } from 'react'
import { FiEye, FiBookOpen } from 'react-icons/fi'

/**
 * Props for {@link CityIntroHUD}.
 */
interface CityIntroHUDProps {
  /** Whether the walk has reached the library door. */
  arrived: boolean
  /** Enters the library. */
  onEnter: () => void
}

/**
 * Minimal overlay for the city intro walk: a look-only hint while walking,
 * and an interact prompt once the library door is reached.
 *
 * @param props - HUD state
 * @returns HUD overlay
 */
export const CityIntroHUD = memo(function CityIntroHUD({ arrived, onEnter }: CityIntroHUDProps) {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-5 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.55)_100%)]" />

      <div className="pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 text-center">
        <div className="font-cinzel text-[11px] tracking-[0.3em] uppercase text-parchment/50">Escena -1 — Año 2050</div>
        <div className="font-cinzel mt-1.5 text-[20px] tracking-[0.06em] text-parchment drop-shadow-[0_2px_20px_rgba(120,180,255,0.4)]">
          Calle de la Ciudad Futura
        </div>
      </div>

      {!arrived && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[11px] tracking-[0.14em] uppercase text-parchment/60 backdrop-blur-md">
          <FiEye className="h-3.5 w-3.5 text-gold" /> Mouse — Mirar alrededor mientras caminas
        </div>
      )}

      {arrived && (
        <div className="flex justify-center">
          <button
            onClick={onEnter}
            className="pointer-events-auto fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 animate-pulse cursor-pointer items-center gap-3.5 rounded-full border border-[#ffdc78]/35 bg-[#0a080f]/85 px-7 py-3.5 shadow-[0_0_30px_rgba(255,180,40,0.25)] backdrop-blur-xl transition hover:scale-[1.02]"
          >
            <span className="flex h-7 items-center justify-center rounded-md bg-parchment px-2.5 text-[13px] font-bold text-[#1a1205] shadow-[0_2px_0_#b89a4a]">E</span>
            <span className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.14em] uppercase text-parchment">
              <FiBookOpen className="h-4 w-4 text-gold-bright" />
              Volver a la Biblioteca
            </span>
          </button>
        </div>
      )}
    </>
  )
})
