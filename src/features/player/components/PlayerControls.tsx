import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { useKeyboard } from '../hooks/useKeyboard'

interface Props {
  enabled: boolean
  onPositionChange: (pos: THREE.Vector3) => void
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number }
}

export function PlayerControls({ enabled, onPositionChange, bounds }: Props) {
  const { camera } = useThree()
  const keys = useKeyboard()
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const controlsRef = useRef<any>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastStepRef = useRef(0)
  const stepIdxRef = useRef(0)

  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      const AC =
        (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext: typeof AudioContext }).AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AC) audioCtxRef.current = new AC()
    }
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume().catch(() => {})
    return audioCtxRef.current
  }

  const playStep = (sprinting: boolean) => {
    const ctx = ensureAudio()
    if (!ctx) return
    const t = ctx.currentTime
    const left = stepIdxRef.current % 2 === 0
    stepIdxRef.current += 1
    // thud
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
    // click transient
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

  // resume audio on first interaction
  useEffect(() => {
    const h = () => ensureAudio()
    window.addEventListener('click', h, { once: true })
    window.addEventListener('keydown', h, { once: true })
    return () => {
      window.removeEventListener('click', h)
      window.removeEventListener('keydown', h)
    }
  }, [])

  // Initial position: entrance of the library, facing the pedestal (center)
  useEffect(() => {
    camera.position.set(0, 1.7, 9)
    camera.lookAt(0, 1.2, 0)
  }, [camera])

  useFrame((_, delta) => {
    if (!enabled) return

    const speed = keys.current.shift ? 4.5 : 2.8
    const dt = Math.min(delta, 0.05)

    // friction
    velocity.current.x *= 0.88
    velocity.current.z *= 0.88

    direction.current.set(0, 0, 0)
    if (keys.current.w) direction.current.z -= 1
    if (keys.current.s) direction.current.z += 1
    if (keys.current.a) direction.current.x -= 1
    if (keys.current.d) direction.current.x += 1
    if (direction.current.lengthSq() > 0) direction.current.normalize()

    // Move relative to camera yaw (ignore pitch)
    const yaw = new THREE.Euler(0, 0, 0, 'YXZ')
    yaw.setFromQuaternion(camera.quaternion)
    yaw.x = 0
    yaw.z = 0

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(yaw)
    const right = new THREE.Vector3(1, 0, 0).applyEuler(yaw)

    const move = new THREE.Vector3()
    move.addScaledVector(forward, -direction.current.z)
    move.addScaledVector(right, direction.current.x)
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed * dt)

    // Simple collision vs bounds + pedestal cylinder
    let next = camera.position.clone().add(move)

    if (bounds) {
      next.x = THREE.MathUtils.clamp(next.x, bounds.minX, bounds.maxX)
      next.z = THREE.MathUtils.clamp(next.z, bounds.minZ, bounds.maxZ)
    }

    // Pedestal collision (center radius ~0.9, height irrelevant)
    const distToPedestal = Math.hypot(next.x, next.z)
    if (distToPedestal < 1.05) {
      const angle = Math.atan2(next.z, next.x)
      next.x = Math.cos(angle) * 1.05
      next.z = Math.sin(angle) * 1.05
    }

    // bookshelf outer walls implicit via bounds; inner bookshelf collisions (approx)
    // we keep bounds tight so no need for complex mesh collision

    camera.position.copy(next)
    camera.position.y = 1.7

    // footsteps: trigger when actually moving
    const isMoving = move.lengthSq() > 0.00001
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

  return (
    <PointerLockControls
      ref={controlsRef}
      enabled={enabled}
      // drei's PointerLockControls locks on click automatically
    />
  )
}
