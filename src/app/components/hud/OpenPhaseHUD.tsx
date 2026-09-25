import { memo } from 'react'
import { HUD, PastOverlay } from '@/features/ui/components/HUD'
import { Phase2Overlay } from '@/features/ui/components/Phase2Overlay'
import { StoryBookOverlay } from '@/features/storyBook/components/StoryBookOverlay'
import { RainOnLens } from '@/features/phase1/components/RainOnLens'
import { StoryTitle } from '@/shared/components/StoryTitle'
import { PortalPrompt } from '@/app/components/hud/PortalPrompt'
import { sepiaPhotos } from '@/features/phase1/config/sepiaPhotos'
import type { Experience } from '@/app/hooks/useExperience'

/**
 * Props for {@link OpenPhaseHUD}.
 */
interface OpenPhaseHUDProps {
  /** Composed experience state. */
  experience: Experience
}

/** Per-phase copy and tint for the open phases' overlay. */
const PHASE_COPY = {
  phase1: {
    pill: 'Explora • Aduana • Estación Montoya',
    pillClass: 'border-[#3d2b1f]/15 text-[#3d2b1f]/80',
    portalLabel: 'Atravesar a la Época Dorada (1919–1950)',
    portalRgb: '255, 138, 26',
  },
  phase2: {
    pill: 'Fase 2 — Época Dorada • Carnaval y Béisbol • Trinitarias',
    pillClass: 'border-[#1a1208]/10 text-[#1a1208]/80',
    portalLabel: 'Volver a la biblioteca',
    portalRgb: '80, 140, 255',
  },
} as const

/**
 * The overlay for Phase 1 and Phase 2: the intro card on arrival, then the
 * HUD with the Libro de Rosa docked over the narration/portal countdown, the
 * book's story titles, Phase 1's photo prompt and the summoned portal's
 * prompt — and, while it rains over Phase 1, drops running down the lens.
 *
 * @param props - Experience state
 * @returns Open phase overlay
 */
export const OpenPhaseHUD = memo(function OpenPhaseHUD({ experience }: OpenPhaseHUDProps) {
  const { phaseFlow, proximity, storyBook, storyBookVisible, photo, editor, raining, audioRemainingSec } = experience
  const isPhase1 = phaseFlow.isPhase1
  const copy = isPhase1 ? PHASE_COPY.phase1 : PHASE_COPY.phase2

  if (phaseFlow.introOverlayOpen) {
    return isPhase1 ? <PastOverlay onReturn={phaseFlow.dismissPhase1Intro} /> : <Phase2Overlay onExplore={phaseFlow.dismissPhase2Intro} />
  }

  const bookDone = storyBook.stage === 'portal' && !storyBook.showPortalTitle
  const highlightedPhoto = isPhase1 && proximity.highlightedPhotoId ? sepiaPhotos.find((p) => p.id === proximity.highlightedPhotoId) : undefined

  return (
    <>
      <HUD
        nearBook={false}
        wormholeActive={false}
        onInteract={() => {}}
        variant={isPhase1 ? 'phase1' : 'phase2'}
        audioRemainingSec={audioRemainingSec}
        showIndicator={false}
      />
      {raining && !editor.isEditorEnabled && <RainOnLens active={raining} />}
      <div className={`pointer-events-none fixed top-6 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-parchment/90 px-5 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase shadow backdrop-blur ${copy.pillClass}`}>
        {copy.pill}
      </div>

      <StoryBookOverlay
        stage={storyBookVisible && !bookDone ? storyBook.stage : 'hidden'}
        audioRemainingSec={audioRemainingSec}
        portalCountdownSec={storyBook.portalCountdownSec}
      />
      <StoryTitle
        visible={storyBookVisible && storyBook.waitTitle === 'channeling'}
        eyebrow="El Libro de Rosa"
        title="El libro está canalizando energía"
        subtitle="Para poder transportarte a la siguiente línea de tiempo..."
      />
      <StoryTitle visible={storyBookVisible && storyBook.waitTitle === 'explore'} eyebrow="El Libro de Rosa" title="Puedes explorar esta época mientras tanto" />
      <StoryTitle
        visible={storyBookVisible && (storyBook.stage === 'restless' || storyBook.stage === 'summoning')}
        eyebrow="El Libro de Rosa"
        title="El libro te pide que continúes con la historia"
      />
      <StoryTitle
        visible={storyBookVisible && storyBook.showPortalTitle}
        eyebrow="El Libro de Rosa"
        title="Un portal se ha abierto frente a ti"
        subtitle="Crúzalo cuando estés listo para continuar la historia."
      />

      {highlightedPhoto && !photo.selectedPhoto && (
        <button
          onClick={() => photo.selectPhoto(highlightedPhoto.id)}
          className="pointer-events-auto fixed bottom-20 left-1/2 z-10 flex -translate-x-1/2 cursor-pointer items-center gap-3 rounded-full border border-gold/40 bg-[#0a0f1e]/85 px-6 py-3 text-[13px] font-semibold tracking-[0.14em] uppercase text-parchment shadow-[0_0_30px_rgba(255,138,26,0.35)] backdrop-blur-xl"
        >
          E — Ampliar: {highlightedPhoto.title}
        </button>
      )}
      <PortalPrompt
        visible={proximity.nearPortal && !highlightedPhoto && !photo.selectedPhoto}
        onActivate={isPhase1 ? phaseFlow.startWormholeToPhase2 : phaseFlow.startWormholeToLibrary}
        glowRgb={copy.portalRgb}
        catchClicks={!editor.isEditorEnabled}
      >
        {copy.portalLabel}
      </PortalPrompt>
    </>
  )
})
