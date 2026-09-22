import { useEffect, useRef, memo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useKeyboard } from '@/features/player/hooks/useKeyboard'
import { playerConfig } from '@/shared/config/appConfig'

/**
 * Props for {@link PlayerControls}.
 */
interface PlayerControlsProps {
  /** Whether movement and pointer lock are active. */
  enabled: boolean
  /** Callback invoked every frame with the current camera position. */
  onPositionChange: (pos: THREE.Vector3) => void
  /** Optional movement bounds clamping. */
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number }
}

/** Reusable vectors to avoid per-frame GC. */
const scratch = {
  velocity: new THREE.Vector3(),
  direction: new THREE.Vector3(),
  yaw: new THREE.Euler(0, 0, 0, 'YXZ'),
  forward: new THREE.Vector3(),
  right: new THREE.Vector3(),
  move: new THREE.Vector3(),
  next: new THREE.Vector3(),
}

/**
 * First-person pointer-lock controls with WASD movement, sprint, pedestal collision and synthesized footsteps.
 * Reusable across library and museum by swapping {@link PlayerControlsProps.bounds}.
 *
 * @param props - Control configuration
 * @returns PointerLockControls element
 * @link https://github.com/pmndrs/drei#pointerlockcontrols
 */
export const PlayerControls = memo(function PlayerControls({ enabled, onPositionChange, bounds }: PlayerControlsProps) {
  const { camera } = useThree()
  const keys = useKeyboard()
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastStepRef = useRef(0)
  const stepIdxRef = useRef(0)

  /**
   * Lazily creates and resumes the AudioContext.
   * @returns AudioContext or null
   */
  const ensureAudio = (): AudioContext | null => {
    if (!audioCtxRef.current) {
      const AC =
        (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext: typeof AudioContext })
          .AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AC) audioCtxRef.current = new AC()
    }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume().catch(() => {})
    return audioCtxRef.current
  }

  /**
   * Plays a footstep thud + transient.
   * @param sprinting - Whether the player is sprinting
   */
  const playStep = (sprinting: boolean): void => {
    const ctx = ensureAudio()
    if (!ctx) return
    const t = ctx.currentTime
    const left = stepIdxRef.current % 2 === 0
    stepIdxRef.current += 1
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    const filt = ctx.createBiquadFilter()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(left ? 88 : 102, t)
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.11)
    filt.type = 'lowpass'
    filt.frequency.setValueAtTime(360, t)
    oscGain.gain.setValueAtTime(0, t)
    oscGain.gain.linearRampToValueAtTime(sprinting ? 0.33 : 0.22, t + 0.01)
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2)
    const bufSize = ctx.sampleRate * 0.06
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.7)
    const src = ctx.createBufferSource()
    src.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(left ? 1200 : 1500, t)
    bp.Q.setValueAtTime(0.85, t)
    const nGain = ctx.createGain()
    nGain.gain.setValueAtTime(0, t)
    nGain.gain.linearRampToValueAtTime(sprinting ? 0.18 : 0.11, t + 0.004)
    nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08)
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.9, t)
    osc.connect(filt).connect(oscGain).connect(master).connect(ctx.destination)
    src.connect(bp).connect(nGain).connect(master).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.22)
    src.start(t)
    src.stop(t + 0.07)
  }

  useEffect(() => {
    const h = (): AudioContext | null => ensureAudio()
    window.addEventListener('click', h, { once: true })
    window.addEventListener('keydown', h, { once: true })
    return () => {
      window.removeEventListener('click', h)
      window.removeEventListener('keydown', h)
    }
  }, [])

  useEffect(() => {
    camera.position.set(playerConfig.startPosition.x, playerConfig.startPosition.y, playerConfig.startPosition.z)
    camera.lookAt(playerConfig.startLookAt.x, playerConfig.startLookAt.y, playerConfig.startLookAt.z)
  }, [camera])

  useFrame((_, delta) => {
    if (!enabled) return

    const speed = keys.current.shift ? playerConfig.sprintSpeed : playerConfig.walkSpeed
    const dt = Math.min(delta, 0.05)

    scratch.velocity.x *= 0.88
    scratch.velocity.z *= 0.88

    scratch.direction.set(0, 0, 0)
    if (keys.current.w) scratch.direction.z -= 1
    if (keys.current.s) scratch.direction.z += 1
    if (keys.current.a) scratch.direction.x -= 1
    if (keys.current.d) scratch.direction.x += 1
    if (scratch.direction.lengthSq() > 0) scratch.direction.normalize()

    scratch.yaw.setFromQuaternion(camera.quaternion)
    scratch.yaw.x = 0
    scratch.yaw.z = 0

    scratch.forward.set(0, 0, -1).applyEuler(scratch.yaw)
    scratch.right.set(1, 0, 0).applyEuler(scratch.yaw)

    scratch.move.set(0, 0, 0)
    scratch.move.addScaledVector(scratch.forward, -scratch.direction.z)
    scratch.move.addScaledVector(scratch.right, scratch.direction.x)
    if (scratch.move.lengthSq() > 0) scratch.move.normalize().multiplyScalar(speed * dt)

    scratch.next.copy(camera.position).add(scratch.move)

    if (bounds) {
      scratch.next.x = THREE.MathUtils.clamp(scratch.next.x, bounds.minX, bounds.maxX)
      scratch.next.z = THREE.MathUtils.clamp(scratch.next.z, bounds.minZ, bounds.maxZ)
    }

    const distToPedestal = Math.hypot(scratch.next.x, scratch.next.z)
    if (distToPedestal < playerConfig.pedestalRadius) {
      const angle = Math.atan2(scratch.next.z, scratch.next.x)
      scratch.next.x = Math.cos(angle) * playerConfig.pedestalRadius
      scratch.next.z = Math.sin(angle) * playerConfig.pedestalRadius
    }

    camera.position.copy(scratch.next)
    camera.position.y = playerConfig.eyeHeight

    const isMoving = scratch.move.lengthSq() > 0.00001
    const sprinting = keys.current.shift && isMoving
    if (enabled && isMoving) {
      const now = performance.now()
      const interval = sprinting ? 300 : 430
      if (now - lastStepRef.current > interval) {
        lastStepRef.current = now
        playStep(sprinting)
      }
    }

    onPositionChange(camera.position)
  })

  return <PointerLockControls enabled={enabled} />
})
