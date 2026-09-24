/**
 * Procedural "Rey Momo" dance: the rigid model bounces to a beat, sways side
 * to side and does a full twirl every few seconds, with a squash-and-stretch
 * on every landing.
 * @module features/phase2/components/parts/ReyMomoPerformer
 */

import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ModelLoader } from '@/models/shared/ModelLoader'

/** Props for {@link ReyMomoPerformer}. */
interface ReyMomoPerformerProps {
  /** Public URL to the `.glb`. */
  src: string
  /** Rendered while loading or when the asset is missing. */
  fallback: ReactNode
}

/** Hops per second. */
const HOP_HZ = 2
/** Seconds between twirls, and how long each one lasts. */
const TWIRL_PERIOD = 6
const TWIRL_DURATION = 1.4

/**
 * @param props - Model source and fallback
 * @returns Animated Rey Momo group
 */
export function ReyMomoPerformer({ src, fallback }: ReyMomoPerformerProps) {
  const ref = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime
    const phase = t * Math.PI * 2 * HOP_HZ
    const hop = Math.abs(Math.sin(phase * 0.5))
    g.position.y = hop * 0.22
    const squash = 1 - Math.pow(1 - hop, 6) * 0.06
    g.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash))
    const twirlT = t % TWIRL_PERIOD
    const twirl = twirlT < TWIRL_DURATION ? THREE.MathUtils.smootherstep(twirlT / TWIRL_DURATION, 0, 1) * Math.PI * 2 : 0
    g.rotation.y = Math.sin(t * Math.PI * HOP_HZ * 0.5) * 0.35 + twirl
    g.rotation.z = Math.sin(t * Math.PI * HOP_HZ * 0.5 + 1.2) * 0.07
  })

  return (
    <group ref={ref}>
      <ModelLoader src={src} fallback={fallback} />
    </group>
  )
}
