import { memo } from 'react'
import { HUD } from '@/features/ui/components/HUD'
import { StoryTitle } from '@/shared/components/StoryTitle'
import { PortalPrompt } from '@/app/components/hud/PortalPrompt'
import type { Experience } from '@/app/hooks/useExperience'

/**
 * Props for {@link LibraryHUD}.
 */
interface LibraryHUDProps {
  /** Composed experience state. */
  experience: Experience
}

/**
 * The library's overlay on either visit: the HUD with the book prompt (only
 * once the book is usable), the story titles for each beat, the white burst
 * that restores the hall, and the prompts for the restored hall's displayed
 * pages and its portal to the future.
 *
 * @param props - Experience state
 * @returns Library overlay
 */
export const LibraryHUD = memo(function LibraryHUD({ experience }: LibraryHUDProps) {
  const { phaseFlow, proximity, library, editor, bookPages, audioRemainingSec } = experience
  const pageInReach = !!bookPages.focusedPageId && !bookPages.openPage
  const bookUsable = proximity.nearBook && phaseFlow.bookStage === 'ready'

  return (
    <>
      <HUD
        nearBook={bookUsable}
        wormholeActive={false}
        onInteract={phaseFlow.handleBookInteract}
        variant="library"
        audioRemainingSec={audioRemainingSec}
        interactLabel={library.isReturnVisit ? 'Devolver el Libro de Rosa' : undefined}
      />
      <StoryTitle visible={library.showBookCalling} eyebrow="El Libro de Rosa" title="El libro te llama..." subtitle="Ve e interactúa con él." />
      <StoryTitle visible={library.showReturnBook} eyebrow="El Libro de Rosa" title="Devuelve el Libro de Rosa" subtitle="Acércate al libro y devuélvelo a su estantería." />
      <StoryTitle visible={library.showPortalTitle} eyebrow="El Libro de Rosa" title="El libro ha abierto un portal al futuro" subtitle="Crúzalo cuando estés listo." />
      {library.showBurstFlash && (
        <div className="pointer-events-none fixed inset-0 z-30 bg-[#fffaf0] opacity-0 animate-[library-burst_3.2s_ease-in-out_forwards]" />
      )}
      {bookUsable && !editor.isEditorEnabled && (
        <div
          onClick={phaseFlow.handleBookInteract}
          style={{ position: 'fixed', inset: 0, zIndex: 9, cursor: 'pointer', pointerEvents: 'auto' }}
          title="Click para interactuar con el libro"
        />
      )}
      <PortalPrompt
        visible={pageInReach}
        onActivate={bookPages.openFocusedPage}
        glowRgb="255, 204, 102"
        catchClicks={!editor.isEditorEnabled}
        catcherTitle="Click para ver la página"
      >
        E — Ver página del Libro de Rosa
      </PortalPrompt>
      <PortalPrompt
        visible={phaseFlow.libraryPortalUnlocked && proximity.nearPortal && !pageInReach}
        onActivate={phaseFlow.startWormholeToCityIntro}
        glowRgb="90, 216, 255"
        catchClicks={!editor.isEditorEnabled}
      >
        Cruzar el Portal hacia el Futuro
      </PortalPrompt>
    </>
  )
})
