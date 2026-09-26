/**
 * Picks editor entities with Alt + Right Click.
 * @module app/components/EditorSelectionPicker
 */

import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { EditableEntity } from '@/engine/types'

/**
 * Props for {@link EditorSelectionPicker}.
 */
interface EditorSelectionPickerProps {
  /** Whether picking is active. */
  enabled: boolean
  /** Entities of the current scene, used to validate hits. */
  entities: EditableEntity[]
  /** Called with the picked entity id. */
  onSelect: (id: string | null) => void
}

/**
 * Raycasts on Alt + Right Click and selects the entity whose `THREE.Object3D.name`
 * matches an entity id. The id is set on the wrapper `group` in `PhaseEngine`,
 * so child meshes are resolved by walking the parent chain.
 * @param props - Picker props
 * @returns Null
 */
export function EditorSelectionPicker({ enabled, entities, onSelect }: EditorSelectionPickerProps) {
  const { camera, scene, gl } = useThree()
  const entityIds = useMemo(() => new Set(entities.map((e) => e.id)), [entities])
  /** Ground tiles, big scene models and walkable areas sit under everything, so they are only picked when nothing else is hit. */
  const backdropIds = useMemo(
    () => new Set(entities.filter((e) => e.type.includes('/floors/') || e.type.includes('/scenes/') || e.type === 'walk-area').map((e) => e.id)),
    [entities],
  )
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  useEffect(() => {
    if (!enabled) return
    const dom = gl.domElement

    /**
     * Prevents the native context menu when Alt is held in the editor.
     * @param event - Mouse event
     */
    const onContextMenu = (event: MouseEvent) => {
      if (event.altKey) event.preventDefault()
    }

    /**
     * Handles Alt + Right Click picking.
     * @param event - Mouse event
     */
    const onPointerDown = (event: MouseEvent) => {
      if (!event.altKey || event.button !== 2) return
      event.preventDefault()
      event.stopPropagation()
      if (typeof (event as MouseEvent & { stopImmediatePropagation?: () => void }).stopImmediatePropagation === 'function') {
        ;(event as MouseEvent & { stopImmediatePropagation: () => void }).stopImmediatePropagation()
      }
      const rect = dom.getBoundingClientRect()
      ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera as THREE.PerspectiveCamera)
      const hits = raycaster.intersectObject(scene, true)
      let fallback: string | null = null
      for (const hit of hits) {
        let cur: THREE.Object3D | null = hit.object
        while (cur) {
          if (cur.name && entityIds.has(cur.name)) {
            if (!backdropIds.has(cur.name)) {
              onSelect(cur.name)
              return
            }
            fallback ??= cur.name
            break
          }
          cur = cur.parent
        }
      }
      if (fallback) onSelect(fallback)
    }

    dom.addEventListener('contextmenu', onContextMenu)
    dom.addEventListener('pointerdown', onPointerDown)
    return () => {
      dom.removeEventListener('contextmenu', onContextMenu)
      dom.removeEventListener('pointerdown', onPointerDown)
    }
  }, [enabled, gl, camera, scene, raycaster, ndc, entityIds, backdropIds, onSelect])

  return null
}
