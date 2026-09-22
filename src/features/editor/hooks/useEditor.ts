import { useCallback, useState } from 'react'
import type { EditableEntity } from '@/features/editor/config/editableEntities'

/**
 * Hook for editor selection and entity updates.
 *
 * @param initial - Initial entity list
 * @returns Editor state and helpers
 */
export function useEditor(initial: EditableEntity[]) {
  const [entities, setEntities] = useState<EditableEntity[]>(initial)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'translate' | 'rotate' | 'scale'>('translate')

  const selected = entities.find((e) => e.id === selectedId) ?? null

  const updateEntity = useCallback((id: string, patch: Partial<EditableEntity>) => {
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }, [])

  const addEntity = useCallback((entity: EditableEntity) => {
    setEntities((prev) => [...prev, entity])
    setSelectedId(entity.id)
  }, [])

  const removeEntity = useCallback((id: string) => {
    setEntities((prev) => prev.filter((e) => e.id !== id))
    setSelectedId((c) => (c === id ? null : c))
  }, [])

  const exportJson = useCallback(() => {
    return JSON.stringify(entities, null, 2)
  }, [entities])

  return {
    entities,
    selectedId,
    selected,
    mode,
    setSelectedId,
    setMode,
    updateEntity,
    addEntity,
    removeEntity,
    exportJson,
    setEntities,
  }
}