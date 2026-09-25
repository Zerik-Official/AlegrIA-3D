/**
 * Resolves a {@link GamePhase} to the scene it renders and the visual settings
 * (fog, background) that go with it. Centralizes the fog/background/scene ternary
 * chains that used to live inline in `App.tsx`.
 * @module app/engine/PhaseSceneRegistry
 */

import type { GamePhase } from '@/shared/types'
import type { SceneId } from '@/engine/config/entityCatalog'

/** Fog parameters for a `<fog attach="fog">` element. */
export interface PhaseFog {
  color: string
  near: number
  far: number
}

/** Visual configuration for one scene. */
export interface PhaseVisual {
  sceneId: SceneId
  fog: PhaseFog
  background: string
}

/**
 * A story checkpoint selectable from the editor's quick-jump control. Each
 * one carries what the story state must look like on arrival — notably how
 * many times the library has already been visited, which decides what the
 * book does there and where the next portal leads — so jumping never breaks
 * the story's continuity.
 */
export interface PhaseJumpTarget {
  /** Stable id. */
  id: string
  /** Destination game phase. */
  phase: GamePhase
  /** Scene rendered for that phase. */
  sceneId: SceneId
  /** Human label shown in the editor UI. */
  label: string
  /** Library visits already behind the player at this point of the story. */
  priorLibraryVisits: number
}

class PhaseSceneRegistry {
  private readonly visuals: Record<SceneId, PhaseVisual> = {
    cityIntro: { sceneId: 'cityIntro', fog: { color: '#8a3a52', near: 34, far: 230 }, background: '#2b0f4a' },
    library: { sceneId: 'library', fog: { color: '#0a0806', near: 9, far: 26 }, background: '#08060a' },
    phase1: { sceneId: 'phase1', fog: { color: '#8a6a3a', near: 24, far: 160 }, background: '#6b4a2a' },
    phase2: { sceneId: 'phase2', fog: { color: '#a9d8f5', near: 24, far: 84 }, background: '#8ec9f0' },
    credits: { sceneId: 'credits', fog: { color: '#05040a', near: 14, far: 40 }, background: '#050308' },
  }

  /** The library once the returned book has restored it: warm, lit and far clearer than the abandoned hall's gloom. */
  private readonly restoredLibraryVisual: PhaseVisual = {
    sceneId: 'library',
    fog: { color: '#3a2616', near: 16, far: 46 },
    background: '#1a0f08',
  }

  /** Inside the time tunnel, once a portal has been crossed and the scene left behind is no longer drawn. */
  private readonly tunnelVisual: PhaseVisual = {
    sceneId: 'library',
    fog: { color: '#0a0806', near: 9, far: 26 },
    background: '#08060a',
  }

  /** Jump targets exposed to the editor — single source for the quick phase-switcher. */
  private readonly jumpTargets: PhaseJumpTarget[] = [
    { id: 'start', phase: 'idle', sceneId: 'library', label: 'Inicio — Pantalla inicial', priorLibraryVisits: 0 },
    { id: 'library-first', phase: 'exploring', sceneId: 'library', label: 'Biblioteca — Primera visita', priorLibraryVisits: 0 },
    { id: 'phase1', phase: 'phase1', sceneId: 'phase1', label: 'Fase 1 — Barrio Abajo', priorLibraryVisits: 1 },
    { id: 'phase2', phase: 'phase2', sceneId: 'phase2', label: 'Fase 2 — Época Dorada', priorLibraryVisits: 1 },
    { id: 'library-return', phase: 'exploring', sceneId: 'library', label: 'Biblioteca — Regreso del libro', priorLibraryVisits: 1 },
    { id: 'future', phase: 'cityIntro', sceneId: 'cityIntro', label: 'Futuro Abajero 2050 — Final', priorLibraryVisits: 2 },
    { id: 'credits', phase: 'credits', sceneId: 'credits', label: 'Créditos — Equipo', priorLibraryVisits: 2 },
  ]

  /**
   * Maps a game phase to the scene it renders.
   * `idle` resolves to the library, which is mounted (and so preloaded)
   * behind the start screen since that's where the experience opens;
   * `wormhole` falls back to the library, but callers should resolve the
   * crossing's source phase instead (see `usePhaseFlow`'s `scenePhase`);
   * `museum` is the deprecated alias for `phase1`.
   *
   * @param phase - Current game phase
   * @returns Scene id
   */
  resolveScene(phase: GamePhase): SceneId {
    if (phase === 'cityIntro') return 'cityIntro'
    if (phase === 'phase1' || phase === 'museum') return 'phase1'
    if (phase === 'phase2') return 'phase2'
    if (phase === 'credits') return 'credits'
    return 'library'
  }

  /**
   * Resolves the fog/background pair for a game phase.
   * @param phase - Current game phase
   * @param libraryRestored - Whether the library has been restored by the returned book, which lifts its gloom
   * @returns Visual configuration for that phase's scene
   */
  resolveVisual(phase: GamePhase, libraryRestored = false): PhaseVisual {
    const sceneId = this.resolveScene(phase)
    if (sceneId === 'library' && libraryRestored) return this.restoredLibraryVisual
    return this.visuals[sceneId]
  }

  /**
   * The fog/background pair inside the time tunnel, once a portal crossing has
   * left its scene behind.
   * @returns Tunnel visual configuration
   */
  resolveTunnelVisual(): PhaseVisual {
    return this.tunnelVisual
  }

  /**
   * @param id - Checkpoint id
   * @returns That checkpoint, if it exists
   */
  findJumpTarget(id: string): PhaseJumpTarget | undefined {
    return this.jumpTargets.find((t) => t.id === id)
  }

  /**
   * The checkpoint describing where the story currently stands.
   * @param phase - Phase whose scene is on screen
   * @param libraryVisitCount - Library visits so far, including the current one
   * @returns Checkpoint id
   */
  checkpointFor(phase: GamePhase, libraryVisitCount: number): string {
    if (phase === 'idle') return 'start'
    if (phase === 'exploring') return libraryVisitCount >= 2 ? 'library-return' : 'library-first'
    if (phase === 'phase1' || phase === 'museum') return 'phase1'
    if (phase === 'phase2') return 'phase2'
    if (phase === 'credits') return 'credits'
    return 'future'
  }

  /**
   * Returns the editor's quick phase-jump targets.
   * @returns Jump targets in display order
   */
  listJumpTargets(): PhaseJumpTarget[] {
    return this.jumpTargets
  }
}

/** Shared singleton — visual/scene resolution is stateless and phase-only. */
export const phaseSceneRegistry = new PhaseSceneRegistry()
