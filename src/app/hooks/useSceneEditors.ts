/**
 * Owns the four per-scene position-editor instances and resolves which one
 * is active for the current game phase.
 * @module app/hooks/useSceneEditors
 */

import { useEditor } from '@/features/editor/hooks/useEditor'
import { initialCityIntroEntities, initialPhase1Entities, initialLibraryEntities, initialPhase2Entities } from '@/features/editor/config/editableEntities'
import { phaseSceneRegistry } from '@/app/engine/PhaseSceneRegistry'
import type { SceneId } from '@/engine/config/entityCatalog'
import type { GamePhase } from '@/shared/types'

/** Editor instance shape, inferred from {@link useEditor}'s return type. */
export type SceneEditor = ReturnType<typeof useEditor>

/** Public state exposed by {@link useSceneEditors}. */
export interface SceneEditors {
  /** Scene the current phase renders. */
  currentScene: SceneId
  /** Editor instance for the current scene. */
  currentEditor: SceneEditor
  /** City intro editor, needed directly by `CityIntroScene`. */
  cityIntroEditor: SceneEditor
  /** Library editor, needed directly by `LibraryScene` during `idle`/`exploring`/`wormhole`. */
  libraryEditor: SceneEditor
  /** Phase 1 editor, needed directly by `Phase1Scene`. */
  phase1Editor: SceneEditor
  /** Phase 2 editor, needed directly by `Phase2Scene`. */
  phase2Editor: SceneEditor
}

/**
 * @param phase - Current game phase
 * @returns The four scene editors plus the one active for `phase`
 */
export function useSceneEditors(phase: GamePhase): SceneEditors {
  const cityIntroEditor = useEditor(initialCityIntroEntities)
  const libraryEditor = useEditor(initialLibraryEntities)
  const phase1Editor = useEditor(initialPhase1Entities)
  const phase2Editor = useEditor(initialPhase2Entities)

  const currentScene = phaseSceneRegistry.resolveScene(phase)
  const currentEditor =
    currentScene === 'cityIntro' ? cityIntroEditor : currentScene === 'library' ? libraryEditor : currentScene === 'phase1' ? phase1Editor : phase2Editor

  return { currentScene, currentEditor, cityIntroEditor, libraryEditor, phase1Editor, phase2Editor }
}
