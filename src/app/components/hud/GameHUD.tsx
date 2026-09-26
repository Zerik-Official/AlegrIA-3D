import { lazy, memo, Suspense } from 'react'
import { FiLoader } from 'react-icons/fi'
import { HUD } from '@/features/ui/components/HUD'
import { StartOverlay } from '@/features/ui/components/StartOverlay'
import { CityIntroHUD } from '@/features/cityIntro/components/CityIntroHUD'
import { PhotoModal } from '@/shared/components/PhotoModal'
import { BookPageModal } from '@/features/library/components/BookPageModal'
import { StoryTitle } from '@/shared/components/StoryTitle'
import { catalogForScene } from '@/engine/config/entityCatalog'
import { LibraryHUD } from '@/app/components/hud/LibraryHUD'
import { OpenPhaseHUD } from '@/app/components/hud/OpenPhaseHUD'
import { CreditsHUD } from '@/app/components/hud/CreditsHUD'
import { isDebugEnabled } from '@/shared/config/debug'
import { PerfHUD } from '@/features/debug/components/PerfHUD'
import type { Experience } from '@/app/hooks/useExperience'
import type { GamePhase } from '@/shared/types'

/** The editor panel, split into its own chunk so it is only downloaded once the editor is opened. */
const EditorOverlay = lazy(() => import('@/features/editor/components/EditorOverlay').then((m) => ({ default: m.EditorOverlay })))

/**
 * Shown while the editor's code chunk downloads.
 * @returns Full-screen spinner
 */
function EditorChunkFallback() {
  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-[#05070f]/70 text-parchment backdrop-blur-sm">
      <FiLoader className="h-8 w-8 animate-spin text-gold" />
      <div className="font-cinzel text-[12px] tracking-[0.24em] uppercase text-gold">Abriendo el editor</div>
    </div>
  )
}

/**
 * Props for {@link GameHUD}.
 */
interface GameHUDProps {
  /** Composed experience state. */
  experience: Experience
}

/**
 * @param target - Phase a wormhole leads to
 * @returns The HUD variant whose labels describe that destination
 */
function variantForTarget(target: GamePhase): 'library' | 'phase1' | 'phase2' | 'cityIntro' {
  if (target === 'phase1') return 'phase1'
  if (target === 'phase2') return 'phase2'
  if (target === 'cityIntro') return 'cityIntro'
  return 'library'
}

/**
 * Every DOM layer over the canvas: the start screen, each phase's overlay
 * (city, library, wormhole, open phases), the photo and book page modals and
 * the editor.
 *
 * @param props - Experience state
 * @returns HUD layers
 */
export const GameHUD = memo(function GameHUD({ experience }: GameHUDProps) {
  const { phaseFlow, city, photo, editor, editors, inOpenPhase, bookPages, audioRemainingSec, proximity } = experience
  const { phase } = phaseFlow
  const current = editors.currentEditor

  return (
    <>
      {phase === 'idle' && <StartOverlay onStart={phaseFlow.startExperience} />}

      {phaseFlow.isCityIntro && (
        <CityIntroHUD
          freeRoam={city.freeRoam}
          audioRemainingSec={audioRemainingSec}
          nearCreditsDoor={proximity.nearCreditsDoor}
          onEnterCredits={phaseFlow.enterCredits}
        />
      )}
      {phaseFlow.isCredits && <CreditsHUD audioRemainingSec={audioRemainingSec} onExit={phaseFlow.exitCredits} />}
      <StoryTitle
        visible={city.showFarewell}
        eyebrow="El Libro de Rosa"
        title="El libro agradece que lo hayas devuelto"
        subtitle="Ahora puedes explorar libremente el futuro, en donde persisten nuestra cultura y costumbres."
      />

      {phase === 'exploring' && <LibraryHUD experience={experience} />}
      {phase === 'wormhole' && (
        <HUD nearBook={false} wormholeActive onInteract={() => {}} audioRemainingSec={audioRemainingSec} variant={variantForTarget(phaseFlow.wormholeTarget)} />
      )}
      {inOpenPhase && <OpenPhaseHUD experience={experience} />}

      <PhotoModal
        open={!!photo.selectedPhoto}
        src={photo.selectedPhoto?.src ?? ''}
        title={photo.selectedPhoto?.title ?? ''}
        description={photo.selectedPhoto?.description ?? ''}
        onClose={photo.closePhoto}
      />

      <BookPageModal page={bookPages.openPage} onClose={bookPages.closePage} />

      {editor.isEditorEnabled && (
        <Suspense fallback={<EditorChunkFallback />}>
          <EditorOverlay
            enabled
            catalog={catalogForScene(editors.currentScene)}
            entities={current.entities}
            selectedId={current.selectedId}
            mode={current.mode}
            onModeChange={current.setMode}
            onSelect={current.setSelectedId}
            onUpdate={current.updateEntity}
            onAdd={current.addEntity}
            onRemove={current.removeEntity}
            onExport={current.exportJson}
            onClose={editor.closeEditor}
            currentPhase={phase}
            currentCheckpointId={phaseFlow.checkpointId}
            onJumpToCheckpoint={phaseFlow.jumpToCheckpoint}
            currentScene={editors.currentScene}
            spawnResolverRef={editor.spawnResolverRef}
          />
        </Suspense>
      )}
      {isDebugEnabled && <PerfHUD />}

      {isDebugEnabled && !editor.isEditorEnabled && (
        <div className="pointer-events-none fixed bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-[10px] tracking-[0.12em] uppercase text-parchment/40 backdrop-blur">
          F2 — Editor de Posiciones
        </div>
      )}
    </>
  )
})
