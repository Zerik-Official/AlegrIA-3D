import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/** Keys tracked for free-fly movement. */
interface FlyKeysState {
  w: boolean
  a: boolean
  s: boolean
  d: boolean
  shift: boolean
  control: boolean
}

/**
 * Tracks WASD + Shift/Control state via window key events, independent of
 * the gameplay {@link useKeyboard} hook (which doesn't track Control).
 * @returns Mutable ref containing the current key state
 */
function useFlyKeys() {
  const keys = useRef<FlyKeysState>({ w: false, a: false, s: false, d: false, shift: false, control: false })

  useEffect(() => {
    const setKey = (e: KeyboardEvent, value: boolean): void => {
      const k = e.key.toLowerCase()
      if (k === 'w') keys.current.w = value
      else if (k === 'a') keys.current.a = value
      else if (k === 's') keys.current.s = value
      else if (k === 'd') keys.current.d = value
      else if (k === 'shift') keys.current.shift = value
      else if (k === 'control') keys.current.control = value
    }
    const onDown = (e: KeyboardEvent): void => setKey(e, true)
    const onUp = (e: KeyboardEvent): void => setKey(e, false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  return keys
}

/** Reusable scratch objects to avoid per-frame allocations. */
const scratch = {
  yaw: new THREE.Euler(0, 0, 0, 'YXZ'),
  forward: new THREE.Vector3(),
  right: new THREE.Vector3(),
  horizontal: new THREE.Vector3(),
  move: new THREE.Vector3(),
}

/**
 * Props for {@link EditorFlyControls}.
 */
interface EditorFlyControlsProps {
  /** Ref to the live `OrbitControls` instance (from `<OrbitControls ref={...}>`). */
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>
  /** Whether free-fly movement is active. */
  enabled: boolean
  /** Movement speed in units per second. */
  speed?: number
}

/**
 * WASD (+ Shift/Control for the Y axis) free-fly movement for the editor camera.
 * Moves both the camera and its `OrbitControls` target by the same delta each
 * frame, so orbiting keeps working from wherever the camera flies to instead
 * of staying pinned around the world origin.
 *
 * @param props - Fly control configuration
 * @returns Null (side-effect only)
 */
export function EditorFlyControls({ controlsRef, enabled, speed = 7 }: EditorFlyControlsProps) {
  const keys = useFlyKeys()
  const { camera } = useThree()

  useFrame((_, delta) => {
    if (!enabled) return
    const controls = controlsRef.current
    if (!controls) return
    const k = keys.current
    if (!k.w && !k.a && !k.s && !k.d && !k.shift && !k.control) return

    scratch.yaw.setFromQuaternion(camera.quaternion)
    scratch.yaw.x = 0
    scratch.yaw.z = 0
    scratch.forward.set(0, 0, -1).applyEuler(scratch.yaw)
    scratch.right.set(1, 0, 0).applyEuler(scratch.yaw)

    scratch.horizontal.set(0, 0, 0)
    if (k.w) scratch.horizontal.add(scratch.forward)
    if (k.s) scratch.horizontal.sub(scratch.forward)
    if (k.d) scratch.horizontal.add(scratch.right)
    if (k.a) scratch.horizontal.sub(scratch.right)
    if (scratch.horizontal.lengthSq() > 0) scratch.horizontal.normalize()

    const dt = Math.min(delta, 0.05)
    const dist = speed * dt
    scratch.move.copy(scratch.horizontal).multiplyScalar(dist)
    if (k.shift) scratch.move.y += dist
    if (k.control) scratch.move.y -= dist

    if (scratch.move.lengthSq() === 0) return
    camera.position.add(scratch.move)
    controls.target.add(scratch.move)
    controls.update()
  })

  return null
}
