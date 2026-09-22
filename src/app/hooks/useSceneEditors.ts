/**
 * Owns the three per-scene position-editor instances and resolves which one
 * is active for the current game phase.
 * @module app/hooks/useSceneEditors
 */

import { useEditor } from '@/features/editor/hooks/useEditor'
import { initialPhase1Entities, initialLibraryEntities, initialPhase2Entities } from '@/features/editor/config/editableEntities'
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
  /** Library editor, needed directly by `LibraryScene` during `idle`/`exploring`/`wormhole`. */
  libraryEditor: SceneEditor
  /** Phase 1 editor, needed directly by `Phase1Scene`. */
  phase1Editor: SceneEditor
  /** Phase 2 editor, needed directly by `Phase2Scene`. */
  phase2Editor: SceneEditor
}

/**
 * @param phase - Current game phase
 * @returns The three scene editors plus the one active for `phase`
 */
export function useSceneEditors(phase: GamePhase): SceneEditors {
  const libraryEditor = useEditor(initialLibraryEntities)
  const phase1Editor = useEditor(initialPhase1Entities)
  const phase2Editor = useEditor(initialPhase2Entities)

  const currentScene = phaseSceneRegistry.resolveScene(phase)
  const currentEditor = currentScene === 'library' ? libraryEditor : currentScene === 'phase1' ? phase1Editor : phase2Editor

  return { currentScene, currentEditor, libraryEditor, phase1Editor, phase2Editor }
}
