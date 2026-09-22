import { memo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FiX } from 'react-icons/fi'

/**
 * Props for {@link Modal}.
 */
interface ModalProps {
  /** Whether the modal is open. */
  open: boolean
  /** Title shown in the header. */
  title: string
  /** Icon element shown before the title. */
  icon?: ReactNode
  /** Close handler, fired on backdrop click, the close button, or `Escape`. */
  onClose: () => void
  /** Modal body content. */
  children: ReactNode
  /** Optional footer content (e.g. hints, actions). */
  footer?: ReactNode
  /** Max width Tailwind class for the panel. Defaults to `max-w-3xl`. */
  maxWidthClassName?: string
}

/**
 * Reusable dark-glass modal shell shared by every overlay in the app
 * (photo viewer, model browser, ...). Owns the backdrop, header and close
 * affordances; callers only provide the body/footer content.
 *
 * @param props - Modal state and content
 * @returns Modal overlay or null when closed
 */
export const Modal = memo(function Modal({ open, title, icon, onClose, children, footer, maxWidthClassName = 'max-w-3xl' }: ModalProps) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/68 p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`relative flex max-h-[86vh] w-full ${maxWidthClassName} flex-col overflow-hidden rounded-2xl border border-gold/20 bg-[#0f0a04]/92 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gold/10 px-5 py-3">
          <div className="flex items-center gap-2 text-parchment">
            {icon}
            <span className="font-cinzel text-[11px] tracking-[0.18em] uppercase">{title}</span>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2 text-parchment transition hover:bg-white/15" aria-label="Close">
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <div className="relative flex flex-1 flex-col overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-gold/10 bg-black/20 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  )
})
