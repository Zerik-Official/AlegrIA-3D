/**
 * Gently turns the camera towards a point of interest while a story beat
 * plays, without taking the mouse away from the player.
 * @module app/components/CinematicLookAt
 */

import { memo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link CinematicLookAt}.
 */
interface CinematicLookAtProps {
  /** Whether the camera is being guided. */
  active: boolean
  /** World point the camera turns to face. */
  target: [number, number, number]
  /** Fraction of the remaining turn covered each frame — higher is firmer. */
  strength?: number
}

/** Reused matrix/quaternion/vectors so the guide allocates nothing per frame. */
const scratch = {
  matrix: new THREE.Matrix4(),
  quat: new THREE.Quaternion(),
  target: new THREE.Vector3(),
  up: new THREE.Vector3(0, 1, 0),
}

/**
 * Slerps the camera towards facing `target` every frame while active. Works
 * alongside `PointerLockControls`, which re-reads the camera's orientation on
 * each mouse move, so the player can still glance around — the guide just
 * keeps drawing their eye back to the moment that matters.
 *
 * @param props - Guide state
 * @returns Null (side-effect only)
 */
export const CinematicLookAt = memo(function CinematicLookAt({ active, target, strength = 0.05 }: CinematicLookAtProps) {
  useFrame(({ camera }) => {
    if (!active) return
    scratch.target.set(target[0], target[1], target[2])
    scratch.matrix.lookAt(camera.position, scratch.target, scratch.up)
    scratch.quat.setFromRotationMatrix(scratch.matrix)
    camera.quaternion.slerp(scratch.quat, strength)
  })
  return null
})
