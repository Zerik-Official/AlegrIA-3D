/**
 * HUD pill showing how long until Phase 1's next street flood.
 * @module features/phase1/components/Phase1FloodTimer
 */

import { usePhase1FloodCountdown } from '@/features/phase1/hooks/usePhase1FloodCountdown'

/**
 * @returns Fixed-position countdown pill
 */
export function Phase1FloodTimer() {
  const { isFlooding, secondsUntilNext } = usePhase1FloodCountdown()

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#3d2b1f]/15 bg-[#0a0f1e]/90 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-parchment shadow backdrop-blur">
      {isFlooding ? 'La calle se está inundando' : `Próxima inundación en ${secondsUntilNext}s`}
    </div>
  )
}
