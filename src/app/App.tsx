import { useState, useRef, useCallback, useEffect, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { LibraryScene } from '@/features/library/components/LibraryScene'
import { Phase1Scene } from '@/features/phase1/components/Phase1Scene'
import { PlayerControls } from '@/features/player/components/PlayerControls'
import { HUD, StartOverlay, PastOverlay } from '@/features/ui/components/HUD'
import { appConfig } from '@/shared/config/appConfig'
import { easeCubicInOut } from '@/shared/utils/perf'
import type { GamePhase } from '@/shared/types'
import * as THREE from 'three'

/**
 * Props for {@link WormholeCamera}.
 */
interface WormholeCameraProps {
  /** Whether camera animation is active. */
  active: boolean
  /** Normalized progress in [0,1]. */
  progress: number
}

/**
 * Animates the camera FOV and subtle shake during the wormhole transition.
 * Uses lerp for smooth FOV and random jitter scaled by progress.
 *
 * @param props - Camera animation state
 * @returns Null (side-effect only)
 */
const WormholeCamera = memo(function WormholeCamera({ active, progress }: WormholeCameraProps) {
  const initialPos = useRef<THREE.Vector3 | null>(null)
  const initialQuat = useRef<THREE.Quaternion | null>(null)
  useFrame(({ camera }) => {
    if (!active) {
      initialPos.current = null
      initialQuat.current = null
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

/**
 * Props for {@link KeyListener}.
 */
interface KeyListenerProps {
  /** Whether the player is near the book. */
  nearBook: boolean
  /** Current game phase. */
  phase: GamePhase
  /** Interaction handler. */
  onInteract: () => void
}

/**
 * Global keyboard listener for the `E` / `Enter` interaction.
 *
 * @param props - Listener configuration
 * @returns Null (side-effect only)
 */
const KeyListener = memo(function KeyListener({ nearBook, phase, onInteract }: KeyListenerProps) {
  useEffect(() => {
    /**
     * @param e - Keyboard event
     */
    const handler = (e: KeyboardEvent): void => {
      if ((e.key.toLowerCase() === 'e' || e.key === 'Enter') && nearBook && phase === 'exploring') {
        onInteract()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [nearBook, phase, onInteract])
  return null
})

/**
 * Root application orchestrating scene phases, wormhole timing and player distance.
 * Designed to be reusable: swap `LibraryScene` / `MuseumScene` via props or registry without editing the phase logic.
 *
 * @returns Application element
 */
export default function App() {
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [distance, setDistance] = useState(9)
  const [wormholeProgress, setWormholeProgress] = useState(0)
  const [showPhase1Overlay, setShowPhase1Overlay] = useState(true)
  const playerPos = useRef(new THREE.Vector3(0, appConfig.player.eyeHeight, 9))
  const wormholeRaf = useRef<number | null>(null)

  const nearBook = distance < appConfig.player.interactDistance

  /**
   * Updates cached player position and distance to the central book.
   * @param pos - Current camera position
   */
  const handlePosition = useCallback((pos: THREE.Vector3) => {
    playerPos.current.copy(pos)
    const d = Math.hypot(pos.x, pos.z)
    setDistance(d)
  }, [])

  /**
   * Starts the wormhole timeline with cubic easing and phase transition.
   */
  const startWormhole = useCallback(() => {
    if (phase === 'wormhole' || phase === 'phase1' || phase === 'museum') return
    setPhase('wormhole')
    const duration = appConfig.wormhole.durationMs
    const start = performance.now()

    /**
     * @param now - Timestamp from requestAnimationFrame
     */
    const tick = (now: number): void => {
      const p = Math.min((now - start) / duration, 1)
      const eased = easeCubicInOut(p)
      setWormholeProgress(eased)
      if (p < 1) {
        wormholeRaf.current = requestAnimationFrame(tick)
      } else {
        setPhase('phase1')
        setWormholeProgress(0)
        setShowPhase1Overlay(true)
      }
    }
    wormholeRaf.current = requestAnimationFrame(tick)
  }, [phase])

  const handleStart = useCallback(() => setPhase('exploring'), [])
  const handleReturnToLibrary = useCallback(() => window.location.reload(), [])
  const handleDismissPhase1Intro = useCallback(() => setShowPhase1Overlay(false), [])

  const isPhase1 = phase === 'phase1' || phase === 'museum'

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#06040a', position: 'relative' }}>
      <KeyListener nearBook={nearBook} phase={phase} onInteract={startWormhole} />

      <Canvas
        shadows
        dpr={appConfig.render.dpr}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        camera={{ fov: 72, near: 0.1, far: 80, position: [0, appConfig.player.eyeHeight, 9] }}
        style={{ width: '100%', height: '100%' }}
      >
        {!isPhase1 ? <fog attach="fog" args={['#0a0806', 9, 26]} /> : <fog attach="fog" args={['#8a6a3a', 14, 38]} />}
        {!isPhase1 ? <color attach="background" args={['#08060a']} /> : <color attach="background" args={['#6b4a2a']} />}

        {!isPhase1 ? (
          <LibraryScene wormholeActive={phase === 'wormhole'} wormholeProgress={wormholeProgress} />
        ) : (
          <Phase1Scene />
        )}

        {phase === 'exploring' && (
          <PlayerControls enabled onPositionChange={handlePosition} bounds={appConfig.player.libraryBounds} />
        )}
        {isPhase1 && (
          <PlayerControls
            enabled={!showPhase1Overlay}
            onPositionChange={handlePosition}
            bounds={appConfig.player.phase1Bounds}
          />
        )}

        <WormholeCamera active={phase === 'wormhole'} progress={wormholeProgress} />
      </Canvas>

      {phase === 'idle' && <StartOverlay onStart={handleStart} />}
      {phase === 'exploring' && <HUD nearBook={nearBook} wormholeActive={false} onInteract={startWormhole} />}
      {phase === 'wormhole' && <HUD nearBook={nearBook} wormholeActive onInteract={startWormhole} />}
      {isPhase1 && !showPhase1Overlay && (
        <>
          <HUD nearBook={false} wormholeActive={false} onInteract={() => {}} isPhase1 />
          <div className="pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#3d2b1f]/15 bg-parchment/90 px-5 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#3d2b1f]/80 shadow backdrop-blur">
            Explora • Aduana • Estación Montoya • Pasaje de los Chinos
          </div>
        </>
      )}
      {isPhase1 && showPhase1Overlay && <PastOverlay onReturn={handleDismissPhase1Intro} />}
      {isPhase1 && !showPhase1Overlay && (
        <button
          onClick={handleReturnToLibrary}
          className="fixed bottom-6 right-6 z-10 rounded-full border border-[#3d2b1f]/15 bg-parchment/90 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#3d2b1f] shadow backdrop-blur hover:bg-[#fff8e0]"
        >
          Volver a la biblioteca
        </button>
      )}

      {phase === 'exploring' && nearBook && (
        <div
          onClick={startWormhole}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          title="Click para atravesar el vórtice"
        />
      )}
    </div>
  )
}
