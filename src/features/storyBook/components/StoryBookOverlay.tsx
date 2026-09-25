import { memo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { StoryBook3D } from '@/features/storyBook/components/StoryBook3D'
import type { StoryBookStage } from '@/app/hooks/useStoryBookFlow'

/**
 * Props for {@link StoryBookOverlay}.
 */
interface StoryBookOverlayProps {
  /** Beat of the choreography. */
  stage: StoryBookStage
}

/** Rendered size of the book's own canvas, in px — scaled down while it rests in the corner. */
const CANVAS_SIZE = 340
/** Visual size of the book while resting over the dialogue/portal indicator, in px. */
const CORNER_SIZE = 190
/** Gap between the resting book and the viewport's right edge, in px — lines it up with the indicator below. */
const CORNER_RIGHT = 18
/** Gap between the resting book and the viewport's bottom edge, in px — clears the indicator (bottom 24px, ~34px tall). */
const CORNER_BOTTOM = 62
/** Scale the book shrinks to at the center as it pours itself into the portal. */
const RELEASE_SCALE = 0.2

/**
 * The Libro de Rosa floating over the dialogue indicator in the open phases,
 * in its own small transparent canvas so it stays a crisp HUD element no
 * matter where the player looks. It rests in the bottom-right corner while
 * `calm`/`restless`, glides to the center of the screen and grows while
 * `summoning`, and once the portal opens it contracts into a spark and
 * vanishes, as if it had poured itself into the portal ahead.
 *
 * @param props - Current stage
 * @returns Overlay element, or `null` while hidden
 */
export const StoryBookOverlay = memo(function StoryBookOverlay({ stage }: StoryBookOverlayProps) {
  if (stage === 'hidden') return null
  const centered = stage === 'summoning' || stage === 'portal'
  const releasing = stage === 'portal'
  const scale = !centered ? CORNER_SIZE / CANVAS_SIZE : releasing ? RELEASE_SCALE : 1.15
  const offset = (CANVAS_SIZE * scale) / 2
  const transform = centered
    ? `translate(calc(50vw - ${offset}px), calc(50vh - ${offset}px)) scale(${scale})`
    : `translate(calc(100vw - ${CORNER_SIZE + CORNER_RIGHT}px), calc(100vh - ${CORNER_SIZE + CORNER_BOTTOM}px)) scale(${scale})`

  return (
    <>
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
          camera={{ fov: 35, position: [0, 0, 3.3] }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <StoryBook3D stage={stage} />
        </Canvas>
      </div>
      {releasing && (
        <div className="pointer-events-none fixed top-1/2 left-1/2 z-25 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,240,200,0.85)_0%,rgba(255,196,90,0.35)_30%,transparent_68%)] opacity-0 animate-[storybook-flash_1.1s_ease-out_0.6s_forwards]" />
      )}
    </>
  )
})
