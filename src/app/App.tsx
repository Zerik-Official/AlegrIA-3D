import { useState, useRef, useCallback, useEffect, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { LibraryScene } from '@/features/library/components/LibraryScene'
import { Phase1Scene } from '@/features/phase1/components/Phase1Scene'
import { Phase2Scene } from '@/features/phase2/components/Phase2Scene'
import { PlayerControls } from '@/features/player/components/PlayerControls'
import { HUD, StartOverlay, PastOverlay } from '@/features/ui/components/HUD'
import { appConfig } from '@/shared/config/appConfig'
import { easeCubicInOut } from '@/shared/utils/perf'
import type { GamePhase } from '@/shared/types'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import { PhotoModal } from '@/shared/components/PhotoModal'
import { EditorOverlay } from '@/features/editor/components/EditorOverlay'
import { EditorGizmo } from '@/features/editor/components/EditorGizmo'
import { useEditor } from '@/features/editor/hooks/useEditor'
import { initialPhase1Entities } from '@/features/editor/config/editableEntities'
import { OrbitControls } from '@react-three/drei'
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
 * Finds the 3D object for the current editor selection.
 *
 * @param props - Finder props
 * @returns Null
 */
function EditorTargetFinder({ selectedId, onFound }: { selectedId: string | null; onFound: (o: THREE.Object3D | null) => void }) {
  const { scene } = useThree()
  useEffect(() => {
    if (!selectedId) {
      onFound(null)
      return
    }
    const obj = scene.getObjectByName(selectedId)
    onFound(obj as THREE.Object3D | null)
  }, [selectedId, scene, onFound])
  return null
}

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
  const [showPhase2Overlay, setShowPhase2Overlay] = useState(true)
  const [wormholeTarget, setWormholeTarget] = useState<GamePhase>('phase1')
  const playerPos = useRef(new THREE.Vector3(0, appConfig.player.eyeHeight, 9))
  const wormholeRaf = useRef<number | null>(null)

  const nearBook = distance < appConfig.player.interactDistance
  const portalPos: [number, number] = [0, 15.8]
  const nearPortal = Math.hypot(playerPos.current.x - portalPos[0], playerPos.current.z - portalPos[1]) < 2.8
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [highlightedPhotoId, setHighlightedPhotoId] = useState<string | null>(null)
  const selectedPhoto = sepiaPhotos.find((p) => p.id === selectedPhotoId) ?? null
  const handlePhotoSelect = useCallback((id: string) => setSelectedPhotoId(id), [])
  const handlePhotoClose = useCallback(() => setSelectedPhotoId(null), [])
  const [isEditorEnabled, setIsEditorEnabled] = useState(false)
  const editor = useEditor(initialPhase1Entities)
  const [editorTarget, setEditorTarget] = useState<THREE.Object3D | null>(null)

  /**
   * Updates cached player position and distance to the central book.
   * @param pos - Current camera position
   */
  const handlePosition = useCallback((pos: THREE.Vector3) => {
    playerPos.current.copy(pos)
    const d = Math.hypot(pos.x, pos.z)
    setDistance(d)
    if (phase === 'phase1' || phase === 'museum') {
      let nearest: string | null = null
      let min = 2.4
      for (const p of sepiaPhotos) {
        const dx = pos.x - p.position[0]
        const dz = pos.z - p.position[2]
        const dist = Math.hypot(dx, dz)
        if (dist < min) {
          min = dist
          nearest = p.id
        }
      }
      setHighlightedPhotoId(nearest)
    } else {
      setHighlightedPhotoId(null)
    }
  }, [phase])

  /**
   * Starts the wormhole timeline with cubic easing and phase transition.
   */
  const startWormhole = useCallback(
    (target: GamePhase = 'phase1') => {
      if (phase === 'wormhole' || phase === target) return
      setWormholeTarget(target)
      setPhase('wormhole')
      const duration = appConfig.wormhole.durationMs
      const start = performance.now()
      const tick = (now: number): void => {
        const p = Math.min((now - start) / duration, 1)
        const eased = easeCubicInOut(p)
        setWormholeProgress(eased)
        if (p < 1) {
          wormholeRaf.current = requestAnimationFrame(tick)
        } else {
          setPhase(target)
          setWormholeProgress(0)
          if (target === 'phase1') setShowPhase1Overlay(true)
          if (target === 'phase2') setShowPhase2Overlay(true)
        }
      }
      wormholeRaf.current = requestAnimationFrame(tick)
    },
    [phase]
  )

  const startWormholeToPhase1 = useCallback(() => startWormhole('phase1'), [startWormhole])
  const startWormholeToPhase2 = useCallback(() => startWormhole('phase2'), [startWormhole])

  const handleStart = useCallback(() => setPhase('exploring'), [])
  const handleReturnToLibrary = useCallback(() => window.location.reload(), [])
  const handleDismissPhase1Intro = useCallback(() => setShowPhase1Overlay(false), [])
  const handleDismissPhase2Intro = useCallback(() => setShowPhase2Overlay(false), [])

  const isPhase1 = phase === 'phase1' || phase === 'museum'
  const isPhase2 = phase === 'phase2'

  useEffect(() => {
    if (isEditorEnabled && document.pointerLockElement) {
      document.exitPointerLock()
    }
    if (!isEditorEnabled) return
    const handler = (e: MouseEvent): void => {
      if (document.pointerLockElement) document.exitPointerLock()
    }
    window.addEventListener('click', handler, true)
    return () => window.removeEventListener('click', handler, true)
  }, [isEditorEnabled])

  useEffect(() => {
    if ((showPhase1Overlay && isPhase1) || (showPhase2Overlay && isPhase2) || phase === 'idle') {
      if (document.pointerLockElement) document.exitPointerLock()
    }
  }, [showPhase1Overlay, showPhase2Overlay, isPhase1, isPhase2, phase])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key.toLowerCase() === 'q' && !isEditorEnabled && !showPhase1Overlay && !showPhase2Overlay && phase !== 'idle' && phase !== 'wormhole') {
        if (document.pointerLockElement) document.exitPointerLock()
        else document.body.requestPointerLock?.()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isEditorEnabled, showPhase1Overlay, showPhase2Overlay, phase])

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'F2') {
        setIsEditorEnabled((v) => !v)
        return
      }
      if (e.key.toLowerCase() === 'w' && isEditorEnabled) {
        editor.setMode('translate')
        return
      }
      if (e.key.toLowerCase() === 'e' && isEditorEnabled) {
        editor.setMode('rotate')
        return
      }
      if (e.key.toLowerCase() === 'r' && isEditorEnabled) {
        editor.setMode('scale')
        return
      }
      const isE = e.key.toLowerCase() === 'e' || e.key === 'Enter' || e.key === ' '
      if (isE && showPhase1Overlay && isPhase1) {
        setShowPhase1Overlay(false)
        return
      }
      if (isE && showPhase2Overlay && isPhase2) {
        setShowPhase2Overlay(false)
        return
      }
      if (isE && phase === 'idle') {
        setPhase('exploring')
        return
      }
      if (isE && selectedPhoto) {
        setSelectedPhotoId(null)
        return
      }
      if (isE && highlightedPhotoId && !selectedPhoto && isPhase1 && !showPhase1Overlay && !isEditorEnabled) {
        setSelectedPhotoId(highlightedPhotoId)
        return
      }
      if (isE && isPhase1 && nearPortal && !showPhase1Overlay && !selectedPhoto && !isEditorEnabled) {
        startWormholeToPhase2()
      }
      if (e.key === 'Escape' && selectedPhoto) {
        setSelectedPhotoId(null)
      }
      if (e.key === 'Escape' && isEditorEnabled) {
        setIsEditorEnabled(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPhase1, isPhase2, nearPortal, showPhase1Overlay, showPhase2Overlay, phase, selectedPhoto, highlightedPhotoId, startWormholeToPhase2, isEditorEnabled, editor])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#06040a', position: 'relative' }}>
      <KeyListener nearBook={nearBook} phase={phase} onInteract={startWormholeToPhase1} />

      <Canvas
        shadows
        dpr={appConfig.render.dpr}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        camera={{ fov: 72, near: 0.1, far: 80, position: [0, appConfig.player.eyeHeight, 9] }}
        style={{ width: '100%', height: '100%' }}
      >
        {!isPhase1 && !isPhase2 ? <fog attach="fog" args={['#0a0806', 9, 26]} /> : isPhase1 ? <fog attach="fog" args={['#8a6a3a', 14, 38]} /> : <fog attach="fog" args={['#bfa86a', 12, 32]} />}
        {!isPhase1 && !isPhase2 ? <color attach="background" args={['#08060a']} /> : isPhase1 ? <color attach="background" args={['#6b4a2a']} /> : <color attach="background" args={['#c9b896']} />}

        {!isPhase1 && !isPhase2 ? (
          <LibraryScene wormholeActive={phase === 'wormhole'} wormholeProgress={wormholeProgress} />
        ) : isPhase1 ? (
          <Phase1Scene highlightedPhotoId={highlightedPhotoId} editableEntities={isEditorEnabled ? editor.entities : undefined} />
        ) : (
          <Phase2Scene />
        )}

        {phase === 'exploring' && (
          <PlayerControls enabled={!isEditorEnabled} onPositionChange={handlePosition} bounds={appConfig.player.libraryBounds} />
        )}
        {isPhase1 && (
          <PlayerControls
            enabled={!showPhase1Overlay && !selectedPhoto && !isEditorEnabled}
            onPositionChange={handlePosition}
            bounds={appConfig.player.phase1Bounds}
          />
        )}
        {isPhase2 && (
          <PlayerControls
            enabled={!showPhase2Overlay && !isEditorEnabled}
            onPositionChange={handlePosition}
            bounds={appConfig.player.phase2Bounds}
          />
        )}
        {isEditorEnabled && <OrbitControls enableDamping={false} />}
        {isEditorEnabled && <EditorTargetFinder selectedId={editor.selectedId} onFound={setEditorTarget} />}
        {isEditorEnabled && (
          <EditorGizmo
            target={editorTarget}
            mode={editor.mode}
            enabled={!!editorTarget}
            onChange={(pos, rotY, scale) => {
              if (!editor.selectedId) return
              editor.updateEntity(editor.selectedId, { position: pos, rotationY: rotY, scale })
            }}
          />
        )}

        <WormholeCamera active={phase === 'wormhole'} progress={wormholeProgress} />
      </Canvas>

      {phase === 'idle' && <StartOverlay onStart={handleStart} />}
      {phase === 'exploring' && <HUD nearBook={nearBook} wormholeActive={false} onInteract={startWormholeToPhase1} />}
      {phase === 'wormhole' && (
        <HUD
          nearBook={nearBook}
          wormholeActive
          onInteract={() => {}}
          isPhase1={wormholeTarget === 'phase2'}
        />
      )}
      {isPhase1 && !showPhase1Overlay && (
        <>
          <HUD nearBook={false} wormholeActive={false} onInteract={() => {}} isPhase1 />
          <div className="pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#3d2b1f]/15 bg-parchment/90 px-5 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#3d2b1f]/80 shadow backdrop-blur">
            Explora • Aduana • Estación Montoya • Pasaje de los Chinos
          </div>
          <div className="pointer-events-none fixed bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#3d2b1f]/15 bg-[#0a0f1e]/90 px-4 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase text-parchment shadow backdrop-blur">
            Portal al sur — Avanza a la Época Dorada
          </div>
        </>
      )}
      {isPhase1 && showPhase1Overlay && <PastOverlay onReturn={handleDismissPhase1Intro} />}
      {isPhase1 && !showPhase1Overlay && highlightedPhotoId && !selectedPhoto && (
        <button
          onClick={() => setSelectedPhotoId(highlightedPhotoId)}
          className="pointer-events-auto fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-gold/40 bg-[#0a0f1e]/85 px-6 py-3 text-[13px] font-semibold tracking-[0.14em] uppercase text-parchment shadow-[0_0_30px_rgba(255,138,26,0.35)] backdrop-blur-xl"
        >
          E — Ampliar: {sepiaPhotos.find((p) => p.id === highlightedPhotoId)?.title}
        </button>
      )}
      {isPhase1 && !showPhase1Overlay && nearPortal && !highlightedPhotoId && !selectedPhoto && (
        <button
          onClick={startWormholeToPhase2}
          className="pointer-events-auto fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#ff8a1a]/40 bg-[#0a0f1e]/85 px-6 py-3 text-[13px] font-semibold tracking-[0.14em] uppercase text-parchment shadow-[0_0_30px_rgba(255,138,26,0.35)] backdrop-blur-xl"
        >
          Atravesar a la Época Dorada (1919–1950)
        </button>
      )}
      {isPhase2 && !showPhase2Overlay && (
        <>
          <HUD nearBook={false} wormholeActive={false} onInteract={() => {}} isPhase1 />
          <div className="pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#1a1208]/10 bg-parchment/90 px-5 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1a1208]/80 shadow backdrop-blur">
            Fase 2 — Época Dorada • Carnaval y Béisbol • Trinitarias
          </div>
        </>
      )}
      {isPhase2 && showPhase2Overlay && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(40,14,30,0.96)_0%,rgba(10,4,14,0.98)_75%)] p-8 text-center">
          <div className="font-cinzel text-[11px] tracking-[0.42em] uppercase text-[#ff8ad2]/70">Fase 2 — Época Dorada (1919–1950s)</div>
          <h1 className="font-cinzel mt-3 text-[clamp(28px,6vw,54px)] leading-[1.1] tracking-[0.18em] uppercase text-[#ffe0f0] drop-shadow-[0_0_30px_rgba(255,90,160,0.45)]">
            Tradición y Carnaval
          </h1>
          <p className="mx-auto mt-6 max-w-140 text-[14px] leading-7 tracking-[0.04em] text-white/70">
            Quinta de Turín (1919), Parroquia Sagrado Corazón (1920–22), radio de tubos con béisbol, fiesta de San Martín y disfraces.
            <br />
            Fachadas coloridas, trinitarias 3D y la silueta gótica iluminada te esperan.
          </p>
          <button
            onClick={handleDismissPhase2Intro}
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-linear-to-b from-[#ff8ad2] to-[#c94a8a] px-8 py-4 text-[13px] font-bold tracking-[0.18em] uppercase text-white shadow-[0_8px_30px_rgba(255,90,150,0.35)]"
          >
            Explorar el Carnaval
          </button>
        </div>
      )}
      {isPhase2 && !showPhase2Overlay && (
        <button
          onClick={handleReturnToLibrary}
          className="fixed bottom-6 right-6 z-10 rounded-full border border-[#1a1208]/10 bg-parchment/90 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#1a1208] shadow backdrop-blur hover:bg-white"
        >
          Volver a la biblioteca
        </button>
      )}

      {phase === 'exploring' && nearBook && !isEditorEnabled && (
        <div
          onClick={startWormholeToPhase1}
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
      {isPhase1 && !showPhase1Overlay && nearPortal && !selectedPhoto && !isEditorEnabled && (
        <div
          onClick={startWormholeToPhase2}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          title="Click para atravesar al portal"
        />
      )}

      <PhotoModal
        open={!!selectedPhoto}
        src={selectedPhoto?.src ?? ''}
        title={selectedPhoto?.title ?? ''}
        description={selectedPhoto?.description ?? ''}
        onClose={handlePhotoClose}
      />

      <EditorOverlay
        enabled={isEditorEnabled}
        entities={editor.entities}
        selectedId={editor.selectedId}
        mode={editor.mode}
        onModeChange={editor.setMode}
        onSelect={editor.setSelectedId}
        onUpdate={editor.updateEntity}
        onAdd={editor.addEntity}
        onRemove={editor.removeEntity}
        onExport={editor.exportJson}
        onClose={() => setIsEditorEnabled(false)}
      />

      {!isEditorEnabled && (
        <div className="pointer-events-none fixed bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[10px] tracking-[0.12em] uppercase text-parchment/40 backdrop-blur">
          F2 — Editor de Posiciones
        </div>
      )}
    </div>
  )
}
