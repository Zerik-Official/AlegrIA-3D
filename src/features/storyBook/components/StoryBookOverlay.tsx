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
const CANVAS_SIZE = 320
/** Visual size of the book while resting over the dialogue indicator, in px. */
const CORNER_SIZE = 130
/** Gap kept between the resting book and the viewport's right/bottom edges (the dialogue indicator sits below it), in px. */
const CORNER_RIGHT = 20
const CORNER_BOTTOM = 70

/**
 * The Libro de Rosa floating over the dialogue indicator in the open phases,
 * in its own small transparent canvas so it stays a crisp HUD element no
 * matter where the player looks. It rests in the bottom-right corner while
 * `calm`/`restless`, glides to the center of the screen and scales up while
 * `summoning`, and fades into a burst of light once the portal opens.
 *
 * @param props - Current stage
 * @returns Overlay element, or `null` while hidden
 */
export const StoryBookOverlay = memo(function StoryBookOverlay({ stage }: StoryBookOverlayProps) {
  if (stage === 'hidden') return null
  const centered = stage === 'summoning' || stage === 'portal'
  const cornerScale = CORNER_SIZE / CANVAS_SIZE
  const centerScale = stage === 'portal' ? 1.6 : 1
  const centerOffset = (CANVAS_SIZE * centerScale) / 2
  const transform = centered
    ? `translate(calc(50vw - ${centerOffset}px), calc(50vh - ${centerOffset}px)) scale(${centerScale})`
    : `translate(calc(100vw - ${CORNER_SIZE + CORNER_RIGHT}px), calc(100vh - ${CORNER_SIZE + CORNER_BOTTOM}px)) scale(${cornerScale})`

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 left-0 z-20"
        style={{
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          transformOrigin: 'top left',
          transform,
          opacity: stage === 'portal' ? 0 : 1,
          transition: 'transform 1.9s cubic-bezier(0.65, 0, 0.35, 1), opacity 1.2s ease-out',
        }}
      >
        <div
          className={`absolute inset-[18%] rounded-full blur-2xl transition-opacity duration-700 ${stage === 'calm' ? 'opacity-40' : 'opacity-90'}`}
          style={{ background: 'radial-gradient(circle, rgba(255,204,85,0.55) 0%, rgba(255,150,40,0.15) 55%, transparent 75%)' }}
        />
        <Canvas
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          camera={{ fov: 35, position: [0, 0, 4.2] }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <StoryBook3D stage={stage} />
        </Canvas>
      </div>
      <div
        className={`pointer-events-none fixed inset-0 z-25 bg-[radial-gradient(circle_at_center,rgba(255,244,214,0.95)_0%,rgba(255,214,120,0.35)_35%,transparent_70%)] transition-opacity ${
          stage === 'portal' ? 'animate-[storybook-flash_1.6s_ease-out_forwards]' : 'opacity-0'
        }`}
      />
    </>
  )
})
