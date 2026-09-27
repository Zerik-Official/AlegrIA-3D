/**
 * Draft persistence for the position editor.
 * Each scene owns a `localStorage` draft holding its live entities, the
 * selection, the gizmo mode and the last editor camera, so closing the
 * editor by mistake (Escape, the X button, F2) never discards a session:
 * reopening restores entities and camera as they were.
 * @module features/editor/state/editorDrafts
 */

import type { EditableEntity } from '@/engine/types'

/** Storage key prefix for per-scene editor drafts. */
const DRAFT_KEY_PREFIX = 'alegria3d:editor-draft:v1:'

/** Camera snapshot stored inside a draft. */
export interface EditorCameraSnapshot {
  /** Camera world position. */
  position: [number, number, number]
  /** Orbit target the camera looks at. */
  target: [number, number, number]
}

/** Serializable draft of one scene's editor session. */
export interface EditorDraft {
  /** Draft format version. */
  version: 1
  /** When the draft was saved, as epoch milliseconds. */
  savedAt: number
  /** Live entities at save time. */
  entities: EditableEntity[]
  /** Selected entity id at save time. */
  selectedId: string | null
  /** Gizmo mode at save time. */
  mode: 'translate' | 'rotate' | 'scale'
  /** Entity count of the bundled JSON the draft was built on, used to spot stale drafts. */
  baseCount: number
  /** Last editor camera for the scene, when captured inside the canvas. */
  camera?: EditorCameraSnapshot
}

/** Summary shown in the restore banner. */
export interface DraftSummary {
  /** When the draft was saved, as epoch milliseconds. */
  savedAt: number
  /** Entity count stored in the draft. */
  entityCount: number
  /** Entity count of the bundled JSON when the draft was saved. */
  baseCount: number
  /** Entity count of the bundled JSON when the draft was restored. */
  bundleCount: number
}

/**
 * @param scene - Scene the draft belongs to
 * @returns `localStorage` key for that scene's draft
 */
function draftKey(scene: string): string {
  return `${DRAFT_KEY_PREFIX}${scene}`
}

/**
 * Reads a scene draft, returning `null` when missing, unreadable or malformed.
 * @param scene - Scene the draft belongs to
 * @returns Parsed draft or `null`
 */
export function loadEditorDraft(scene: string): EditorDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(scene))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<EditorDraft>
    if (parsed.version !== 1 || !Array.isArray(parsed.entities) || typeof parsed.baseCount !== 'number') return null
    return parsed as EditorDraft
  } catch {
    return null
  }
}

/**
 * Overwrites a scene draft with the given session state.
 * @param scene - Scene the draft belongs to
 * @param snapshot - Session state to persist
 */
export function saveEditorDraft(
  scene: string,
  snapshot: Omit<EditorDraft, 'version' | 'savedAt'> & { camera?: EditorCameraSnapshot },
): void {
  try {
    const draft: EditorDraft = { version: 1, savedAt: Date.now(), ...snapshot }
    localStorage.setItem(draftKey(scene), JSON.stringify(draft))
  } catch {
    return
  }
}

/**
 * Merges a camera snapshot into the existing scene draft, keeping entities untouched.
 * @param scene - Scene the draft belongs to
 * @param camera - Camera snapshot to store
 */
export function saveDraftCamera(scene: string, camera: EditorCameraSnapshot): void {
  const current = loadEditorDraft(scene)
  if (!current) return
  saveEditorDraft(scene, {
    entities: current.entities,
    selectedId: current.selectedId,
    mode: current.mode,
    baseCount: current.baseCount,
    camera,
  })
}

/**
 * Deletes a scene draft.
 * @param scene - Scene the draft belongs to
 */
export function clearEditorDraft(scene: string): void {
  try {
    localStorage.removeItem(draftKey(scene))
  } catch {
    return
  }
}
