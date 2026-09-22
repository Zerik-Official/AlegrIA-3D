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

class PhaseSceneRegistry {
  private readonly visuals: Record<SceneId, PhaseVisual> = {
    library: { sceneId: 'library', fog: { color: '#0a0806', near: 9, far: 26 }, background: '#08060a' },
    phase1: { sceneId: 'phase1', fog: { color: '#8a6a3a', near: 14, far: 38 }, background: '#6b4a2a' },
    phase2: { sceneId: 'phase2', fog: { color: '#bfa86a', near: 12, far: 32 }, background: '#c9b896' },
  }

  /**
   * Maps a game phase to the scene it renders.
   * `idle`, `exploring` and `wormhole` all render the library scene underneath;
   * `museum` is the deprecated alias for `phase1`.
   *
   * @param phase - Current game phase
   * @returns Scene id
   */
  resolveScene(phase: GamePhase): SceneId {
    if (phase === 'phase1' || phase === 'museum') return 'phase1'
    if (phase === 'phase2') return 'phase2'
    return 'library'
  }

  /**
   * Resolves the fog/background pair for a game phase.
   * @param phase - Current game phase
   * @returns Visual configuration for that phase's scene
   */
  resolveVisual(phase: GamePhase): PhaseVisual {
    return this.visuals[this.resolveScene(phase)]
  }
}

/** Shared singleton — visual/scene resolution is stateless and phase-only. */
export const phaseSceneRegistry = new PhaseSceneRegistry()
