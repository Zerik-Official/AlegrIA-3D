/**
 * RIWI's Barranquilla headquarters — the cream two-storey building with
 * glass-block windows and the `</Riwi>` sign — standing on the side street
 * in front of the aduana.
 * @module features/cityIntro/renderers/RiwiBarranquillaRenderer
 */

import { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import type * as THREE from 'three'
import { modelRegistry } from '@/shared/config/models'
import type { EntityRendererProps } from '@/engine/types'

/**
 * Nodes the Blender script adds as its own staging — a sidewalk, curb, street
 * and ground slab around the building — hidden here since the city lays its
 * own streets (see `CityStreets`).
 */
const STAGING_NODES = new Set(['Anden', 'Bordillo', 'Calle', 'Base_tecnica'])

/**
 * The model faces its local `+Z` (entrance, steps and sign on that side), so
 * the entity's `rotationY` turns its door towards the street.
 * @returns Building
 */
function RiwiBarranquilla() {
  const { scene } = useGLTF(modelRegistry['cityIntro/riwi-barranquilla'].path) as unknown as { scene: THREE.Group }
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((obj) => {
      if (STAGING_NODES.has(obj.name)) obj.visible = false
      const mesh = obj as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return c
  }, [scene])
  return <primitive object={cloned} />
}

/**
 * @param _props - Entity props (placement is applied by `PhaseEngine`)
 * @returns Renderer element
 */
export function RiwiBarranquillaRenderer(_props: EntityRendererProps) {
  return (
    <Suspense fallback={null}>
      <RiwiBarranquilla />
    </Suspense>
  )
}
