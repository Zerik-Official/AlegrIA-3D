import { useCallback, useEffect, useState } from 'react'
import type { EditableEntity } from '@/features/editor/config/editableEntities'
import { clearEditorDraft, loadEditorDraft, saveEditorDraft, type DraftSummary, type EditorDraft } from '@/features/editor/state/editorDrafts'

/**
 * Hook for editor selection and entity updates.
 *
 * @param initial - Initial entity list
 * @param draftScene - Scene id used as draft storage key; omit to disable drafts
 * @returns Editor state and helpers
 */
export function useEditor(initial: EditableEntity[], draftScene?: string) {
  const [boot] = useState(() => readBoot(draftScene))
  const [entities, setEntities] = useState<EditableEntity[]>(() => boot?.entities ?? initial)
  const [selectedId, setSelectedId] = useState<string | null>(() => boot?.selectedId ?? null)
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>(() => boot?.mode ?? 'translate')
  const [restoredDraft, setRestoredDraft] = useState<DraftSummary | null>(() => toSummary(boot, initial.length))
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const selected = entities.find((e) => e.id === selectedId) ?? null

  useEffect(() => {
    if (!draftScene) return
    saveEditorDraft(draftScene, { entities, selectedId, mode, baseCount: initial.length })
  }, [draftScene, entities, selectedId, mode, initial.length])

  const stamp = useCallback(() => setLastSavedAt(Date.now()), [])

  const updateEntity = useCallback(
    (id: string, patch: Partial<EditableEntity>) => {
      setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
      stamp()
    },
    [stamp],
  )

  const addEntity = useCallback(
    (entity: EditableEntity) => {
      setEntities((prev) => [...prev, entity])
      setSelectedId(entity.id)
      stamp()
    },
    [stamp],
  )

  const removeEntity = useCallback(
    (id: string) => {
      setEntities((prev) => prev.filter((e) => e.id !== id))
      setSelectedId((c) => (c === id ? null : c))
      stamp()
    },
    [stamp],
  )

  const duplicateSelected = useCallback(() => {
    const source = entities.find((e) => e.id === selectedId) ?? null
    if (!source) return
    const taken = new Set(entities.map((e) => e.id))
    let suffix = 1
    let id = `${source.id}-copy`
    while (taken.has(id)) {
      suffix += 1
      id = `${source.id}-copy-${suffix}`
    }
    const clone: EditableEntity = structuredClone(source)
    clone.id = id
    clone.position = [source.position[0] + 1.5, source.position[1], source.position[2] + 1.5]
    setEntities((prev) => [...prev, clone])
    setSelectedId(id)
    stamp()
  }, [entities, selectedId, stamp])

  const selectEntity = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      stamp()
    },
    [stamp],
  )

  const changeMode = useCallback(
    (next: 'translate' | 'rotate' | 'scale') => {
      setMode(next)
      stamp()
    },
    [stamp],
  )

  const replaceEntities = useCallback(
    (next: EditableEntity[]) => {
      setEntities(next)
      stamp()
    },
    [stamp],
  )

  const exportJson = useCallback(() => {
    return JSON.stringify(entities, null, 2)
  }, [entities])

  const discardDraft = useCallback(() => {
    if (draftScene) clearEditorDraft(draftScene)
    replaceEntities(initial)
    selectEntity(null)
    setRestoredDraft(null)
  }, [draftScene, initial, replaceEntities, selectEntity])

  return {
    entities,
    selectedId,
    selected,
    mode,
    setSelectedId: selectEntity,
    setMode: changeMode,
    updateEntity,
    addEntity,
    removeEntity,
    duplicateSelected,
    exportJson,
    setEntities: replaceEntities,
    restoredDraft,
    discardDraft,
    lastSavedAt,
  }
}

/**
 * Reads a scene draft once for state initialization.
 * @param draftScene - Scene id used as draft storage key
 * @returns Stored draft or `null`
 */
function readBoot(draftScene: string | undefined): EditorDraft | null {
  if (!draftScene) return null
  return loadEditorDraft(draftScene)
}

/**
 * Summarizes a stored draft for the restore banner.
 * @param draft - Stored draft or `null`
 * @param bundleCount - Entity count of the bundled JSON being replaced
 * @returns Banner summary or `null` when there is no draft
 */
function toSummary(draft: EditorDraft | null, bundleCount: number): DraftSummary | null {
  if (!draft) return null
  return { savedAt: draft.savedAt, entityCount: draft.entities.length, baseCount: draft.baseCount, bundleCount }
}
