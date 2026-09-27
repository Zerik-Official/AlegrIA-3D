import { memo, useRef } from 'react'
import { TransformControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Props for {@link EditorGizmo}.
 */
interface EditorGizmoProps {
  /** Target object to attach gizmo. */
  target: THREE.Object3D | null
  /** Gizmo mode. */
  mode: 'translate' | 'rotate' | 'scale'
  /** Whether gizmo is enabled. */
  enabled: boolean
  /** Live `OrbitControls` instance — disabled while dragging the gizmo so rotating/scaling doesn't also orbit the camera. */
  orbitControlsRef?: React.RefObject<{ enabled: boolean } | null>
  /** Called when transform ends, with position, full XYZ rotation and uniform scale. */
  onChange?: (pos: [number, number, number], rotation: [number, number, number], scale: number) => void
}

/**
 * Drei TransformControls wrapper for the editor.
 * Disables orbit while dragging and reports final transform.
 *
 * @param props - Gizmo state
 * @returns Gizmo element
 */
export const EditorGizmo = memo(function EditorGizmo({ target, mode, enabled, orbitControlsRef, onChange }: EditorGizmoProps) {
  const controlsRef = useRef<any>(null)

  if (!enabled || !target) return null

  return (
    <TransformControls
      ref={controlsRef}
      object={target}
      mode={mode}
      onMouseDown={() => {
        if (orbitControlsRef?.current) orbitControlsRef.current.enabled = false
      }}
      onMouseUp={() => {
        if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true
        if (!target || !onChange) return
        const p: [number, number, number] = [target.position.x, target.position.y, target.position.z]
        const r: [number, number, number] = [target.rotation.x, target.rotation.y, target.rotation.z]
        const s = target.scale.x
        onChange(p, r, s)
      }}
    />
  )
})
