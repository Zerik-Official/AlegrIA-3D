import { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { LibraryScene } from '../features/library/components/LibraryScene'
import { MuseumScene } from '../features/museum/components/MuseumScene'
import { PlayerControls } from '../features/player/components/PlayerControls'
import { HUD, StartOverlay, PastOverlay } from '../features/ui/components/HUD'
import * as THREE from 'three'

type Phase = 'idle' | 'exploring' | 'wormhole' | 'museum'

function WormholeCamera({ active, progress }: { active: boolean; progress: number }) {
  useFrame(({ camera }) => {
    if (!active) return
    const fovTarget = 74 + progress * 38
    const cam = camera as THREE.PerspectiveCamera
    if (cam.fov !== undefined) {
      cam.fov = THREE.MathUtils.lerp(cam.fov, fovTarget, 0.08)
      cam.updateProjectionMatrix()
    }
    // NMS-like forward surge + subtle chromatic shake
    camera.position.z -= 0.02 + progress * 0.09
    camera.position.x += (Math.random() - 0.5) * progress * 0.08
    camera.position.y += (Math.random() - 0.5) * progress * 0.06
  })
  return null
}

function KeyListener({
  nearBook,
  phase,
  onInteract,
}: {
  nearBook: boolean
  phase: Phase
  onInteract: () => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key.toLowerCase() === 'e' || e.key === 'Enter') && nearBook && phase === 'exploring') {
        onInteract()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [nearBook, phase, onInteract])
  return null
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [distance, setDistance] = useState(9)
  const [wormholeProgress, setWormholeProgress] = useState(0)
  const [showMuseumOverlay, setShowMuseumOverlay] = useState(true)
  const playerPos = useRef(new THREE.Vector3(0, 1.7, 9))
  const wormholeRaf = useRef<number | null>(null)

  const nearBook = distance < 2.4

  const handlePosition = useCallback((pos: THREE.Vector3) => {
    playerPos.current.copy(pos)
    // only library distance matters; in museum keep same but hidden
    const d = Math.hypot(pos.x, pos.z)
    setDistance(d)
  }, [])

  const startWormhole = useCallback(() => {
    if (phase === 'wormhole' || phase === 'museum') return
    setPhase('wormhole')
    const duration = 4200
    const start = performance.now()

    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
      setWormholeProgress(eased)
      if (p < 1) {
        wormholeRaf.current = requestAnimationFrame(tick)
      } else {
        setPhase('museum')
        setWormholeProgress(0)
        setShowMuseumOverlay(true)
      }
    }
    wormholeRaf.current = requestAnimationFrame(tick)
  }, [phase])

  const handleStart = () => setPhase('exploring')

  const handleReturnToLibrary = () => {
    window.location.reload()
  }

  const handleDismissMuseumIntro = () => setShowMuseumOverlay(false)

  const isMuseum = phase === 'museum'

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#06040a', position: 'relative' }}>
      <KeyListener nearBook={nearBook} phase={phase} onInteract={startWormhole} />

      <Canvas
        shadows
        dpr={[1, 1.8]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        camera={{ fov: 72, near: 0.1, far: 80, position: [0, 1.7, 9] }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Fog adapts to scene */}
        {!isMuseum ? <fog attach="fog" args={['#0a0806', 9, 26]} /> : <fog attach="fog" args={['#eef1f6', 14, 36]} />}
        {!isMuseum ? <color attach="background" args={['#08060a']} /> : <color attach="background" args={['#eef1f6']} />}

        {!isMuseum ? (
          <LibraryScene wormholeActive={phase === 'wormhole'} wormholeProgress={wormholeProgress} />
        ) : (
          <MuseumScene />
        )}

        {phase === 'exploring' && (
          <PlayerControls
            enabled
            onPositionChange={handlePosition}
            bounds={{ minX: -9.2, maxX: 9.2, minZ: -9.2, maxZ: 9.2 }}
          />
        )}
        {isMuseum && (
          <PlayerControls
            enabled={!showMuseumOverlay}
            onPositionChange={handlePosition}
            bounds={{ minX: -11.5, maxX: 11.5, minZ: -11.5, maxZ: 11.5 }}
          />
        )}

        <WormholeCamera active={phase === 'wormhole'} progress={wormholeProgress} />
      </Canvas>

      {phase === 'idle' && <StartOverlay onStart={handleStart} />}
      {phase === 'exploring' && <HUD distance={distance} nearBook={nearBook} wormholeActive={false} onInteract={startWormhole} />}
      {phase === 'wormhole' && <HUD distance={distance} nearBook={nearBook} wormholeActive onInteract={startWormhole} />}
      {isMuseum && !showMuseumOverlay && (
        <>
          <HUD distance={distance} nearBook={false} wormholeActive={false} onInteract={() => {}} />
          <div className="pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#1e2430]/10 bg-white/80 px-5 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1e2430]/70 shadow backdrop-blur">
            Museo del Tiempo — Explora las vitrinas
          </div>
        </>
      )}
      {isMuseum && showMuseumOverlay && <PastOverlay onReturn={handleDismissMuseumIntro} />}
      {/* Hidden reload option after dismissal: small button to go back */}
      {isMuseum && !showMuseumOverlay && (
        <button
          onClick={handleReturnToLibrary}
          className="fixed bottom-6 right-6 z-10 rounded-full border border-[#1e2430]/10 bg-white/90 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#1e2430] shadow backdrop-blur hover:bg-white"
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
