import { memo } from 'react'
import { FiBookOpen } from 'react-icons/fi'
import { Modal } from '@/shared/components/Modal'
import type { BookPage } from '@/features/library/config/bookPages'

/**
 * Props for {@link BookPageModal}.
 */
interface BookPageModalProps {
  /** Page to show, or `null` when closed. */
  page: BookPage | null
  /** Closes the modal. */
  onClose: () => void
}

/**
 * Shows a page of the Libro de Rosa at full resolution. Every page sits in
 * the same fixed portrait frame, scaled to fit whole (`object-contain`) — no
 * edge is ever cropped, whatever the scan's proportions — with no filters or
 * tints over it, so every detail of the original comes through.
 *
 * @param props - Page and close action
 * @returns Page modal
 */
export const BookPageModal = memo(function BookPageModal({ page, onClose }: BookPageModalProps) {
  return (
    <Modal
      open={!!page}
      title={page?.title ?? ''}
      icon={<FiBookOpen className="h-4 w-4 text-gold" />}
      onClose={onClose}
      maxWidthClassName="max-w-[min(94vw,760px)]"
      footer={<p className="text-[11px] tracking-[0.12em] uppercase text-parchment/40">E, ESC o click fuera para cerrar</p>}
    >
      <div className="flex flex-1 items-center justify-center bg-[#120c06] p-4">
        <div className="relative aspect-3/4 h-[min(70vh,calc(94vw*4/3))] max-w-full overflow-hidden rounded-lg border border-gold/15 bg-[#0a0703]">
          {page && <img src={page.src} alt={page.title} className="absolute inset-0 h-full w-full object-contain" decoding="async" />}
        </div>
      </div>
    </Modal>
  )
})
