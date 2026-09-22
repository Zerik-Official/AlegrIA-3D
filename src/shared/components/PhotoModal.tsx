import { memo } from 'react'
import { FiX, FiMaximize2, FiImage } from 'react-icons/fi'

/**
 * Props for {@link PhotoModal}.
 */
interface PhotoModalProps {
  /** Whether the modal is open. */
  open: boolean
  /** Image source. */
  src: string
  /** Title. */
  title: string
  /** Description. */
  description: string
  /** Close handler. */
  onClose: () => void
}

/**
 * Reusable sepia photo modal with Tailwind styling.
 * Shows enlarged image with sepia overlay and description.
 *
 * @param props - Modal state
 * @returns Modal overlay or null
 */
export const PhotoModal = memo(function PhotoModal({ open, src, title, description, onClose }: PhotoModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/68 p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex max-h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#c9a86a]/20 bg-[#0f0a04]/92 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#c9a86a]/10 px-5 py-3">
          <div className="flex items-center gap-2 text-parchment">
            <FiImage className="h-4 w-4 text-gold" />
            <span className="font-cinzel text-[11px] tracking-[0.18em] uppercase">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-parchment transition hover:bg-white/15"
            aria-label="Close"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <div className="relative flex flex-1 items-center justify-center bg-[#1a1208] p-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#c9a86a]/15 bg-[#704214]">
            <img src={src} alt={title} className="h-full w-full object-cover opacity-90 sepia-[0.85] contrast-[1.05]" onError={(e) => ((e.currentTarget.style.display = 'none'))} />
            <div className="pointer-events-none absolute inset-0 bg-[#ff8a1a]/[0.14] mix-blend-overlay" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.42)_100%)]" />
            <div className="absolute inset-0 flex items-center justify-center text-parchment/15">
              <FiMaximize2 className="h-10 w-10" />
            </div>
          </div>
        </div>
        <div className="border-t border-[#c9a86a]/10 bg-black/20 px-5 py-4">
          <p className="text-[13px] leading-6 tracking-[0.02em] text-parchment/70">{description}</p>
          <p className="mt-2 text-[11px] tracking-[0.12em] uppercase text-parchment/35">Click fuera o ESC para cerrar • Sepia naranja • Bahareque — lodo y troncos</p>
        </div>
      </div>
    </div>
  )
})
