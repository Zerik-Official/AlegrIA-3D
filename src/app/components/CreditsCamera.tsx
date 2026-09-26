/**
 * The credits scene's cinematic camera: a slow, continuous orbit around
 * {@link CREDITS_CENTER}, always looking at Jafet dancing in the middle of the
 * room — no player control, the same way `WormholeCamera` fully owns the
 * camera during a crossing.
 * @module app/components/CreditsCamera
 */

import { memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CREDITS_CAMERA_HEIGHT, CREDITS_CAMERA_RADIUS, CREDITS_CENTER, CREDITS_LOOK_HEIGHT, CREDITS_ORBIT_PERIOD_S } from '@/features/credits/config/creditsConfig'

/** Props for {@link CreditsCamera}. */
interface CreditsCameraProps {
  /** Whether the orbit is driving the camera. */
  active: boolean
}

/** Reused so the orbit allocates nothing per frame. */
const lookTarget = new THREE.Vector3(CREDITS_CENTER[0], CREDITS_CENTER[1] + CREDITS_LOOK_HEIGHT, CREDITS_CENTER[2])

export const CreditsCamera = memo(function CreditsCamera({ active }: CreditsCameraProps) {
  useFrame(({ camera, clock }) => {
    if (!active) return
    const angle = (clock.elapsedTime / CREDITS_ORBIT_PERIOD_S) * Math.PI * 2
    camera.position.set(
      CREDITS_CENTER[0] + Math.cos(angle) * CREDITS_CAMERA_RADIUS,
      CREDITS_CENTER[1] + CREDITS_CAMERA_HEIGHT,
      CREDITS_CENTER[2] + Math.sin(angle) * CREDITS_CAMERA_RADIUS
    )
    camera.lookAt(lookTarget)
  })
  return null
})
