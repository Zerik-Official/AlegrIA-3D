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
 * @returns Editor tools; mounted only while the editor is open (see `App`)
 */
export const EditorRig = memo(function EditorRig({ experience }: EditorRigProps) {
  const { orbitControlsRef, spawnResolverRef, editorTarget, setEditorTarget } = experience.editor
  const current = experience.editors.currentEditor

  return (
    <>
      <OrbitControls ref={orbitControlsRef} enableDamping={false} />
      <EditorFlyControls controlsRef={orbitControlsRef} enabled />
      <EditorSelectionPicker enabled entities={current.entities} onSelect={current.setSelectedId} />
      <EditorTargetFinder selectedId={current.selectedId} onFound={setEditorTarget} />
      <EditorSpawnProbe entities={current.entities} resolverRef={spawnResolverRef} />
      <CollisionDebugLayer />
      <EditorGizmo
        target={editorTarget}
        mode={current.mode}
        enabled={!!editorTarget}
        orbitControlsRef={orbitControlsRef}
        onChange={(pos, rotY, scale) => {
          if (!current.selectedId) return
          current.updateEntity(current.selectedId, { position: pos, rotationY: rotY, scale })
        }}
      />
    </>
  )
})
