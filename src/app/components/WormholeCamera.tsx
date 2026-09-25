/**
 * Animates the camera FOV and subtle shake during the wormhole transition.
 * @module app/components/WormholeCamera
 */

import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { appConfig } from '@/shared/config/appConfig'

/**
 * Props for {@link WormholeCamera}.
 */
interface WormholeCameraProps {
  /** Whether camera animation is active. */
  active: boolean
  /** Normalized progress in [0,1]. */
  progress: number
  /**
   * What the camera is drawn to: `book` circles in on the levitating book over
   * the pedestal (the default), `portal` flies up to the portal at `focus`
   * and dives through it (the restored library's crossing into the future).
   */
  mode?: 'book' | 'portal'
  /** World position of the portal the camera dives into in `portal` mode. */
  focus?: [number, number, number]
  /** Y rotation turning that portal's face (its local `+Z`) towards the player. */
  focusYaw?: number
}

/** The camera's everyday field of view (the canvas default), eased back to once a wormhole ends. */
const REST_FOV = 72

/** Distance in front of the portal the camera settles at before diving in. */
const PORTAL_APPROACH_DIST = 3.2
/** How far past the portal's plane the dive carries the camera. */
const PORTAL_DIVE_DEPTH = 1.6

/** Reused vectors/quaternion/matrix so the portal flight allocates nothing per frame. */
const scratch = {
  target: new THREE.Vector3(),
  look: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  quat: new THREE.Quaternion(),
  matrix: new THREE.Matrix4(),
  up: new THREE.Vector3(0, 1, 0),
}

/**
 * Uses lerp for smooth FOV and random jitter scaled by progress.
 *
 * @param props - Camera animation state
 * @returns Null (side-effect only)
 */
export const WormholeCamera = memo(function WormholeCamera({ active, progress, mode = 'book', focus = [0, 1.55, -9.8], focusYaw = 0 }: WormholeCameraProps) {
  const initialPos = useRef<THREE.Vector3 | null>(null)
  const initialQuat = useRef<THREE.Quaternion | null>(null)
  useFrame(({ camera }) => {
    if (!active) {
      initialPos.current = null
      initialQuat.current = null
      const cam = camera as THREE.PerspectiveCamera
      if (cam.fov !== undefined && Math.abs(cam.fov - REST_FOV) > 0.05) {
        cam.fov = THREE.MathUtils.lerp(cam.fov, REST_FOV, 0.08)
        cam.updateProjectionMatrix()
      }
      return
    }
    if (!initialPos.current) {
      initialPos.current = camera.position.clone()
      initialQuat.current = camera.quaternion.clone()
    }
    const fovTarget = appConfig.wormhole.fov.from + progress * (appConfig.wormhole.fov.to - appConfig.wormhole.fov.from)
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== undefined) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, fovTarget, appConfig.wormhole.fov.lerp)
      cam.updateProjectionMatrix()
    }
    if (mode === 'portal') {
      const dive = THREE.MathUtils.smoothstep(progress, 0.3, 0.6)
      const dist = PORTAL_APPROACH_DIST - dive * (PORTAL_APPROACH_DIST + PORTAL_DIVE_DEPTH)
      scratch.normal.set(Math.sin(focusYaw), 0, Math.cos(focusYaw))
      scratch.target.set(focus[0], focus[1] + 0.1, focus[2]).addScaledVector(scratch.normal, dist)
      camera.position.lerp(scratch.target, progress < 0.3 ? 0.035 : 0.07)
      scratch.look.set(focus[0], focus[1], focus[2]).addScaledVector(scratch.normal, -8)
      scratch.matrix.lookAt(camera.position, scratch.look, scratch.up)
      scratch.quat.setFromRotationMatrix(scratch.matrix)
      camera.quaternion.slerp(scratch.quat, 0.05)
      const shake = progress < 0.55 ? progress * 0.18 : (1 - progress) * 0.12
      camera.position.x += (Math.random() - 0.5) * shake * appConfig.wormhole.shake.x
      camera.position.y += (Math.random() - 0.5) * shake * appConfig.wormhole.shake.y
      return
    }
    const bookPos = new THREE.Vector3(0, 1.78, 0)
    const dir = camera.position.clone().sub(bookPos).normalize()
    if (dir.lengthSq() < 0.01) dir.set(0, 0, 1)
    const targetDist = 5.2 + progress * 0.35
    const targetPos = bookPos.clone().add(dir.multiplyScalar(targetDist))
    targetPos.y = THREE.MathUtils.lerp(camera.position.y, 1.92, progress * 0.22)
    if (progress < 0.48) {
      camera.position.lerp(targetPos, 0.045)
      const targetQuat = new THREE.Quaternion()
      const m = new THREE.Matrix4().lookAt(camera.position, bookPos, new THREE.Vector3(0, 1, 0))
      targetQuat.setFromRotationMatrix(m)
      camera.quaternion.slerp(targetQuat, 0.055)
    } else {
      camera.position.lerp(targetPos, 0.015)
    }
    const shake = progress < 0.72 ? progress * 0.42 : (1 - progress) * 0.18
    camera.position.x += (Math.random() - 0.5) * shake * appConfig.wormhole.shake.x
    camera.position.y += (Math.random() - 0.5) * shake * appConfig.wormhole.shake.y
  })
  return null
})
