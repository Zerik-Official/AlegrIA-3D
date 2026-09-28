/**
 * The debug position editor's in-canvas tools: orbit and fly controls,
 * click-to-select, the transform gizmo on the selected entity, the spawn
 * probe behind the crosshair and the model colliders' debug view.
 * @module app/components/EditorRig
 */

import { memo, useEffect, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { EditorGizmo } from '@/features/editor/components/EditorGizmo'
import { EditorFlyControls } from '@/features/editor/components/EditorFlyControls'
import { EditorSpawnProbe } from '@/features/editor/components/EditorSpawnProbe'
import { EditorCameraSession } from '@/features/editor/components/EditorCameraSession'
import { CollisionDebugLayer } from '@/features/editor/components/CollisionDebugLayer'
import { ParadeLoopGuide } from '@/features/editor/components/ParadeLoopGuide'
import { EditorTargetFinder } from '@/app/components/EditorTargetFinder'
import { EditorSelectionPicker } from '@/app/components/EditorSelectionPicker'
import { packEntityScale } from '@/engine/types'
import type { Experience } from '@/app/hooks/useExperience'

/**
 * Props for {@link EditorRig}.
 */
interface EditorRigProps {
  /** Composed experience state. */
  experience: Experience
}

/**
 * Drops near-zero tilt angles so untouched entities keep no `rotationX`/`rotationZ` keys in exports.
 * @param value - Angle in radians
 * @returns The angle, or `undefined` when negligible
 */
function cleanAngle(value: number): number | undefined {
  return Math.abs(value) < 1e-4 ? undefined : value
}

/**
 * @param props - Experience state
 * @returns Editor tools; mounted only while the editor is open (see `App`)
 */
export const EditorRig = memo(function EditorRig({ experience }: EditorRigProps) {
  const { orbitControlsRef, spawnResolverRef, editorTarget, setEditorTarget } = experience.editor
  const current = experience.editors.currentEditor
  const currentScene = experience.editors.currentScene

  const targetRef = useRef(editorTarget)
  const editorRef = useRef(current)

  useEffect(() => {
    targetRef.current = editorTarget
    editorRef.current = current
  })

  useEffect(() => {
    return () => {
      const target = targetRef.current
      const editor = editorRef.current
      if (!target || !editor.selectedId) return
      editor.updateEntity(editor.selectedId, {
        position: [target.position.x, target.position.y, target.position.z],
        rotationX: cleanAngle(target.rotation.x),
        rotationY: target.rotation.y,
        rotationZ: cleanAngle(target.rotation.z),
        scale: packEntityScale(target.scale.x, target.scale.y, target.scale.z),
      })
    }
  }, [])

  return (
    <>
      <OrbitControls ref={orbitControlsRef} enableDamping={false} />
      <EditorFlyControls controlsRef={orbitControlsRef} enabled />
      <EditorCameraSession scene={currentScene} controlsRef={orbitControlsRef} />
      <EditorSelectionPicker enabled entities={current.entities} onSelect={current.setSelectedId} />
      <EditorTargetFinder selectedId={current.selectedId} onFound={setEditorTarget} />
      <EditorSpawnProbe entities={current.entities} resolverRef={spawnResolverRef} />
      <CollisionDebugLayer />
      <ParadeLoopGuide scene={currentScene} />
      <EditorGizmo
        target={editorTarget}
        mode={current.mode}
        enabled={!!editorTarget}
        orbitControlsRef={orbitControlsRef}
        onChange={(pos, rotation, scale) => {
          if (!current.selectedId) return
          current.updateEntity(current.selectedId, {
            position: pos,
            rotationX: cleanAngle(rotation[0]),
            rotationY: rotation[1],
            rotationZ: cleanAngle(rotation[2]),
            scale: packEntityScale(scale[0], scale[1], scale[2]),
          })
        }}
      />
    </>
  )
})
