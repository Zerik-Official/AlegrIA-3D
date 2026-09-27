/**
 * Persists the editor camera across accidental closes.
 * On mount it restores the camera position and orbit target stored in the
 * scene draft; on unmount (Escape, X, F2) it snapshots them back, so
 * reopening the editor resumes exactly where it was left.
 * @module features/editor/components/EditorCameraSession
 */

import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { loadEditorDraft, saveDraftCamera } from '@/features/editor/state/editorDrafts'
import type { SceneId } from '@/engine/config/entityCatalog'

/**
 * Props for {@link EditorCameraSession}.
 */
interface EditorCameraSessionProps {
  /** Scene whose draft holds the camera snapshot. */
  scene: SceneId
  /** Live orbit controls instance, shared by the fly controls and the gizmo. */
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>
}

/**
 * @param props - Scene and controls refs
 * @returns Null (side-effect only)
 */
export function EditorCameraSession({ scene, controlsRef }: EditorCameraSessionProps) {
  const { camera } = useThree()

  useLayoutEffect(() => {
    const controls = controlsRef.current
    const snapshot = loadEditorDraft(scene)?.camera
    if (snapshot) {
      camera.position.set(snapshot.position[0], snapshot.position[1], snapshot.position[2])
      controls?.target.set(snapshot.target[0], snapshot.target[1], snapshot.target[2])
      controls?.update()
    }
    return () => {
      const target = controls?.target
      saveDraftCamera(scene, {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: target ? [target.x, target.y, target.z] : [camera.position.x, 0, camera.position.z],
      })
    }
  }, [scene, camera, controlsRef])

  return null
}