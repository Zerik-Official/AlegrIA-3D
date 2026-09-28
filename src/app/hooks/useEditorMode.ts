/**
 * Owns the debug position editor's on/off state and the scene object its
 * gizmo is attached to.
 * @module app/hooks/useEditorMode
 */

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import type * as THREE from 'three'
import { isDebugEnabled } from '@/shared/config/debug'
import { setCollisionDebugVisible } from '@/features/editor/state/collisionDebug'
import type { SpawnResolver } from '@/features/editor/components/EditorSpawnProbe'

/** Public state and actions exposed by {@link useEditorMode}. */
export interface EditorMode {
  /** Whether the editor is open — always `false` outside debug builds. */
  isEditorEnabled: boolean
  /** Opens/closes the editor (debug builds only). */
  toggleEditor: () => void
  /** Closes the editor. */
  closeEditor: () => void
  /** Scene object of the selected entity, which the gizmo drives. */
  editorTarget: THREE.Object3D | null
  /** Updates {@link editorTarget}. */
  setEditorTarget: (target: THREE.Object3D | null) => void
  /** Orbit controls instance, shared by the fly controls and the gizmo. */
  orbitControlsRef: MutableRefObject<any>
  /** Resolves where the crosshair would spawn a new element, filled in by the in-canvas probe while the editor is open. */
  spawnResolverRef: MutableRefObject<SpawnResolver | null>
}

/**
 * @returns Editor state and actions
 */
export function useEditorMode(): EditorMode {
  const [isEditorEnabledRaw, setIsEditorEnabledRaw] = useState(false)
  const isEditorEnabled = isDebugEnabled && isEditorEnabledRaw
  const [editorTarget, setEditorTarget] = useState<THREE.Object3D | null>(null)
  const orbitControlsRef = useRef<any>(null)
  const spawnResolverRef = useRef<SpawnResolver | null>(null)

  const toggleEditor = useCallback(() => {
    if (!isDebugEnabled) return
    setIsEditorEnabledRaw((v) => !v)
  }, [])
  const closeEditor = useCallback(() => setIsEditorEnabledRaw(false), [])

  useEffect(() => {
    if (!isEditorEnabled) setCollisionDebugVisible(false)
  }, [isEditorEnabled])

  return { isEditorEnabled, toggleEditor, closeEditor, editorTarget, setEditorTarget, orbitControlsRef, spawnResolverRef }
}
