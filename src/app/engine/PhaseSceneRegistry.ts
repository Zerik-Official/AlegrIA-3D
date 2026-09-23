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
    cityIntro: { sceneId: 'cityIntro', fog: { color: '#0a0a16', near: 20, far: 240 }, background: '#05050d' },
    library: { sceneId: 'library', fog: { color: '#0a0806', near: 9, far: 26 }, background: '#08060a' },
    phase1: { sceneId: 'phase1', fog: { color: '#8a6a3a', near: 24, far: 160 }, background: '#6b4a2a' },
    phase2: { sceneId: 'phase2', fog: { color: '#a9d8f5', near: 20, far: 62 }, background: '#8ec9f0' },
  }

  /**
   * Maps a game phase to the scene it renders.
   * `idle` resolves to the city intro's visuals (fog/background) since that's
   * the scene about to load; `exploring` and `wormhole` render the library
   * scene underneath; `museum` is the deprecated alias for `phase1`.
   *
   * @param phase - Current game phase
   * @returns Scene id
   */
  resolveScene(phase: GamePhase): SceneId {
    if (phase === 'cityIntro' || phase === 'idle') return 'cityIntro'
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
