/**
 * Wraps a loaded model in a procedurally animated group — carnival dancers
 * with no baked animation get one of three deterministic performance styles.
 * @module features/phase2/components/parts/DancerPerformer
 */

import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'

/** Props for {@link DancerPerformer}. */
interface DancerPerformerProps {
  /** Public URL to the dancer's `.glb`. */
  src: string
  /** Fallback rendered when the asset cannot be loaded. */
  fallback: ReactNode
  /** Deterministic float in `[0, 1)` — picks the performance style and paces it. */
  seed: number
}

const SWING_AMPLITUDE = THREE.MathUtils.degToRad(155)

/**
 * @param props - Model source and seed
 * @returns Group that spins, swings or hops the model in place
 */
export function DancerPerformer({ src, fallback, seed }: DancerPerformerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const style = seed < 0.4 ? 'spin' : seed < 0.75 ? 'swing' : 'jump'
  const phase = seed * 40

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const t = clock.elapsedTime + phase

    if (style === 'spin') {
      group.rotation.y = t * (0.5 + seed * 0.5)
    } else if (style === 'swing') {
      group.rotation.y = Math.sin(t * (0.55 + seed * 0.3)) * SWING_AMPLITUDE
    } else {
      group.rotation.y = Math.sin(t * 0.35) * 0.35
      group.position.y = Math.abs(Math.sin(t * 1.8)) * 0.22
    }
  })

  return (
    <group ref={groupRef}>
      <ModelLoader src={src} fallback={fallback} />
    </group>
  )
}
