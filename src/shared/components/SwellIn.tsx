import { memo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link SwellIn}.
 */
interface SwellInProps {
  /** Content that swells into existence. */
  children: ReactNode
  /** How long the swell takes, in seconds. */
  duration?: number
}

/** Overshoot of the back-out easing — how far past full size the content swells before settling. */
const OVERSHOOT = 1.70158

/**
 * Scales its children up from nothing with a back-out ease the moment it
 * mounts, so things the story conjures (portals, mostly) open with a little
 * overshoot instead of popping into the scene.
 *
 * @param props - Content and swell duration
 * @returns Scaling group
 */
export const SwellIn = memo(function SwellIn({ children, duration = 1.6 }: SwellInProps) {
  const ref = useRef<THREE.Group>(null)
  const startedAt = useRef<number | null>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    if (startedAt.current === null) startedAt.current = clock.elapsedTime
    const k = THREE.MathUtils.clamp((clock.elapsedTime - startedAt.current) / duration, 0, 1)
    const eased = 1 + (OVERSHOOT + 1) * Math.pow(k - 1, 3) + OVERSHOOT * Math.pow(k - 1, 2)
    const s = Math.max(0.001, eased)
    ref.current.scale.set(s, s, s)
  })

  return (
    <group ref={ref} scale={0.001}>
      {children}
    </group>
  )
})
