/**
 * Central handler for every global keyboard shortcut in the app.
 * Replaces the scattered `keydown` effects that used to live inline in `App.tsx`
 * (pointer-lock toggle, editor toggle/mode switch, overlay dismissal, photo/portal
 * interaction) with one class method driven by a single {@link HotkeyContext} snapshot.
 * @module app/engine/HotkeyRouter
 */

import { isDebugEnabled } from '@/shared/config/debug'
import type { GamePhase } from '@/shared/types'

/** Everything {@link HotkeyRouter.handle} needs to decide what a keypress should do. */
export interface HotkeyContext {
  /** Current game phase. */
  phase: GamePhase
  /** Whether the player is within interact range of the central book. */
  nearBook: boolean
  /** Whether the player is within interact range of the phase portal. */
  nearPortal: boolean
  /** Whether the library's `cityIntro` portal has appeared and can be used. */
  libraryPortalUnlocked: boolean
  /** Whether Phase 1's intro overlay is showing. */
  showPhase1Overlay: boolean
  /** Whether Phase 2's intro overlay is showing. */
  showPhase2Overlay: boolean
  /** Whether `phase` currently resolves to the city intro walk. */
  isCityIntro: boolean
  /** Whether the finale's scripted walk has handed over to free roaming. */
  cityFreeRoam: boolean
  /** Whether `phase` currently resolves to Phase 1 (including the `museum` alias). */
  isPhase1: boolean
  /** Whether `phase` currently resolves to Phase 2. */
  isPhase2: boolean
  /** Id of the sepia photo currently highlighted by proximity, if any. */
  highlightedPhotoId: string | null
  /** Whether a photo is currently open in the modal. */
  hasSelectedPhoto: boolean
  /** Whether the position editor is enabled. */
  isEditorEnabled: boolean
  /** Toggles the position editor on/off (`F2`). */
  toggleEditor: () => void
  /** Closes the position editor (`Escape`). */
  closeEditor: () => void
  /** Sets the editor gizmo mode (`W`/`E`/`R`). */
  setEditorMode: (mode: 'translate' | 'rotate' | 'scale') => void
  /** Transitions from `idle` straight into `exploring` (the library), where the experience now starts. */
  startExperience: () => void
  /** Book interaction in the library: first visit heads to Phase 1, the second (and later) returns the book to its shelf once its narration has ended. */
  handleBookInteract: () => void
  /** Starts the wormhole transition into Phase 2 (triggered near the Phase 1 portal). */
  startWormholeToPhase2: () => void
  /** Starts the wormhole transition back to the library (triggered near the Phase 2 portal). */
  startWormholeToLibrary: () => void
  /** Starts the wormhole transition into the `cityIntro` finale (triggered at the library's unlocked portal). */
  startWormholeToCityIntro: () => void
  /** Dismisses the Phase 1 intro overlay. */
  dismissPhase1Intro: () => void
  /** Dismisses the Phase 2 intro overlay. */
  dismissPhase2Intro: () => void
  /** Opens the photo modal for the given photo id. */
  selectPhoto: (id: string) => void
  /** Restored library page under the crosshair, if any. */
  focusedBookPageId: string | null
  /** Whether a restored library page is open in the page modal. */
  hasOpenBookPage: boolean
  /** Opens the page under the crosshair in the page modal. */
  openBookPage: () => void
  /** Closes the page modal. */
  closeBookPage: () => void
  /** Closes the photo modal (`Escape` or re-pressing interact). */
  closePhoto: () => void
}

/**
 * Stateless router: one `handle` call per `keydown` event, reading a fresh
 * {@link HotkeyContext} snapshot each time so it never holds stale closures.
 */
export class HotkeyRouter {
  /**
   * Dispatches one keyboard event against the current app context.
   * @param event - The DOM keydown event
   * @param ctx - Fresh context snapshot for this event
   */
  handle(event: KeyboardEvent, ctx: HotkeyContext): void {
    const key = event.key.toLowerCase()

    if (key === 'q') {
      this.togglePointerLock(ctx)
      return
    }

    if (event.key === 'F2') {
      if (!isDebugEnabled) return
      ctx.toggleEditor()
      return
    }

    if (isDebugEnabled && ctx.isEditorEnabled && (key === 'w' || key === 'e' || key === 'r')) {
      ctx.setEditorMode(key === 'w' ? 'translate' : key === 'e' ? 'rotate' : 'scale')
      return
    }

    const isInteractKey = key === 'e' || event.key === 'Enter'
    const isConfirmKey = isInteractKey || event.key === ' '

    if (ctx.hasOpenBookPage && (isConfirmKey || event.key === 'Escape')) {
      ctx.closeBookPage()
      return
    }
    if (isInteractKey && ctx.focusedBookPageId && ctx.phase === 'exploring' && !ctx.isEditorEnabled) {
      ctx.openBookPage()
      return
    }

    if (isInteractKey && ctx.nearBook && ctx.phase === 'exploring') {
      ctx.handleBookInteract()
    }

    if (isConfirmKey && ctx.showPhase1Overlay && ctx.isPhase1) {
      ctx.dismissPhase1Intro()
      return
    }
    if (isConfirmKey && ctx.showPhase2Overlay && ctx.isPhase2) {
      ctx.dismissPhase2Intro()
      return
    }
    if (key === 'e' && ctx.phase === 'idle') {
      ctx.startExperience()
      return
    }
    if (isConfirmKey && ctx.hasSelectedPhoto) {
      ctx.closePhoto()
      return
    }
    if (isConfirmKey && ctx.highlightedPhotoId && !ctx.hasSelectedPhoto && ctx.isPhase1 && !ctx.showPhase1Overlay && !ctx.isEditorEnabled) {
      ctx.selectPhoto(ctx.highlightedPhotoId)
      return
    }
    if (isConfirmKey && ctx.isPhase1 && ctx.nearPortal && !ctx.showPhase1Overlay && !ctx.hasSelectedPhoto && !ctx.isEditorEnabled) {
      ctx.startWormholeToPhase2()
    }
    if (isConfirmKey && ctx.isPhase2 && ctx.nearPortal && !ctx.showPhase2Overlay && !ctx.isEditorEnabled) {
      ctx.startWormholeToLibrary()
    }
    if (isConfirmKey && ctx.phase === 'exploring' && ctx.nearPortal && ctx.libraryPortalUnlocked && !ctx.isEditorEnabled) {
      ctx.startWormholeToCityIntro()
    }

    if (event.key === 'Escape' && ctx.hasSelectedPhoto) {
      ctx.closePhoto()
    }
    if (event.key === 'Escape' && ctx.isEditorEnabled) {
      ctx.closeEditor()
    }
  }

  /**
   * Toggles browser pointer lock directly, mirroring gameplay's manual lock control.
   * Disabled while the editor is open or an overlay/idle screen is covering the canvas.
   * @param ctx - Context snapshot
   */
  private togglePointerLock(ctx: HotkeyContext): void {
    if (ctx.isEditorEnabled || ctx.showPhase1Overlay || ctx.showPhase2Overlay || ctx.phase === 'idle' || ctx.phase === 'wormhole' || (ctx.isCityIntro && !ctx.cityFreeRoam)) return
    if (document.pointerLockElement) document.exitPointerLock()
    else document.body.requestPointerLock?.()
  }
}
