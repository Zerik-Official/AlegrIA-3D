import { memo, useLayoutEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { StoryBook3D } from '@/features/storyBook/components/StoryBook3D'
import { NarrationIndicator } from '@/features/ui/components/NarrationIndicator'
import type { StoryBookStage } from '@/app/hooks/useStoryBookFlow'

/**
 * Props for {@link StoryBookOverlay}.
 */
interface StoryBookOverlayProps {
  /** Beat of the choreography — `hidden` leaves just the countdown pill. */
  stage: StoryBookStage
  /** Seconds left in the narration, for the pill under the book. */
  audioRemainingSec: number | null
  /** Seconds left until the portal opens, for the pill under the book once the narration is over. */
  portalCountdownSec: number | null
}

/** Rendered size of the book's own canvas, in px — scaled down to fit its slot while resting. */
const CANVAS_SIZE = 340
/** Size of the slot the resting book floats in, right above the countdown pill, in px. */
const SLOT_SIZE = 180
/** Scale of the book at the center of the screen while summoning. */
const SUMMON_SCALE = 1.15
/** Scale the book shrinks to at the center as it pours itself into the portal. */
const RELEASE_SCALE = 0.2

/** A measured slot rectangle, in viewport px. */
interface SlotRect {
  left: number
  top: number
  size: number
}

/**
 * The open phases' bottom-right dock: the Libro de Rosa floating in its own
 * small transparent canvas, centered right above the countdown pill (the
 * narration's, then the portal's). The book rests in its slot while
 * `calm`/`restless`, glides to the center of the screen and grows while
 * `summoning`, and once the portal opens contracts into a spark and vanishes,
 * as if it had poured itself into the portal ahead. The slot is measured
 * rather than assumed, so the book stays centered over the pill whatever its
 * width.
 *
 * @param props - Stage and countdowns
 * @returns Dock and floating book
 */
export const StoryBookOverlay = memo(function StoryBookOverlay({ stage, audioRemainingSec, portalCountdownSec }: StoryBookOverlayProps) {
  const slotRef = useRef<HTMLDivElement>(null)
  const [slot, setSlot] = useState<SlotRect | null>(null)
  const showBook = stage !== 'hidden'

  useLayoutEffect(() => {
    const el = slotRef.current
    if (!el) {
      setSlot(null)
      return
    }
    const measure = (): void => {
      const r = el.getBoundingClientRect()
      setSlot({ left: r.left, top: r.top, size: r.width })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.parentElement) observer.observe(el.parentElement)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [showBook])

  const centered = stage === 'summoning' || stage === 'portal'
  const releasing = stage === 'portal'
  let transform = 'scale(0)'
  if (slot) {
    if (centered) {
      const scale = releasing ? RELEASE_SCALE : SUMMON_SCALE
      const offset = (CANVAS_SIZE * scale) / 2
      transform = `translate(calc(50vw - ${offset}px), calc(50vh - ${offset}px)) scale(${scale})`
    } else {
      transform = `translate(${slot.left}px, ${slot.top}px) scale(${slot.size / CANVAS_SIZE})`
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed right-6 bottom-6 z-10 flex flex-col items-center gap-2">
        {showBook && <div ref={slotRef} style={{ width: SLOT_SIZE, height: SLOT_SIZE }} />}
        <NarrationIndicator audioRemainingSec={audioRemainingSec} portalCountdownSec={portalCountdownSec} />
      </div>

      {showBook && slot && (
        <div
          className="pointer-events-none fixed top-0 left-0 z-20"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            transformOrigin: 'top left',
            transform,
            opacity: releasing ? 0 : 1,
            transition: releasing
              ? 'transform 0.9s cubic-bezier(0.7, 0, 0.84, 0), opacity 0.9s ease-in'
              : 'transform 1.9s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.6s ease-out',
          }}
        >
          <div
            className={`absolute inset-[22%] rounded-full blur-2xl transition-opacity duration-700 ${stage === 'calm' ? 'opacity-35' : 'opacity-80'}`}
            style={{ background: 'radial-gradient(circle, rgba(255,204,85,0.5) 0%, rgba(255,150,40,0.12) 55%, transparent 72%)' }}
          />
          <Canvas
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
            camera={{ fov: 35, position: [0, 0, 2.7] }}
            style={{ width: '100%', height: '100%', background: 'transparent' }}
          >
            <StoryBook3D stage={stage} />
          </Canvas>
        </div>
      )}
      {releasing && (
        <div className="pointer-events-none fixed top-1/2 left-1/2 z-25 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,240,200,0.85)_0%,rgba(255,196,90,0.35)_30%,transparent_68%)] opacity-0 animate-[storybook-flash_1.1s_ease-out_0.6s_forwards]" />
      )}
    </>
  )
})
