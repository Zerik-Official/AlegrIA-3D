import { useCallback, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { CityIntroScene } from '@/features/cityIntro/components/CityIntroScene'
import { CityWalkControls } from '@/features/cityIntro/components/CityWalkControls'
import { CityIntroHUD } from '@/features/cityIntro/components/CityIntroHUD'
import { LibraryScene } from '@/features/library/components/LibraryScene'
import { Phase1Scene } from '@/features/phase1/components/Phase1Scene'
import { Phase2Scene } from '@/features/phase2/components/Phase2Scene'
import { PlayerControls } from '@/features/player/components/PlayerControls'
import { HUD, StartOverlay, PastOverlay } from '@/features/ui/components/HUD'
import { appConfig } from '@/shared/config/appConfig'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import { PhotoModal } from '@/shared/components/PhotoModal'
import { EditorOverlay } from '@/features/editor/components/EditorOverlay'
import { EditorGizmo } from '@/features/editor/components/EditorGizmo'
import { EditorFlyControls } from '@/features/editor/components/EditorFlyControls'
import { Phase1FloodTimer } from '@/features/phase1/components/Phase1FloodTimer'
import { catalogForScene } from '@/engine/config/entityCatalog'
import { initialCityIntroEntities } from '@/features/editor/config/editableEntities'
import { WormholeCamera } from '@/app/components/WormholeCamera'
import { EditorTargetFinder } from '@/app/components/EditorTargetFinder'
import { phaseSceneRegistry } from '@/app/engine/PhaseSceneRegistry'
import { usePhaseFlow } from '@/app/hooks/usePhaseFlow'
import { usePlayerProximity } from '@/app/hooks/usePlayerProximity'
import { useSceneEditors } from '@/app/hooks/useSceneEditors'
import { usePointerLockGuard } from '@/app/hooks/usePointerLockGuard'
import { useHotkeys } from '@/app/hooks/useHotkeys'
import type { HotkeyContext } from '@/app/engine/HotkeyRouter'

/**
 * Root application orchestrating scene phases, wormhole timing and player distance.
 * Delegates phase/wormhole state to {@link usePhaseFlow}, proximity tracking to
 * {@link usePlayerProximity}, per-scene editors to {@link useSceneEditors} and every
 * keyboard shortcut to {@link useHotkeys} — this component is left to compose them.
 *
 * @returns Application element
 */
export default function App() {
  const phaseFlow = usePhaseFlow()
  const proximity = usePlayerProximity(phaseFlow.phase)
  const editors = useSceneEditors(phaseFlow.phase)
  const visual = phaseSceneRegistry.resolveVisual(phaseFlow.phase)

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const selectedPhoto = sepiaPhotos.find((p) => p.id === selectedPhotoId) ?? null
  const handlePhotoSelect = useCallback((id: string) => setSelectedPhotoId(id), [])
  const handlePhotoClose = useCallback(() => setSelectedPhotoId(null), [])

  const [isEditorEnabled, setIsEditorEnabled] = useState(false)
  const toggleEditor = useCallback(() => setIsEditorEnabled((v) => !v), [])
  const closeEditor = useCallback(() => setIsEditorEnabled(false), [])
  const [editorTarget, setEditorTarget] = useState<THREE.Object3D | null>(null)
  const orbitControlsRef = useRef<any>(null)

  const [cityWalkProgress, setCityWalkProgress] = useState(0)
  const arrivedAtLibrary = cityWalkProgress >= appConfig.cityIntro.arrivalThreshold
  const cityIntroEntities = isEditorEnabled ? editors.cityIntroEditor.entities : initialCityIntroEntities
  const cityIntroPath = useMemo(() => cityIntroEntities.filter((e) => e.type === 'path-point'), [cityIntroEntities])

  usePointerLockGuard(
    isEditorEnabled ||
      (phaseFlow.showPhase1Overlay && phaseFlow.isPhase1) ||
      (phaseFlow.showPhase2Overlay && phaseFlow.isPhase2) ||
      phaseFlow.phase === 'idle'
  )

  const hotkeyContext: HotkeyContext = {
    phase: phaseFlow.phase,
    nearBook: proximity.nearBook,
    nearPortal: proximity.nearPortal,
    showPhase1Overlay: phaseFlow.showPhase1Overlay,
    showPhase2Overlay: phaseFlow.showPhase2Overlay,
    isCityIntro: phaseFlow.isCityIntro,
    arrivedAtLibrary,
    isPhase1: phaseFlow.isPhase1,
    isPhase2: phaseFlow.isPhase2,
    highlightedPhotoId: proximity.highlightedPhotoId,
    hasSelectedPhoto: !!selectedPhoto,
    isEditorEnabled,
    toggleEditor,
    closeEditor,
    setEditorMode: editors.currentEditor.setMode,
    startCityWalk: phaseFlow.startCityWalk,
    enterLibrary: phaseFlow.enterLibrary,
    startWormholeToPhase1: phaseFlow.startWormholeToPhase1,
    startWormholeToPhase2: phaseFlow.startWormholeToPhase2,
    dismissPhase1Intro: phaseFlow.dismissPhase1Intro,
    dismissPhase2Intro: phaseFlow.dismissPhase2Intro,
    selectPhoto: handlePhotoSelect,
    closePhoto: handlePhotoClose,
  }
  useHotkeys(hotkeyContext)

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#06040a', position: 'relative' }}>
      <Canvas
        shadows
        dpr={appConfig.render.dpr}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        camera={{ fov: 72, near: 0.1, far: 280, position: [0, appConfig.player.eyeHeight, 9] }}
        style={{ width: '100%', height: '100%' }}
      >
        <fog attach="fog" args={[visual.fog.color, visual.fog.near, visual.fog.far]} />
        <color attach="background" args={[visual.background]} />

        {phaseFlow.phase === 'idle' && !phaseFlow.isLaunching ? null : visual.sceneId === 'cityIntro' ? (
          <CityIntroScene editableEntities={isEditorEnabled ? editors.cityIntroEditor.entities : undefined} />
        ) : visual.sceneId === 'library' ? (
          <LibraryScene
            wormholeActive={phaseFlow.phase === 'wormhole'}
            wormholeProgress={phaseFlow.wormholeProgress}
            editableEntities={isEditorEnabled ? editors.libraryEditor.entities : undefined}
          />
        ) : visual.sceneId === 'phase1' ? (
          <Phase1Scene highlightedPhotoId={proximity.highlightedPhotoId} editableEntities={isEditorEnabled ? editors.phase1Editor.entities : undefined} />
        ) : (
          <Phase2Scene editableEntities={isEditorEnabled ? editors.phase2Editor.entities : undefined} />
        )}

        {phaseFlow.isCityIntro && !isEditorEnabled && (
          <CityWalkControls
            enabled
            pathEntities={cityIntroPath}
            speed={appConfig.cityIntro.walkSpeed}
            eyeHeight={appConfig.cityIntro.eyeHeight}
            onProgress={setCityWalkProgress}
          />
        )}
        {phaseFlow.phase === 'exploring' && !isEditorEnabled && (
          <PlayerControls enabled onPositionChange={proximity.handlePosition} bounds={appConfig.player.libraryBounds} />
        )}
        {phaseFlow.isPhase1 && !isEditorEnabled && (
          <PlayerControls
            enabled={!phaseFlow.showPhase1Overlay && !selectedPhoto}
            onPositionChange={proximity.handlePosition}
            bounds={appConfig.player.phase1Bounds}
          />
        )}
        {phaseFlow.isPhase2 && !isEditorEnabled && (
          <PlayerControls enabled={!phaseFlow.showPhase2Overlay} onPositionChange={proximity.handlePosition} bounds={appConfig.player.phase2Bounds} />
        )}
        {isEditorEnabled && <OrbitControls ref={orbitControlsRef} enableDamping={false} />}
        {isEditorEnabled && <EditorFlyControls controlsRef={orbitControlsRef} enabled={isEditorEnabled} />}
        {isEditorEnabled && <EditorTargetFinder selectedId={editors.currentEditor.selectedId} onFound={setEditorTarget} />}
        {isEditorEnabled && (
          <EditorGizmo
            target={editorTarget}
            mode={editors.currentEditor.mode}
            enabled={!!editorTarget}
            onChange={(pos, rotY, scale) => {
              if (!editors.currentEditor.selectedId) return
              editors.currentEditor.updateEntity(editors.currentEditor.selectedId, { position: pos, rotationY: rotY, scale })
            }}
          />
        )}

        <WormholeCamera active={phaseFlow.phase === 'wormhole'} progress={phaseFlow.wormholeProgress} />
      </Canvas>

      {phaseFlow.phase === 'idle' && <StartOverlay onStart={phaseFlow.startCityWalk} loading={phaseFlow.isLaunching} />}
      {phaseFlow.isCityIntro && <CityIntroHUD arrived={arrivedAtLibrary} onEnter={phaseFlow.enterLibrary} />}
      {phaseFlow.phase === 'exploring' && <HUD nearBook={proximity.nearBook} wormholeActive={false} onInteract={phaseFlow.startWormholeToPhase1} variant="library" />}
      {phaseFlow.phase === 'wormhole' && (
        <HUD
          nearBook={proximity.nearBook}
          wormholeActive
          onInteract={() => {}}
          variant={phaseFlow.wormholeTarget === 'phase2' ? 'phase1' : 'library'}
        />
      )}
      {phaseFlow.isPhase1 && !phaseFlow.showPhase1Overlay && (
        <>
          <HUD nearBook={false} wormholeActive={false} onInteract={() => {}} variant="phase1" />
          <div className="pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#3d2b1f]/15 bg-parchment/90 px-5 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#3d2b1f]/80 shadow backdrop-blur">
            Explora • Aduana • Estación Montoya
          </div>
          <Phase1FloodTimer />
        </>
      )}
      {phaseFlow.isPhase1 && phaseFlow.showPhase1Overlay && <PastOverlay onReturn={phaseFlow.dismissPhase1Intro} />}
      {phaseFlow.isPhase1 && !phaseFlow.showPhase1Overlay && proximity.highlightedPhotoId && !selectedPhoto && (
        <button
          onClick={() => handlePhotoSelect(proximity.highlightedPhotoId!)}
          className="pointer-events-auto fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-gold/40 bg-[#0a0f1e]/85 px-6 py-3 text-[13px] font-semibold tracking-[0.14em] uppercase text-parchment shadow-[0_0_30px_rgba(255,138,26,0.35)] backdrop-blur-xl"
        >
          E — Ampliar: {sepiaPhotos.find((p) => p.id === proximity.highlightedPhotoId)?.title}
        </button>
      )}
      {phaseFlow.isPhase1 && !phaseFlow.showPhase1Overlay && proximity.nearPortal && !proximity.highlightedPhotoId && !selectedPhoto && (
        <button
          onClick={phaseFlow.startWormholeToPhase2}
          className="pointer-events-auto fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#ff8a1a]/40 bg-[#0a0f1e]/85 px-6 py-3 text-[13px] font-semibold tracking-[0.14em] uppercase text-parchment shadow-[0_0_30px_rgba(255,138,26,0.35)] backdrop-blur-xl"
        >
          Atravesar a la Época Dorada (1919–1950)
        </button>
      )}
      {phaseFlow.isPhase2 && !phaseFlow.showPhase2Overlay && (
        <>
          <HUD nearBook={false} wormholeActive={false} onInteract={() => {}} variant="phase2" />
          <div className="pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-[#1a1208]/10 bg-parchment/90 px-5 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[#1a1208]/80 shadow backdrop-blur">
            Fase 2 — Época Dorada • Carnaval y Béisbol • Trinitarias
          </div>
        </>
      )}
      {phaseFlow.isPhase2 && phaseFlow.showPhase2Overlay && (
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
            onClick={phaseFlow.dismissPhase2Intro}
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-linear-to-b from-[#ff8ad2] to-[#c94a8a] px-8 py-4 text-[13px] font-bold tracking-[0.18em] uppercase text-white shadow-[0_8px_30px_rgba(255,90,150,0.35)]"
          >
            Explorar el Carnaval
          </button>
        </div>
      )}
      {phaseFlow.isPhase2 && !phaseFlow.showPhase2Overlay && (
        <button
          onClick={phaseFlow.returnToLibrary}
          className="fixed bottom-6 right-6 z-10 rounded-full border border-[#1a1208]/10 bg-parchment/90 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#1a1208] shadow backdrop-blur hover:bg-white"
        >
          Volver a la biblioteca
        </button>
      )}

      {phaseFlow.phase === 'exploring' && proximity.nearBook && !isEditorEnabled && (
        <div
          onClick={phaseFlow.startWormholeToPhase1}
          style={{ position: 'fixed', inset: 0, zIndex: 9, cursor: 'pointer', pointerEvents: 'auto' }}
          title="Click para atravesar el vórtice"
        />
      )}
      {phaseFlow.isPhase1 && !phaseFlow.showPhase1Overlay && proximity.nearPortal && !selectedPhoto && !isEditorEnabled && (
        <div
          onClick={phaseFlow.startWormholeToPhase2}
          style={{ position: 'fixed', inset: 0, zIndex: 9, cursor: 'pointer', pointerEvents: 'auto' }}
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
        catalog={catalogForScene(editors.currentScene)}
        entities={editors.currentEditor.entities}
        selectedId={editors.currentEditor.selectedId}
        mode={editors.currentEditor.mode}
        onModeChange={editors.currentEditor.setMode}
        onSelect={editors.currentEditor.setSelectedId}
        onUpdate={editors.currentEditor.updateEntity}
        onAdd={editors.currentEditor.addEntity}
        onRemove={editors.currentEditor.removeEntity}
        onExport={editors.currentEditor.exportJson}
        onClose={closeEditor}
      />

      {!isEditorEnabled && (
        <div className="pointer-events-none fixed bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[10px] tracking-[0.12em] uppercase text-parchment/40 backdrop-blur">
          F2 — Editor de Posiciones
        </div>
      )}
    </div>
  )
}
