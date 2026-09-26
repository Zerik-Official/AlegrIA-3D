/**
 * The partners' logos side by side in equal glass tiles.
 * @module shared/components/PartnerLogos
 */

import { memo } from 'react'
import { PARTNERS } from '@/shared/config/partners'

/**
 * Props for {@link PartnerLogos}.
 */
interface PartnerLogosProps {
  /** Classes of each tile, which set its size. */
  tileClassName?: string
  /** Seconds before the tiles start popping in one after another; no entrance when omitted. */
  entranceDelay?: number
}

/**
 * @param props - Tile size and optional staggered entrance
 * @returns Row of logo tiles
 */
export const PartnerLogos = memo(function PartnerLogos({ tileClassName = 'h-12 w-24 sm:h-16 sm:w-32', entranceDelay }: PartnerLogosProps) {
  return (
    <div className="flex items-center gap-2">
      {PARTNERS.map((partner, i) => (
        <div
          key={partner.name}
          title={partner.name}
          className={`flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 shadow-[0_6px_20px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white/10 ${tileClassName}`}
          style={entranceDelay === undefined ? undefined : { animation: `start-rise 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) ${entranceDelay + i * 0.15}s both` }}
        >
          <img src={partner.src} alt={partner.name} className={`h-full w-full object-contain ${partner.invert ? 'brightness-0 invert' : ''}`} draggable={false} />
        </div>
      ))}
    </div>
  )
})