/**
 * The debug position editor's in-canvas tools: orbit and fly controls,
 * click-to-select, the transform gizmo on the selected entity, the spawn
 * probe behind the crosshair and the model colliders' debug view.
 * @module app/components/EditorRig
 */

import { memo } from 'react'
import { OrbitControls } from '@react-three/drei'
import { EditorGizmo } from '@/features/editor/components/EditorGizmo'
import { EditorFlyControls } from '@/features/editor/components/EditorFlyControls'
import { EditorSpawnProbe } from '@/features/editor/components/EditorSpawnProbe'
import { CollisionDebugLayer } from '@/features/editor/components/CollisionDebugLayer'
import { EditorTargetFinder } from '@/app/components/EditorTargetFinder'
import { EditorSelectionPicker } from '@/app/components/EditorSelectionPicker'
import type { Experience } from '@/app/hooks/useExperience'

/**
 * Props for {@link EditorRig}.
 */
interface EditorRigProps {
  /** Composed experience state. */
  experience: Experience
}

/**
 * @param props - Experience state
 * @returns Editor tools, or `null` while the editor is closed
 */
export const EditorRig = memo(function EditorRig({ experience }: EditorRigProps) {
  const { editor, editors } = experience
  if (!editor.isEditorEnabled) return null
  const current = editors.currentEditor

  return (
    <>
      <OrbitControls ref={editor.orbitControlsRef} enableDamping={false} />
      <EditorFlyControls controlsRef={editor.orbitControlsRef} enabled />
      <EditorSelectionPicker enabled entities={current.entities} onSelect={current.setSelectedId} />
      <EditorTargetFinder selectedId={current.selectedId} onFound={editor.setEditorTarget} />
      <EditorSpawnProbe entities={current.entities} resolverRef={editor.spawnResolverRef} />
      <CollisionDebugLayer />
      <EditorGizmo
        target={editor.editorTarget}
        mode={current.mode}
        enabled={!!editor.editorTarget}
        orbitControlsRef={editor.orbitControlsRef}
        onChange={(pos, rotY, scale) => {
          if (!current.selectedId) return
          current.updateEntity(current.selectedId, { position: pos, rotationY: rotY, scale })
        }}
      />
    </>
  )
})
