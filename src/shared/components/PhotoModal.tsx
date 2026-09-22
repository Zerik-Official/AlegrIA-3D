import { memo } from 'react'
import { FiMaximize2, FiImage } from 'react-icons/fi'
import { Modal } from '@/shared/components/Modal'

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
 * Sepia photo viewer built on the shared {@link Modal} shell.
 * Shows an enlarged image with a sepia overlay and description.
 *
 * @param props - Modal state
 * @returns Modal overlay or null
 */
export const PhotoModal = memo(function PhotoModal({ open, src, title, description, onClose }: PhotoModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      icon={<FiImage className="h-4 w-4 text-gold" />}
      onClose={onClose}
      footer={
        <>
          <p className="text-[13px] leading-6 tracking-[0.02em] text-parchment/70">{description}</p>
          <p className="mt-2 text-[11px] tracking-[0.12em] uppercase text-parchment/35">Click fuera o ESC para cerrar • Sepia naranja • Bahareque — lodo y troncos</p>
        </>
      }
    >
      <div className="relative flex flex-1 items-center justify-center bg-[#1a1208] p-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gold/15 bg-[#704214]">
          <img src={src} alt={title} className="h-full w-full object-cover opacity-90 sepia-[0.85] contrast-[1.05]" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <div className="pointer-events-none absolute inset-0 bg-[#ff8a1a]/[0.14] mix-blend-overlay" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.42)_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center text-parchment/15">
            <FiMaximize2 className="h-10 w-10" />
          </div>
        </div>
      </div>
    </Modal>
  )
})
