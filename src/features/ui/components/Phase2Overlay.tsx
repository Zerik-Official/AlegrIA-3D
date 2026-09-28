import { memo } from 'react'

/**
 * Props for {@link Phase2Overlay}.
 */
interface Phase2OverlayProps {
  /** Dismisses the intro and starts exploring. */
  onExplore: () => void
}

/**
 * Phase 2's intro card — Época Dorada, Tradición y Carnaval — shown on
 * arrival until the player starts exploring.
 *
 * @param props - Overlay actions
 * @returns Intro overlay
 */
export const Phase2Overlay = memo(function Phase2Overlay({ onExplore }: Phase2OverlayProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(40,14,30,0.96)_0%,rgba(10,4,14,0.98)_75%)] p-8 text-center">
      <div className="font-cinzel text-[11px] tracking-[0.42em] uppercase text-[#ff8ad2]/70">Fase 2 — Época Dorada (1919–1950s)</div>
      <h1 className="font-cinzel mt-3 text-[clamp(28px,6vw,54px)] leading-[1.1] tracking-[0.18em] uppercase text-[#ffe0f0] drop-shadow-[0_0_30px_rgba(255,90,160,0.45)]">
        Tradición y Carnaval
      </h1>
      <p className="mx-auto mt-6 max-w-140 text-[14px] leading-7 tracking-[0.04em] text-white/70">
        Quinta de Turín (1919), Parroquia Sagrado Corazón (1920–22), radio de tubos con béisbol, fiesta de San Martín y disfraces.
        <br />
        Fachadas coloridas, trinitarias 3D y la silueta gótica iluminada te esperan.
      </p>
      <button
        onClick={onExplore}
        className="mt-9 inline-flex cursor-pointer items-center gap-3 rounded-full bg-linear-to-b from-[#ff8ad2] to-[#c94a8a] px-8 py-4 text-[13px] font-bold tracking-[0.18em] uppercase text-white shadow-[0_8px_30px_rgba(255,90,150,0.35)]"
      >
        Explorar el Carnaval
      </button>
    </div>
  )
})
