/**
 * The credits scene's cinematic camera: a slow, continuous orbit around.
 * @module app/components/CreditsCamera
 */

import { memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { CREDITS_CAMERA_HEIGHT, CREDITS_CAMERA_RADIUS, CREDITS_CENTER, CREDITS_LOOK_HEIGHT, CREDITS_ORBIT_PERIOD_S } from '@/features/credits/config/creditsConfig'

/** Props for {@link CreditsCamera}. */
interface CreditsCameraProps {
  /** Whether the orbit is driving the camera. */
  active: boolean
  /** XZ the orbit follows; falls back to {@link CREDITS_CENTER} when omitted. */
  focus?: [number, number] | null
}

export const CreditsCamera = memo(function CreditsCamera({ active, focus }: CreditsCameraProps) {
  useFrame(({ camera, clock }) => {
    if (!active) return
    const fx = focus?.[0] ?? CREDITS_CENTER[0]
    const fz = focus?.[1] ?? CREDITS_CENTER[2]
    const angle = (clock.elapsedTime / CREDITS_ORBIT_PERIOD_S) * Math.PI * 2
    camera.position.set(fx + Math.cos(angle) * CREDITS_CAMERA_RADIUS, CREDITS_CENTER[1] + CREDITS_CAMERA_HEIGHT, fz + Math.sin(angle) * CREDITS_CAMERA_RADIUS)
    camera.lookAt(fx, CREDITS_CENTER[1] + CREDITS_LOOK_HEIGHT, fz)
  })
  return null
})
