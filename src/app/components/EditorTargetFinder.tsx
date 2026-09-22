/**
 * Resolves the editor's current selection to its live `THREE.Object3D` in the scene.
 * @module app/components/EditorTargetFinder
 */

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Props for {@link EditorTargetFinder}.
 */
interface EditorTargetFinderProps {
  /** Id of the entity currently selected in the editor. */
  selectedId: string | null
  /** Called with the resolved object, or null when nothing is selected. */
  onFound: (o: THREE.Object3D | null) => void
}

/**
 * @param props - Finder props
 * @returns Null (side-effect only)
 */
export function EditorTargetFinder({ selectedId, onFound }: EditorTargetFinderProps) {
  const { scene } = useThree()
  useEffect(() => {
    if (!selectedId) {
      onFound(null)
      return
    }
    const obj = scene.getObjectByName(selectedId)
    onFound(obj as THREE.Object3D | null)
  }, [selectedId, scene, onFound])
  return null
}
